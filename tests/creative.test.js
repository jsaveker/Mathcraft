import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  BLOCKS,
  TNT,
  DEFAULT_HOTBAR,
  CREATIVE_LIMIT,
  brushBlocks,
  BLUEPRINTS,
  blueprintBlocks,
  blockKey,
} from "../src/blocks.js";
import { CreativeBuilder } from "../src/creative-builder.js";
import { VoxelBuild } from "../src/voxel-build.js";
import { IslandWorld } from "../src/world.js";
import {
  newProfile,
  loadFamily,
  persistFamily,
  recordBuilding,
  validateBlocks,
  addProfile,
} from "../src/profiles.js";
function fixture(blocks = []) {
  const profile = newProfile("Builder");
  profile.inventory = 251;
  const world = Object.assign(Object.create(IslandWorld.prototype), {
    mode: "play",
    themeId: "village",
    isVillage: true,
    buildMode: true,
    player: new THREE.Vector3(-20, 3.2, 0),
    blocks: new Map(),
    root: new THREE.Group(),
    geo: new THREE.BoxGeometry(),
    mats: Object.fromEntries(
      BLOCKS.map((b) => [b.material, new THREE.MeshBasicMaterial()]),
    ),
    renderer: { shadowMap: {} },
    callbacks: {
      building: (id, s) => recordBuilding(profile, id, s.blocks, s.inventory),
    },
    heightAt: (x, z) => (Math.hypot(x, z) < 36 ? 1.5 : -20),
    burst: () => {},
    selectedBlock: 1,
  });
  world.restoreBuilding({ blocks, inventory: profile.inventory });
  return { w: world, b: world.builder, p: profile };
}
const cube = (x = 0, type = 1, y = 2, z = 0) => ({ x, y, z, type });
const run = (b, n = 300) => {
  for (let i = 0; i < n; i++) b.update(1 / 60);
};

