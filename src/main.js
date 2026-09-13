import {
  CREATIVE_WORLDS,
  CREATIVE_RADIUS,
  creativeWorld,
  creativeSites,
} from "./creative-worlds.js";
import "@fontsource-variable/outfit/index.css";
import "@fontsource-variable/dm-sans/wght.css";
import "./style.css";
import { IslandWorld, SHRINES, PORTAL } from "./world.js";
import {
  questsFor,
  activeQuest,
  questPhase,
  gatherQuest,
  finishQuest,
  describeQuest,
} from "./quests.js";
import { WORLDS, createRound, hintFor } from "./maths.js";
import {
  recordPractice,
  preparePractice,
  learningLabel,
  cleanLearning,
} from "./learning.js";

import {
  loadFamily,
  activeProfile,
  persistFamily,
  addProfile,
  profileName,
  AVATARS,
  FAMILY_KEY,
  recordBuilding,
  claimDiscovery,
} from "./profiles.js";
import { avatarArt, escapeHtml } from "./explorer-art.js";
import { LANDMARKS } from "./biomes.js";
import { BLOCKS, BLUEPRINTS, CREATIVE_LIMIT } from "./blocks.js";

const icons = {
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
  diamond: '<path d="m12 2 7 10-7 10-7-10zM5 12h14M12 2v20"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  sound:
    '<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
  settings:
    '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m10 2-.7 3-2 .9-2.8-1L2 9l2.2 2v2L2 15l2.5 4.1 2.8-1 2 .9.7 3h4l.7-3 2-.9 2.8 1L22 15l-2.2-2v-2L22 9l-2.5-4.1-2.8 1-2-.9L14 2Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 22V3m0 1c5-5 9 5 15 0v11c-6 5-10-5-15 0"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M12 6v15M2 4c4-1 7 0 10 2 3-2 6-3 10-2v15c-4-1-7 0-10 2-3-2-6-3-10-2Z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5m0 3v1"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v12h5v-7h4v7h5V9"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>',
  trophy:
    '<path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v6m-5 0h10"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const cubeArt = (theme = "meadow") => {
  const art = {
    meadow:
      '<path fill="#8f694e" d="M40 40V21h8v20l-4 3Z"/><path fill="#72ac62" d="m27 14 17-9 18 9v18l-18 9-17-9Z"/><path fill="#9bc880" d="m27 14 17-9 18 9-18 10Z"/>',
    cavern:
      '<path fill="#a6cddd" d="m16 46 19-36 17 34Z"/><path fill="#efffff" d="m27 24 8-14 7 14-7-4Z"/><path fill="#b291ef" d="m41 38 10-29 13 28-12 13Z"/><path fill="#e4cdff" d="m51 9 1 41 12-13Z"/>',
    sunset:
      '<path fill="#edbd69" d="M19 49 45 13 72 49Z"/><path fill="#c5914b" d="M45 13v40l27-4Z"/><path fill="#704d39" d="M40 49V38h10v12Z"/><circle fill="#ffe8a1" cx="68" cy="16" r="8"/>',
    sky: '<path fill="#bfedf5" d="M14 25q4-18 31-18t31 18q-4 15-31 15T14 25Z"/><path fill="#6aabc6" d="M15 25h60v5H15Z"/><path fill="#937251" d="M34 43h23v9H34Z"/><path stroke="#b29256" stroke-width="2" d="m35 36 3 7m17-7-3 7"/>',
    moon: '<path fill="#eaf5ff" d="M34 40V17L45 4l11 13v23Z"/><path fill="#e18c7a" d="m34 29-8 15h8m22-15 8 15h-8"/><path fill="#f8c468" d="m37 41 8 18 8-18Z"/><circle cx="45" cy="24" r="6" fill="#69b8e9"/>',
  };
  return `<svg viewBox="0 0 90 82" class="island-icon ${theme}" aria-hidden="true"><path class="soil-face" d="m12 43 33-18 33 18v18L45 79 12 61Z"/><path class="side-face" d="M45 61v18L12 61V43Z"/><path class="grass-face" d="m12 43 33-18 33 18-33 18Z"/>${art[theme] || art.meadow}</svg>`;
};
let family = loadFamily();
let profile = activeProfile(family);
let save = profile.progress;
let villageMode = false;
let landmarkReveal = false;
let selected = 0,
  round = null,
  activeChallenge = -1,
  attempts = 0,
  currentScreen = "home",
  world,
  toastTimer,
  firstSession = true;
const currentQuests = () => questsFor(WORLDS[selected].id, round);
let audioCtx;
function sound(kind) {
  if (!save.sound) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    if (kind === "boom") {
      const buffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * 0.65,
        audioCtx.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
      const noise = audioCtx.createBufferSource(),
        filter = audioCtx.createBiquadFilter(),
        gain = audioCtx.createGain();
      noise.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = 700;
      gain.gain.value = 0.18;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
      return;
    }
    const notes =
      kind === "success"
        ? [523.25, 659.25, 783.99, 1046.5]
        : kind === "complete"
          ? [523, 659, 784, 1046, 1318]
          : kind === "tap"
            ? [420]
            : [260, 310];
    notes.forEach((hz, i) => {
      const o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = hz;
      g.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.11);
      g.gain.linearRampToValueAtTime(
        0.07,
        audioCtx.currentTime + i * 0.11 + 0.02,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + i * 0.11 + 0.45,
      );
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + i * 0.11);
      o.stop(audioCtx.currentTime + i * 0.11 + 0.5);
    });
  } catch {
    /* Sound is optional. */
  }
}
function saveNow() {
  const result = persistFamily(family);
  if (result !== "saved")
    toast(
      result === "conflict"
        ? "Another tab has a newer save. Reload this page before continuing."
        : "Your browser cannot save right now. Keep this page open to avoid losing changes.",
    );
  $("#save-status").textContent =
    result === "saved"
      ? "Village, builds & progress saved on this device"
      : "Changes are not saved — check browser storage";
  $("#save-status").classList.toggle("save-warning", result !== "saved");
  updateStats();
}

