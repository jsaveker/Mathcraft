import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  loadFamily,
  activeProfile,
  addProfile,
  persistFamily,
  FAMILY_KEY,
  recordBuilding,
  validateBlocks,
} from "../src/profiles.js";
import { DEFAULT_SAVE, createRound } from "../src/maths.js";
import { IslandWorld } from "../src/world.js";
import { terrainLevel, BiomeWorld } from "../src/biomes.js";
import { escapeHtml } from "../src/explorer-art.js";
function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
}

test("legacy maths progress migrates once without modifying the original save", () => {
  const old = structuredClone(DEFAULT_SAVE);
  old.range = 20;
  old.completed = ["meadow"];
  old.totalCrystals = 7;
  const round = createRound(old, "cavern");
  round.collected[0] = true;
  const raw = JSON.stringify(old),
    s = storage({ "mathcraft-save": raw });
  const f = loadFamily(s),
    p = activeProfile(f);
  assert.deepEqual(p.progress, old);
  assert.equal(p.inventory, 57);
  assert.equal(persistFamily(f, s), "saved");
  assert.equal(s.getItem("mathcraft-save"), raw);
  old.totalCrystals = 99;
  s.setItem("mathcraft-save", JSON.stringify(old));
  assert.equal(activeProfile(loadFamily(s)).progress.totalCrystals, 7);
});
test("profiles keep settings, creations, inventory, and discoveries independent across reloads", () => {
  const s = storage(),
    f = loadFamily(s),
    a = activeProfile(f);
  a.name = "Alice";
  a.progress.range = 10;
  a.discoveries.push("meadow");
  recordBuilding(a, "village", [{ x: 2, y: 2, z: 4, type: 1 }], 35);
  const b = addProfile(f, "Ben", "dragon");
  b.progress.range = 100;
  recordBuilding(b, "cavern", [{ x: 5, y: 3, z: 7, type: 2 }], 32);
  persistFamily(f, s);
  const again = loadFamily(s);
  assert.equal(activeProfile(again).name, "Ben");
  assert.deepEqual(again.profiles[0].builds.village, a.builds.village);
  assert.deepEqual(again.profiles[1].builds.village, []);
  assert.equal(again.profiles[0].progress.range, 10);
  assert.equal(activeProfile(again).inventory, 32);
  assert.deepEqual(activeProfile(again).discoveries, []);
});
test("changing islands and replaying questions retains all builds and inventory", () => {
  const f = loadFamily(storage()),
    p = activeProfile(f);
  recordBuilding(p, "meadow", [{ x: 2, y: 2, z: 3, type: 0 }], 35);
  recordBuilding(p, "village", [{ x: -4, y: 2, z: 6, type: 1 }], 34);
  const r = createRound(p.progress, "meadow");
  r.finished = true;
  createRound(p.progress, "meadow");
  assert.equal(p.inventory, 34);
  assert.equal(p.builds.meadow.length, 1);
  assert.equal(p.builds.village.length, 1);
});
test("stale tabs cannot overwrite a newer family save", () => {
  const s = storage(),
    a = loadFamily(s);
  persistFamily(a, s);
  const b = loadFamily(s);
  activeProfile(a).name = "New name";
  persistFamily(a, s);
  activeProfile(b).name = "Old tab";
  assert.equal(persistFamily(b, s), "conflict");
  assert.equal(activeProfile(loadFamily(s)).name, "New name");
});
test("storage failure is reported without claiming a saved revision", () => {
  const f = loadFamily(storage());
  const blocked = {
    getItem: () => null,
    setItem: () => {
      throw Error("quota");
    },
  };
  assert.equal(persistFamily(f, blocked), "unavailable");
  assert.equal(f.revision, 0);
});
test("invalid saved blocks and duplicate coordinates cannot enter a restored scene", () => {
  const good = { x: 1, y: 2, z: 3, type: 1 };
  assert.deepEqual(
    validateBlocks([
      good,
      good,
      { ...good, y: NaN },
      { ...good, x: Infinity },
      { ...good, type: 7 },
      { ...good, y: 900 },
      null,
    ]),
    [good],
  );
  assert.equal(
    validateBlocks(
      Array.from({ length: 800 }, (_, i) => ({
        x: (i % 40) - 20,
        y: 2 + Math.floor(i / 40),
        z: 0,
        type: 0,
      })),
    ).length,
    600,
  );
});
test("malformed family profiles are validated and their stored data cannot inject HTML", () => {
  const s = storage({
    [FAMILY_KEY]: JSON.stringify({
      version: 2,
      activeId: "missing",
      profiles: [
        null,
        {
          id: "one",
          name: "<img src=x onerror=alert(1)>",
          avatar: "bad",
          inventory: -1,
          builds: { village: [{ x: 0, y: 2, z: 0, type: 1 }] },
          progress: { version: 1, range: 700 },
          discoveries: ["bad", "meadow", "meadow"],
        },
        { id: "one" },
      ],
    }),
  });
  const f = loadFamily(s),
    p = activeProfile(f);
  assert.equal(f.profiles.length, 1);
  assert.equal(p.avatar, "fox");
  assert.equal(p.progress.range, 100);
  assert.equal(p.inventory, 36);
  assert.deepEqual(p.discoveries, ["meadow"]);
  assert.ok(!escapeHtml(p.name).includes("<"));
  assert.equal(p.name.length, 20);
});
test("families support six separate explorers and refuse a seventh", () => {
  const f = loadFamily(storage());
  for (let i = 0; i < 5; i++) assert.ok(addProfile(f, "Child " + i, "panda"));
  assert.equal(addProfile(f, "Seventh", "fox"), null);
  assert.equal(f.profiles.length, 6);
});
test("actual block placement, restoration, and mining conserve the saved inventory", () => {
  const p = activeProfile(loadFamily(storage()));
  const w = Object.assign(Object.create(IslandWorld.prototype), {
    mode: "play",
    isVillage: true,
    themeId: "village",
    buildMode: true,
    blockStock: 36,
    selectedBlock: 1,
    player: new THREE.Vector3(0, 3.2, 5),
    blocks: new Map(),
    root: new THREE.Group(),
    geo: new THREE.BoxGeometry(),
    mats: {
      grass1: new THREE.MeshBasicMaterial(),
      plank: new THREE.MeshBasicMaterial(),
      glow: new THREE.MeshBasicMaterial(),
    },
    renderer: { shadowMap: {} },
    callbacks: {
      building: (id, s) => recordBuilding(p, id, s.blocks, s.inventory),
    },
    heightAt: () => 1.5,
    burst: () => {},
    blockTarget: () => ({ terrain: { point: new THREE.Vector3(2, 1.5, 2) } }),
  });
  w.placeBlock();
  assert.equal(p.inventory, 35);
  assert.deepEqual(p.builds.village, [{ x: 2, y: 2, z: 2, type: 1 }]);
  w.restoreBuilding({ blocks: p.builds.village, inventory: p.inventory });
  assert.equal(w.blocks.size, 1);
  w.blockTarget = () => ({ placed: { object: [...w.blocks.values()][0] } });
  w.mineBlock();
  assert.equal(p.inventory, 36);
  assert.deepEqual(p.builds.village, []);
});
test("world geography differs without moving the bridge and core quest floor", () => {
  assert.ok(
    terrainLevel("cavern", -8, -20, 0) > terrainLevel("meadow", -8, -20, 0),
  );
  assert.notEqual(
    terrainLevel("sunset", -20, 4, 0),
    terrainLevel("meadow", -20, 4, 0),
  );
  for (const id of ["meadow", "cavern", "sunset"])
    assert.equal(terrainLevel(id, 14, 7, 1), 1);
  assert.equal(terrainLevel("village", 18, 9, -1), 1);
});
test("temple gate opens smoothly to a stable quarter turn and pauses with zero delta", () => {
  const b = Object.assign(Object.create(BiomeWorld.prototype), {
    time: 0,
    power: 1,
    gate: new THREE.Group(),
    parts: [],
  });
  for (let i = 0; i < 180; i++) b.update(1 / 60);
  assert.ok(Math.abs(b.gate.rotation.y - Math.PI / 2) < 0.01);
  const angle = b.gate.rotation.y;
  b.update(0);
  assert.equal(b.gate.rotation.y, angle);
});

