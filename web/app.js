/**
 * 大村武魁祠 × AMR 智慧導覽島嶼 (Wukui AMR Island)
 * Three.js 3D 核心互動引擎 - 具象化傳統閩南古蹟建築旗艦版
 * 嚴格考究大村武魁新厝（賴登雲故居）：
 * 1. 五開間正身（中央凹壽、三關六扇門、兄弟同榜匾、硬山雙燕尾脊）
 * 2. 獨立木造懸山軒亭（四柱拜亭、斗栱柱珠）
 * 3. 獨立硬山燕尾門樓（武魁匾、綠釉花磚透窗、斗仔砌紅磚院牆）
 * 4. 半月形風水池（石砌駁岸、波光水面、睡蓮步道）
 * 5. 賴氏咸豐九年雙舉人旗杆石座群（石夾柱、朱紅旗杆、武魁旌旗）
 * 6. 大村巨峰葡萄藤架與常民農村景觀
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
let proceduralTextures = {};

// 視角預設
const DEFAULT_CAM_POS = { x: 0, y: 54, z: 70 };
const DEFAULT_LOOK_AT = { x: 0, y: 3, z: 12 };

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  initProceduralTextures();
  init3DScene();
  buildRealisticWukuiAncestralHall();
  build12UCStationBeacons();
  buildAMRRobot();
  setupUI();
  setupEvents();
  animate();

  setTimeout(() => {
    selectUC(0, false);
  }, 600);
});

/* ==========================================================================
   1. 程序化高解析古蹟紋理生成 (Procedural PBR Canvas Textures)
   ========================================================================== */
