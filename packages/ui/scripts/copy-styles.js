const fs = require("fs");
const path = require("path");

const sourcePath = path.resolve(__dirname, "..", "src", "styles", "tokens.css");
const targetDir = path.resolve(__dirname, "..", "dist", "styles");
const targetPath = path.join(targetDir, "tokens.css");

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
