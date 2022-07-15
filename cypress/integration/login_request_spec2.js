describe('The Login By Request', () => {
    it('successfully logs in with request', () => {

      cy.request('POST', '/', {
        username: "johnny@email.com",
        passwd: "12345678"
      }).its('body').then((body) => {
		cy.visit(`/`)
		cy.log(body)
		cy.get('h1').should('contain', 'Svelte To-Do List')			
	  });

  })
})


