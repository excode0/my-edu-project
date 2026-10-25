import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/item");
const def = path.join(dir, "default.tsx");
const varFile = path.join(dir, "variants.ts");
let code = fs.readFileSync(def, "utf8");
const m = code.match(/const\s+(itemMediaVariants)\s*=\s*cva\([\s\S]*?\n\)\s*\n/);
if (m) {
  let v = fs.readFileSync(varFile, "utf8");
  v += "\n" + m[0] + "\nexport { itemMediaVariants }\n\nexport type { VariantProps }\n";
  fs.writeFileSync(varFile, v);
  code = code.replace(m[0], "");
  fs.writeFileSync(def, code.trim() + "\n");
} else {
  code = code.replace(/,\s*itemMediaVariants/g, "");
  code = code.replace(/itemMediaVariants\s*,\s*/g, "");
  const v2 = `const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

`;
  if (!code.includes("cva")) {
    code = code.replace(/import \{ cn \} from "cn"\n/, `import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n`);
  }
  code = code.replace(/function ItemMedia\(/, v2 + "function ItemMedia(");
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("done");