document.querySelector("#app").innerHTML = `
 <main id="home-screen">
   <header class="site-header">
     <a class="brand" href="#" aria-label="Mathcraft home"><span class="brand-cube">${icon("cube")}</span><span>mathcraft<span class="brand-dot">.</span><small>SMALL NUMBERS. BIG WORLDS.</small></span></a>
     <nav class="main-nav" aria-label="Main navigation"><button class="nav-item active" id="nav-play">Play<span></span></button><button class="nav-item" id="nav-worlds">Your worlds</button><button class="nav-item" id="nav-how">How to play</button></nav>
     <div class="header-right"><span class="crystal-count">${icon("diamond")}<b id="total-crystals">0</b></span><button id="settings-home" class="icon-button parent-button" aria-label="Parent settings">${icon("settings")}</button><button class="explorer-chip" id="explorers" aria-label="Switch explorer"></button></div>
   </header>
   <section class="hero" aria-labelledby="hero-title">
     <div class="eyebrow"><span class="live-dot"></span> AN ADVENTURE THAT ADDS UP</div>
     <h1 id="hero-title">Big adventures.<br>Little <span>numbers.</span></h1>
     <p class="hero-description">Uncover fossils. Fly an airship. Launch a rocket.<br>Five worlds, five different adventures.</p>
     <button class="primary-button hero-play" id="start-adventure">Let's play ${icon("arrow")}</button>
     <button class="village-entry" id="visit-village">${icon("home")} <span>My village<small>Your own place to build & keep</small></span>${icon("arrow")}</button><div class="play-note" id="save-status">Village, builds & progress saved on this device</div>
     <div class="learning-tags"><span><b>+</b> Addition</span><span><b>−</b> Subtraction</span><span id="range-tag">Up to 100</span></div>
   </section>
   <div class="scene-caption"><span class="caption-line"></span><span id="scene-biome">01 / THE GRASSLANDS</span></div>
   <div class="world-callout"><span class="callout-star">${icon("spark")}</span><div>A little maths.<br><strong>A whole lot of possibility.</strong></div></div>
   <section class="worlds-section" id="worlds-section" aria-labelledby="worlds-title"><div class="section-heading"><h2 id="worlds-title">Your next adventure</h2><span>${WORLDS.length} worlds. 25 things to make happen.</span></div><div class="world-cards" id="world-cards"></div></section>
   <footer class="home-footer"><span><i class="live-dot"></i> MADE FOR CURIOUS MINDS</span><span>No timers. No pressure. Just play.</span><button id="sound-home" aria-label="Mute sound">${icon("sound")} Sound on</button></footer>
 </main>
 <section id="game-hud" hidden aria-label="Game controls and progress">
   <div class="hud-top"><button id="pause" class="hud-brand" aria-label="Pause game">${icon("cube")} <b>mathcraft.</b><span>Ⅱ</span></button><div class="compass"><span>W</span><span>·</span><b id="heading">N</b><span>·</span><span>E</span></div><div class="hud-totals">${icon("diamond")} <b id="round-crystals">0 / 5</b><button id="sound-game" class="icon-button" aria-label="Mute sound">${icon("sound")}</button></div></div>
   <div class="quest-panel"><div class="eyebrow">${icon("flag")} <span id="quest-eyebrow">ISLAND HELPERS</span></div><h2 id="quest-title">Gather bridge planks</h2><p id="quest-description">The builders need a hand.</p><div id="quest-crystals" class="quest-crystals"></div><div id="quest-supplies" class="quest-supplies"></div><button id="guide">${icon("compass")} G · Take me to the next crystal ${icon("arrow")}</button><button id="change-build-worlds" hidden>Change world <kbd>M</kbd></button></div>
   <div class="minimap" aria-label="Island map"><span class="map-label">MEADOW ISLES</span><div class="map-land"></div><span class="map-portal">▣</span>${SHRINES.map((p, i) => `<span class="map-crystal" data-map="${i}" style="left:${50 + p.x * 1.55}%;top:${50 + p.z * 1.55}%">${i + 1}</span>`).join("")}<span id="map-player">▲</span><span class="map-north">N</span><span id="map-coordinates" hidden></span></div>
   <div id="crosshair" aria-hidden="true">+</div>
   <button id="interaction" class="interact-prompt" hidden><kbd>E</kbd> <span>Solve the number crystal</span></button>
   <div class="hotbar-wrap"><div class="build-label" id="build-label">YOUR EXPLORER'S KIT <span>Press B to build</span></div><div class="hotbar"><div id="block-slots"></div><span class="stock-label"><b id="block-stock">12</b> blocks</span><button class="build-button" id="build-toggle">${icon("cube")} Build</button></div></div>
   <div id="creative-toolbar" hidden aria-label="Creative building tools"><button id="open-palette">${icon("cube")} Blocks <kbd>E</kbd></button><button id="open-tools">${icon("settings")} Tools <kbd>T</kbd></button><button id="fly-toggle">Fly <kbd>F</kbd></button><button id="undo-build" title="Undo this visit’s last action">Undo <kbd>Z</kbd></button><button id="redo-build" title="Redo this visit’s last undone action">Redo <kbd>Y</kbd></button><button id="ignite-tnt">Light TNT <kbd>Q</kbd></button><button id="rotate-build" hidden>Rotate ↻ <kbd>R</kbd></button><span id="creative-status" role="status"></span></div>
   <div class="travel-tools"><button id="game-village">${icon("home")} Village <kbd>V</kbd></button><button id="landmark-guide">${icon("spark")} Discover <kbd>L</kbd></button><button id="game-profiles" aria-label="Switch explorer">${icon("settings")}</button></div><div class="controls-strip"><span><kbd>W A S D</kbd> Move</span><span><i class="mouse-icon"></i> Look</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>E</kbd> Explore</span><span><kbd>ESC</kbd> Pause</span></div>
   <div class="touch-controls"><div class="dpad"><button data-move="forward" aria-label="Move forward">▲</button><button data-move="left" aria-label="Move left">◀</button><button data-move="back" aria-label="Move backward">▼</button><button data-move="right" aria-label="Move right">▶</button></div><div class="touch-actions"><button id="touch-place">Place</button><button id="touch-mine">Mine</button><button id="touch-jump">Jump ↑</button><button id="touch-down" hidden>Down ↓</button></div></div>
 </section>
 <section id="quest-reveal" hidden aria-label="Your maths changed the island"><div class="reveal-card"><div class="eyebrow">LOOK WHAT YOU MADE HAPPEN</div><h2 id="reveal-title"></h2><p id="reveal-description"></p><button class="primary-button" id="finish-reveal">Keep exploring ${icon("arrow")}</button></div></section>
 <div id="toast" role="status" aria-live="polite"></div>
 <dialog id="modal" aria-labelledby="modal-title"><div id="modal-content"></div></dialog>
 <div id="loading"><span class="brand-cube">${icon("cube")}</span><strong>Growing your island…</strong><span>Planting a little possibility.</span></div>`;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function updateStats() {
  $("#total-crystals").textContent = save.totalCrystals;
  $("#explorers").innerHTML =
    `${avatarArt(profile.avatar)}<span>${escapeHtml(profile.name)}</span>`;
  $("#visit-village span").innerHTML =
    `${escapeHtml(profile.name)}’s build worlds<small>5 landscapes · 12× more room · unlimited materials</small>`;
  $("#range-tag").textContent = `Up to ${save.range}`;
  $("#sound-home").innerHTML =
    `${icon(save.sound ? "sound" : "mute")} Sound ${save.sound ? "on" : "off"}`;
  $("#sound-home").setAttribute(
    "aria-label",
    save.sound ? "Mute sound" : "Enable sound",
  );
  $("#sound-game").innerHTML = icon(save.sound ? "sound" : "mute");
  $("#sound-game").setAttribute(
    "aria-label",
    save.sound ? "Mute sound" : "Enable sound",
  );
}
function unlocked(i) {
  return i === 0 || save.completed.includes(WORLDS[i - 1].id);
}
function renderCards() {
  $("#world-cards").innerHTML = WORLDS.map(
    (w, i) =>
      `<button class="world-card ${selected === i ? "selected" : ""} ${!unlocked(i) ? "locked" : ""}" data-world="${i}" aria-label="${w.name}${!unlocked(i) ? ", locked" : ""}" aria-pressed="${selected === i}">${cubeArt(w.id)}<span class="world-card-info"><span class="world-number">WORLD 0${i + 1} ${save.completed.includes(w.id) ? "· COMPLETED" : ""}</span><strong>${w.name}</strong><span class="world-card-status">${unlocked(i) ? `${icon("spark")} ${selected === i ? "Ready to explore" : "Let’s explore"}` : `${icon("lock")} Finish ${WORLDS[i - 1].name}`}</span></span><span class="world-card-arrow">${icon(unlocked(i) ? "arrow" : "lock")}</span></button>`,
  ).join("");
  $$("[data-world]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.world);
      if (!unlocked(i)) {
        toast(`Complete ${WORLDS[i - 1].name} to unlock this adventure.`);
        return;
      }
      selected = i;
      previewWorld();
      $("#scene-biome").textContent = `0${i + 1} / ${WORLDS[i].biome}`;
      renderCards();
      sound("tap");
    }),
  );
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4200);
}
function showModal(html, mode = "pause", creative = false) {
  $("#modal").classList.toggle("creative-modal", creative);
  if (currentScreen === "play") world?.setMode(mode);
  $("#modal-content").innerHTML = html;
  if (!$("#modal").open) $("#modal").showModal();
}
function closeModal(resume = true) {
  $("#modal").close();
  if (resume && currentScreen === "play") {
    world.setMode("play");
    if (!matchMedia("(pointer: coarse)").matches) world.lock();
  }
}
function modalClose(label = "Close") {
  return `<button class="modal-close icon-button" id="modal-close" aria-label="${label}">${icon("close")}</button>`;
}
function bindClose(resume = true) {
  $("#modal-close")?.addEventListener("click", () => closeModal(resume));
}
function renderHotbar() {
  const ids = villageMode ? world.hotbar : [0, 1, 2];
  $("#block-slots").innerHTML = ids
    .map(
      (id, i) =>
        `<button class="tool-slot ${world.selectedSlot === i ? "selected" : ""}" data-slot="${i}" aria-label="Select ${BLOCKS[id].name}" title="${i + 1} · ${BLOCKS[id].name}"><kbd>${i + 1}</kbd>${blockSwatch(BLOCKS[id])}</button>`,
    )
    .join("");
  $$("[data-slot]").forEach(
    (b) => (b.onclick = () => world.selectSlot(Number(b.dataset.slot))),
  );
}
function blockSwatch(b) {
  return `<span class="palette-cube pattern-${b.pattern || "solid"}" style="--block-color:${b.color}">${b.id === 35 ? "TNT" : ""}</span>`;
}
function updateCreativeUI() {
  if (!world || !villageMode || !world.builder) return;
  const builder = world.builder;
  $("#rotate-build").hidden = !builder.mode.startsWith("stamp:");
  $("#fly-toggle").classList.toggle("active", world.flying);
  $("#fly-toggle").innerHTML = `${world.flying ? "Land" : "Fly"} <kbd>F</kbd>`;
  $("#touch-jump").textContent = world.flying ? "Up ↑" : "Jump ↑";
  $("#touch-down").hidden = !world.flying;
  $("#undo-build").disabled = !builder.undoStack.length && !builder.fuses.size;
  $("#redo-build").disabled = !builder.redoStack.length || !!builder.fuses.size;
  const mode =
    BLUEPRINTS.find((b) => `stamp:${b.id}` === builder.mode)?.name ||
    { single: "Single block", line: "Line", floor: "Floor", wall: "Wall" }[
      builder.mode
    ];
  $("#creative-status").textContent = builder.fuses.size
    ? `TNT lit · ${builder.fuses.size} fuse${builder.fuses.size === 1 ? "" : "s"} · Z stops it`
    : `${BLOCKS[world.selectedBlock].name} · ${mode}${builder.anchor ? " · Choose second corner" : ""}${world.flying ? " · Flying" : ""}`;
}
function showPalette() {
  if (!villageMode) return;
  showModal(
    `${modalClose()}<div class="eyebrow">THE CREATIVE COLLECTION</div><h2 id="modal-title">What will you build?</h2><p class="modal-description">36 blocks. Unlimited imagination. Choose a block for hotbar slot <strong>${world.selectedSlot + 1}</strong>. Press 1–9 to change slots while playing.</p><div class="palette-filters" role="group" aria-label="Block categories">${["All", "Building", "Nature", "Colours", "Special"].map((c, i) => `<button data-category="${c}" aria-pressed="${i === 0}">${c}</button>`).join("")}</div><div class="block-library">${BLOCKS.map((b) => `<button data-block="${b.id}" data-kind="${b.category}" title="${b.name}" ${b.id === world.selectedBlock ? 'class="chosen"' : ""}>${blockSwatch(b)}<span>${b.name}</span></button>`).join("")}</div><p class="gentle-note">Glass and ice are see-through. Water cubes stay where you place them.<br>TNT: place it, aim at it, then press Q. Z stops the fuse or rebuilds the blast.</p>`,
    "pause",
    true,
  );
  bindClose();
  $$("[data-category]").forEach(
    (button) =>
      (button.onclick = () => {
        $$("[data-category]").forEach((b) =>
          b.setAttribute("aria-pressed", String(b === button)),
        );
        $$("[data-block]").forEach(
          (b) =>
            (b.hidden =
              button.dataset.category !== "All" &&
              b.dataset.kind !== button.dataset.category),
        );
      }),
  );
  $$("[data-block]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = Number(b.dataset.block);
        profile.hotbar[world.selectedSlot] = id;
        world.hotbar = [...profile.hotbar];
        world.selectSlot(world.selectedSlot);
        saveNow();
        renderHotbar();
        closeModal();
        toast(
          `${BLOCKS[id].name} ready in slot ${world.selectedSlot + 1}. Right click or tap Place to build.`,
        );
      }),
  );
}
function showBuildTools() {
  if (!villageMode) return;
  const brushes = [
    [
      "single",
      "Single block",
      "Place one cube at a time. Hold to keep building.",
    ],
    ["line", "Line", "Place two ends to connect them with blocks."],
    ["floor", "Floor", "Place two opposite corners for a flat rectangle."],
    ["wall", "Wall", "Place a bottom corner and an opposite top corner."],
  ];
  showModal(
    `${modalClose()}<div class="eyebrow">THINK BIG. BUILD BIGGER.</div><h2 id="modal-title">Your building workshop</h2><p class="modal-description">Choose a tool, then aim and place. Fly with F to reach high corners or place blocks in midair. Every design has a preview before you place it.</p><div class="build-tools-grid">${brushes.map(([id, name, desc]) => `<button data-brush="${id}" class="${world.builder.mode === id ? "chosen" : ""}">${icon(id === "single" ? "cube" : id === "line" ? "arrow" : id === "wall" ? "home" : "flag")}<strong>${name}</strong><span>${desc}</span></button>`).join("")}</div><h3 class="blueprints-title">Ready-made wonders</h3><div class="build-tools-grid blueprints">${BLUEPRINTS.map((b) => `<button data-brush="stamp:${b.id}" class="${world.builder.mode === `stamp:${b.id}` ? "chosen" : ""}">${icon(b.id === "rocket" ? "spark" : b.id === "castle" ? "flag" : "home")}<strong>${b.name}</strong><span>${b.description}</span></button>`).join("")}</div><p class="gentle-note">R rotates a blueprint. Lines, walls and floors can span up to 24 blocks.<br>Z undoes a whole design or blast. Y redoes it. Undo remembers your last 24 actions during this visit.</p>`,
    "pause",
    true,
  );
  bindClose();
  $$("[data-brush]").forEach(
    (b) =>
      (b.onclick = () => {
        world.builder.choose(b.dataset.brush);
        setBuild(true);
        closeModal();
        toast(
          b.dataset.brush.startsWith("stamp:")
            ? "Aim at an open plot. R rotates the preview. Place builds the whole design."
            : b.dataset.brush === "single"
              ? "Single blocks ready. Hold right click to keep building."
              : "Place the first corner, then aim and place the second. Open Tools to cancel.",
        );
      }),
  );
}
function updateHud() {
  $("#game-hud").classList.toggle("creative-mode", villageMode);
  $("#creative-toolbar").hidden = !villageMode;
  $("#change-build-worlds").hidden = !villageMode;
  $("#map-coordinates").hidden = !villageMode;
  $("#quest-eyebrow").textContent = villageMode
    ? "CREATIVE WORLD"
    : "ISLAND HELPERS";
  $("#touch-down").hidden = !villageMode || !world.flying;
  $("#touch-jump").textContent =
    villageMode && world.flying ? "Up ↑" : "Jump ↑";
  $("#landmark-guide").hidden = villageMode || !LANDMARKS[WORLDS[selected].id];
  $(".minimap").classList.toggle("village-map", villageMode);
  $("#game-village").innerHTML =
    `${icon(villageMode ? "compass" : "home")} ${villageMode ? "Adventures" : "Village"} <kbd>V</kbd>`;
  if (villageMode) {
    $("#round-crystals").textContent = save.totalCrystals;
    const destination = creativeWorld(world.themeId);
    $("#quest-title").textContent = destination.name;
    $("#quest-description").textContent =
      "256 blocks across. Build anywhere, or travel to a wide open site. Every world keeps its own creations.";
    $("#quest-crystals").innerHTML = avatarArt(profile.avatar);
    $("#quest-supplies").innerHTML =
      `${icon("check")} <span>${world.blocks.size.toLocaleString()} / ${CREATIVE_LIMIT.toLocaleString()} blocks built · autosaved</span>`;
    $("#guide").innerHTML = `${icon("compass")} G · Travel to a building site`;
    $("#block-stock").textContent = "∞";
    updateCreativeUI();
    $(".map-label").textContent = destination.name.toUpperCase();
    $(".minimap").style.setProperty("--creative-land", destination.colour);
    return;
  }
  const count = round.collected.filter(Boolean).length;
  const next = activeQuest(round.collected);
  const quest = currentQuests()[next];
  $("#round-crystals").textContent = `${count} / 5`;
  $("#quest-crystals").innerHTML = round.collected
    .map(
      (done, i) =>
        `<span class="quest-step ${done ? "collected" : next === i ? "current" : ""}" title="${currentQuests()[i].title}" aria-label="${currentQuests()[i].title}${done ? ": done" : next === i ? ": current job" : ""}">${icon(done ? "check" : currentQuests()[i].icon)}</span>`,
    )
    .join("");
  $("#quest-title").textContent = quest ? quest.title : "Your portal is ready!";
  $("#quest-description").textContent = quest
    ? quest.goal
    : "Your expedition is complete. Visit your finished projects or step through the portal!";
  $("#quest-supplies").innerHTML = quest
    ? `${icon(round.gathered[next] ? "check" : "cube")} <span>${round.gathered[next] ? `Supplies ready · ${quest.action.toLowerCase()}` : `First: ${quest.gather.toLowerCase()}`}</span>`
    : `${icon("spark")} Five good deeds. One brighter island.`;
  $("#guide").innerHTML =
    `${icon("compass")} G · ${quest ? `Take me to the ${quest.location.toLowerCase()}` : "Take me to the portal"} ${icon("arrow")}`;
  $$("[data-map]").forEach((el) => {
    const i = Number(el.dataset.map);
    el.classList.toggle("done", round.collected[i]);
    el.classList.toggle("current", next === i);
    const site = currentQuests()[i];
    el.title = site.location;
    el.style.left = `${50 + site.x * 1.55}%`;
    el.style.top = `${50 + site.z * 1.55}%`;
  });
  $("#block-stock").textContent = world.blockStock;
  $(".map-label").textContent = WORLDS[selected].name.toUpperCase();
}
function startGame() {
  villageMode = false;
  sound("tap");
  round = createRound(save, WORLDS[selected].id);
  saveNow();
  $("#home-screen").hidden = true;
  $("#game-hud").hidden = false;
  currentScreen = "play";
  world.start(WORLDS[selected].id, round, buildingFor(WORLDS[selected].id));
  renderHotbar();
  updateHud();
  setBuild(false);
  if (firstSession || !round.gathered.some(Boolean)) {
    firstSession = false;
    showIntro();
  } else {
    world.setMode("play");
    if (!matchMedia("(pointer: coarse)").matches) world.lock();
  }
}
function showIntro() {
  showModal(
    `<div class="modal-emblem mint">${icon("cube")}</div><div class="eyebrow centered">WELCOME, ISLAND HELPER</div><h2 id="modal-title">${WORLDS[selected].title}</h2><p class="modal-description">${round.layoutVersion === 2 ? WORLDS[selected].description : "Finish your saved island jobs, then replay for a new expedition."}<br>Use a little maths to make <strong>five big changes</strong>!</p><div class="intro-steps"><div>${icon("cube")}<b>Gather</b><span>Pick up the supplies</span></div><div>${icon("book")}<b>Work it out</b><span>Count what the island needs</span></div><div>${icon("spark")}<b>Make it happen</b><span>Watch your world change</span></div></div><p class="gentle-note">No timers. Hints whenever you need them. Your completed jobs are saved.</p><button class="primary-button wide" id="begin-explore">Let's help the island! ${icon("arrow")}</button><div class="intro-controls">${matchMedia("(pointer: coarse)").matches ? "Use the arrow pad to move. Drag the world to look around." : "WASD to move · Mouse to look · Space to jump · E to help · G for a guide"}</div>`,
  );
  $("#begin-explore").onclick = () => {
    closeModal();
    toast(
      `Find the ${currentQuests()[activeQuest(round.collected)]?.location.toLowerCase() || "portal"}, or press G for a guide.`,
    );
  };
}
function interactQuest(index) {
  const phase = questPhase(round, index);
  if (phase === "done") return;
  if (phase === "locked") {
    toast(
      `First, ${currentQuests()[activeQuest(round.collected)].title.toLowerCase()}. Press G for a guide.`,
    );
    return;
  }
  if (phase === "gather") {
    if (!gatherQuest(round, index)) return;
    world.gather(index);
    saveNow();
    updateHud();
    sound("tap");
    toast(
      `${index === 1 || index === 4 ? "Inspection complete" : "Supplies collected"}! Press E to ${currentQuests()[index].action.toLowerCase()}.`,
    );
    return;
  }
  showChallenge(index);
}
function showChallenge(index) {
  if (questPhase(round, index) !== "solve") return;
  activeChallenge = index;
  round.evidence ??= [];
  const evidence = (round.evidence[index] ??= { attempts: 0, hint: false });
  attempts = evidence.attempts;
  const q = round.questions[index];
  const quest = describeQuest(index, q, WORLDS[selected].id, round);
  showModal(
    `${modalClose("Return to exploring")}<div class="challenge-top"><span class="puzzle-badge">${icon(quest.icon)} ISLAND JOB ${index + 1}</span><span>${round.collected.filter(Boolean).length} / 5 helped</span></div><h2 id="modal-title">${quest.title}</h2><p class="modal-description quest-story">${quest.story}</p><div class="resource-counts"><div>${icon(quest.icon)}<b>${q.a}</b><span>${quest.labels[0]}</span></div><div>${icon(quest.icon)}<b>${q.b}</b><span>${quest.labels[1]}</span></div></div><div class="equation" aria-label="${q.a} ${q.operator === "+" ? "plus" : "minus"} ${q.b} equals what?"><span>${q.a}</span><span class="operator">${q.operator}</span><span>${q.b}</span><span class="operator">=</span><span class="answer-blank">?</span></div><form id="answer-form"><label class="sr-only" for="answer">Your answer</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="Your answer" autocomplete="off" autofocus required><button type="submit" class="primary-button">Check answer ${icon("arrow")}</button></form><div id="answer-feedback" class="answer-feedback" role="status" aria-live="polite">You've got this. Take your time.</div><button class="hint-button" id="show-hint">${icon("spark")} A little help, please</button><div id="hint-panel" hidden></div>`,
    "challenge",
  );
  bindClose();
  $("#answer").focus();
  $("#answer-form").onsubmit = (e) => {
    e.preventDefault();
    submitAnswer();
  };
  $("#show-hint").onclick = () => showHint(q);
  if (evidence.hint) showHint(q);
}
function showHint(q) {
  const evidence = round.evidence[activeChallenge];
  if (!evidence.hint) {
    evidence.hint = true;
    saveNow();
  }
  $("#hint-panel").hidden = false;
  const dots = (n, cls = "") =>
    Array.from(
      { length: n },
      (_, i) =>
        `<i class="count-dot ${cls}"${i % 10 === 0 ? ' style="margin-left:4px"' : ""}></i>`,
    ).join("");
  let visual;
  if (q.operator === "+")
    visual = `<div class="count-group"><b>${q.a}</b><div>${dots(q.a)}</div></div><span class="hint-sign">+</span><div class="count-group"><b>${q.b}</b><div>${dots(q.b, "second")}</div></div>`;
  else
    visual = `<div class="count-group subtract"><b>Start with ${q.a}. Cross out ${q.b}.</b><div>${dots(q.a - q.b)}${dots(q.b, "removed")}</div></div>`;
  $("#hint-panel").innerHTML =
    `<p>${hintFor(q)}</p><div class="counting-aid">${visual}</div><small>Each dot is 1. Count in rows of 10.</small>`;
  $("#show-hint").hidden = true;
}
function submitAnswer() {
  const input = $("#answer");
  const raw = input.value.trim();
  if (!/^\d+$/.test(raw)) {
    $("#answer-feedback").textContent =
      "Type a whole number, then give it a try.";
    input.focus();
    return;
  }
  const q = round.questions[activeChallenge];
  attempts++;
  round.evidence[activeChallenge].attempts = attempts;
  if (Number(raw) !== q.answer) {
    $("#answer-feedback").className = "answer-feedback try-again";
    $("#answer-feedback").textContent =
      "Not quite yet. Try counting it out — you can do this!";
    input.classList.add("retry");
    input.select();
    sound("retry");
    saveNow();
    if (attempts >= 2) showHint(q);
    return;
  }
  const index = activeChallenge;
  if (!finishQuest(round, index, Number(raw))) return;
  save.solved++;
  save.totalCrystals++;
  if (attempts === 1 && !round.evidence[index].hint) save.correctFirst++;
  if (round.layoutVersion === 2) {
    recordPractice(save, round, index);
    // Adapt only the next unopened job. The current puzzle and gathered supplies
    // remain fixed, including across closing a dialog or reloading the page.
    const next = activeQuest(round.collected);
    if (next >= 0 && preparePractice(save, round, next))
      world.questWorld.configure(round);
  }
  world.collect(index);
  saveNow();
  updateHud();
  sound("success");
  $("#answer-form").innerHTML =
    `<div class="correct-equation">${icon("check")} ${q.a} ${q.operator} ${q.b} = ${q.answer}</div>`;
  $(".answer-blank").textContent = q.answer;
  $(".answer-blank").classList.add("solved");
  $("#answer-feedback").className = "answer-feedback success";
  $("#answer-feedback").textContent =
    `${q.answer} ${currentQuests()[index].resource} — you worked it out! You earned a crystal and 3 building blocks.`;
  $("#show-hint").hidden = true;
  $("#hint-panel").hidden = true;
  $("#modal-title").textContent = "Your maths made a difference!";
  $("#modal-content").insertAdjacentHTML(
    "beforeend",
    `<button class="primary-button wide" id="continue-adventure">See what you made happen ${icon("arrow")}</button>`,
  );
  $("#continue-adventure").focus();
  $("#continue-adventure").onclick = () => {
    closeModal(false);
    $("#game-hud").hidden = true;
    $("#quest-reveal").hidden = false;
    $("#reveal-title").textContent = currentQuests()[index].success;
    $("#reveal-description").textContent = currentQuests()[index].effect;
    landmarkReveal = false;
    world.showReward(index);
    $("#finish-reveal").focus();
  };
}
function pause() {
  if (currentScreen !== "play" || $("#modal").open) return;
  showModal(
    `${modalClose("Resume game")}<div class="modal-emblem mint">${icon("cube")}</div><div class="eyebrow centered">TAKE A BREATHER</div><h2 id="modal-title">Your adventure can wait.</h2><p class="modal-description">Your builds, blocks, and maths progress are saved.<br>This world belongs to ${escapeHtml(profile.name)}.</p><button class="primary-button wide" id="resume-game">Keep exploring ${icon("play")}</button><div class="pause-links"><button id="pause-help">${icon("help")} Controls & help</button><button id="pause-settings">${icon("settings")} Parent settings</button><button id="pause-profiles">${icon("settings")} Switch explorer</button><button id="go-home">${icon("home")} Back to islands</button></div>`,
  );
  bindClose();
  $("#resume-game").onclick = () => closeModal();
  $("#pause-help").onclick = () => showHelp();
  $("#pause-settings").onclick = () => showSettings();
  $("#go-home").onclick = goHome;
  $("#pause-profiles").onclick = showProfiles;
}
function goHome() {
  closeModal(false);
  currentScreen = "home";
  villageMode = false;
  world.setMode("home");
  previewWorld();
  $("#home-screen").hidden = false;
  $("#game-hud").hidden = true;
  renderCards();
  updateStats();
}
function showHelp() {
  if (villageMode) {
    showBuildTools();
    return;
  }
  showModal(
    `${modalClose()}<div class="modal-emblem mint">${icon("book")}</div><h2 id="modal-title">Adventure starts here.</h2><p class="modal-description">Follow the five island jobs in order. Press E to gather or inspect supplies, then E again to work out what the island needs. Each world has different projects: rescue a balloon, uncover a fossil, send a minecart, or launch a rocket. Each job also earns 3 building blocks!</p><div class="help-grid"><div><kbd>W A S D</kbd><span>Walk around the island</span></div><div><kbd>MOUSE</kbd><span>Look around (or drag)</span></div><div><kbd>SPACE</kbd><span>Jump over blocks</span></div><div><kbd>E</kbd><span>Gather supplies or solve the current job</span></div><div><kbd>G</kbd><span>Go straight to the current island job</span></div><div><kbd>B</kbd><span>Switch building on or off</span></div><div><kbd>1 · 2 · 3</kbd><span>Choose your building block</span></div><div><kbd>RIGHT CLICK</kbd><span>Place a block nearby</span></div><div><kbd>LEFT CLICK</kbd><span>Mine a block you placed</span></div><div><kbd>ESC</kbd><span>Pause and release the mouse</span></div></div><p class="gentle-note">Arrow keys work too. On a touchscreen, use the arrow pad and drag to look. Stuck? the guide button will help.</p><button class="primary-button wide" id="help-done">Got it ${icon("check")}</button>`,
  );
  bindClose(currentScreen === "play");
  $("#help-done").onclick = () => closeModal(currentScreen === "play");
}
function showSettings() {
  showModal(
    `${modalClose()}<div class="eyebrow centered">A LITTLE SPACE FOR GROWN-UPS</div><h2 id="modal-title">Every explorer is different.</h2><p class="modal-description">Choose a comfortable challenge. There are no timers, lost lives, or penalties for trying.</p><fieldset class="setting-group"><legend>Numbers to explore</legend><div class="segmented">${[10, 20, 100].map((n) => `<label><input type="radio" name="range" value="${n}" ${save.range === n ? "checked" : ""}><span>Up to ${n}</span></label>`).join("")}</div></fieldset><fieldset class="setting-group"><legend>What shall we practise?</legend><div class="segmented">${[
      ["mixed", "A bit of both"],
      ["addition", "Addition +"],
      ["subtraction", "Subtraction −"],
    ]
      .map(
        ([v, n]) =>
          `<label><input type="radio" name="operation" value="${v}" ${save.operation === v ? "checked" : ""}><span>${n}</span></label>`,
      )
      .join(
        "",
      )}</div></fieldset><div class="learning-settings"><b>A steady challenge</b><p>Addition: ${learningLabel(save.learning, "addition", save.range)}<br>Subtraction: ${learningLabel(save.learning, "subtraction", save.range)}</p><small>Three first-try answers without a hint move that skill up one step. If two questions need help, the next ones ease back. Speed never matters.</small><label for="learning-start">Change the starting point</label><select id="learning-start"><option value="keep">Keep learning from my answers</option value="0">Small steps to 10</option><option value="1">Exploring to 20</option><option value="2">Tens and ones to 40</option><option value="4">Bigger numbers to 100</option></select></div><div class="setting-row"><div><b>A little sound</b><small>Gentle notes for discoveries and answers</small></div><label class="toggle"><input type="checkbox" id="settings-sound" aria-label="Enable sound" ${save.sound ? "checked" : ""}><span></span></label></div><div class="progress-summary"><span><b>${save.solved}</b> puzzles solved</span><span><b>${save.completed.length} / ${WORLDS.length}</b> worlds completed</span></div><p class="privacy-note">Progress stays in this browser. No accounts or tracking.<br>Settings belong to ${escapeHtml(profile.name)}. Builds and materials are saved between visits.</p><button class="primary-button wide" id="save-settings">Save settings ${icon("check")}</button>`,
  );
  bindClose(currentScreen === "play");
  $("#save-settings").onclick = () => {
    save.range = Number($("input[name=range]:checked").value);
    save.operation = $("input[name=operation]:checked").value;
    save.sound = $("#settings-sound").checked;
    if ($("#learning-start").value !== "keep") {
      const level = Number($("#learning-start").value);
      save.learning = cleanLearning({
        addition: { level, streak: 0, support: 0 },
        subtraction: { level, streak: 0, support: 0 },
      });
    }
    saveNow();
    closeModal(currentScreen === "play");
    toast("All set. Your next adventure will use these settings.");
  };
}
function complete() {
  if (villageMode || !round.collected.every(Boolean)) return;
  round.finished = true;
  const id = WORLDS[selected].id;
  if (!save.completed.includes(id)) save.completed.push(id);
  saveNow();
  sound("complete");
  showModal(
    `<div class="completion-stars">${icon("spark")}${icon("trophy")}${icon("spark")}</div><div class="eyebrow centered">ADVENTURE COMPLETE</div><h2 id="modal-title">You brought the magic back.</h2><p class="modal-description">${round.layoutVersion === 2 ? WORLDS[selected].description : "Five good deeds. One brighter island."}<br>You made it all happen!</p><div class="reward-row"><span>${icon("diamond")}<b>5 crystals</b></span><span>${icon("cube")}<b>15 blocks earned</b></span></div><div class="unlocked-world">${cubeArt(WORLDS[Math.min(selected + 1, WORLDS.length - 1)].id)}<div><small>${selected < WORLDS.length - 1 ? "YOUR NEXT ADVENTURE IS UNLOCKED" : "YOU’VE EXPLORED EVERY WORLD"}</small><strong>${selected < WORLDS.length - 1 ? WORLDS[selected + 1].name : "A world of possibilities."}</strong></div>${icon("check")}</div><button class="primary-button wide" id="next-world">${selected < WORLDS.length - 1 ? "Explore the next world" : "Back to your islands"} ${icon("arrow")}</button><button class="text-button" id="stay-build">Stay here and build a little more</button>`,
    "complete",
  );
  $("#next-world").onclick = () => {
    closeModal(false);
    if (selected < WORLDS.length - 1) {
      selected++;
      startGame();
    } else goHome();
  };
  $("#stay-build").onclick = () => {
    closeModal();
    setBuild(true);
    toast("Make something wonderful! Press B to switch building off.");
  };
}
function setBuild(enabled) {
  world.buildMode = enabled;
  $("#touch-place").hidden = !enabled;
  $("#touch-mine").hidden = !enabled;
  $("#build-toggle").classList.toggle("active", enabled);
  $("#build-toggle").innerHTML =
    `${icon(enabled ? "check" : "cube")} ${enabled ? "Building" : "Build"}`;
  $("#build-label").innerHTML = villageMode
    ? "YOUR CREATIVE KIT <span>1–9: select · E: all blocks · Hold right click: build</span>"
    : enabled
      ? "MAKE A LITTLE SOMETHING <span>Right click: place · Left click: mine</span>"
      : "YOUR EXPLORER’S KIT <span>Press B to build</span>";
}
function updatePosition({ x, z, yaw, nearby, portal, landmark }) {
  const player = $("#map-player");
  const mapScale = villageMode ? 34 / CREATIVE_RADIUS : 1.55;
  player.style.left = `${50 + x * mapScale}%`;
  player.style.top = `${50 + z * mapScale}%`;
  player.style.transform = `translate(-50%,-50%) rotate(${-yaw}rad)`;
  const dirs = ["N", "NW", "W", "SW", "S", "SE", "E", "NE"];
  $("#heading").textContent =
    dirs[((Math.round(yaw / (Math.PI / 4)) % 8) + 8) % 8];
  if (villageMode) {
    $("#map-coordinates").textContent =
      `X ${Math.round(x)} · Z ${Math.round(z)}`;
    $("#interaction").hidden = true;
    return;
  }
  if (landmark) {
    $("#interaction").hidden = false;
    $("#interaction span").textContent = LANDMARKS[WORLDS[selected].id].action;
    return;
  }
  $("#interaction").hidden = nearby < 0 && !portal;
  $("#interaction span").textContent = portal
    ? "Step into the portal"
    : nearby >= 0
      ? questPhase(round, nearby) === "locked"
        ? `Help with ${currentQuests()[activeQuest(round.collected)].location.toLowerCase()} first`
        : questPhase(round, nearby) === "gather"
          ? currentQuests()[nearby].gather
          : currentQuests()[nearby].action
      : "Explore the island";
}

