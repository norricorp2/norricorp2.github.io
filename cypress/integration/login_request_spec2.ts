import Window from '../../src/main'

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

                cy.window().then(win =>{
                                        cy.visit(`/`, {
                                          onBeforeLoad(win) {
                                            win.authorised =true
                                            win.emailName = "johnny@email.com"
                                            win.authToken = body.token
                                            win.userId = body.userId
                                          },
                                        })
                                        
              })
              cy.get('h1').should('contain', 'Svelte To-Do List')		

        })

  })
})

