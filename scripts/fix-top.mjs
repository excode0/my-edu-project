import fs from "fs";
import path from "path";
const uiDir = path.resolve("src/components/ui");
const entries = fs.readdirSync(uiDir, {withFileTypes:true});
for (const e of entries) {
  if (e.isDirectory()) {
    const name = e.name;
    const top = path.join(uiDir, name + ".tsx");
    fs.writeFileSync(top, `export * from "./${name}/index"\n`);
  }
}
console.log("done");
