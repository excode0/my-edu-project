import fs from "fs";
import path from "path";
const d = path.resolve("src/components/ui/button");
console.log(fs.readFileSync(path.join(d,"index.tsx"),"utf8"));
