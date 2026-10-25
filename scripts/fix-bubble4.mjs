import fs from "fs";
import path from "path";

const dir = path.resolve("src/components/ui/bubble");
const def = path.join(dir, "default.tsx");
let code = fs.readFileSync(def, "utf8");
code = code.replace('import { cva } from "class-variance-authority"\n', '');
code = code.replace('import { cva, type VariantProps } from "class-variance-authority"\n', '');
code = code.replace('import { cn } from "cn"\n', 'import { cn } from "cn"\nimport { cva } from "class-variance-authority"\n');
const v = `const bubbleReactionsVariants = cva(
  "bg-background absolute flex items-center gap-1 rounded-full border p-1 text-xs shadow-sm [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      side: { top: "-top-6", bottom: "-bottom-6" },
      align: { start: "start-0", end: "end-0" },
    },
    defaultVariants: { side: "bottom", align: "end" },
  }
)

`;
code = code.replace(/function BubbleReactions\(/, v + "function BubbleReactions(");
fs.writeFileSync(def, code.trim() + "\n");
console.log("done");
