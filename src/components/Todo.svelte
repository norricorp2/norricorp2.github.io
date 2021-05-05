  <script lang='ts'>
    import { createEventDispatcher } from 'svelte'
  //  import { tick } from 'svelte'
    import { selectOnFocus, focusOnInit } from '../actions'
    import type { TodoType } from '../types/todo.type'
 

    const dispatch = createEventDispatcher()
    export let todo: TodoType

    console.log('into Todo.svelte : ', todo)

    let editing = false                     // track editing mode
    let name = todo.title                    // hold the name of the todo being edited
    let editButtonPressed = false           // track if edit button has been pressed, to give focus to it after cancel or save

//    let nameEl                              // reference to the name input DOM node

    function update(updatedTodo: Partial<TodoType>) {
        todo = { ...todo, ...updatedTodo }    // applies modifications to todo
        dispatch('update', todo)              // emit update event
    }

    function onCancel() {
        name = todo.title                      // restores name to its initial value and
        editing = false                       // and exit editing mode
    }

    function onSave() {
        update({ title: name })                // updates todo name
        editing = false                       // and exit editing mode
    }

    function onRemove() {
        dispatch('remove', todo)              // emit remove event
    }

    async function onEdit() {
      editButtonPressed = true              // user pressed the Edit button, focus will come back to the Edit button
      editing = true                        // enter editing mode
 //       await tick()
 //       nameEl.focus()                        // set focus to name input
    }

    function onToggle() {
        update({ isComplete: !todo.isComplete}) // updates todo status
    }

    const focusEditButton = (node: HTMLElement) => editButtonPressed && node.focus()

  </script>
  
  <div class="stack-small">
    {#if editing}
      <!-- markup for editing todo: label, input text, Cancel and Save Button -->
      <form on:submit|preventDefault={onSave} class="stack-small" on:keydown={e => e.key === 'Escape' && onCancel()}>
        <div class="form-group">
          <label for="todo-{todo.id}" class="todo-label">New name for '{todo.title}'</label>
          <input bind:value={name} use:selectOnFocus use:focusOnInit type="text" id="todo-{todo.id}" autoComplete="off" class="todo-text" />
        </div>
        <div class="btn-group">
          <button class="btn todo-cancel" on:click={onCancel} type="button">
            Cancel<span class="visually-hidden">renaming {todo.title}</span>
            </button>
          <button class="btn btn__primary todo-edit" type="submit" disabled={!name}>
            Save<span class="visually-hidden">new name for {todo.title}</span>
          </button>
        </div>
      </form>
    {:else}
      <!-- markup for displaying todo: checkbox, label, Edit and Delete Button -->
      <div class="c-cb">
        <input type="checkbox" id="todo-{todo.id}"
          on:click={onToggle} checked={todo.isComplete} >
        <label for="todo-{todo.id}" class="todo-label">{todo.title}</label>
      </div>
      <div class="btn-group">
        <button type="button" class="btn" on:click={onEdit} use:focusEditButton>
          Edit<span class="visually-hidden"> {todo.title}</span>
        </button>
        <button type="button" class="btn btn__danger" on:click={onRemove}>
          Delete<span class="visually-hidden"> {todo.title}</span>
        </button>
      </div>
    {/if}
    </div>