function initProceduralTextures() {
  // (1) 閩南傳統斗仔砌紅磚紋理 (Min-Nan Red Brick Texture)
  const brickCanvas = document.createElement("canvas");
  brickCanvas.width = 512;
  brickCanvas.height = 512;
  const bCtx = brickCanvas.getContext("2d");

  bCtx.fillStyle = "#a8321e"; // 暖磚紅基底
  bCtx.fillRect(0, 0, 512, 512);

  // 灰漿灰泥縫隙
  bCtx.strokeStyle = "#e2d9cc";
  bCtx.lineWidth = 4;

  const rows = 16;
  const cols = 8;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(512, y);
    bCtx.stroke();

    const offset = (r % 2) * (cw / 2);
    for (let c = 0; c <= cols; c++) {
      const x = c * cw - offset;
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x, y + rh);
      bCtx.stroke();
    }
  }

  // 磚面隨機噪點與陳舊感
  for (let i = 0; i < 6000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    bCtx.fillStyle = Math.random() > 0.5 ? "rgba(70, 15, 8, 0.25)" : "rgba(240, 120, 80, 0.2)";
    bCtx.fillRect(rx, ry, Math.random() * 4 + 1, Math.random() * 4 + 1);
  }
  const brickTex = new THREE.CanvasTexture(brickCanvas);
  brickTex.wrapS = THREE.RepeatWrapping;
  brickTex.wrapT = THREE.RepeatWrapping;
  brickTex.repeat.set(4, 3);
  proceduralTextures.brick = brickTex;

  // (2) 傳統黑瓦 / 仰合瓦片紋理 (Traditional Roof Tiles Texture)
  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = 512;
  tileCanvas.height = 512;
  const tCtx = tileCanvas.getContext("2d");

  tCtx.fillStyle = "#27303f"; // 墨灰黑瓦
  tCtx.fillRect(0, 0, 512, 512);

  const tileCols = 16;
  const tw = 512 / tileCols;
  for (let c = 0; c < tileCols; c++) {
    const x = c * tw;
    const grad = tCtx.createLinearGradient(x, 0, x + tw, 0);
    grad.addColorStop(0, "#19202c");
    grad.addColorStop(0.3, "#3d485a");
    grad.addColorStop(0.7, "#2c3545");
    grad.addColorStop(1, "#141a24");
    tCtx.fillStyle = grad;
    tCtx.fillRect(x, 0, tw - 2, 512);

    tCtx.fillStyle = "#0f141d";
    tCtx.fillRect(x + tw - 2, 0, 2, 512);
  }
  const tileTex = new THREE.CanvasTexture(tileCanvas);
  tileTex.wrapS = THREE.RepeatWrapping;
  tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(3, 4);
  proceduralTextures.tile = tileTex;

  // (3) 「武魁」匾額真實書法牌匾 (Wukui Calligraphy Plaque)
  const wkCanvas = document.createElement("canvas");
  wkCanvas.width = 512;
  wkCanvas.height = 200;
  const wkCtx = wkCanvas.getContext("2d");

  // 黑漆金絲楠木底
  wkCtx.fillStyle = "#0f141d";
  wkCtx.fillRect(0, 0, 512, 200);

  // 雙重泥金回紋外框
  wkCtx.strokeStyle = "#f59e0b";
  wkCtx.lineWidth = 10;
  wkCtx.strokeRect(10, 10, 492, 180);
  wkCtx.strokeStyle = "#b45309";
  wkCtx.lineWidth = 4;
  wkCtx.strokeRect(22, 22, 468, 156);

  // 楷書大字「武魁」
  wkCtx.fillStyle = "#fbbf24";
  wkCtx.shadowColor = "#f59e0b";
  wkCtx.shadowBlur = 12;
  wkCtx.font = "bold 96px serif, 'DFKai-SB', '標楷體', 'SimSun'";
  wkCtx.textAlign = "center";
  wkCtx.textBaseline = "middle";
  wkCtx.fillText("武 魁", 256, 102);

  // 款識印章
  wkCtx.shadowBlur = 0;
  wkCtx.fillStyle = "#dc2626";
  wkCtx.fillRect(40, 60, 28, 80);
  wkCtx.fillStyle = "#fef08a";
  wkCtx.font = "bold 16px sans-serif";
  wkCtx.fillText("咸", 54, 80);
  wkCtx.fillText("豐", 54, 105);
  wkCtx.fillText("科", 54, 130);

  const wkTex = new THREE.CanvasTexture(wkCanvas);
  proceduralTextures.wukui = wkTex;

  // (4) 「兄弟同榜」正身大匾額 (Tong-Bang Brothers Plaque)
  const tbCanvas = document.createElement("canvas");
  tbCanvas.width = 600;
  tbCanvas.height = 180;
  const tbCtx = tbCanvas.getContext("2d");

  tbCtx.fillStyle = "#1e130b"; // 沉木底
  tbCtx.fillRect(0, 0, 600, 180);

  tbCtx.strokeStyle = "#eab308";
  tbCtx.lineWidth = 8;
  tbCtx.strokeRect(8, 8, 584, 164);

  // 巡撫題款
  tbCtx.fillStyle = "#fbbf24";
  tbCtx.font = "16px serif, 'DFKai-SB', '標楷體'";
  tbCtx.textAlign = "left";
  tbCtx.fillText("巡撫福建等處提督軍務 慶端 題贈", 40, 40);

  // 四字「兄弟同榜」
  tbCtx.font = "bold 84px serif, 'DFKai-SB', '標楷體'";
  tbCtx.textAlign = "center";
  tbCtx.fillStyle = "#fef08a";
  tbCtx.shadowColor = "#eab308";
  tbCtx.shadowBlur = 10;
  tbCtx.fillText("兄弟同榜", 300, 105);

  tbCtx.shadowBlur = 0;
  tbCtx.font = "15px serif, 'DFKai-SB', '標楷體'";
  tbCtx.textAlign = "right";
  tbCtx.fillStyle = "#fbbf24";
  tbCtx.fillText("咸豐己未恩科 賴步雲 賴登雲 立", 560, 150);

  const tbTex = new THREE.CanvasTexture(tbCanvas);
  proceduralTextures.tongbang = tbTex;

  // (5) 綠釉花磚透窗 (Green-glazed Lattice Window)
  const gzCanvas = document.createElement("canvas");
  gzCanvas.width = 256;
  gzCanvas.height = 256;
  const gzCtx = gzCanvas.getContext("2d");

  gzCtx.fillStyle = "#166534";
  gzCtx.fillRect(0, 0, 256, 256);

  gzCtx.fillStyle = "#14532d";
  gzCtx.lineWidth = 14;
  gzCtx.strokeStyle = "#4ade80";

  // 雙錢紋/古錢菱花通透孔洞
  const step = 64;
  for (let x = 32; x < 256; x += step) {
    for (let y = 32; y < 256; y += step) {
      gzCtx.beginPath();
      gzCtx.arc(x, y, 22, 0, Math.PI * 2);
      gzCtx.fillStyle = "#0c1524"; // 透空背景
      gzCtx.fill();
      gzCtx.stroke();

      // 錢紋內方孔
      gzCtx.fillStyle = "#4ade80";
      gzCtx.fillRect(x - 6, y - 6, 12, 12);
    }
  }
  const gzTex = new THREE.CanvasTexture(gzCanvas);
  proceduralTextures.glaze = gzTex;

  // (6) 三關六扇門朱紅雕花木門 (Carved Min-Nan Wooden Doors)
  const drCanvas = document.createElement("canvas");
  drCanvas.width = 512;
  drCanvas.height = 512;
  const drCtx = drCanvas.getContext("2d");

  drCtx.fillStyle = "#831816"; // 沉雄絳紅
  drCtx.fillRect(0, 0, 512, 512);

  // 門梃、橫檔、腰板線條
  drCtx.strokeStyle = "#380d0d";
  drCtx.lineWidth = 6;
  drCtx.strokeRect(12, 12, 238, 488);
  drCtx.strokeRect(262, 12, 238, 488);

  // 鋪首銜環 (黃銅獸面銅環)
  [131, 381].forEach((dx) => {
    drCtx.beginPath();
    drCtx.arc(dx, 256, 22, 0, Math.PI * 2);
    drCtx.fillStyle = "#d97706";
    drCtx.fill();
    drCtx.strokeStyle = "#fef08a";
    drCtx.lineWidth = 4;
    drCtx.stroke();

    drCtx.beginPath();
    drCtx.arc(dx, 280, 16, 0, Math.PI * 2);
    drCtx.strokeStyle = "#fef08a";
    drCtx.lineWidth = 5;
    drCtx.stroke();
  });
  const drTex = new THREE.CanvasTexture(drCanvas);
  proceduralTextures.door = drTex;
}

