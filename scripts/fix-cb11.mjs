import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/const codeBlockLineVariants[\s\S]*?\n\)\s*\n/, `const codeBlockLineVariants = cva("", {
  variants: {
    variant: {
      default: "",
      highlighted: "bg-accent/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

`);
// fix line usage
code = code.replace(/highlighted = false,/g, 'variant = "default",');
code = code.replace(/data-highlighted=\{highlighted\}/g, 'data-variant={variant}');
code = code.replace(/codeBlockLineVariants\(\{ highlighted \}\)/g, 'codeBlockLineVariants({ variant })');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
