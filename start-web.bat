@echo off
chcp 65001 >nul
title 彰化大村武魁祠 × AMR 智慧導覽 3D 浮島網頁
echo ====================================================================
echo   正在啟動 大村武魁祠 × AMR 智慧導覽 3D 互動島嶼 (UC01~UC12) ...
echo ====================================================================
echo.
echo 正在開啟瀏覽器至 http://localhost:3000 ...
start http://localhost:3000
echo.
cd web
node server.js
pause

