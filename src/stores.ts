import { writable } from 'svelte/store'
//import { localStore } from './localStore'
//import type { TodoType } from './types/todo.type'
//import { onMount } from 'svelte'

export const alert = writable('Welcome to the To-Do list app!')

export const authToken = writable('')
export const userId = writable('')
export const urlInit = writable("https://mint20-loopback4:3000/")
//  export const urlInit = writable("https://88.111.150.77:3000/")
export const emailName = writable('')
export const authorised = writable(false)

// read the database now
/* let initialTodos: TodoType[] = []

 fetch('http:///mint20-loopback4:3000/todos')
.then(response => response.json() )
.then(response => {
//  console.log('response - :', response)
  let a:any = response
  a.forEach(element  => {
    let t: TodoType = { id: 0, title: '0', isComplete: true }
    t.id = element.id
    t.title = element.title
    if (element.isComplete === undefined) {
      t.isComplete = false
    }
    else {
      t.isComplete = element.isComplete
    }
//    console.log('t is now : ', t)
    initialTodos.push(t)
  })
  console.log('completed fetch : ', initialTodos)
})  


console.log('about to call writable : ', initialTodos)

export const todos = writable<TodoType[]>(initialTodos) */


/*

   	const handleLogin = async () => {
	    const response = await fetch("http:///mint20-loopback4:3000/todos", {
		    method: "POST",
		    headers: {
		      "Content-Type": "application/json",
		    },
		    body: JSON.stringify({ "title": email, "isComplete": password }),
	    });

      const parsed = await response.json()
    }

*/