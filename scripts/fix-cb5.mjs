import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
// revert codeblock line to variant
// line
code = code.replace(/highlighted = false,/g, 'variant = "default",');
code = code.replace(/data-highlighted=\{highlighted\}/g, 'data-variant={variant}');
code = code.replace(/codeBlockLineVariants\(\{ highlighted \}\)/g, 'codeBlockLineVariants({ variant })');
// codeblock
code = code.replace(/variant = "default",(\s*size)/g, 'highlighted = false,$1');
code = code.replace(/data-variant=\{variant\}/g, 'data-highlighted={highlighted}');
code = code.replace(/codeBlockVariants\(\{ variant \}\)/g, 'codeBlockVariants({ variant: highlighted })');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