test("36 stable block IDs and old saves migrate without losing progress or earned materials", () => {
  assert.equal(BLOCKS.length, 36);
  assert.deepEqual(
    BLOCKS.slice(0, 3).map((b) => b.material),
    ["grass1", "plank", "glow"],
  );
  let raw;
  const storage = { getItem: () => raw, setItem: (_, v) => (raw = v) };
  const f = loadFamily(storage),
    p = f.profiles[0];
  p.inventory = 251;
  p.progress.totalCrystals = 60;
  p.builds.village = [cube(2, 0)];
  delete p.hotbar;
  persistFamily(f, storage);
  const restored = loadFamily(storage).profiles[0];
  assert.deepEqual(restored.hotbar, DEFAULT_HOTBAR);
  assert.equal(restored.inventory, 251);
  assert.equal(restored.progress.totalCrystals, 60);
  assert.deepEqual(restored.builds.village, p.builds.village);
});
test("creative saves retain 8000 high blocks of all materials; adventure limits stay at 600", () => {
  const cells = Array.from({ length: 8100 }, (_, i) => ({
    x: i % 30,
    y: 2 + Math.floor(i / 900),
    z: Math.floor(i / 30) % 30,
    type: i % 36,
  }));
  assert.equal(validateBlocks(cells, "village").length, 8000);
  assert.equal(
    validateBlocks(
      cells.map((b) => ({ ...b, type: 1 })),
      "meadow",
    ).length,
    600,
  );
  assert.equal(validateBlocks([cube(0, TNT, 80)], "village").length, 1);
  assert.equal(validateBlocks([cube(0, TNT, 80)], "meadow").length, 0);
  assert.equal(
    validateBlocks([cube(0, 36), cube(1, NaN), cube(2, 1, 81)], "village")
      .length,
    0,
  );
});
test("favourite blocks belong to each explorer and survive reloading", () => {
  let raw;
  const storage = { getItem: () => raw, setItem: (_, v) => (raw = v) };
  const f = loadFamily(storage);
  f.profiles[0].hotbar[0] = TNT;
  addProfile(f, "Second", "dragon");
  persistFamily(f, storage);
  const loaded = loadFamily(storage);
  assert.equal(loaded.profiles[0].hotbar[0], TNT);
  assert.equal(loaded.profiles[1].hotbar[0], 0);
});
test("real village placement, mining, undo and redo never spend or generate adventure inventory", () => {
  const { w, p, b } = fixture();
  w.blockTarget = () => ({ terrain: { point: new THREE.Vector3(0, 1.5, 0) } });
  w.blockStock = 0;
  p.inventory = 0;
  w.placeBlock();
  assert.equal(w.blocks.size, 1);
  assert.equal(p.inventory, 0);
  w.blockTarget = () => ({ placed: { object: [...w.blocks.values()][0] } });
  w.mineBlock();
  assert.equal(w.blocks.size, 0);
  assert.equal(p.inventory, 0);
  b.undo();
  assert.equal(w.blocks.size, 1);
  b.redo();
  assert.equal(w.blocks.size, 0);
  assert.equal(p.inventory, 0);
});
test("floor, wall and line brushes join two corners without duplicate cubes", () => {
  const a = cube(0),
    end = cube(3, 1, 5, 2);
  const floor = brushBlocks("floor", a, end, 5);
  assert.equal(floor.length, 12);
  assert.ok(floor.every((b) => b.y === 2 && b.type === 5));
  const wall = brushBlocks("wall", a, end, 7);
  assert.equal(wall.length, 16);
  assert.ok(wall.every((b) => b.z === 0));
  const line = brushBlocks("line", a, end, 2);
  assert.equal(line.length, 4);
  assert.equal(new Set(line.map(blockKey)).size, 4);
  assert.deepEqual(brushBlocks("line", a, cube(25), 1), []);
});
test("four blueprints rotate intact and respect space, capacity and whole-action undo", () => {
  for (const blueprint of BLUEPRINTS) {
    const cells = blueprintBlocks(blueprint.id, cube(0), 0),
      rotated = blueprintBlocks(blueprint.id, cube(0), 1);
    assert.ok(cells.length > 100);
    assert.equal(cells.length, rotated.length);
    assert.equal(new Set(cells.map(blockKey)).size, cells.length);
    assert.ok(cells.every((b) => BLOCKS[b.type]));
  }
  const { w, b } = fixture();
  b.choose("stamp:cottage");
  b.place(cube(0));
  const count = w.blocks.size;
  assert.ok(count > 100);
  b.undo();
  assert.equal(w.blocks.size, 0);
  b.redo();
  assert.equal(w.blocks.size, count);
  b.place(cube(0, 1, 78));
  assert.equal(w.blocks.size, count);
  b.place(cube(35));
  assert.equal(w.blocks.size, count);
  // Existing blocks are preserved when designs overlap.
  const retained = w.blocks.get("0,2,0");
  b.place(cube(0));
  assert.equal(w.blocks.get("0,2,0"), retained);
});
test("bulk placement rejects a capacity overflow atomically", () => {
  const { w, b } = fixture(
    Array.from({ length: 7990 }, (_, i) =>
      cube(i % 30, 1, 10 + Math.floor(i / 900), Math.floor(i / 30) % 30),
    ),
  );
  b.choose("stamp:rocket");
  b.place(cube(-10));
  assert.equal(w.blocks.size, 7990);
});
test("TNT has a paused fuse, chains to nearby TNT, preserves terrain and restores one complete blast", () => {
  const blocks = [
    cube(0, TNT),
    cube(4, TNT),
    cube(1, 5),
    cube(7, 7),
    cube(12, 9),
  ];
  const { w, b, p } = fixture(blocks);
  const terrain = w.heightAt(0, 0);
  b.ignite(w.blocks.get("0,2,0"));
  b.update(0);
  assert.equal(b.fuses.get("0,2,0"), 3);
  run(b, 60);
  assert.equal(w.blocks.size, 5);
  run(b, 240);
  assert.equal(w.blocks.size, 1);
  assert.ok(w.blocks.has("12,2,0"));
  assert.equal(w.heightAt(0, 0), terrain);
  assert.equal(p.inventory, 251);
  assert.equal(b.undoStack.length, 1);
  assert.equal(p.builds.village.length, 1);
  b.undo();
  assert.equal(w.blocks.size, 5);
  assert.equal(b.fuses.size, 0);
  assert.equal(p.builds.village.length, 5);
  b.redo();
  assert.equal(w.blocks.size, 1);
  assert.equal(p.inventory, 251);
});
test("undo disarms a fuse without destroying TNT or undoing an earlier build", () => {
  const { w, b } = fixture();
  w.selectedBlock = TNT;
  b.place(cube(0));
  b.ignite(w.blocks.get("0,2,0"));
  b.undo();
  run(b);
  assert.equal(w.blocks.size, 1);
  assert.equal(b.fuses.size, 0);
  assert.equal(b.undoStack.length, 1);
});
test("an interrupted chain saves already exploded blocks and undo restores a partial blast", () => {
  const { w, b, p } = fixture([cube(0, TNT), cube(4, TNT), cube(1)]);
  b.ignite(w.blocks.get("0,2,0"), 0);
  b.update(0.01);
  assert.equal(w.blocks.size, 1);
  assert.equal(p.builds.village.length, 1);
  b.undo();
  assert.equal(w.blocks.size, 3);
  assert.equal(b.fuses.size, 0);
  assert.equal(p.builds.village.length, 3);
});
test("TNT work per frame is bounded and visit changes discard history and live fuses", () => {
  const { w, b } = fixture(Array.from({ length: 20 }, (_, i) => cube(i, TNT)));
  for (const m of w.blocks.values()) b.ignite(m, 0);
  b.update(0.01);
  assert.equal(w.blocks.size, 16);
  b.dispose();
  assert.equal(b.fuses.size, 0);
  const next = new CreativeBuilder(w);
  assert.equal(next.undoStack.length, 0);
});
test("instance growth, swap-removal and ray selection point to the correct saved cube", () => {
  const { w } = fixture(
    Array.from({ length: 80 }, (_, i) =>
      cube(i % 20, 5, 2 + Math.floor(i / 20)),
    ),
  );
  const vox = w.voxels;
  assert.equal(vox.groups.size, 1);
  assert.equal(vox.groups.get(5).mesh.count, 80);
  vox.remove("0,2,0");
  assert.equal(vox.groups.get(5).mesh.count, 79);
  const swapped = w.blocks.get("19,5,0");
  assert.equal(swapped.userData.instanceIndex, 0);
  const ray = new THREE.Raycaster(
    new THREE.Vector3(19, 5, 6),
    new THREE.Vector3(0, 0, -1),
    0,
    14,
  );
  assert.equal(vox.hit(ray).object, swapped);
  assert.deepEqual(vox.hit(ray).face.normal.toArray(), [0, 0, 1]);
  vox.tint("19,5,0", 0xff0000);
  const colour = new THREE.Color();
  vox.groups.get(5).mesh.getColorAt(0, colour);
  assert.equal(colour.getHex(), 0xff0000);
});
test("spatial selection handles vertical, negative, fractional and out-of-reach rays", () => {
  const { w } = fixture([cube(-2, 7, 2.5, -2), cube(-2, 5, 5.5, -2)]);
  const ray = new THREE.Raycaster(
    new THREE.Vector3(-2, 10, -2),
    new THREE.Vector3(0, -1, 0),
    0,
    14,
  );
  assert.equal(w.voxels.hit(ray).object.position.y, 5.5);
  assert.equal(w.voxels.hit(ray).face.normal.y, 1);
  ray.far = 2;
  assert.equal(w.voxels.hit(ray), null);
  ray.far = 14;
  ray.ray.origin.set(-10, 2.5, -2);
  ray.ray.direction.set(1, 0, 0);
  assert.equal(w.voxels.hit(ray).object.position.y, 2.5);
});
test("8000 placed cubes use at most one instanced mesh per material and a local collision lookup", () => {
  const { w } = fixture(
    Array.from({ length: CREATIVE_LIMIT }, (_, i) =>
      cube(i % 30, i % 36, 2 + Math.floor(i / 900), Math.floor(i / 30) % 30),
    ),
  );
  assert.equal(w.blocks.size, 8000);
  assert.equal(w.voxels.groups.size, 36);
  assert.equal(w.root.children.length, 36);
  assert.ok(w.voxels.nearby(15, 15).length < 100);
});

test("flying can preview and place blocks in clear air within reach", () => {
  const { w } = fixture();
  w.player.set(0, 12, 0);
  w.flying = true;
  w.camera = new THREE.PerspectiveCamera();
  w.camera.position.copy(w.player);
  w.camera.updateMatrixWorld();
  w.ray = new THREE.Raycaster();
  const target = w.blockTarget();
  assert.ok(target.air);
  assert.deepEqual(w.placementPoint(target).toArray(), [0, 12, -8]);
  w.placeBlock();
  assert.ok(w.blocks.has("0,12,-8"));
  w.flying = false;
  w.camera.position.set(5, 12, 0);
  w.camera.updateMatrixWorld();
  assert.equal(w.blockTarget(), null);
});
test("undo moves an explorer above restored blocks instead of trapping them inside", () => {
  const { w, b } = fixture([cube(0, TNT), cube(0, 1, 3)]);
  b.ignite(w.blocks.get("0,2,0"), 0);
  b.update(0.01);
  w.player.set(0, 3.2, 0);
  b.undo();
  assert.equal(w.player.y, 5.2);
});
