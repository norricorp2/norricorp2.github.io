describe('Add Todo', () => {
    it('successfully adds a todo',
/*     {
      env: {
        api: 'https://mint20-loopback4:3000/users/login',
      },
    }, */
     () => {

/*       cy.request('POST', Cypress.env('api'), {
        email: "johnny@email.com",
        password: "12345678"
      })  */     
      
      // The above does not work because single page application

      cy.visit('/')

      cy.get('input[name=username]').type("maria@email.com")

      // {enter} causes the form to submit
      cy.get('input[name=passwd]').type(`12345678{enter}`)

      // initial list is 1 todo
      cy.get('[role=list]').find('li').its('length').should('be.gte', 1)

      // {enter} causes the form to submit
      cy.get('input[id=todo-0]').type(`get cypress testing completed{enter}`)

      cy.wait(2000)

      cy.get('[role=list]').find('li').as('todos')

      // UI should reflect this new todo as final entry
      cy.get('@todos').last().should('contain', 'get cypress testing completed')

      // and now complete checkbox 
      cy.get('[role=list]').find('[type="checkbox"]').as('boxes') 
      cy.get('@boxes').last().invoke('attr', 'id').then($cb => {
        cy.log("value of id attribute is ", $cb)
        cy.get('[id='+$cb+']').check()
       })
      
  //    cy.get('[type="checkbox"]').last().check()
      
      cy.contains('Remove completed').click()

      // sleep to allow screen to update and list to reflect change
      cy.wait(3000)


      cy.get('[role=list]').find('li').its('length').should('be.eq', 1)

      cy.contains('Log Out').click()

      
    }) // end of it
  })

