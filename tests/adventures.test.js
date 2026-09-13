import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { ADVENTURES } from "../src/adventures.js";
import { AdventureWorld } from "../src/adventure-world.js";
import {
  QUESTS,
  questsFor,
  describeQuest,
  gatherQuest,
  finishQuest,
} from "../src/quests.js";
import { DEFAULT_SAVE, WORLDS, createRound, readSave } from "../src/maths.js";
import {
  newLearning,
  cleanLearning,
  practiceQuestion,
  preparePractice,
  recordPractice,
  effectiveLevel,
  practiceLimit,
} from "../src/learning.js";
import {
  newProfile,
  loadFamily,
  persistFamily,
  recordBuilding,
} from "../src/profiles.js";
import { IslandWorld } from "../src/world.js";

const seeded = () => {
  let n = 541;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
};
for (const range of [10, 20, 100])
  for (const operation of ["addition", "subtraction", "mixed"]) {
    test(`adaptive ${operation} has safe, consistent bands under the parent cap ${range}`, () => {
      const random = seeded();
      for (let level = 0; level < 6; level++) {
        const learning = cleanLearning({
          addition: { level },
          subtraction: { level },
        });
        for (let i = 0; i < 100; i++) {
          const q = practiceQuestion(range, operation, learning, random, i);
          assert.equal(q.answer, q.operator === "+" ? q.a + q.b : q.a - q.b);
          assert.ok(q.answer > 0 && q.a > 0 && q.b > 0);
          assert.ok(
            Math.max(q.a, q.b, q.answer) <=
              Math.min(range, practiceLimit(level, range)),
          );
          assert.equal(q.level, effectiveLevel(level, range));
          if (q.level === 2 || q.level === 4)
            assert.ok(
              q.operator === "+"
                ? (q.a % 10) + (q.b % 10) <= 9
                : q.a % 10 >= q.b % 10,
            );
          if (q.level >= 4) assert.ok(q.b >= 10);
          if (q.level === 3 || q.level === 5)
            assert.ok(
              q.operator === "+"
                ? (q.a % 10) + (q.b % 10) >= 10
                : q.a % 10 < q.b % 10,
            );
          if (operation !== "mixed")
            assert.equal(q.operator, operation === "addition" ? "+" : "−");
        }
      }
    });
  }
