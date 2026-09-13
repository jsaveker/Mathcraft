import { BiomeWorld } from "./biomes.js";
import { creativeWorld, creativeSites } from "./creative-worlds.js";

export class CreativeScenery extends BiomeWorld {
  constructor(world, id) {
    super(world, "creative");
    this.id = id;
    this.config = creativeWorld(id);
    this.power = 1;
    const theme = this.config.theme;
    if (theme === "meadow") this.village();
    if (theme === "moon") this.moon(true);
    if (theme === "sky") this.harbour();
    if (theme === "sunset") this.temple();
    if (theme === "cavern") {
      this.cavern();
      this.aurora.scale.set(2.5, 1.8, 1);
      this.aurora.position.set(0, 65, -162);
    }
    this.addDestinations();
    this.landscape();
  }
  activate() {
    this.power = 1;
  }
  addDestinations() {
    creativeSites(this.id).forEach(({ name, x, z }, i) => {
      if (i === 0) return;
      const ground = this.world.heightAt(x, z);
      // Mark the perimeter, leaving a 32 x 32 foundation completely open.
      this.sign(name, x, ground + 3, z - 19, 7);
      for (const side of [-1, 1]) {
        this.box("path", x + side * 18, ground + 0.02, z, 0.12, 0.04, 36);
        this.box("path", x, ground + 0.02, z + side * 18, 36, 0.04, 0.12);
        for (const other of [-1, 1])
          this.box(
            "glow",
            x + side * 18,
            ground + 0.45,
            z + other * 18,
            0.5,
            0.9,
            0.5,
          );
      }
    });
  }
  landscape() {
    const w = this.world,
      theme = this.config.theme;
    const awayFromPlots = (x, z) =>
      Math.hypot(x, z) > 45 &&
      creativeSites(this.id).every((s) => Math.hypot(x - s.x, z - s.z) > 32);
    for (let i = 0; i < 60; i++) {
      const angle = i * 2.39996,
        r = 52 + ((i * 19) % 68),
        x = Math.round(Math.cos(angle) * r),
        z = Math.round(Math.sin(angle) * r);
      if (!awayFromPlots(x, z)) continue;
      const h = w.heightAt(x, z);
      if (theme === "meadow") {
        w.tree(x, z, 4 + (i % 4), i % 3, h);
        w.colliders.push({ x, z, w: 1, d: 1, top: h + 7 });
      }
      if (theme === "cavern" && i % 2 === 0) {
        const size = 2 + (i % 3);
        this.crystal(x, h + size * 2, z, size, "glow");
        this.crystal(x + 3, h + size, z + 1, size * 0.5, "water");
        w.colliders.push({ x, z, w: size, d: size, top: h + size * 4 });
      }
      if (theme === "moon" && i % 3 === 0) {
        this.box("rock", x, h + 1, z, 2 + (i % 3), 2, 2);
        this.box("darkrock", x + 2, h + 0.5, z + 1, 1, 1, 1);
        w.colliders.push({ x, z, w: 3, d: 2, top: h + 2 });
      }
      if (theme === "sunset" && i % 4 === 0) {
        this.box("leaf1", x, h + 2, z, 0.7, 4, 0.7);
        this.box("leaf1", x + 1, h + 2.5, z, 2, 0.6, 0.6);
        this.box("leaf1", x + 1.8, h + 3, z, 0.6, 1.6, 0.6);
      }
    }
    if (theme === "moon") {
      // Long, low solar arrays make a recognisable spaceport at the edge of the camp.
      for (const x of [-25, -21, -17])
        for (const z of [-25, -21]) {
          this.box("steel", x, 2, z, 0.25, 1, 0.25);
          this.box("blueglass", x, 2.7, z, 3.5, 0.15, 2.5);
          this.box("gold", x, 2.8, z, 3.5, 0.08, 0.08);
        }
    }
    if (theme === "sunset") {
      for (const [x, z, size] of [
        [-96, -69, 24],
        [80, -81, 19],
        [-110, 0, 15],
      ]) {
        const h = w.heightAt(x, z);
        for (let y = 0; y < size; y++)
          this.box(
            y === size - 1 ? "gold" : "sandstone",
            x,
            h + y + 0.5,
            z,
            (size - y) * 1.4,
            1,
            (size - y) * 1.4,
          );
        w.colliders.push({ x, z, w: size * 1.4, d: size * 1.4, top: h + size });
      }
      const x = -102,
        z = 41,
        h = w.heightAt(x, z);
      this.box("water", x, h + 0.08, z, 11, 0.12, 15);
      for (const [dx, dz] of [
        [-7, -5],
        [7, 3],
        [-6, 8],
      ]) {
        this.box("wood", x + dx, h + 3, z + dz, 0.6, 6, 0.6);
        this.box("leaf1", x + dx, h + 6, z + dz, 6, 0.4, 1);
        this.box("leaf2", x + dx, h + 6.3, z + dz, 1, 0.4, 6);
      }
    }
    if (theme === "sky") {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6,
          x = Math.cos(a) * 174,
          z = Math.sin(a) * 174,
          y = 3 + (i % 4) * 7;
        for (let level = 0; level < 5; level++)
          this.box(
            level === 0 ? "grass1" : "rock",
            x,
            y - level * 2,
            z,
            18 - level * 3,
            2,
            15 - level * 2,
          );
        this.box("white", x, y + 3, z, 22, 2, 18);
        this.box("gold", x, y + 6, z, 0.4, 5, 0.4);
      }
    }
    if (theme === "cavern") {
      for (const [x, z] of [
        [-69, -82],
        [50, -90],
        [-96, -26],
      ]) {
        const h = w.heightAt(x, z);
        this.box("snow", x, h + 0.1, z, 4, 0.2, 4);
      }
    }
  }
}
