import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/input-group");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/,\s*inputGroupButtonVariants/g, "");
code = code.replace(/inputGroupButtonVariants\s*,\s*/g, "");
const v = `const inputGroupButtonVariants = cva(
  "text-sm shadow-none flex gap-2 items-center",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&_svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
        sm: "h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5",
        "icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

`;
if (!code.includes("cva")) code = code.replace(/import \{ cn \} from "cn"\n/, `import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n`);
code = code.replace(/function InputGroupButton\(/, v + "function InputGroupButton(");
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