function answer(save, op, { attempts = 1, hint = false } = {}) {
  const q = practiceQuestion(save.range, op, save.learning, () => 0.4);
  const r = {
    range: save.range,
    questions: [q],
    evidence: [{ attempts, hint }],
  };
  recordPractice(save, r, 0);
  return r;
}
test("three independent successes move only the practised skill by one step, never by speed", () => {
  const save = structuredClone(DEFAULT_SAVE);
  answer(save, "addition");
  answer(save, "addition");
  assert.equal(save.learning.addition.level, 1);
  const r = answer(save, "addition");
  assert.equal(save.learning.addition.level, 2);
  assert.equal(save.learning.subtraction.level, 1);
  assert.equal(recordPractice(save, r, 0), false);
  assert.equal(save.learning.addition.streak, 0);
});
test("two supported questions ease back, including first answers reached with a hint", () => {
  const save = structuredClone(DEFAULT_SAVE);
  answer(save, "addition", { hint: true });
  assert.equal(save.learning.addition.level, 1);
  answer(save, "addition", { attempts: 3 });
  assert.equal(save.learning.addition.level, 0);
  assert.equal(save.learning.subtraction.level, 1);
  for (let i = 0; i < 5; i++) answer(save, "addition", { hint: true });
  assert.equal(save.learning.addition.level, 0);
});
test("skills can reach 100 gradually and remain within a smaller parent cap", () => {
  const save = structuredClone(DEFAULT_SAVE);
  for (let i = 0; i < 12; i++) answer(save, "addition");
  assert.equal(save.learning.addition.level, 5);
  save.range = 10;
  for (let i = 0; i < 12; i++) answer(save, "addition");
  assert.equal(save.learning.addition.level, 0);
});
test("a new question adapts but an inspected question and its saved attempts never change", () => {
  const save = structuredClone(DEFAULT_SAVE),
    r = createRound(save, "sky", () => 0.4);
  save.learning.addition.level = 4;
  assert.ok(preparePractice(save, r, 2, () => 0.5));
  assert.equal(r.questions[2].level, 4);
  r.gathered[2] = true;
  const old = structuredClone(r.questions[2]);
  assert.equal(
    preparePractice(save, r, 2, () => 0.1),
    false,
  );
  r.evidence[2] = { attempts: 2, hint: true };
  const loaded = readSave({ getItem: () => JSON.stringify(save) });
  const resumed = createRound(loaded, "sky");
  assert.deepEqual(resumed.questions[2], old);
  assert.equal(resumed.evidence[2].attempts, 2);
  assert.equal(resumed.evidence[2].hint, true);
  assert.equal(loaded.learning.addition.level, 4);
});
test("the five expeditions have 25 unique jobs and safe, distinct routes", () => {
  assert.equal(WORLDS.length, 5);
  const ids = new Set(),
    routes = new Set();
  for (const w of WORLDS) {
    const quests = questsFor(w.id);
    assert.equal(quests.length, 5);
    routes.add(JSON.stringify(quests.map((q) => [q.x, q.z])));
    for (const [i, quest] of quests.entries()) {
      assert.ok(!ids.has(quest.id));
      ids.add(quest.id);
      assert.ok(Math.hypot(quest.x, quest.z + 3) < 20);
      for (const operator of ["+", "−"]) {
        const q = { a: 15, b: 8, operator, answer: operator === "+" ? 23 : 7 };
        const d = describeQuest(i, q, w.id);
        assert.ok(d.story.includes("15") && d.story.includes("8"));
        assert.ok(!d.story.includes("{"));
        if (w.id !== "meadow")
          assert.doesNotMatch(d.story, /sheep|garden|planks/);
      }
    }
  }
  assert.equal(ids.size, 25);
  assert.equal(routes.size, 5);
});
test("an old half-played island keeps its original jobs and can be finished before the new expedition", () => {
  const save = structuredClone(DEFAULT_SAVE),
    old = createRound(save, "cavern");
  delete old.layoutVersion;
  old.collected = [true, true, false, false, false];
  old.gathered = [true, true, true, false, false];
  const questions = structuredClone(old.questions);
  const resumed = createRound(
    readSave({ getItem: () => JSON.stringify(save) }),
    "cavern",
  );
  assert.equal(questsFor("cavern", resumed), QUESTS);
  assert.deepEqual(resumed.questions, questions);
  assert.deepEqual(resumed.collected, old.collected);
  assert.equal(preparePractice(save, resumed, 3), false);
  resumed.finished = true;
  save.rounds.cavern = resumed;
  const next = createRound(save, "cavern");
  assert.equal(questsFor("cavern", next), ADVENTURES.cavern);
});
test("new world completions and builds survive family reload alongside existing villages", () => {
  const p = newProfile("Nova");
  p.progress.completed = WORLDS.map((w) => w.id);
  for (const id of ["village", "sky", "moon"])
    recordBuilding(p, id, [{ x: 2, y: 2, z: 3, type: 1 }], 90);
  const values = new Map(),
    storage = {
      getItem: (k) => values.get(k),
      setItem: (k, v) => values.set(k, v),
    };
  persistFamily(
    { version: 2, revision: 0, activeId: p.id, profiles: [p] },
    storage,
  );
  const loaded = loadFamily(storage).profiles[0];
  assert.deepEqual(loaded.progress.completed, p.progress.completed);
  assert.deepEqual(loaded.builds.moon, p.builds.moon);
  assert.deepEqual(loaded.builds.village, p.builds.village);
  assert.equal(loaded.inventory, 90);
});
class ModelHarness extends AdventureWorld {
  label(text, x, y, z) {
    const o = new THREE.Object3D();
    o.userData.text = text;
    o.position.set(x, y, z);
    this.root.add(o);
    return o;
  }
}
for (const worldId of Object.keys(ADVENTURES))
  test(`${worldId} machinery builds, animates, pauses and restores all five outcomes`, () => {
    const save = structuredClone(DEFAULT_SAVE),
      r = createRound(save, worldId, () => 0.4);
    const geo = new THREE.BoxGeometry(),
      mat = new THREE.MeshBasicMaterial();
    const world = {
      themeId: worldId,
      questRound: r,
      root: new THREE.Group(),
      geo,
      renderer: { shadowMap: {} },
      heightAt: () => 1.5,
      mesh(_mat, x, y, z, sx, sy, sz, parent) {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.scale.set(sx, sy, sz);
        parent.add(m);
        return m;
      },
    };
    const view = new ModelHarness(world);
    const transform = () => {
      const state = [];
      view.root.traverse((o) =>
        state.push([
          ...o.position,
          ...o.rotation.toArray().slice(0, 3),
          ...o.scale,
          o.visible,
        ]),
      );
      return JSON.stringify(state);
    };
    for (let i = 0; i < 5; i++) {
      assert.ok(gatherQuest(r, i));
      view.gather(i);
      assert.equal(view.supplies[i].visible, false);
      assert.ok(finishQuest(r, i, r.questions[i].answer));
      view.animate(i);
      const before = transform();
      view.update(2);
      assert.notEqual(transform(), before);
      const paused = transform();
      view.update(0);
      assert.equal(transform(), paused);
      assert.equal(view.models[i].result.visible, true);
      if (view.models[i].counted)
        assert.equal(
          view.models[i].counted.reduce((n, g) => n + g.children.length, 0),
          r.questions[i].answer,
        );
      const q = ADVENTURES[worldId][i];
      assert.equal(view.blocksMovement(q.x, q.z + 3), false);
      assert.equal(view.blocksMovement(q.x, q.z - 2.6), true);
      assert.equal(view.isProtected(q.x, q.z - 2.6), true);
    }
    view.configure(r);
    assert.ok(view.models.every((m) => m.progress === 1 && m.result.visible));
    assert.equal(world.root.children.length, 1);
    geo.dispose();
    mat.dispose();
  });
test("discover key is harmless on a world without an optional landmark", () => {
  assert.doesNotThrow(() =>
    IslandWorld.prototype.guideLandmark.call({ isVillage: false, biome: {} }),
  );
});
