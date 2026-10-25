import fs from "fs";
const p = "src/app/layout.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.replace("export default function RootLayout({ children }: LayoutProps</\">) {", "export default function RootLayout({ children }: { children: React.ReactNode }) {");
c = c.replace("export default function RootLayout({ children }: LayoutProps<'/'>) {", "export default function RootLayout({ children }: { children: React.ReactNode }) {");
fs.writeFileSync(p, c);
console.log("done");
