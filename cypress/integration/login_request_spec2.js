import { authToken, userId, emailName, urlInit, authorised } from '../../src/stores'

describe('The Login By Request', () => {
    it('successfully logs in with request',
    {
      env: {
        api: 'https://mint20-loopback4:3000/',
      },
    },
	() => {
      cy.request('POST', Cypress.env('api')+'users/login', {
        email: "johnny@email.com",
        password: "12345678"
      }).its('body').then((body) => {
		    cy.log(body)
        cy.window().then(win => win.authToken.set(body.token))
//        $authToken = body.token
        cy.window().then(win => win.userId.set(body.userId))
//        $userId = body.userid
        cy.window().then(win => win.authorised.set(true))
//        $authorised = true
        cy.window().then(win => win.emailName.set("johnny@email.com"))
//        $emailName = "johnny@email.com"
		    cy.visit(`/`)

		    cy.get('h1').should('contain', 'Svelte To-Do List')			
	  });

  })
})

