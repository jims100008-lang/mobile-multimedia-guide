/**
 * 大村武魁祠 × AMR 智慧導覽島嶼 (Wukui AMR Island)
 * Three.js 3D 核心互動引擎 - 宏偉具象化古蹟架構與精確無遮蔽拓撲
 * 1. 武魁祠建築主體全面放大 (1.3x 壯闊比例)，居於場景絕對視覺焦點。
 * 2. 弱化周邊無關樹木，視野純淨通透。
 * 3. 12 個 UC 節點精準設置於無遮蔽之石板步道、前埕與拜庭外，絕不與建物碰撞重疊。
 * 4. 側邊抽屜面板支援清晰分頁切換 (規格流程 / 循序圖與技術)、語音等化器動畫與狀態提示。
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

// 最佳全景視角 (完整收納宏偉五開間正身、左右護龍、門樓與半月池)
const DEFAULT_CAM_POS = { x: 0, y: 58, z: 76 };
const DEFAULT_LOOK_AT = { x: 0, y: 3, z: 10 };

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
  // (1) 閩南傳統斗仔砌紅磚紋理
  const brickCanvas = document.createElement("canvas");
  brickCanvas.width = 512;
  brickCanvas.height = 512;
  const bCtx = brickCanvas.getContext("2d");

  bCtx.fillStyle = "#a8321e";
  bCtx.fillRect(0, 0, 512, 512);

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

  // (2) 傳統仰合瓦片紋理
  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = 512;
  tileCanvas.height = 512;
  const tCtx = tileCanvas.getContext("2d");

  tCtx.fillStyle = "#27303f";
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

  // (3) 「武魁」黑底金字大匾
  const wkCanvas = document.createElement("canvas");
  wkCanvas.width = 512;
  wkCanvas.height = 200;
  const wkCtx = wkCanvas.getContext("2d");

  wkCtx.fillStyle = "#0f141d";
  wkCtx.fillRect(0, 0, 512, 200);

  wkCtx.strokeStyle = "#f59e0b";
  wkCtx.lineWidth = 10;
  wkCtx.strokeRect(10, 10, 492, 180);
  wkCtx.strokeStyle = "#b45309";
  wkCtx.lineWidth = 4;
  wkCtx.strokeRect(22, 22, 468, 156);

  wkCtx.fillStyle = "#fbbf24";
  wkCtx.shadowColor = "#f59e0b";
  wkCtx.shadowBlur = 12;
  wkCtx.font = "bold 96px serif, 'DFKai-SB', '標楷體', 'SimSun'";
  wkCtx.textAlign = "center";
  wkCtx.textBaseline = "middle";
  wkCtx.fillText("武 魁", 256, 102);

  wkCtx.shadowBlur = 0;
  wkCtx.fillStyle = "#dc2626";
  wkCtx.fillRect(40, 60, 28, 80);
  wkCtx.fillStyle = "#fef08a";
  wkCtx.font = "bold 16px sans-serif";
  wkCtx.fillText("咸", 54, 80);
  wkCtx.fillText("豐", 54, 105);
  wkCtx.fillText("科", 54, 130);

  proceduralTextures.wukui = new THREE.CanvasTexture(wkCanvas);

  // (4) 「兄弟同榜」正廳牌匾
  const tbCanvas = document.createElement("canvas");
  tbCanvas.width = 600;
  tbCanvas.height = 180;
  const tbCtx = tbCanvas.getContext("2d");

  tbCtx.fillStyle = "#1e130b";
  tbCtx.fillRect(0, 0, 600, 180);

  tbCtx.strokeStyle = "#eab308";
  tbCtx.lineWidth = 8;
  tbCtx.strokeRect(8, 8, 584, 164);

  tbCtx.fillStyle = "#fbbf24";
  tbCtx.font = "16px serif, 'DFKai-SB', '標楷體'";
  tbCtx.textAlign = "left";
  tbCtx.fillText("巡撫福建等處提督軍務 慶端 題贈", 40, 40);

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

  proceduralTextures.tongbang = new THREE.CanvasTexture(tbCanvas);

  // (5) 綠釉花磚透窗
  const gzCanvas = document.createElement("canvas");
  gzCanvas.width = 256;
  gzCanvas.height = 256;
  const gzCtx = gzCanvas.getContext("2d");

  gzCtx.fillStyle = "#166534";
  gzCtx.fillRect(0, 0, 256, 256);

  gzCtx.lineWidth = 14;
  gzCtx.strokeStyle = "#4ade80";

  const step = 64;
  for (let x = 32; x < 256; x += step) {
    for (let y = 32; y < 256; y += step) {
      gzCtx.beginPath();
      gzCtx.arc(x, y, 22, 0, Math.PI * 2);
      gzCtx.fillStyle = "#0c1524";
      gzCtx.fill();
      gzCtx.stroke();

      gzCtx.fillStyle = "#4ade80";
      gzCtx.fillRect(x - 6, y - 6, 12, 12);
    }
  }
  proceduralTextures.glaze = new THREE.CanvasTexture(gzCanvas);

  // (6) 三關六扇門朱紅雕花木門
  const drCanvas = document.createElement("canvas");
  drCanvas.width = 512;
  drCanvas.height = 512;
  const drCtx = drCanvas.getContext("2d");

  drCtx.fillStyle = "#831816";
  drCtx.fillRect(0, 0, 512, 512);

  drCtx.strokeStyle = "#380d0d";
  drCtx.lineWidth = 6;
  drCtx.strokeRect(12, 12, 238, 488);
  drCtx.strokeRect(262, 12, 238, 488);

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
  proceduralTextures.door = new THREE.CanvasTexture(drCanvas);
}

/* ==========================================================================
   2. 3D 場景與燈光初始化
   ========================================================================== */
