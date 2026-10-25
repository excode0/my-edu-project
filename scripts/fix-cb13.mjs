import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/const codeBlockLineVariants[\s\S]*?\n\)\s*\n/, `const codeBlockLineVariants = cva("", {
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

`);
code = code.replace(/variant = "default",/g, 'highlighted = false,');
code = code.replace(/data-variant=\{variant\}/g, 'data-highlighted={highlighted}');
code = code.replace(/codeBlockLineVariants\(\{ variant \}\)/g, 'codeBlockLineVariants({ highlighted })');
code = code.replace(/VariantProps<typeof codeBlockLineVariants>/g, '{ highlighted?: boolean }');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
