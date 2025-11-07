describe('TeamComponent', () => {
  it('should mount', () => {
    cy.mount('<app-team></app-team>');
  });

  it('should display team members', () => {
    cy.mount('<app-team></app-team>');
    cy.get('.team-member-card').should('have.length', 3);
  });

  it('should display social links', () => {
    cy.mount('<app-team></app-team>');
    cy.get('.social-link').should('exist');
  });

  it('should display company values', () => {
    cy.mount('<app-team></app-team>');
    cy.get('.value-item').should('have.length', 4);
  });
});