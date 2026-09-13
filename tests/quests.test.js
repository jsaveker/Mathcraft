import { test } from "node:test";
import assert from "node:assert/strict";
import { createRound, readSave, DEFAULT_SAVE } from "../src/maths.js";
import {
  QUESTS,
  activeQuest,
  questPhase,
  gatherQuest,
  finishQuest,
  describeQuest,
  bridgePlan,
} from "../src/quests.js";
import { QuestWorld } from "../src/quest-world.js";

const fresh = () => createRound(structuredClone(DEFAULT_SAVE), "meadow");
for (const range of [10, 20, 100])
  for (const operation of ["mixed", "addition", "subtraction"]) {
    test(`linked ${operation} island jobs stay within ${range}`, () => {
      let state = 72;
      const random = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
      };
      for (let i = 0; i < 200; i++) {
        const round = createRound(
          { ...structuredClone(DEFAULT_SAVE), range, operation },
          "meadow",
          random,
        );
        round.questions.forEach((q, index) => {
          [q.a, q.b, q.answer].forEach((n) =>
            assert.ok(Number.isInteger(n) && n >= 0 && n <= range),
          );
          assert.equal(q.answer, q.operator === "+" ? q.a + q.b : q.a - q.b);
          if (index < 4) assert.ok(q.answer > 0);
          if (operation !== "mixed")
            assert.equal(q.operator, operation === "addition" ? "+" : "−");
        });
        const bridge = bridgePlan(round.questions);
        assert.equal(bridge.laid, round.questions[0].answer);
        assert.ok(bridge.total > bridge.laid && bridge.total <= range);
      }
    });
  }
test("gathering is required, jobs unlock in order, and wrong answers do not change the island", () => {
  const r = fresh();
  assert.equal(activeQuest(r.collected), 0);
  assert.equal(questPhase(r, 1), "locked");
  assert.equal(gatherQuest(r, 1), false);
  assert.equal(finishQuest(r, 0, r.questions[0].answer), false);
  assert.equal(gatherQuest(r, 0), true);
  assert.equal(gatherQuest(r, 0), false);
  assert.equal(questPhase(r, 0), "solve");
  assert.equal(finishQuest(r, 0, -1), false);
  assert.equal(r.collected[0], false);
  assert.equal(finishQuest(r, 0, r.questions[0].answer), true);
  assert.equal(questPhase(r, 1), "gather");
  assert.equal(finishQuest(r, 0, r.questions[0].answer), false);
});
test("all five jobs finish once and leave the portal ready", () => {
  const r = fresh();
  QUESTS.forEach((_, i) => {
    assert.ok(gatherQuest(r, i));
    assert.ok(finishQuest(r, i, r.questions[i].answer));
  });
  assert.equal(activeQuest(r.collected), -1);
  assert.deepEqual(r.collected, Array(5).fill(true));
  assert.ok(QUESTS.every((_, i) => questPhase(r, i) === "done"));
});
test("legacy saves retain questions, crystals, completed worlds, and non-sequential progress", () => {
  const save = structuredClone(DEFAULT_SAVE);
  const old = createRound(save, "meadow");
  old.collected = [false, true, true, false, false];
  delete old.gathered;
  save.totalCrystals = 12;
  save.completed = ["meadow"];
  const recovered = readSave({ getItem: () => JSON.stringify(save) });
  const resumed = createRound(recovered, "meadow");
  assert.deepEqual(resumed.questions, old.questions);
  assert.deepEqual(resumed.collected, old.collected);
  assert.deepEqual(resumed.gathered, [false, true, true, false, false]);
  assert.equal(recovered.totalCrystals, 12);
  assert.deepEqual(recovered.completed, ["meadow"]);
});
test("gathered supplies survive closing the game before solving", () => {
  const save = structuredClone(DEFAULT_SAVE),
    r = createRound(save, "meadow");
  gatherQuest(r, 0);
  const recovered = readSave({ getItem: () => JSON.stringify(save) });
  const resumed = createRound(recovered, "meadow");
  assert.equal(questPhase(resumed, 0), "solve");
  assert.deepEqual(resumed.questions, r.questions);
});
test("bridge collision and floor follow the actual number of laid planks", () => {
  const round = fresh(),
    view = Object.assign(Object.create(QuestWorld.prototype), {
      round,
      plan: bridgePlan(round.questions),
    });
  assert.equal(view.blocksMovement(14, 7), true);
  assert.equal(view.bridgeHeight(11, 7), -100);
  round.collected[0] = true;
  const end = 10.5 + (7 * view.plan.laid) / view.plan.total;
  assert.equal(view.bridgeHeight(10.51, 7), 2.12);
  assert.equal(view.blocksMovement(end + 0.01, 7), true);
  round.collected[1] = true;
  assert.equal(view.bridgeHeight(16.9, 7), 2.12);
  assert.equal(view.blocksMovement(16.9, 7), false);
  assert.equal(view.bridgeHeight(14, 10), -100);
});
test("every job gives a contextual question for both operations", () => {
  for (const operator of ["+", "−"])
    QUESTS.forEach((quest, index) => {
      const q = { a: 12, b: 5, operator, answer: operator === "+" ? 17 : 7 },
        description = describeQuest(index, q);
      assert.ok(
        description.story.includes("12") && description.story.includes("5"),
      );
      assert.equal(description.resource, quest.resource);
      assert.equal(description.labels.length, 2);
    });
});
