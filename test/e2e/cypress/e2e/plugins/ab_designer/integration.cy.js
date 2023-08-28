import path from "path";

const appclicationDefault = {
   name: "TestApp",
   icon: "fa-500px",
   description: "This is a testing app.",
   isSystemObject: false,
   roles: [],
   enablePage: {
      byRole: [],
      byAccount: [],
      byField: [],
   },
   enableTranslation: {
      byRole: [],
      byAccount: [],
      byField: [],
   },
};

// Don't stop tests on uncaught errors
Cypress.on("uncaught:exception", () => false);

const navigateABDesigner = (cy) => {
   cy.get("[data-cy=portal_work_menu_sidebar]").should("be.visible").click();
   cy.get("[data-cy=ABDesigner]").should("be.visible").click();
};

const navigateABDesignerApplication = (cy, name) => {
   navigateABDesigner(cy);
   cy.get('[view_id="abd_choose_list_list"]')
      .contains(name)
      .should("be.visible")
      .click();
};

describe("AB Designer:", () => {
   before(() => {
      cy.ResetDB();
   });

   beforeEach(() => {
      cy.AuthLogin();
      cy.visit("/");
      navigateABDesigner(cy);
   });

   describe("Main page", () => {
      describe("New application", () => {
         it("Add new application", () => {
            cy.get('[data-cy="abd_choose_list_buttonCreateNewApplication"]')
               .should("exist")
               .click();
            cy.get('[data-cy="abd_choose_form_cancel"]')
               .should("exist")
               .click();
            cy.get('[view_id="abd_choose_list_list"]')
               .find(".webix_scroll_cont")
               .find(".webix_list_item")
               .should("have.length", 1);
            cy.get(
               '[data-cy="abd_choose_list_buttonCreateNewApplication"]'
            ).click();
            cy.get('[data-cy="abd_choose_form_label"]')
               .should("exist")
               .type(appclicationDefault.name);
            cy.get('[data-cy="abd_choose_form_icon"]').should("exist").click();
            cy.contains("fa-500px").should("exist").click();
            cy.get('[data-cy="abd_choose_form_description"]')
               .should("exist")
               .type(appclicationDefault.description);
            cy.get('[view_id="abd_choose_form_appFormPermissionList"]')
               .should("exist")
               .click();
            cy.contains("Select").should("exist").click();
            cy.get('[data-cy="abd_choose_form_saveButton"]')
               .should("exist")
               .click();
            cy.get('[view_id="abd_choose_list_list"]')
               .contains(appclicationDefault.description)
               .should("be.visible");
            cy.get('[view_id="abd_choose_list_list"]')
               .find(`.${appclicationDefault.icon}`)
               .should("be.visible");
            cy.get('[view_id="abd_choose_list_list"]')
               .contains(appclicationDefault.name)
               .should("be.visible")
               .click();
            cy.get('[view_id="abd_work_labelAppName"]').should(
               "include.text",
               appclicationDefault.name
            );
            cy.get('[view_id="abd_work_toolBar"]')
               .find(".fa-arrow-left")
               .should("exist")
               .click();
         });

         it("Edit TestApp with role", () => {
            cy.get('[data-cy="portal_work_menu_sidebar"]')
               .should("be.visible")
               .click();
            cy.get('[view_id="abSidebarMenu"]')
               .find(".webix_tree_item")
               .should("have.length", 2);
            cy.get('[data-cy="ABDesigner"]').click();
            cy.get('[view_id="abd_choose_list_list"]')
               .contains(appclicationDefault.name)
               .parent()
               .parent()
               .find(".fa-cog")
               .should("exist")
               .click();
            cy.get('[view_id="abd_common_popupEditMenu_menu_abd_choose_list"]')
               .find(".fa-pencil-square-o")
               .should("be.visible")
               .click();
            cy.get('[view_id="abd_choose_form_appFormPermissionList"]')
               .should("be.visible")
               .click();
            cy.get(".webix_view.webix_list.webix_multilist")
               .find('[webix_l_id="dd6c2d34-0982-48b7-bc44-2456474edbea"]')
               .should("exist")
               .click({ multiple: true, force: true });
            cy.get(".webix_view.webix_control.webix_el_button.webix_secondary")
               .eq(0)
               .should("be.visible")
               .click({ force: true });
            cy.get('[data-cy="abd_choose_form_saveButton"]')
               .should("exist")
               .click();
            cy.reload();
            cy.get('[data-cy="portal_work_menu_sidebar"]')
               .should("be.visible")
               .click();
            cy.get('[view_id="abSidebarMenu"]')
               .contains("TestApp")
               .should("exist");
         });

         it.skip('Edit TestApp with the "Enable Page / Tab Access Management" option', () => {});

         it.skip('Edit TestApp with the "Enable Translation Tool" option', () => {});

         // This test can not be passed because "(page load) --waiting for new page to load--" fail after we export
         it.skip("Export TestApp", () => {
            cy.get('[view_id="abd_choose_list_list"]')
               .contains(appclicationDefault.name)
               .parent()
               .parent()
               .find(".fa-cog")
               .should("exist")
               .click();
            cy.get('[view_id="abd_common_popupEditMenu_list_abd_choose_list"]')
               .contains("Export")
               .should("be.visible")
               .click()
               .then(() => {
                  const filename = path.join(
                     Cypress.config("downloadsFolder"),
                     "app_Test"
                  );
                  cy.readFile(filename).should("contain", "");
               });
         });

         it("Delete TestApp", () => {
            cy.get('[view_id="abd_choose_list_list"]')
               .contains(appclicationDefault.name)
               .as(appclicationDefault.name)
               .parent()
               .parent()
               .find(".fa-cog")
               .should("exist")
               .click();
            cy.get('[view_id="abd_common_popupEditMenu_list_abd_choose_list"]')
               .contains("Delete")
               .should("be.visible")
               .click();
            cy.contains("Delete Application?").parent().contains("Yes").click();
            cy.get(`@${appclicationDefault.name}`).should("not.exist");
         });

         it.skip("Import TestApp", () => {});
      });
   });

   describe("Application page", () => {
      before(() => {
         // Delete this if the export is passed.
         cy.AuthLogin();
         cy.visit("/");
         navigateABDesigner(cy);
         cy.get('[data-cy="abd_choose_list_buttonCreateNewApplication"]')
            .should("exist")
            .click();
         cy.get('[data-cy="abd_choose_form_cancel"]').should("exist").click();
         cy.get('[view_id="abd_choose_list_list"]')
            .find(".webix_scroll_cont")
            .find(".webix_list_item")
            .should("have.length", 1);
         cy.get(
            '[data-cy="abd_choose_list_buttonCreateNewApplication"]'
         ).click();
         cy.get('[data-cy="abd_choose_form_label"]')
            .should("exist")
            .type(appclicationDefault.name);
         cy.get('[data-cy="abd_choose_form_icon"]').should("exist").click();
         cy.contains("fa-500px").should("exist").click();
         cy.get('[data-cy="abd_choose_form_description"]')
            .should("exist")
            .type(appclicationDefault.description);
         cy.get('[view_id="abd_choose_form_appFormPermissionList"]')
            .should("exist")
            .click();
         cy.contains("Select").should("exist").click();
         cy.get('[data-cy="abd_choose_form_saveButton"]')
            .should("exist")
            .click();
         cy.get('[view_id="abd_choose_list_list"]')
            .contains(appclicationDefault.description)
            .should("be.visible");
         cy.get('[view_id="abd_choose_list_list"]')
            .find(`.${appclicationDefault.icon}`)
            .should("be.visible");
         cy.get('[view_id="abd_choose_list_list"]')
            .contains(appclicationDefault.name)
            .should("be.visible")
            .click();
         cy.get('[view_id="abd_work_labelAppName"]').should(
            "include.text",
            appclicationDefault.name
         );
         cy.get('[view_id="abd_work_toolBar"]')
            .find(".fa-arrow-left")
            .should("exist")
            .click();
      });

      beforeEach(() => {
         navigateABDesignerApplication(cy, appclicationDefault.name);
      });

      describe("Objects", () => {
         it("Add new Objects", () => {
            cy.get('[webix_tm_id="abd_work_tab_object"]')
               .should("exist")
               .click();
            cy.get('[data-cy="ui_work_object_list_buttonNew"]')
               .should("exist")
               .click();
            cy.get('[data-cy="ui_work_object_list_newObject_blank_name"]')
               .should("be.visible")
               .type("test_object");
            cy.get('[data-cy="ui_work_object_list_newObject_blank_buttonSave"]')
               .should("exist")
               .click();
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object")
               .should("be.visible");
         });

         it("Warnings", () => {
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object")
               .as("test_object")
               .find(".fa-warning.pulseLight.smalltext")
               .should("be.visible");
            cy.get("@test_object").click();
            cy.get(
               '[view_id="abd_work_object_workspace_view_warnings_buttonWarning"]'
            )
               .as("buttonShowIssues")
               .should("be.visible")
               .and("contain", "Show Issues")
               .click();
            cy.get(
               '[view_id="abd_work_object_workspace_view_warnings_warnings"]'
            )
               .should("be.visible")
               .and("contain", "has no fields");
            cy.get(
               '[view_id="abd_work_object_workspace_view_warnings_buttonWarningHide"]'
            )
               .should("be.visible")
               .and("contain", "Hide Issues")
               .click();
            cy.get("@buttonShowIssues").should("be.visible");
         });

         it("Rename", () => {
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object")
               .find(".fa-cog")
               .should("be.visible")
               .click();
            cy.get(
               '[view_id="abd_common_popupEditMenu_menu_ui_work_object_list"]'
            )
               .contains("Rename")
               .click();
            cy.get(".webix_dt_editor")
               .find("input")
               .type("test_object_rename{enter}");
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object_rename")
               .should("exist");
         });

         it("Exclude & Include", () => {
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object_rename")
               .as("testObjectRename")
               .find(".fa-cog")
               .should("be.visible")
               .click();
            cy.get(
               '[view_id="abd_common_popupEditMenu_menu_ui_work_object_list"]'
            )
               .contains("Exclude")
               .click();
            cy.get("@testObjectRename").should("not.exist");
            cy.get('[data-cy="ui_work_object_list_buttonNew"]')
               .should("exist")
               .click();
            cy.contains("Existing").should("be.visible").click();
            cy.get('[view_id="ui_work_object_list_newObject_import_filter"]')
               .find("input")
               .type("test_object_rename");
            cy.get(
               '[view_id="ui_work_object_list_newObject_import_objectList"]'
            )
               .should("exist")
               .contains("test_object_rename")
               .should("exist")
               .click({ force: true });
            cy.get(
               '[view_id="ui_work_object_list_newObject_import_buttonSave"]'
            ).click();

            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object_rename")
               .should("exist");
         });

         it("Delete", () => {
            cy.get('[view_id="ui_work_object_list_list"]')
               .contains("test_object_rename")
               .as("testObjectRename")
               .find(".fa-cog")
               .should("be.visible")
               .click();
            cy.get(
               '[view_id="abd_common_popupEditMenu_menu_ui_work_object_list"]'
            )
               .contains("Delete")
               .click();
            cy.contains("Yes").click();
            cy.get("@testObjectRename").should("not.exist");
         });
      });

      describe("Queries", () => {
         it("Add new Queries", () => {
            cy.get('[webix_tm_id="abd_work_tab_query"]').click();
         });
      });

      describe("Data Collections", () => {
         it("Add new Data Collections", () => {
            cy.get('[webix_tm_id="abd_work_tab_datacollection"]').click();
         });
      });

      describe("Process", () => {
         it("Add a new Process", () => {
            cy.get('[webix_tm_id="abd_work_tab_processview"]').click();
         });
      });

      describe("Interface", () => {
         it("Add a new Interface", () => {
            cy.get('[webix_tm_id="abd_work_tab_interface"]').click();
         });
      });
   });
});
