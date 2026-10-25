import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/VariantProps<typeof codeBlockLineVariants>/g, '{ variant?: "default" | "highlighted" }');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
