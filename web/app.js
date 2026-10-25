/**
 * 大村武魁祠 × AMR 智慧導覽島嶼 (Wukui AMR Island)
 * Three.js 3D 核心互動引擎 - 擴增大地圖與真實 Google 地景具象化版本
 */

// 全域狀態
let scene, camera, renderer, controls;
let robotGroup, lidarTurret, scanRingMesh;
let waterMesh;
let ucStationMeshes = [];
let activeUCIndex = 0;
let isTourRunning = false;
let tourTimeoutId = null;
let isRobotCamActive = false;
let raycaster, mouse;

// 擴張後的宏偉古蹟地圖視角 (鳥瞰全景)
const DEFAULT_CAM_POS = { x: 0, y: 52, z: 68 };
const DEFAULT_LOOK_AT = { x: 0, y: 3, z: 12 };

// 初始化入口
window.addEventListener("DOMContentLoaded", () => {
  init3DScene();
  buildDacunWukuiAncestralHall();
  build12UCStationBeacons();
  buildAMRRobot();
  setupUI();
  setupEvents();
  animate();

  // 預設選取 UC01，讓使用者一進來就看到外圍迎賓首站
  setTimeout(() => {
    selectUC(0, false);
  }, 600);
});

/* ==========================================================================
   1. 3D 場景與燈光初始化 (擴大場景範圍)
   ========================================================================== */
