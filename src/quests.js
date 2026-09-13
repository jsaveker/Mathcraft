import { ADVENTURES } from "./adventures.js";
export const QUESTS = [
  {
    id: "timber",
    title: "Gather bridge planks",
    location: "Timber yard",
    x: 4,
    z: 10,
    resource: "planks",
    icon: "cube",
    gather: "Gather the timber",
    action: "Count the planks",
    goal: "The builders need a hand. Find the timber cart beside the river.",
    success: "The first bridge planks are in place!",
    effect: "Your counted timber becomes the first part of the crossing.",
  },
  {
    id: "bridge",
    title: "Repair the river bridge",
    location: "River crossing",
    x: 10.5,
    z: 7,
    resource: "planks",
    icon: "cube",
    gather: "Inspect the bridge",
    action: "Repair the bridge",
    goal: "Work out the missing planks and make a new way across the river.",
    success: "You built a way across!",
    effect:
      "The missing planks slot into place. Your bridge is ready to walk across.",
  },
  {
    id: "sheep",
    title: "Feed the hungry sheep",
    location: "Sheep meadow",
    x: 7,
    z: 1,
    resource: "apples",
    icon: "heart",
    gather: "Pick up the apple baskets",
    action: "Feed the sheep",
    goal: "The little flock is hungry. Gather their apples and count their lunch.",
    success: "Three very happy sheep!",
    effect:
      "Your apples fill the feeding trough. Look at those happy little hops.",
  },
  {
    id: "garden",
    title: "Bring the garden to life",
    location: "Flower garden",
    x: -8,
    z: -9,
    resource: "seeds",
    icon: "spark",
    gather: "Gather the seed packets",
    action: "Plant the garden",
    goal: "A bare patch of earth is waiting. Count the seeds you can plant here.",
    success: "You made the island bloom!",
    effect: "Every seed you counted becomes a flower in the garden.",
  },
  {
    id: "portal",
    title: "Power the ancient portal",
    location: "Portal workshop",
    x: 0,
    z: -5.5,
    resource: "energy crystals",
    icon: "diamond",
    gather: "Inspect the power cells",
    action: "Power the portal",
    goal: "One last bit of number magic. Work out the energy for the ancient gate.",
    success: "The island is sparkling again!",
    effect: "The power cells glow, energy flows, and your portal wakes up.",
  },
];

export function activeQuest(collected) {
  return collected.findIndex((done) => !done);
}
export function questPhase(round, index) {
  if (round.collected[index]) return "done";
  if (index !== activeQuest(round.collected)) return "locked";
  return round.gathered?.[index] ? "solve" : "gather";
}
export function gatherQuest(round, index) {
  if (questPhase(round, index) !== "gather") return false;
  round.gathered[index] = true;
  return true;
}
export function finishQuest(round, index, answer) {
  if (
    questPhase(round, index) !== "solve" ||
    answer !== round.questions[index].answer
  )
    return false;
  round.collected[index] = true;
  return true;
}
export function questsFor(worldId = "meadow", round = null) {
  return round && round.layoutVersion !== 2
    ? QUESTS
    : ADVENTURES[worldId] || QUESTS;
}
export function describeQuest(index, q, worldId = "meadow", round = null) {
  const quest = questsFor(worldId, round)[index];
  if (quest.plus) {
    const plus = q.operator === "+";
    return {
      ...quest,
      story: (plus ? quest.plus : quest.minus)
        .replaceAll("{a}", q.a)
        .replaceAll("{b}", q.b),
      labels: quest.labels[plus ? 0 : 1],
    };
  }
  const { a, b, operator } = q;
  const plus = operator === "+";
  const stories = [
    plus
      ? `The cart has ${a} planks. The builders found ${b} more. How many planks can you take to the bridge altogether?`
      : `The cart has ${a} planks, but ${b} are cracked. How many good planks can you take to the bridge?`,
    plus
      ? `${a} planks are already laid. You have ${b} more to add. How many planks will the finished bridge have?`
      : `The bridge needs ${a} planks altogether. ${b} are already laid. How many more planks do you need?`,
    plus
      ? `One basket has ${a} apples and another has ${b}. How many apples can you put in the sheep's feeding trough?`
      : `You picked ${a} apples. Keep ${b} for the orchard animals. How many can you put in the sheep's trough?`,
    plus
      ? `One packet has ${a} seeds and another has ${b}. How many flowers can you plant altogether?`
      : `You have ${a} seeds. Save ${b} for the next island. How many flowers can you plant here?`,
    plus
      ? `One power cell holds ${a} energy crystals. The other holds ${b}. How many crystals can power the portal altogether?`
      : `The portal needs ${a} energy crystals. It already has ${b}. How many more should you add?`,
  ];
  const labels = [
    plus ? ["On the cart", "Found nearby"] : ["On the cart", "Cracked"],
    plus
      ? ["Already laid", "Ready to add"]
      : ["Needed in total", "Already laid"],
    plus ? ["First basket", "Second basket"] : ["Picked", "Keep for friends"],
    plus
      ? ["First packet", "Second packet"]
      : ["All the seeds", "Save for later"],
    plus
      ? ["Left power cell", "Right power cell"]
      : ["Needed in total", "Already charged"],
  ];
  return { ...QUESTS[index], story: stories[index], labels: labels[index] };
}
export function bridgePlan(questions) {
  const q = questions[1];
  return {
    total: q.operator === "+" ? q.answer : q.a,
    laid: q.operator === "+" ? q.a : q.b,
  };
}
