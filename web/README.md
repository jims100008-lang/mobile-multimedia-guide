# 彰化大村武魁祠 × AMR 智慧導覽 3D 浮島網頁

本專案參考沈伯洋 **「HEART 政策島」(https://puma.taipei/heart-island)** 之經典卡坦島（Catan）六角浮島 3D 互動設計，為彰化縣定古蹟**「大村武魁新厝」（武魁祠）**量身打造專屬的 **AMR（自主移動機器人）智慧導覽 12 獨立用例 (UC01 ~ UC12) 3D 互動網頁**。

---

## 🏛️ 場域背景：大村武魁祠（武魁新厝）
* **地理位置**：彰化縣大村鄉貢旗村貢旗一巷 7 號（[Google 地圖](https://maps.app.goo.gl/TZW9MKjQZp8vuEh39)）
* **文資地位**：彰化縣定古蹟（一進一院傳統閩南三合院）。
* **歷史傳奇**：
  * 清咸豐九年（1859年），賴步雲、賴登雲兄弟同科高中武舉人（第54、55名），為臺灣史上罕見之「兄弟同榜」。
  * 山門高懸「武魁」匾，正廳高懸福建巡撫慶端題贈之「兄弟同榜」匾。
  * 當年兄弟立旗祭祖、旌旗蔽天，聚落因而得名**「貢旗村」**。

---

## 📍 12 個獨立用例 (UC01 ~ UC12) 場域配置表

| 用例編號 | 用例名稱 | 英文名稱 | 武魁祠對應場域與文化機能 | 核心技術與感測器 |
| :--- | :--- | :--- | :--- | :--- |
| **UC01** | **偵測訪客** | Detect Visitor | 武魁祠外門 / 貢旗巷口迎賓區 | YOLOv8 Edge AI、人體辨識 |
| **UC02** | **發送迎賓通知** | Send Greeting Notification | 古蹟物聯網中控通訊樞紐 | MQTT Broker、Debounce 防抖 |
| **UC03** | **執行迎賓導航** | Execute Greeting Navigation | 前埕入口迎賓長廊 | ROS 2、Cartographer SLAM、LiDAR |
| **UC04** | **互動迎賓問候** | Interactive Greeting | 武魁祠山門入口處（武魁匾下方） | HMI 觸控螢幕、在地化語音合成 (TTS) |
| **UC05** | **庭院空間導覽** | Courtyard Spatial Tour | 前埕 / 舉人旗杆石座文化廣場 | 貢旗文史多媒體對照、空拍演變 |
| **UC06** | **正廳歷史解說** | Main Hall Historical Interpretation | 正身正廳（武魁匾與兄弟同榜匾） | 燕尾脊木雕特寫、UWB/SLAM 室內微定位 |
| **UC07** | **廂房常民文化展示** | Wing Rooms Folk Culture | 東西廂護龍（常民農具與習武石鎖） | 3D 數位文物互動、窄道避障導航 |
| **UC08** | **多媒體互動問答** | Multimedia Interactive QA | 護龍多媒體互動體驗角 | 文史趣味闖關、QR Code 數位紀念集章 |
| **UC09** | **導覽結束與歡送** | Tour Conclusion & Farewell | 出口道別區 / 貢旗文創出口 | 在地名產（大村葡萄）觀光推薦、問卷 API |
| **UC10** | **系統自動返航充電** | Autonomous Docking & Charging | 西側廊道智慧充電樁基座 | BMS 電池管理、AprilTag 視覺伺服對接 |
| **UC11** | **表情辨識主動關懷** | Facial Expression Proactive Assistance | 正廳廊道深度解說巡視區 | 表情情緒辨識 (FER)、主動決策樹 |
| **UC12** | **手勢辨識請求協助** | Gesture Recognition & Call for Help | 前埕中央開闊互動區 | MediaPipe Hands 骨架手勢追蹤、優先級切換 |

---

## 🚀 啟動方式 (How to Run)

### 方式一：一鍵批次檔（最簡單）
直接在專案根目錄**滑鼠雙擊 `start-web.bat`**：
1. 自動開啟預設瀏覽器並前往 `http://localhost:3000`。
2. 自動啟動內建的 Node.js 伺服器。

### 方式二：指令列啟動
```powershell
cd web
node server.js
```
接著在瀏覽器打開：`http://localhost:3000`

### 方式三：直接開啟 HTML 檔案
直接使用 Chrome 或 Edge 瀏覽器開啟 `web/index.html` 檔案即可！

