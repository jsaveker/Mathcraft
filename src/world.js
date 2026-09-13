import * as THREE from "three";

const THEMES = {
  meadow: {
    sky: 0xc1e1e9,
    fog: 0xd1e7e9,
    grass: [0x7ead50, 0x8abc5a, 0x94c164, 0x76a249],
    leaves: [0x74ae53, 0x5b9b48, 0x88bf5d, 0xe7ae73],
    stone: 0x929a91,
    soil: 0x93725a,
    water: 0x59c8d3,
    glow: 0x70ffda,
  },
  cavern: {
    sky: 0xb6c8df,
    fog: 0xd7d9ec,
    grass: [0x8293a1, 0x9aa8b4, 0x8d9daa, 0xa0acb7],
    leaves: [0x8e83c2, 0xa39cd2, 0x777db7, 0xc4a3d3],
    stone: 0x76778e,
    soil: 0x706879,
    water: 0x8b9ee0,
    glow: 0xc39cff,
  },
  sunset: {
    sky: 0xf2d3ad,
    fog: 0xf3dabe,
    grass: [0xd6b675, 0xe3c387, 0xdcc092, 0xceaa65],
    leaves: [0xc48953, 0xe1a356, 0xd8ae69, 0xb8aa6b],
    stone: 0xae9477,
    soil: 0x987057,
    water: 0x69bac4,
    glow: 0xffdb7e,
  },
};
const hash = (x, z) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export const SHRINES = [
  { x: 2, z: 10 },
  { x: -10, z: 5 },
  { x: 10, z: 0 },
  { x: -8, z: -9 },
  { x: 9, z: -10 },
];
export const PORTAL = { x: 0, z: -9 };

