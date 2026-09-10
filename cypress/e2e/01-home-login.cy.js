describe("Home e Login", () => {
  it("exibe a tela inicial", () => {
    cy.visit("/");
    cy.contains("SISTEMA GUARDA-VIDA").should("be.visible");
    cy.contains("button", "ACESSAR SISTEMA").click();
    cy.url().should("include", "/login");
  });

  it("login inválido exibe mensagem de erro", () => {
    cy.loginUI("naoexiste@teste.com", "senhaerrada", { expectSuccess: false });
    cy.get('[role="alert"]').should("be.visible");
    cy.url().should("include", "/login");
  });

  it("admin entra no painel administrativo", () => {
    cy.loginUI(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
    cy.url().should("include", "/dashboardAdmin");
    cy.contains("Admin Painel").should("be.visible");
  });

  it("operador entra no painel operacional", () => {
    cy.loginUI(Cypress.env("operadorEmail"), Cypress.env("operadorPassword"));
    cy.url().should("include", "/dashboard");
    cy.url().should("not.include", "/dashboardAdmin");
    cy.contains("Painel Operacional").should("be.visible");
  });
});
