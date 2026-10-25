import fs from "fs";
import path from "path";

const uiDir = path.resolve("src/components/ui");
const entries = fs.readdirSync(uiDir, { withFileTypes: true });
for (const e of entries) {
  if (!e.isDirectory()) continue;
  const dir = path.join(uiDir, e.name);
  const def = path.join(dir, "default.tsx");
  const varFile = path.join(dir, "variants.ts");
  if (!fs.existsSync(def)) continue;
  let code = fs.readFileSync(def, "utf8");
  if (fs.existsSync(varFile)) {
    const v = fs.readFileSync(varFile, "utf8");
    const m = v.match(/const\s+(\w+Variants)\b/);
    if (m) {
      const varName = m[1];
      code = code.replace(/import\s+\{[^}]*cva[^}]*\}\s+from\s+["']class-variance-authority["']\s*\n?/g, "");
      code = code.replace(/import\s+type\s+\{\s*VariantProps\s*\}\s+from\s+["']class-variance-authority["']\s*\n?/g, "");
      if (!code.includes('from "./variants"')) {
        code = code.replace(/^(import[^\n]*\n)+/m, (imp) => imp + `import { ${varName}, type VariantProps } from "./variants"\n`);
      } else {
        code = code.replace(/import\s+\{([^}]+)\}\s+from\s+["']\.\/variants["']/g, (all, inner) => {
          if (inner.includes("VariantProps")) return all;
          return `import { ${inner.trim().replace(/,\s*$/, "")}, type VariantProps } from "./variants"`;
        });
      }
    }
  }
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("fixed");
