<script lang="ts">
	import Todos from './components/Todos.svelte'
	import Alert from './components/Alert.svelte'
  import { onMount } from 'svelte'
//	import { todos } from './stores'
  import type { TodoType } from './types/todo.type'

  let todos: TodoType[] = []

  onMount(async () => {
		const res = await fetch('http:///mint20-loopback4:3000/todos')
		const json = await res.json()
    .catch(error => {
          console.error('OnMountTodo fetch problem:', error)
    })
    
//		console.log('todolist : ', json)
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
	})

</script>
  
  <Alert />
  <Todos bind:todos={todos} />
  
  
