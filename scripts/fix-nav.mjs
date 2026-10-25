import fs from "fs";
import path from "path";

const dir = path.resolve("src/components/ui/navigation-menu");
const def = path.join(dir, "default.tsx");
const varFile = path.join(dir, "variants.ts");
let code = fs.readFileSync(def, "utf8");
const match = code.match(/const\s+(navigationMenuTriggerStyle)\s*=\s*cva\([\s\S]*?\n\)\s*\n/);
if (match) {
  let v = fs.existsSync(varFile) ? fs.readFileSync(varFile, "utf8") : `import { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "cn"\n\n`;
  if (!v.includes("cva")) v = `import { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "cn"\n\n` + v.replace(/import[^\n]*\n/g, "");
  v += match[0] + "\nexport { navigationMenuTriggerStyle }\n\nexport type { VariantProps }\n";
  fs.writeFileSync(varFile, v);
  code = code.replace(match[0], "");
  code = code.replace(/import\s+\{[^}]*\}\s+from\s+["']\.\/variants["'];?\n?/g, "");
  code = `import { navigationMenuTriggerStyle } from "./variants"\n` + code;
  code = code.replace(/import\s+\{[^}]*cva[^}]*\}\s+from\s+["']class-variance-authority["']\s*\n?/g, "");
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("done");
