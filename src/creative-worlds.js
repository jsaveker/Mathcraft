// The original village keeps its save key and a flat centre so existing builds stay put.
export const CREATIVE_RADIUS = 128;
export const CREATIVE_WORLDS = [
  {
    id: "village",
    theme: "meadow",
    name: "Grassland Valley",
    subtitle: "Your original village, with a whole valley beyond.",
    description:
      "Green meadows, woodland groves and rolling hills. Make a town, a farm or a sprawling castle.",
    colour: "#88b968",
    sky: "#c9e4e8",
    sites: [
      "Home village",
      "East meadow",
      "Woodland clearing",
      "Hilltop gardens",
      "South commons",
    ],
  },
  {
    id: "creative-moon",
    theme: "moon",
    name: "Moon Frontier",
    subtitle: "A giant leap for your next creation.",
    description:
      "Crater rims, lunar plains and Earth in a star-filled sky. Build a moonbase, a rover garage or a space city.",
    colour: "#a7b5d3",
    sky: "#192b52",
    sites: [
      "Landing zone",
      "Tranquility plain",
      "Crater camp",
      "Observatory flats",
      "Rocket range",
    ],
  },
  {
    id: "creative-sky",
    theme: "sky",
    name: "Cloud Kingdom",
    subtitle: "Room for castles above the clouds.",
    description:
      "Floating terraces, distant sky islands and drifting clouds. Build an airship harbour or a kingdom in the sky.",
    colour: "#a0dace",
    sky: "#bee9ff",
    sites: [
      "Sky landing",
      "Airship meadow",
      "Cloud garden",
      "North terrace",
      "Sunrise field",
    ],
  },
  {
    id: "creative-sunset",
    theme: "sunset",
    name: "Desert Horizons",
    subtitle: "Dream big under a golden sky.",
    description:
      "Wide sandy plains, rippled dunes, an oasis and distant pyramids. Make a desert palace or a lost city.",
    colour: "#dfba71",
    sky: "#f4d0a0",
    sites: [
      "Desert camp",
      "Golden sands",
      "Oasis clearing",
      "Mesa outlook",
      "Palace grounds",
    ],
  },
  {
    id: "creative-cavern",
    theme: "cavern",
    name: "Crystal Highlands",
    subtitle: "Build beneath the northern lights.",
    description:
      "Snowy ridges, enormous violet crystals and a shimmering aurora. Create an ice fortress or a crystal city.",
    colour: "#b39cde",
    sky: "#263354",
    sites: [
      "Crystal camp",
      "Frost meadow",
      "Amethyst field",
      "Aurora outlook",
      "Snow plain",
    ],
  },
];
export const creativeWorld = (id) => CREATIVE_WORLDS.find((w) => w.id === id);
export const isCreativeWorld = (id) => !!creativeWorld(id);
const SITE_POSITIONS = [
  [0, 6],
  [72, 0],
  [-66, 26],
  [0, -76],
  [46, 76],
];
export const creativeSites = (id) =>
  (creativeWorld(id)?.sites || []).map((name, i) => ({
    name,
    x: SITE_POSITIONS[i][0],
    z: SITE_POSITIONS[i][1],
  }));
const peak = (x, z, cx, cz, r, h) =>
  Math.max(0, 1 - Math.hypot(x - cx, z - cz) / r) * h;
export function creativeHeight(id, x, z) {
  if (Math.hypot(x, z) > CREATIVE_RADIUS) return null;
  const theme = creativeWorld(id)?.theme;
  if (!theme) return null;
  // Every destination has a broad, flat foundation, and the original village
  // retains all of its old ground heights and coordinates.
  const clearance = Math.min(
    Math.hypot(x, z) - 44,
    ...SITE_POSITIONS.slice(1).map(
      ([cx, cz]) => Math.hypot(x - cx, z - cz) - 27,
    ),
  );
  if (clearance <= 0) return 1;
  const blend = Math.min(1, clearance / 10);
  let variation = 0;
  if (theme === "meadow")
    variation =
      peak(x, z, -69, -72, 42, 17) +
      peak(x, z, 92, 61, 36, 10) +
      Math.max(0, Math.sin(x * 0.035) * Math.cos(z * 0.04) * 3);
  if (theme === "sunset")
    variation =
      (1 + Math.sin(x * 0.095 + Math.sin(z * 0.035) * 2)) * 2.5 +
      peak(x, z, -84, -68, 30, 14);
  if (theme === "cavern")
    variation =
      peak(x, z, -69, -82, 36, 27) +
      peak(x, z, 50, -90, 29, 21) +
      peak(x, z, -96, -26, 28, 17) +
      Math.max(0, Math.sin(x * 0.05) * 2);
  if (theme === "sky")
    variation = Math.hypot(x, z) > 103 ? 5 : Math.hypot(x, z) > 74 ? 2 : 0;
  if (theme === "moon") {
    variation = 1;
    for (const [cx, cz, r] of [
      [45, -48, 14],
      [-63, -63, 19],
      [92, 40, 12],
    ]) {
      const distance = Math.hypot(x - cx, z - cz);
      variation += Math.max(0, 1 - Math.abs(distance - r) / 5) * 8;
    }
  }
  return 1 + Math.floor(variation * blend);
}
export function createCreativeTerrain(id) {
  const terrain = new Map();
  for (let x = -CREATIVE_RADIUS; x <= CREATIVE_RADIUS; x++)
    for (let z = -CREATIVE_RADIUS; z <= CREATIVE_RADIUS; z++) {
      const h = creativeHeight(id, x, z);
      if (h !== null) terrain.set(`${x},${z}`, h + 0.5);
    }
  return terrain;
}
