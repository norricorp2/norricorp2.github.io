describe('The Login By Request', () => {
    it('successfully logs in with request', () => {

       cy.request('POST', '/', {
        username: "johnny@email.com",
        passwd: "12345678"
      })       

      cy.visit('/')
      // UI should reflect this user being logged in
      cy.get('h1').should('contain', 'Svelte To-Do List')

    })
  })

  