/* ==========================================================================
   2. 3D 場景與燈光初始化
   ========================================================================== */
function init3DScene() {
  const container = document.getElementById("canvas-container");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c121e);
  scene.fog = new THREE.FogExp2(0x0c121e, 0.007);

  camera = new THREE.PerspectiveCamera(
    46,
    window.innerWidth / window.innerHeight,
    0.5,
    650
  );
  camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 8;
  controls.maxDistance = 200;
  controls.target.set(DEFAULT_LOOK_AT.x, DEFAULT_LOOK_AT.y, DEFAULT_LOOK_AT.z);

  const ambientLight = new THREE.AmbientLight(0xfff6eb, 0.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffae6, 1.45);
  sunLight.position.set(50, 80, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 260;
  sunLight.shadow.camera.left = -70;
  sunLight.shadow.camera.right = 70;
  sunLight.shadow.camera.top = 70;
  sunLight.shadow.camera.bottom = -70;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  const techFillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
  techFillLight.position.set(-50, 35, -45);
  scene.add(techFillLight);

  // 正身軒亭暖色照明
  const hallLight = new THREE.PointLight(0xf97316, 3.2, 35);
  hallLight.position.set(0, 5.5, -4);
  scene.add(hallLight);

  // 門樓紅燈籠光
  const gateLight = new THREE.PointLight(0xef4444, 2.5, 25);
  gateLight.position.set(0, 4.8, 20);
  scene.add(gateLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

/* ==========================================================================
   3. 具象化傳統閩南屋脊與構件建模工具 (Pitched Roofs & Swallowtails)
   ========================================================================== */

// 建立具象傳統雙坡仰合瓦屋頂 (雙面下斜屋頂，含真實出檐與瓦溝)
function createPitchedRoof(width, depth, ridgeHeight, eaveOverhang = 0.8) {
  const roofGroup = new THREE.Group();

  const halfW = width / 2;
  const halfD = depth / 2 + eaveOverhang;

  // 屋面幾何體 (雙斜坡)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfD, 0);
  roofShape.lineTo(0, ridgeHeight);
  roofShape.lineTo(halfD, 0);
  roofShape.lineTo(halfD - 0.25, -0.2);
  roofShape.lineTo(0, ridgeHeight - 0.25);
  roofShape.lineTo(-halfD + 0.25, -0.2);
  roofShape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: width + eaveOverhang * 2,
    bevelEnabled: false
  };

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
  roofGeo.center();

  const roofMat = new THREE.MeshStandardMaterial({
    map: proceduralTextures.tile,
    roughness: 0.5,
    metalness: 0.15
  });

  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.rotation.y = Math.PI / 2;
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  roofGroup.add(roofMesh);

  // 屋頂正脊 (大脊)
  const ridgeGeo = new THREE.BoxGeometry(width + eaveOverhang * 2.2, 0.45, 0.55);
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 });
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.position.y = ridgeHeight / 2 + 0.2;
  roofGroup.add(ridge);

  return roofGroup;
}

