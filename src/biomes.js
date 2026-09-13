import * as THREE from "three";

export const LANDMARKS = {
  meadow: {
    title: "Waterfall lookout",
    action: "Open the waterfall sluice",
    x: -13,
    z: 7,
    guideZ: 11,
    description:
      "Turn the waterwheel and send the waterfall sparkling into the clouds.",
  },
  cavern: {
    title: "The singing cavern",
    action: "Play the crystal melody",
    x: -13,
    z: -3,
    guideZ: 1,
    description: "Echo the crystal colours to wake the northern lights.",
  },
  sunset: {
    title: "Temple of the sun",
    action: "Align the sun gate",
    x: -13,
    z: 3,
    guideZ: 8,
    description:
      "Turn the three ancient rings until every sun points to the sky.",
  },
};

// Keep the central quest routes stable while giving the outer landscape its own shape.
export function terrainLevel(id, x, z, original) {
  if (id === "village") return 1;
  if (id === "cavern" && z < -16)
    return Math.max(
      original,
      Math.floor((-z - 15) * 0.8 + Math.max(0, 4 - Math.abs(x + 8) * 0.4)),
    );
  if (id === "sunset" && x < -17)
    return Math.max(original, Math.floor(1.5 + Math.sin(z * 0.32) * 1.5));
  if (x >= -17 && x <= -9 && z >= -7 && z <= 12) return 1;
  return original;
}

