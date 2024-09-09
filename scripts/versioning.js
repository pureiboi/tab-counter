const {version} = require('../package.json');
const fs = require("fs");
const path = require("path");
const replaceJSONProperty = require('replace-json-property');

sourcePath = "."

fs.readdirSync(sourcePath)
  .filter(fn => fn.startsWith("manifest") && fn.endsWith(".json"))
  .forEach(file => {

    console.log(path.join(sourcePath, file))
    let manifestFile = path.join(sourcePath, file)
    replaceJSONProperty.replace(manifestFile, "version", version);
  })
