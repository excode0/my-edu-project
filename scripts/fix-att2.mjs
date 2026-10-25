import fs from "fs";
import path from "path";
const dir = path.resolve("src/components/ui/attachment");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace(/variant:\s*\{\s*image:\s*"[^"]*",\s*file:\s*"[^"]*",?\s*\}/, `variant: {
        image: "size-8 object-cover",
        file: "size-8 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8 [&_svg:not([class*='size-'])]:size-4",
      }`);
code = code.replace(/variant = "icon"/, 'variant = "file"');
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