function init3DScene() {
  const container = document.getElementById("canvas-container");

  // 場景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c121e);
  scene.fog = new THREE.FogExp2(0x0c121e, 0.0075); // 視野更遼闊

  // 相機
  camera = new THREE.PerspectiveCamera(
    46,
    window.innerWidth / window.innerHeight,
    0.5,
    600
  );
  camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // 軌道控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 8;
  controls.maxDistance = 190;
  controls.target.set(DEFAULT_LOOK_AT.x, DEFAULT_LOOK_AT.y, DEFAULT_LOOK_AT.z);

  // 環境光
  const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.75);
  scene.add(ambientLight);

  // 暖陽主光 (模擬彰化大村明媚日照)
  const sunLight = new THREE.DirectionalLight(0xfffae6, 1.45);
  sunLight.position.set(45, 75, 45);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 240;
  sunLight.shadow.camera.left = -65;
  sunLight.shadow.camera.right = 65;
  sunLight.shadow.camera.top = 65;
  sunLight.shadow.camera.bottom = -65;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // 科技冷青補光
  const techFillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
  techFillLight.position.set(-50, 30, -40);
  scene.add(techFillLight);

  // 正身軒亭暖色照明
  const hallLight = new THREE.PointLight(0xf97316, 2.8, 30);
  hallLight.position.set(0, 5, -3);
  scene.add(hallLight);

  // 燕尾門樓紅燈籠暖光
  const gateLight = new THREE.PointLight(0xef4444, 2.2, 22);
  gateLight.position.set(0, 4.5, 20);
  scene.add(gateLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

/* ==========================================================================
   2. 彰化大村武魁祠三合院古蹟 3D 場景建構 (Google 實景具象化)
   ========================================================================== */
function buildDacunWukuiAncestralHall() {
  const estate = new THREE.Group();

  // (1) 宏大卡坦蜂巢六角浮島基座 (半徑擴大至 62，面積提升 4 倍以上)
  const islandRadius = 62;
  const islandHeight = 5.0;
  const islandGeo = new THREE.CylinderGeometry(islandRadius, islandRadius * 1.04, islandHeight, 6);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.15
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = -islandHeight / 2;
  island.receiveShadow = true;
  estate.add(island);

  // 頂部大村綠野草皮 (彰化平原田野綠意)
  const grassGeo = new THREE.CylinderGeometry(islandRadius * 0.99, islandRadius * 0.99, 0.25, 6);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x244c33,
    roughness: 0.9
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.12;
  grass.receiveShadow = true;
  estate.add(grass);

  // 材質庫
  const redBrickMat = new THREE.MeshStandardMaterial({ color: 0xa8321e, roughness: 0.82 }); // 斗仔砌紅磚
  const darkTileMat = new THREE.MeshStandardMaterial({ color: 0x2b3342, roughness: 0.45 }); // 硬山仰合黑瓦
  const darkTimberMat = new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.75 }); // 福州杉木柱樑
  const stonePaverMat = new THREE.MeshStandardMaterial({ color: 0x827a70, roughness: 0.8 }); // 泉州白石板
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 }); // 臺度花崗岩
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.6 }); // 鎏金匾額

  // (2) 開闊大前埕廣場 (Courtyard Pavers: 容納旗杆、曬穀與宗族慶典)
  const courtyardGeo = new THREE.BoxGeometry(38, 0.22, 34);
  const courtyard = new THREE.Mesh(courtyardGeo, stonePaverMat);
  courtyard.position.set(0, 0.2, 6);
  courtyard.receiveShadow = true;
  estate.add(courtyard);

  // 聯外走道 (接引至貢旗一巷)
  const laneGeo = new THREE.BoxGeometry(7, 0.21, 30);
  const lane = new THREE.Mesh(laneGeo, stonePaverMat);
  lane.position.set(0, 0.2, 38);
  lane.receiveShadow = true;
  estate.add(lane);

  // ==========================================
  // (3) 五開間正身 (Main Ancestral Hall - 五開間大宅)
  // ==========================================
  const mainHallGroup = new THREE.Group();
  mainHallGroup.position.set(0, 0, -14);

  // 花崗岩臺度基座 (抬高以彰顯尊貴地位)
  const podiumGeo = new THREE.BoxGeometry(32, 0.6, 10);
  const podium = new THREE.Mesh(podiumGeo, graniteMat);
  podium.position.set(0, 0.3, 0);
  podium.receiveShadow = true;
  mainHallGroup.add(podium);

  // 明間 (中央正廳 - 凹壽作法，大門退縮)
  // 凹壽後牆
  const recessBackGeo = new THREE.BoxGeometry(8, 5.5, 0.6);
  const recessBack = new THREE.Mesh(recessBackGeo, redBrickMat);
  recessBack.position.set(0, 3.35, -2.5);
  recessBack.castShadow = true;
  mainHallGroup.add(recessBack);

  // 凹壽左右側牆
  [-4, 4].forEach((x) => {
    const recessSideGeo = new THREE.BoxGeometry(0.6, 5.5, 3.0);
    const recessSide = new THREE.Mesh(recessSideGeo, redBrickMat);
    recessSide.position.set(x, 3.35, -1.0);
    recessSide.castShadow = true;
    mainHallGroup.add(recessSide);
  });

  // 三關六扇門 (紅漆木門)
  const doorGeo = new THREE.BoxGeometry(4.2, 4.0, 0.25);
  const door = new THREE.Mesh(doorGeo, darkTimberMat);
  door.position.set(0, 2.6, -2.2);
  mainHallGroup.add(door);

  // 門額高懸：福建巡撫慶端贈「兄弟同榜」匾額
  const tongBangSignGeo = new THREE.BoxGeometry(3.6, 1.1, 0.2);
  const tongBangSign = new THREE.Mesh(tongBangSignGeo, goldMat);
  tongBangSign.position.set(0, 5.0, -2.15);
  mainHallGroup.add(tongBangSign);

  // 兩側次間與梢間立面 (面寬拓展至五開間)
  [-9, 9].forEach((x) => {
    // 次間牆體
    const subBayGeo = new THREE.BoxGeometry(6, 5.2, 6.5);
    const subBay = new THREE.Mesh(subBayGeo, redBrickMat);
    subBay.position.set(x, 3.2, -0.5);
    subBay.castShadow = true;
    subBay.receiveShadow = true;
    mainHallGroup.add(subBay);

    // 格扇木窗裝飾
    const windowGeo = new THREE.BoxGeometry(2.4, 2.2, 0.15);
    const windowFrame = new THREE.Mesh(windowGeo, darkTimberMat);
    windowFrame.position.set(x, 3.2, 2.8);
    mainHallGroup.add(windowFrame);
  });

  [-14.5, 14.5].forEach((x) => {
    // 梢間牆體 (略低以顯尊卑層次)
    const endBayGeo = new THREE.BoxGeometry(5, 4.8, 6.0);
    const endBay = new THREE.Mesh(endBayGeo, redBrickMat);
    endBay.position.set(x, 3.0, -0.5);
    endBay.castShadow = true;
    endBay.receiveShadow = true;
    mainHallGroup.add(endBay);
  });

  // 正身雙層硬山燕尾脊屋頂 (Double Swallowtail Roof)
  const mainRoofGeo = new THREE.ConeGeometry(17, 4.2, 4);
  const mainRoof = new THREE.Mesh(mainRoofGeo, darkTileMat);
  mainRoof.position.set(0, 7.8, -0.5);
  mainRoof.rotation.y = Math.PI / 4;
  mainRoof.scale.set(1.45, 0.9, 0.7);
  mainRoof.castShadow = true;
  mainHallGroup.add(mainRoof);

  // 氣派向上高翹的燕尾脊尖 (兩端高翹如燕尾雙剪)
  [-13.5, 13.5].forEach((x) => {
    const ridgeTipGeo = new THREE.ConeGeometry(0.4, 2.6, 4);
    const ridgeTip = new THREE.Mesh(ridgeTipGeo, goldMat);
    ridgeTip.position.set(x, 9.2, -0.5);
    ridgeTip.rotation.z = x > 0 ? -0.7 : 0.7;
    mainHallGroup.add(ridgeTip);
  });

  estate.add(mainHallGroup);

  // ==========================================
  // (4) 軒亭 (拜亭 Pavilion - 正身前方的獨立木造儀式拜亭)
  // ==========================================
  const xuanTingGroup = new THREE.Group();
  xuanTingGroup.position.set(0, 0, -8);

  // 軒亭基座
  const xtBaseGeo = new THREE.BoxGeometry(7, 0.45, 6);
  const xtBase = new THREE.Mesh(xtBaseGeo, stonePaverMat);
  xtBase.position.set(0, 0.22, 0);
  xuanTingGroup.add(xtBase);

  // 四根圓形木造承重立柱 (福州杉木圓柱)
  const pillarGeo = new THREE.CylinderGeometry(0.2, 0.24, 4.6, 16);
  [
    [-2.8, -2.2],
    [2.8, -2.2],
    [-2.8, 2.2],
    [2.8, 2.2]
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, darkTimberMat);
    pillar.position.set(px, 2.4, pz);
    pillar.castShadow = true;
    xuanTingGroup.add(pillar);
  });

  // 懸山馬背頂 (Overhanging Gable Roof)
  const xtRoofGeo = new THREE.ConeGeometry(4.8, 2.2, 4);
  const xtRoof = new THREE.Mesh(xtRoofGeo, darkTileMat);
  xtRoof.position.set(0, 5.2, 0);
  xtRoof.rotation.y = Math.PI / 4;
  xtRoof.scale.set(1.1, 0.85, 0.9);
  xtRoof.castShadow = true;
  xuanTingGroup.add(xtRoof);

  estate.add(xuanTingGroup);

  // ==========================================
  // (5) 左右護龍 (Left & Right Wings - ㄇ字型起居廂房)
  // ==========================================
  const wingLength = 26;
  const wingWidth = 5.5;
  const wingHeight = 4.8;
  const wingGeo = new THREE.BoxGeometry(wingWidth, wingHeight, wingLength);
  const wingRoofGeo = new THREE.ConeGeometry(5.2, 2.6, 4);

  // 東護龍 (左廂 - UC07 常民文化展示區)
  const eastWing = new THREE.Mesh(wingGeo, redBrickMat);
  eastWing.position.set(17, wingHeight / 2, 0);
  eastWing.castShadow = true;
  eastWing.receiveShadow = true;
  estate.add(eastWing);

  const eastRoof = new THREE.Mesh(wingRoofGeo, darkTileMat);
  eastRoof.position.set(17, wingHeight + 1.2, 0);
  eastRoof.rotation.y = Math.PI / 4;
  eastRoof.scale.set(0.75, 0.95, 3.6);
  eastRoof.castShadow = true;
  estate.add(eastRoof);

  // 西護龍 (右廂 - UC08 多媒體問答區)
  const westWing = new THREE.Mesh(wingGeo, redBrickMat);
  westWing.position.set(-17, wingHeight / 2, 0);
  westWing.castShadow = true;
  westWing.receiveShadow = true;
  estate.add(westWing);

  const westRoof = new THREE.Mesh(wingRoofGeo, darkTileMat);
  westRoof.position.set(-17, wingHeight + 1.2, 0);
  westRoof.rotation.y = Math.PI / 4;
  westRoof.scale.set(0.75, 0.95, 3.6);
  westRoof.castShadow = true;
  estate.add(westRoof);

  // 護龍出挑廊柱 (檐廊走道)
  [-14.5, 14.5].forEach((wx) => {
    for (let z = -10; z <= 10; z += 5) {
      const wPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 12), darkTimberMat);
      wPillar.position.set(wx, 2.1, z);
      estate.add(wPillar);
    }
  });

  // ==========================================
  // (6) 獨立硬山燕尾門樓（院門）與院牆
  // ==========================================
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 20);

  // 門樓主牆
  const gateMainGeo = new THREE.BoxGeometry(8, 5.0, 2.4);
  const gateMain = new THREE.Mesh(gateMainGeo, redBrickMat);
  gateMain.position.set(0, 2.5, 0);
  gateMain.castShadow = true;
  gateGroup.add(gateMain);

  // 中央拱門通道 (穿透式門洞)
  const archGeo = new THREE.BoxGeometry(3.0, 3.8, 3.0);
  const archMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const archTunnel = new THREE.Mesh(archGeo, archMat);
  archTunnel.position.set(0, 1.9, 0);
  gateGroup.add(archTunnel);

  // 門樓門額上方：黑底金字「武魁」匾額
  const wukuiPlaqueGeo = new THREE.BoxGeometry(2.8, 0.95, 0.2);
  const wukuiPlaqueMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
  const wukuiPlaque = new THREE.Mesh(wukuiPlaqueGeo, wukuiPlaqueMat);
  wukuiPlaque.position.set(0, 4.35, 1.25);
  gateGroup.add(wukuiPlaque);

  // 「武魁」金字標章
  const goldTextGeo = new THREE.BoxGeometry(2.2, 0.6, 0.05);
  const goldText = new THREE.Mesh(goldTextGeo, goldMat);
  goldText.position.set(0, 4.35, 1.36);
  gateGroup.add(goldText);

  // 綠釉花磚透窗 (門樓兩側對稱透光窗孔)
  [-2.8, 2.8].forEach((gx) => {
    const glazeGeo = new THREE.BoxGeometry(1.2, 1.5, 0.2);
    const glazeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.2, metalness: 0.5 });
    const glazeWin = new THREE.Mesh(glazeGeo, glazeMat);
    glazeWin.position.set(gx, 2.6, 1.22);
    gateGroup.add(glazeWin);
  });

  // 門樓硬山雙燕尾脊屋頂
  const gateRoofGeo = new THREE.ConeGeometry(5.8, 2.5, 4);
  const gateRoof = new THREE.Mesh(gateRoofGeo, darkTileMat);
  gateRoof.position.set(0, 5.8, 0);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.scale.set(1.35, 0.85, 0.75);
  gateRoof.castShadow = true;
  gateGroup.add(gateRoof);

  // 門樓燕尾角
  [-4.8, 4.8].forEach((x) => {
    const gRidgeTip = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 4), goldMat);
    gRidgeTip.position.set(x, 6.7, 0);
    gRidgeTip.rotation.z = x > 0 ? -0.65 : 0.65;
    gateGroup.add(gRidgeTip);
  });

  // 兩側紅磚矮院牆 (連接門樓與左右護龍端點)
  [-10.5, 10.5].forEach((wx) => {
    const wallGeo = new THREE.BoxGeometry(7, 2.4, 0.6);
    const wall = new THREE.Mesh(wallGeo, redBrickMat);
    wall.position.set(wx, 1.2, 0);
    wall.castShadow = true;
    gateGroup.add(wall);
  });

  estate.add(gateGroup);

  // ==========================================
  // (7) 半月形風水池 (Half-Moon Feng-Shui Pond)
  // ==========================================
  const pondGroup = new THREE.Group();
  pondGroup.position.set(0, 0, 36);

  // 石駁岸池壁 (半月形圓環斷面)
  const curbGeo = new THREE.CylinderGeometry(15, 15, 0.4, 32, 1, false, 0, Math.PI);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.y = 0.2;
  pondGroup.add(curb);

  // 清澈半月池水面 (微透青藍水質)
  const waterGeo = new THREE.CircleGeometry(14.6, 32, 0, Math.PI);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.75
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.22;
  pondGroup.add(waterMesh);

  // 水生睡蓮葉裝飾
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
  [
    [-6, 4],
    [-2, 8],
    [5, 5],
    [8, 2]
  ].forEach(([lx, lz]) => {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12), lilyMat);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(lx, 0.25, lz);
    pondGroup.add(lily);
  });

  estate.add(pondGroup);

  // ==========================================
  // (8) 賴氏舉人雙旗杆石座與高聳令旗群
  // ==========================================
  [-7, 7].forEach((x) => {
    // 兩層雕琢花崗石石夾柱基座
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), graniteMat);
    b1.position.set(x, 0.3, 10);
    b1.castShadow = true;
    estate.add(b1);

    const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 1.1), graniteMat);
    b2.position.set(x, 1.2, 10);
    b2.castShadow = true;
    estate.add(b2);

    // 朱紅高聳旗杆
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 11, 16), poleMat);
    pole.position.set(x, 6.5, 10);
    pole.castShadow = true;
    estate.add(pole);

    // 咸豐九年武舉人旌旗 (金黃鑲邊朱紅旗面)
    const flagGeo = new THREE.PlaneGeometry(2.4, 1.5);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      roughness: 0.5
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + 1.2, 11.2, 10);
    estate.add(flag);
  });

  // ==========================================
  // (9) 大村在地特色景觀 (葡萄藤架與文史造景)
  // ==========================================
  buildDacunRuralLandscape(estate);

  scene.add(estate);
}

