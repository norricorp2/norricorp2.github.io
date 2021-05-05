<script lang='ts'>
    import { createEventDispatcher } from 'svelte'
    import { onMount } from 'svelte'
    import { selectOnFocus } from '../actions'


    const dispatch = createEventDispatcher()
  
    export let autofocus: boolean = false

    let name = ''
    let nameE1: HTMLElement                  // reference to the name input DOM node, could be "fred"

   // if (autofocus) nameE1.focus()

    const addTodo = () => {
      dispatch('addTodo', name)
      name = ''
      nameE1.focus()            // give focus to the name input
    }
  
    const onCancel = () => {
        name = ''
        nameE1.focus()            // give focus to the name input
    }
  
    onMount(() => autofocus && nameE1.focus())    // if autofocus is true, we run nameE1.focus()

  </script>
  
  <form on:submit|preventDefault={addTodo} on:keydown={e => e.key === 'Escape' && onCancel()}>
    <h2 class="label-wrapper">
      <label for="todo-0" class="label__lg">What needs to be done?</label>
    </h2>
    <input bind:value={name} use:selectOnFocus type="text" bind:this={nameE1} id="todo-0" autoComplete="off" class="input input__lg" />
    <button type="submit" disabled={!name} class="btn btn__primary btn__lg">Add</button>
  </form>

