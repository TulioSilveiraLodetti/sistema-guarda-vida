const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
  },
  env: {
    apiUrl: "http://localhost:8080",
    adminEmail: "admin@admin.com",
    adminPassword: "123456789",
    operadorEmail: "salvavida@cbm.com",
    operadorPassword: "123456",
  },
});