function init3DScene() {
  const container = document.getElementById("canvas-container");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c121e);
  scene.fog = new THREE.FogExp2(0x0c121e, 0.0065);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.5,
    700
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
  controls.maxDistance = 220;
  controls.target.set(DEFAULT_LOOK_AT.x, DEFAULT_LOOK_AT.y, DEFAULT_LOOK_AT.z);

  const ambientLight = new THREE.AmbientLight(0xfff6eb, 0.85);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffae6, 1.45);
  sunLight.position.set(55, 85, 55);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 280;
  sunLight.shadow.camera.left = -75;
  sunLight.shadow.camera.right = 75;
  sunLight.shadow.camera.top = 75;
  sunLight.shadow.camera.bottom = -75;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  const techFillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
  techFillLight.position.set(-55, 40, -50);
  scene.add(techFillLight);

  const hallLight = new THREE.PointLight(0xf97316, 3.4, 40);
  hallLight.position.set(0, 6, -6);
  scene.add(hallLight);

  const gateLight = new THREE.PointLight(0xef4444, 2.6, 30);
  gateLight.position.set(0, 5.2, 24);
  scene.add(gateLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

/* ==========================================================================
   3. 屋頂與構件建模函式 (Pitched Roofs & Swallowtails)
   ========================================================================== */
function createPitchedRoof(width, depth, ridgeHeight, eaveOverhang = 0.9) {
  const roofGroup = new THREE.Group();
  const halfD = depth / 2 + eaveOverhang;

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfD, 0);
  roofShape.lineTo(0, ridgeHeight);
  roofShape.lineTo(halfD, 0);
  roofShape.lineTo(halfD - 0.25, -0.2);
  roofShape.lineTo(0, ridgeHeight - 0.25);
  roofShape.lineTo(-halfD + 0.25, -0.2);
  roofShape.closePath();

  const extrudeSettings = { steps: 1, depth: width + eaveOverhang * 2, bevelEnabled: false };
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

  const ridgeGeo = new THREE.BoxGeometry(width + eaveOverhang * 2.2, 0.5, 0.6);
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 });
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.position.y = ridgeHeight / 2 + 0.22;
  roofGroup.add(ridge);

  return roofGroup;
}

