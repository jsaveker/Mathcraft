import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  CREATIVE_WORLDS,
  CREATIVE_RADIUS,
  creativeWorld,
  creativeSites,
  creativeHeight,
  createCreativeTerrain,
  isCreativeWorld,
} from "../src/creative-worlds.js";
import { buildTerrainChunks } from "../src/creative-terrain.js";
import {
  newProfile,
  recordBuilding,
  loadFamily,
  persistFamily,
  addProfile,
  validateBlocks,
  BUILD_WORLDS,
} from "../src/profiles.js";
import { BLOCKS, TNT } from "../src/blocks.js";
import { IslandWorld } from "../src/world.js";
import { WORLDS } from "../src/maths.js";

test("five distinct creative destinations stay separate from the five maths worlds", () => {
  assert.equal(CREATIVE_WORLDS.length, 5);
  assert.equal(CREATIVE_WORLDS[0].id, "village");
  assert.equal(new Set(CREATIVE_WORLDS.map((w) => w.id)).size, 5);
  for (const world of CREATIVE_WORLDS) {
    assert.ok(WORLDS.some((w) => w.id === world.theme));
    assert.ok(!WORLDS.some((w) => w.id === world.id));
    assert.ok(BUILD_WORLDS.includes(world.id));
  }
  assert.equal(isCreativeWorld("moon"), false);
  assert.equal(creativeWorld("invalid"), undefined);
});
test("every creative world has over twelve times the old land area and distinct terrain", () => {
  let original = 0;
  for (let x = -37; x <= 37; x++)
    for (let z = -37; z <= 37; z++)
      if (
        Math.hypot(x / 1.04, z) <=
        36 + Math.sin(x * 0.48) * 0.7 + Math.cos(z * 0.6) * 0.7
      )
        original++;
  const landscapes = [];
  for (const w of CREATIVE_WORLDS) {
    const terrain = createCreativeTerrain(w.id);
    assert.ok(terrain.size > original * 12);
    assert.ok(terrain.has("120,0"));
    assert.ok(!terrain.has("129,0"));
    assert.equal(CREATIVE_RADIUS * 2, 256);
    landscapes.push([...terrain.values()].join(","));
  }
  assert.equal(new Set(landscapes).size, 5);
});
test("existing village foundations stay flat at their exact original heights", () => {
  for (let x = -40; x <= 40; x++)
    for (let z = -40; z <= 40; z++)
      if (Math.hypot(x, z) <= 40)
        assert.equal(creativeHeight("village", x, z), 1);
});
for (const w of CREATIVE_WORLDS)
  test(`${w.name} has five reachable sites with flat 36 by 36 foundations`, () => {
    const sites = creativeSites(w.id);
    assert.equal(sites.length, 5);
    for (const p of sites)
      for (let dx = -18; dx <= 18; dx++)
        for (let dz = -18; dz <= 18; dz++)
          assert.equal(creativeHeight(w.id, p.x + dx, p.z + dz), 1);
  });
