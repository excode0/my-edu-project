import fs from "fs";
import path from "path";
const uiDir = path.resolve("src/components/ui");
const entries = fs.readdirSync(uiDir, {withFileTypes:true});
for (const e of entries) {
  if (e.isDirectory()) {
    const name = e.name;
    const top = path.join(uiDir, name + ".tsx");
    if (fs.existsSync(top)) {
      // check if it re-exports from folder
      const content = fs.readFileSync(top, "utf8");
      if (content.includes(`from "./${name}"`) && !content.includes(`from "./${name}/index"`)) {
        // sometimes works, but better to be explicit
      }
    }
  }
}
console.log("ok");
