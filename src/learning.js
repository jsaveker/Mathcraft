// Maths complexity advances separately for addition and subtraction, without a timer.
const BANDS = [
  { cap: 10, floor: 4, maxStep: 5, label: "Small steps to 10" },
  { cap: 20, floor: 10, maxStep: 9, label: "Exploring to 20" },
  {
    cap: 40,
    floor: 20,
    maxStep: 9,
    noCarry: true,
    label: "Tens and ones to 40",
  },
  { cap: 60, floor: 30, maxStep: 9, label: "Crossing tens to 60" },
  {
    cap: 100,
    floor: 50,
    maxStep: 40,
    noCarry: true,
    label: "Bigger numbers to 100",
  },
  { cap: 100, floor: 50, maxStep: 70, label: "Mixing tens and ones" },
];
const skill = () => ({ level: 1, streak: 0, support: 0 });
export const newLearning = () => ({ addition: skill(), subtraction: skill() });
export function cleanLearning(value) {
  return Object.fromEntries(
    ["addition", "subtraction"].map((op) => {
      const s = value?.[op];
      const valid = (n, max, fallback) =>
        Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
      return [
        op,
        {
          level: valid(s?.level, 5, 1),
          streak: valid(s?.streak, 2, 0),
          support: valid(s?.support, 1, 0),
        },
      ];
    }),
  );
}
export function effectiveLevel(level, range) {
  return Math.min(level, range === 10 ? 0 : range === 20 ? 1 : 5);
}
export const practiceLimit = (level, range) =>
  BANDS[effectiveLevel(level, range)].cap;
export function learningLabel(learning, operation, range) {
  const op = operation === "subtraction" ? "subtraction" : "addition";
  return BANDS[effectiveLevel(learning?.[op]?.level ?? 1, range)].label;
}
export function practiceQuestion(
  range,
  operation,
  learning,
  random = Math.random,
  index = 0,
) {
  const op =
    operation === "mixed"
      ? index % 2
        ? "subtraction"
        : "addition"
      : operation;
  const level = effectiveLevel(learning?.[op]?.level ?? 1, range);
  const band = BANDS[level],
    candidates = [];
  for (let a = 1; a <= band.cap; a++) {
    for (let b = 1; b <= Math.min(band.maxStep, a); b++) {
      const answer = op === "addition" ? a + b : a - b;
      const magnitude = Math.max(a, answer);
      if (answer < 1 || answer > band.cap || magnitude < band.floor) continue;
      if (level >= 1 && b < 2) continue;
      if (level >= 4 && b < 10) continue;
      const crossesTen =
        op === "addition" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
      if ((level === 3 || level === 5) && !crossesTen) continue;
      if (
        band.noCarry &&
        (op === "addition" ? (a % 10) + (b % 10) > 9 : a % 10 < b % 10)
      )
        continue;
      candidates.push({
        a,
        b,
        operator: op === "addition" ? "+" : "−",
        answer,
        level,
      });
    }
  }
  return candidates[
    Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  ];
}
export function recordPractice(save, round, index) {
  round.evidence ??= [];
  const evidence = (round.evidence[index] ??= { attempts: 0, hint: false });
  if (evidence.recorded) return false;
  evidence.recorded = true;
  save.learning = cleanLearning(save.learning);
  const q = round.questions[index],
    op = q.operator === "+" ? "addition" : "subtraction";
  const s = save.learning[op];
  // An old or already-started question must not accidentally promote a harder skill.
  if (q.level !== undefined && q.level !== effectiveLevel(s.level, round.range))
    return true;
  s.level = effectiveLevel(s.level, round.range);
  if (evidence.attempts === 1 && !evidence.hint) {
    s.support = 0;
    if (++s.streak >= 3) {
      s.level = effectiveLevel(Math.min(5, s.level + 1), round.range);
      s.streak = 0;
    }
  } else {
    s.streak = 0;
    if (++s.support >= 2) {
      s.level = Math.max(0, s.level - 1);
      s.support = 0;
    }
  }
  return true;
}
// Never change a question a child has seen, gathered, or already answered.
export function preparePractice(save, round, index, random = Math.random) {
  if (
    round.layoutVersion !== 2 ||
    round.gathered[index] ||
    round.collected[index] ||
    index === 0 ||
    (round.worldId === "meadow" && index === 1)
  )
    return false;
  round.questions[index] = practiceQuestion(
    round.range,
    round.operation,
    save.learning,
    random,
    index,
  );
  return true;
}
