const { isExportDeclaration } = require("typescript")

describe('The Login Page with Stubs', () => {
    it('successfully logs in',
    {
      env: {
        api: 'https://mint20-loopback4:3000/*',
      },
    },
     () => {

/*       cy.intercept('POST', Cypress.env('api')+'users/login', { fixture: 'login.json' }).as('getLoginDetails')
      cy.intercept('GET', Cypress.env('api')+'user/*', {fixture: 'todos_list.json' }).as('getTodoDetails') */

      cy.intercept('POST', '/users/login', { fixture: 'maria_login.json' }).as('getLoginDetails')
      cy.intercept('GET', '/user/*/todos', {fixture: 'todos_list.json' }).as('getTodoDetails')
      cy.intercept('POST', '/user/*/todos', {fixture: 'maria_new_todo.json' }).as('getNewTodo')

      const staticResponse204 = {
        statusCode: 204
      }

      const staticResponse200 = {
        statusCode: 200,
        fixture: 'remove_completed.json'
      }

      cy.intercept('PUT', '/todos/*', staticResponse204).as('completeTodo')


      cy.intercept('DELETE', '/todos/*').as('deleteTodo')



      cy.visit('/')

      cy.get('input[name=username]').type("maria@email.com")

      // {enter} causes the form to submit
      cy.get('input[name=passwd]').type(`12345678{enter}`)

      cy.wait('@getLoginDetails')
      // UI should reflect this user being logged in
      cy.get('h1').should('contain', 'maria@email.com')

      cy.get('[role=list]').find('li').its('length').should('be.eq', 1)

      // {enter} causes the form to submit
      cy.get('input[id=todo-0]').type(`get cypress testing completed{enter}`)

      cy.wait('@getNewTodo').then((interception) => {
        cy.wrap(interception.response.body.id).as('todoid')
      })

      cy.get('@todoid').then(todoid => {
        cy.log("alias and the id of new todo is ", todoid)
      })
      
      cy.get('[role=list]').find('li').as('todos')
/*       cy.get('@todos').then(todos => {
        cy.log("value of todo list is ", todos)
      }) */

      // UI should reflect this new todo as final entry
      cy.get('@todos').last().should('contain', 'get cypress testing completed')
      cy.get('[role=list]').find('li').its('length').should('be.eq', 2)


      // and now complete checkbox 
      cy.get('[role=list]').find('[type="checkbox"]').as('boxes') 
      cy.get('@boxes').last().invoke('attr', 'id').should('contain', '142')
      cy.get('@boxes').last().invoke('attr', 'id').then($cb => {
        cy.log("value of id attribute is ", $cb)
        cy.get('[id='+$cb+']').check()
      })

      cy.wait('@completeTodo').its('response.statusCode').should('eq', 204)


/*       cy.wait('@completeTodo').then((interception) => {
        cy.log("here is the interception", interception.response.statusCode)
        cy.wrap(interception.response.statusCode).should('eq', 204)
      }) */

      cy.contains('Remove completed').click()

      cy.wait('@deleteAllCompleteTodo').its('response.statusCode').should('eq', 200)

      // sleep to allow screen to update and list to reflect change
      cy.wait(500)

      cy.get('[role=list]').find('li').its('length').should('be.eq', 1)

      cy.contains('Log Out').click()




    })
  })

  