test("terrain chunks render exposed faces with outward normals instead of buried cube layers", () => {
  const theme = {
    grass: [0xabcdef, 0xabcdef, 0xabcdef, 0xabcdef],
    soil: 0x654321,
  };
  const chunks = buildTerrainChunks(
    new Map([
      ["0,0", 1.5],
      ["1,0", 1.5],
    ]),
    theme,
  );
  const data = [...chunks.values()][0];
  assert.equal(data.positions.length / 3, 8 * 6);
  assert.equal(data.colours.length, data.positions.length);
  assert.equal(data.uv.length, (data.positions.length / 3) * 2);
  const a = new THREE.Vector3().fromArray(data.positions, 0),
    b = new THREE.Vector3().fromArray(data.positions, 3),
    c = new THREE.Vector3().fromArray(data.positions, 6);
  const normal = b.sub(a).cross(c.sub(a)).normalize();
  assert.ok(normal.equals(new THREE.Vector3(0, 1, 0)));
  const large = buildTerrainChunks(
    createCreativeTerrain("creative-moon"),
    theme,
  );
  assert.ok(large.size > 40 && large.size < 100);
  const vertices = [...large.values()].reduce(
    (n, c) => n + c.positions.length / 3,
    0,
  );
  assert.ok(vertices < 400000);
});
test("far-away builds, selected world, original village and separate explorers survive saves", () => {
  let raw;
  const storage = { getItem: () => raw, setItem: (_, value) => (raw = value) };
  const family = loadFamily(storage),
    first = family.profiles[0];
  first.creativeWorld = "creative-moon";
  first.progress.totalCrystals = 60;
  first.hotbar[0] = TNT;
  for (const [i, w] of CREATIVE_WORLDS.entries())
    recordBuilding(first, w.id, [{ x: 112, y: 30, z: 8, type: 30 + i }], 251);
  recordBuilding(first, "moon", [{ x: 2, y: 2, z: 5, type: 1 }], 251);
  const second = addProfile(family, "Second builder", "dragon");
  second.creativeWorld = "creative-sky";
  recordBuilding(
    second,
    "creative-moon",
    [{ x: -110, y: 2, z: 0, type: 1 }],
    36,
  );
  persistFamily(family, storage);
  const loaded = loadFamily(storage);
  assert.equal(loaded.profiles[0].creativeWorld, "creative-moon");
  assert.equal(loaded.profiles[0].progress.totalCrystals, 60);
  assert.equal(loaded.profiles[0].inventory, 251);
  assert.equal(loaded.profiles[0].hotbar[0], TNT);
  for (const w of CREATIVE_WORLDS)
    assert.deepEqual(loaded.profiles[0].builds[w.id], first.builds[w.id]);
  assert.deepEqual(loaded.profiles[0].builds.moon, first.builds.moon);
  assert.deepEqual(
    loaded.profiles[1].builds["creative-moon"],
    second.builds["creative-moon"],
  );
  assert.deepEqual(loaded.profiles[1].builds.village, []);
});
test("new creative save bounds apply to each world without expanding adventure permissions", () => {
  const blocks = [
    { x: 120, y: 80, z: 0, type: TNT },
    { x: -128, y: 2, z: 0, type: 1 },
  ];
  for (const w of CREATIVE_WORLDS)
    assert.equal(validateBlocks(blocks, w.id).length, 2);
  assert.equal(validateBlocks(blocks, "moon").length, 0);
  assert.equal(
    validateBlocks([{ x: 129, y: 2, z: 0, type: 1 }], "village").length,
    0,
  );
});
test("travel reaches distant sites safely above buildings and resets pending construction input", () => {
  const w = Object.assign(Object.create(IslandWorld.prototype), {
    isVillage: true,
    themeId: "creative-moon",
    player: new THREE.Vector3(),
    heightAt: () => 1.5,
    voxels: { nearby: () => [{ position: new THREE.Vector3(72, 30, 0) }] },
    keys: new Set(["KeyW"]),
    touchMove: { x: 1, z: 0 },
    builder: { anchor: { x: 2 } },
    heldBuild: "place",
    callbacks: {},
  });
  w.travelCreative(1);
  assert.deepEqual(w.player.toArray(), [72, 32.2, 0]);
  assert.equal(w.keys.size, 0);
  assert.equal(w.builder.anchor, null);
  assert.equal(w.heldBuild, null);
  assert.deepEqual(w.touchMove, { x: 0, z: 0 });
  const before = w.player.clone();
  w.travelCreative(99);
  assert.ok(w.player.equals(before));
});
test("TNT and undo on a distant moon build save only that creative world", () => {
  const p = newProfile(),
    w = Object.assign(Object.create(IslandWorld.prototype), {
      isVillage: true,
      themeId: "creative-moon",
      player: new THREE.Vector3(90, 3.2, 0),
      blocks: new Map(),
      root: new THREE.Group(),
      geo: new THREE.BoxGeometry(),
      mats: Object.fromEntries(
        BLOCKS.map((b) => [b.material, new THREE.MeshBasicMaterial()]),
      ),
      renderer: { shadowMap: {} },
      callbacks: {
        building: (id, s) => recordBuilding(p, id, s.blocks, s.inventory),
      },
      heightAt: () => 1.5,
      burst: () => {},
    });
  p.builds.village = [{ x: 0, y: 2, z: 0, type: 0 }];
  w.restoreBuilding({
    blocks: [
      { x: 110, y: 2, z: 0, type: TNT },
      { x: 112, y: 2, z: 0, type: 5 },
    ],
    inventory: 251,
  });
  w.builder.ignite(w.blocks.get("110,2,0"), 0);
  w.builder.update(0.02);
  assert.equal(p.builds["creative-moon"].length, 0);
  assert.equal(p.builds.village.length, 1);
  assert.equal(p.inventory, 251);
  w.builder.undo();
  assert.equal(p.builds["creative-moon"].length, 2);
  assert.equal(p.builds.village.length, 1);
});
