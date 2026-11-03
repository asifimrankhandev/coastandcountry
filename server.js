import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".mjs": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=UTF-8",
};

const server = http.createServer((req, res) => {
  // Normalize and parse URL pathname
  let reqPath = decodeURI(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";

  // Prevent directory traversal attacks
  const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(__dirname, safePath);

  // If path doesn't have an extension and doesn't exist, try appending .html
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    }
  }

  // Check if file exists and is a regular file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 404 Fallback
  const notFoundPath = path.join(__dirname, "404.html");
  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

function startServer(currentPort) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${currentPort} is in use, trying port ${currentPort + 1}...`);
      startServer(currentPort + 1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  server.listen(currentPort, () => {
    console.log(`\n  Coast & Country Homes website is running at:\n`);
    console.log(`  > Local:   http://localhost:${currentPort}/\n`);
    console.log(`  Press Ctrl+C to stop.\n`);
  });
}

startServer(port);
