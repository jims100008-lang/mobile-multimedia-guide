# Agent Guidelines

## 專案定位

本專案是彰化大村武魁祠（武魁新厝）× AMR 智慧導覽的瀏覽器展示原型。
此專案展示 UC01～UC12 的用例規格、循序流程與 Three.js 3D 場景；目前沒有真正連接 ROS 2、YOLO、MQTT、LiDAR、表情辨識或充電硬體。

所有 agent 在修改功能時：

- 保持「互動展示原型」與「真實硬體系統規格」的區分，不要把模擬動畫描述成已實作的硬體功能。
- 優先維護既有視覺風格、場景座標與 UC01～UC12 流程的一致性。
- 完成實作後，至少手動驗證桌面瀏覽器的主要互動與控制台錯誤。
- 接手工作前先閱讀 `process/Process.md`，了解目前進度、已修改內容與未完成事項。
- 當使用者說「筆記起來」或「記錄工作」時，將當下工作追加到 `process/Process.md`，並標註日期與交接狀態。

## 目錄結構

- `web/index.html`：頁面結構、抽屜面板、頂部控制與 About Modal。
- `web/style.css`：頁面與抽屜樣式。
- `web/data.js`：UC01～UC12 的標題、場域、參與者、流程、循序訊息與技術資料。
- `web/app.js`：Three.js 場景、古蹟建模、AMR 動畫、巡航、語音與互動邏輯。
- `web/server.js`：零相依 Node.js 靜態伺服器。
- `web/package.json`：僅提供 `npm start` 啟動入口，不應假設有安裝相依套件。
- `start-web.bat`：Windows 一鍵啟動腳本。
- `README.md`：專案背景、歷史場域與十二用例總覽。
- 各 `UC*.md`：用例規格與設計文件。
- `process/Process.md`：每日工作紀錄與 agent 工作交接手冊。

## 啟動與驗證

從專案根目錄啟動：

```powershell
cd web
npm start
```

或直接執行：

```powershell
node web/server.js
```

Windows 可直接滑鼠雙擊 `start-web.bat`。預設網址為：

```text
http://localhost:3000
```

目前沒有設定自動化測試、lint 或 build 指令。
修改前端後，至少檢查：

1. 網站可正常載入，不出現 404 或 JavaScript 錯誤。
2. UC 12 個節點與抽屜內容可切換。
3. 3D 場景可旋轉、縮放且無明顯模型錯誤。
4. 自動巡航、機器人視角、全景視角與語音按鈕可正常運作。
5. 修改前後台視窗與視窗縮放時版面仍可使用。

## 修改規則

- 變更 UC 資料時，同時檢查 `web/data.js`、地標座標、底部按鈕與抽屜欄位。
- 新增或移除 UC 時，必須同步更新 `UC01～UC12` 的數量、編號、巡航邏輯與相關文件，不要只改一處。
- `web/app.js` 的 DOM ID 是結構化介面的契約。修改 `web/index.html` 中的 ID 前，先搜尋所有引用位置。
- Three.js 與 Tween.js 目前透過 CDN 載入。修改 `index.html` 的版本時，確認 API 與 r128 相容性。
- 保留繁體中文 UI 文案與專案現有命名風格。程序內的技術 API 名稱可使用英文。
- 優先做精確、小範圍修改；不要重構整個 3D 場景或順便清理無關程式碼。
- 不要新增 package 依賴，除非需求確實需要並先更新 `web/package.json`。
- 不要提交生成的模型檔、憑證、API key、個人資料或與本專案無關的大型資產。

## 程式風格

- JavaScript 使用現有的兩空格縮排、分號與純函式/全域狀態風格。
- CSS 使用既有的 CSS Variables 與 glass-morphism 命名方式。
- HTML 的互動元素應保留明確的 `id`、`title` 或 `aria` 說明，尤其是按鈕與抽屜控制。
- 優先使用既有的 `build*`、`setup*`、`selectUC()`、`moveRobotTo()` 與 `focusCameraOn()` 流程。
- 新程式碼需要足夠自解釋時再加註解；不要註解顯而易見的操作。

## 資料與安全注意事項

- `UC_DATA` 是前端資料來源；新增欄位時要同步補齊渲染邏輯與預設值處理。
- `web/server.js` 是本地靜態伺服器，不是正式 production server。
- 服務靜態檔案時維持既有 MIME type 與 403/404 行為；不要在未核對路徑邊界的情況下擴大伺服器權限。
- 對外部 URL、語音 API 或未來後端 API 的變更要明確紀錄來源與失敗處理，不得假裝外部連線成功。

## 提交前檢查

- Git 有關操作前，先執行完整的遠端與工作區檢查：
  ```powershell
  git fetch --prune origin
  git status
  git status -sb
  git rev-list --left-right --count HEAD...origin/<branch>
  git --no-pager log -3 --oneline --decorate HEAD
  git --no-pager log -3 --oneline --decorate origin/<branch>
  ```
- 任何提交、拉取或推送前，先確認當前分支、本機提交位置、遠端提交位置與未提交變更。
- 拉取時優先使用 `git pull --ff-only origin <branch>`，避免意外產生合併提交或覆蓋團隊提交。
- 發生衝突、分支分歧或工作區有未知變更時，先完整列出差異並詢問使用者，不可使用 `git reset --hard`、`git clean`、強制覆蓋或 `git push --force`。
- 提交前先檢查 `git diff` 與 `git diff --cached`；提交時不得包含未被本次需求直接使用的變更。
- 提交後立即執行 `git push origin <branch>`，再重新 fetch 並確認本機 `HEAD` 與 `origin/<branch>` 完全一致。
- 團隊版本管理發生落後、超前或分歧時，禁止假設遠端未更新；必須以實際 fetch 結果為準。

- 檔案只包含本次需求直接相關的變更。
- 沒有把 debug console、暫存截圖、個人路徑或測試資料提交進版本控制。
- 啟動伺服器後已驗證載入與主要互動。
- 若工作尚未完成，已在 `process/Process.md` 清楚記錄目前狀態、下一步與已知問題。
