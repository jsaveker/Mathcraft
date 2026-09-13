import * as THREE from "three";
import { QuestWorld } from "./quest-world.js";
import { questsFor, describeQuest } from "./quests.js";

const DEMO = {
  layoutVersion: 2,
  questions: Array.from({ length: 5 }, () => ({
    a: 8,
    b: 4,
    operator: "+",
    answer: 12,
  })),
  collected: Array(5).fill(false),
  gathered: Array(5).fill(false),
};
export class AdventureWorld extends QuestWorld {
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
    this.round = round.questions ? round : DEMO;
    this.quests = questsFor(this.world.themeId);
    this.root = new THREE.Group();
    this.world.root.add(this.root);
    this.supplies = [];
    this.models = [];
    this.clock = 0;
    this.quests.forEach((quest, i) => this.buildSite(quest, i));
    this.apply();
  }
  buildSite(quest, index) {
    const q = this.round.questions[index],
      x = quest.x,
      z = quest.z - 2.6;
    const y = this.world.heightAt(x, z);
    const root = new THREE.Group();
    root.position.set(x, y, z);
    this.root.add(root);
    const group = (parent = root) => {
      const g = new THREE.Group();
      parent.add(g);
      return g;
    };
    const box = (mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = root) =>
      this.box(mat, x, y, z, sx, sy, sz, parent);
    box("darkrock", 0, 0.12, 0, 4.8, 0.24, 4.1);
    for (const sx of [-2.1, 2.1]) box("gold", sx, 0.22, 0, 0.13, 0.15, 3.7);
    const model = {
      root,
      progress: this.round.collected[index] ? 1 : 0,
      update: () => {},
      quest,
    };
    const lights = group();
    for (const sx of [-1.8, 1.8])
      box("glow", sx, 0.35, 1.7, 0.25, 0.16, 0.25, lights);
    // All machinery is built in local coordinates; it remains visible before a job
    // and changes physically afterwards, instead of swapping a decorative prop.
    switch (quest.model) {
      case "ice": {
        for (const sx of [-1.8, 1.8]) box("rock", sx, 2, -0.5, 0.8, 4, 1.5);
        box("rock", 0, 4, -0.5, 4.4, 0.8, 1.6);
        box("dark", 0, 1.8, -1.25, 3.2, 3.6, 0.15);
        const ice = group();
        const cols = Math.ceil(Math.sqrt(q.answer)),
          rows = Math.ceil(q.answer / cols);
        for (let i = 0; i < q.answer; i++)
          box(
            i < q.a ? "water" : "white",
            -1.6 + (((i % cols) + 0.5) * 3.2) / cols,
            0.3 + ((Math.floor(i / cols) + 0.5) * 3.2) / rows,
            -0.3,
            3.05 / cols,
            3.05 / rows,
            0.7,
            ice,
          );
        model.counted = [ice];
        const ore = group();
        box("glow", -0.7, 1.6, -0.9, 0.5, 1.5, 0.5, ore);
        box("glow", 0.65, 1.1, -0.9, 0.65, 0.8, 0.65, ore);
        model.update = (p) => {
          ice.scale.y = Math.max(0.001, 1 - p);
          ice.visible = p < 0.99;
          ore.visible = p > 0.5;
        };
        break;
      }
      case "rail": {
        for (const sx of [-1.2, 1.2]) box("gold", sx, 0.4, 0, 0.14, 0.16, 3.8);
        for (let i = 0; i < 9; i++)
          box("plank", 0, 0.28, -1.6 + i * 0.4, 2.8, 0.12, 0.16);
        const cart = group();
        box("rock", 0, 0.95, 0, 1.8, 1, 1.1, cart);
        box("dark", 0, 1.48, 0, 1.5, 0.12, 0.8, cart);
        for (const sx of [-0.85, 0.85])
          for (const sz of [-0.35, 0.35])
            box("dark", sx, 0.48, sz, 0.35, 0.45, 0.35, cart);
        const cargo = group(cart);
        for (let i = 0; i < q.answer; i++)
          box(
            "glow",
            -0.6 + (i % 5) * 0.3,
            1.68 + Math.floor(i / 10) * 0.14,
            -0.2 + (Math.floor(i / 5) % 2) * 0.4,
            0.2,
            0.25,
            0.2,
            cargo,
          );
        model.counted = [cargo];
        model.update = (p, t) => {
          cargo.visible = p > 0.2;
          cart.position.z = p * Math.sin(t * 0.7) * 1.1;
        };
        break;
      }
      case "lift": {
        for (const sx of [-1.7, 1.7])
          box("darkrock", sx, 3.7, 0, 0.35, 7.4, 0.35);
        box("gold", 0, 7.3, 0, 4, 0.35, 0.6);
        box("plank", 0, 6.7, -1.3, 4, 0.3, 2);
        const lift = group();
        box("plank", 0, 0.6, 0.3, 3, 0.25, 2.1, lift);
        box("coral", 0, 1.3, -0.2, 1.1, 1.1, 1.1, lift);
        for (const sx of [-1.3, 1.3])
          box("gold", sx, 1.15, 0.3, 0.12, 1, 0.12, lift);
        model.update = (p) => {
          lift.position.y = p * 4.6;
        };
        break;
      }
      case "prism": {
        const crystals = group(),
          beam = group();
        for (const sx of [-1.4, 0, 1.4]) {
          const c = box("glow", sx, 1.9, 0, 0.65, 2.7, 0.65, crystals);
          c.rotation.z = 0.2 * sx;
        }
        box("glow", 0, 3.4, 0, 5.5, 0.12, 0.12, beam);
        box("water", 0, 3.4, 0, 5.5, 0.3, 0.3, beam);
        model.update = (p, t) => {
          beam.visible = p > 0.4;
          crystals.rotation.y = p * Math.sin(t * 0.25) * 0.2;
          beam.rotation.z = Math.sin(t * 0.5) * 0.07 * p;
        };
        break;
      }
      case "beacon": {
        const lamps = group();
        for (const sx of [-1.65, 0, 1.65]) {
          box("rock", sx, 1.6, 0, 0.6, 3.2, 0.6);
          box("gold", sx, 3.3, 0, 0.95, 0.2, 0.95);
          box("glow", sx, 4.1, 0, 0.55, 1.4, 0.55, lamps);
          box("water", sx, 7, 0, 0.17, 5, 0.17, lamps);
        }
        model.update = (p, t) => {
          lamps.visible = p > 0.2;
          lamps.scale.y = 0.95 + Math.sin(t * 2) * 0.05;
        };
        break;
      }
      case "fossil": {
        box("soil", 0, 0.35, 0, 4.4, 0.45, 3.5);
        const bones = group();
        box("white", 0, 0.65, 0, 3.2, 0.23, 0.25, bones);
        for (let i = 0; i < 5; i++) {
          for (const sz of [-0.6, 0.6]) {
            const rib = box(
              "white",
              -1 + i * 0.48,
              0.72,
              sz,
              0.14,
              0.27,
              1.3,
              bones,
            );
            rib.rotation.x = sz * 0.35;
          }
        }
        box("white", 1.5, 0.84, 0, 1.1, 0.7, 0.85, bones);
        box("dark", 1.86, 1.03, 0.35, 0.22, 0.18, 0.08, bones);
        const sand = group();
        for (let a = -2; a <= 2; a++)
          for (let b = -1; b <= 1; b++)
            box(
              "grass0",
              a * 0.75,
              0.95 + ((a + b) % 2) * 0.12,
              b * 0.85,
              0.8,
              1.2,
              0.85,
              sand,
            );
        model.update = (p) => {
          sand.position.y = -p * 1.3;
          sand.visible = p < 0.98;
          bones.visible = p > 0.25;
        };
        break;
      }
      case "pump": {
        for (const sz of [-1.5, 1.5]) box("rock", 0, 0.7, sz, 4, 0.9, 0.2);
        for (const sx of [-2, 2]) box("rock", sx, 0.7, 0, 0.2, 0.9, 3.2);
        const water = box("water", 0, 0.7, 0, 3.7, 0.7, 2.8);
        box("wood", 0, 2, -1.6, 0.4, 3, 0.4);
        box("gold", 0, 3.3, -1.6, 2.3, 0.25, 0.4);
        const wheel = group();
        wheel.position.set(0, 2.4, -1.2);
        for (let i = 0; i < 6; i++) {
          const b = box("plank", 0, 0, 0, 2, 0.18, 0.16, wheel);
          b.rotation.z = (i * Math.PI) / 3;
        }
        model.update = (p, t) => {
          water.scale.y = Math.max(0.01, p);
          water.visible = p > 0;
          wheel.rotation.z = p * t;
        };
        break;
      }
      case "mosaic": {
        box("rock", 0, 2.4, -0.5, 4.3, 4.6, 0.6);
        const tiles = group();
        const size = Math.min(0.65, 2.7 / Math.sqrt(q.answer));
        for (let i = 0; i < q.answer; i++) {
          const angle = i * 2.39996,
            radius = Math.sqrt((i + 0.5) / q.answer) * 1.45;
          box(
            "gold",
            Math.cos(angle) * radius,
            2.5 + Math.sin(angle) * radius,
            -0.12,
            size,
            size,
            0.14,
            tiles,
          );
        }
        model.counted = [tiles];
        model.update = (p) => {
          tiles.scale.y = Math.max(0.001, p);
          tiles.visible = p > 0.01;
        };
        break;
      }
      case "scale": {
        for (const sx of [-1.65, 1.65]) box("rock", sx, 2.3, 0, 0.5, 4.6, 0.7);
        box("gold", 0, 4.6, 0, 4, 0.25, 0.7);
        const door = group();
        box("rock", 0, 1.8, 0, 2.8, 3.3, 0.6, door);
        box("gold", 0, 1.8, 0.32, 0.6, 0.6, 0.08, door);
        const weight = group();
        box("darkrock", 2.05, 3.8, -0.5, 0.6, 0.9, 0.6, weight);
        box("gold", 2.05, 4.1, -0.5, 0.07, 1, 0.07);
        box("gold", 0, 0.65, -1.2, 1.5, 0.8, 0.7);
        model.update = (p) => {
          door.position.y = p * 3.2;
          weight.position.y = -p * 2.6;
        };
        break;
      }
      case "sail": {
        const ship = group();
        box("wood", 0, 0.85, 0, 3.8, 0.9, 1.8, ship);
        box("plank", 0, 1.4, 0, 3.2, 0.22, 1.6, ship);
        box("wood", 0, 3.2, 0, 0.14, 3.8, 0.14, ship);
        const sail = box("coral", 0.85, 3.5, 0, 1.6, 2.5, 0.12, ship);
        for (const sx of [-1, 1]) box("gold", sx, 0.4, 0, 0.3, 0.2, 2.7, ship);
        model.update = (p, t) => {
          sail.scale.x = Math.max(0.06, p);
          ship.position.x = p * Math.sin(t * 0.3) * 1.5;
          ship.rotation.y = p * Math.sin(t * 0.3) * 0.2;
        };
        break;
      }
      case "wind": {
        const blades = [];
        for (const sx of [-1.4, 1.4]) {
          box("white", sx, 3, 0, 0.45, 6, 0.45);
          const rotor = group();
          rotor.position.set(sx, 5.5, 0.35);
          for (let i = 0; i < 4; i++) {
            const b = box("plank", 0, 0, 0, 0.3, 3.2, 0.15, rotor);
            b.rotation.z = (i * Math.PI) / 2;
          }
          box("gold", 0, 0, 0.1, 0.5, 0.5, 0.25, rotor);
          blades.push(rotor);
        }
        model.update = (p, t) =>
          blades.forEach((r, i) => (r.rotation.z = p * t * (i ? -0.6 : 0.6)));
        break;
      }
      case "balloon": {
        const balloon = group();
        box("wood", 0, 1, 0, 1.5, 0.8, 1.2, balloon);
        for (const sx of [-0.6, 0.6])
          box("gold", sx, 2.25, 0, 0.05, 2, 0.05, balloon);
        box("coral", 0, 4.4, 0, 3.4, 2.8, 2.6, balloon);
        box("white", 0, 5.9, 0, 2.2, 0.5, 1.8, balloon);
        box("gold", 0, 4.3, 0, 0.5, 3, 2.7, balloon);
        model.update = (p, t) => {
          balloon.position.y = p * (2.5 + Math.sin(t * 0.7) * 0.3);
          balloon.rotation.z = p * Math.sin(t * 0.5) * 0.06;
        };
        break;
      }
      case "glider": {
        const plane = group();
        box("plank", 0, 1.5, 0, 0.55, 0.5, 2.5, plane);
        box("coral", 0, 1.5, 0.1, 4, 0.16, 0.8, plane);
        box("white", 0, 1.65, 1.1, 1.5, 0.15, 0.5, plane);
        box("gold", 0, 1.75, 0, 0.5, 0.5, 0.5, plane);
        model.update = (p, t) => {
          plane.position.set(
            p * Math.sin(t * 0.45) * 2,
            p * (1.7 + Math.cos(t * 0.45) * 0.2),
            p * (Math.cos(t * 0.45) - 1),
          );
          plane.rotation.y = p * t * 0.45;
        };
        break;
      }
      case "chimes": {
        box("wood", 0, 5, 0, 4.6, 0.3, 0.4);
        for (const sx of [-2.2, 2.2]) box("wood", sx, 2.5, 0, 0.25, 5, 0.25);
        const chimes = [];
        ["coral", "flower", "gold", "leaf1", "water", "glow", "white"].forEach(
          (mat, i) => {
            const g = group();
            g.position.set(-1.8 + i * 0.6, 4.8, 0);
            box("gold", 0, -0.3, 0, 0.04, 0.6, 0.04, g);
            box(mat, 0, -1.4 - i * 0.1, 0, 0.35, 1.5 + i * 0.2, 0.35, g);
            chimes.push(g);
          },
        );
        model.update = (p, t) =>
          chimes.forEach(
            (g, i) => (g.rotation.x = p * Math.sin(t * 1.8 + i) * 0.25),
          );
        break;
      }
      case "airship": {
        const ship = group();
        box("wood", 0, 1.1, 0, 1.8, 0.8, 3, ship);
        box("white", 0, 3.6, 0, 3.2, 2.4, 5.4, ship);
        box("water", 0, 3.6, 0, 3.25, 0.5, 5.45, ship);
        box("white", 0, 4.95, 0, 2.5, 0.4, 4.6, ship);
        box("white", 0, 2.25, 0, 2.5, 0.4, 4.6, ship);
        for (const end of [-1, 1]) {
          box("white", 0, 3.6, end * 3.05, 2.6, 1.9, 0.8, ship);
          box("gold", 0, 3.6, end * 3.65, 1.4, 1.1, 0.5, ship);
        }
        box("water", 0, 4.6, 3.1, 0.2, 1.6, 1.4, ship);
        box("water", 0, 3.6, 3.1, 4.3, 0.16, 1.1, ship);
        for (const sx of [-1, 1]) box("gold", sx, 2, 0, 0.08, 1.8, 0.08, ship);
        model.update = (p, t) => {
          ship.position.y = p * (2 + Math.sin(t * 0.4) * 0.25);
          ship.position.x = p * Math.sin(t * 0.2) * 1.2;
        };
        break;
      }
      case "solar": {
        box("white", 0, 1.2, 0, 0.7, 2, 0.7);
        const wings = [];
        for (const side of [-1, 1]) {
          const g = group();
          g.position.set(side * 0.4, 1.9, 0);
          box("dark", side * 1, 0, 0, 2, 0.12, 3, g);
          const count =
              side === -1 ? Math.ceil(q.answer / 2) : Math.floor(q.answer / 2),
            rows = Math.max(1, Math.ceil(count / 3));
          const cells = group(g);
          for (let i = 0; i < count; i++)
            box(
              "water",
              side * (0.35 + (i % 3) * 0.62),
              0.08,
              -1.5 + ((Math.floor(i / 3) + 0.5) * 3) / rows,
              0.53,
              0.06,
              2.7 / rows,
              cells,
            );
          (model.counted ??= []).push(cells);
          wings.push(g);
        }
        model.update = (p) =>
          wings.forEach(
            (g, i) => (g.rotation.z = ((i ? 1 : -1) * (1 - p) * Math.PI) / 2),
          );
        break;
      }
      case "rover": {
        const rover = group();
        box("white", 0, 1.1, 0, 1.7, 0.8, 2.2, rover);
        box("gold", 0, 1.75, 0, 1.2, 0.5, 1.2, rover);
        box("dark", 0, 2.1, -0.7, 1, 0.2, 0.3, rover);
        box("white", 0.6, 2.4, 0.5, 0.07, 1.5, 0.07, rover);
        for (const sx of [-1, 1])
          for (const sz of [-0.8, 0, 0.8])
            box("darkrock", sx, 0.55, sz, 0.4, 0.75, 0.6, rover);
        model.update = (p, t) => {
          rover.position.x = p * Math.sin(t * 0.4) * 1.4;
          rover.rotation.y = p * Math.sin(t * 0.4) * 0.35;
        };
        break;
      }
      case "habitat": {
        const dome = group();
        box("white", 0, 1.5, 0, 3.6, 2.6, 3, dome);
        box("white", 0, 3.1, 0, 2.8, 0.6, 2.5, dome);
        box("glow", 0, 2, 1.52, 2.8, 0.7, 0.08, dome);
        box("dark", 0, 0.95, 1.65, 1.2, 1.8, 0.35, dome);
        box("gold", 0, 1.8, 1.86, 0.8, 0.16, 0.08, dome);
        model.update = (p) => (dome.scale.y = 0.1 + 0.9 * p);
        break;
      }
      case "dish": {
        box("white", 0, 1.6, 0, 0.65, 3.2, 0.65);
        const dish = group();
        dish.position.y = 3.5;
        dish.rotation.x = -0.4;
        box("white", 0, 0, 0, 3.5, 2.7, 0.25, dish);
        box("water", 0, 0, 0.16, 2.7, 1.9, 0.12, dish);
        box("gold", 0, 0, 1, 0.1, 0.1, 1.8, dish);
        const signal = group(dish);
        for (let i = 0; i < 3; i++)
          box(
            "glow",
            0,
            0,
            2 + i * 0.8,
            0.15 + i * 0.13,
            0.15 + i * 0.13,
            0.1,
            signal,
          );
        model.update = (p, t) => {
          dish.rotation.y = p * (0.6 + Math.sin(t * 0.25) * 0.15);
          signal.visible = p > 0.2;
        };
        break;
      }
      case "launch": {
        const rocket = group();
        box("white", 0, 2.7, 0, 1.65, 4.5, 1.65, rocket);
        box("coral", 0, 5.1, 0, 1.1, 0.7, 1.1, rocket);
        box("gold", 0, 5.65, 0, 0.45, 0.5, 0.45, rocket);
        box("dark", 0, 3.5, 0.84, 0.8, 0.8, 0.08, rocket);
        for (const sx of [-1.1, 1.1])
          box("coral", sx, 1, 0, 0.6, 1.8, 1.4, rocket);
        const flame = box("glow", 0, -0.3, 0, 0.8, 1.7, 0.8, rocket);
        model.update = (p, t) => {
          rocket.position.y = p * 7;
          flame.visible = p > 0.05;
          flame.scale.y = 0.8 + Math.sin(t * 12) * 0.2;
        };
        break;
      }
    }
    model.lights = lights;
    const label = this.label(
      `${q.answer} ${quest.resource}`,
      x,
      y + 1,
      quest.z - 0.65,
      2.8,
    );
    model.result = label;
    this.models.push(model);
    const supplies = new THREE.Group();
    this.root.add(supplies);
    this.supplies.push(supplies);
    const desc = describeQuest(index, q, this.world.themeId);
    const ground = this.world.heightAt(quest.x, quest.z);
    for (const [side, amount] of [q.a, q.b].entries()) {
      const sx = x + (side ? 0.9 : -0.9);
      this.box("darkrock", sx, ground + 0.5, quest.z, 1.5, 1, 0.7, supplies);
      this.box(
        "glow",
        sx,
        ground + 0.65,
        quest.z + 0.36,
        1.1,
        0.3,
        0.04,
        supplies,
      );
      supplies.add(
        this.label(
          `${desc.labels[side]}: ${amount}`,
          sx,
          ground + 1.4,
          quest.z,
          1.85,
        ),
      );
    }
  }
  apply() {
    this.supplies.forEach(
      (g, i) =>
        (g.visible = !this.round.gathered?.[i] && !this.round.collected[i]),
    );
    this.models.forEach((m, i) => {
      m.result.visible = this.round.collected[i];
      m.lights.visible = this.round.collected[i];
      m.update(m.progress, this.clock);
    });
    this.world.renderer.shadowMap.needsUpdate = true;
  }
  gather(index) {
    this.supplies[index].visible = false;
  }
  animate(index) {
    this.revealIndex = index;
    this.models[index].progress = 0;
    this.apply();
  }
  update(dt) {
    this.clock += dt;
    this.shadowTick = (this.shadowTick || 0) + dt;
    this.models.forEach((m, i) => {
      const target = this.round.collected[i] ? 1 : 0;
      m.progress = Math.min(target, m.progress + dt * 0.55);
      m.update(m.progress, this.clock);
    });
    if (
      this.world.mode === "reward" &&
      this.quests[this.revealIndex]?.model === "launch"
    ) {
      const q = this.quests[this.revealIndex],
        y = this.world.heightAt(q.x, q.z),
        p = this.models[this.revealIndex].progress;
      this.world.rewardView.position[1] = y + 8 + p * 7;
      this.world.rewardView.target[1] = y + 1 + p * 7;
    }
    if (this.shadowTick > 0.16 && this.round.collected.some(Boolean)) {
      this.world.renderer.shadowMap.needsUpdate = true;
      this.shadowTick = 0;
    }
  }
  bridgeHeight() {
    return -100;
  }
  isProtected(x, z) {
    return this.quests.some(
      (q) => Math.abs(x - q.x) < 3 && Math.abs(z - (q.z - 2.6)) < 2.4,
    );
  }
  blocksMovement(x, z) {
    return this.quests.some(
      (q) => Math.abs(x - q.x) < 2.5 && Math.abs(z - (q.z - 2.6)) < 1.95,
    );
  }
  revealCamera(index) {
    const q = this.quests[index],
      tall = [
        "launch",
        "airship",
        "balloon",
        "beacon",
        "lift",
        "wind",
      ].includes(q.model);
    const y = this.world.heightAt(q.x, q.z);
    const west = ["airship", "launch", "wind", "dish"].includes(q.model);
    return {
      position: [
        q.x + (west ? -8 : 8),
        y + (tall ? 8 : 6),
        q.z + (q.model === "beacon" ? 4 : 9),
      ],
      target: [q.x, y + (q.model === "launch" ? 1 : tall ? 4 : 0.4), q.z - 2.6],
    };
  }
}