// 建立優美高翹的傳統「燕尾脊」(Swallowtail Ridge Fork)
function createSwallowtailTip(direction = 1) {
  const tipGroup = new THREE.Group();

  // 弧形向上高挑之燕尾翼
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(direction * 1.2, 0.4, 0),
    new THREE.Vector3(direction * 2.2, 1.4, 0),
    new THREE.Vector3(direction * 2.9, 2.8, 0)
  ]);

  const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.22, 8, false);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.7,
    roughness: 0.3
  });
  const tube = new THREE.Mesh(tubeGeo, tipMat);
  tipGroup.add(tube);

  // 分叉剪尾尖端
  const forkGeo = new THREE.ConeGeometry(0.18, 0.9, 6);
  const fork1 = new THREE.Mesh(forkGeo, tipMat);
  fork1.position.set(direction * 2.9, 3.1, -0.1);
  fork1.rotation.z = direction * -0.3;
  tipGroup.add(fork1);

  const fork2 = new THREE.Mesh(forkGeo, tipMat);
  fork2.position.set(direction * 3.1, 2.9, 0.1);
  fork2.rotation.z = direction * -0.6;
  tipGroup.add(fork2);

  return tipGroup;
}

// 建立傳統金形馬背山牆 (Curved Horse-back Gable Wall)
function createHorsebackWall(width, height, thickness = 0.5) {
  const shape = new THREE.Shape();
  const halfW = width / 2;

  shape.moveTo(-halfW, 0);
  shape.lineTo(-halfW, height * 0.65);
  // 優美的金形半圓形馬背弧線
  shape.bezierCurveTo(-halfW * 0.7, height * 1.05, halfW * 0.7, height * 1.05, halfW, height * 0.65);
  shape.lineTo(halfW, 0);
  shape.closePath();

  const extrudeSettings = { steps: 1, depth: thickness, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    map: proceduralTextures.brick,
    roughness: 0.8
  });
  return new THREE.Mesh(geo, mat);
}

/* ==========================================================================
   4. 具象化大村武魁新厝（三合院官宅）古蹟完整場景建構
   ========================================================================== */
