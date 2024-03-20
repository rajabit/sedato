const fs = require("fs");

const folderName = "test/test/Documents/2024-03-20T20:09:36.359Z"
try {
     if (!fs.existsSync(folderName)) {
          fs.mkdirSync(folderName, {recursive: true}, err => {});
     }
} catch (err) {
     console.error(err);
}