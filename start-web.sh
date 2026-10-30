#!/usr/bin/env bash
# ====================================================================
# 彰化大村武魁祠 × AMR 智慧導覽 3D 浮島網頁啟動腳本 (Linux / macOS)
# ====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
URL="http://localhost:${PORT}"

# 設定終端機標題 (支援大部分 terminal)
printf '\033]2;%s\007' "彰化大村武魁祠 × AMR 智慧導覽 3D 浮島網頁" 2>/dev/null || true

echo "===================================================================="
echo "  🏛️  正在啟動 大村武魁祠 × AMR 智慧導覽 3D 互動島嶼 (UC01~UC12) ... "
echo "===================================================================="
echo ""

# 背景嘗試開啟預設瀏覽器 (macOS: open, Linux: xdg-open)
open_browser() {
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  fi
}

echo "正在開啟瀏覽器至 ${URL} ..."
open_browser &
BROWSER_PID=$!

echo ""
cd "${SCRIPT_DIR}/web"

# 檢查 Node.js 環境
if command -v node >/dev/null 2>&1; then
  node server.js
elif command -v python3 >/dev/null 2>&1; then
  echo "⚠️  未偵測到 Node.js，自動切換使用 Python 3 靜態 HTTP 伺服器啟動..."
  echo "  🔗 本地網址: ${URL}"
  echo "  💡 按下 Ctrl+C 可停止伺服器"
  python3 -m http.server "${PORT}"
else
  echo "❌ 錯誤：未找到 Node.js 或 Python 3 環境！"
  echo "請安裝 Node.js (https://nodejs.org/) 後再次執行此腳本。"
  kill "${BROWSER_PID}" 2>/dev/null || true
  exit 1
fi