function createSwallowtailTip(direction = 1) {
  const tipGroup = new THREE.Group();

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(direction * 1.4, 0.5, 0),
    new THREE.Vector3(direction * 2.5, 1.6, 0),
    new THREE.Vector3(direction * 3.3, 3.1, 0)
  ]);

  const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.24, 8, false);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.7,
    roughness: 0.3
  });
  const tube = new THREE.Mesh(tubeGeo, tipMat);
  tipGroup.add(tube);

  const forkGeo = new THREE.ConeGeometry(0.2, 1.0, 6);
  const fork1 = new THREE.Mesh(forkGeo, tipMat);
  fork1.position.set(direction * 3.3, 3.4, -0.12);
  fork1.rotation.z = direction * -0.3;
  tipGroup.add(fork1);

  const fork2 = new THREE.Mesh(forkGeo, tipMat);
  fork2.position.set(direction * 3.5, 3.2, 0.12);
  fork2.rotation.z = direction * -0.6;
  tipGroup.add(fork2);

  return tipGroup;
}

function createHorsebackWall(width, height, thickness = 0.55) {
  const shape = new THREE.Shape();
  const halfW = width / 2;

  shape.moveTo(-halfW, 0);
  shape.lineTo(-halfW, height * 0.65);
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
   4. 具象化大村武魁新厝古蹟全景建模 (建築本體放大 1.3x，樹木去中心化)
   ========================================================================== */
function buildRealisticWukuiAncestralHall() {
  const estate = new THREE.Group();

  // 浮島基地 (半徑 64)
  const islandRadius = 64;
  const islandGeo = new THREE.CylinderGeometry(islandRadius, islandRadius * 1.04, 5.0, 6);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.15
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = -2.5;
  island.receiveShadow = true;
  estate.add(island);

  // 頂部大村平原綠地
  const grassGeo = new THREE.CylinderGeometry(islandRadius * 0.99, islandRadius * 0.99, 0.25, 6);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x244c33, roughness: 0.9 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.12;
  grass.receiveShadow = true;
  estate.add(grass);

  // 泉州白石板大前埕 (全面擴大至 48x40，氣勢恢宏)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7c756b, roughness: 0.8 });
  const courtyardGeo = new THREE.BoxGeometry(46, 0.22, 38);
  const courtyard = new THREE.Mesh(courtyardGeo, stoneMat);
  courtyard.position.set(0, 0.2, 7);
  courtyard.receiveShadow = true;
  estate.add(courtyard);

  // 迎賓引道 (自貢旗一巷直通門樓)
  const laneGeo = new THREE.BoxGeometry(8.5, 0.21, 36);
  const lane = new THREE.Mesh(laneGeo, stoneMat);
  lane.position.set(0, 0.2, 44);
  lane.receiveShadow = true;
  estate.add(lane);

  // 環池石板步道
  [-20, 20].forEach(px => {
    const pWalk = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.21, 28), stoneMat);
    pWalk.position.set(px, 0.2, 40);
    pWalk.receiveShadow = true;
    estate.add(pWalk);
  });

  const brickMat = new THREE.MeshStandardMaterial({ map: proceduralTextures.brick, roughness: 0.8 });
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
  const darkTimberMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.75 });

  // ==========================================
  // (A) 五開間正身 (面寬擴大至 40m，氣派非凡)
  // ==========================================
  const mainHall = new THREE.Group();
  mainHall.position.set(0, 0, -17);

  // 花崗岩基座
  const podium = new THREE.Mesh(new THREE.BoxGeometry(40, 0.8, 11), graniteMat);
  podium.position.set(0, 0.4, 0);
  podium.receiveShadow = true;
  mainHall.add(podium);

  // 明間 (凹壽退縮門廳，寬度 9.5m)
  const recessBack = new THREE.Mesh(new THREE.BoxGeometry(9.5, 6.2, 0.6), brickMat);
  recessBack.position.set(0, 3.8, -2.8);
  recessBack.castShadow = true;
  mainHall.add(recessBack);

  [-4.75, 4.75].forEach((rx) => {
    const rWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.2, 3.4), brickMat);
    rWall.position.set(rx, 3.8, -1.1);
    rWall.castShadow = true;
    mainHall.add(rWall);
  });

  // 三關六扇雕花大門
  const doorMat = new THREE.MeshStandardMaterial({ map: proceduralTextures.door, roughness: 0.5 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(5.4, 4.8, 0.15), doorMat);
  door.position.set(0, 3.1, -2.4);
  mainHall.add(door);

  // 凹壽步口雙柱與柱珠
  [-4.2, 4.2].forEach((px) => {
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.35, 16), graniteMat);
    plinth.position.set(px, 0.95, 0.35);
    mainHall.add(plinth);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 5.2, 16), darkTimberMat);
    pillar.position.set(px, 3.6, 0.35);
    pillar.castShadow = true;
    mainHall.add(pillar);
  });

  // 門額：福建巡撫慶端題贈「兄弟同榜」立體金匾
  const tongbangMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.35, 0.15),
    new THREE.MeshStandardMaterial({ map: proceduralTextures.tongbang, roughness: 0.35 })
  );
  tongbangMesh.position.set(0, 5.65, -2.35);
  mainHall.add(tongbangMesh);

  // 左右次間 (各開透窗)
  [-10.5, 10.5].forEach((sx) => {
    const subBay = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5.8, 7.2), brickMat);
    subBay.position.set(sx, 3.65, -0.6);
    subBay.castShadow = true;
    subBay.receiveShadow = true;
    mainHall.add(subBay);

    const winMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.6, 0.1),
      new THREE.MeshStandardMaterial({ map: proceduralTextures.glaze, roughness: 0.3 })
    );
    winMesh.position.set(sx, 3.6, 3.05);
    mainHall.add(winMesh);
  });

  // 左右梢間
  [-17.0, 17.0].forEach((ex) => {
    const endBay = new THREE.Mesh(new THREE.BoxGeometry(6.0, 5.3, 6.6), brickMat);
    endBay.position.set(ex, 3.4, -0.6);
    endBay.castShadow = true;
    endBay.receiveShadow = true;
    mainHall.add(endBay);
  });

  // 正身雙坡仰合瓦大屋頂
  const mainPitchedRoof = createPitchedRoof(40, 8.4, 4.2, 1.2);
  mainPitchedRoof.position.set(0, 6.8, -0.6);
  mainHall.add(mainPitchedRoof);

  // 兩端高聳之「雙燕尾脊」
  const leftSwallowtail = createSwallowtailTip(-1);
  leftSwallowtail.position.set(-20.5, 9.0, -0.6);
  mainHall.add(leftSwallowtail);

  const rightSwallowtail = createSwallowtailTip(1);
  rightSwallowtail.position.set(20.5, 9.0, -0.6);
  mainHall.add(rightSwallowtail);

  estate.add(mainHall);

  // ==========================================
  // (B) 獨立木造懸山軒亭（拜亭 Pavilion）
  // ==========================================
  const xuanTing = new THREE.Group();
  xuanTing.position.set(0, 0, -9.5);

  const xtPodium = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.55, 7.5), graniteMat);
  xtPodium.position.set(0, 0.28, 0);
  xuanTing.add(xtPodium);

  [
    [-3.4, -2.8],
    [3.4, -2.8],
    [-3.4, 2.8],
    [3.4, 2.8]
  ].forEach(([px, pz]) => {
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.28, 16), graniteMat);
    plinth.position.set(px, 0.68, pz);
    xuanTing.add(plinth);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 4.8, 16), darkTimberMat);
    column.position.set(px, 3.1, pz);
    column.castShadow = true;
    xuanTing.add(column);
  });

  const xtRoof = createPitchedRoof(9.2, 7.5, 2.6, 0.9);
  xtRoof.position.set(0, 5.5, 0);
  xuanTing.add(xtRoof);

  [-4.2, 4.2].forEach((mx) => {
    const mbWall = createHorsebackWall(6.0, 2.4, 0.35);
    mbWall.position.set(mx, 5.7, 0);
    mbWall.rotation.y = Math.PI / 2;
    xuanTing.add(mbWall);
  });

  estate.add(xuanTing);

  // ==========================================
  // (C) 左右護龍（東廂與西廂房，長度 32m）
  // ==========================================
  const wingLength = 32;
  const wingWidth = 6.6;

  // 東護龍 (左廂 - UC07 常民展示)
  const eastWing = new THREE.Group();
  eastWing.position.set(21, 0, 2);

  const eBody = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 5.2, wingLength), brickMat);
  eBody.position.set(0, 2.6, 0);
  eBody.castShadow = true;
  eBody.receiveShadow = true;
  eastWing.add(eBody);

  const eRoof = createPitchedRoof(wingLength, wingWidth, 3.0, 0.9);
  eRoof.rotation.y = Math.PI / 2;
  eRoof.position.set(0, 5.2, 0);
  eastWing.add(eRoof);

  for (let z = -12; z <= 12; z += 6) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 4.6, 12), darkTimberMat);
    p.position.set(-3.2, 2.3, z);
    eastWing.add(p);
  }

  const eGable = createHorsebackWall(wingWidth, 3.0, 0.45);
  eGable.position.set(0, 5.7, wingLength / 2);
  eastWing.add(eGable);

  estate.add(eastWing);

  // 西護龍 (右廂 - UC08 多媒體問答)
  const westWing = new THREE.Group();
  westWing.position.set(-21, 0, 2);

  const wBody = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 5.2, wingLength), brickMat);
  wBody.position.set(0, 2.6, 0);
  wBody.castShadow = true;
  wBody.receiveShadow = true;
  westWing.add(wBody);

  const wRoof = createPitchedRoof(wingLength, wingWidth, 3.0, 0.9);
  wRoof.rotation.y = Math.PI / 2;
  wRoof.position.set(0, 5.2, 0);
  westWing.add(wRoof);

  for (let z = -12; z <= 12; z += 6) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 4.6, 12), darkTimberMat);
    p.position.set(3.2, 2.3, z);
    westWing.add(p);
  }

  const wGable = createHorsebackWall(wingWidth, 3.0, 0.45);
  wGable.position.set(0, 5.7, wingLength / 2);
  westWing.add(wGable);

  estate.add(westWing);

  // ==========================================
  // (D) 獨立硬山燕尾門樓（院門）與院牆
  // ==========================================
  const gateHouse = new THREE.Group();
  gateHouse.position.set(0, 0, 24);

  const gateWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 5.5, 3.6), brickMat);
  gateWall.position.set(0, 2.75, 0);
  gateWall.castShadow = true;
  gateHouse.add(gateWall);

  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 4.2, 4.0),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
  );
  tunnel.position.set(0, 2.1, 0);
  gateHouse.add(tunnel);

  // 門額：「武魁」大匾
  const wukuiMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 1.3, 0.15),
    new THREE.MeshStandardMaterial({ map: proceduralTextures.wukui, roughness: 0.3 })
  );
  wukuiMesh.position.set(0, 4.6, 1.88);
  gateHouse.add(wukuiMesh);

  // 門樓透窗
  [-3.4, 3.4].forEach((gx) => {
    const glazeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.0, 0.12),
      new THREE.MeshStandardMaterial({ map: proceduralTextures.glaze, roughness: 0.25 })
    );
    glazeMesh.position.set(gx, 2.8, 1.84);
    gateHouse.add(glazeMesh);
  });

  const gateRoof = createPitchedRoof(12.0, 4.8, 2.8, 0.9);
  gateRoof.position.set(0, 5.8, 0);
  gateHouse.add(gateRoof);

  const gLeftTip = createSwallowtailTip(-1);
  gLeftTip.position.set(-6.5, 7.2, 0);
  gateHouse.add(gLeftTip);

  const gRightTip = createSwallowtailTip(1);
  gRightTip.position.set(6.5, 7.2, 0);
  gateHouse.add(gRightTip);

  // 院牆
  [-13.5, 13.5].forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.5, 0.6), brickMat);
    wall.position.set(wx, 1.25, 0);
    wall.castShadow = true;
    gateHouse.add(wall);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 })
    );
    cap.position.set(wx, 2.55, 0);
    gateHouse.add(cap);
  });

  estate.add(gateHouse);

  // ==========================================
  // (E) 半月形風水池
  // ==========================================
  const pond = new THREE.Group();
  pond.position.set(0, 0, 38);

  const curbGeo = new THREE.CylinderGeometry(17.5, 17.5, 0.5, 48, 1, false, 0, Math.PI);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.y = 0.25;
  pond.add(curb);

  const backCurb = new THREE.Mesh(new THREE.BoxGeometry(35, 0.5, 0.9), curbMat);
  backCurb.position.set(0, 0.25, 0);
  pond.add(backCurb);

  const waterGeo = new THREE.CircleGeometry(17.0, 48, 0, Math.PI);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.28;
  pond.add(waterMesh);

  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  [
    [-7, 5],
    [-3, 11],
    [6, 7],
    [10, 4]
  ].forEach(([lx, lz]) => {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.95, 16), lilyMat);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(lx, 0.3, lz);
    pond.add(lily);
  });

  estate.add(pond);

  // ==========================================
  // (F) 咸豐九年賴氏雙舉人旗杆石座群
  // ==========================================
  [-9, 9].forEach((fx) => {
    const baseP1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 2.0), graniteMat);
    baseP1.position.set(fx, 0.32, 10);
    baseP1.castShadow = true;
    estate.add(baseP1);

    [-0.6, 0.6].forEach((ox) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 1.4), graniteMat);
      slab.position.set(fx + ox, 1.6, 10);
      slab.castShadow = true;
      estate.add(slab);
    });

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 13, 16), poleMat);
    pole.position.set(fx, 7.5, 10);
    pole.castShadow = true;
    estate.add(pole);

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.55, 8), darkTimberMat);
    bucket.position.set(fx, 10.5, 10);
    estate.add(bucket);

    const flagGeo = new THREE.PlaneGeometry(2.8, 1.8);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      roughness: 0.5
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(fx + 1.4, 12.2, 10);
    estate.add(flag);
  });

  // ==========================================
  // (G) 大村巨峰葡萄藤架與弱化後的背景樹
  // ==========================================
  buildDacunRuralLandscape(estate);

  scene.add(estate);
}

