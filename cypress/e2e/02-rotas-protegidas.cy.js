describe("Rotas protegidas", () => {
  it("bloqueia /dashboard sem login", () => {
    cy.visit("/dashboard");
    cy.url().should("include", "/login");
  });

  it("bloqueia /dashboardAdmin sem login", () => {
    cy.visit("/dashboardAdmin");
    cy.url().should("include", "/login");
  });

  it("operador não acessa /dashboardAdmin", () => {
    cy.loginUI(Cypress.env("operadorEmail"), Cypress.env("operadorPassword"));
    cy.url().should("include", "/dashboard");

    cy.visit("/dashboardAdmin");
    cy.url().should("include", "/dashboard");
    cy.url().should("not.include", "/dashboardAdmin");
    cy.contains("Painel Operacional").should("be.visible");
  });

  it("admin acessa /dashboardAdmin", () => {
    cy.loginUI(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
    cy.url().should("include", "/dashboardAdmin");
    cy.contains("Admin Painel").should("be.visible");
    cy.contains("button", /Gest/i).click();
    cy.contains("Adicionar Posto").should("be.visible");
  });

  it("admin logado não acessa /home pela URL", () => {
    cy.loginUI(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
    cy.visit("/home");
    cy.url().should("include", "/dashboardAdmin");
    cy.url().should("not.include", "/home");
  });

  it("operador logado não acessa /home pela URL", () => {
    cy.loginUI(Cypress.env("operadorEmail"), Cypress.env("operadorPassword"));
    cy.visit("/home");
    cy.url().should("include", "/dashboard");
    cy.url().should("not.include", "/home");
  });

  it("admin logado não acessa /dashboard do operador", () => {
    cy.loginUI(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/dashboardAdmin");
  });
});
