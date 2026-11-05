// E2E smoke test: the shell resolves the registry and routes correctly.
// Stubs /dashboards.json with a fixture so no live Superset is required.
describe('superset-embed smoke', () => {
  beforeEach(() => {
    cy.intercept('GET', '/dashboards.json', { fixture: 'dashboards.json' }).as('registry')
  })

  it('embeds the dashboard iframe for a known slug', () => {
    cy.visit('/biogas')
    cy.wait('@registry')
    cy.get('iframe.dashboard-iframe')
      .should('have.attr', 'src')
      .and('include', '11111111-1111-1111-1111-111111111111')
  })

  it('shows the not-found state for an unknown slug', () => {
    cy.visit('/does-not-exist')
    cy.wait('@registry')
    cy.get('.dashboard-notfound').should('be.visible')
    cy.get('iframe.dashboard-iframe').should('not.exist')
  })
})
