import type { Writable } from 'svelte/store';
import App from './App.svelte';

declare global {
	interface Window {
	  Cypress?: Cypress.Cypress
	  authorised?: Writable<Boolean>
	  authToken?: Writable<String>
	  userId?: Writable<String>
	  emailName?: Writable<String>
	}
}

const app = new App({
	target: document.body,
});

export default app;