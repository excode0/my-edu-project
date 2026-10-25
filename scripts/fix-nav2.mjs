import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/navigation-menu");
const varFile = path.join(dir, "variants.ts");
let v = fs.readFileSync(varFile, "utf8");
v = v.replace(/export type \{ VariantProps \}\n/g, "");
v = v.trim() + "\n\nexport type { VariantProps }\n";
fs.writeFileSync(varFile, v);
console.log("done");
