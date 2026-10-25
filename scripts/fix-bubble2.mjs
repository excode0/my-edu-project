import fs from "fs";
import path from "path";

const dir = path.resolve("src/components/ui/bubble");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
// remove from import
code = code.replace(/,\s*bubbleReactionsVariants/g, "");
code = code.replace(/bubbleReactionsVariants\s*,\s*/g, "");
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
