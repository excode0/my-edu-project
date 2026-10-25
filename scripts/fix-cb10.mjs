import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/code-block");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/import \{ cva \} from "class-variance-authority"\n/g, "");
code = code.replace(/import \{ cn \} from "cn"\n/, 'import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