function buildRealisticWukuiAncestralHall() {
  const estate = new THREE.Group();

  // (1) 宏大卡坦蜂巢六角浮島基座 (半徑 62)
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

  // 頂部大村平原綠地
  const grassGeo = new THREE.CylinderGeometry(islandRadius * 0.99, islandRadius * 0.99, 0.25, 6);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x244c33, roughness: 0.9 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.12;
  grass.receiveShadow = true;
  estate.add(grass);

  // 前埕泉州白石板大廣場 (Courtyard Plaza)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7c756b, roughness: 0.8 });
  const courtyardGeo = new THREE.BoxGeometry(40, 0.22, 36);
  const courtyard = new THREE.Mesh(courtyardGeo, stoneMat);
  courtyard.position.set(0, 0.2, 6);
  courtyard.receiveShadow = true;
  estate.add(courtyard);

  // 聯外迎賓大道
  const laneGeo = new THREE.BoxGeometry(7.5, 0.21, 32);
  const lane = new THREE.Mesh(laneGeo, stoneMat);
  lane.position.set(0, 0.2, 40);
  lane.receiveShadow = true;
  estate.add(lane);

  // 常用材質
  const brickMat = new THREE.MeshStandardMaterial({
    map: proceduralTextures.brick,
    roughness: 0.8
  });
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
  const darkTimberMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.75 });

  // ==========================================
  // (2) 五開間正身 (5-Bay Main Ancestral Hall)
  // ==========================================
  const mainHall = new THREE.Group();
  mainHall.position.set(0, 0, -14);

  // 花崗岩階梯與臺度基座
  const podium = new THREE.Mesh(new THREE.BoxGeometry(34, 0.7, 10.5), graniteMat);
  podium.position.set(0, 0.35, 0);
  podium.receiveShadow = true;
  mainHall.add(podium);

  // 正身中央：明間 (凹壽退縮門廳，寬度 8.5m)
  const recessBack = new THREE.Mesh(new THREE.BoxGeometry(8.5, 5.8, 0.6), brickMat);
  recessBack.position.set(0, 3.6, -2.6);
  recessBack.castShadow = true;
  mainHall.add(recessBack);

  // 凹壽左右八字牆
  [-4.25, 4.25].forEach((rx) => {
    const rWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.8, 3.2), brickMat);
    rWall.position.set(rx, 3.6, -1.0);
    rWall.castShadow = true;
    mainHall.add(rWall);
  });

  // 三關六扇雕花大門 (具象貼圖)
  const doorMat = new THREE.MeshStandardMaterial({
    map: proceduralTextures.door,
    roughness: 0.5
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.4, 0.15), doorMat);
  door.position.set(0, 2.9, -2.25);
  mainHall.add(door);

  // 凹壽簷柱 (前廊兩根圓形杉木立柱與石柱珠)
  [-3.8, 3.8].forEach((px) => {
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.3, 16), graniteMat);
    plinth.position.set(px, 0.85, 0.3);
    mainHall.add(plinth);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 4.8, 16), darkTimberMat);
    pillar.position.set(px, 3.3, 0.3);
    pillar.castShadow = true;
    mainHall.add(pillar);
  });

  // 門額高懸：福建巡撫慶端題贈之「兄弟同榜」立體大匾
  const tongbangMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.25, 0.15),
    new THREE.MeshStandardMaterial({ map: proceduralTextures.tongbang, roughness: 0.35 })
  );
  tongbangMesh.position.set(0, 5.25, -2.2);
  mainHall.add(tongbangMesh);

  // 左右次間 (各開直欞格扇窗)
  [-9.2, 9.2].forEach((sx) => {
    const subBay = new THREE.Mesh(new THREE.BoxGeometry(6.4, 5.5, 6.8), brickMat);
    subBay.position.set(sx, 3.45, -0.5);
    subBay.castShadow = true;
    subBay.receiveShadow = true;
    mainHall.add(subBay);

    // 綠釉/花格木窗
    const winMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.4, 0.1),
      new THREE.MeshStandardMaterial({ map: proceduralTextures.glaze, roughness: 0.3 })
    );
    winMesh.position.set(sx, 3.4, 2.92);
    mainHall.add(winMesh);
  });

  // 左右梢間 (面寬五開間延伸，略微降階)
  [-15.0, 15.0].forEach((ex) => {
    const endBay = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.0, 6.2), brickMat);
    endBay.position.set(ex, 3.2, -0.5);
    endBay.castShadow = true;
    endBay.receiveShadow = true;
    mainHall.add(endBay);
  });

  // 具象雙坡仰合瓦大屋頂 (雙層硬山瓦頂)
  const mainPitchedRoof = createPitchedRoof(35, 7.8, 3.8, 1.0);
  mainPitchedRoof.position.set(0, 6.4, -0.5);
  mainHall.add(mainPitchedRoof);

  // 正身兩端高聳出挑之「雙燕尾脊」(Swallowtail Ridges)
  const leftSwallowtail = createSwallowtailTip(-1);
  leftSwallowtail.position.set(-17.5, 8.4, -0.5);
  mainHall.add(leftSwallowtail);

  const rightSwallowtail = createSwallowtailTip(1);
  rightSwallowtail.position.set(17.5, 8.4, -0.5);
  mainHall.add(rightSwallowtail);

  estate.add(mainHall);

  // ==========================================
  // (3) 獨立木造懸山軒亭（拜亭 Pavilion）
  // ==========================================
  const xuanTing = new THREE.Group();
  xuanTing.position.set(0, 0, -8);

  // 軒亭花崗石基座
  const xtPodium = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.5, 6.5), graniteMat);
  xtPodium.position.set(0, 0.25, 0);
  xuanTing.add(xtPodium);

  // 四根福州杉木圓柱與石雕柱珠
  [
    [-3.0, -2.4],
    [3.0, -2.4],
    [-3.0, 2.4],
    [3.0, 2.4]
  ].forEach(([px, pz]) => {
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.25, 16), graniteMat);
    plinth.position.set(px, 0.62, pz);
    xuanTing.add(plinth);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 4.4, 16), darkTimberMat);
    column.position.set(px, 2.8, pz);
    column.castShadow = true;
    xuanTing.add(column);
  });

  // 軒亭懸山馬背頂 (雙坡垂檐)
  const xtRoof = createPitchedRoof(8.4, 6.8, 2.4, 0.8);
  xtRoof.position.set(0, 5.0, 0);
  xuanTing.add(xtRoof);

  // 軒亭側邊金形馬背山牆
  [-3.8, 3.8].forEach((mx) => {
    const mbWall = createHorsebackWall(5.4, 2.2, 0.3);
    mbWall.position.set(mx, 5.2, 0);
    mbWall.rotation.y = Math.PI / 2;
    xuanTing.add(mbWall);
  });

  estate.add(xuanTing);

  // ==========================================
  // (4) 左右護龍（東廂與西廂房，呈ㄇ字形圍合）
  // ==========================================
  const wingLength = 26;
  const wingWidth = 6.0;

  // 東護龍 (左廂房 - UC07 常民文化展區)
  const eastWing = new THREE.Group();
  eastWing.position.set(17.5, 0, 0);

  const eBody = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 4.8, wingLength), brickMat);
  eBody.position.set(0, 2.4, 0);
  eBody.castShadow = true;
  eBody.receiveShadow = true;
  eastWing.add(eBody);

  const eRoof = createPitchedRoof(wingLength, wingWidth, 2.8, 0.8);
  eRoof.rotation.y = Math.PI / 2;
  eRoof.position.set(0, 4.8, 0);
  eastWing.add(eRoof);

  // 護龍出挑檐廊木柱
  for (let z = -10; z <= 10; z += 5) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.2, 12), darkTimberMat);
    p.position.set(-2.8, 2.1, z);
    eastWing.add(p);
  }

  // 南端山牆頭（金形馬背脊）
  const eGable = createHorsebackWall(wingWidth, 2.8, 0.4);
  eGable.position.set(0, 5.2, wingLength / 2);
  eastWing.add(eGable);

  estate.add(eastWing);

  // 西護龍 (右廂房 - UC08 互動問答展區)
  const westWing = new THREE.Group();
  westWing.position.set(-17.5, 0, 0);

  const wBody = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 4.8, wingLength), brickMat);
  wBody.position.set(0, 2.4, 0);
  wBody.castShadow = true;
  wBody.receiveShadow = true;
  westWing.add(wBody);

  const wRoof = createPitchedRoof(wingLength, wingWidth, 2.8, 0.8);
  wRoof.rotation.y = Math.PI / 2;
  wRoof.position.set(0, 4.8, 0);
  westWing.add(wRoof);

  for (let z = -10; z <= 10; z += 5) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.2, 12), darkTimberMat);
    p.position.set(2.8, 2.1, z);
    westWing.add(p);
  }

  const wGable = createHorsebackWall(wingWidth, 2.8, 0.4);
  wGable.position.set(0, 5.2, wingLength / 2);
  westWing.add(wGable);

  estate.add(westWing);

  // ==========================================
  // (5) 獨立硬山燕尾門樓（院門）與院牆
  // ==========================================
  const gateHouse = new THREE.Group();
  gateHouse.position.set(0, 0, 20);

  // 門樓磚石主體
  const gateWall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 5.2, 3.2), brickMat);
  gateWall.position.set(0, 2.6, 0);
  gateWall.castShadow = true;
  gateHouse.add(gateWall);

  // 中門深邃拱洞通道
  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.0, 3.5),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
  );
  tunnel.position.set(0, 2.0, 0);
  gateHouse.add(tunnel);

  // 門樓大門門額：高懸正統黑底金字「武魁」金石匾額！
  const wukuiMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.2, 0.12),
    new THREE.MeshStandardMaterial({ map: proceduralTextures.wukui, roughness: 0.3 })
  );
  wukuiMesh.position.set(0, 4.35, 1.68);
  gateHouse.add(wukuiMesh);

  // 門額兩側：精美綠釉花磚透窗
  [-2.9, 2.9].forEach((gx) => {
    const glazeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 0.12),
      new THREE.MeshStandardMaterial({ map: proceduralTextures.glaze, roughness: 0.25 })
    );
    glazeMesh.position.set(gx, 2.7, 1.64);
    gateHouse.add(glazeMesh);
  });

  // 門樓硬山雙坡瓦頂
  const gateRoof = createPitchedRoof(10.2, 4.4, 2.6, 0.8);
  gateRoof.position.set(0, 5.4, 0);
  gateHouse.add(gateRoof);

  // 門樓專屬高翹「武魁燕尾」(Swallowtail Ridge)
  const gLeftTip = createSwallowtailTip(-1);
  gLeftTip.position.set(-5.6, 6.8, 0);
  gateHouse.add(gLeftTip);

  const gRightTip = createSwallowtailTip(1);
  gRightTip.position.set(5.6, 6.8, 0);
  gateHouse.add(gRightTip);

  // 門樓兩側斗仔砌紅磚矮院牆 (區隔內埕與外池)
  [-10.8, 10.8].forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.4, 0.6), brickMat);
    wall.position.set(wx, 1.2, 0);
    wall.castShadow = true;
    gateHouse.add(wall);

    // 院牆綠琉璃瓦壓頂
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 })
    );
    cap.position.set(wx, 2.45, 0);
    gateHouse.add(cap);
  });

  estate.add(gateHouse);

  // ==========================================
  // (6) 半月形風水池 (Half-Moon Feng-Shui Pond)
  // ==========================================
  const pond = new THREE.Group();
  pond.position.set(0, 0, 36);

  // 弧形石砌駁岸池壁 (半月形)
  const curbGeo = new THREE.CylinderGeometry(15.5, 15.5, 0.45, 48, 1, false, 0, Math.PI);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.y = 0.22;
  pond.add(curb);

  // 平整後駁岸石條
  const backCurb = new THREE.Mesh(new THREE.BoxGeometry(31, 0.45, 0.8), curbMat);
  backCurb.position.set(0, 0.22, 0);
  pond.add(backCurb);

  // 清澈波光半月水面
  const waterGeo = new THREE.CircleGeometry(15.0, 48, 0, Math.PI);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.24;
  pond.add(waterMesh);

  // 水生睡蓮葉裝飾
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  [
    [-6, 4],
    [-2, 9],
    [5, 6],
    [9, 3]
  ].forEach(([lx, lz]) => {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), lilyMat);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(lx, 0.26, lz);
    pond.add(lily);
  });

  estate.add(pond);

  // ==========================================
  // (7) 咸豐九年賴氏雙舉人旗杆石座與高聳令旗群
  // ==========================================
  [-7.5, 7.5].forEach((fx) => {
    // 雕花花崗石雙石夾柱基座 (旗杆夾石)
    const baseP1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.8), graniteMat);
    baseP1.position.set(fx, 0.3, 10);
    baseP1.castShadow = true;
    estate.add(baseP1);

    // 兩片石夾板柱
    [-0.5, 0.5].forEach((ox) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 1.2), graniteMat);
      slab.position.set(fx + ox, 1.5, 10);
      slab.castShadow = true;
      estate.add(slab);
    });

    // 朱紅高聳旗杆 (武舉人令杆)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 12, 16), poleMat);
    pole.position.set(fx, 7.0, 10);
    pole.castShadow = true;
    estate.add(pole);

    // 橫插鐵斗 (旗杆斗)
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.5, 8), darkTimberMat);
    bucket.position.set(fx, 9.8, 10);
    estate.add(bucket);

    // 咸豐九年武舉人旌旗 (金黃鑲邊朱紅旗面)
    const flagGeo = new THREE.PlaneGeometry(2.6, 1.6);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      roughness: 0.5
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(fx + 1.3, 11.5, 10);
    estate.add(flag);
  });

  // ==========================================
  // (8) 彰化大村巨峰葡萄藤架與鄉村老樹
  // ==========================================
  buildDacunRuralLandscape(estate);

  scene.add(estate);
}

