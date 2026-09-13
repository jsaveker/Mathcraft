export const WORLDS = [
  {
    id: "meadow",
    name: "Meadow Isles",
    tag: "A little wonder. A big adventure.",
    biome: "THE GRASSLANDS",
    color: "#68a84f",
    crystals: "#67efd5",
    title: "Wake the ancient portal",
    description: "Find five number crystals to bring the portal back to life.",
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
    description: "Collect five glowing crystals to power the mountain portal.",
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
    description: "Find five sun crystals and awaken the golden gate.",
    operation: "mixed",
  },
];
export const DEFAULT_SAVE = {
  version: 1,
  range: 100,
  operation: "mixed",
  sound: true,
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
  )
    return prior;
  const round = {
    range: save.range,
    operation: save.operation,
    questions: Array.from({ length: 5 }, (_, i) =>
      makeQuestion(save.range, save.operation, random, i),
    ),
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
