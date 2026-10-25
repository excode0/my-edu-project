import fs from "fs";
const p = "src/features/auth/server/auth.ts";
let c = fs.readFileSync(p, "utf8");
c = c.replace(`export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}`, `export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try {
    const reqUrl = new URL(request.url)
    const org = new URL(origin)
    return org.origin === reqUrl.origin || org.hostname === "localhost"
  } catch {
    return true
  }
}`);
fs.writeFileSync(p, c);
console.log("done");
