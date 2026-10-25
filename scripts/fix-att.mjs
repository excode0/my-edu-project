import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/attachment");
const def = path.join(dir, "default.tsx");
const varFile = path.join(dir, "variants.ts");
let code = fs.readFileSync(def, "utf8");
const m = code.match(/const\s+(attachmentMediaVariants)\s*=\s*cva\([\s\S]*?\n\)\s*\n/);
if (m) {
  let v = fs.readFileSync(varFile, "utf8");
  v += "\n" + m[0] + "\nexport { attachmentMediaVariants }\n\nexport type { VariantProps }\n";
  fs.writeFileSync(varFile, v);
  code = code.replace(m[0], "");
  fs.writeFileSync(def, code.trim() + "\n");
} else {
  // just remove import
  code = code.replace(/,\s*attachmentMediaVariants/g, "");
  code = code.replace(/attachmentMediaVariants\s*,\s*/g, "");
  if (!code.includes("cva") && code.includes("attachmentMediaVariants")) {
    code = `import { cva } from "class-variance-authority"\n` + code;
  }
  // add inline
  const v2 = `const attachmentMediaVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
  {
    variants: {
      variant: {
        image: "size-8 object-cover",
        file: "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "image",
    },
  }
)

`;
  code = code.replace(/function AttachmentMedia\(/, v2 + "function AttachmentMedia(");
  if (!code.includes("import { cva")) {
    code = code.replace(/import \{ cn \} from "cn"\n/, `import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n`);
  }
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("done");
