describe('The Login Page', () => {
    it('successfully logs in', () => {

/*       cy.request('POST', '/users/login', {
        email: "johnny@email.com",
        password: "12345678"
      }) */      

      cy.visit('/')

      cy.get('input[name=username]').type("maria@email.com")

      // {enter} causes the form to submit
      cy.get('input[name=passwd]').type(`12345678{enter}`)

      // UI should reflect this user being logged in
      cy.get('h1').should('contain', 'Svelte To-Do List')

    })
  })

  