export class BiomeWorld {
  constructor(world, id) {
    this.world = world;
    this.id = id;
    this.site = LANDMARKS[id];
    this.time = 0;
    this.power = 0;
    this.root = new THREE.Group();
    world.root.add(this.root);
    this.parts = [];
    this.surfaces = [];
    if (id === "village") this.village();
    if (id === "meadow") this.lookout();
    if (id === "cavern") this.cavern();
    if (id === "sunset") this.temple();
  }
  box(mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    this.world.addBatch(mat, x, y, z, sx, sy, sz);
  }
  moving(mat, x, y, z, sx, sy, sz, parent = this.root) {
    return this.world.mesh(mat, x, y, z, sx, sy, sz, parent);
  }
  wall(x, z, w, d) {
    this.world.colliders.push({ x, z, w, d });
  }
  sign(text, x, y, z, width = 3.5) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff9e7";
    ctx.beginPath();
    ctx.roundRect(3, 3, 634, 122, 18);
    ctx.fill();
    ctx.fillStyle = "#32544d";
    ctx.font = "bold 36px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 320, 66, 590);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map }));
    sprite.position.set(x, y, z);
    sprite.scale.set(width, width / 5, 1);
    this.root.add(sprite);
    return sprite;
  }
  village() {
    this.sign("Your village · your imagination", 0, 4, 1, 5);
    // A welcoming arch and open plots, with space for a child's own construction.
    for (const x of [-3, 3]) {
      this.box("wood", x, 3, 4, 0.55, 3, 0.55);
      this.box("leaf1", x, 4.8, 4, 1.5, 0.8, 1.5);
    }
    this.box("plank", 0, 4.4, 4, 6.5, 0.4, 0.5);
    this.box("coral", 0, 4.85, 4, 1.4, 0.45, 0.12);
    for (const [x, z, label] of [
      [-8, -3, "Dream up a castle"],
      [8, -3, "Make a tiny farm"],
      [-8, 9, "Build a cosy home"],
      [8, 9, "Grow your village"],
    ]) {
      this.sign(label, x, 2.7, z - 4, 3.5);
      for (const side of [-1, 1]) {
        this.box("path", x + side * 4, 1.56, z, 0.12, 0.12, 8);
        this.box("path", x, 1.56, z + side * 4, 8, 0.12, 0.12);
      }
    }
    for (const [x, z] of [
      [-17, -12],
      [15, -13],
      [-17, 14],
      [17, 14],
    ])
      this.world.tree(x, z, 4, 1, 1.5);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      this.box(
        "rock",
        Math.cos(a) * 2,
        1.8,
        -13 + Math.sin(a) * 2,
        0.65,
        0.6,
        0.65,
      );
    }
    this.box("water", 0, 1.7, -13, 3.3, 0.15, 3.3);
    this.moving("glow", 0, 2.6, -13, 0.35, 1.8, 0.35);
  }
  lookout() {
    this.sign("Waterfall lookout", -13, 5.6, 7, 4);
    for (const x of [-16, -10]) {
      this.box("wood", x, 3.1, 5, 0.5, 3.2, 0.5);
      this.box("leaf1", x, 5, 5, 1.4, 0.6, 1.4);
    }
    this.box("plank", -13, 4.8, 5, 7, 0.5, 2);
    this.box("rock", -16, 1.8, 6, 1, 1, 5);
    this.wall(-16, 6, 1, 5);
    this.wheel = new THREE.Group();
    this.wheel.position.set(-15, 3.5, 7);
    this.root.add(this.wheel);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const paddle = this.moving(
        "plank",
        Math.cos(a) * 1.4,
        Math.sin(a) * 1.4,
        0,
        0.55,
        0.65,
        0.65,
        this.wheel,
      );
      paddle.rotation.z = a;
    }
    for (const a of [0, Math.PI / 2])
      this.moving("wood", 0, 0, 0, 3.2, 0.17, 0.2, this.wheel).rotation.z = a;
    this.moving("gold", 0, 0, 0.3, 0.5, 0.5, 0.3, this.wheel);
    this.box("rock", -19, 1.85, 6, 8, 0.35, 2.1);
    this.box("water", -19, 2.08, 6, 8, 0.2, 1.6);
    for (const z of [4.95, 7.05]) this.box("rock", -19, 2.2, z, 8, 0.6, 0.22);
    this.stream = this.moving("water", -23, -5, 6, 1, 14.3, 1.6);
    this.stream.material = this.world.mats.water.clone();
    for (let i = 0; i < 12; i++)
      this.box(
        "white",
        -23.4 + (i % 3) * 0.4,
        -12 - Math.floor(i / 3) * 0.35,
        6,
        0.5,
        0.15,
        0.6,
      );
    this.wall(-15, 7, 2, 1);
    for (let i = 0; i < 6; i++) {
      const y = 1.8 + i * 0.55,
        z = 10 - i * 0.9;
      this.box("plank", -10.5, y, z, 1.6, 0.3, 1);
      this.surfaces.push({ x: -10.5, z, w: 1.6, d: 1, top: y + 0.15 });
    }
    this.surfaces.push({ x: -13, z: 5, w: 7, d: 2, top: 5.05 });
  }
  crystal(x, y, z, size, material = "glow") {
    const geo = new THREE.OctahedronGeometry(size, 0);
    const mesh = new THREE.Mesh(geo, this.world.mats[material]);
    mesh.scale.y = 2.4;
    mesh.position.set(x, y, z);
    this.root.add(mesh);
    return mesh;
  }
  cavern() {
    this.sign("The singing cavern", -13, 5.8, 0, 4.4);
    for (const x of [-17, -9]) {
      this.box("rock", x, 4, -4, 1.8, 5, 8);
      this.wall(x, -4, 1.8, 8);
    }
    this.box("darkrock", -13, 4, -8, 8, 5, 1);
    this.wall(-13, -8, 8, 1);
    for (let i = 0; i < 4; i++)
      this.box("rock", -13, 6.5 + i * 0.65, -4, 9 - i * 1.5, 0.8, 9 - i * 0.7);
    this.box("darkrock", -13, 1.58, -4, 6.5, 0.16, 7);
    for (const [x, z, s] of [
      [-16, -6, 0.7],
      [-10, -6, 0.9],
      [-16, -2, 0.5],
      [-10, -3, 0.6],
      [-13, -7, 1],
    ])
      this.crystal(x, 2 + s, z, s);
    this.beacons = [-15, -13, -11].map((x, i) =>
      this.crystal(x, 2.7, -4, 0.4, ["water", "glow", "gold"][i]),
    );
    const light = new THREE.PointLight(0x9966ff, 35, 13, 2);
    light.position.set(-13, 5, -3);
    this.root.add(light);
    // Large snow-capped peaks behind the playable ridge.
    for (const [x, z, h] of [
      [-24, -27, 17],
      [-8, -32, 24],
      [11, -28, 15],
    ]) {
      for (let level = 0; level < h; level += 2) {
        const size = Math.max(1, (h - level) * 0.72);
        this.box(
          level > h * 0.66 ? "white" : "rock",
          x,
          level / 1.4,
          z,
          size,
          1.6,
          size,
        );
      }
    }
    this.aurora = new THREE.Mesh(
      new THREE.PlaneGeometry(105, 22, 90, 16),
      new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, power: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `uniform float time; varying vec2 vUv; void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.08+time*.25)*5.;p.y+=sin(p.x*.1+time*.3)*2.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
        fragmentShader: `uniform float time;uniform float power;varying vec2 vUv;void main(){float wave=.43+sin(vUv.x*15.+time*.25)*.13;float band=exp(-pow((vUv.y-wave)*5.,2.));float rays=.7+.3*sin(vUv.x*180.+time*.2);float edge=sin(vUv.x*3.14159);vec3 c=mix(vec3(.2,1.,.76),vec3(.64,.38,1.),vUv.y);gl_FragColor=vec4(c,band*rays*edge*(.18+power*.45));}`,
      }),
    );
    this.aurora.position.set(0, 28, -44);
    this.root.add(this.aurora);
    const positions = [];
    for (let i = 0; i < 160; i++)
      positions.push(
        Math.sin(i * 13.7) * 80,
        20 + (i % 17) * 2.3,
        -25 - Math.abs(Math.cos(i * 9.3)) * 70,
      );
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    this.root.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: 0xddefff, size: 0.17 }),
      ),
    );
  }
  temple() {
    this.sign("Temple of the sun", -13, 6.8, 5, 4.5);
    for (let level = 0; level < 5; level++)
      this.box(
        "path",
        -13,
        1.5 + level * 0.55,
        -1,
        11 - level * 1.5,
        0.6,
        10 - level * 1.3,
      );
    for (let level = 0; level < 5; level++)
      this.surfaces.push({
        x: -13,
        z: -1,
        w: 11 - level * 1.5,
        d: 10 - level * 1.3,
        top: 1.8 + level * 0.55,
      });
    for (const x of [-17, -9]) {
      this.box("rock", x, 4, 4, 1.3, 5, 1.5);
      this.box("gold", x, 6.5, 4, 1.7, 0.35, 1.9);
      this.wall(x, 4, 1.3, 1.5);
    }
    this.box("rock", -13, 6.2, 4, 9, 0.8, 1.5);
    this.gate = new THREE.Group();
    this.gate.position.set(-13, 3.8, 3.8);
    this.root.add(this.gate);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.65 - i * 0.42, 0.1, 4, 32),
        this.world.mats.gold,
      );
      ring.rotation.z = ((i + 1) * Math.PI) / 2;
      this.gate.add(ring);
      this.parts.push(ring);
      this.moving("glow", 0, 1.65 - i * 0.42, 0.12, 0.3, 0.3, 0.2, ring);
    }
    this.sun = this.crystal(-13, 3.8, 3.8, 0.35, "gold");
    for (const [x, z, h] of [
      [-25, -21, 10],
      [25, -18, 15],
      [30, 10, 9],
    ])
      for (let y = 0; y < h; y++)
        this.box(
          y === h - 1 ? "gold" : "path",
          x,
          y * 0.8,
          z,
          (h - y) * 1.5,
          0.8,
          (h - y) * 1.5,
        );
    // Oasis and palm silhouettes, distinct from the grassland trees.
    for (const [x, z] of [
      [-17, 13],
      [-7, 15],
      [17, -7],
    ]) {
      this.box("wood", x, 3.8, z, 0.55, 5, 0.55);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        this.box(
          "leaf1",
          x + Math.cos(a) * 1.5,
          6.2,
          z + Math.sin(a) * 1.5,
          Math.cos(a) ? 3.5 : 0.6,
          0.35,
          Math.sin(a) ? 3.5 : 0.6,
        );
      }
    }
  }
  activate(active) {
    this.power = active ? 1 : 0;
  }
  guide() {
    if (!this.site) return;
    const { x, guideZ } = this.site;
    this.world.player.set(x, this.world.heightAt(x, guideZ) + 1.7, guideZ);
    this.world.lookYaw = 0;
    this.world.lookPitch = 0.04;
    this.world.velocityY = 0;
  }
  nearby(x, z) {
    return this.site && Math.hypot(x - this.site.x, z - this.site.z) < 5.3;
  }
  blocksMovement(x, z) {
    return (
      this.id === "sunset" &&
      !this.power &&
      Math.abs(x + 13) < 1.8 &&
      Math.abs(z - 3.8) < 0.5
    );
  }
  protected(x, z) {
    return (
      this.site &&
      Math.abs(x - this.site.x) < 5.5 &&
      Math.abs(z - this.site.z) < 6
    );
  }
  update(dt) {
    this.time += dt;
    if (this.wheel) {
      this.wheel.rotation.z -= dt * (0.08 + this.power * 0.7);
      this.stream.material.opacity = 0.2 + this.power * 0.65;
    }
    if (this.aurora) {
      this.aurora.material.uniforms.time.value = this.time;
      this.aurora.material.uniforms.power.value = this.power;
      this.beacons.forEach((b, i) => {
        b.rotation.y = this.time * 0.3;
        b.position.y = 2.7 + Math.sin(this.time * 1.5 + i) * 0.12;
      });
    }
    if (this.gate) {
      this.gate.rotation.y +=
        ((this.power ? Math.PI / 2 : 0) - this.gate.rotation.y) *
        Math.min(1, dt * 2);
      this.parts.forEach(
        (r, i) =>
          (r.rotation.z = this.power
            ? this.time * (i % 2 ? 0.15 : -0.15)
            : ((i + 1) * Math.PI) / 2),
      );
    }
  }
  heightAt(x, z) {
    return this.surfaces.reduce(
      (height, s) =>
        Math.abs(x - s.x) <= s.w / 2 && Math.abs(z - s.z) <= s.d / 2
          ? Math.max(height, s.top)
          : height,
      -100,
    );
  }
  camera() {
    return this.id === "meadow"
      ? { position: [-32, 8, 18], target: [-18, -2, 6] }
      : this.id === "cavern"
        ? { position: [7, 13, 22], target: [-6, 14, -20] }
        : { position: [-3, 9, 13], target: [-13, 3, 2] };
  }
}
