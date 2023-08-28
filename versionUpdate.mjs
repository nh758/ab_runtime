/**
 * versionUpdate
 * This script is meant to be used by CI workflows to update a service's new version
 * in the version.json file.
 * Usage: `node versionUpdate service [name] [newVersion]`
 * Usage: `node versionUpdate version [newVersion]`
 */

import path from "path";
import fs from "fs/promises";

const versionPath = path.join(process.cwd(), "version.json");

async function getVersionFile() {
   try {
      const contents = await fs.readFile(versionPath, { encoding: "utf-8" });
      return JSON.parse(contents);
   } catch (err) {
      console.error(`Error reading version file:\n`, err);
      process.exit();
   }
}

async function writeVersionFile(contents) {
   try {
      await fs.writeFile(versionPath, JSON.stringify(contents, null, 3), {
         encoding: "utf-8",
      });
   } catch (err) {
      console.error(`Error writing version file:\n`, err);
      process.exit();
   }
}

async function updateServiceVersion(service, newVersion) {
   const versions = await getVersionFile();
   const old = versions.services[service];
   if (!old) {
      console.log(
         "Invalid service name '%s', valid service names: \n - %s",
         service,
         Object.keys(versions.services).join("\n - ")
      );
      process.exit();
   }
   versions.services[service] = newVersion;
   writeVersionFile(versions);
   console.log("Updated %s from %s to %s", service, old, newVersion);
}

async function updateMetaVersion(version) {
   const versions = await getVersionFile();
   versions.version = version;
   writeVersionFile(versions);
}

const [, , command, arg1, version] = process.argv;
switch (command) {
   case "service":
      if (!arg1) {
         console.log(
            "Expected argument name (service name)\nusage: node versionUpdate service [name] [version]"
         );
         process.exit();
      }
      if (!version) {
         console.log(
            "Expected argument version\nusage: node versionUpdate service [name] [version]"
         );
         process.exit();
      }
      updateServiceVersion(arg1, version);
      break;
   case "version":
      if (!arg1) {
         console.log(
            "Expected argument type\nusage: node versionUpdate version [version]"
         );
         process.exit();
      }
      updateMetaVersion(arg1);
      break;
   default:
      console.log(
         "Unkown command: %s\nusage: node versionUpdate [ service | version ] ",
         command
      );
}
