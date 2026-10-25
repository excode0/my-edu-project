import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/,\s*codeBlockLineVariants/g, "");
code = code.replace(/codeBlockLineVariants\s*,\s*/g, "");
const v = `const codeBlockLineVariants = cva("", {
  variants: {
    highlighted: {
      true: "bg-accent/50",
      false: "",
    },
  },
  defaultVariants: {
    highlighted: false,
  },
})

`;
if (!code.includes("cva")) code = code.replace(/import \{ cn \} from "cn"\n/, `import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n`);
code = code.replace(/function CodeBlockLine\(/, v + "function CodeBlockLine(");
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
