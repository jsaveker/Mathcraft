import * as THREE from "three";
import { QUESTS, describeQuest, bridgePlan } from "./quests.js";

const DEMO = {
  questions: [
    { a: 6, b: 4, operator: "+", answer: 10 },
    { a: 18, b: 10, operator: "−", answer: 8 },
    { a: 5, b: 7, operator: "+", answer: 12 },
    { a: 16, b: 4, operator: "−", answer: 12 },
    { a: 7, b: 3, operator: "+", answer: 10 },
  ],
  collected: Array(5).fill(false),
  gathered: Array(5).fill(false),
};

export class QuestWorld {
  constructor(world) {
    this.world = world;
    this.configure(world.questRound || DEMO);
  }
  configure(round) {
    if (this.root) {
      this.root.removeFromParent();
      this.root.traverse((o) => {
        if (o.isSprite) {
          o.material.map?.dispose();
          o.material.dispose();
        }
        if (o.isInstancedMesh) o.dispose();
      });
    }
    this.round = round;
    this.root = new THREE.Group();
    this.world.root.add(this.root);
    this.supplies = [];
    this.effects = [];
    this.animations = [];
    this.hearts = [];
    this.plan = bridgePlan(round.questions);
    this.buildBridge();
    this.buildSupplies();
    this.buildPasture();
    this.buildGarden();
    this.buildGenerator();
    this.apply();
  }
  box(mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = this.root) {
    return this.world.mesh(mat, x, y, z, sx, sy, sz, parent);
  }
  label(text, x, y, z, width = 2.7) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 112;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffbee";
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 104, 20);
    ctx.fill();
    ctx.fillStyle = "#436047";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 30px Trebuchet MS";
    ctx.fillText(text, 256, 58, 475);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, transparent: true, depthTest: true }),
    );
    sprite.scale.set(width, (width * 112) / 512, 1);
    sprite.position.set(x, y, z);
    this.root.add(sprite);
    return sprite;
  }
  instances(mat, count, positionFor, parent = this.root) {
    if (count === 0) return new THREE.Group();
    const mesh = new THREE.InstancedMesh(
      this.world.geo,
      this.world.mats[mat],
      count,
    );
    const transform = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const { x, y, z, sx, sy, sz } = positionFor(i);
      transform.position.set(x, y, z);
      transform.scale.set(sx, sy, sz);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  buildBridge() {
    const { total, laid } = this.plan;
    const width = 7 / Math.max(total, 1);
    this.bridgeParts = [];
    for (const [start, end] of [
      [0, laid],
      [laid, total],
    ]) {
      const part = new THREE.Group();
      this.root.add(part);
      this.instances(
        "plank",
        end - start,
        (i) => ({
          x: 10.5 + (start + i + 0.5) * width,
          y: 2.02,
          z: 7,
          sx: width * 0.95,
          sy: 0.2,
          sz: 2.4,
        }),
        part,
      );
      this.bridgeParts.push(part);
    }
    for (const z of [5.85, 8.15]) this.box("wood", 14, 1.64, z, 7, 0.22, 0.16);
    this.rails = new THREE.Group();
    this.root.add(this.rails);
    for (const x of [11, 13, 15, 17])
      for (const z of [5.7, 8.3]) {
        this.box("wood", x, 2.65, z, 0.16, 1.25, 0.16, this.rails);
        this.box("gold", x, 3.31, z, 0.27, 0.12, 0.27, this.rails);
      }
    for (const z of [5.7, 8.3])
      this.box("plank", 14, 3.03, z, 7, 0.13, 0.13, this.rails);
    for (const x of [11, 17]) {
      this.box("wood", x, 3.5, 8.4, 0.1, 2.8, 0.1, this.rails);
      this.box("coral", x + 0.4, 4.55, 8.4, 0.75, 0.45, 0.06, this.rails);
    }
    this.bridgeStatus = this.label(
      "A bridge waiting for a little maths",
      14,
      3.9,
      6,
      4.1,
    );
    this.effects[0] = [this.bridgeParts[0]];
    this.effects[1] = [this.bridgeParts[1], this.rails];
  }
  buildSupplies() {
    QUESTS.forEach((quest, index) => {
      const q = this.round.questions[index],
        ground = this.world.heightAt(quest.x, quest.z),
        group = new THREE.Group();
      this.root.add(group);
      this.supplies.push(group);
      const mat =
        index < 2
          ? "plank"
          : index === 2
            ? "apple"
            : index === 3
              ? "flower"
              : "glow";
      [q.a, q.b].forEach((amount, side) => {
        const x = quest.x + (side === 0 ? -0.9 : 0.9),
          z = quest.z - 0.3;
        this.box("wood", x, ground + 0.2, z, 1.45, 0.4, 1.05, group);
        this.box("plank", x, ground + 0.44, z - 0.47, 1.5, 0.16, 0.09, group);
        this.box("plank", x, ground + 0.44, z + 0.47, 1.5, 0.16, 0.09, group);
        if (index === 1 || index === 4) {
          this.box("darkrock", x, ground + 0.9, z, 0.6, 1.1, 0.45, group);
          this.box("glow", x, ground + 1.1, z + 0.24, 0.4, 0.2, 0.04, group);
        } else {
          this.instances(
            mat,
            amount,
            (i) => ({
              x: x - 0.55 + (i % 10) * 0.12,
              y: ground + 0.52 + Math.floor(i / 10) * 0.085,
              z,
              sx: 0.1,
              sy: index < 2 ? 0.05 : 0.075,
              sz: index < 2 ? 0.55 : 0.1,
            }),
            group,
          );
        }
        // Exact counts remain legible even when many small supplies are stacked.
        group.add(
          this.label(
            `${describeQuest(index, q).labels[side]}: ${amount}`,
            x,
            ground + 1.65,
            z,
            1.65,
          ),
        );
      });
      this.box("wood", quest.x, ground + 0.8, quest.z - 1.1, 0.13, 1.6, 0.13);
      this.box("plank", quest.x, ground + 1.35, quest.z - 1.1, 2.5, 0.45, 0.12);
    });
  }
  buildPasture() {
    const ground = this.world.heightAt(7, -1.8);
    this.box("wood", 7, ground + 0.22, -1.8, 3, 0.35, 0.8);
    this.box("plank", 7, ground + 0.44, -2.2, 3, 0.25, 0.1);
    this.box("plank", 7, ground + 0.44, -1.4, 3, 0.25, 0.1);
    this.feed = new THREE.Group();
    this.root.add(this.feed);
    const count = this.round.questions[2].answer;
    this.instances(
      "apple",
      count,
      (i) => ({
        x: 5.7 + (i % 10) * 0.28,
        y: ground + 0.48 + Math.floor(i / 20) * 0.11,
        z: -2 + (Math.floor(i / 10) % 2) * 0.32,
        sx: 0.18,
        sy: 0.15,
        sz: 0.18,
      }),
      this.feed,
    );
    this.hearts = [5, 7, 9].map((x, i) => {
      const heart = new THREE.Group();
      heart.position.set(x, 3.6, -0.5 + i * 0.35);
      this.root.add(heart);
      ["01010", "11111", "01110", "00100"].forEach((row, y) => {
        [...row].forEach((pixel, col) => {
          if (pixel === "1")
            this.box(
              "apple",
              (col - 2) * 0.12,
              (1.5 - y) * 0.12,
              0,
              0.12,
              0.12,
              0.12,
              heart,
            );
        });
      });
      return heart;
    });
    this.effects[2] = [this.feed];
  }
  buildGarden() {
    const ground = this.world.heightAt(-8, -11.5);
    this.box("soil", -8, ground + 0.06, -11.5, 3.7, 0.12, 3.4);
    for (const x of [-10, -6])
      this.box("plank", x, ground + 0.17, -11.5, 0.18, 0.35, 3.8);
    for (const z of [-13.35, -9.65])
      this.box("plank", -8, ground + 0.17, z, 4.1, 0.35, 0.18);
    this.garden = new THREE.Group();
    this.root.add(this.garden);
    const count = this.round.questions[3].answer;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / columns));
    const pos = (i) => ({
      x: -9.7 + ((i % columns) + 0.5) * (3.4 / columns),
      z: -13.05 + (Math.floor(i / columns) + 0.5) * (3.1 / rows),
    });
    this.instances(
      "leaf1",
      count,
      (i) => ({ ...pos(i), y: ground + 0.36, sx: 0.05, sy: 0.45, sz: 0.05 }),
      this.garden,
    );
    this.instances(
      "coral",
      count,
      (i) => ({ ...pos(i), y: ground + 0.63, sx: 0.22, sy: 0.13, sz: 0.22 }),
      this.garden,
    );
    this.instances(
      "flower",
      count,
      (i) => ({ ...pos(i), y: ground + 0.72, sx: 0.08, sy: 0.06, sz: 0.08 }),
      this.garden,
    );
    this.effects[3] = [this.garden];
  }
  buildGenerator() {
    const ground = this.world.heightAt(0, -7);
    this.generator = new THREE.Group();
    this.root.add(this.generator);
    for (const x of [-1.1, 1.1]) {
      this.box("rock", x, ground + 0.7, -7, 0.65, 1.4, 0.65);
      this.box("darkrock", x, ground + 1.5, -7, 0.9, 0.2, 0.9);
      this.box("glow", x, ground + 1.9, -7, 0.4, 0.6, 0.4, this.generator);
    }
    this.box("glow", 0, ground + 0.05, -8, 2.4, 0.07, 0.12, this.generator);
    this.box("glow", 0, ground + 0.05, -8.5, 0.12, 0.07, 1, this.generator);
    this.effects[4] = [this.generator];
  }
  apply() {
    const done = this.round.collected;
    this.supplies.forEach(
      (g, i) => (g.visible = !this.round.gathered?.[i] && !done[i]),
    );
    this.effects.forEach((groups, i) =>
      groups.forEach((g) => {
        g.visible = done[i];
        g.position.y = 0;
        g.scale.setScalar(1);
      }),
    );
    this.hearts.forEach((h) => (h.visible = done[2]));
    this.bridgeStatus.visible = !done[1];
    this.world.renderer.shadowMap.needsUpdate = true;
  }
  gather(index) {
    const g = this.supplies[index];
    if (!g) return;
    this.animations.push({ groups: [g], elapsed: 0, gather: true });
  }
  animate(index) {
    this.apply();
    const groups = this.effects[index];
    groups.forEach((g) => {
      g.visible = true;
      g.position.y = index < 2 ? 3 : 0;
      g.scale.y = index < 2 ? 1 : 0.02;
    });
    this.animations.push({ groups, index, elapsed: 0, gather: false });
  }
  update(dt, time) {
    this.animations = this.animations.filter((animation) => {
      animation.elapsed += dt;
      const p = Math.min(
        1,
        animation.elapsed / (animation.gather ? 0.55 : 1.6),
      );
      const ease = 1 - Math.pow(1 - p, 3);
      animation.groups.forEach((g, i) => {
        if (animation.gather) {
          g.scale.setScalar(1 - ease * 0.92);
          g.position.y = ease * 0.8;
        } else if (animation.index < 2) {
          g.position.y = 3 * (1 - ease);
          g.rotation.z = Math.sin(p * Math.PI) * 0.025 * (i + 1);
        } else g.scale.y = Math.max(0.02, ease);
      });
      if (p < 1) {
        this.world.renderer.shadowMap.needsUpdate = true;
        return true;
      }
      animation.groups.forEach((g) => {
        g.position.y = 0;
        g.scale.setScalar(1);
        g.rotation.z = 0;
        if (animation.gather) g.visible = false;
      });
      this.world.renderer.shadowMap.needsUpdate = true;
      return false;
    });
    this.hearts.forEach((h, i) => {
      h.position.y = 3.6 + Math.sin(time * 2 + i) * 0.18;
    });
    if (this.round.collected[2])
      this.world.sheep?.forEach((sheep, i) => {
        sheep.position.y =
          sheep.userData.ground +
          Math.max(0, Math.sin(time * 2 + i * 1.8)) * 0.16;
      });
  }
  bridgeContains(x, z) {
    return x >= 10.5 && x <= 17.5 && z >= 5.8 && z <= 8.2;
  }
  bridgeHeight(x, z) {
    if (!this.bridgeContains(x, z)) return -100;
    const end = this.round.collected[1]
      ? 17.5
      : this.round.collected[0]
        ? 10.5 + (7 * this.plan.laid) / Math.max(1, this.plan.total)
        : 10.5;
    return x < end ? 2.12 : -100;
  }
  blocksMovement(x, z) {
    return this.bridgeContains(x, z) && this.bridgeHeight(x, z) < 0;
  }
  isProtected(x, z) {
    return (
      this.bridgeContains(x, z) ||
      (Math.abs(x + 8) < 2.3 && Math.abs(z + 11.5) < 2.2) ||
      (Math.abs(x - 7) < 2 && Math.abs(z + 1.8) < 1)
    );
  }
  revealCamera(index) {
    return [
      { position: [8, 8, 1], target: [14, 0.5, 7] },
      { position: [8, 8, 1], target: [14, 0.5, 7] },
      { position: [11, 9, 3], target: [7, 0.5, -1] },
      { position: [-3, 7, -5], target: [-8, 0.5, -11.5] },
      { position: [6, 6, 0], target: [0, 3.6, -9] },
    ][index];
  }
}