// 大村巨峰葡萄藤架（弱化周邊雜樹，保留開闊大器）
function buildDacunRuralLandscape(parent) {
  // 西側：大村巨峰葡萄藤架 (UC10 專區)
  const trellisGroup = new THREE.Group();
  trellisGroup.position.set(-32, 0, -5);

  const woodPoleMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const vineLeafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.35 });

  for (let x = -4; x <= 4; x += 4) {
    for (let z = -6; z <= 6; z += 6) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.6, 8), woodPoleMat);
      p.position.set(x, 1.8, z);
      trellisGroup.add(p);
    }
  }

  const canopyGeo = new THREE.BoxGeometry(9.0, 0.35, 13.5);
  const canopy = new THREE.Mesh(canopyGeo, vineLeafMat);
  canopy.position.set(0, 3.6, 0);
  trellisGroup.add(canopy);

  [
    [-2.0, 3.0, -3.5],
    [2.0, 3.0, -1.5],
    [-0.8, 3.0, 2.5],
    [2.2, 3.0, 4.5]
  ].forEach(([gx, gy, gz]) => {
    const bunch = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 8), grapeMat);
    bunch.position.set(gx, gy, gz);
    trellisGroup.add(bunch);
  });

  parent.add(trellisGroup);

  // 僅在島嶼極外緣角落保留 4 棵低多邊形背景樹，不喧賓奪主
  const treePositions = [
    [-46, 0, -32],
    [46, 0, -32],
    [-46, 38],
    [46, 38]
  ];

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x19452b, roughness: 0.8 });

  treePositions.forEach(([tx, tz]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 5.0, 8), trunkMat);
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
   5. 12 個獨立用例 3D 地標節點 (高挑開闊、拓撲無碰撞)
   ========================================================================== */
