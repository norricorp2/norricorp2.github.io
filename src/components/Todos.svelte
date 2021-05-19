<script lang="ts">
  import FilterButton from './FilterButton.svelte'
  import Todo from './Todo.svelte'
  import MoreActions from './MoreActions.svelte'
  import NewTodo from './NewTodo.svelte'
  import TodosStatus from './TodosStatus.svelte'
  import { alert } from '../stores'
  import type { TodoType } from '../types/todo.type'
  import { Filter } from '../types/filter.enum'
  import { onMount } from 'svelte'
  import { authToken } from '../stores'


  /* So with 'export let todos = []', we are telling Svelte that our Todos.svelte component 
  will accept a todos attribute, which when omitted will be initialized to an empty array. */
    export let todos: TodoType[] = []

//    console.log('into Todos.svelte : ', todos)
//    console.log('Todos.svelte with length of : ', todos.length)

//    $: totalTodos = todos.length
//    $: completedTodos = todos.filter(todo => todo.completed).length
    let todosStatus: TodosStatus                   // reference to TodosStatus instance

    let newTodoId: number
//    $: newTodoId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1
/*    $: {
      if (totalTodos === 0) {
        newTodoId = 1;
      } else {
        newTodoId = Math.max(...todos.map(t => t.id)) + 1;
      }
    }
*/
    async function doDelete (todo: TodoType) {
      const res = await fetch('http:///mint20-loopback4:3000/todos/' + todo.id, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $authToken,
          },
      })
      
      if (res.status != 204) {
        const json = await res.json()
        .then(json => {console.log('update todo : ', json)})
        .catch(error => {
            console.error('UpdateTodo fetch problem:', error)
        })
      }

    }


    function removeTodo(todo: TodoType) {
      todos = todos.filter(t => t.id !== todo.id)
      doDelete(todo)
      todosStatus.focus()             // give focus to status heading
      $alert = `Todo '${todo.title}' has been deleted`
    }