function finishReveal() {
  $("#quest-reveal").hidden = true;
  $("#game-hud").hidden = false;
  world.setMode("play");
  if (!matchMedia("(pointer: coarse)").matches) world.lock();
  if (!landmarkReveal && round?.collected.every(Boolean))
    toast("Five good deeds! Press G to visit your restored portal.");
}
function buildingFor(id) {
  return {
    blocks: profile.builds[id] || [],
    inventory: profile.inventory,
    hotbar: profile.hotbar,
    discovered: profile.discoveries.includes(id),
  };
}
function previewWorld() {
  if (!world) return;
  $(".hero-description").textContent = WORLDS[selected].description;
  world.questRound = null;
  world.collected = Array(5).fill(false);
  world.loadTheme(WORLDS[selected].id);
  world.restoreBuilding(buildingFor(WORLDS[selected].id));
  $("#scene-biome").textContent =
    `0${selected + 1} / ${WORLDS[selected].biome}`;
}
function showBuildWorlds() {
  showModal(
    `${modalClose()}<div class="eyebrow">MORE ROOM FOR BIG IDEAS</div><h2 id="modal-title">Where will you build?</h2><p class="modal-description">Five enormous creative worlds, all ready to explore. Each is 256 blocks across, with its own saved creations and room for 8,000 blocks. Your original village is in Grassland Valley.</p><div class="creative-world-cards">${CREATIVE_WORLDS.map((w, i) => `<button class="creative-world-card ${profile.creativeWorld === w.id ? "chosen" : ""}" data-creative-world="${w.id}" style="--world-colour:${w.colour};--world-sky:${w.sky}"><div class="creative-world-art">${cubeArt(w.theme)}<span>${i === 0 ? "YOUR ORIGINAL VILLAGE" : "CREATIVE WORLD 0" + (i + 1)}</span></div><div class="creative-world-copy"><h3>${w.name}</h3><p>${w.description}</p><small>${(profile.builds[w.id]?.length || 0).toLocaleString()} blocks saved · Unlimited materials</small><strong>${villageMode && world.themeId === w.id ? "Keep building" : "Enter world"} ${icon("arrow")}</strong></div></button>`).join("")}</div><p class="gentle-note">All worlds include flight, 36 block types, building tools and TNT.<br>Creations stay separate; changing worlds never replaces your existing buildings.</p>`,
    "pause",
    true,
  );
  bindClose(currentScreen === "play");
  $$("[data-creative-world]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.creativeWorld;
        if (villageMode && world.themeId === id) {
          closeModal();
          return;
        }
        startVillage(id);
      }),
  );
}
function showCreativeTravel() {
  if (!villageMode) return;
  const places = creativeSites(world.themeId);
  showModal(
    `${modalClose()}<div class="eyebrow">${creativeWorld(world.themeId).name.toUpperCase()}</div><h2 id="modal-title">Find your next building spot</h2><p class="modal-description">Travel instantly to a roomy foundation, or fly anywhere in the landscape. These markers are starting places; you can build beyond them.</p><div class="creative-travel-map" style="--travel-land:${creativeWorld(world.themeId).colour}"><span class="travel-map-land"></span>${places.map((p, i) => `<button data-site="${i}" style="left:calc(50% + ${(p.x * 86) / CREATIVE_RADIUS}px);top:calc(50% + ${(p.z * 86) / CREATIVE_RADIUS}px)" aria-label="Travel to ${p.name}">${i + 1}</button>`).join("")}</div><div class="creative-sites">${places.map((p, i) => `<button data-site="${i}"><b>${i + 1}</b><span>${p.name}<small>${i === 0 ? "Home camp" : "Open 36 × 36 building site"} · ${Math.round(Math.hypot(world.player.x - p.x, world.player.z - p.z))} blocks away</small></span>${icon("arrow")}</button>`).join("")}</div>`,
    "pause",
    true,
  );
  bindClose();
  $$("[data-site]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = Number(b.dataset.site);
        closeModal();
        world.travelCreative(i);
      }),
  );
}
function startVillage(id = profile.creativeWorld) {
  closeModal(false);
  villageMode = true;
  landmarkReveal = false;
  currentScreen = "play";
  $("#quest-reveal").hidden = true;
  $("#home-screen").hidden = true;
  $("#game-hud").hidden = false;
  profile.creativeWorld = creativeWorld(id) ? id : "village";
  world.startVillage(buildingFor(profile.creativeWorld), profile.creativeWorld);
  saveNow();
  renderHotbar();
  setBuild(true);
  updateHud();
  if (!matchMedia("(pointer: coarse)").matches) world.lock();
  toast(
    `Welcome to ${creativeWorld(profile.creativeWorld).name}! G: travel · M: worlds · F: fly · E: blocks.`,
  );
}
function showProfiles() {
  if (currentScreen === "play") goHome();
  showModal(
    `${modalClose()}<div class="eyebrow centered">A WORLD OF YOUR OWN</div><h2 id="modal-title">Who’s exploring today?</h2><p class="modal-description">Each explorer has their own village, creations, maths settings, and discoveries.</p><div class="explorer-list">${family.profiles.map((p) => `<div class="explorer-row"><button class="explorer-select ${p.id === profile.id ? "chosen" : ""}" data-profile="${escapeHtml(p.id)}">${avatarArt(p.avatar)}<span><strong>${escapeHtml(p.name)}</strong><small>${p.progress.totalCrystals} crystals · ${CREATIVE_WORLDS.reduce((sum, w) => sum + (p.builds[w.id]?.length || 0), 0)} creative blocks</small></span>${icon(p.id === profile.id ? "check" : "arrow")}</button><button class="icon-button" data-edit-profile="${escapeHtml(p.id)}" aria-label="Personalise ${escapeHtml(p.name)}">${icon("settings")}</button></div>`).join("")}</div>${family.profiles.length < 6 ? `<button class="primary-button wide" id="add-explorer">Add an explorer ${icon("spark")}</button>` : ""}<p class="privacy-note">Saved on this device. No account or email needed.<br>Everyone keeps their own progress and creations.</p>`,
  );
  bindClose(false);
  $$("[data-profile]").forEach(
    (b) =>
      (b.onclick = () => {
        family.activeId = b.dataset.profile;
        profile = activeProfile(family);
        save = profile.progress;
        selected = 0;
        round = null;
        firstSession = true;
        saveNow();
        closeModal(false);
        previewWorld();
        renderCards();
        toast(`Welcome, ${profile.name}! Your village is waiting.`);
      }),
  );
  $$("[data-edit-profile]").forEach(
    (b) => (b.onclick = () => editProfile(b.dataset.editProfile)),
  );
  $("#add-explorer")?.addEventListener("click", () => editProfile());
}
function editProfile(id) {
  const existing = family.profiles.find((p) => p.id === id);
  showModal(
    `${modalClose()}<div class="eyebrow centered">MEET YOUR EXPLORER</div><h2 id="modal-title">${existing ? "Make it yours." : "A new adventure begins."}</h2><form id="explorer-form"><label class="explorer-name-label" for="explorer-name">Explorer name</label><input class="explorer-name-input" id="explorer-name" name="name" maxlength="20" autocomplete="off" placeholder="Your name or nickname" value="${escapeHtml(existing?.name || "")}" required><fieldset class="avatar-picker"><legend>Choose your blocky explorer</legend>${AVATARS.map((a) => `<label><input type="radio" name="avatar" value="${a}" ${(existing?.avatar || "fox") === a ? "checked" : ""}>${avatarArt(a)}<span>${a[0].toUpperCase() + a.slice(1)}</span></label>`).join("")}</fieldset><button class="primary-button wide" type="submit">${existing ? "Save explorer" : "Let’s explore"} ${icon("arrow")}</button></form>`,
  );
  $("#modal-close").onclick = showProfiles;
  $("#explorer-name").focus();
  $("#explorer-form").onsubmit = (e) => {
    e.preventDefault();
    const name = profileName($("#explorer-name").value),
      avatar = $("input[name=avatar]:checked").value;
    if (existing) {
      existing.name = name;
      existing.avatar = avatar;
      family.activeId = existing.id;
    } else if (!addProfile(family, name, avatar)) return;
    profile = activeProfile(family);
    save = profile.progress;
    selected = 0;
    round = null;
    firstSession = true;
    saveNow();
    closeModal(false);
    previewWorld();
    renderCards();
    toast(
      `${profile.name}’s world is ready. Start an adventure or visit your village.`,
    );
  };
}
function showLandmark() {
  const id = WORLDS[selected].id,
    site = LANDMARKS[id];
  const known = profile.discoveries.includes(id);
  showModal(
    `${modalClose("Keep exploring")}<div class="eyebrow centered">${known ? "YOUR DISCOVERIES" : "A LITTLE OFF THE BEATEN PATH"}</div><h2 id="modal-title">${site.title}</h2><p class="modal-description">${site.description}</p><div id="landmark-activity"></div><p class="gentle-note">${known ? "Already discovered! You can enjoy it again whenever you like." : "Discover this place to earn 12 building blocks for your adventures."}</p>`,
    "challenge",
  );
  bindClose();
  const area = $("#landmark-activity");
  if (known || id === "meadow") {
    area.innerHTML = `<div class="landmark-emblem">${icon(id === "meadow" ? "spark" : "diamond")}</div><button class="primary-button wide" id="activate-landmark">${known ? "See it again" : "Turn the waterwheel"} ${icon("arrow")}</button>`;
    $("#activate-landmark").onclick = finishLandmark;
  } else if (id === "cavern") {
    let step = 0;
    area.innerHTML = `<p class="melody-instruction">Play the colours: <b>Mint → Violet → Gold</b></p><div class="melody-keys">${["Mint", "Violet", "Gold"].map((name, i) => `<button class="melody-key colour-${i}" data-note="${i}" aria-label="Play ${name.toLowerCase()} crystal">${icon("diamond")}<span>${name}</span></button>`).join("")}</div><p id="melody-feedback" class="gentle-note" role="status">Tap the mint crystal first.</p>`;
    $$("[data-note]").forEach(
      (b) =>
        (b.onclick = () => {
          sound("tap");
          if (Number(b.dataset.note) !== step) {
            step = 0;
            $("#melody-feedback").textContent =
              "Let’s start again with mint. Take your time.";
            $$("[data-note]").forEach((k) => k.classList.remove("played"));
            return;
          }
          b.classList.add("played");
          step++;
          $("#melody-feedback").textContent = `${step} / 3 notes glowing`;
          if (step === 3) finishLandmark();
        }),
    );
  } else {
    const turns = [1, 2, 3],
      names = ["outer", "middle", "inner"];
    area.innerHTML = `<p class="melody-instruction">Turn each ring until its arrow points <b>up ↑</b>.</p><div class="sun-rings">${names.map((n, i) => `<button data-ring="${i}" aria-label="Turn ${n} ring"><span class="sun-ring-arrow" style="transform:rotate(${turns[i] * 90}deg)">↑</span><small>${n} ring</small></button>`).join("")}</div><p class="gentle-note" id="ring-feedback" role="status">Three sun rings, one direction.</p>`;
    $$("[data-ring]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = Number(b.dataset.ring);
          turns[i] = (turns[i] + 1) % 4;
          b.querySelector(".sun-ring-arrow").style.transform =
            `rotate(${turns[i] * 90}deg)`;
          b.classList.toggle("aligned", turns[i] === 0);
          sound("tap");
          $("#ring-feedback").textContent =
            `${turns.filter((t) => t === 0).length} / 3 rings aligned`;
          if (turns.every((t) => t === 0)) finishLandmark();
        }),
    );
  }
}
function finishLandmark() {
  const id = WORLDS[selected].id;
  if (claimDiscovery(profile, id)) {
    world.blockStock = profile.inventory;
    world.changedBuilding();
  }
  updateHud();
  world.biome.activate(true);
  closeModal(false);
  world.setMode("reward");
  world.rewardView = world.biome.camera();
  landmarkReveal = true;
  $("#game-hud").hidden = true;
  $("#quest-reveal").hidden = false;
  $("#reveal-title").textContent = {
    meadow: "Let the waterfall flow!",
    cavern: "You woke the northern lights!",
    sunset: "The sun gate is opening!",
  }[id];
  $("#reveal-description").textContent =
    "Discovery saved. Those building blocks are ready for your next creation.";
  $("#finish-reveal").focus();
}
$("#explorers").onclick = showProfiles;
$("#game-profiles").onclick = showProfiles;
$("#visit-village").onclick = showBuildWorlds;
$("#change-build-worlds").onclick = showBuildWorlds;
$("#game-village").onclick = () => (villageMode ? goHome() : showBuildWorlds());
$("#landmark-guide").onclick = () => world.guideLandmark();
window.addEventListener("storage", (e) => {
  if (e.key !== FAMILY_KEY || !e.newValue) return;
  try {
    if (JSON.parse(e.newValue).revision <= family.revision) return;
  } catch {
    return;
  }
  showModal(
    `<h2 id="modal-title">Your explorer moved to another tab.</h2><p class="modal-description">Reload to use the latest saved village and progress.</p><button class="primary-button wide" id="reload-save">Load the latest save</button>`,
  );
  $("#reload-save").onclick = () => location.reload();
});