export class IslandWorld {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.mode = "home";
    this.themeId = "meadow";
    this.keys = new Set();
    this.touchMove = { x: 0, z: 0 };
    this.blockStock = 12;
    this.buildMode = false;
    this.selectedBlock = 0;
    this.blocks = new Map();
    this.elapsed = 0;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.velocityY = 0;
    this.player = new THREE.Vector3(1, 3.8, 16);
    this.grounded = true;
    this.drag = null;
    this.particles = [];
    this.shrines = [];
    this.collected = Array(5).fill(false);
    this.lastFrame = performance.now();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      46,
      innerWidth / innerHeight,
      0.1,
      220,
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.07;
    this.renderer.domElement.id = "game-canvas";
    this.renderer.domElement.setAttribute("aria-label", "Mathcraft 3D world");
    container.append(this.renderer.domElement);
    const hemi = new THREE.HemisphereLight(0xe9f9ff, 0x89986c, 2.0);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xffefd3, 2.7);
    this.sun.position.set(-28, 52, 25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -45,
      right: 45,
      top: 40,
      bottom: -40,
      near: 1,
      far: 140,
    });
    this.sun.shadow.bias = -0.001;
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun);
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.ray = new THREE.Raycaster();
    this.ray.far = 6;
    this.targetOutline = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 1.04, 1.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
    );
    this.targetOutline.visible = false;
    this.scene.add(this.targetOutline);
    this.loadTheme("meadow");
    this.bindControls();
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }
  texture(base, kind = "grass") {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d");
    const color = new THREE.Color(base);
    ctx.fillStyle = "#" + color.getHexString();
    ctx.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 80; i++) {
      const n = hash(i, 12);
      ctx.fillStyle =
        n > 0.5 ? "rgba(255,255,220,.065)" : "rgba(20,30,20,.065)";
      ctx.fillRect(
        Math.floor(hash(i, 3) * 16) * 2,
        Math.floor(hash(i, 8) * 16) * 2,
        2 + Math.floor(n * 3),
        2,
      );
    }
    if (kind === "side") {
      ctx.fillStyle = "rgba(35,25,15,.12)";
      ctx.fillRect(0, 28, 32, 4);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
  }
  material(color, kind) {
    return new THREE.MeshStandardMaterial({
      map: this.texture(color, kind),
      roughness: 1,
    });
  }
  loadTheme(id) {
    if (this.root) {
      this.scene.remove(this.root);
      const mats = new Set(),
        geos = new Set();
      this.root.traverse((o) => {
        if (o.geometry && o.geometry !== this.geo) geos.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            mats.add(m),
          );
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    }
    this.themeId = id;
    this.theme = THEMES[id];
    this.scene.background = new THREE.Color(this.theme.sky);
    this.scene.fog = new THREE.Fog(this.theme.fog, 78, 180);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.terrain = new Map();
    this.batches = {};
    this.colliders = [];
    this.shrines = [];
    this.clouds = [];
    this.fireflies = [];
    this.particles = [];
    this.blocks.clear();
    this.blockStock = 12;
    this.mats = {};
    this.theme.grass.forEach(
      (c, i) => (this.mats["grass" + i] = this.material(c)),
    );
    this.theme.leaves.forEach(
      (c, i) => (this.mats["leaf" + i] = this.material(c)),
    );
    Object.assign(this.mats, {
      soil: this.material(this.theme.soil, "side"),
      rock: this.material(this.theme.stone, "side"),
      darkrock: this.material(0x626e69),
      wood: this.material(0x8c6544, "side"),
      plank: this.material(0xc9a16b),
      path: this.material(id === "sunset" ? 0xf0d49c : 0xd9ca9e),
      water: new THREE.MeshStandardMaterial({
        color: this.theme.water,
        transparent: true,
        opacity: 0.82,
        roughness: 0.18,
        metalness: 0.1,
      }),
      white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
      flower: new THREE.MeshStandardMaterial({ color: 0xffcc72 }),
      coral: new THREE.MeshStandardMaterial({ color: 0xf09887 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x293f40 }),
      glow: new THREE.MeshStandardMaterial({
        color: this.theme.glow,
        emissive: this.theme.glow,
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.15,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xf6c96e,
        metalness: 0.25,
        roughness: 0.55,
      }),
    });
    for (let x = -22; x <= 22; x++)
      for (let z = -21; z <= 22; z++) {
        const edge = Math.sqrt((x / 1.04) ** 2 + z * z);
        const wobble = Math.sin(x * 0.48) * 0.7 + Math.cos(z * 0.6) * 0.7;
        if (edge > 21 + wobble) continue;
        const y = edge > 18 ? (hash(x, z) > 0.42 ? 0 : -1) : edge > 16 ? 0 : 1;
        this.terrain.set(`${x},${z}`, y + 0.5);
        const path =
          (Math.abs(x - Math.sin(z * 0.21) * 3) < 1.7 && z > -11) ||
          (Math.abs(z - 5) < 1.3 && Math.abs(x) < 12) ||
          (Math.abs(z + 8) < 1.4 && Math.abs(x) < 10);
        const stream = x > 12 && x < 16 && z > 0 && z < 20;
        this.addBatch(
          stream
            ? "rock"
            : path
              ? "path"
              : "grass" + Math.floor(hash(x, z) * 4),
          x,
          y,
          z,
        );
        const depth =
          edge > 17
            ? 3
            : Math.max(4, Math.floor(11 - edge * 0.29 + hash(x + 3, z) * 3));
        for (let d = 1; d < depth; d++)
          this.addBatch(
            d < 3 ? "soil" : hash(x + d, z) > 0.24 ? "rock" : "darkrock",
            x,
            y - d,
            z,
          );
        if (stream) this.addBatch("water", x, y + 0.55, z, 1, 0.12, 1);
        if (!path && !stream && edge < 19 && hash(x * 5, z * 7) > 0.93) {
          this.addBatch("leaf1", x, y + 0.62, z, 0.08, 0.25, 0.08);
          this.addBatch(
            hash(x, z) > 0.5 ? "flower" : "coral",
            x,
            y + 0.83,
            z,
            0.26,
            0.13,
            0.26,
          );
        }
      }
    const trees = [
      [-15, 11, 1],
      [-13, -1, 0],
      [-15, -11, 2],
      [-9, -15, 0],
      [3, -16, 2],
      [13, -9, 1],
      [17, -1, 0],
      [10, 14, 2],
      [-4, 15, 3],
      [-18, 3, 2],
      [17, 9, 3],
      [-2, -17, 1],
    ];
    trees.forEach(([x, z, c], i) => this.tree(x, z, 3 + (i % 3), c));
    // An inviting little explorer's cottage.
    for (let x = -8; x <= -4; x++)
      for (let z = 0; z <= 3; z++) {
        this.addBatch("plank", x, 1.65, z, 1, 0.3, 1);
        if (z === 0 || x === -8 || x === -4) {
          if (!(z === 0 && x === -6)) {
            this.addBatch("wood", x, 2.5, z, 1, 1.5, 1);
            this.addBatch("plank", x, 3.6, z, 1, 0.7, 1);
          }
        }
      }
    for (let row = 0; row < 4; row++)
      for (let z = -1; z < 5; z++)
        for (const side of [-1, 1])
          this.addBatch(
            "leaf1",
            -6 + side * (3 - row * 0.8),
            4 + row * 0.55,
            z,
            1.2,
            0.65,
            1.2,
          );
    this.addBatch("dark", -6, 2.7, -0.51, 1.3, 1.5, 0.05);
    this.addBatch("glow", -7.45, 3.2, -0.56, 0.3, 0.35, 0.1);
    this.colliders.push({ x: -6, z: 1.5, w: 5, d: 4 });
    // A small arched boardwalk across the water.
    for (let x = 11; x <= 17; x++) {
      this.addBatch("plank", x, 2.02, 7, 1, 0.2, 2.4);
      if (x % 2 === 1) {
        for (const z of [5.7, 8.3]) {
          this.addBatch("wood", x, 2.6, z, 0.16, 1.3, 0.16);
          this.addBatch("gold", x, 3.3, z, 0.25, 0.12, 0.25);
        }
      }
      for (const z of [5.7, 8.3])
        this.addBatch("plank", x, 3.02, z, 1, 0.13, 0.13);
    }
    this.makePortal();
    SHRINES.forEach((p, i) => this.makeShrine(p, i));
    this.makeSheep(-1, 7, 0.3);
    this.makeSheep(7, 4, -0.8);
    this.makeSheep(-11, 9, 1.5);
    // Stepped, distant islands create a miniature world all the way to the horizon.
    [
      [-40, -12, 3, 7],
      [33, -32, 7, 8],
      [-29, -43, 11, 6],
      [48, 0, -3, 5],
      [7, -54, 6, 4],
    ].forEach(([cx, cz, cy, r], i) => {
      for (let x = -r; x <= r; x++)
        for (let z = -r; z <= r; z++) {
          if (x * x + z * z > r * r) continue;
          this.addBatch("grass" + (i % 4), cx + x, cy, cz + z);
          const depth = Math.max(
            1,
            Math.floor((r - Math.hypot(x, z)) * 0.8 + 2),
          );
          for (let j = 1; j < depth; j++)
            this.addBatch(j < 2 ? "soil" : "rock", cx + x, cy - j, cz + z);
        }
      this.tree(cx, cz, 3 + (i % 2), i % 3, cy + 0.5);
    });
    // Waterfalls spill into the clouds, with layered translucent voxel streams.
    [
      [13.5, 19, 1],
      [-19, -5, 0],
      [34, -26, 7],
    ].forEach(([x, z, y]) => {
      for (let i = 0; i < 3; i++)
        this.addBatch(
          "water",
          x + i * 0.45,
          y - 7 - i * 0.3,
          z,
          0.62,
          15 + i,
          1,
        );
      for (let i = 0; i < 6; i++)
        this.addBatch(
          "white",
          x + hash(i, 2) * 2,
          y - 14 - hash(i, 7) * 3,
          z + hash(i, 9),
          0.5,
          0.15,
          0.5,
        );
    });
    this.flushBatches();
    this.makeClouds();
    this.makeFireflies();
    this.updateCollected(this.collected);
    this.renderer.shadowMap.needsUpdate = true;
  }
  addBatch(type, x, y, z, sx = 1, sy = 1, sz = 1) {
    (this.batches[type] ??= []).push([x, y, z, sx, sy, sz]);
  }
  flushBatches() {
    const dummy = new THREE.Object3D();
    Object.entries(this.batches).forEach(([type, items]) => {
      const mesh = new THREE.InstancedMesh(
        this.geo,
        this.mats[type],
        items.length,
      );
      items.forEach(([x, y, z, sx, sy, sz], i) => {
        dummy.position.set(x, y, z);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.castShadow = type !== "water";
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.root.add(mesh);
    });
  }
  tree(x, z, height, c, ground = this.heightAt(x, z)) {
    if (!Number.isFinite(ground)) return;
    for (let j = 0; j < height; j++)
      this.addBatch("wood", x, ground + 0.5 + j, z, 0.85, 1, 0.85);
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++)
        for (let dy = 0; dy <= 2; dy++) {
          if (
            (Math.abs(dx) === 2 && Math.abs(dz) === 2) ||
            (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1))
          )
            continue;
          this.addBatch(
            "leaf" + ((c + ((dx + dz) % 5 === 0 ? 1 : 0)) % 4),
            x + dx,
            ground + height + dy - 0.4,
            z + dz,
            1.07,
            1.07,
            1.07,
          );
        }
    if (Math.abs(x) < 23 && Math.abs(z) < 23)
      this.colliders.push({ x, z, w: 1, d: 1 });
  }
  mesh(mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = this.root) {
    const m = new THREE.Mesh(this.geo, this.mats[mat]);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  makePortal() {
    const { x, z } = PORTAL;
    const y = this.heightAt(x, z);
    this.portal = new THREE.Group();
    this.portal.position.set(x, y, z);
    this.root.add(this.portal);
    for (let i = -3; i <= 3; i++)
      for (let j = -1; j <= 1; j++)
        this.addBatch("rock", x + i, y + 0.1, z + j, 1, 0.3, 1);
    for (const side of [-1, 1]) {
      this.mesh("rock", side * 2.25, 2.6, 0, 1.4, 5.2, 1.5, this.portal);
      for (let i = 0; i < 4; i++)
        this.mesh(
          "glow",
          side * 2.25,
          0.8 + i * 1.05,
          0.8,
          0.23,
          0.34,
          0.05,
          this.portal,
        );
      this.mesh("darkrock", side * 2.25, 5.4, 0, 1.8, 0.4, 1.9, this.portal);
    }
    this.mesh("rock", 0, 5.1, 0, 5.6, 1.1, 1.5, this.portal);
    this.mesh("grass0", 0, 5.74, 0, 5.8, 0.2, 1.65, this.portal);
    this.mesh("gold", 0, 5.15, 0.81, 0.8, 0.8, 0.12, this.portal).rotation.z =
      Math.PI / 4;
    const portalMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.theme.glow) },
        portalPower: { value: 0 },
      },
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec2 vUv; uniform float time; uniform vec3 color; uniform float portalPower; void main(){vec2 p=vUv-.5; float swirl=sin(length(p)*34.0-time*1.5+sin(atan(p.y,p.x)*3.0)*.6); float edge=pow(max(abs(p.x)*2.0,abs(p.y)*2.0),3.0); gl_FragColor=vec4(mix(color*.5,color*1.3,swirl*.18+.5)+edge*.2,.23+portalPower*.45+edge*.3);}",
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.portalSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 4.4),
      portalMat,
    );
    this.portalSurface.position.set(0, 2.55, 0);
    this.portal.add(this.portalSurface);
    this.colliders.push(
      { x: x - 2.25, z, w: 1.4, d: 1.5 },
      { x: x + 2.25, z, w: 1.4, d: 1.5 },
    );
  }
  makeShrine({ x, z }, index) {
    const ground = this.heightAt(x, z);
    this.mesh("rock", x, ground + 0.18, z, 1.5, 0.36, 1.5);
    this.mesh("gold", x, ground + 0.4, z, 1.1, 0.12, 1.1);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      this.mats.glow,
    );
    crystal.scale.y = 1.5;
    crystal.position.set(x, ground + 1.55, z);
    crystal.castShadow = true;
    this.root.add(crystal);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.025, 4, 32),
      this.mats.gold,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, ground + 0.6, z);
    this.root.add(ring);
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffdf0";
    ctx.beginPath();
    ctx.roundRect(12, 12, 104, 104, 24);
    ctx.fill();
    ctx.fillStyle = "#2e5b51";
    ctx.font = "bold 70px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(index + 1, 64, 68);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthTest: true, transparent: true }),
    );
    label.position.set(x, ground + 3, z);
    label.scale.set(0.8, 0.8, 1);
    this.root.add(label);
    this.shrines.push({ crystal, ring, label, x, z, base: ground + 1.55 });
  }
  makeSheep(x, z, rotation) {
    const g = new THREE.Group();
    g.position.set(x, this.heightAt(x, z), z);
    g.rotation.y = rotation;
    this.root.add(g);
    this.mesh("white", 0, 0.8, 0, 1.25, 0.85, 0.8, g);
    this.mesh("white", 0.62, 0.96, 0, 0.6, 0.6, 0.64, g);
    this.mesh("wood", 0.89, 0.84, 0, 0.14, 0.29, 0.5, g);
    this.mesh("dark", 0.83, 1.1, 0.327, 0.12, 0.1, 0.04, g);
    this.mesh("dark", 0.83, 1.1, -0.327, 0.12, 0.1, 0.04, g);
    for (const a of [-0.4, 0.4])
      for (const b of [-0.25, 0.25])
        this.mesh("wood", a, 0.25, b, 0.18, 0.5, 0.18, g);
  }
  makeClouds() {
    for (let i = 0; i < 22; i++) {
      const g = new THREE.Group();
      const r = 35 + hash(i, 4) * 65;
      const angle = hash(i, 5) * Math.PI * 2;
      g.position.set(
        Math.cos(angle) * r,
        -7 + hash(i, 2) * 28,
        Math.sin(angle) * r,
      );
      for (let j = 0; j < 5; j++)
        this.mesh(
          "white",
          (j - 2) * 2,
          hash(j, i) * 1.5,
          hash(i, j) * 2,
          3.5 + hash(j, 2) * 2,
          1.3 + hash(i, j),
          2.7,
          g,
        );
      this.root.add(g);
      this.clouds.push(g);
    }
  }
  makeFireflies() {
    const positions = [];
    for (let i = 0; i < 95; i++)
      positions.push(
        (hash(i, 1) - 0.5) * 42,
        2 + hash(i, 9) * 7,
        (hash(i, 11) - 0.5) * 42,
      );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    this.motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xfff6bf,
        size: 0.075,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    this.root.add(this.motes);
  }
  heightAt(x, z) {
    return this.terrain.get(`${Math.round(x)},${Math.round(z)}`) ?? -100;
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  bindControls() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("blur", () => {
      this.keys.clear();
      if (this.mode === "play") this.callbacks.pause?.();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.keys.clear();
        if (this.mode === "play") this.callbacks.pause?.();
      }
    });
    window.addEventListener("keydown", (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (this.mode !== "play") return;
      this.keys.add(e.code);
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Space") this.jump();
      if (e.code === "KeyE") {
        e.preventDefault();
        this.interact();
      }
      if (e.code === "KeyG") this.guide();
      if (e.code === "KeyB") {
        this.buildMode = !this.buildMode;
        this.callbacks.buildChange?.(this.buildMode);
      }
      if (e.code.startsWith("Digit")) {
        const n = Number(e.code.slice(-1));
        if (n >= 1 && n <= 3) {
          this.selectedBlock = n - 1;
          this.callbacks.blockSelect?.(n - 1);
        }
      }
      if (e.code === "Escape") this.callbacks.pause?.();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    const canvas = this.renderer.domElement;
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      if (this.mode !== "play") return;
      if (this.buildMode && e.pointerType !== "touch") {
        if (e.button === 2) {
          this.placeBlock();
          return;
        }
        if (document.pointerLockElement === canvas && e.button === 0) {
          this.mineBlock();
          return;
        }
      }
      if (e.pointerType === "touch" || document.pointerLockElement !== canvas) {
        this.drag = {
          x: e.clientX,
          y: e.clientY,
          id: e.pointerId,
          moved: 0,
          mine: this.buildMode && e.pointerType !== "touch",
        };
        canvas.setPointerCapture(e.pointerId);
      }
    });
    canvas.addEventListener("pointerup", () => {
      if (this.drag?.mine && this.drag.moved < 5) this.mineBlock();
      this.drag = null;
    });
    canvas.addEventListener("pointercancel", () => (this.drag = null));
    document.addEventListener("pointermove", (e) => {
      if (this.mode !== "play") return;
      let dx = 0,
        dy = 0;
      if (document.pointerLockElement === canvas) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.drag && this.drag.id === e.pointerId) {
        dx = e.clientX - this.drag.x;
        dy = e.clientY - this.drag.y;
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
        this.drag.moved += Math.abs(dx) + Math.abs(dy);
      } else return;
      this.lookYaw -= dx * 0.0025;
      this.lookPitch = THREE.MathUtils.clamp(
        this.lookPitch - dy * 0.0025,
        -1.35,
        1.35,
      );
    });
    document.addEventListener("pointerlockchange", () => {
      if (!document.pointerLockElement && this.mode === "play")
        this.callbacks.pause?.();
    });
    document.addEventListener("pointerlockerror", () =>
      this.callbacks.pointerFallback?.(),
    );
  }
  async lock() {
    try {
      await this.renderer.domElement.requestPointerLock?.();
    } catch {
      this.callbacks.pointerFallback?.();
    }
  }
  setMode(mode) {
    this.mode = mode;
    this.keys.clear();
    this.drag = null;
    this.touchMove = { x: 0, z: 0 };
    if (mode !== "play" && document.pointerLockElement)
      document.exitPointerLock();
    if (mode === "play") this.camera.fov = 70;
    else this.camera.fov = 46;
    this.camera.updateProjectionMatrix();
  }
  start(id, collected) {
    if (id !== this.themeId) this.loadTheme(id);
    this.collected = [...collected];
    this.updateCollected(collected);
    this.player.set(1, this.heightAt(1, 16) + 1.7, 16);
    this.lookYaw = 0;
    this.lookPitch = -0.1;
    this.velocityY = 0;
    this.buildMode = false;
    this.setMode("play");
  }
  jump() {
    if (this.grounded && this.mode === "play") {
      this.velocityY = 7;
      this.grounded = false;
      this.callbacks.jump?.();
    }
  }
  nearby() {
    let best = -1,
      dist = 3.2;
    this.shrines.forEach((s, i) => {
      if (this.collected[i]) return;
      const d = Math.hypot(this.player.x - s.x, this.player.z - s.z);
      if (d < dist) {
        best = i;
        dist = d;
      }
    });
    return best;
  }
  interact() {
    if (this.mode !== "play") return;
    const i = this.nearby();
    if (i >= 0) this.callbacks.challenge?.(i);
    else if (
      this.collected.every(Boolean) &&
      Math.hypot(this.player.x - PORTAL.x, this.player.z - PORTAL.z) < 4
    )
      this.callbacks.complete?.();
    else this.callbacks.tip?.("Follow the floating numbers to find a crystal.");
  }
  guide() {
    const index = this.collected.findIndex((x) => !x);
    const p = index < 0 ? PORTAL : SHRINES[index];
    this.player.set(p.x, this.heightAt(p.x, p.z + 2.5) + 1.7, p.z + 2.5);
    this.lookYaw = 0;
    this.lookPitch = -0.1;
    this.velocityY = 0;
    this.callbacks.tip?.(
      index < 0
        ? "The portal is ready. Press E to step through!"
        : "You found a crystal! Press E to try its number puzzle.",
    );
  }
  updateCollected(collected) {
    this.collected = [...collected];
    this.shrines.forEach((s, i) => {
      s.crystal.visible = !collected[i];
      s.label.visible = !collected[i];
      s.ring.material = collected[i] ? this.mats.glow : this.mats.gold;
    });
    if (this.portalSurface)
      this.portalSurface.material.uniforms.portalPower.value = collected.every(
        Boolean,
      )
        ? 1
        : 0;
  }
  collect(index) {
    this.collected[index] = true;
    this.updateCollected(this.collected);
    this.blockStock += 3;
    const s = SHRINES[index];
    this.burst(new THREE.Vector3(s.x, this.heightAt(s.x, s.z) + 2, s.z), 35);
    this.callbacks.stock?.(this.blockStock);
  }
  burst(pos, count = 35) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        this.geo,
        this.mats[i % 3 === 0 ? "gold" : "glow"],
      );
      m.position.copy(pos);
      m.scale.setScalar(0.07 + Math.random() * 0.12);
      this.root.add(m);
      this.particles.push({
        mesh: m,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 5,
        ),
        life: 1.4,
      });
    }
  }
  blockTarget() {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const placed = this.ray.intersectObjects(
      [...this.blocks.values()],
      false,
    )[0];
    let terrainHit = null;
    for (let t = 0.5; t < 6; t += 0.1) {
      const p = this.ray.ray.at(t, new THREE.Vector3());
      const height = this.heightAt(p.x, p.z);
      if (p.y <= height) {
        terrainHit = { point: p, distance: t };
        break;
      }
    }
    return placed && (!terrainHit || placed.distance < terrainHit.distance)
      ? { placed }
      : terrainHit
        ? { terrain: terrainHit }
        : null;
  }
  placeBlock() {
    if (this.mode !== "play" || !this.buildMode) return;
    if (this.blockStock <= 0) {
      this.callbacks.tip?.("Solve a number puzzle to earn more blocks!");
      return;
    }
    const target = this.blockTarget();
    if (!target) {
      this.callbacks.tip?.("Look down at the ground nearby to build.");
      return;
    }
    let p;
    if (target.placed) {
      p = target.placed.object.position.clone().add(target.placed.face.normal);
    } else {
      p = target.terrain.point.clone();
      p.x = Math.round(p.x);
      p.z = Math.round(p.z);
      p.y = this.heightAt(p.x, p.z) + 0.5;
    }
    const key = `${p.x},${p.y},${p.z}`;
    if (
      this.blocks.has(key) ||
      (Math.abs(p.x - this.player.x) < 0.8 &&
        Math.abs(p.z - this.player.z) < 0.8 &&
        Math.abs(p.y - this.player.y) < 2)
    )
      return;
    if (
      SHRINES.some((s) => Math.hypot(p.x - s.x, p.z - s.z) < 1.6) ||
      Math.hypot(p.x - PORTAL.x, p.z - PORTAL.z) < 3.5
    ) {
      this.callbacks.tip?.("Give the crystals and portal a little space.");
      return;
    }
    if (this.blocks.size >= 150) {
      this.callbacks.tip?.(
        "Your island has 150 blocks! Mine a few to build somewhere new.",
      );
      return;
    }
    const type = ["grass1", "plank", "glow"][this.selectedBlock];
    const m = this.mesh(type, p.x, p.y, p.z);
    m.userData.blockKey = key;
    this.blocks.set(key, m);
    this.blockStock--;
    this.renderer.shadowMap.needsUpdate = true;
    this.callbacks.stock?.(this.blockStock);
  }
  mineBlock() {
    if (this.mode !== "play" || !this.buildMode) return;
    const target = this.blockTarget();
    if (!target?.placed) {
      this.callbacks.tip?.(
        "You can mine the blocks you build. Aim at one, then click.",
      );
      return;
    }
    const m = target.placed.object;
    this.root.remove(m);
    this.blocks.delete(m.userData.blockKey);
    this.blockStock++;
    this.burst(m.position, 8);
    this.renderer.shadowMap.needsUpdate = true;
    this.callbacks.stock?.(this.blockStock);
  }
  canMove(x, z) {
    if (this.heightAt(x, z) < -5) return false;
    for (const c of this.colliders)
      if (
        Math.abs(x - c.x) < c.w / 2 + 0.24 &&
        Math.abs(z - c.z) < c.d / 2 + 0.24
      )
        return false;
    for (const m of this.blocks.values()) {
      if (
        Math.abs(x - m.position.x) < 0.75 &&
        Math.abs(z - m.position.z) < 0.75 &&
        this.player.y - 1.7 < m.position.y + 0.45 &&
        this.player.y > m.position.y - 0.5
      )
        return false;
    }
    return true;
  }
  frame() {
    const now = performance.now();
    const dt = Math.min((now - this.lastFrame) / 1000, 0.045);
    this.lastFrame = now;
    this.elapsed += dt;
    const t = this.elapsed;
    if (this.mode === "home") {
      const narrow = innerWidth < 760;
      const angle = Math.sin(t * 0.045) * 0.045;
      this.camera.position.set(
        39 * Math.cos(angle) + 7 * Math.sin(angle),
        29,
        43,
      );
      this.camera.lookAt(narrow ? 2 : -9, narrow ? -1 : 0, -1);
    } else {
      if (this.mode === "play") {
        if (this.keys.has("ArrowLeft")) this.lookYaw += dt * 1.8;
        if (this.keys.has("ArrowRight")) this.lookYaw -= dt * 1.8;
        let forward =
          (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) -
          (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0) -
          this.touchMove.z;
        let side =
          (this.keys.has("KeyD") ? 1 : 0) -
          (this.keys.has("KeyA") ? 1 : 0) +
          this.touchMove.x;
        const length = Math.hypot(forward, side);
        if (length > 1) {
          forward /= length;
          side /= length;
        }
        const speed = (this.keys.has("ShiftLeft") ? 7 : 4.7) * dt;
        const dx =
          (-Math.sin(this.lookYaw) * forward + Math.cos(this.lookYaw) * side) *
          speed;
        const dz =
          (-Math.cos(this.lookYaw) * forward - Math.sin(this.lookYaw) * side) *
          speed;
        if (this.canMove(this.player.x + dx, this.player.z))
          this.player.x += dx;
        if (this.canMove(this.player.x, this.player.z + dz))
          this.player.z += dz;
        this.velocityY -= 19 * dt;
        this.player.y += this.velocityY * dt;
        let floor = this.heightAt(this.player.x, this.player.z) + 1.7;
        for (const m of this.blocks.values())
          if (
            Math.abs(this.player.x - m.position.x) < 0.7 &&
            Math.abs(this.player.z - m.position.z) < 0.7 &&
            this.player.y - 1.7 >= m.position.y + 0.3
          )
            floor = Math.max(floor, m.position.y + 0.5 + 1.7);
        if (this.player.y <= floor) {
          this.player.y = floor;
          this.velocityY = 0;
          this.grounded = true;
        } else this.grounded = false;
        this.callbacks.position?.({
          x: this.player.x,
          z: this.player.z,
          yaw: this.lookYaw,
          nearby: this.nearby(),
          portal:
            this.collected.every(Boolean) &&
            Math.hypot(this.player.x - PORTAL.x, this.player.z - PORTAL.z) < 4,
        });
      }
      this.camera.position.copy(this.player);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.set(this.lookPitch, this.lookYaw, 0);
    }
    this.shrines.forEach((s, i) => {
      s.crystal.position.y = s.base + Math.sin(t * 1.8 + i) * 0.16;
      s.crystal.rotation.y = t * 0.6 + i;
      s.ring.rotation.z = t * 0.2;
    });
    this.clouds.forEach((c, i) => (c.position.x += dt * 0.08 * (1 + (i % 3))));
    if (this.motes) this.motes.rotation.y = t * 0.012;
    if (this.portalSurface) this.portalSurface.material.uniforms.time.value = t;
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        this.root.remove(p.mesh);
        return false;
      }
      p.velocity.y -= 9 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += dt * 3;
      return true;
    });
    this.targetOutline.visible = false;
    if (this.mode === "play" && this.buildMode) {
      const target = this.blockTarget();
      if (target?.placed) {
        this.targetOutline.position.copy(target.placed.object.position);
        this.targetOutline.visible = true;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
