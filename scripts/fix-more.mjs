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
  if (code.match(/cva\(/)) {
    // extract all cva blocks
    const regex = /const\s+(\w+Variants)\s*=\s*cva\([\s\S]*?\n\)\s*\n/g;
    let match;
    let added = new Set();
    if (!fs.existsSync(varFile)) {
      // create variants
      let vcode = `import { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "cn"\n\n`;
      regex.lastIndex = 0;
      while ((match = regex.exec(code)) !== null) {
        vcode += match[0] + "\n";
        added.add(match[1]);
      }
      for (const a of added) vcode += `export { ${a} }\n`;
      vcode += `\nexport type { VariantProps }\n`;
      fs.writeFileSync(varFile, vcode);
    }
    // remove cva blocks from default and add imports
    regex.lastIndex = 0;
    while ((match = regex.exec(code)) !== null) {
      const name = match[1];
      added.add(name);
      code = code.replace(match[0], "");
    }
    if (!code.includes('from "./variants"')) {
      code = code.replace(/^(import[^\n]*\n)+/m, (imp) => imp + `import { ${Array.from(added).join(", ")}, type VariantProps } from "./variants"\n`);
    } else {
      code = code.replace(/import\s+\{([^}]+)\}\s+from\s+["']\.\/variants["']/g, (all, inner) => {
        let s = inner;
        for (const a of added) if (!s.includes(a)) s += `, ${a}`;
        if (!s.includes("VariantProps")) s = s.trim().replace(/,\s*$/, "") + ", type VariantProps";
        return `import { ${s.trim().replace(/^,\s*/, "")} } from "./variants"`;
      });
    }
    code = code.replace(/import\s+\{[^}]*cva[^}]*\}\s+from\s+["']class-variance-authority["']\s*\n?/g, "");
    fs.writeFileSync(def, code.trim() + "\n");
  }
}
console.log("done");