$("#finish-reveal").onclick = finishReveal;
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && !$("#quest-reveal").hidden) {
    e.preventDefault();
    finishReveal();
  }
});
$("#start-adventure").onclick = () => startGame();
$("#nav-play").onclick = () => $("#start-adventure").focus();
$("#nav-worlds").onclick = () => {
  $("#worlds-section").classList.add("highlight-worlds");
  setTimeout(
    () => $("#worlds-section").classList.remove("highlight-worlds"),
    1400,
  );
  $(".world-card.selected").focus();
};
$("#nav-how").onclick = () => showHelp();
$("#settings-home").onclick = () => showSettings();
$("#pause").onclick = pause;
$("#guide").onclick = () => world.guide();
$("#interaction").onclick = () => world.interact();
$("#build-toggle").onclick = () => setBuild(!world.buildMode);
$("#open-palette").onclick = showPalette;
$("#open-tools").onclick = showBuildTools;
$("#fly-toggle").onclick = () => world.toggleFlight();
$("#undo-build").onclick = () => world.builder?.undo();
$("#redo-build").onclick = () => world.builder?.redo();
$("#ignite-tnt").onclick = () => world.igniteTNT();
$("#rotate-build").onclick = () => {
  world.builder.rotation = (world.builder.rotation + 1) % 4;
  updateCreativeUI();
};
for (const id of ["#sound-home", "#sound-game"])
  $(id).onclick = () => {
    save.sound = !save.sound;
    saveNow();
    if (save.sound) sound("tap");
  };
