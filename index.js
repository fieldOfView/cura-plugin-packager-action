const core = require("@actions/core");

const fs = require("fs");
const path = require("path");

const archiver = require("archiver");

// most @actions toolkit packages have async methods
async function run() {
  try {
    const sourcePath = core.getInput("source_folder");
    let pluginId = core.getInput("plugin_id");
    let packageInfoPath = core.getInput("package_info_path")

    const staticFilePath = fs.existsSync(__dirname + "/files") ? __dirname + "/files" : __dirname + "/dist/files";

    // get package info, or load "empty" package info template
    if (packageInfoPath == "" || !fs.existsSync(packageInfoPath)){
      packageInfoPath = staticFilePath + "/package.json";
    }

    let packageInfo = {};
    try {
      const packageInfoData = fs.readFileSync(packageInfoPath, "utf8");

      // parse JSON string to JSON object
      packageInfo = JSON.parse(packageInfoData);
    } catch (err) {
      throw err;
    }

    // get plugin info
    let pluginInfo = {};
    try {
      const pluginInfoData = fs.readFileSync(sourcePath + "/plugin.json", "utf8");

      // parse JSON string to JSON object
      pluginInfo = JSON.parse(pluginInfoData);
    } catch (err) {
      throw err;
    }

    if (pluginId == "") {
      pluginId = packageInfo["package_id"];
    }

    const pluginVersion = pluginInfo["version"]

    core.info(`Creating curapackages for ${pluginId} ${pluginVersion}...`);

    // copy plugin info into package info
    packageInfo["package_id"] = pluginId;
    packageInfo["package_version"] = pluginVersion;
    packageInfo["display_name"] = pluginInfo["name"];
    if (packageInfoPath == staticFilePath + "/package.json") {
      packageInfo["description"] = pluginInfo["description"];
    }

    const supportedSDKVersions = pluginInfo["supported_sdk_versions"];
    const majorSDKVersions = new Set(supportedSDKVersions.map(function (versionString) {
      return parseInt(versionString.split(".")[0]);
    }));

    let packageFiles = [];

    majorSDKVersions.forEach(function(majorVersion) {
      const semanticVersion = `${majorVersion}.0.0`;
      let curaVersions = "";
      switch(majorVersion) {
        case 5: curaVersions = "3.5-3.6";
        break;

        case 6: curaVersions = "4.0-4.3";
        break;

        case 7: curaVersions = "4.4-4.13";
        break;

        case 8: curaVersions = "5.0";
        break;

        default: curaVersions = "Unknown";
      }
      const archiveFileName = `${pluginId}_v${pluginVersion}_Cura${curaVersions}.curapackage`;
      core.info(` -- ${archiveFileName}...`);
      packageFiles.push(archiveFileName);

      packageInfo["sdk_version"] = majorVersion;
      packageInfo["sdk_version_semver"] = semanticVersion;

      // create a file to stream archive data to.
      const output = fs.createWriteStream(archiveFileName);
      const archive = archiver("zip", {
        zlib: { level: 9 } // Sets the compression level.
      });

      // listen for all archive data to be written
      // "close" event is fired only when a file descriptor is involved
      output.on("close", function() {
        core.info(archive.pointer() + " total bytes");
        core.info("archiver has been finalized and the output file descriptor has closed.");
      });

      // This event is fired when the data source is drained no matter what was the data source.
      // It is not part of this library but rather from the NodeJS Stream API.
      // @see: https://nodejs.org/api/stream.html#stream_event_end
      output.on("end", function() {
        core.info("Data has been drained");
      });

      // good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on("warning", function(err) {
        if (err.code === "ENOENT") {
          // log warning
          core.info(err.message);
        } else {
          // throw error
          throw err;
        }
      });

      // good practice to catch this error explicitly
      archive.on("error", function(err) {
        throw err;
      });

      // pipe archive data to the file
      archive.pipe(output);

      archive.directory(
        sourcePath,
        "files/plugins/" + pluginId,
        file => file.name.startsWith(".git") ? false : file
      );

      archive.append(
        JSON.stringify(packageInfo),
        {name: "package.json"}
      );

      archive.file(
        staticFilePath + "/[Content_Types].xml",
        {name: "[Content_Types].xml"}
      );

      archive.directory(
        staticFilePath + "/_rels",
        "_rels"
      );

      // finalize the archive (ie we are done appending files but streams have to finish yet)
      // "close", "end" or "finish" may be fired right after calling this method so register to them beforehand
      archive.finalize();
    });

    core.setOutput("packages", packageFiles);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Main
run();
