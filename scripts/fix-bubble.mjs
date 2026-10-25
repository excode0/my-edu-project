import fs from "fs";
import path from "path";

const dir = path.resolve("src/components/ui/bubble");
const def = path.join(dir, "default.tsx");
const varFile = path.join(dir, "variants.ts");
let code = fs.readFileSync(def, "utf8");
const m = code.match(/const\s+(bubbleReactionsVariants)\s*=\s*cva\([\s\S]*?\n\)\s*\n/);
if (m) {
  let v = fs.readFileSync(varFile, "utf8");
  v += "\n" + m[0] + "\nexport { bubbleReactionsVariants }\n\nexport type { VariantProps }\n";
  fs.writeFileSync(varFile, v);
  code = code.replace(m[0], "");
  // fix import
  code = code.replace(/import\s+\{([^}]+)\}\s+from\s+["']\.\/variants["']/g, (all, inner) => {
    if (!inner.includes("bubbleReactionsVariants")) inner = inner.trim() + ", bubbleReactionsVariants";
    return `import { ${inner.trim()} } from "./variants"`;
  });
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("done");