$("#modal").addEventListener("cancel", (e) => {
  e.preventDefault();
  if (currentScreen === "play" && world.mode === "complete") {
    goHome();
  } else closeModal(currentScreen === "play");
});
for (const [id, direction] of [
  ["#touch-jump", 1],
  ["#touch-down", -1],
]) {
  const button = $(id);
  button.onpointerdown = (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    if (world.flying) world.flyVertical = direction;
    else if (direction === 1) world.jump();
  };
  button.onpointerup = button.onpointercancel = () => (world.flyVertical = 0);
}
$("#touch-place").onclick = () => world.placeBlock();
$("#touch-mine").onclick = () => world.mineBlock();
$$("[data-move]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    const dir = b.dataset.move;
    world.touchMove = {
      x: dir === "left" ? -1 : dir === "right" ? 1 : 0,
      z: dir === "forward" ? -1 : dir === "back" ? 1 : 0,
    };
  };
  b.onpointerup = b.onpointercancel = () => (world.touchMove = { x: 0, z: 0 });
});
updateStats();
renderCards();
try {
  world = new IslandWorld($("#world"), {
    challenge: interactQuest,
    village: () => (villageMode ? goHome() : showBuildWorlds()),
    creativeWorlds: showBuildWorlds,
    creativeTravel: showCreativeTravel,
    palette: showPalette,
    tools: showBuildTools,
    creative: updateCreativeUI,
    explosion: () => sound("boom"),
    landmark: showLandmark,
    building: (id, state) => {
      recordBuilding(profile, id, state.blocks, state.inventory);
      saveNow();
      if (villageMode) updateHud();
    },
    complete,
    pause,
    tip: toast,
    position: updatePosition,
    stock: (n) => ($("#block-stock").textContent = villageMode ? "∞" : n),
    buildChange: setBuild,
    blockSelect: (n) =>
      $$("[data-slot]").forEach((s, i) =>
        s.classList.toggle("selected", i === n),
      ),
    pointerFallback: () => {
      if (!world?.pointerFallbackShown) {
        if (world) world.pointerFallbackShown = true;
        toast("Drag the world to look around. WASD and arrow keys move you.");
      }
    },
  });
  $("#loading").remove();
  previewWorld();
  if (family.revision === 0) {
    saveNow();
    showProfiles();
  }
} catch (error) {
  console.error("Mathcraft could not initialise the 3D world.", error);
  $("#loading").innerHTML =
    `<span class="brand-cube">${icon("cube")}</span><strong>Let's get your world ready.</strong><p>This game needs WebGL 2. Try a current Chrome, Edge, Safari, or Firefox browser with hardware acceleration turned on.</p><button class="primary-button" onclick="location.reload()">Try again</button>`;
  $("#start-adventure").disabled = true;
}
