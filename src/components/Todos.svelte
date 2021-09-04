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
  import { authToken, userId, urlInit } from '../stores'

  let url = $urlInit

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
    async function doDelete (todo: TodoType): Promise<boolean> {
        let result: boolean = false
        // no JSON is returned
        try {
          const res = await fetch(url + 'todos/' + todo.id, {
              method: 'DELETE',
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + $authToken,
                },
          })
          console.log("NORRIS: response is: ", res)
          if (res.status == 204) {
            console.log('Deleted todo : ', todo.id)
            result = true
          }
        } catch (error) {
                console.error('Delete fetch problem:', error)
        }
      return result
    }


    function removeTodo(todo: TodoType) {
      doDelete(todo).then((data: boolean) => {
        console.log("data returned is: ", data)
        if (data == true) {
          todos = todos.filter(t => t.id !== todo.id)
          $alert = `Todo '${todo.title}' has been deleted`
        }
        else {
          $alert = `Todo '${todo.title}' was NOT deleted`
        }
      }) 
      todosStatus.focus()             // give focus to status heading
      console.log('NORRIS: removeTodo: ', todos)
    }


    async function doPost (name: string): Promise<boolean> {
      let result: boolean = false
      try {
        const res = await fetch(url + "user/" + $userId + "/todos", {
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
      
//      if (res.status != 204) {
        const json = await res.json()
        .then(json => {
            console.log('doPost: add todo : ', json)
            console.log('with id of : ', json.id)
            console.log('and status is ', res.status)
            newTodoId = json.id
            result = true
        })
      } catch(error) {
            console.error('AddTodo PUT problem:', error)
      }
//      }
      return result
    }

    // create new todo. Note the use of async. This allows us to make doPost wait until the 
    // https fetch is completed to give back the id number for the internal array.
    async function addTodo(name: string) {
      // doing this can cause problems as the array is mutated
      //todos.push({ id: newTodoId, name: newTodoName, isComplete: false })
      //todos = todos
      // doing this creates a new array
      console.log('2 into Todos.svelte : ', todos)
      newTodoId = 0 
      await doPost(name).then((data: boolean) => {
        console.log("data returned is: ", data)
        if (data == true) {
          console.log("NORRIS: the new id is ", newTodoId)
          todos = [...todos, { id: newTodoId, title: name, isComplete: false, newUserRequestId: $userId }]
          $alert = `Todo '${name}' has been added`
        }
        else {
          $alert = `Todo '${name}' has NOT been added`
        }
      }) 

      // finally update array

      console.log('NORRIS: addTodo: ', todos)

    }

    async function doPut (todo: TodoType): Promise<boolean> {
      let result: boolean = false
        // no JSON is returned
      try {
        const res = await fetch(url + 'todos/' + todo.id, {
          method: 'PUT',
          headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + $authToken,
            },
            body: JSON.stringify({
              "title": todo.title, 
              "isComplete": todo.isComplete,
              "newUserRequestId": todo.newUserRequestId
          })
        })
        console.log('update todo status : ', res.status)
        if (res.status == 204) {
          console.log('update todo : ', todo.id)
          result = true
        }
      } catch(error) {
          console.error('UpdateTodo doPut problem:', error)
      }
      return result
    }

    function updateTodo(todo: TodoType) {

      console.log('NORRIS: updateTodo: ', todos)
      doPut(todo).then((data: boolean) => {
        const i = todos.findIndex(t => t.id === todo.id)
        if (data == true) {
          if (todos[i].title !== todo.title)            $alert = `todo '${todos[i].title}' has been renamed to '${todo.title}'`
          if (todos[i].isComplete !== todo.isComplete)  $alert = `todo '${todos[i].title}' marked as ${todo.isComplete ? 'completed' : 'active'}`
          todos[i] = { ...todos[i], ...todo }
        }
        else {
          if (todos[i].title !== todo.title)            $alert = `todo '${todos[i].title}' has NOT been renamed to '${todo.title}'`
          if (todos[i].isComplete !== todo.isComplete)  $alert = `todo '${todos[i].title}' NOT marked as ${todo.isComplete ? 'completed' : 'active'}`
        }
      })
      console.log('UpdateTodo: completed doPut')
    }

     let filter: Filter = Filter.ALL
      const filterTodos = (filter: Filter, todos: TodoType[]) =>
        filter === Filter.ACTIVE ? todos.filter((t: TodoType) => !t.isComplete) :
        filter === Filter.COMPLETED ? todos.filter((t: TodoType) => t.isComplete) :
        todos
        $: {
          if (filter === Filter.ALL)               $alert = 'Browsing all my todos'
          else if (filter === Filter.ACTIVE)       $alert = 'Browsing my active todos'
          else if (filter === Filter.COMPLETED)    $alert = 'Browsing my completed todos'
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

    async function doCheckAllTodos (completed: boolean): Promise<boolean> {
      let result: boolean = false
      let where = JSON.stringify({
        "isComplete": !completed,
        "newUserRequestId": $userId
      })
      try {
      const res = await fetch(url + 'todos?where=' + where, {
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
      .then(json => {console.log('doCheckAllTodos count : ', json.count)
                    result = true
                  })
    } catch(error) {
            console.error('doCheckAllTodos HTTP problem:', error)
      }
      return result
    }

    const checkAllTodos = (completed: boolean) => {
        doCheckAllTodos(completed).then((data: boolean) => {
        if (data == true) {
          todos.forEach(t => t.isComplete = completed)
          todos = [...todos]
          console.log('NORRIS: checkAllTodos: ', todos)
          $alert = `${completed ? 'Checked' : 'Unchecked'} ${todos.length} todos`
        }
        else {
          $alert = `${completed ? 'Checked' : 'Unchecked'} did not happen`
        }
      })
    }


    async function doDeleteAllCompletedTodos (): Promise<boolean> {
      let result: boolean = false
      let where = JSON.stringify({
        "isComplete": true,
        "newUserRequestId": $userId
      })
      try {
        const res = await fetch(url + 'todos?where=' + where, {
          method: 'DELETE',
          headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + $authToken,
            },
        })
        console.log('doDeleteAllCompletedTodos todo status : ', res.status)
        const json = await res.json()
        .then(json => {console.log('doDeleteAllCompletedTodos count : ', json.count)
                      result = true
                      })
    } catch(error) {
          console.error('doDeleteAllCompletedTodos HTTP problem:', error)
      }
      return result
    }


    const removeCompletedTodos = () => {

      doDeleteAllCompletedTodos().then((data: boolean) => {
        if (data == true) {
          let temp = todos.filter(t => t.isComplete).length
          todos = todos.filter(t => !t.isComplete)
          console.log('NORRIS: removeCompletedTodos: ', todos)
          $alert = `Removed ${temp} todos`
        }
        else {
          $alert = `Error: removed no todos`
        }
      })
    }


    async function getAllTodos () {
      let temp = url + "user/" + $userId + "/todos"
      console.log(`NORRIS: url will be ${temp}`)
      const res = await fetch(url + "user/" + $userId + "/todos", {
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
        let t: TodoType = { id: 0, title: '0', isComplete: true, newUserRequestId: '0' }
        t.id = element.id
        t.title = element.title
        t.newUserRequestId = element.newUserRequestId
        if (element.isComplete === undefined) {
          t.isComplete = false
        }
        else {
          t.isComplete = element.isComplete
        }
        // this updates the DOM
        todos = [...todos,t]
      })
      console.log('NORRIS: completed mount : ', todos)
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
