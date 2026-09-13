import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { IslandWorld } from "../src/world.js";

// Use real movement and collision methods without requiring a GPU in Node.
function fixture() {
  const world = Object.assign(Object.create(IslandWorld.prototype), {
    mode: "play",
    elapsed: 0,
    lastFrame: 0,
    player: new THREE.Vector3(0, 3.2, 0),
    camera: new THREE.PerspectiveCamera(),
    scene: new THREE.Scene(),
    keys: new Set(),
    touchMove: { x: 0, z: 0 },
    lookYaw: 0,
    lookPitch: 0,
    velocityY: 0,
    grounded: true,
    terrain: new Map(),
    colliders: [],
    blocks: new Map(),
    callbacks: {},
    shrines: [],
    clouds: [],
    particles: [],
    collected: Array(5).fill(false),
    targetOutline: { visible: false },
    renderer: { render() {}, shadowMap: {} },
    sun: new THREE.DirectionalLight(),
    buildMode: false,
  });
  for (let x = -8; x <= 8; x++)
    for (let z = -8; z <= 8; z++) world.terrain.set(`${x},${z}`, 1.5);
  return world;
}
function tick(world, count = 1) {
  for (let i = 0; i < count; i++) {
    world.lastFrame = performance.now() - 1000 / 60;
    world.frame();
  }
}

test("holding W moves forward at walking speed", () => {
  const w = fixture();
  w.keys.add("KeyW");
  tick(w, 60);
  assert.ok(w.player.z < -4.6 && w.player.z > -4.8);
  assert.equal(w.player.x, 0);
  assert.equal(w.player.y, 3.2);
});
test("movement follows the direction the player is looking", () => {
  const w = fixture();
  w.lookYaw = Math.PI / 2;
  w.keys.add("KeyW");
  tick(w, 60);
  assert.ok(w.player.x < -4.6);
  assert.ok(Math.abs(w.player.z) < 0.01);
});
test("diagonal walking does not give an extra speed boost", () => {
  const w = fixture();
  w.keys.add("KeyW");
  w.keys.add("KeyD");
  tick(w, 60);
  assert.ok(Math.abs(Math.hypot(w.player.x, w.player.z) - 4.7) < 0.02);
});
test("jump rises, cannot double-jump, then lands on the ground", () => {
  const w = fixture();
  w.jump();
  tick(w, 12);
  assert.ok(w.player.y > 4.1);
  const velocity = w.velocityY;
  w.jump();
  assert.equal(w.velocityY, velocity);
  tick(w, 60);
  assert.equal(w.player.y, 3.2);
  assert.equal(w.grounded, true);
});
test("terrain edges keep children safely on the island", () => {
  const w = fixture();
  w.keys.add("KeyW");
  tick(w, 300);
  assert.ok(w.player.z >= -8.5);
  assert.equal(w.player.y, 3.2);
});
test("trees and structures block walking through them", () => {
  const w = fixture();
  w.colliders.push({ x: 0, z: -2, w: 2, d: 1 });
  w.keys.add("KeyW");
  tick(w, 60);
  assert.ok(w.player.z > -1.3 && w.player.z < -1);
});
test("player-built blocks also stop walking through them", () => {
  const w = fixture();
  w.blocks.set("test", { position: new THREE.Vector3(0, 2, -2) });
  w.keys.add("KeyW");
  tick(w, 60);
  assert.ok(w.player.z > -1.3 && w.player.z < -1);
});
test("pausing freezes movement and gravity", () => {
  const w = fixture();
  w.keys.add("KeyW");
  w.mode = "pause";
  w.velocityY = 5;
  tick(w, 60);
  assert.deepEqual(w.player.toArray(), [0, 3.2, 0]);
});
test("touch movement uses the same direction and speed as keyboard movement", () => {
  const w = fixture();
  w.touchMove.z = -1;
  tick(w, 60);
  assert.ok(w.player.z < -4.6 && w.player.z > -4.8);
});

test("creative flight rises, descends, respects the height cap and lands on the ground", () => {
  const w = fixture();
  w.isVillage = true;
  w.toggleFlight();
  w.keys.add("Space");
  tick(w, 60);
  assert.ok(w.player.y > 10 && w.player.y < 10.3);
  tick(w, 900);
  assert.equal(w.player.y, 84);
  w.keys.clear();
  w.keys.add("ShiftLeft");
  tick(w, 900);
  assert.equal(w.player.y, 3.2);
  w.keys.clear();
  w.toggleFlight();
  assert.equal(w.flying, false);
});
test("descending from a tall build cannot tunnel through player-built floors", () => {
  const w = fixture();
  w.isVillage = true;
  w.flying = true;
  w.player.y = 22.3;
  const block = { position: new THREE.Vector3(0, 20, 0) };
  w.blocks.set("floor", block);
  w.voxels = { nearby: () => [block] };
  w.keys.add("ShiftLeft");
  tick(w, 120);
  assert.equal(w.player.y, 22.2);
});
test("flying cannot ascend through a low roof and pause freezes vertical movement", () => {
  const w = fixture();
  w.isVillage = true;
  w.flying = true;
  w.voxels = { nearby: () => [{ position: new THREE.Vector3(0, 5, 0) }] };
  w.keys.add("Space");
  tick(w, 60);
  assert.ok(w.player.y < 4.5);
  const height = w.player.y;
  w.mode = "pause";
  tick(w, 60);
  assert.equal(w.player.y, height);
});
test("flight only belongs to the village and elevated flying passes above scenery", () => {
  const w = fixture();
  w.toggleFlight();
  assert.ok(!w.flying);
  w.isVillage = true;
  w.flying = true;
  w.player.y = 12;
  w.colliders.push({ x: 0, z: -2, w: 2, d: 1 });
  w.keys.add("KeyW");
  tick(w, 30);
  assert.ok(w.player.z < -3.9);
});
