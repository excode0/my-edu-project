import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
// revert completely
// codeblock line back
code = code.replace(/variant = "default",/g, 'highlighted = false,');
code = code.replace(/data-variant=\{variant\}/g, 'data-highlighted={highlighted}');
code = code.replace(/codeBlockLineVariants\(\{ variant \}\)/g, 'codeBlockLineVariants({ highlighted })');
// codeblock
code = code.replace(/highlighted = false,/g, 'variant = "default",');
code = code.replace(/data-highlighted=\{highlighted\}/g, 'data-variant={variant}');
code = code.replace(/codeBlockVariants\(\{ variant: highlighted \}\)/g, 'codeBlockVariants({ variant })');
code = code.replace(/codeBlockVariants\(\{ variant \}\)/g, 'codeBlockVariants({ variant })');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