test("landmark building rewards can only be claimed once per explorer", async () => {
  const { claimDiscovery } = await import("../src/profiles.js");
  const p = activeProfile(loadFamily(storage()));
  assert.equal(claimDiscovery(p, "cavern"), true);
  assert.equal(p.inventory, 48);
  assert.equal(claimDiscovery(p, "cavern"), false);
  assert.equal(claimDiscovery(p, "not-an-island"), false);
  assert.equal(p.inventory, 48);
});
test("landmark stairs provide a solid floor only within their actual footprints", () => {
  const b = Object.assign(Object.create(BiomeWorld.prototype), {
    surfaces: [
      { x: 0, z: 0, w: 4, d: 4, top: 2 },
      { x: 0, z: 0, w: 2, d: 2, top: 3 },
    ],
  });
  assert.equal(b.heightAt(0, 0), 3);
  assert.equal(b.heightAt(1.8, 0), 2);
  assert.equal(b.heightAt(5, 0), -100);
});

test("the sun gate blocks its doorway until the discovery is complete", () => {
  const b = Object.assign(Object.create(BiomeWorld.prototype), {
    id: "sunset",
    power: 0,
  });
  assert.equal(b.blocksMovement(-13, 3.8), true);
  assert.equal(b.blocksMovement(-13, 8), false);
  b.activate(true);
  assert.equal(b.blocksMovement(-13, 3.8), false);
});
