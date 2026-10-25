import fs from "fs";
import path from "path";
const uiDir = path.resolve("src/components/ui");
const entries = fs.readdirSync(uiDir, {withFileTypes:true});
for (const e of entries) {
  if (!e.isDirectory()) continue;
  const dir = path.join(uiDir, e.name);
  const idx = path.join(dir, "index.tsx");
  if (!fs.existsSync(idx)) continue;
  let c = fs.readFileSync(idx, "utf8");
  // ensure variants first if exists
  const hasVar = fs.existsSync(path.join(dir, "variants.ts"));
  const hasDef = fs.existsSync(path.join(dir, "default.tsx"));
  if (hasVar && hasDef) {
    c = 'export * from "./variants"\nexport * from "./default"\n';
  } else if (hasDef) {
    c = 'export * from "./default"\n';
  } else if (hasVar) {
    c = 'export * from "./variants"\n';
  }
  fs.writeFileSync(idx, c);
}
console.log("done");
