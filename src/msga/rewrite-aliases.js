import fs from "fs";
import path from "path";

const targetDir = process.argv[2] || "./dist";

function rewriteAliases(dir) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      rewriteAliases(filePath);
    } else if (filePath.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf8");
      content = content.replace(/from\s+['"]@\/(.*?)['"]/g, "from './$1.js'");
      fs.writeFileSync(filePath, content);
    }
  }
}

rewriteAliases(targetDir);
console.log(`Aliases rewritten in ${targetDir}`);