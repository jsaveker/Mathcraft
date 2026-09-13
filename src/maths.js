import {
  newLearning,
  cleanLearning,
  practiceQuestion,
  practiceLimit,
} from "./learning.js";
export const WORLDS = [
  {
    id: "meadow",
    name: "Meadow Isles",
    tag: "A little wonder. A big adventure.",
    biome: "THE GRASSLANDS",
    color: "#68a84f",
    crystals: "#67efd5",
    title: "A little help. A brighter island.",
    description:
      "Build a bridge, feed the sheep, and bring the island to life.",
    operation: "mixed",
  },
  {
    id: "cavern",
    name: "Crystal Peaks",
    tag: "Reach new heights.",
    biome: "THE CRYSTAL HIGHLANDS",
    color: "#8377c8",
    crystals: "#c5a0ff",
    title: "Light up the crystal peaks",
    description:
      "Open an icy mine, send the crystal express, and guide climbers home.",
    operation: "mixed",
  },
  {
    id: "sunset",
    name: "Sunset Sands",
    tag: "A golden hour of discovery.",
    biome: "THE GOLDEN ISLANDS",
    color: "#d48b47",
    crystals: "#ffd475",
    title: "Unlock the sun gate",
    description:
      "Uncover a dinosaur fossil, restore a sun mosaic, and launch a sand ship.",
    operation: "mixed",
  },
  {
    id: "sky",
    name: "Cloud Harbour",
    tag: "The sky is only the beginning.",
    biome: "THE SKY DOCKS",
    color: "#5caac3",
    crystals: "#8cffe9",
    title: "Get the harbour flying",
    description:
      "Rescue a balloon, deliver cloud post, and launch a giant airship.",
    operation: "mixed",
  },
  {
    id: "moon",
    name: "Moonbase Nova",
    tag: "One small sum. One giant adventure.",
    biome: "THE LUNAR FRONTIER",
    color: "#7986bf",
    crystals: "#98cfff",
    title: "Build a home among the stars",
    description:
      "Unfold solar panels, send a rover, and launch your very own rocket.",
    operation: "mixed",
  },
];
export const DEFAULT_SAVE = {
  version: 1,
  range: 100,
  operation: "mixed",
  sound: true,
  learning: newLearning(),
  completed: [],
  solved: 0,
  correctFirst: 0,
  rounds: {},
  totalCrystals: 0,
};
export function readSave(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem("mathcraft-save") || "null");
    if (!value || value.version !== 1) return structuredClone(DEFAULT_SAVE);
    return {
      ...structuredClone(DEFAULT_SAVE),
      range: [10, 20, 100].includes(value.range) ? value.range : 100,
      operation: ["mixed", "addition", "subtraction"].includes(value.operation)
        ? value.operation
        : "mixed",
      sound: value.sound !== false,
      learning: cleanLearning(value.learning),
      completed: Array.isArray(value.completed)
        ? [
            ...new Set(
              value.completed.filter((x) => WORLDS.some((w) => w.id === x)),
            ),
          ]
        : [],
      solved: Math.max(0, Number(value.solved) || 0),
      correctFirst: Math.max(0, Number(value.correctFirst) || 0),
      totalCrystals: Math.max(0, Number(value.totalCrystals) || 0),
      rounds:
        value.rounds &&
        typeof value.rounds === "object" &&
        !Array.isArray(value.rounds)
          ? value.rounds
          : {},
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}
export function persistSave(save, storage = globalThis.localStorage) {
  try {
    storage.setItem("mathcraft-save", JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function makeQuestion(
  range = 100,
  operation = "mixed",
  random = Math.random,
  index = 0,
) {
  const subtract =
    operation === "subtraction" || (operation === "mixed" && index % 2 === 1);
  const int = (min, max) => min + Math.floor(random() * (max - min + 1));
  let a, b;
  if (subtract) {
    a = int(2, range);
    b = int(1, a);
  } else {
    a = int(1, range - 1);
    b = int(1, range - a);
  }
  return {
    a,
    b,
    operator: subtract ? "−" : "+",
    answer: subtract ? a - b : a + b,
  };
}
export function createRound(save, worldId, random = Math.random) {
  const prior = save.rounds[worldId];
  if (
    prior &&
    prior.range === save.range &&
    prior.operation === save.operation &&
    Array.isArray(prior.questions) &&
    prior.questions.length === 5 &&
    prior.questions.every(
      (q) =>
        q &&
        Number.isInteger(q.a) &&
        Number.isInteger(q.b) &&
        q.a >= 0 &&
        q.a <= save.range &&
        q.b >= 0 &&
        q.b <= save.range &&
        ["+", "−"].includes(q.operator) &&
        q.answer === (q.operator === "+" ? q.a + q.b : q.a - q.b) &&
        q.answer >= 0 &&
        q.answer <= save.range,
    ) &&
    Array.isArray(prior.collected) &&
    prior.collected.length === 5 &&
    prior.collected.every((x) => typeof x === "boolean") &&
    prior.finished !== true
  ) {
    // Existing crystals become completed island jobs; never erase earned progress.
    prior.gathered = prior.collected.map(
      (done, i) => done || prior.gathered?.[i] === true,
    );
    prior.worldId = worldId;
    prior.evidence = prior.questions.map((_, i) => {
      const e = prior.evidence?.[i];
      return {
        attempts:
          Number.isInteger(e?.attempts) && e.attempts >= 0
            ? Math.min(e.attempts, 100000)
            : 0,
        hint: e?.hint === true,
        recorded: e?.recorded === true,
      };
    });
    return prior;
  }
  const questions = Array.from({ length: 5 }, (_, i) =>
    practiceQuestion(save.range, save.operation, save.learning, random, i),
  );
  if (worldId === "meadow") {
    // The second job uses exactly the planks counted in the first. Keep the
    // extra step small, so this physical dependency cannot create a difficulty jump.
    const linkedCap = Math.min(
      save.range,
      practiceLimit(questions[0].level ?? 1, save.range),
    );
    const stock = Math.min(linkedCap - 1, questions[0].answer);
    if (questions[0].answer !== stock) {
      questions[0].a -= 1;
      questions[0].answer = stock;
    }
    const extra = 1 + Math.floor(random() * Math.min(5, linkedCap - stock));
    questions[1] =
      questions[1].operator === "+"
        ? { a: stock, b: extra, operator: "+", answer: stock + extra }
        : { a: stock + extra, b: stock, operator: "−", answer: extra };
  }
  const round = {
    worldId,
    layoutVersion: 2,
    evidence: [],
    range: save.range,
    operation: save.operation,
    questions,
    gathered: Array(5).fill(false),
    collected: Array(5).fill(false),
    finished: false,
  };
  save.rounds[worldId] = round;
  return round;
}
export function hintFor({ a, b, operator }) {
  if (operator === "−")
    return b >= 10
      ? `Start with ${a}. Take away ${Math.floor(b / 10) * 10}, then take away ${b % 10}. What is left?`
      : `Start with ${a}. Count back ${b} steps. What is left?`;
  return b >= 10
    ? `Start with ${a}. Add ${Math.floor(b / 10) * 10}, then add ${b % 10}. Where do you land?`
    : `Start with ${a}. Count on ${b} steps. Where do you land?`;
}