// 彰化大村巨峰葡萄藤架與鄉村老樹
function buildDacunRuralLandscape(parent) {
  // 西側：大村巨峰葡萄藤架 (Dacun Grape Trellis - 呼應 UC10 充電區地景)
  const trellisGroup = new THREE.Group();
  trellisGroup.position.set(-28, 0, -6);

  const woodPoleMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const vineLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.4 }); // 巨峰深紫葡萄

  // 葡萄棚架立柱與橫樑
  for (let x = -3; x <= 3; x += 3) {
    for (let z = -5; z <= 5; z += 5) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), woodPoleMat);
      p.position.set(x, 1.6, z);
      trellisGroup.add(p);
    }
  }

  // 棚架頂部藤蔓
  const canopyGeo = new THREE.BoxGeometry(7, 0.3, 11);
  const canopy = new THREE.Mesh(canopyGeo, vineLeafMat);
  canopy.position.set(0, 3.2, 0);
  trellisGroup.add(canopy);

  // 垂吊之紫晶巨峰葡萄串
  [
    [-1.5, 2.7, -3],
    [1.5, 2.7, -1],
    [-0.5, 2.7, 2],
    [1.8, 2.7, 4]
  ].forEach(([gx, gy, gz]) => {
    const bunch = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8), grapeMat);
    bunch.position.set(gx, gy, gz);
    trellisGroup.add(bunch);
  });

  parent.add(trellisGroup);

  // 東側：百年古井與老樹
  const wellGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.8, 16);
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const well = new THREE.Mesh(wellGeo, wellMat);
  well.position.set(28, 0.4, 2);
  parent.add(well);

  // 四周百年古榕樹與綠竹林
  const treePositions = [
    [-34, 0, -22],
    [34, 0, -22],
    [-36, 0, 18],
    [36, 0, 20],
    [-24, 0, 42],
    [26, 0, 44]
  ];

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x422a1d, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });

  treePositions.forEach(([tx, ty, tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 8), trunkMat);
    trunk.position.set(tx, 2.5, tz);
    trunk.castShadow = true;
    parent.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6, 1), foliageMat);
    foliage.position.set(tx, 6.5, tz);
    foliage.castShadow = true;
    parent.add(foliage);
  });
}