// 彰化大村巨峰葡萄藤架與鄉村造景
function buildDacunRuralLandscape(parent) {
  const trellisGroup = new THREE.Group();
  trellisGroup.position.set(-28, 0, -6);

  const woodPoleMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const vineLeafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.35 });

  for (let x = -3; x <= 3; x += 3) {
    for (let z = -5; z <= 5; z += 5) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8), woodPoleMat);
      p.position.set(x, 1.7, z);
      trellisGroup.add(p);
    }
  }

  const canopyGeo = new THREE.BoxGeometry(7.5, 0.35, 11.5);
  const canopy = new THREE.Mesh(canopyGeo, vineLeafMat);
  canopy.position.set(0, 3.4, 0);
  trellisGroup.add(canopy);

  [
    [-1.5, 2.8, -3],
    [1.5, 2.8, -1],
    [-0.5, 2.8, 2],
    [1.8, 2.8, 4]
  ].forEach(([gx, gy, gz]) => {
    const bunch = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.75, 8), grapeMat);
    bunch.position.set(gx, gy, gz);
    trellisGroup.add(bunch);
  });

  parent.add(trellisGroup);

  // 四周老榕樹與竹林
  const treePositions = [
    [-35, 0, -22],
    [35, 0, -22],
    [-37, 0, 18],
    [37, 0, 20],
    [-24, 0, 42],
    [26, 0, 44]
  ];

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x19452b, roughness: 0.8 });

  treePositions.forEach(([tx, ty, tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 5.2, 8), trunkMat);
    trunk.position.set(tx, 2.6, tz);
    trunk.castShadow = true;
    parent.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), foliageMat);
    foliage.position.set(tx, 6.8, tz);
    foliage.castShadow = true;
    parent.add(foliage);
  });
}

