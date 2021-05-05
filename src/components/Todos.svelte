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


  /* So with 'export let todos = []', we are telling Svelte that our Todos.svelte component 
  will accept a todos attribute, which when omitted will be initialized to an empty array. */
    export let todos: TodoType[] = []
    let newTodoName = ''

//    console.log('into Todos.svelte : ', todos)
//    console.log('Todos.svelte with length of : ', todos.length)

//    $: totalTodos = todos.length
//    $: completedTodos = todos.filter(todo => todo.completed).length
    let todosStatus: TodosStatus                   // reference to TodosStatus instance

    let newTodoId: number
    $: newTodoId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1
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
/*       async () => {
        const response = await fetch("http:///mint20-loopback4:3000/todos/" + todo.id, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const parsed = await response.json()
        .catch(error => {
            console.error('RemoveTodo fetch problem:', error)
          })
      } */
      todosStatus.focus()             // give focus to status heading
      $alert = `Todo '${todo.title}' has been deleted`
    }

    async function doPost (id: number, name: string) {
      const res = await fetch('http:///mint20-loopback4:3000/todos/', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "id": newTodoId, 
            "title": name, 
            "isComplete": false
        })
      })
      
      if (res.status != 204) {
        const json = await res.json()
        .then(json => {console.log('add todo : ', json)})
        .catch(error => {
            console.error('AddTodo fetch problem:', error)
        })
      }

    }

    function addTodo(name: string) {
      // doing this can cause problems as the array is mutated
      //todos.push({ id: newTodoId, name: newTodoName, isComplete: false })
      //todos = todos
      // doing this creates a new array
      console.log('2 into Todos.svelte : ', todos)
      todos = [...todos, { id: newTodoId, title: name, isComplete: false }]
      doPost(todos.length, name)
/*       async () => {
        const response = await fetch("http:///mint20-loopback4:3000/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "id": newTodoId, "title": name, "isComplete": false }),
        })

        const parsed = await response.json()
        .catch(error => {
            console.error('AddTodo fetch problem:', error)
          })
      } */
      $alert = `Todo '${name}' has been added`
      // finally reset variable
      newTodoName = ''
    }

    async function doPut (todo: TodoType) {
      const res = await fetch('http:///mint20-loopback4:3000/todos/' + todo.id, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
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
            console.error('UpdateTodo fetch problem:', error)
        })
      }

    }

    function updateTodo(todo: TodoType) {
      const i = todos.findIndex(t => t.id === todo.id)
      if (todos[i].title !== todo.title)            $alert = `todo '${todos[i].title}' has been renamed to '${todo.title}'`
      if (todos[i].isComplete !== todo.isComplete)  $alert = `todo '${todos[i].title}' marked as ${todo.isComplete ? 'completed' : 'active'}`
      todos[i] = { ...todos[i], ...todo }
      console.log('UpdateTodo: about to call fetch')
      doPut(todo)
/*       async () => {
        const response = await fetch("http:///mint20-loopback4:3000/todos/" + todo.id, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "title": todo.title, "isComplete": todo.isComplete }),
        })
        console.log('waiting for response : ', response)
        const parsed = await response.json()
        .then(parsed => {console.log('update todo : ', parsed)})
        .catch(error => {
          console.error('UpdateTodo fetch problem:', error)
        })
      } */
      console.log('UpdateTodo: completed fetch')
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
          },
          body: JSON.stringify({
            "isComplete": completed
        })
      })
      console.log('doCheckAllTodos todo status : ', res.status)
      if (res.status != 200) {
        const json = await res.json()
        .then(json => {console.log('doCheckAllTodos count : ', json)})
        .catch(error => {
            console.error('doCheckAllTodos fetch problem:', error)
        })
      }

    }

    const checkAllTodos = (completed: boolean) => {
      todos.forEach(t => t.isComplete = completed)
      todos = [...todos]
      doCheckAllTodos(completed)
      $alert = `${completed ? 'Checked' : 'Unchecked'} ${todos.length} todos`
    }

    const removeCompletedTodos = () => {
      $alert = `Removed ${todos.filter(t => t.isComplete).length} todos`
      todos = todos.filter(t => !t.isComplete)
    }

/*    onMount( () => {
     console.log('Todos length - mounted : ', todos.length)
  })  */

  //  $: console.log('newTodoName: ', newTodoName)
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
