describe("Segurança da API", () => {
  it("GET /postos sem token retorna 401", () => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/postos`,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(401);
    });
  });

  it("operador não pode criar posto (403)", () => {
    cy.tokenApi(Cypress.env("operadorEmail"), Cypress.env("operadorPassword")).then(
      (token) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/postos`,
          headers: { Authorization: `Bearer ${token}` },
          body: { nome: `posto-cypress-${Date.now()}`, descricao: "teste seguranca" },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(403);
        });
      }
    );
  });

  it("operador não pode listar usuarios (403)", () => {
    cy.tokenApi(Cypress.env("operadorEmail"), Cypress.env("operadorPassword")).then(
      (token) => {
        cy.request({
          method: "GET",
          url: `${Cypress.env("apiUrl")}/usuarios`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(403);
        });
      }
    );
  });

  it("admin pode listar postos (200)", () => {
    cy.tokenApi(Cypress.env("adminEmail"), Cypress.env("adminPassword")).then((token) => {
      cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/postos`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an("array");
      });
    });
  });

  it("login inválido retorna 401", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      body: { email: "x@teste.com", senha: "errada" },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(401);
    });
  });
});
