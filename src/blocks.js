// Stable numeric IDs: the first three match every existing saved creation.
export const BLOCKS = [
  ["Grass", "#89b65b", "Nature", "grass1"],
  ["Oak planks", "#c9a16b", "Building", "plank"],
  ["Crystal", "#8aefd6", "Special", "glow"],
  ["Stone", "#9a9eaa", "Building", "stone", "stone"],
  ["Cobblestone", "#7c8389", "Building", "cobble", "cobble"],
  ["Red brick", "#b56753", "Building", "brick", "brick"],
  ["Sandstone", "#e4c78b", "Building", "sandstone", "brick"],
  ["Glass", "#b8e9ed", "Building", "glass", "glass"],
  ["Blue glass", "#6cacd0", "Building", "blueglass", "glass"],
  ["Oak log", "#89633f", "Nature", "oaklog", "log"],
  ["Birch log", "#ded5b7", "Nature", "birch", "log"],
  ["Leaves", "#699a50", "Nature", "leaves", "leaves"],
  ["Blossom", "#eab6c9", "Nature", "blossom", "leaves"],
  ["Earth", "#8f6e52", "Nature", "earth", "stone"],
  ["Sand", "#e6cc90", "Nature", "sand", "stone"],
  ["Snow", "#f1f7ff", "Nature", "snow"],
  ["Ice", "#a3cfec", "Nature", "ice", "glass"],
  ["Water cube", "#57b4d6", "Nature", "watercube", "glass"],
  ["Obsidian", "#423b5d", "Building", "obsidian", "stone"],
  ["Steel", "#a6bcc4", "Building", "steel", "metal"],
  ["Gold", "#e9bf5d", "Building", "buildgold", "metal"],
  ["Red", "#d9655a", "Colours", "red"],
  ["Orange", "#e9994c", "Colours", "orange"],
  ["Yellow", "#f1d75e", "Colours", "yellow"],
  ["Lime", "#afd45c", "Colours", "lime"],
  ["Green", "#5eaa78", "Colours", "green"],
  ["Cyan", "#60c9c8", "Colours", "cyan"],
  ["Blue", "#608bd3", "Colours", "blue"],
  ["Purple", "#a17ed2", "Colours", "purple"],
  ["Pink", "#e9a1bd", "Colours", "pink"],
  ["White", "#f4eee1", "Colours", "buildwhite"],
  ["Black", "#35404c", "Colours", "black"],
  ["Glowstone", "#ffe19a", "Special", "glowstone", "glow"],
  ["Sea lantern", "#a5fff0", "Special", "lantern", "glow"],
  ["Checker tiles", "#ece1c4", "Building", "checker", "checker"],
  ["TNT", "#d66450", "Special", "tnt", "tnt"],
].map(([name, color, category, material, pattern], id) => ({
  id,
  name,
  color,
  category,
  material,
  pattern,
}));
export const TNT = 35;
export const CREATIVE_LIMIT = 8000;
export const CREATIVE_HEIGHT = 80;
export { CREATIVE_RADIUS } from "./creative-worlds.js";
export const DEFAULT_HOTBAR = [0, 1, 3, 5, 7, 9, 26, 32, TNT];
export function cleanHotbar(value) {
  return DEFAULT_HOTBAR.map((fallback, i) =>
    Number.isInteger(value?.[i]) && BLOCKS[value[i]] ? value[i] : fallback,
  );
}
export const blockKey = (b) => `${b.x},${b.y},${b.z}`;
export const blockData = (m) => ({
  x: m.position.x,
  y: m.position.y,
  z: m.position.z,
  type: m.userData.blockType ?? 0,
});
export function brushBlocks(mode, a, b, type) {
  const cells = [];
  const add = (x, y, z) => cells.push({ x, y, z, type });
  if (mode === "single") return [{ ...a, type }];
  if (
    Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z)) > 24
  )
    return [];
  if (mode === "floor") {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++)
      for (let z = Math.min(a.z, b.z); z <= Math.max(a.z, b.z); z++)
        add(x, a.y, z);
  } else if (mode === "wall") {
    const alongX = Math.abs(b.x - a.x) >= Math.abs(b.z - a.z);
    const start = alongX ? a.x : a.z,
      end = alongX ? b.x : b.z;
    for (let h = Math.min(a.y, b.y); h <= Math.max(a.y, b.y); h++)
      for (let t = Math.min(start, end); t <= Math.max(start, end); t++)
        add(alongX ? t : a.x, h, alongX ? a.z : t);
  } else {
    const steps = Math.max(
      Math.abs(b.x - a.x),
      Math.abs(b.y - a.y),
      Math.abs(b.z - a.z),
    );
    for (let i = 0; i <= steps; i++) {
      const p = steps ? i / steps : 0;
      add(
        Math.round(a.x + (b.x - a.x) * p),
        a.y + Math.round((b.y - a.y) * p),
        Math.round(a.z + (b.z - a.z) * p),
      );
    }
  }
  return [...new Map(cells.map((c) => [blockKey(c), c])).values()];
}
export const BLUEPRINTS = [
  {
    id: "cottage",
    name: "Cosy cottage",
    description: "Windows, a doorway and a stepped roof.",
  },
  {
    id: "castle",
    name: "Mini castle",
    description: "Four towers, battlements and a courtyard.",
  },
  {
    id: "tower",
    name: "Rainbow tower",
    description: "A colourful tower, perfect for a TNT experiment.",
  },
  {
    id: "rocket",
    name: "Pixel rocket",
    description: "Build your own spaceship and launchpad.",
  },
];
export function blueprintBlocks(id, origin, rotation = 0) {
  const map = new Map();
  const add = (x, y, z, type) => {
    for (let i = 0; i < rotation % 4; i++) [x, z] = [-z, x];
    const b = { x: origin.x + x, y: origin.y + y, z: origin.z + z, type };
    map.set(blockKey(b), b);
  };
  if (id === "cottage") {
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++) {
        add(x, 0, z, 1);
        for (let y = 1; y <= 4; y++)
          if (Math.abs(x) === 3 || Math.abs(z) === 3) {
            if (z === 3 && Math.abs(x) <= 0 && y < 3) continue;
            add(
              x,
              y,
              z,
              (y === 2 || y === 3) &&
                ((Math.abs(x) === 3 && Math.abs(z) <= 1) ||
                  (Math.abs(z) === 3 && Math.abs(x) === 2))
                ? 7
                : 9,
            );
          }
      }
    for (let y = 0; y < 4; y++)
      for (let x = -4 + y; x <= 4 - y; x++)
        for (let z = -4; z <= 4; z++)
          if (Math.abs(x) === 4 - y || y === 3) add(x, 5 + y, z, 5);
  }
  if (id === "castle") {
    for (let x = -5; x <= 5; x++)
      for (let z = -5; z <= 5; z++) {
        add(x, 0, z, 4);
        if (Math.abs(x) === 5 || Math.abs(z) === 5)
          for (let y = 1; y <= 4; y++) {
            if (z === 5 && Math.abs(x) <= 1 && y < 4) continue;
            if (y < 4 || (x + z) % 2 === 0) add(x, y, z, 3);
          }
      }
    for (const cx of [-5, 5])
      for (const cz of [-5, 5])
        for (let x = -1; x <= 1; x++)
          for (let z = -1; z <= 1; z++)
            for (let y = 0; y <= 7; y++)
              if (Math.abs(x) === 1 || Math.abs(z) === 1)
                if (y < 7 || (x + z) % 2 === 0)
                  add(cx + x, y, cz + z, y === 6 ? 20 : 4);
  }
  if (id === "tower")
    for (let y = 0; y < 12; y++)
      for (let x = -2; x <= 2; x++)
        for (let z = -2; z <= 2; z++)
          if (y === 0 || y === 11 || Math.abs(x) === 2 || Math.abs(z) === 2)
            add(x, y, z, 21 + (y % 10));
  if (id === "rocket") {
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++) add(x, 0, z, 19);
    for (let y = 1; y <= 9; y++)
      for (let x = -1; x <= 1; x++)
        for (let z = -1; z <= 1; z++) add(x, y, z, y === 7 && z === 1 ? 8 : 30);
    for (let y = 1; y < 4; y++)
      for (const x of [-2, 2]) for (let z = -1; z <= 1; z++) add(x, y, z, 21);
    for (let y = 10; y < 13; y++) add(0, y, 0, y === 12 ? 20 : 21);
  }
  return [...map.values()];
}
