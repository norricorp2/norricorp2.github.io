const { isExportDeclaration } = require("typescript")

describe('Multiple todos with Stubs', () => {
    it('successfully logs in',

     () => {


      cy.intercept('POST', '/users/login', { fixture: 'johnny_login.json' }).as('getLoginDetails')
      cy.intercept('GET', '/user/*/todos', {fixture: 'many_todos_list.json' }).as('getTodoDetails')
      cy.intercept('POST', '/user/*/todos', {fixture: 'johnny_new_todo.json' }).as('getNewTodo')

      const staticResponse204 = {
        statusCode: 204
      }

      cy.intercept('PUT', '/todos/*', staticResponse204).as('completeTodo')

      cy.intercept('DELETE', '/todos/*', staticResponse204).as('deleteTodo')



      cy.visit('/')

      cy.get('input[name=username]').type("johnny@email.com")

      // {enter} causes the form to submit
      cy.get('input[name=passwd]').type(`12345678{enter}`)

      cy.wait('@getLoginDetails')
      // UI should reflect this user being logged in
      cy.get('h1').should('contain', 'johnny@email.com')

      cy.wait(1000)

      cy.get('[role=list]').find('li').its('length').should('be.eq', 4)

      // {enter} causes the form to submit
      cy.get('input[id=todo-0]').type(`get cypress testing completed{enter}`)

      cy.wait('@getNewTodo').then((interception) => {
        cy.wrap(interception.response.body.id).as('todoid')
      })

      cy.get('@todoid').then(todoid => {
        cy.log("alias and the id of new todo is ", todoid)
      })
      
      cy.get('[role=list]').find('li').as('todos')
      

      cy.get('@todos').last().should('contain', 'get cypress testing completed')

      cy.get('[role=list]').find('li').its('length').should('be.eq', 5)

      cy.get('input[id=todo-142]').check()

      cy.wait('@completeTodo').its('response.statusCode').should('eq', 204)

      // now delete the todo, note define type
      cy.get('button[id=delete-142]').click()

      // sleep to allow screen to update and list to reflect change
      cy.wait(500)

      cy.get('[role=list]').find('li').its('length').should('be.eq', 4)

      cy.contains('Log Out').click()




    })
  })

  
