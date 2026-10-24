/**
 * 大村武魁祠 × AMR 自主移動機器人智慧導覽系統
 * 12 個獨立用例 (UC01 ~ UC12) 詳細資料庫
 * 地點：彰化縣定古蹟「大村武魁新厝」（大村武魁祠 / 貢旗村賴家古厝）
 */

const UC_DATA = [
  {
    id: "UC01",
    num: 1,
    title: "偵測訪客",
    titleEn: "Detect Visitor",
    category: "門口迎賓感知",
    locationName: "武魁祠外門 / 貢旗巷口迎賓區",
    locationDesc: "武魁祠外圍入口處，訪客由大村鄉貢旗一巷進入古蹟園區之第一道感測邊界。",
    pos: [-14, 0, 16],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "進入武魁祠參訪之民眾" },
      { name: "大門口智慧鏡頭", role: "Entrance Camera", icon: "📷", desc: "搭載邊緣 AI (YOLO) 之人體視覺辨識鏡頭" }
    ],
    preConditions: [
      "大門口 AI 智慧邊緣監控鏡頭處於正常上線運作狀態。",
      "園區邊界感測網路 (Wi-Fi / LAN) 通訊正常。"
    ],
    postConditions: [
      "成功觸發訪客辨識事件，取得訪客進門時間戳記與初步空間座標特徵。",
      "啟動 UC02 迎賓通知封裝。"
    ],
    eventFlow: [
      { step: 1, text: "遊客自大村貢旗一巷步行踏入武魁祠外門感測範圍。" },
      { step: 2, text: "大門口智慧鏡頭即時捕捉高解析度串流影像。" },
      { step: 3, text: "鏡頭內建 Edge AI 晶片執行 YOLO 物件偵測，精準辨識人體特徵並排除樹影或車輛干擾。" },
      { step: 4, text: "系統生成訪客抵達事件特徵資料。" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "大門智慧鏡頭", msg: "步行踏入外門感測範圍", type: "action" },
      { from: "大門智慧鏡頭", to: "大門智慧鏡頭", msg: "YOLO 邊緣運算即時辨識人體特徵", type: "internal" },
      { from: "大門智慧鏡頭", to: "中控伺服器", msg: "觸發訪客到達事件 (時間/特徵)", type: "async" }
    ],
    techStack: ["YOLOv8 Edge AI", "OpenCV", "邊緣計算晶片", "RTSP 串流"],
    speechText: "大門口智慧鏡頭已成功辨識訪客踏入大村武魁祠外門，觸發自動迎賓系統。"
  },
  {
    id: "UC02",
    num: 2,
    title: "發送迎賓通知",
    titleEn: "Send Greeting Notification",
    category: "門口迎賓感知",
    locationName: "古蹟物聯網中控通訊樞紐",
    locationDesc: "設於武魁祠側廂之中控伺服器與 MQTT Broker 物聯網閘道。",
    pos: [-10, 0, 14],
    actors: [
      { name: "大門口智慧鏡頭", role: "Entrance Camera", icon: "📷", desc: "事件發送端" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "任務中繼協調與排程引擎" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "迎賓任務接收終端" }
    ],
    preConditions: [
      "UC01 成功偵測到新進訪客。",
      "中央控制伺服器 MQTT Broker 服務運作中。"
    ],
    postConditions: [
      "中控伺服器成功濾除重複雜訊，並向 AMR 推送派工指令與迎賓目標座標。"
    ],
    eventFlow: [
      { step: 1, text: "大門智慧鏡頭將人體辨識結果封裝為標準 MQTT JSON 資料封包。" },
      { step: 2, text: "封包經由專用無線通訊傳送至武魁祠中控伺服器。" },
      { step: 3, text: "中控伺服器執行去重過濾（Debounce），避免短時間重複觸發干擾。" },
      { step: 4, text: "伺服器派發迎賓派遣任務 (Dispatch Task) 至 AMR 導覽機器人。" }
    ],
    sequenceSteps: [
      { from: "大門智慧鏡頭", to: "中控伺服器", msg: "MQTT 發布 /wukui/visitor/arrival 封包", type: "sync" },
      { from: "中控伺服器", to: "中控伺服器", msg: "防重複觸發防護與狀態檢查", type: "internal" },
      { from: "中控伺服器", to: "導覽機器人", msg: "推播迎賓派工請求與大門迎賓座標", type: "async" }
    ],
    techStack: ["MQTT Broker", "RESTful API", "Event Debounce", "JSON Schema"],
    speechText: "中央控制伺服器已處理迎賓訊息，派送導航任務至導覽機器人。"
  },
  {
    id: "UC03",
    num: 3,
    title: "執行迎賓導航",
    titleEn: "Execute Greeting Navigation",
    category: "門口迎賓感知",
    locationName: "前埕入口迎賓長廊",
    locationDesc: "自機器人待命基座穿過前埕石板路通往山門入口之導航走廊。",
    pos: [-6, 0, 12],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "自主移動導航實體" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "地圖與全域狀態監控" }
    ],
    preConditions: [
      "導覽機器人處於待命或充電就緒狀態。",
      "系統已載入大村武魁祠高精度 2D/3D SLAM 點雲地圖。"
    ],
    postConditions: [
      "機器人安全動態避障，順利抵達武魁祠山門前迎賓停靠點。"
    ],
    eventFlow: [
      { step: 1, text: "機器人接收迎賓派工指令，喚醒雙輪差速驅動馬達與光達 (LiDAR)。" },
      { step: 2, text: "載入武魁祠場域地圖，規劃自主平滑路徑 (Global & Local Planner)。" },
      { step: 3, text: "以 0.4 m/s 安全速度沿石板路巡航，光達即時動態避開庭院盆栽與立柱。" },
      { step: 4, text: "精準抵達山門前之預設迎賓停靠錨點。" }
    ],
    sequenceSteps: [
      { from: "中控伺服器", to: "導覽機器人", msg: "啟動迎賓導航指令", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "喚醒驅動馬達與 360° 光達感測器", type: "internal" },
      { from: "導覽機器人", to: "導覽機器人", msg: "SLAM 自主避障路徑規劃與移動", type: "internal" },
      { from: "導覽機器人", to: "導覽機器人", msg: "到達山門迎賓點並回報狀態", type: "internal" }
    ],
    techStack: ["ROS 2 Humble", "Nav2 路徑規劃", "Cartographer SLAM", "2D/3D LiDAR"],
    speechText: "機器人已啟動 SLAM 自主導航，正前往武魁祠山門迎賓點。"
  },
  {
    id: "UC04",
    num: 4,
    title: "互動迎賓問候",
    titleEn: "Interactive Greeting",
    category: "門口迎賓感知",
    locationName: "武魁祠山門入口處",
    locationDesc: "武魁祠山門下方，門楣上方高懸『武魁』匾額前之遊客初次接觸點。",
    pos: [-2, 0, 9],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "在地化互動導覽主體" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "接受問候與介面操作之訪客" }
    ],
    preConditions: [
      "機器人到達山門迎賓定位點，且超音波/深度鏡頭偵測到遊客距離小於 1.5 公尺。"
    ],
    postConditions: [
      "完成初次迎賓破冰，遊客確認開始導覽或自選導覽路線。"
    ],
    eventFlow: [
      { step: 1, text: "超音波與人體感測器確認遊客進入互動半徑 (< 1.5m)。" },
      { step: 2, text: "機器人播放親切在地化問候語：「歡迎來到彰化大村武魁祠！」" },
      { step: 3, text: "前置觸控螢幕亮起迎賓介面，展示武魁祠簡介與導覽路線選單。" },
      { step: 4, text: "遊客點選「開始導覽」或進行語音確認，引導進入古蹟主體參訪。" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "導覽機器人", msg: "靠近至 1.5 公尺迎賓範圍", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "語音問候：「歡迎光臨大村武魁祠！」", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "觸控螢幕顯示導覽選單與路線選項", type: "display" },
      { from: "遊客", to: "導覽機器人", msg: "點選「開始歷史文化導覽」", type: "action" }
    ],
    techStack: ["在地化語音合成 (TTS)", "人機觸控介面 (HMI)", "近接超音波感測器"],
    speechText: "歡迎光臨彰化大村武魁祠！我是您的古蹟智慧導覽機器人，今天將帶您走進咸豐年間武舉人的傳奇歲月。"
  },
  {
    id: "UC05",
    num: 5,
    title: "庭院空間導覽",
    titleEn: "Courtyard Spatial Tour",
    category: "武魁古蹟導覽",
    locationName: "武魁祠前埕 / 旗杆石座文化廣場",
    locationDesc: "三合院核心外埕，為昔日曬穀農事與咸豐九年兄弟高中武舉立旗祭祖之地，亦為『貢旗村』地名由來。",
    pos: [0, 0, 4],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "引導行進與歷史解說" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "隨行參訪並聆聽解說" }
    ],
    preConditions: [
      "遊客於山門完成迎賓問候，進入導覽模式。"
    ],
    postConditions: [
      "完成庭院建築格局與『貢旗村』地名文史解說，引導遊客轉往正身正廳。"
    ],
    eventFlow: [
      { step: 1, text: "機器人引領遊客移動至武魁新厝前埕中央空曠區。" },
      { step: 2, text: "語音解說漳州平和移民一進一院三合院『ㄇ』字形風水坐向（坐北朝南避北風）。" },
      { step: 3, text: "特寫說明前埕兩側之武舉人旗杆石座與貢旗村命名由來（咸豐九年立旗祭祖）。" },
      { step: 4, text: "螢幕同步展示清代三合院全景空拍與古地圖對照。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "引導遊客移動至前埕旗杆石區", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "語音解說三合院格局與貢旗村由來", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "觸控螢幕播放前埕空間演變動畫", type: "display" }
    ],
    techStack: ["定點導覽排程", "多媒體空拍圖層對照", "定點指向音響"],
    speechText: "我們現在所在的是武魁祠的前埕。當年賴步雲與賴登雲兄弟高中武舉人，在此立旗祭祖、旌旗蔽空，這也是大村貢旗村名稱的由來。"
  },
  {
    id: "UC06",
    num: 6,
    title: "正廳歷史解說",
    titleEn: "Main Hall Historical Interpretation",
    category: "武魁古蹟導覽",
    locationName: "武魁祠正身正廳（武魁匾與兄弟同榜匾下方）",
    locationDesc: "三合院精神核心，高懸咸豐己未恩科『武魁』匾額與閩浙總督兼福建巡撫慶端贈『兄弟同榜』匾額。",
    pos: [0, 0, -4],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "古蹟重點文物解說" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "欣賞古匾與木雕工藝" }
    ],
    preConditions: [
      "完成前埕空間解說，機器人引導抵達正身正廳停靠點。"
    ],
    postConditions: [
      "完成武魁匾、兄弟同榜匾歷史事蹟及漳州工藝細節深度解說。"
    ],
    eventFlow: [
      { step: 1, text: "機器人精準停靠於正廳中門前最佳視角觀賞位。" },
      { step: 2, text: "語音深情講述賴步雲與賴登雲兄弟於清咸豐九年（1859年）同榜高中武舉人（第54、55名）的全臺傳奇。" },
      { step: 3, text: "解說閩浙總督慶端贈『兄弟同榜』匾額之歷史背景與宗族榮耀。" },
      { step: 4, text: "螢幕放大展示正身燕尾翹脊、斗栱架構與傳統彩繪木雕工藝特寫。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "導覽機器人", msg: "正身正廳微定位自主停靠", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "解說『兄弟同榜』與『武魁』匾歷史", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "螢幕高解析放大展示斗栱與燕尾脊工藝", type: "display" }
    ],
    techStack: ["高精度室內微定位 (UWB / SLAM)", "數位典藏高解析檢視", "多國語言解說 (台/華/客/英)"],
    speechText: "抬頭仰望正廳，這方『兄弟同榜』匾額是咸豐九年由福建巡撫慶端所贈。賴氏兄弟同科高中武舉人，是全台灣非常罕見的榮耀。"
  },
  {
    id: "UC07",
    num: 7,
    title: "廂房常民文化展示",
    titleEn: "Wing Rooms Folk Culture",
    category: "武魁古蹟導覽",
    locationName: "武魁祠左右護龍（東廂與西廂房）",
    locationDesc: "三合院護龍廂房，展示昔日漳州移民在大村的農村拓墾農具、日常生活器皿與武舉人習武石鎖。",
    pos: [7, 0, 1],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "展示導覽與互動指引" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "觸控探索文物細節" }
    ],
    preConditions: [
      "完成正廳解說，遊客隨機器人移動至護龍展示區。"
    ],
    postConditions: [
      "遊客了解常民起居生活文化，加深對大村農業與宗族拓墾之歷史認知。"
    ],
    eventFlow: [
      { step: 1, text: "機器人帶領遊客穿過前埕石階，停駐於左護龍廂房展示區。" },
      { step: 2, text: "語音解說早期大村農村農具、紅眠床、陶甕，以及武舉人練習臂力的石鎖與大刀器具。" },
      { step: 3, text: "遊客觸控機器人螢幕，自由旋轉檢視常民文物 3D 模型與古今照片對照。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "帶領移動至護龍廂房展示通道", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "語音解說漳州移民常民生活與習武器具", type: "speech" },
      { from: "遊客", to: "導覽機器人", msg: "觸控螢幕 3D 檢視石鎖與傳統農具", type: "action" }
    ],
    techStack: ["3D 數位文物渲染", "窄道動態導航", "觸控互動式展覽系統"],
    speechText: "這裡是護龍廂房，除了重現當年漳州移民的農家生活器皿外，還可以透過螢幕了解武舉人當年使用的石鎖與大刀訓練文物。"
  },
  {
    id: "UC08",
    num: 8,
    title: "多媒體互動問答",
    titleEn: "Multimedia Interactive QA",
    category: "互動與閉環維運",
    locationName: "右護龍多媒體互動體驗角",
    locationDesc: "護龍寬敞廊道之多媒體觸控站，供訪客參與文史益智問答與數位集章。",
    pos: [-7, 0, 1],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "出題並即時評判回饋" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "操作螢幕回答武魁文史問題" }
    ],
    preConditions: [
      "完成正廳與廂房導覽，抵達互動問答專屬停留區。"
    ],
    postConditions: [
      "遊客完成問答闖關，獲取武魁新厝數位紀念徽章或導覽認證。"
    ],
    eventFlow: [
      { step: 1, text: "機器人觸控螢幕跳出『大村武魁祠文史挑戰』互動問答遊戲。" },
      { step: 2, text: "遊客點選回答問題（如：賴家兄弟是咸豐幾年高中武舉？貢旗村由來為何？）。" },
      { step: 3, text: "答對時播放音效與鼓勵語音，並發送手機 QR-Code 數位紀念圖章。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "推播互動文史問答與趣味集章挑戰", type: "display" },
      { from: "遊客", to: "導覽機器人", msg: "點選正確答案：「咸豐九年，兄弟同榜！」", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "播放答對音效並產出數位紀念徽章", type: "display" }
    ],
    techStack: ["互動式問答引擎", "QR Code 數位集章", "音效回饋系統"],
    speechText: "恭喜您答對了！賴步雲與賴登雲兄弟確實在咸豐九年同榜高中武舉人，已為您記錄一枚『武魁榮譽徽章』！"
  },
  {
    id: "UC09",
    num: 9,
    title: "導覽結束與歡送",
    titleEn: "Tour Conclusion & Farewell",
    category: "互動與閉環維運",
    locationName: "武魁祠山門道別區 / 貢旗文創出口",
    locationDesc: "古蹟出口處，機器人向遊客致謝並推薦大村在地特產（巨峰葡萄）及周邊景點。",
    pos: [4, 0, 13],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "道別致詞與周邊觀光推廣" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "結束導覽行程並離開" }
    ],
    preConditions: [
      "完成所有展區導覽與問答體驗。"
    ],
    postConditions: [
      "遊客圓滿結束參觀行程，機器人回報中控伺服器任務完成。"
    ],
    eventFlow: [
      { step: 1, text: "機器人引導遊客返回山門出口處。" },
      { step: 2, text: "語音播放溫馨道別語：「感謝您造訪大村武魁祠，祝您今日旅程愉快！」" },
      { step: 3, text: "螢幕推播大村周邊特色景點（大村葡萄觀光果園、雙心池塘）與滿意度問卷。" },
      { step: 4, text: "機器人向中控伺服器發送導覽完成狀態訊號。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "引導至出口並播放溫馨道別語", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "螢幕推薦大村在地特產葡萄與周邊地圖", type: "display" },
      { from: "導覽機器人", to: "中控伺服器", msg: "回報巡導任務完成，準備進入待命狀態", type: "sync" }
    ],
    techStack: ["滿意度問卷收集 API", "在地觀光資料庫串接", "中控狀態機同步"],
    speechText: "感謝您的蒞臨！希望您喜歡今天的大村武魁祠文史之旅。大村鄉也是台灣著名的葡萄之鄉，歡迎您順道品嚐在地優質葡萄！"
  },
  {
    id: "UC10",
    num: 10,
    title: "系統自動返航充電",
    titleEn: "Autonomous Docking & Charging",
    category: "互動與閉環維運",
    locationName: "武魁祠西側廊道智慧充電樁基座",
    locationDesc: "位於側廂隱蔽角落之專屬無線接觸式自主充電座，保障古蹟動線暢通。",
    pos: [-11, 0, -2],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "自主對準精準對接" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "電池狀態監控與排程" },
      { name: "古蹟維運工作人員", role: "Staff", icon: "👨‍💻", desc: "後台異常告警備援" }
    ],
    preConditions: [
      "行程結束處於閒置狀態，或電量偵測低於安全閾值 (20%)。"
    ],
    postConditions: [
      "機器人安全對準充電極板，進入補電與系統健檢休眠狀態。"
    ],
    eventFlow: [
      { step: 1, text: "機器人 BMS (電池管理系統) 檢測電量低於設定值或接收中控排程。" },
      { step: 2, text: "啟動精確返航程序，避開庭院障礙物移動至充電站周邊。" },
      { step: 3, text: "透過紅外線光學標記 (AprilTag) 或雷射對位，以公釐級精度倒車對接充電樁。" },
      { step: 4, text: "啟動充電並上傳當日巡導里程與日誌至伺服器。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "中控伺服器", msg: "回報低電量警示 (SOC < 20%)", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "規劃最短回航路徑返回西側充電區", type: "internal" },
      { from: "導覽機器人", to: "導覽機器人", msg: "AprilTag 視覺輔助精準對齊接觸極板", type: "internal" },
      { from: "導覽機器人", to: "中控伺服器", msg: "對接完成，進入充電與離線待命狀態", type: "sync" }
    ],
    techStack: ["BMS 電池管理系統", "AprilTag 視覺伺服對接", "紅外線精準對位", "自動充電管理"],
    speechText: "電量即將用盡，正在自主返回西廂充電樁進行補電與系統校準。"
  },
  {
    id: "UC11",
    num: 11,
    title: "表情辨識主動關懷",
    titleEn: "Facial Expression Proactive Assistance",
    category: "智慧進階感知",
    locationName: "正廳廊道深度解說巡視區",
    locationDesc: "正身與左右護龍交界處，遊客凝視文物駐留較久之區域。",
    pos: [3, 0, -2],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "露出思索或困惑表情之訪客" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "主動靠近並釋出善意解說" },
      { name: "機器人視覺鏡頭", role: "Robot Vision Camera", icon: "📷", desc: "搭載人臉情緒分析 AI 模型" }
    ],
    preConditions: [
      "機器人處於場域巡導或駐留解說狀態，RGB-D 深度相機正常工作。"
    ],
    postConditions: [
      "機器人溫和主動上前提供深層文史解說，成功化解遊客疑惑。"
    ],
    eventFlow: [
      { step: 1, text: "遊客在正身木雕或碑文前停下，臉部出現皺眉、思索或疑惑特徵。" },
      { step: 2, text: "機器人內建鏡頭透過情緒辨識 AI 模型 (FER) 分析遊客表情持續逾 3 秒。" },
      { step: 3, text: "機器人自主微調路徑，溫和轉向遊客並以低速平緩靠近至 1.2 公尺。" },
      { step: 4, text: "語音主動詢問：「我看您對這段歷史很感興趣，需要為您介紹武魁匾的由來嗎？」" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "機器人視覺鏡頭", msg: "駐留並露出疑惑/思考表情 (> 3秒)", type: "action" },
      { from: "機器人視覺鏡頭", to: "導覽機器人", msg: "觸發表情分析情緒事件 (Confused/Interested)", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "微調航向，安全減速靠近遊客", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "主動詢問：「需要為您進一步解說這個展區嗎？」", type: "speech" }
    ],
    techStack: ["Facial Emotion Recognition (FER)", "MediaPipe FaceMesh", "主動互動決策樹 (Behavior Tree)"],
    speechText: "我看您對正廳的建築細節非常專注，需要我為您補充這座三合院木雕斗栱的工藝小故事嗎？"
  },
  {
    id: "UC12",
    num: 12,
    title: "手勢辨識請求協助",
    titleEn: "Gesture Recognition & Call for Help",
    category: "智慧進階感知",
    locationName: "武魁祠前埕中央開闊互動區",
    locationDesc: "武魁祠開闊庭院，遊客可從遠處視野直接目視機器人並揮手招呼。",
    pos: [-3, 0, 2],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "揮手或舉手請求服務之訪客" },
      { name: "機器人視覺鏡頭", role: "Robot Vision Camera", icon: "📷", desc: "動態骨架手勢追蹤 AI" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "響應招喚即刻前來服務" }
    ],
    preConditions: [
      "機器人處於前埕視野開闊範圍內，視覺鏡頭無遮蔽。"
    ],
    postConditions: [
      "機器人精準響應手勢指令，抵達遊客面前提供所需導覽或協助選項。"
    ],
    eventFlow: [
      { step: 1, text: "遊客在前埕向導覽機器人連續做出「揮手 (Waving)」或「舉手 (Hand-raising)」動作。" },
      { step: 2, text: "機器人廣角鏡頭結合人體骨架關鍵點辨識 (Pose Estimation) 判定為求助指令。" },
      { step: 3, text: "機器人立即暫停當前巡邏或空閒行程，車載燈光閃爍回應並發出確認音效。" },
      { step: 4, text: "機器人轉向遊客方位，自主導航前往其身旁並語音回應：「我來了！請問有什麼需要幫忙的嗎？」" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "機器人視覺鏡頭", msg: "在可視範圍內連續揮手召喚", type: "action" },
      { from: "機器人視覺鏡頭", to: "導覽機器人", msg: "AI 辨識動態手勢「Waving Gestures」", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "暫停閒置，鎖定遊客座標並重新規劃路徑", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "移動至身旁語音回應：「我聽到您的呼叫了，請問需要什麼協助？」", type: "speech" }
    ],
    techStack: ["MediaPipe Hands / Holistic", "動態手勢時序分類 (LSTM/GRU)", "動態任務優先級切換"],
    speechText: "我看到您的招手召喚了！請問需要為您重新導航、尋找洗手間，還是重播剛才的歷史解說呢？"
  }
];

// 匯出常數（相容瀏覽器全域變數與 Node 環境）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { UC_DATA };
}