/* ==========================================================================
   3. 12 個獨立用例 (UC01 ~ UC12) 3D 浮島地標節點 (高挑開闊、絕不被擋)
   ========================================================================== */
function build12UCStationBeacons() {
  const stationGroup = new THREE.Group();

  UC_DATA.forEach((uc, index) => {
    const [x, y, z] = uc.pos;
    const subGroup = new THREE.Group();
    subGroup.position.set(x, y, z);
    subGroup.userData = { ucIndex: index, ucId: uc.id };

    // 1. 卡坦島式六角獨立小地台 (半徑擴增至 2.4，踏面寬廣)
    const hexGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.5, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.5
    });
    const hexPlatform = new THREE.Mesh(hexGeo, hexMat);
    hexPlatform.position.y = 0.25;
    hexPlatform.receiveShadow = true;
    subGroup.add(hexPlatform);

    // 2. 科技發光感應圓環 (Sensor Pulse Ring)
    const ringGeo = new THREE.RingGeometry(1.6, 2.1, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.52;
    subGroup.add(ring);

    // 3. 垂直微光柱 (Beacon Beam - 增高至 4.8 確保空中遠眺一目瞭然)
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.8, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.6;
    subGroup.add(beam);

    // 4. 懸浮 3D 標籤看板 (提高至 5.8m，永不被屋頂矮牆遮擋)
    const sprite = createUCSprite(uc.id, index + 1);
    sprite.position.y = 5.8;
    subGroup.add(sprite);

    // 5. 點擊碰撞專用隱形 Mesh (增大點擊判定盒)
    const hitBoxGeo = new THREE.CylinderGeometry(2.6, 2.6, 6.5, 8);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.y = 3.25;
    hitBox.userData = { ucIndex: index, ucId: uc.id };
    subGroup.add(hitBox);

    stationGroup.add(subGroup);
    ucStationMeshes.push({
      group: subGroup,
      ring: ring,
      sprite: sprite,
      hitBox: hitBox,
      data: uc
    });
  });

  scene.add(stationGroup);
}