//    async function doPost (id: number, name: string) {
    async function doPost (name: string) {
      const res = await fetch('http:///mint20-loopback4:3000/todos/', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $authToken,
          },
          body: JSON.stringify({
//            "id": newTodoId, 
            "title": name, 
            "isComplete": false
        })
      })
      
      if (res.status != 204) {
        const json = await res.json()
        .then(json => {
            console.log('add todo : ', json)
            console.log('with id of : ', json.id)
            newTodoId = json.id
        })
        .catch(error => {
            console.error('AddTodo PUT problem:', error)
        })
      }

    }

    function addTodo(name: string) {
      // doing this can cause problems as the array is mutated
      //todos.push({ id: newTodoId, name: newTodoName, isComplete: false })
      //todos = todos
      // doing this creates a new array
      console.log('2 into Todos.svelte : ', todos)
      doPost(name)
      $alert = `Todo '${name}' has been added`
      // finally update array
      todos = [...todos, { id: newTodoId, title: name, isComplete: false }]
    }

    async function doPut (todo: TodoType) {
      const res = await fetch('http:///mint20-loopback4:3000/todos/' + todo.id, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $authToken,
          },
          body: JSON.stringify({
            "title": todo.title, 
            "isComplete": todo.isComplete
        })
      })
      console.log('update todo status : ', res.status)
      if (res.status != 204) {
        const json = await res.json()
        .then(json => {console.log('update todo : ', json)})
        .catch(error => {
            console.error('UpdateTodo doPut problem:', error)
        })
      }

    }

    function updateTodo(todo: TodoType) {
      const i = todos.findIndex(t => t.id === todo.id)
      if (todos[i].title !== todo.title)            $alert = `todo '${todos[i].title}' has been renamed to '${todo.title}'`
      if (todos[i].isComplete !== todo.isComplete)  $alert = `todo '${todos[i].title}' marked as ${todo.isComplete ? 'completed' : 'active'}`
      todos[i] = { ...todos[i], ...todo }
      console.log('UpdateTodo: about to call doPut with token of : ', $authToken)
      doPut(todo)
      console.log('UpdateTodo: completed doPut')
    }

     let filter: Filter = Filter.ALL
      const filterTodos = (filter: Filter, todos: TodoType[]) =>
        filter === Filter.ACTIVE ? todos.filter((t: TodoType) => !t.isComplete) :
        filter === Filter.COMPLETED ? todos.filter((t: TodoType) => t.isComplete) :
        todos
        $: {
          if (filter === Filter.ALL)               $alert = 'Browsing all todos'
          else if (filter === Filter.ACTIVE)       $alert = 'Browsing active todos'
          else if (filter === Filter.COMPLETED)    $alert = 'Browsing completed todos'
        } 

    // my functions
    /*
    function removeCompletedTodos() {
      todos = todos.filter(t => t.isComplete == false)
    }

    function checkAll() {
      todos.forEach(function(item, index) {
        item.isComplete = true
//        console.log(item.name, item.isComplete, index)
      })
      todos = [...todos]
    }
    */

    async function doCheckAllTodos (completed: boolean) {
      let where = JSON.stringify({
        "isComplete": !completed
      })
      const res = await fetch('http:///mint20-loopback4:3000/todos?where=' + where, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $authToken,
          },
          body: JSON.stringify({
            "isComplete": completed
        })
      })
      console.log('doCheckAllTodos todo status : ', res.status)
      const json = await res.json()
      .then(json => {console.log('doCheckAllTodos count : ', json.count)})
      .catch(error => {
          if (res.status != 200) {
            console.error('doCheckAllTodos HTTP problem:', error)
          } 
      })
    }

    const checkAllTodos = (completed: boolean) => {
      todos.forEach(t => t.isComplete = completed)
      todos = [...todos]
      doCheckAllTodos(completed)
      $alert = `${completed ? 'Checked' : 'Unchecked'} ${todos.length} todos`
    }


    async function doDeleteAllCompletedTodos () {
      let where = JSON.stringify({
        "isComplete": true
      })
      const res = await fetch('http:///mint20-loopback4:3000/todos?where=' + where, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $authToken,
          },
      })
      console.log('doDeleteAllCompletedTodos todo status : ', res.status)
      const json = await res.json()
      .then(json => {console.log('doDeleteAllCompletedTodos count : ', json.count)})
      .catch(error => {
        if (res.status != 200) {
          console.error('doDeleteAllCompletedTodos HTTP problem:', error)
        }
      })      
    }


    const removeCompletedTodos = () => {
      $alert = `Removed ${todos.filter(t => t.isComplete).length} todos`
      todos = todos.filter(t => !t.isComplete)
      doDeleteAllCompletedTodos()
    }


    async function getAllTodos () {
      console.log('auth token is : ', $authToken)
      const res = await fetch('http:///mint20-loopback4:3000/todos', {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + $authToken,
      },
      })

      const json = await res.json()
      .catch(error => {
            console.error('getAllTodos fetch problem:', error)
      })
      
      console.log('todolist : ', json)
      json.forEach(element  => {
        let t: TodoType = { id: 0, title: '0', isComplete: true }
        t.id = element.id
        t.title = element.title
        if (element.isComplete === undefined) {
          t.isComplete = false
        }
        else {
          t.isComplete = element.isComplete
        }
        // this updates the DOM
        todos = [...todos,t]
      })
  //    console.log('completed mount : ', todos)
    }

    onMount( () => {
     getAllTodos()
  })  


</script>

<h1>Svelte To-Do list</h1>

<!-- Todos.svelte -->
<div class="todoapp stack-large">

    <!-- NewTodo -->
    <NewTodo autofocus on:addTodo={e => addTodo(e.detail)} />
  
    <!-- Filter -->
    <FilterButton bind:filter={filter}  />
  
    <!-- TodosStatus -->
    <TodosStatus bind:this={todosStatus} {todos} />
  
    <!-- Todos -->
    <ul role="list" class="todo-list stack-large" aria-labelledby="list-heading">
      {#each filterTodos(filter, todos) as todo (todo.id)}
        <li class="todo">
          <Todo todo={todo} on:update={e => updateTodo(e.detail)} on:remove={e => removeTodo(e.detail)} />
        </li>
      {:else}
        <li>Nothing to do here!</li>
      {/each}
    </ul>
  
    <hr />
  
    <!-- MoreActions -->
    <MoreActions {todos}
      on:checkAll={e => checkAllTodos(e.detail)}
      on:removeCompleted={removeCompletedTodos}
    />
  
  </div>
