/**
 * 大村武魁祠 × AMR 智慧導覽島嶼 (Wukui AMR Island)
 * Three.js 3D 核心互動引擎
 */

// 全域狀態
let scene, camera, renderer, controls;
let robotGroup, lidarTurret, scanRingMesh;
let ucStationMeshes = [];
let activeUCIndex = 0;
let isTourRunning = false;
let tourTimeoutId = null;
let isRobotCamActive = false;
let raycaster, mouse;
let hoveredMesh = null;

// 相機預設全景角度 (鳥瞰武魁祠三合院)
const DEFAULT_CAM_POS = { x: 0, y: 32, z: 38 };
const DEFAULT_LOOK_AT = { x: 0, y: 2, z: 2 };

// 初始化入口
window.addEventListener("DOMContentLoaded", () => {
  init3DScene();
  buildDacunWukuiAncestralHall();
  build12UCStationBeacons();
  buildAMRRobot();
  setupUI();
  setupEvents();
  animate();

  // 預設選取 UC01，讓使用者一進來就看到迎賓首站
  setTimeout(() => {
    selectUC(0, false);
  }, 600);
});

/* ==========================================================================
   1. 3D 場景與燈光初始化
   ========================================================================== */
function init3DScene() {
  const container = document.getElementById("canvas-container");

  // 場景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c121e);
  scene.fog = new THREE.FogExp2(0x0c121e, 0.015);

  // 相機
  camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.5,
    500
  );
  camera.position.set(DEFAULT_CAM_POS.x, DEFAULT_CAM_POS.y, DEFAULT_CAM_POS.z);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // 軌道控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // 避免沉入地底
  controls.minDistance = 6;
  controls.maxDistance = 110;
  controls.target.set(DEFAULT_LOOK_AT.x, DEFAULT_LOOK_AT.y, DEFAULT_LOOK_AT.z);

  // 燈光設置
  const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.7); // 暖白環境光
  scene.add(ambientLight);

  // 暖陽主光 (模擬台灣中部彰化晴朗陽光)
  const sunLight = new THREE.DirectionalLight(0xfffae0, 1.4);
  sunLight.position.set(25, 45, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 150;
  sunLight.shadow.camera.left = -35;
  sunLight.shadow.camera.right = 35;
  sunLight.shadow.camera.top = 35;
  sunLight.shadow.camera.bottom = -35;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // AMR 科技冷色補光
  const techFillLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
  techFillLight.position.set(-30, 20, -25);
  scene.add(techFillLight);

  // 武魁祠正廳燈籠暖光
  const hallLight = new THREE.PointLight(0xf97316, 2.5, 20);
  hallLight.position.set(0, 4, -4);
  scene.add(hallLight);

  // Raycaster 用於滑鼠點選 3D 地標
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

/* ==========================================================================
   2. 彰化大村武魁祠三合院古蹟 3D 場景建構
   ========================================================================== */
function buildDacunWukuiAncestralHall() {
  const heritageGroup = new THREE.Group();

  // (1) 卡坦島式六角浮島基座 (Hexagonal Island Base)
  const islandRadius = 26;
  const islandHeight = 3.5;
  const islandGeo = new THREE.CylinderGeometry(islandRadius, islandRadius * 1.05, islandHeight, 6);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.85,
    metalness: 0.1
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = -islandHeight / 2;
  island.receiveShadow = true;
  heritageGroup.add(island);

  // 浮島頂部綠地表層
  const grassGeo = new THREE.CylinderGeometry(islandRadius * 0.98, islandRadius * 0.98, 0.2, 6);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x274e36, // 台灣農村沉穩綠意
    roughness: 0.9
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.1;
  grass.receiveShadow = true;
  heritageGroup.add(grass);

  // (2) 前埕廣場石板鋪面 (Courtyard Paving)
  const plazaGeo = new THREE.BoxGeometry(20, 0.25, 18);
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.75
  });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.set(0, 0.15, 4);
  plaza.receiveShadow = true;
  heritageGroup.add(plaza);

  // (3) 武魁祠正身正廳 (Main Hall - 咸豐武魁匾高懸處)
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x993322, roughness: 0.8 }); // 閩南紅磚
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x333b48, roughness: 0.5 }); // 屋面黑瓦
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.7 }); // 樑木

  // 正身建築主體
  const mainHallGeo = new THREE.BoxGeometry(14, 5.5, 6);
  const mainHall = new THREE.Mesh(mainHallGeo, brickMat);
  mainHall.position.set(0, 2.75, -6);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  heritageGroup.add(mainHall);

  // 正廳大門開口與門面木雕
  const doorGeo = new THREE.BoxGeometry(3, 4, 0.4);
  const door = new THREE.Mesh(doorGeo, woodMat);
  door.position.set(0, 2, -2.85);
  heritageGroup.add(door);

  // 「武魁」匾額模型
  const wukuiSignGeo = new THREE.BoxGeometry(2.6, 1, 0.2);
  const wukuiSignMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.3,
    roughness: 0.4
  });
  const wukuiSign = new THREE.Mesh(wukuiSignGeo, wukuiSignMat);
  wukuiSign.position.set(0, 4.4, -2.8);
  heritageGroup.add(wukuiSign);

  // 正身燕尾翹脊屋頂 (Swallowtail Roof)
  const mainRoofGeo = new THREE.ConeGeometry(9.5, 3.2, 4);
  const mainRoof = new THREE.Mesh(mainRoofGeo, roofTileMat);
  mainRoof.position.set(0, 7, -6);
  mainRoof.rotation.y = Math.PI / 4;
  mainRoof.scale.set(1.4, 0.9, 0.8);
  mainRoof.castShadow = true;
  heritageGroup.add(mainRoof);

  // 左右燕尾翹脊細部裝飾
  [-7.5, 7.5].forEach((x) => {
    const ridgeTipGeo = new THREE.ConeGeometry(0.35, 1.8, 4);
    const ridgeTipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const ridgeTip = new THREE.Mesh(ridgeTipGeo, ridgeTipMat);
    ridgeTip.position.set(x, 7.8, -6);
    ridgeTip.rotation.z = x > 0 ? -0.6 : 0.6;
    heritageGroup.add(ridgeTip);
  });

  // (4) 左右護龍廂房 (Left & Right Wings - 形成ㄇ字型三合院格局)
  const wingGeo = new THREE.BoxGeometry(4.5, 4.5, 14);
  const wingRoofGeo = new THREE.ConeGeometry(5, 2.6, 4);

  // 左護龍 (東廂 - 常民文化展區)
  const leftWing = new THREE.Mesh(wingGeo, brickMat);
  leftWing.position.set(8.5, 2.25, 2);
  leftWing.castShadow = true;
  leftWing.receiveShadow = true;
  heritageGroup.add(leftWing);

  const leftRoof = new THREE.Mesh(wingRoofGeo, roofTileMat);
  leftRoof.position.set(8.5, 5.5, 2);
  leftRoof.rotation.y = Math.PI / 4;
  leftRoof.scale.set(0.7, 0.9, 2.2);
  leftRoof.castShadow = true;
  heritageGroup.add(leftRoof);

  // 右護龍 (西廂 - 互動問答與充電樁區)
  const rightWing = new THREE.Mesh(wingGeo, brickMat);
  rightWing.position.set(-8.5, 2.25, 2);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  heritageGroup.add(rightWing);

  const rightRoof = new THREE.Mesh(wingRoofGeo, roofTileMat);
  rightRoof.position.set(-8.5, 5.5, 2);
  rightRoof.rotation.y = Math.PI / 4;
  rightRoof.scale.set(0.7, 0.9, 2.2);
  rightRoof.castShadow = true;
  heritageGroup.add(rightRoof);

  // (5) 武魁祠山門 (Entrance Gatehouse)
  const gateWallGeo = new THREE.BoxGeometry(6, 4, 1.5);
  const gateWall = new THREE.Mesh(gateWallGeo, brickMat);
  gateWall.position.set(0, 2, 11);
  gateWall.castShadow = true;
  heritageGroup.add(gateWall);

  const gateRoofGeo = new THREE.ConeGeometry(4.5, 2.2, 4);
  const gateRoof = new THREE.Mesh(gateRoofGeo, roofTileMat);
  gateRoof.position.set(0, 4.8, 11);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.scale.set(1.2, 0.8, 0.6);
  gateRoof.castShadow = true;
  heritageGroup.add(gateRoof);

  // (6) 舉人旗杆石座與高聳旗杆群 (象徵咸豐九年賴步雲、賴登雲兄弟同中武舉，貢旗村由此得名)
  [-3.8, 3.8].forEach((x) => {
    // 石雕基座
    const baseGeo = new THREE.CylinderGeometry(0.75, 0.95, 0.8, 8);
    const stoneBase = new THREE.Mesh(baseGeo, plazaMat);
    stoneBase.position.set(x, 0.4, 5.5);
    stoneBase.castShadow = true;
    heritageGroup.add(stoneBase);

    // 杉木旗杆
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 9, 12);
    const pole = new THREE.Mesh(poleGeo, woodMat);
    pole.position.set(x, 5, 5.5);
    pole.castShadow = true;
    heritageGroup.add(pole);

    // 貢旗令旗 (黃金紅底旌旗)
    const flagGeo = new THREE.PlaneGeometry(1.8, 1.2);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      roughness: 0.6
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + 0.9, 8.5, 5.5);
    heritageGroup.add(flag);
  });

  // (7) 環境裝飾：古樹、石桌石凳、紅燈籠
  buildHeritageProps(heritageGroup);

  scene.add(heritageGroup);
}