// 產生高解析 3D 看板 Sprite (Canvas 2D 繪製)
function createUCSprite(ucId, num) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // 背景圓角矩形 (發光玻璃質感)
  ctx.fillStyle = "rgba(11, 18, 33, 0.92)";
  roundRect(ctx, 8, 8, 240, 112, 28);
  ctx.fill();

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 6;
  ctx.stroke();

  // UC 編號字樣
  ctx.fillStyle = "#f59e0b"; // 榮譽金
  ctx.font = "bold 52px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ucId, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.4, 1.7, 1);
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/* ==========================================================================
   4. 3D 自主移動導覽機器人 (AMR Robot) 模型建構
   ========================================================================== */
function buildAMRRobot() {
  robotGroup = new THREE.Group();
  robotGroup.position.set(0, 0.35, 24); // 初始待命位置 (在燕尾門樓迎賓位)

  // 機器人圓形流線底盤 (稍微放大以配合大尺度場景)
  const chassisGeo = new THREE.CylinderGeometry(1.0, 1.15, 0.75, 32);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.5,
    roughness: 0.2
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  robotGroup.add(chassis);

  // 黑色互動資訊觸控螢幕面板 (前置)
  const screenGeo = new THREE.BoxGeometry(0.95, 0.55, 0.12);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.65, 1.05);
  screen.rotation.x = -0.22;
  robotGroup.add(screen);

  // 頂部旋轉 360° LiDAR 光達感測器
  lidarTurret = new THREE.Group();
  lidarTurret.position.set(0, 1.0, 0);

  const lidarBaseGeo = new THREE.CylinderGeometry(0.3, 0.34, 0.3, 24);
  const lidarBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
  const lidarBase = new THREE.Mesh(lidarBaseGeo, lidarBaseMat);
  lidarTurret.add(lidarBase);

  // 光達雷射掃描薄扇 (Laser Beam Fan)
  const laserFanGeo = new THREE.RingGeometry(0.35, 4.2, 32, 1, 0, Math.PI / 3);
  const laserFanMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4
  });
  const laserFan = new THREE.Mesh(laserFanGeo, laserFanMat);
  laserFan.rotation.x = -Math.PI / 2;
  laserFan.position.y = 0.16;
  lidarTurret.add(laserFan);

  robotGroup.add(lidarTurret);

  // 機器人底部 SLAM 點雲導航光圈
  const slamRingGeo = new THREE.RingGeometry(1.2, 1.5, 32);
  const slamRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });
  scanRingMesh = new THREE.Mesh(slamRingGeo, slamRingMat);
  scanRingMesh.rotation.x = -Math.PI / 2;
  scanRingMesh.position.y = -0.15;
  robotGroup.add(scanRingMesh);

  scene.add(robotGroup);
}

