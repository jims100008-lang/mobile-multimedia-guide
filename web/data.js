/**
 * 大村武魁祠 × AMR 自主移動機器人智慧導覽系統
 * 12 個獨立用例 (UC01 ~ UC12) 詳細資料庫
 * 實證場域：彰化縣定古蹟「大村武魁新厝」（武魁祠 / 賴登雲故居）
 * 參照 Google 實地地景：五開間正身、凹壽、懸山軒亭、硬山雙燕尾、獨立燕尾門樓、半月風水池、舉人旗杆群與大村葡萄果園
 */

const UC_DATA = [
  {
    id: "UC01",
    num: 1,
    title: "偵測訪客",
    titleEn: "Detect Visitor",
    category: "門口迎賓感知",
    locationName: "貢旗一巷園區外圍迎賓接駁區",
    locationDesc: "武魁祠最外圍路口（大村鄉貢旗一巷接駁點），訪客自鄉村道路踏入古蹟園區之第一道 AI 邊界感測線。",
    pos: [0, 0, 48],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "自貢旗一巷踏入武魁祠園區之參訪民眾" },
      { name: "大門口智慧鏡頭", role: "Entrance Camera", icon: "📷", desc: "搭載邊緣 AI (YOLO) 之全天候視覺感知鏡頭" }
    ],
    preConditions: [
      "大門口 AI 智慧邊緣監控鏡頭處於正常上線運作狀態。",
      "園區邊界通訊網路 (Wi-Fi 6 / 5G 專網) 連線順暢。"
    ],
    postConditions: [
      "Edge AI 成功辨識進入園區之訪客特徵與時間戳記，生成入場事件封包。",
      "即刻喚醒 UC02 迎賓通知封裝程序。"
    ],
    eventFlow: [
      { step: 1, text: "遊客自大村鄉貢旗一巷漫步進入武魁祠外圍接駁迎賓區。" },
      { step: 2, text: "外圍智慧立柱相機捕捉人體行進串流影像。" },
      { step: 3, text: "邊緣運算晶片運行 YOLOv8 演算法，辨識訪客並過濾農村落葉與光影干擾。" },
      { step: 4, text: "系統生成高精度訪客入場事件特徵數據。" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "外門智慧鏡頭", msg: "踏入貢旗一巷外圍感測區", type: "action" },
      { from: "外門智慧鏡頭", to: "外門智慧鏡頭", msg: "YOLOv8 即時邊緣人體特徵分析", type: "internal" },
      { from: "外門智慧鏡頭", to: "中控伺服器", msg: "發布 /wukui/visitor/arrival 入場事件", type: "async" }
    ],
    techStack: ["YOLOv8 Edge AI", "OpenCV 影像處理", "邊緣運算模組", "RTSP 串流協定"],
    speechText: "大門口智慧鏡頭已成功辨識訪客踏入大村武魁祠外圍迎賓區，自動啟動導覽迎賓機制。"
  },
  {
    id: "UC02",
    num: 2,
    title: "發送迎賓通知",
    titleEn: "Send Greeting Notification",
    category: "門口迎賓感知",
    locationName: "半月風水池東側綠蔭物聯網通訊站",
    locationDesc: "座落於半月風水池東側古樹步道旁的中控伺服器節點與物聯網 MQTT 閘道通訊亭。",
    pos: [18, 0, 40],
    actors: [
      { name: "大門口智慧鏡頭", role: "Entrance Camera", icon: "📷", desc: "事件辨識發送端" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "事件中繼、排程與狀態協調核心" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "迎賓任務接收與導航實體" }
    ],
    preConditions: [
      "UC01 成功偵測到新進訪客事件。",
      "武魁祠中控伺服器 MQTT Broker 連線服務正常運作中。"
    ],
    postConditions: [
      "中控伺服器過濾重複觸發，並向 AMR 機器人發送迎賓派工請求與山門門樓坐標。"
    ],
    eventFlow: [
      { step: 1, text: "外門鏡頭將人體特徵封裝為標準 MQTT JSON 資料封包。" },
      { step: 2, text: "通訊閘道以低延遲無線網路發送至中控通訊樞紐。" },
      { step: 3, text: "中控伺服器比對事件時間戳，啟動去重（Debounce）機制防止短時間重複派遣。" },
      { step: 4, text: "派工排程引擎指派 AMR 前往獨立燕尾門樓迎賓停靠點。" }
    ],
    sequenceSteps: [
      { from: "外門智慧鏡頭", to: "中控伺服器", msg: "MQTT 推送新訪客座標與時間戳", type: "sync" },
      { from: "中控伺服器", to: "中控伺服器", msg: "Debounce 防重複觸發與任務佇列排程", type: "internal" },
      { from: "中控伺服器", to: "導覽機器人", msg: "派送迎賓指令與山門門樓迎賓座標", type: "async" }
    ],
    techStack: ["MQTT Broker", "RESTful API", "Event Debounce", "JSON Schema 封包"],
    speechText: "中央控制伺服器已完成任務排程，派遣 AMR 導覽機器人前往燕尾門樓迎賓點。"
  },
  {
    id: "UC03",
    num: 3,
    title: "執行迎賓導航",
    titleEn: "Execute Greeting Navigation",
    category: "門口迎賓感知",
    locationName: "半月風水池西側石板導航迴廊",
    locationDesc: "半月風水池畔石板引道，機器人自充電站出發、繞過清澈風水池自主巡航至門樓之導航動線。",
    pos: [-14, 0, 32],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "自主路徑規劃與行進主體" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "全域場景地圖監控與遙測日誌" }
    ],
    preConditions: [
      "導覽機器人接收到派工任務，電池電量充足 (SOC > 30%)。",
      "系統已加載武魁新厝三合院高精度 2D/3D SLAM 點雲地圖。"
    ],
    postConditions: [
      "機器人安全避開風水池駁岸與古厝矮牆，平順抵達獨立燕尾門樓前迎賓位。"
    ],
    eventFlow: [
      { step: 1, text: "機器人喚醒驅動輪馬達與 360° 旋轉光達 (LiDAR) 感測器。" },
      { step: 2, text: "Nav2 路徑規劃器計算從西側側苑至山門門樓的最優避障路線。" },
      { step: 3, text: "沿半月池畔石道行進，光達與超音波即時探測動態行人與庭院盆栽。" },
      { step: 4, text: "精準減速停靠於『武魁』燕尾門樓前之迎賓定位錨點。" }
    ],
    sequenceSteps: [
      { from: "中控伺服器", to: "導覽機器人", msg: "啟動迎賓導航至山門門樓", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "光達點雲比對與 Nav2 自主路徑規劃", type: "internal" },
      { from: "導覽機器人", to: "導覽機器人", msg: "動態避開風水池護欄與石道障礙物", type: "internal" },
      { from: "導覽機器人", to: "中控伺服器", msg: "已就定位於山門迎賓錨點", type: "sync" }
    ],
    techStack: ["ROS 2 Humble", "Nav2 動態路徑規劃", "Cartographer SLAM", "360° 2D/3D LiDAR"],
    speechText: "機器人啟動 SLAM 自主導航，正沿著半月風水池畔前往武魁門樓迎賓點。"
  },
  {
    id: "UC04",
    num: 4,
    title: "互動迎賓問候",
    titleEn: "Interactive Greeting",
    category: "門口迎賓感知",
    locationName: "武魁祠獨立燕尾門樓前迎賓廣場",
    locationDesc: "武魁新厝單間硬山燕尾門樓前，門額高懸黑底金字『武魁』匾額，兩側為綠釉花磚透窗之古宅院門入口。",
    pos: [0, 0, 24],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "在地化互動導覽主體" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "進入門樓接受熱情迎賓之參訪者" }
    ],
    preConditions: [
      "機器人到達燕尾門樓迎賓定位點，近距感測器偵測到遊客距離小於 1.5 公尺。"
    ],
    postConditions: [
      "完成破冰互動問候，遊客於觸控螢幕點選進入武魁祠深度文化之旅。"
    ],
    eventFlow: [
      { step: 1, text: "超音波感測器確認遊客穿過半月池石橋、接近燕尾門樓 (< 1.5m)。" },
      { step: 2, text: "機器人前置迎賓螢幕點亮，播放熱情問候語：「歡迎來到彰化大村武魁祠！」" },
      { step: 3, text: "螢幕展示咸豐武舉人歷史前導短片與導覽路線選單。" },
      { step: 4, text: "遊客點選「開始導覽」，機器人引導穿過門樓進入開闊前埕。" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "導覽機器人", msg: "穿過半月池引道靠近門樓迎賓點", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "語音問候：「歡迎來到彰化大村武魁祠！」", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "觸控螢幕顯示導覽選單與路線選項", type: "display" },
      { from: "遊客", to: "導覽機器人", msg: "點選「進入大村武魁新厝深度參訪」", type: "action" }
    ],
    techStack: ["在地化語音合成 (TTS)", "人機觸控介面 (HMI)", "超音波近接感測器", "門樓視覺對準"],
    speechText: "歡迎光臨彰化縣定古蹟大村武魁祠！門額上的『武魁』匾額見證了咸豐九年賴氏兄弟高中武舉人的榮耀，請隨我進院參觀。"
  },
  {
    id: "UC05",
    num: 5,
    title: "庭院空間導覽",
    titleEn: "Courtyard Spatial Tour",
    category: "武魁古蹟導覽",
    locationName: "開闊前埕中央 / 賴氏雙舉人旗杆石座文化區",
    locationDesc: "武魁新厝核心外埕廣場，立有兩座賴步雲、賴登雲兄弟之清代舉人旗杆石座與高聳令旗，亦為『貢旗村』地名由來。",
    pos: [0, 0, 10],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "建築佈局與貢旗文史解說員" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "佇立於開闊院埕欣賞全景之訪客" }
    ],
    preConditions: [
      "遊客隨機器人穿過燕尾門樓，進入開闊三合院大前埕。"
    ],
    postConditions: [
      "完成三合院風水格局與『貢旗村』地名由來解說，引導遊客前往正身軒亭。"
    ],
    eventFlow: [
      { step: 1, text: "機器人引領遊客行進至前埕中央雙旗杆座之間。" },
      { step: 2, text: "解說漳州平和移民傳統三合院『坐北朝南』避冬季東北季風之風水智慧。" },
      { step: 3, text: "詳述咸豐九年兄弟中武舉後衣錦還鄉、立旗祭祖，聚落因而得名『貢旗村』之文史傳奇。" },
      { step: 4, text: "螢幕同步顯示前埕昔日曬穀農事與祭祖慶典之歷史想像圖。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "引領抵達前埕雙旗杆石座中心觀景點", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "語音解說三合院格局與貢旗村命名由來", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "螢幕展示清代立旗祭祖歷史復原繪圖", type: "display" }
    ],
    techStack: ["定點文史導航", "古蹟空間多媒體疊圖", "定向音場廣播系統"],
    speechText: "我們眼前這兩座高聳的旗杆石座，是當年賴步雲與賴登雲兄弟高中武舉人所立。當年旌旗蔽天、光耀門楣，大村鄉貢旗村的地名正是由此誕生。"
  },
  {
    id: "UC06",
    num: 6,
    title: "正廳歷史解說",
    titleEn: "Main Hall Historical Interpretation",
    category: "武魁古蹟導覽",
    locationName: "五開間正身正廳與懸山軒亭（兄弟同榜匾下方）",
    locationDesc: "武魁祠精神核心，面寬五開間氣派正身，中央凹壽大門設三關六扇門，前方立有懸山馬背軒亭，高懸福建巡撫慶端贈『兄弟同榜』匾。",
    pos: [0, 0, -2],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "重點文物與工藝精闢解說主體" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "於軒亭前仰望兄弟同榜金匾之訪客" }
    ],
    preConditions: [
      "完成前埕空間解說，機器人精準停駐於軒亭拜亭前觀景定位點。"
    ],
    postConditions: [
      "深入理解全臺罕見『兄弟同榜』武舉事蹟，欣賞斗仔砌紅磚與雙燕尾脊工藝。"
    ],
    eventFlow: [
      { step: 1, text: "機器人停靠於軒亭前方最佳仰角視線區。" },
      { step: 2, text: "深情講述賴步雲與賴登雲於清咸豐九年（1859年）同榜中第（第54、55名）的全臺傳奇。" },
      { step: 3, text: "解說閩浙總督兼福建巡撫慶端題贈『兄弟同榜』匾額之歷史意涵。" },
      { step: 4, text: "螢幕高解析特寫正身雙硬山燕尾翹脊、凹壽門印與斗仔砌紅磚工法。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "導覽機器人", msg: "軒亭前高精度自主微定位停靠", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "解說『兄弟同榜』咸豐恩科武舉人傳奇", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "螢幕放大展示斗栱、燕尾脊與門印工藝", type: "display" }
    ],
    techStack: ["高精度室內微定位 (UWB / SLAM)", "數位典藏超高解析檢視", "多語種歷史解說"],
    speechText: "仰望正身大門上方，這方『兄弟同榜』匾額由福建巡撫慶端所贈。兄弟同科考中武舉人在全台灣史冊中極為罕見，是彰化大村至高無上的宗族榮耀。"
  },
  {
    id: "UC07",
    num: 7,
    title: "廂房常民文化展示",
    titleEn: "Wing Rooms Folk Culture",
    category: "武魁古蹟導覽",
    locationName: "東護龍（左廂房）常民起居生活展示廊",
    locationDesc: "武魁新厝東側護龍廂房，展示漳州移民農家拓墾農具、紅眠床古家具與武舉人練武專用石鎖大刀。",
    pos: [18, 0, 2],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "常民生活與武術文物引導者" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "觸控探索古厝生活日常之民眾" }
    ],
    preConditions: [
      "完成正廳解說，機器人引領遊客前往東廂護龍廊道開闊平台。"
    ],
    postConditions: [
      "遊客充分體會清代大村拓墾農村日常與武舉人刻苦習武之歷史記憶。"
    ],
    eventFlow: [
      { step: 1, text: "機器人帶領遊客行進至東護龍廂房走廊前。" },
      { step: 2, text: "語音解說漳州平和客家與閩南移民早期在大村開墾的農具與生活器物。" },
      { step: 3, text: "特別介紹武舉人鍛鍊臂力與腕力所使用之『石鎖』、『大刀』歷史器物。" },
      { step: 4, text: "遊客觸控螢幕旋轉檢視數位化 3D 石鎖模型與重量規格。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "引導行進至東護龍廂房走廊", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "解說常民農耕器物與武舉人習武石鎖", type: "speech" },
      { from: "遊客", to: "導覽機器人", msg: "觸控螢幕進行 3D 文物 360 度互動旋轉", type: "action" }
    ],
    techStack: ["WebGL 3D 數位文物渲染", "窄道動態導航避障", "文物典藏互動資料庫"],
    speechText: "東護龍展區呈現了當年大村農村的純樸生活。螢幕上展示的是武舉人當年苦練力量的石鎖，重達數十斤，見證了考取武魁背後的堅毅毅力。"
  },
  {
    id: "UC08",
    num: 8,
    title: "多媒體互動問答",
    titleEn: "Multimedia Interactive QA",
    category: "互動與閉環維運",
    locationName: "西護龍（右廂房）多媒體益智闖關互動角",
    locationDesc: "武魁新厝西側護龍過水廊前寬敞平台，設有觸控挑戰遊戲與數位紀念集章功能。",
    pos: [-18, 0, 2],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "趣味出題與即時評分互動端" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "操作螢幕參與文史問答挑戰之民眾" }
    ],
    preConditions: [
      "完成正廳與廂房文化導覽，抵達西廂互動專區。"
    ],
    postConditions: [
      "遊客完成大村文史闖關測驗，獲得武魁祠數位榮譽紀念勳章。"
    ],
    eventFlow: [
      { step: 1, text: "機器人螢幕亮起『大村武魁文史達人挑戰』互動介面。" },
      { step: 2, text: "遊客點選挑戰題目（如：兄弟同榜是哪兩位舉人？大村貢旗村名稱由來？）。" },
      { step: 3, text: "答對時觸發歡呼音效與車載燈光慶祝特效。" },
      { step: 4, text: "螢幕生成專屬紀念 QR-Code 供遊客手機下載數位集章。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "推送互動文史問答闖關挑戰選單", type: "display" },
      { from: "遊客", to: "導覽機器人", msg: "點選正確答案：「賴步雲、賴登雲兄弟！」", type: "action" },
      { from: "導覽機器人", to: "遊客", msg: "播放獲勝音效並生成數位紀念徽章 QR Code", type: "display" }
    ],
    techStack: ["問答評分引擎", "動態 QR-Code 產生器", "車載互動音效燈效"],
    speechText: "恭喜您全部答對！您已深刻了解大村武魁祠與貢旗村的輝煌文史，已為您頒發一枚『武魁榮譽數位勳章』！"
  },
  {
    id: "UC09",
    num: 9,
    title: "導覽結束與歡送",
    titleEn: "Tour Conclusion & Farewell",
    category: "互動與閉環維運",
    locationName: "門樓東側大道 / 貢旗文創觀光出口區",
    locationDesc: "獨立燕尾門樓東側出口石道，通往貢旗社區步道，可順遊周邊大村巨峰葡萄觀光果園與洋樓古蹟。",
    pos: [14, 0, 24],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "道別致謝與大村觀光導購推薦" },
      { name: "遊客", role: "Visitor", icon: "👤", desc: "圓滿結束導覽行程之民眾" }
    ],
    preConditions: [
      "全區導覽與問答互動皆已順利完成。"
    ],
    postConditions: [
      "遊客滿意離園，機器人回傳任務完成日誌並轉入待命巡查狀態。"
    ],
    eventFlow: [
      { step: 1, text: "機器人陪伴遊客移動至門樓旁出口步道。" },
      { step: 2, text: "語音播放溫馨道別：「感謝您參訪大村武魁祠，願今日的古蹟之旅為您留下美好回憶！」" },
      { step: 3, text: "螢幕推播大村在地觀光地圖：大村巨峰葡萄園採果、貢旗洋樓與雙心池塘景點。" },
      { step: 4, text: "回報中控伺服器此趟導覽任務成功結束。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "遊客", msg: "陪伴至出口步道並播放溫馨道別語", type: "speech" },
      { from: "導覽機器人", to: "遊客", msg: "推播大村葡萄之鄉採果觀光休閒地圖", type: "display" },
      { from: "導覽機器人", to: "中控伺服器", msg: "回傳 /wukui/mission/completed 完成訊號", type: "sync" }
    ],
    techStack: ["大村在地觀光 API", "滿意度評分模組", "任務狀態機 (FSM)"],
    speechText: "感謝您的蒞臨！彰化大村鄉是全台知名的巨峰葡萄之鄉，離開武魁祠後，不妨順道品嚐在地新鮮甜美的葡萄與參觀貢旗洋樓！"
  },
  {
    id: "UC10",
    num: 10,
    title: "系統自動返航充電",
    titleEn: "Autonomous Docking & Charging",
    category: "互動與閉環維運",
    locationName: "西側外苑大村葡萄架旁智慧充電樁",
    locationDesc: "位於西護龍側苑、綠意盎然的大村葡萄藤架旁之專屬無線接觸式自主充電基座。",
    pos: [-24, 0, -6],
    actors: [
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "自主返航精準對接實體" },
      { name: "中央控制伺服器", role: "Central Server", icon: "💻", desc: "電量監控與充電樁佔用調度" },
      { name: "古蹟維運工作人員", role: "Staff", icon: "👨‍💻", desc: "後台能源狀態監控管理員" }
    ],
    preConditions: [
      "行程結束處於待命狀態，或電池管理系統 (BMS) 回報電量低於 25%。"
    ],
    postConditions: [
      "機器人安全對準充電極板，進入自動補電與全車感測器健檢休眠狀態。"
    ],
    eventFlow: [
      { step: 1, text: "機器人 BMS 偵測電量達充電閾值，觸發自主返航排程。" },
      { step: 2, text: "沿規劃之安全最短路徑自主穿過西側過水門，避開古蹟遊客。" },
      { step: 3, text: "在葡萄藤架旁充電樁前，利用 AprilTag 視覺標籤與雷射對位實現毫米級精準對接。" },
      { step: 4, text: "接觸極板通電，上傳當日巡導數據與感測器健康日誌。" }
    ],
    sequenceSteps: [
      { from: "導覽機器人", to: "中控伺服器", msg: "電量過低警示 (SOC < 25%) 請求返航充電", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "自主路徑規劃前往西側外苑充電樁", type: "internal" },
      { from: "導覽機器人", to: "導覽機器人", msg: "AprilTag 視覺伺服對齊與極板精準對接", type: "internal" },
      { from: "導覽機器人", to: "中控伺服器", msg: "對接成功，啟動補電與系統健檢", type: "sync" }
    ],
    techStack: ["BMS 電池管理系統", "AprilTag 視覺伺服對接", "紅外線精準對位", "自動充電管理樁"],
    speechText: "電量即將用盡，正在自主前往西側葡萄架旁的智慧充電樁進行補電與感測器校準。"
  },
  {
    id: "UC11",
    num: 11,
    title: "表情辨識主動關懷",
    titleEn: "Facial Expression Proactive Assistance",
    category: "智慧進階感知",
    locationName: "正廳軒亭與東廂過水廊巡視區",
    locationDesc: "正身與東廂交接處之通廊平台，遊客常在此凝視古厝木雕或碑文，為 AI 情緒感知深度巡視點。",
    pos: [10, 0, -6],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "駐留於木雕前露出思索或疑惑表情之訪客" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "具備同理心主動上前解惑之智慧體" },
      { name: "機器人視覺鏡頭", role: "Robot Vision Camera", icon: "📷", desc: "搭載人臉表情識別 (FER) 之深度相機" }
    ],
    preConditions: [
      "機器人處於場域巡邏狀態，車載 RGB-D 深度相機正常捕獲訪客臉部。"
    ],
    postConditions: [
      "機器人溫和上前提供深層文史解讀，化解遊客疑惑並提升參訪滿意度。"
    ],
    eventFlow: [
      { step: 1, text: "遊客在正身木雕或斗栱前駐足，臉部呈現皺眉、思索或疑惑表情超過 3 秒。" },
      { step: 2, text: "車載鏡頭透過情緒辨識 AI 模型 (FER) 判定訪客有解說需求。" },
      { step: 3, text: "機器人主動調整航向，以 0.2 m/s 極緩慢速度靠近至安全禮貌距離 (1.2m)。" },
      { step: 4, text: "溫和主動詢問：「我看您對這個木雕非常專注，需要為您講述上面的典故嗎？」" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "機器人視覺鏡頭", msg: "駐足並顯露疑惑/思索表情 (> 3秒)", type: "action" },
      { from: "機器人視覺鏡頭", to: "導覽機器人", msg: "觸發情緒分析事件 (Confused/Interested)", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "行為樹決策：自主微調路徑溫和靠攏", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "主動問候：「需要為您解說正身木雕的寓意嗎？」", type: "speech" }
    ],
    techStack: ["Facial Emotion Recognition (FER)", "MediaPipe FaceMesh", "行為樹決策系統 (Behavior Tree)"],
    speechText: "我看您對正身樑柱上的精細木雕非常專注，需要我為您補充這座三合院傳統漳州工藝的寓意小故事嗎？"
  },
  {
    id: "UC12",
    num: 12,
    title: "手勢辨識請求協助",
    titleEn: "Gesture Recognition & Call for Help",
    category: "智慧進階感知",
    locationName: "開闊前埕南側手勢呼叫互動區",
    locationDesc: "武魁祠開闊前埕南側，距離正身與護龍皆有開闊視角，遊客可遠距離向機器人招手呼叫協助。",
    pos: [-8, 0, 12],
    actors: [
      { name: "遊客", role: "Visitor", icon: "👤", desc: "在前埕開闊處向機器人招手呼叫之訪客" },
      { name: "機器人視覺鏡頭", role: "Robot Vision Camera", icon: "📷", desc: "動態骨架手勢追蹤 AI" },
      { name: "導覽機器人", role: "AMR Guide Robot", icon: "🤖", desc: "響應召喚即時前來服務之機器人" }
    ],
    preConditions: [
      "機器人處於前埕視野無遮蔽範圍內，巡導攝影機正常運作。"
    ],
    postConditions: [
      "機器人精準識別動態招手手勢，中斷常態任務導航至遊客身旁提供所需服務。"
    ],
    eventFlow: [
      { step: 1, text: "遊客在前埕遠端向導覽機器人做出連續『揮手 (Waving)』或『舉手』動作。" },
      { step: 2, text: "機器人全景相機透過 MediaPipe 人體骨架關鍵點追蹤，判定為即時呼叫指令。" },
      { step: 3, text: "機器人車載 LED 面板閃爍確認光效，並發出「收到召喚」輕快提示音。" },
      { step: 4, text: "機器人轉向遊客方位，自主導航抵達遊客面前：「我聽到您的呼喚了！請問需要什麼協助？」" }
    ],
    sequenceSteps: [
      { from: "遊客", to: "機器人視覺鏡頭", msg: "在前埕開闊處連續揮手招呼", type: "action" },
      { from: "機器人視覺鏡頭", to: "導覽機器人", msg: "AI 辨識手勢「Hand Waving Detected」", type: "sync" },
      { from: "導覽機器人", to: "導覽機器人", msg: "任務優先級提升，鎖定遊客座標自主前往", type: "internal" },
      { from: "導覽機器人", to: "遊客", msg: "抵達身旁回應：「我來到您身旁了，請問有何需要協助？」", type: "speech" }
    ],
    techStack: ["MediaPipe Hands / Holistic", "動態手勢時序分類 (LSTM/GRU)", "任務優先級動態排程"],
    speechText: "我看到您的揮手招喚了！請問需要為您重新導航路線、尋找洗手間，還是重播剛才的正廳文史解說呢？"
  }
];

// 匯出常數（相容瀏覽器全域變數與 Node 環境）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { UC_DATA };
}
