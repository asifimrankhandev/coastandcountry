import fs from "node:fs";

const filesInOrder = [
  "assets/js/config/site-config.js",
  "assets/js/lib/text.js",
  "assets/js/lib/dom.js",
  "assets/js/properties/format-property.js",
  "assets/js/properties/map-property.js",
  "assets/js/properties/property-api.js",
  "assets/js/components/count-up.js",
  "assets/js/components/scroll-reveal.js",
  "assets/js/components/site-header.js",
  "assets/js/components/site-menu.js",
  "assets/js/components/stack-sections.js",
  "assets/js/home/hero-intro.js",
  "assets/js/home/figures-section.js",
  "assets/js/home/featured-carousel.js",
  "assets/js/main.js",
];

let bundleContent = "(function () {\n  \"use strict\";\n\n";

for (const relPath of filesInOrder) {
  let code = fs.readFileSync(relPath, "utf8");
  code = code.replace(/^\s*import\s+[^;]+;\s*$/gm, "");
  code = code.replace(/^\s*export\s+const\s+/gm, "const ");
  code = code.replace(/^\s*export\s+function\s+/gm, "function ");
  code = code.replace(/^\s*export\s+async\s+function\s+/gm, "async function ");
  code = code.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "");
  code = code.replace(/^\s*export\s+default\s+/gm, "");

  if (relPath.includes("site-menu.js")) {
    code = code.replace("const FEATURED_LIMIT = 3;", "const MENU_FEATURED_LIMIT = 3;");
    code = code.replace("FEATURED_LIMIT", "MENU_FEATURED_LIMIT");
  }

  bundleContent += `  // --- ${relPath} ---\n` + code.split("\n").map((line) => "  " + line).join("\n") + "\n\n";
}

bundleContent += "})();\n";

fs.writeFileSync("assets/js/bundle.js", bundleContent, "utf8");
console.log("Built assets/js/bundle.js successfully!");

