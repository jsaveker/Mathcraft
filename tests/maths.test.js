import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeQuestion,
  createRound,
  readSave,
  persistSave,
  DEFAULT_SAVE,
  hintFor,
} from "../src/maths.js";

for (const range of [10, 20, 100])
  for (const operation of ["addition", "subtraction", "mixed"]) {
    test(`${operation} questions keep all numbers and results within ${range}`, () => {
      let state = 42;
      const random = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
      };
      for (let i = 0; i < 1000; i++) {
        const q = makeQuestion(range, operation, random, i);
        for (const n of [q.a, q.b, q.answer])
          assert.ok(Number.isInteger(n) && n >= 0 && n <= range);
        assert.equal(q.answer, q.operator === "+" ? q.a + q.b : q.a - q.b);
        if (operation === "mixed")
          assert.equal(q.operator, i % 2 === 1 ? "−" : "+");
        else assert.equal(q.operator, operation === "addition" ? "+" : "−");
      }
    });
  }
test("zero and maximum results can be generated", () => {
  assert.equal(makeQuestion(100, "subtraction", () => 0.999).answer, 0);
  assert.equal(makeQuestion(100, "addition", () => 0.999).answer, 100);
});
test("partially completed rounds resume with the same questions", () => {
  const save = structuredClone(DEFAULT_SAVE);
  const round = createRound(save, "meadow");
  round.collected[2] = true;
  assert.equal(createRound(save, "meadow"), round);
  assert.equal(save.rounds.meadow.collected[2], true);
});
test("completed rounds replay with fresh progress", () => {
  const save = structuredClone(DEFAULT_SAVE);
  const old = createRound(save, "meadow");
  old.collected.fill(true);
  old.finished = true;
  const fresh = createRound(save, "meadow");
  assert.notEqual(fresh, old);
  assert.deepEqual(fresh.collected, Array(5).fill(false));
});
test("changed settings take effect on the next adventure", () => {
  const save = structuredClone(DEFAULT_SAVE);
  const old = createRound(save, "meadow");
  save.range = 20;
  save.operation = "subtraction";
  const fresh = createRound(save, "meadow");
  assert.notEqual(fresh, old);
  assert.ok(fresh.questions.every((q) => q.operator === "−" && q.a <= 20));
});
test("corrupt saves and unavailable storage fall back without crashing", () => {
  assert.deepEqual(readSave({ getItem: () => "{oops" }), DEFAULT_SAVE);
  assert.deepEqual(
    readSave({
      getItem: () => {
        throw new Error("blocked");
      },
    }),
    DEFAULT_SAVE,
  );
  assert.equal(
    persistSave(DEFAULT_SAVE, {
      setItem: () => {
        throw new Error("full");
      },
    }),
    false,
  );
});
test("saved fields and unlocked worlds are validated", () => {
  const s = readSave({
    getItem: () =>
      JSON.stringify({
        version: 1,
        range: 999,
        operation: "divide",
        completed: ["meadow", "made-up", "meadow"],
        solved: -7,
      }),
  });
  assert.equal(s.range, 100);
  assert.equal(s.operation, "mixed");
  assert.deepEqual(s.completed, ["meadow"]);
  assert.equal(s.solved, 0);
});
test("malformed saved puzzle rounds are replaced", () => {
  const save = structuredClone(DEFAULT_SAVE);
  save.rounds.meadow = {
    range: 100,
    operation: "mixed",
    questions: Array(5).fill({ a: 100, b: 1, operator: "−", answer: 101 }),
    collected: Array(5).fill(false),
  };
  const fresh = createRound(save, "meadow");
  assert.ok(fresh.questions.every((q) => q.answer <= 100));
});
test("hints explain tens and ones for two-digit operations", () => {
  assert.match(hintFor({ a: 42, b: 27, operator: "+" }), /Add 20, then add 7/);
  assert.match(
    hintFor({ a: 62, b: 23, operator: "−" }),
    /Take away 20, then take away 3/,
  );
});

test("all five collected crystals survive a reload before entering the portal", () => {
  const save = structuredClone(DEFAULT_SAVE);
  const round = createRound(save, "meadow");
  round.collected.fill(true);
  const reloaded = readSave({ getItem: () => JSON.stringify(save) });
  const resumed = createRound(reloaded, "meadow");
  assert.deepEqual(resumed.collected, Array(5).fill(true));
  assert.deepEqual(resumed.questions, round.questions);
  assert.equal(resumed.finished, false);
});
