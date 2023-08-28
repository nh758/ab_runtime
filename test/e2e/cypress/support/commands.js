// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("AuthLogin", () => {
   cy.session("admin", () => {
      cy.log(`Logging in as ${Cypress.env("USER_EMAIL")}`);
      cy.request("POST", "/auth/login", {
         tenant: Cypress.env("TENANT"),
         email: Cypress.env("USER_EMAIL"),
         password: Cypress.env("USER_PASSWORD"),
      })
         .its("body")
         .as("currentUser");
   });
});

Cypress.Commands.add("ResetDB", () => {
   const stack = Cypress.env("STACK");

   // Clear the Physical DB
   cy.exec(`npm run test:reset ${stack}`);

   // Have the running services clear their definitions.
   cy.request("POST", "/test/reset", { tenant: Cypress.env("TENANT") });
});

Cypress.Commands.add("RunSQL", (folder, files, fail = true) => {
   const stack = Cypress.env("STACK");
   if (typeof files === "string") {
      files = [files];
   }

   const regEx = /^\S+/;
   cy.exec(`docker ps | grep ${stack}_db`).then(({ stdout }) => {
      if (!regEx.test(stdout)) {
         throw new Error(`couldn't find process matching '${stack}_db'`);
      }
      const containerId = stdout.match(regEx)[0];

      const user = Cypress.env("DB_USER");
      const password = Cypress.env("DB_PASSWORD");

      let catCmd = "cat ";
      files.forEach((file) => {
         const path = `./cypress/e2e/${folder}/test_setup/sql/${file} `;
         catCmd += path;
      });
      catCmd += `> ./cypress/e2e/${folder}/test_setup/sql/combineSql.sql`;
      cy.exec(catCmd);
      cy.exec(`docker exec ${containerId} mkdir -p /sql`);
      cy.exec(
         `docker cp ./cypress/e2e/${folder}/test_setup/sql/combineSql.sql ${containerId}:/sql/combineSql.sql`,
         {
            log: false,
         }
      );

      cy.exec(
         /* eslint-disable no-useless-escape*/
         `docker exec ${containerId} bash -c "mysql -u ${user} -p${password} \"appbuilder-admin\" < ./sql/combineSql.sql"`,
         { failOnNonZeroExit: fail }
      );
      cy.exec(`docker exec ${containerId} bash -c "rm ./sql/combineSql.sql"`, {
         log: false,
      });
      cy.exec(`rm ./cypress/e2e/${folder}/test_setup/sql/combineSql.sql`, {
         log: false,
      });
   });
});
