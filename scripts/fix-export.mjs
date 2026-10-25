import fs from "fs";
import path from "path";

const uiDir = path.resolve("src/components/ui");
const entries = fs.readdirSync(uiDir, { withFileTypes: true });
for (const e of entries) {
  if (!e.isDirectory()) continue;
  const dir = path.join(uiDir, e.name);
  const varFile = path.join(dir, "variants.ts");
  if (!fs.existsSync(varFile)) continue;
  let code = fs.readFileSync(varFile, "utf8");
  if (!code.includes("export type { VariantProps }") && !code.includes("export { type VariantProps }")) {
    code = code.trim() + "\n\nexport type { VariantProps }\n";
    fs.writeFileSync(varFile, code);
  }
}
console.log("done");
