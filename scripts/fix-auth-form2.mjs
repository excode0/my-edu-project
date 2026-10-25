import fs from "fs";
const p = "src/features/auth/components/auth-form.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.replace("  async function submit(event: React.FormEvent<HTMLFormElement>) {\n    event.preventDefault()\n    console.log(\"Submitting form...\")", "  async function submit(event: React.FormEvent<HTMLFormElement>) {\n    event.preventDefault()\n    try { console.log(\"Submitting form...\") } catch {}");
fs.writeFileSync(p, c);
console.log("done");
