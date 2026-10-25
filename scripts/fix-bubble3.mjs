import fs from "fs";
import path from "path";

const dir = path.resolve("src/components/ui/bubble");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
// add inline cva
const v = `const bubbleReactionsVariants = cva(
  "bg-background absolute flex items-center gap-1 rounded-full border p-1 text-xs shadow-sm [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      side: {
        top: "-top-6",
        bottom: "-bottom-6",
      },
      align: {
        start: "start-0",
        end: "end-0",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
)\n\n`;
if (!code.includes("bubbleReactionsVariants")) {
  // add imports
  if (!code.includes("cva")) {
    code = `import { cva } from "class-variance-authority"\n` + code;
  }
  // add before function
  code = code.replace(/function BubbleReactions/, v + "function BubbleReactions");
  fs.writeFileSync(def, code.trim() + "\n");
}
console.log("done");
