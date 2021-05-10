<script lang='ts'>
    import { createEventDispatcher, afterUpdate } from 'svelte'

    import type { TodoType } from '../types/todo.type'

    const dispatch = createEventDispatcher()
  
    let completed = true
  
    export let todos: TodoType[]

    const checkAll = () => {
      dispatch('checkAll', completed)
      completed = !completed
      console.log('MoreActions, completed is : ', completed)
    }
  
    const removeCompleted = () => dispatch('removeCompleted')
  
    // note that the t: TodoType has to be in own brackets
    $: completedTodos = todos.filter((t: TodoType) => t.isComplete).length



    afterUpdate(() => {
      console.log('afterupdate')
      if (completedTodos == todos.length) {
        console.log('MoreActions, 2 completed is : ', completed)
        completed = false
      }
      else if (completedTodos == 0) {
        completed = true
      }
    })
  </script>
  
<div class="btn-group">
  <button type="button" class="btn btn__primary"
    disabled={todos.length === 0} on:click={checkAll}>{completed ? 'Check' : 'Uncheck'} all</button>
  <button type="button" class="btn btn__primary"
    disabled={completedTodos === 0} on:click={removeCompleted}>Remove completed</button>
</div>

