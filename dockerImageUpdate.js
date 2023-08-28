#!/usr/bin/env node
//
// This is a helper script for refreshing the docker images for the running
// stack.
//
// Use when a new docker image is available for our services.
//
require("dotenv").config();
const version = require("./version");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

// const cwd = process.cwd();

const stack = ` ${process.env.STACKNAME}`;
const stackNoSpace = stack.replace(" ", "");

// const hashServices = {};
// {hash}  { imagetag : {serviceData} }
// collect a list of all the running images and their respective containers
// {serviceData} : { ID, NAME, MODE, REPLICAS, IMAGE, PORTS }

const wait = async (mS) => {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve();
      }, mS);
   });
};

/**
 * Reads the version from ./version.js and updates env variables.
 * @returns {string[]} docker image names for ab-services with the new tag
 */
async function updateVersion() {
   console.log(`Using meta version ${version.meta_version}`);
   const envPath = path.join(__dirname, ".env");
   let envContent = await fs.readFile(envPath, { encoding: "utf-8" });
   const images = [];
   Object.keys(version.services).forEach((service) => {
      const tag = version.services[service];
      // Image to pull
      images.push(`digiserve/ab-${service.replace(/_/g, "-")}:${tag}`);
      // Update the process env
      const envVar = `AB_${service.toUpperCase()}_VERSION`;
      process.env[envVar] = tag;
      // Update the .env file content
      const regex = new RegExp(`${envVar}=.+`);
      if (regex.test(envContent)) {
         envContent = envContent.replace(regex, `${envVar}=${tag}`);
      } else {
         console.log(`Could not match ${regex.toString()}`);
      }
   });
   await fs.writeFile(envPath, envContent, { encoding: "utf-8" });
   return images;
}

const runCommand = (command) =>
   new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
         if (error) {
            reject(error);

            return;
         }

         resolve({ /*error,*/ stdout, stderr });
      });
   });

const dbMigrate = async (branch) => {
   const response = await runCommand(
      `docker run --env-file .env --network=${stackNoSpace}_default digiserve/ab-migration-manager:${branch} node app.js`
   );

   return response;
};

// const getServices = async () => {
//    const colCommand = "docker service ls";
//    const command = `docker service ls | grep ${stack}_`;

//    const columns = [];
//    // {array} the headers of the columns from the docker service ls command

//    try {
//       const run = await runCommand(colCommand);
//       const colLine = run.stdout.split("\n").shift();

//       colLine.split(" ").map((part) => {
//          if (part.length > 0) {
//             columns.push(part);
//          }
//       });
//    } catch (err) {
//       console.error("Error getting service columns:", err);
//       throw err;
//    }

//    try {
//       let output = await runCommand(command);

//       const lines = output.stdout.split("\n");
//       lines.map((line) => {
//          let serviceHash = {};
//          let index = 0;
//          line.split(" ").map((part) => {
//             if (part.length > 0) {
//                serviceHash[columns[index]] = part;
//                index++;
//             }
//          });
//          if (serviceHash["IMAGE"]) {
//             hashServices[serviceHash["IMAGE"]] = serviceHash;
//          }
//       });

//       console.log();
//       console.log("Found Service Data:");
//       console.log(hashServices);
//       console.log();
//       return hashServices;
//    } catch (err) {
//       console.error(err);
//    }
// };

const updateImage = async (services) => {
   if (!services.length) return;

   const pendings = [];

   services.forEach((e) => {
      const command = `docker pull ${e} && echo "" && docker image ls | grep "${
         e.split(":")[0]
      }"`;

      pendings.push(runCommand(command));
   });

   const results = await Promise.all(pendings);

   const response = {
      stdout: "",
      stderr: "",
   };

   results.forEach((e) => {
      response.stdout = `${response.stdout}${e.stdout}\n`;

      if (e.stderr) response.stderr = `${response.stderr}${e.stderr}\n`;
   });

   return response;
};

// const updateConfig = async () => {
//    const response = await runCommand(
//       `docker stack deploy -c config-compose.yml${stack}`
//    );

//    await wait(5000);

//    while (
//       !(
//          await runCommand(
//             `docker service logs${stack}_config | tail -1 | grep "... config preparation complete" || true`
//          )
//       ).stdout
//    )
//       await wait(1000);

//    return response;
// };

const updateDockerCompose = async (services) => {
   if (!services.length) throw new Error("There are no Docker services up.");

   const response = await runCommand(
      `docker stack deploy -c docker-compose.yml -c docker-compose.override.yml${stack}`
   );

   return response;
};

const cleanOldImages = async (services) => {
   if (!services.length) return;

   const pendings = [];

   services.forEach((e) => {
      const command = `docker rmi $(docker images | grep "${e}" | grep "<none>" | awk '{print $3}') -f | true`;

      pendings.push(runCommand(command));
   });

   const results = await Promise.all(pendings);

   const response = {
      stdout: "",
      stderr: "",
   };

   results.forEach((e) => {
      response.stdout = `${response.stdout}${e.stdout}\n`;

      if (e.stderr) response.stderr = `${response.stderr}${e.stderr}\n`;
   });

   return response;
};

const processHandler = async (processName, callbackFunction, ...parameter) => {
   if (!processName)
      throw Error('The parameter "processName" should be "string" type');

   if (!callbackFunction)
      throw Error('The parameter "callbackFunction" should be "function" type');

   console.log(`${processName}:`);
   console.log();

   const response = await callbackFunction(...parameter);

   console.log(response.stdout);

   if (response.stderr) console.log(response.stderr);

   console.log();
};

const Do = async () => {
   try {
      // const services = await getServices();
      const listServices = await updateVersion();

      // our migration image also needs to be updated:
      let branchMigrate = process.env.AB_MIGRATION_MANAGER_VERSION || "master";
      // if (listServices.length) {
      //    let ab = listServices.find((s) => s.indexOf("appbuilder") > -1);
      //    if (ab) {
      //       branchMigrate = ab.split(":")[1];
      //       if (!branchMigrate) branchMigrate = "master";
      //    }
      // }
      listServices.unshift(`digiserve/ab-migration-manager:${branchMigrate}`);

      await processHandler("Updating Images", updateImage, listServices);

      // await processHandler("Reseting config", updateConfig);

      await processHandler("DB Migrations", dbMigrate, branchMigrate);

      await wait(30000);

      await processHandler(
         "Updating services",
         updateDockerCompose,
         listServices
      );

      await processHandler("Cleaning old images", cleanOldImages, listServices);

      console.log("... done");
      console.log();
   } catch (error) {
      console.error(error);
      console.error();
   }
};

Do();
