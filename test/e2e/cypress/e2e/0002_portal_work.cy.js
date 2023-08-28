// var loggedInCookie = null;
// Don't stop tests on uncaught errors
Cypress.on("uncaught:exception", () => false);

describe("portal_work:", () => {
   beforeEach(() => {
      cy.AuthLogin();
      cy.visit("/");
   });

   it("has Site Admin in the Nav Menu", () => {
      NavigateSiteAdmin(cy);

      // Should show Site Admin in the Menu Title
      cy.get("[data-cy=portal_work_menu_title]")
         .should("be.visible")
         .should("have.text", "Site Administration");

      // Should have 1 page
      cy.get("[data-cy=portal_work_menu_pages]").then((elContainer) => {
         expect(elContainer[0].childElementCount).to.equal(1);
      });

      // Should see the Inbox
      cy.get("[data-cy=inbox_icon]").should("be.visible");

      // Should see the User icon
      cy.get("[data-cy=user_icon]").should("be.visible");

      // Should have the AB factory available in the Window
      cy.window().should("have.property", "AB");
   });
});

function NavigateSiteAdmin(cy) {
   cy.get("[data-cy=portal_work_menu_sidebar]").should("be.visible").click();
   cy.get("[data-cy=227bcbb3-437f-4bb5-a5a1-ec3198696206]")
      .should("be.visible")
      .click();
}

// function NavigateRole(cy) {
//    cy.get("[webix_tm_id=1a3e991e-aa1e-4eef-8cf8-fd7c5d97ae53_menu]")
//       .should("be.visible")
//       .click();
// }
