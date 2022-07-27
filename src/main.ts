import App from './App.svelte';

declare global {
	interface Window {
	  Cypress?: Cypress.Cypress
	  authorised?: boolean
	  authToken?: string
	  userId?: string
	  emailName?: string
	}
}

const app = new App({
	target: document.body,
});

export default app;