import {
  BLOCKS,
  CREATIVE_LIMIT,
  CREATIVE_HEIGHT,
  cleanHotbar,
} from "./blocks.js";
import { DEFAULT_SAVE, readSave, WORLDS } from "./maths.js";

export const FAMILY_KEY = "mathcraft-family-v2";
export const AVATARS = ["fox", "astronaut", "dragon", "panda"];
export const BUILD_WORLDS = ["village", ...WORLDS.map((w) => w.id)];
export const MAX_BLOCKS = 600;
const integer = (n, fallback, max = 100000) =>
  Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
export const profileName = (name) =>
  String(name || "Explorer")
    .trim()
    .slice(0, 20) || "Explorer";

export function validateBlocks(blocks, worldId = "meadow") {
  const creative = worldId === "village";
  const seen = new Set();
  return (Array.isArray(blocks) ? blocks : [])
    .filter((b) => {
      if (
        !b ||
        !Number.isInteger(b.x) ||
        !Number.isInteger(b.z) ||
        Math.abs(b.x) > 45 ||
        Math.abs(b.z) > 45 ||
        !Number.isFinite(b.y) ||
        b.y < -2 ||
        b.y > (creative ? CREATIVE_HEIGHT : 30) ||
        !(creative
          ? Number.isInteger(b.type) && BLOCKS[b.type]
          : [0, 1, 2].includes(b.type))
      )
        return false;
      const key = `${b.x},${b.y},${b.z}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, creative ? CREATIVE_LIMIT : MAX_BLOCKS)
    .map(({ x, y, z, type }) => ({ x, y, z, type }));
}
export function newProfile(
  name = "Explorer 1",
  avatar = "fox",
  id = globalThis.crypto.randomUUID(),
) {
  return {
    id,
    name: profileName(name),
    avatar: AVATARS.includes(avatar) ? avatar : "fox",
    progress: structuredClone(DEFAULT_SAVE),
    inventory: 36,
    hotbar: cleanHotbar(),
    builds: {},
    discoveries: [],
  };
}
function validateProfile(p) {
  const clean = newProfile(p.name, p.avatar, p.id);
  clean.progress = readSave({ getItem: () => JSON.stringify(p.progress) });
  clean.inventory = integer(p.inventory, 36);
  clean.hotbar = cleanHotbar(p.hotbar);
  clean.builds = Object.fromEntries(
    BUILD_WORLDS.map((id) => [id, validateBlocks(p.builds?.[id], id)]),
  );
  clean.discoveries = [
    ...new Set(
      (Array.isArray(p.discoveries) ? p.discoveries : []).filter((x) =>
        WORLDS.map((w) => w.id).includes(x),
      ),
    ),
  ];
  return clean;
}
export function loadFamily(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(FAMILY_KEY) || "null");
    if (saved?.version === 2 && Array.isArray(saved.profiles)) {
      const seen = new Set();
      const profiles = saved.profiles
        .filter(
          (p) =>
            p &&
            typeof p.id === "string" &&
            p.id.length < 100 &&
            !seen.has(p.id) &&
            seen.add(p.id),
        )
        .slice(0, 6)
        .map(validateProfile);
      if (profiles.length)
        return {
          version: 2,
          revision: integer(saved.revision, 0),
          activeId: profiles.some((p) => p.id === saved.activeId)
            ? saved.activeId
            : profiles[0].id,
          profiles,
        };
    }
  } catch {
    /* Retain the original save and recover below. */
  }
  const profile = newProfile();
  profile.progress = readSave(storage);
  // Old builds were never saved. Preserve all earned maths progress and materials.
  profile.inventory =
    36 + Math.min(100000 - 36, profile.progress.totalCrystals * 3);
  return { version: 2, revision: 0, activeId: profile.id, profiles: [profile] };
}
export const activeProfile = (family) =>
  family.profiles.find((p) => p.id === family.activeId) || family.profiles[0];
export function persistFamily(family, storage = globalThis.localStorage) {
  try {
    const current = JSON.parse(storage.getItem(FAMILY_KEY) || "null");
    if (current?.version === 2 && current.revision > family.revision)
      return "conflict";
    const next = { ...family, revision: family.revision + 1 };
    storage.setItem(FAMILY_KEY, JSON.stringify(next));
    family.revision = next.revision;
    return "saved";
  } catch {
    return "unavailable";
  }
}
export function addProfile(family, name, avatar) {
  if (family.profiles.length >= 6) return null;
  const profile = newProfile(name, avatar);
  family.profiles.push(profile);
  family.activeId = profile.id;
  return profile;
}
export function recordBuilding(profile, worldId, blocks, inventory) {
  if (!BUILD_WORLDS.includes(worldId)) return;
  profile.builds[worldId] = validateBlocks(blocks, worldId);
  profile.inventory = integer(inventory, profile.inventory);
}

export function claimDiscovery(profile, worldId) {
  if (
    !WORLDS.map((w) => w.id).includes(worldId) ||
    profile.discoveries.includes(worldId)
  )
    return false;
  profile.discoveries.push(worldId);
  profile.inventory += 12;
  return true;
}
