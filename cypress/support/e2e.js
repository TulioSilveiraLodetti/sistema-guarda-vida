Cypress.Commands.add("limparAuth", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("token_cbm");
    win.localStorage.removeItem("role_cbm");
    win.localStorage.removeItem("relatorios_cbm");
    win.localStorage.removeItem("status_postos_cbm");
  });
});

Cypress.Commands.add("loginUI", (email, senha, options = {}) => {
  const { expectSuccess = true } = options;
  cy.visit("/login");
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(senha);
  cy.contains("button", "ENTRAR NO SISTEMA").click();
  if (expectSuccess) {
    cy.url().should("not.include", "/login");
  }
});

Cypress.Commands.add("loginApi", (email, senha) => {
  return cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: { email, senha },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("tokenApi", (email, senha) => {
  return cy.loginApi(email, senha).then((resp) => {
    expect(resp.status).to.eq(200);
    return resp.body.token;
  });
});

beforeEach(() => {
  cy.limparAuth();
});
