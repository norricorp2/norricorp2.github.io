const { isExportDeclaration } = require("typescript")

describe('Add Todo', () => {
    it('successfully adds a todo',
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
        cy.wrap(body.userid).as('userid')
        cy.wrap(body.token).as('token')

        cy.log("and the value of user id is ", body.userid)
        cy.log("and the value of token id is ", body.token) 

        cy.request({
        method: 'GET', 
        url: Cypress.env('api')+'todos', 
        auth: {
          'bearer': body.token
        }
        }).its('body').then((body) => {
          cy.log(JSON.stringify(body))
          cy.log("length of array is ", body.length)
          expect(body[0]).property('title').to.include('paint')
        }) 

        cy.request({
          method: 'POST', 
          url: Cypress.env('api')+'todos', 
          auth: {
            'bearer': body.token
          },
          body: {
            title: "continue tar on shed",
            isComplete: false,
            newUserRequestId: body.userid
          }
        }).its('body').then((body) => {
          cy.log("New record is ", JSON.stringify(body))
          cy.log("with an id of ", body.id )
          cy.wrap(body.id).as('newid')
//          expect(body[0]).property('title').to.include('paint')
        })

        
        cy.request({
          method: 'GET', 
          url: Cypress.env('api')+'todos', 
          auth: {
            'bearer': body.token
          }
        }).its('body').then((body) => {
          cy.log("after new todo, list is \n", JSON.stringify(body))
          cy.log("length of array is ", body.length)
          cy.wrap(body.length).as('count')
        })

        cy.get('@newid').then(newid => {
          cy.request({
            method: 'GET', 
            url: Cypress.env('api')+'user/'+body.userid+'/todos', 
            auth: {
              'bearer': body.token
            }
          }).its('body').then((body) => {
            cy.log(JSON.stringify(body))
          })           
        })

        cy.get('@newid').then(newid => {
          cy.request({
            method: 'DELETE', 
            url: Cypress.env('api')+'todos/'+newid, 
            auth: {
              'bearer': body.token
            }
          }).its('status').should('equal', 204)
        })

        // after delete list of todos should be one less
        // two ways of doing it
        cy.get('@count').then(count => {
          cy.request({
            method: 'GET', 
            url: Cypress.env('api')+'todos/count', 
            auth: {
              'bearer': body.token
            }
          }).its('body').then((body) => {
            cy.log(JSON.stringify(body))
            expect(body).property('count').to.equal(count - 1)
          })           
        })

        cy.get('@count').then(count => {
          cy.request({
            method: 'GET', 
            url: Cypress.env('api')+'todos/count', 
            auth: {
              'bearer': body.token
            }
          }).its('body.count').should("eq", count - 1)         
        })





      })  // end of login request     

      // so this is a really long winded way of accessing an alias which needs to be outside of a quote
      cy.get('@userid').then(userid => {
        cy.log("alias and the value of user id is ", userid)
      })
      
      cy.get('@token').then(token => {
        cy.log("alias and the value of token is ", token)
      })

      
      

      
    }) // end of it
  })

