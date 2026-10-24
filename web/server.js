/**
 * 彰化大村武魁祠 × AMR 智慧導覽島嶼
 * 零依賴 本地靜態 HTTP 伺服器 (Zero-Dependency Node.js Static Server)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  // 處理 URL
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") {
    reqPath = "/index.html";
  }

  const safePath = path.normalize(path.join(BASE_DIR, reqPath));

  // 安全路徑檢查 (防止目錄穿越)
  if (!safePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 禁止訪問");
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>404 找不到檔案</h2><p>找不到路徑: ${reqPath}</p>`);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache"
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("==================================================================");
  console.log("  🏛️  大村武魁祠 × AMR 智慧導覽 3D 浮島互動網頁已啟動！");
  console.log(`  🔗 本地網址: http://localhost:${PORT}`);
  console.log("  📍 彰化縣定古蹟「大村武魁新厝」 12 個獨立用例 3D 體驗");
  console.log("  💡 按下 Ctrl+C 可停止伺服器");
  console.log("==================================================================");
});