function build12UCStationBeacons() {
  const stationGroup = new THREE.Group();

  UC_DATA.forEach((uc, index) => {
    const [x, y, z] = uc.pos;
    const subGroup = new THREE.Group();
    subGroup.position.set(x, y, z);
    subGroup.userData = { ucIndex: index, ucId: uc.id };

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

    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 5.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.75;
    subGroup.add(beam);

    const sprite = createUCSprite(uc.id, index + 1);
    sprite.position.y = 5.8;
    subGroup.add(sprite);

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
   6. 3D 自主移動導覽機器人 (AMR Robot)
   ========================================================================== */
function buildAMRRobot() {
  robotGroup = new THREE.Group();
  robotGroup.position.set(0, 0.35, 28); // 初始待命位置 (在燕尾門樓迎賓位)

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
   7. UI、抽屜排版與分頁切換系統
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

// 抽屜詳細資料渲染 (精美結構化分頁)
function renderUCDrawer(uc) {
  document.getElementById("drawer-category").innerText = uc.category;
  document.getElementById("drawer-counter").innerText = `${uc.num} / 12`;
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
          <div>
            <span class="role-tag">[${a.role}]</span>
            <span class="desc-tag">${a.desc}</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  // 前置與後置條件
  const precondsEl = document.getElementById("drawer-preconds");
  precondsEl.innerHTML = uc.preConditions.map((c) => `<li>${c}</li>`).join("");

  const postcondsEl = document.getElementById("drawer-postconds");
  postcondsEl.innerHTML = uc.postConditions.map((c) => `<li>${c}</li>`).join("");

  // 主要事件流 (時間軸)
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

  // UML 循序步驟
  const seqEl = document.getElementById("drawer-seq-box");
  seqEl.innerHTML = uc.sequenceSteps
    .map(
      (sq) => `
      <div class="seq-item">
        <span class="seq-from">${sq.from}</span>
        <span class="seq-arrow">➔</span>
        <span class="seq-msg">${sq.msg}</span>
        <span class="seq-to">${sq.to}</span>
      </div>
    `
    )
    .join("");

  // 技術標籤
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

  const audioWave = document.getElementById("audio-wave");
  const speakTextEl = document.getElementById("speak-btn-text");
  if (audioWave) audioWave.classList.add("playing");
  if (speakTextEl) speakTextEl.innerText = "語音播放中...";

  utterance.onend = () => {
    if (audioWave) audioWave.classList.remove("playing");
    if (speakTextEl) speakTextEl.innerText = "聆聽機器人解說";
  };
  utterance.onerror = () => {
    if (audioWave) audioWave.classList.remove("playing");
    if (speakTextEl) speakTextEl.innerText = "聆聽機器人解說";
  };

  window.speechSynthesis.speak(utterance);
}

function setupEvents() {
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onCanvasClick);

  // 巡航導覽
  document.getElementById("btn-tour").addEventListener("click", () => {
    if (isTourRunning) {
      stopGuidedTour();
    } else {
      startGuidedTour();
    }
  });

  document.getElementById("btn-stop-tour").addEventListener("click", stopGuidedTour);
  document.getElementById("btn-reset-cam").addEventListener("click", resetCameraView);

  // 機器人視角
  document.getElementById("btn-robot-cam").addEventListener("click", () => {
    isRobotCamActive = !isRobotCamActive;
    document.getElementById("btn-robot-cam").classList.toggle("active", isRobotCamActive);
    if (!isRobotCamActive) {
      resetCameraView();
    }
  });

  // 抽屜關閉
  document.getElementById("drawer-close-btn").addEventListener("click", () => {
    document.getElementById("uc-drawer").classList.remove("open");
  });

  // 抽屜分頁切換 (規格流程 vs 循序圖技術)
  document.querySelectorAll(".drawer-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".drawer-tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      const targetEl = document.getElementById(targetTab);
      if (targetEl) targetEl.classList.add("active");
    });
  });

  // 上一個 / 下一個用例切換
  document.getElementById("btn-prev-uc").addEventListener("click", () => {
    const prev = (activeUCIndex - 1 + UC_DATA.length) % UC_DATA.length;
    selectUC(prev, true);
  });

  document.getElementById("btn-next-uc").addEventListener("click", () => {
    const next = (activeUCIndex + 1) % UC_DATA.length;
    selectUC(next, true);
  });

  // 語音播放
  document.getElementById("btn-speak").addEventListener("click", () => {
    const currentUC = UC_DATA[activeUCIndex];
    speakText(currentUC.speechText);
  });

  // 歷史文史 Modal
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
   8. 主動畫渲染循環
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
