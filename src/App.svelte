<script lang="ts">
	import Todos from './components/Todos.svelte'
	import Alert from './components/Alert.svelte'
  import { onMount } from 'svelte'
	import { authToken, userId, urlInit } from './stores'
  import type { TodoType } from './types/todo.type'

  let password = ""
	let email = ""
	let error
	let authorised = false
  let todos: TodoType[] = []
  let url = $urlInit

	const handleLogin = async () => {
	  const response = await fetch(url + 'users/login', {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({ "email": email, "password": password }),
	  })
  
	  const parsed = await response.json()

//	  console.log(parsed)
//	  console.log("NORRIS: reply received")
 	  if (parsed.token && parsed.userid) {
      $authToken = parsed.token
      $userId = parsed.userid
      authorised = true
      email = ""
      password = ""
	    console.log("NORRIS: token is " + $authToken)
      console.log("NORRIS: user id is " + $userId)	
    } else {
      console.log(parsed.error)
      error = parsed.error
      email = ""
      password = ""
	  } 


  }

/*   async function doLogout () {
      const res = await fetch('http:///mint20-loopback4:3000/users/logout', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "isComplete": completed
        })
      })
      console.log('doLogout status : ', res.status)
      const json = await res.json()
      .catch(error => {
          if (res.status != 204) {
            console.error('doLogout fetch problem:', error)
          } 
      })
    } */

	function logout() {
		$authToken = ''
    $userId = ''
		authorised = false
    todos = []
    console.log('user is logged out. Userid is now: ', $userId)
  }


</script>
  
  <style>
	  .error-mess {
		  color: red;
	  }

  </style>

  

	{#if !authorised}
  <h2>Login to Loopback Todo</h2>
	<br>
  	<div class="todoapp stack-large">
    <form on:submit|preventDefault="{handleLogin}" method="post">
      <label>
        Email:
        <input type="email" bind:value="{email}" />
      </label>
      <label>
        Password:
        <input type="password" bind:value="{password}" />
      </label>
      <button type="submit" disabled={password == "" || email==""} class="btn">Login</button>
    </form>
    {#if error}
    	<p class="error-mess">Status code {error.statusCode} <br> {error.message}</p>
    {/if}
  </div>
  {/if}

  
  {#if authorised}
<!--    <p>auth token is {$authToken}</p> -->
    <h2>Loopback Todo</h2>
    <br>
    <div>
      <button class="btn" on:click={logout}>Log Out</button>
    </div>

    <Alert />
    <Todos bind:todos={todos} />

  {/if}
