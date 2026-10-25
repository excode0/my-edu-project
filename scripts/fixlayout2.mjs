import fs from "fs";
const p = "src/app/layout.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.replace(/LayoutProps<[^>]+>/g, "{ children: React.ReactNode }");
fs.writeFileSync(p, c);
console.log("done");