// 輔助環境裝飾
function buildHeritageProps(parent) {
  // 古樸老榕樹 (大村農村意象)
  const treePositions = [
    [-15, 0, -8],
    [15, 0, -8],
    [-17, 0, 8],
    [16, 0, 10]
  ];

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x473426, roughness: 0.9 });
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1e5e3a, roughness: 0.8 });

  treePositions.forEach(([x, y, z]) => {
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, y + 2, z);
    trunk.castShadow = true;
    parent.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const foliage = new THREE.Mesh(foliageGeo, leavesMat);
    foliage.position.set(x, y + 4.8, z);
    foliage.castShadow = true;
    parent.add(foliage);
  });

  // 正廳懸掛的一對喜慶紅燈籠
  [-2.2, 2.2].forEach((x) => {
    const lanternGeo = new THREE.SphereGeometry(0.4, 12, 8);
    lanternGeo.scale(1, 1.3, 1);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.5
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(x, 4.2, -2.6);
    parent.add(lantern);
  });
}

/* ==========================================================================
   3. 12 個獨立用例 (UC01 ~ UC12) 3D 浮島地標節點
   ========================================================================== */
function build12UCStationBeacons() {
  const stationGroup = new THREE.Group();

  UC_DATA.forEach((uc, index) => {
    const [x, y, z] = uc.pos;
    const subGroup = new THREE.Group();
    subGroup.position.set(x, y, z);
    subGroup.userData = { ucIndex: index, ucId: uc.id };

    // 1. 卡坦島式六角獨立小地台
    const hexGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.45, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.2,
      roughness: 0.6
    });
    const hexPlatform = new THREE.Mesh(hexGeo, hexMat);
    hexPlatform.position.y = 0.22;
    hexPlatform.receiveShadow = true;
    subGroup.add(hexPlatform);

    // 2. 科技發光感應圓環 (Sensor Pulse Ring)
    const ringGeo = new THREE.RingGeometry(1.1, 1.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.46;
    subGroup.add(ring);

    // 3. 垂直微光柱 (Beacon Beam)
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.6;
    subGroup.add(beam);

    // 4. 懸浮 3D 標籤圖釘 (Canvas Sprite 顯示 UC 編號)
    const sprite = createUCSprite(uc.id, index + 1);
    sprite.position.y = 3.6;
    subGroup.add(sprite);

    // 5. 點擊碰撞專用隱形 Mesh
    const hitBoxGeo = new THREE.CylinderGeometry(1.8, 1.8, 4.5, 8);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.y = 2.25;
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
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  roundRect(ctx, 8, 8, 240, 112, 28);
  ctx.fill();

  ctx.strokeStyle = "#38bdf8";
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
  sprite.scale.set(2.8, 1.4, 1);
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
  robotGroup.position.set(0, 0.35, 12); // 初始待命位置 (靠近山門)

  // 機器人圓形流線底盤
  const chassisGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.65, 32);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.5,
    roughness: 0.2
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  robotGroup.add(chassis);

  // 黑色互動資訊觸控螢幕面板 (前置)
  const screenGeo = new THREE.BoxGeometry(0.8, 0.45, 0.1);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.55, 0.88);
  screen.rotation.x = -0.2;
  robotGroup.add(screen);

  // 頂部旋轉 360° LiDAR 光達感測器
  lidarTurret = new THREE.Group();
  lidarTurret.position.set(0, 0.85, 0);

  const lidarBaseGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.25, 24);
  const lidarBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const lidarBase = new THREE.Mesh(lidarBaseGeo, lidarBaseMat);
  lidarTurret.add(lidarBase);

  // 光達雷射掃描薄扇 (Laser Beam Fan)
  const laserFanGeo = new THREE.RingGeometry(0.3, 3.5, 32, 1, 0, Math.PI / 3);
  const laserFanMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4
  });
  const laserFan = new THREE.Mesh(laserFanGeo, laserFanMat);
  laserFan.rotation.x = -Math.PI / 2;
  laserFan.position.y = 0.12;
  lidarTurret.add(laserFan);

  robotGroup.add(lidarTurret);

  // 機器人底部 SLAM 點雲導航光圈
  const slamRingGeo = new THREE.RingGeometry(1.0, 1.25, 32);
  const slamRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
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

  // 動態生成 12 個獨立的 UC 按鈕 (UC01 ~ UC12)
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

  // 1. 更新底部 12 項目按鈕高亮狀態
  document.querySelectorAll(".uc-item-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });

  // 自動捲動底部 Dock 使選取項目可見
  const activeBtn = document.getElementById(`dock-btn-${index}`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  // 2. 更新 3D 浮島節點外觀高亮
  ucStationMeshes.forEach((station, i) => {
    if (i === index) {
      station.ring.material.color.setHex(0xf59e0b); // 當前選中變為榮譽金
      station.ring.scale.set(1.4, 1.4, 1.4);
    } else {
      station.ring.material.color.setHex(0x22d3ee); // 其他為科技青藍
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
// 相機聚焦動畫
function focusCameraOn(targetX, targetY, targetZ) {
  // 計算相機最佳特寫視角 (在目標前方稍微抬高)
  const offset = { x: 0, y: 11, z: 14 };
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
    .to({ x: targetX, y: targetY + 1.2, z: targetZ }, 1400)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
}

// 機器人自主導航平滑行進至指定座標
function moveRobotTo(destX, destZ) {
  if (!robotGroup) return;

  // 1. 計算轉向角度 (Yaw)
  const dx = destX - robotGroup.position.x;
  const dz = destZ - robotGroup.position.z;
  const targetAngle = Math.atan2(dx, dz);

  new TWEEN.Tween(robotGroup.rotation)
    .to({ y: targetAngle }, 450)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  // 2. 計算行進補間 (平滑模擬 SLAM 循跡導航)
  new TWEEN.Tween(robotGroup.position)
    .to({ x: destX, z: destZ }, 1300)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

// 重置相機為全景鳥瞰視角
function resetCameraView() {
  isRobotCamActive = false;
  document.getElementById("btn-robot-cam").classList.remove("active");

  new TWEEN.Tween(camera.position)
    .to(DEFAULT_CAM_POS, 1200)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  new TWEEN.Tween(controls.target)
    .to(DEFAULT_LOOK_AT, 1200)
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

    // 播放語音解說
    speakText(uc.speechText);

    currentTourStep++;
    // 每個景點停留 7.5 秒後前往下一用例
    tourTimeoutId = setTimeout(runTourStep, 7500);
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
  window.speechSynthesis.cancel(); // 停止上一段語音
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
  // 視窗大小自適應
  window.addEventListener("resize", onWindowResize);

  // 滑鼠懸停與點擊 3D 浮島節點
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onCanvasClick);

  // 頂部導覽列按鈕
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

// 3D 節點懸停與 Tooltip
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

// 點選 3D 浮島節點直接開啟對應 UC
function onCanvasClick(event) {
  // 排除點擊在 UI 面板上的情況
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
    lidarTurret.rotation.y += 0.04;
  }

  // SLAM 點雲光圈呼吸動態
  if (scanRingMesh) {
    const scale = 1 + Math.sin(time * 0.003) * 0.08;
    scanRingMesh.scale.set(scale, scale, scale);
  }

  // 12 個節點標籤微幅懸浮沉浮動態
  ucStationMeshes.forEach((st, idx) => {
    st.sprite.position.y = 3.6 + Math.sin(time * 0.002 + idx) * 0.15;
  });

  // 若開啟機器人第一人稱視角，相機跟隨機器人
  if (isRobotCamActive && robotGroup) {
    const camOffset = new THREE.Vector3(0, 1.8, -2.8).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      robotGroup.rotation.y
    );
    camera.position.copy(robotGroup.position).add(camOffset);
    const lookTarget = robotGroup.position
      .clone()
      .add(
        new THREE.Vector3(0, 1.2, 5).applyAxisAngle(
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

