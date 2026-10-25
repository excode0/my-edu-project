import fs from "fs";
import path from "path";

const uiDir = path.resolve("src/components/ui");
const files = fs.readdirSync(uiDir).filter((f) => {
  const full = path.join(uiDir, f);
  return f.endsWith(".tsx") && fs.statSync(full).isFile();
});

for (const file of files) {
  const name = file.replace(".tsx", "");
  const dir = path.join(uiDir, name);
  if (fs.existsSync(dir)) continue;
  fs.mkdirSync(dir, { recursive: true });

  const content = fs.readFileSync(path.join(uiDir, file), "utf8");
  console.log("Processing", name);

  const cvaMatch = content.match(/const\s+(\w+Variants)\s*=\s*cva\([\s\S]*?\n\)\s*\n/);
  let variantsCode = "";
  let rest = content;

  if (cvaMatch) {
    const varName = cvaMatch[1];
    variantsCode = `import { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "cn"\n\n${cvaMatch[0]}\n\nexport { ${varName} }\n`;
    fs.writeFileSync(path.join(dir, "variants.ts"), variantsCode);
    rest = content.replace(cvaMatch[0], "");
  }

  let defaultCode = rest;
  if (cvaMatch) {
    const varName = cvaMatch[1];
    if (!defaultCode.includes('from "./variants"')) {
      defaultCode = defaultCode.replace(/^(import[^\n]*\n)+/m, (m) => {
        return m + `import { ${varName}, type VariantProps } from "./variants"\n`;
      });
    }
  }

  fs.writeFileSync(path.join(dir, "default.tsx"), defaultCode.trim() + "\n");

  const exports = [];
  if (cvaMatch) exports.push('export * from "./variants"');
  exports.push('export * from "./default"');
  fs.writeFileSync(path.join(dir, "index.tsx"), exports.join("\n") + "\n");

  fs.writeFileSync(path.join(uiDir, name + ".tsx"), `export * from "./${name}"\n`);
}

console.log("Done", files.length);