/* ==========================================================================
   5. UI 初始化與 12 個獨立用例選單
   ========================================================================== */
function setupUI() {
  const dockContainer = document.getElementById("dock-items");
  dockContainer.innerHTML = "";

  UC_DATA.forEach((uc, index) => {
    const btn = document.createElement("button");
    btn.className = `uc-item-btn ${index === 0 ? "active" : ""}`;
    btn.id = `dock-btn-${index}`;
    btn.innerHTML = `
      <div class="uc-badge-id">${uc.id}</div>
      <div class="uc-badge-title">${uc.title}</div>
    `;
    btn.addEventListener("click", () => {
      selectUC(index, true);
    });
    dockContainer.appendChild(btn);
  });
}

// 選取特定 UC：相機流暢運鏡 + 機器人導航移動 + 更新抽屜資訊
function selectUC(index, triggerCameraMove = true) {
  if (index < 0 || index >= UC_DATA.length) return;
  activeUCIndex = index;
  const uc = UC_DATA[index];

  // 1. 更新底部 Dock 按鈕狀態
  document.querySelectorAll(".uc-item-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });

  const activeBtn = document.getElementById(`dock-btn-${index}`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  // 2. 更新 3D 浮島節點外觀高亮
  ucStationMeshes.forEach((station, i) => {
    if (i === index) {
      station.ring.material.color.setHex(0xf59e0b); // 榮譽金
      station.ring.scale.set(1.4, 1.4, 1.4);
    } else {
      station.ring.material.color.setHex(0x22d3ee); // 科技青藍
      station.ring.scale.set(1.0, 1.0, 1.0);
    }
  });

  // 3. 觸發 3D AMR 機器人自主路徑導航至該 UC 座標
  moveRobotTo(uc.pos[0], uc.pos[2]);

  // 4. 平滑運鏡相機
  if (triggerCameraMove && !isRobotCamActive) {
    focusCameraOn(uc.pos[0], uc.pos[1], uc.pos[2]);
  }

  // 5. 填入抽屜詳細資料並打開抽屜
  renderUCDrawer(uc);
}

// 渲染側邊抽屜內容
function renderUCDrawer(uc) {
  document.getElementById("drawer-category").innerText = uc.category;
  document.getElementById("drawer-id").innerText = uc.id;
  document.getElementById("drawer-title").innerText = uc.title;
  document.getElementById("drawer-title-en").innerText = uc.titleEn;
  document.getElementById("drawer-loc-name").innerText = uc.locationName;
  document.getElementById("drawer-loc-desc").innerText = uc.locationDesc;

  // 參與者 Actors
  const actorsEl = document.getElementById("drawer-actors");
  actorsEl.innerHTML = uc.actors
    .map(
      (a) => `
      <div class="actor-chip">
        <span class="icon">${a.icon}</span>
        <div>
          <strong>${a.name}</strong>
          <span style="font-size: 0.72rem; color: #94a3b8; display: block;">${a.role}</span>
        </div>
      </div>
    `
    )
    .join("");

  // 前置條件
  const precondsEl = document.getElementById("drawer-preconds");
  precondsEl.innerHTML = uc.preConditions.map((c) => `<li>${c}</li>`).join("");

  // 主要事件流
  const flowEl = document.getElementById("drawer-event-flow");
  flowEl.innerHTML = uc.eventFlow
    .map(
      (s) => `
      <div class="event-step-item">
        <div class="step-num">${s.step}</div>
        <div class="step-text">${s.text}</div>
      </div>
    `
    )
    .join("");

  // UML 循序步驟視覺化
  const seqEl = document.getElementById("drawer-seq-box");
  seqEl.innerHTML = uc.sequenceSteps
    .map(
      (sq) => `
      <div class="seq-item">
        <span class="seq-from">${sq.from}</span>
        <span class="seq-arrow">➔</span>
        <span class="seq-msg">${sq.msg}</span>
        <span class="seq-to">[${sq.to}]</span>
      </div>
    `
    )
    .join("");

  // 後置條件
  const postcondsEl = document.getElementById("drawer-postconds");
  postcondsEl.innerHTML = uc.postConditions.map((c) => `<li>${c}</li>`).join("");

  // 技術標籤
  const techEl = document.getElementById("drawer-tech");
  techEl.innerHTML = uc.techStack.map((t) => `<span class="tech-tag">${t}</span>`).join("");

  // 打開抽屜
  document.getElementById("uc-drawer").classList.add("open");
}

/* ==========================================================================
   6. 3D 動畫與運鏡控制 (TWEEN.js)
   ========================================================================== */
// 相機聚焦動畫 (針對大尺度場景優化特寫距離)
function focusCameraOn(targetX, targetY, targetZ) {
  const offset = { x: 0, y: 16, z: 22 };
  const targetCamPos = {
    x: targetX + offset.x,
    y: targetY + offset.y,
    z: targetZ + offset.z
  };

  new TWEEN.Tween(camera.position)
    .to(targetCamPos, 1400)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  new TWEEN.Tween(controls.target)
    .to({ x: targetX, y: targetY + 1.6, z: targetZ }, 1400)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

// 機器人自主導航平滑行進至指定座標
function moveRobotTo(destX, destZ) {
  if (!robotGroup) return;

  const dx = destX - robotGroup.position.x;
  const dz = destZ - robotGroup.position.z;
  const targetAngle = Math.atan2(dx, dz);

  new TWEEN.Tween(robotGroup.rotation)
    .to({ y: targetAngle }, 450)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  new TWEEN.Tween(robotGroup.position)
    .to({ x: destX, z: destZ }, 1500)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

// 重置相機為宏偉鳥瞰視角
function resetCameraView() {
  isRobotCamActive = false;
  document.getElementById("btn-robot-cam").classList.remove("active");

  new TWEEN.Tween(camera.position)
    .to(DEFAULT_CAM_POS, 1400)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  new TWEEN.Tween(controls.target)
    .to(DEFAULT_LOOK_AT, 1400)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

/* ==========================================================================
   7. 巡航導覽模式 (Guided Story Tour: UC01 -> UC12)
   ========================================================================== */
function startGuidedTour() {
  isTourRunning = true;
  document.getElementById("tour-hud").classList.add("active");
  document.getElementById("btn-tour").classList.add("active");
  document.getElementById("tour-btn-text").innerText = "巡航中...";

  let currentTourStep = 0;

  function runTourStep() {
    if (!isTourRunning) return;
    if (currentTourStep >= UC_DATA.length) {
      stopGuidedTour();
      alert("🎉 恭喜！大村武魁祠 12 項自主導覽用例巡航演示完畢！");
      return;
    }

    const uc = UC_DATA[currentTourStep];
    document.getElementById("tour-status-text").innerText = `導覽進行中 (${currentTourStep + 1}/12)：${uc.id} ${uc.title}`;
    selectUC(currentTourStep, true);

    speakText(uc.speechText);

    currentTourStep++;
    tourTimeoutId = setTimeout(runTourStep, 8000);
  }

  runTourStep();
}

function stopGuidedTour() {
  isTourRunning = false;
  if (tourTimeoutId) clearTimeout(tourTimeoutId);
  document.getElementById("tour-hud").classList.remove("active");
  document.getElementById("btn-tour").classList.remove("active");
  document.getElementById("tour-btn-text").innerText = "啟動巡航導覽";
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/* ==========================================================================
   8. 語音合成模擬 (Web Speech API 在地化解說)
   ========================================================================== */
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 1.0;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

/* ==========================================================================
   9. 事件監聽與使用者互動
   ========================================================================== */
function setupEvents() {
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onCanvasClick);

  document.getElementById("btn-tour").addEventListener("click", () => {
    if (isTourRunning) {
      stopGuidedTour();
    } else {
      startGuidedTour();
    }
  });

  document.getElementById("btn-stop-tour").addEventListener("click", stopGuidedTour);
  document.getElementById("btn-reset-cam").addEventListener("click", resetCameraView);

  // 機器人視角切換
  document.getElementById("btn-robot-cam").addEventListener("click", () => {
    isRobotCamActive = !isRobotCamActive;
    document.getElementById("btn-robot-cam").classList.toggle("active", isRobotCamActive);
    if (!isRobotCamActive) {
      resetCameraView();
    }
  });

  // 抽屜關閉與上下用例導航
  document.getElementById("drawer-close-btn").addEventListener("click", () => {
    document.getElementById("uc-drawer").classList.remove("open");
  });

  document.getElementById("btn-prev-uc").addEventListener("click", () => {
    const prev = (activeUCIndex - 1 + UC_DATA.length) % UC_DATA.length;
    selectUC(prev, true);
  });

  document.getElementById("btn-next-uc").addEventListener("click", () => {
    const next = (activeUCIndex + 1) % UC_DATA.length;
    selectUC(next, true);
  });

  // 語音朗讀當前用例
  document.getElementById("btn-speak").addEventListener("click", () => {
    const currentUC = UC_DATA[activeUCIndex];
    speakText(currentUC.speechText);
  });

  // 文史簡介 Modal
  document.getElementById("btn-info").addEventListener("click", () => {
    document.getElementById("info-modal").classList.add("open");
  });

  document.getElementById("btn-close-modal").addEventListener("click", () => {
    document.getElementById("info-modal").classList.remove("open");
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hitBoxes = ucStationMeshes.map((s) => s.hitBox);
  const intersects = raycaster.intersectObjects(hitBoxes);

  const tooltip = document.getElementById("tooltip-3d");

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
    const hitObj = intersects[0].object;
    const uc = UC_DATA[hitObj.userData.ucIndex];
    tooltip.style.display = "block";
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    tooltip.innerHTML = `<strong>${uc.id}</strong>: ${uc.title} (${uc.locationName})`;
  } else {
    document.body.style.cursor = "default";
    tooltip.style.display = "none";
  }
}

function onCanvasClick(event) {
  if (event.target.closest(".top-nav, .bottom-dock, .uc-drawer, .modal-card, .tour-hud")) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const hitBoxes = ucStationMeshes.map((s) => s.hitBox);
  const intersects = raycaster.intersectObjects(hitBoxes);

  if (intersects.length > 0) {
    const hitObj = intersects[0].object;
    selectUC(hitObj.userData.ucIndex, true);
  }
}

/* ==========================================================================
   10. 主渲染循環 (Animation Loop)
   ========================================================================== */
function animate(time) {
  requestAnimationFrame(animate);

  TWEEN.update();

  // 光達旋轉
  if (lidarTurret) {
    lidarTurret.rotation.y += 0.045;
  }

  // SLAM 點雲光圈呼吸動態
  if (scanRingMesh) {
    const scale = 1 + Math.sin(time * 0.003) * 0.08;
    scanRingMesh.scale.set(scale, scale, scale);
  }

  // 12 個節點標籤懸浮沉浮動態
  ucStationMeshes.forEach((st, idx) => {
    st.sprite.position.y = 5.8 + Math.sin(time * 0.002 + idx) * 0.2;
  });

  // 半月風水池水面柔波反光動畫
  if (waterMesh) {
    waterMesh.material.opacity = 0.72 + Math.sin(time * 0.0015) * 0.06;
  }

  // 機器人跟隨視角
  if (isRobotCamActive && robotGroup) {
    const camOffset = new THREE.Vector3(0, 2.4, -4.0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      robotGroup.rotation.y
    );
    camera.position.copy(robotGroup.position).add(camOffset);
    const lookTarget = robotGroup.position
      .clone()
      .add(
        new THREE.Vector3(0, 1.4, 8).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          robotGroup.rotation.y
        )
      );
    camera.lookAt(lookTarget);
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
}