/* ==========================================================================
   5. 12 個獨立用例 (UC01 ~ UC12) 3D 地標節點 (高挑開闊、無遮蔽)
   ========================================================================== */
function build12UCStationBeacons() {
  const stationGroup = new THREE.Group();

  UC_DATA.forEach((uc, index) => {
    const [x, y, z] = uc.pos;
    const subGroup = new THREE.Group();
    subGroup.position.set(x, y, z);
    subGroup.userData = { ucIndex: index, ucId: uc.id };

    // 卡坦島式六角獨立小地台
    const hexGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.5, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.5
    });
    const hexPlatform = new THREE.Mesh(hexGeo, hexMat);
    hexPlatform.position.y = 0.25;
    hexPlatform.receiveShadow = true;
    subGroup.add(hexPlatform);

    // 科技感應發光圓環
    const ringGeo = new THREE.RingGeometry(1.6, 2.15, 32);
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

    // 垂直微光柱
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 5.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.75;
    subGroup.add(beam);

    // 懸浮 3D 標籤看板 (高度 5.8m，永不被屋簷遮蔽)
    const sprite = createUCSprite(uc.id, index + 1);
    sprite.position.y = 5.8;
    subGroup.add(sprite);

    // 點擊碰撞盒
    const hitBoxGeo = new THREE.CylinderGeometry(2.7, 2.7, 6.5, 8);
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

function createUCSprite(ucId, num) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(11, 18, 33, 0.92)";
  roundRect(ctx, 8, 8, 240, 112, 28);
  ctx.fill();

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
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
   6. 3D 自主移動導覽機器人 (AMR Robot) 模型建構
   ========================================================================== */
function buildAMRRobot() {
  robotGroup = new THREE.Group();
  robotGroup.position.set(0, 0.35, 24);

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

  lidarTurret = new THREE.Group();
  lidarTurret.position.set(0, 1.0, 0);

  const lidarBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
  );
  lidarTurret.add(lidarBase);

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
   7. UI 與事件系統
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

function selectUC(index, triggerCameraMove = true) {
  if (index < 0 || index >= UC_DATA.length) return;
  activeUCIndex = index;
  const uc = UC_DATA[index];

  document.querySelectorAll(".uc-item-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });

  const activeBtn = document.getElementById(`dock-btn-${index}`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  ucStationMeshes.forEach((station, i) => {
    if (i === index) {
      station.ring.material.color.setHex(0xf59e0b);
      station.ring.scale.set(1.4, 1.4, 1.4);
    } else {
      station.ring.material.color.setHex(0x22d3ee);
      station.ring.scale.set(1.0, 1.0, 1.0);
    }
  });

  moveRobotTo(uc.pos[0], uc.pos[2]);

  if (triggerCameraMove && !isRobotCamActive) {
    focusCameraOn(uc.pos[0], uc.pos[1], uc.pos[2]);
  }

  renderUCDrawer(uc);
}

function renderUCDrawer(uc) {
  document.getElementById("drawer-category").innerText = uc.category;
  document.getElementById("drawer-id").innerText = uc.id;
  document.getElementById("drawer-title").innerText = uc.title;
  document.getElementById("drawer-title-en").innerText = uc.titleEn;
  document.getElementById("drawer-loc-name").innerText = uc.locationName;
  document.getElementById("drawer-loc-desc").innerText = uc.locationDesc;

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

  const precondsEl = document.getElementById("drawer-preconds");
  precondsEl.innerHTML = uc.preConditions.map((c) => `<li>${c}</li>`).join("");

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

  const postcondsEl = document.getElementById("drawer-postconds");
  postcondsEl.innerHTML = uc.postConditions.map((c) => `<li>${c}</li>`).join("");

  const techEl = document.getElementById("drawer-tech");
  techEl.innerHTML = uc.techStack.map((t) => `<span class="tech-tag">${t}</span>`).join("");

  document.getElementById("uc-drawer").classList.add("open");
}

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

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 1.0;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

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

  document.getElementById("btn-robot-cam").addEventListener("click", () => {
    isRobotCamActive = !isRobotCamActive;
    document.getElementById("btn-robot-cam").classList.toggle("active", isRobotCamActive);
    if (!isRobotCamActive) {
      resetCameraView();
    }
  });

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

  document.getElementById("btn-speak").addEventListener("click", () => {
    const currentUC = UC_DATA[activeUCIndex];
    speakText(currentUC.speechText);
  });

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
   8. 動畫循環
   ========================================================================== */
function animate(time) {
  requestAnimationFrame(animate);

  TWEEN.update();

  if (lidarTurret) {
    lidarTurret.rotation.y += 0.045;
  }

  if (scanRingMesh) {
    const scale = 1 + Math.sin(time * 0.003) * 0.08;
    scanRingMesh.scale.set(scale, scale, scale);
  }

  ucStationMeshes.forEach((st, idx) => {
    st.sprite.position.y = 5.8 + Math.sin(time * 0.002 + idx) * 0.2;
  });

  if (waterMesh) {
    waterMesh.material.opacity = 0.72 + Math.sin(time * 0.0015) * 0.06;
  }

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
