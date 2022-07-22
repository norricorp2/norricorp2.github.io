import type { Writable } from 'svelte/store';
import App from './App.svelte';

declare global {
	interface Window {
	  Cypress?: Cypress.Cypress
	  authorised?: Writable<boolean>
	  authToken?: Writable<string>
	  userId?: Writable<string>
	  emailName?: Writable<string>
	}
}

const app = new App({
	target: document.body,
});

export default app;