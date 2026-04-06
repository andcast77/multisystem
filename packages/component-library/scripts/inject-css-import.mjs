/**
 * Vite library mode emits CSS as a separate file and does not leave `import './index.css'`
 * in the JS bundle. Prepending it lets consumers load styles by importing `@multisystem/ui` alone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const jsPath = path.join(distDir, "index.js");
const cssName = "index.css";

if (!fs.existsSync(jsPath)) {
  console.error("inject-css-import: dist/index.js not found. Run vite build first.");
  process.exit(1);
}
if (!fs.existsSync(path.join(distDir, cssName))) {
  console.error(`inject-css-import: dist/${cssName} not found.`);
  process.exit(1);
}

let js = fs.readFileSync(jsPath, "utf8");
const marker = `import './${cssName}'`;
if (js.includes(marker)) {
  console.log("inject-css-import: CSS import already present, skipping.");
  process.exit(0);
}

fs.writeFileSync(jsPath, `${marker};\n${js}`);
console.log("inject-css-import: prepended CSS import to dist/index.js");
