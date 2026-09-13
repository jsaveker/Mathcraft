import "@fontsource-variable/outfit/index.css";
import "@fontsource-variable/dm-sans/wght.css";
import "./style.css";
import { IslandWorld, SHRINES, PORTAL } from "./world.js";
import {
  WORLDS,
  readSave,
  persistSave,
  createRound,
  hintFor,
} from "./maths.js";

const icons = {
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
const cubeArt = (theme = "meadow") =>
  `<svg viewBox="0 0 90 82" class="island-icon ${theme}" aria-hidden="true"><path class="soil-face" d="m12 43 33-18 33 18v18L45 79 12 61Z"/><path class="side-face" d="M45 61v18L12 61V43Z"/><path class="grass-face" d="m12 43 33-18 33 18-33 18Z"/><path fill="#8f694e" d="M40 40V21h8v20l-4 3Z"/><path class="leaf-face" d="m27 14 17-9 18 9v18l-18 9-17-9Z"/><path class="top-face" d="m27 14 17-9 18 9-18 10Z"/><path fill="#ffffff" opacity=".2" d="m44 24 18-10v18l-18 9Z"/></svg>`;
const save = readSave();
let selected = 0,
  round = null,
  activeChallenge = -1,
  attempts = 0,
  currentScreen = "home",
  world,
  toastTimer,
  firstSession = true;
let audioCtx;
function sound(kind) {
  if (!save.sound) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
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
  if (!persistSave(save))
    toast("Your browser cannot save progress right now. You can still play.");
  updateStats();
}

document.querySelector("#app").innerHTML = `
 <main id="home-screen">
   <header class="site-header">
     <a class="brand" href="#" aria-label="Mathcraft home"><span class="brand-cube">${icon("cube")}</span><span>mathcraft<span class="brand-dot">.</span><small>SMALL NUMBERS. BIG WORLDS.</small></span></a>
     <nav class="main-nav" aria-label="Main navigation"><button class="nav-item active" id="nav-play">Play<span></span></button><button class="nav-item" id="nav-worlds">Your worlds</button><button class="nav-item" id="nav-how">How to play</button></nav>
     <div class="header-right"><span class="crystal-count">${icon("diamond")}<b id="total-crystals">0</b></span><button id="settings-home" class="icon-button parent-button" aria-label="Parent settings">${icon("settings")}</button><span class="avatar" aria-hidden="true"><i></i></span></div>
   </header>
   <section class="hero" aria-labelledby="hero-title">
     <div class="eyebrow"><span class="live-dot"></span> AN ADVENTURE THAT ADDS UP</div>
     <h1 id="hero-title">Big adventures.<br>Little <span>numbers.</span></h1>
     <p class="hero-description">A world of blocks. A little bit of magic.<br>Build your confidence, one adventure at a time.</p>
     <button class="primary-button hero-play" id="start-adventure">Let's play ${icon("arrow")}</button>
     <div class="play-note"><span class="tiny-cube">${icon("cube")}</span> Explore. Solve. Build. Repeat.</div>
     <div class="learning-tags"><span><b>+</b> Addition</span><span><b>−</b> Subtraction</span><span id="range-tag">Up to 100</span></div>
   </section>
   <div class="scene-caption"><span class="caption-line"></span><span id="scene-biome">01 / THE GRASSLANDS</span></div>
   <div class="world-callout"><span class="callout-star">${icon("spark")}</span><div>A little maths.<br><strong>A whole lot of possibility.</strong></div></div>
   <section class="worlds-section" id="worlds-section" aria-labelledby="worlds-title"><div class="section-heading"><h2 id="worlds-title">Your next adventure</h2><span>3 worlds. Endless possibilities.</span></div><div class="world-cards" id="world-cards"></div></section>
   <footer class="home-footer"><span><i class="live-dot"></i> MADE FOR CURIOUS MINDS</span><span>No timers. No pressure. Just play.</span><button id="sound-home" aria-label="Mute sound">${icon("sound")} Sound on</button></footer>
 </main>
 <section id="game-hud" hidden aria-label="Game controls and progress">
   <div class="hud-top"><button id="pause" class="hud-brand" aria-label="Pause game">${icon("cube")} <b>mathcraft.</b><span>Ⅱ</span></button><div class="compass"><span>W</span><span>·</span><b id="heading">N</b><span>·</span><span>E</span></div><div class="hud-totals">${icon("diamond")} <b id="round-crystals">0 / 5</b><button id="sound-game" class="icon-button" aria-label="Mute sound">${icon("sound")}</button></div></div>
   <div class="quest-panel"><div class="eyebrow">${icon("flag")} YOUR ADVENTURE</div><h2 id="quest-title">Wake the ancient portal</h2><p id="quest-description">Find five number crystals to bring the portal back to life.</p><div id="quest-crystals" class="quest-crystals"></div><button id="guide">${icon("compass")} G · Take me to the next crystal ${icon("arrow")}</button></div>
   <div class="minimap" aria-label="Island map"><span class="map-label">MEADOW ISLES</span><div class="map-land"></div><span class="map-portal">▣</span>${SHRINES.map((p, i) => `<span class="map-crystal" data-map="${i}" style="left:${50 + p.x * 1.55}%;top:${50 + p.z * 1.55}%">${i + 1}</span>`).join("")}<span id="map-player">▲</span><span class="map-north">N</span></div>
   <div id="crosshair" aria-hidden="true">+</div>
   <button id="interaction" class="interact-prompt" hidden><kbd>E</kbd> <span>Solve the number crystal</span></button>
   <div class="hotbar-wrap"><div class="build-label" id="build-label">YOUR EXPLORER'S KIT <span>Press B to build</span></div><div class="hotbar"><button class="tool-slot selected" data-slot="0" aria-label="Select grass block"><kbd>1</kbd><span class="block-icon grass-block"></span></button><button class="tool-slot" data-slot="1" aria-label="Select wood block"><kbd>2</kbd><span class="block-icon wood-block"></span></button><button class="tool-slot" data-slot="2" aria-label="Select crystal block"><kbd>3</kbd><span class="block-icon crystal-block"></span></button><span class="stock-label"><b id="block-stock">12</b> blocks</span><button class="build-button" id="build-toggle">${icon("cube")} Build</button></div></div>
   <div class="controls-strip"><span><kbd>W A S D</kbd> Move</span><span><i class="mouse-icon"></i> Look</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>E</kbd> Explore</span><span><kbd>ESC</kbd> Pause</span></div>
   <div class="touch-controls"><div class="dpad"><button data-move="forward" aria-label="Move forward">▲</button><button data-move="left" aria-label="Move left">◀</button><button data-move="back" aria-label="Move backward">▼</button><button data-move="right" aria-label="Move right">▶</button></div><div class="touch-actions"><button id="touch-place">Place</button><button id="touch-mine">Mine</button><button id="touch-jump">Jump ↑</button></div></div>
 </section>
 <div id="toast" role="status" aria-live="polite"></div>
 <dialog id="modal" aria-labelledby="modal-title"><div id="modal-content"></div></dialog>
 <div id="loading"><span class="brand-cube">${icon("cube")}</span><strong>Growing your island…</strong><span>Planting a little possibility.</span></div>`;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function updateStats() {
  $("#total-crystals").textContent = save.totalCrystals;
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
      world?.loadTheme(WORLDS[i].id);
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
function showModal(html, mode = "pause") {
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
function updateHud() {
  const count = round.collected.filter(Boolean).length;
  $("#round-crystals").textContent = `${count} / 5`;
  $("#quest-crystals").innerHTML = round.collected
    .map(
      (done, i) =>
        `<span class="${done ? "collected" : ""}" aria-label="Crystal ${i + 1}${done ? " collected" : ""}">${icon("diamond")}</span>`,
    )
    .join("");
  $("#quest-title").textContent =
    count === 5 ? "Your portal is ready!" : WORLDS[selected].title;
  $("#quest-description").textContent =
    count === 5
      ? "Step into the glowing portal to finish your adventure."
      : WORLDS[selected].description;
  $("#guide").innerHTML =
    `${icon("compass")} G · ${count === 5 ? "Take me to the portal" : "Take me to the next crystal"} ${icon("arrow")}`;
  $$("[data-map]").forEach((el) =>
    el.classList.toggle("done", round.collected[Number(el.dataset.map)]),
  );
  $("#block-stock").textContent = world.blockStock;
  $(".map-label").textContent = WORLDS[selected].name.toUpperCase();
}
function startGame() {
  sound("tap");
  round = createRound(save, WORLDS[selected].id);
  saveNow();
  $("#home-screen").hidden = true;
  $("#game-hud").hidden = false;
  currentScreen = "play";
  world.start(WORLDS[selected].id, round.collected);
  updateHud();
  setBuild(false);
  if (firstSession) {
    firstSession = false;
    showIntro();
  } else {
    world.setMode("play");
    if (!matchMedia("(pointer: coarse)").matches) world.lock();
  }
}
function showIntro() {
  showModal(
    `<div class="modal-emblem mint">${icon("compass")}</div><div class="eyebrow centered">WELCOME, EXPLORER</div><h2 id="modal-title">A little magic needs you.</h2><p class="modal-description">The island's portal has lost its sparkle.<br>Find <strong>5 number crystals</strong> and solve their puzzles to wake it up!</p><div class="intro-steps"><div>${icon("compass")}<b>Explore</b><span>Follow the floating numbers</span></div><div>${icon("diamond")}<b>Solve</b><span>Give each puzzle a try</span></div><div>${icon("cube")}<b>Build</b><span>Earn blocks as you go</span></div></div><p class="gentle-note">Take your time. Hints are always here to help.</p><button class="primary-button wide" id="begin-explore">I'm ready! ${icon("arrow")}</button><div class="intro-controls">${matchMedia("(pointer: coarse)").matches ? "Use the arrow pad to move. Drag the world to look around." : "WASD to move · Mouse to look · Space to jump · E to explore"}</div>`,
  );
  $("#begin-explore").onclick = () => {
    closeModal();
    toast("Find a floating number, or use “Take me to the next crystal”.");
  };
}
function showChallenge(index) {
  if (round.collected[index]) return;
  activeChallenge = index;
  attempts = 0;
  const q = round.questions[index];
  showModal(
    `${modalClose("Return to exploring")}<div class="challenge-top"><span class="puzzle-badge">${icon("diamond")} NUMBER CRYSTAL ${index + 1}</span><span>${round.collected.filter(Boolean).length} / 5 found</span></div><h2 id="modal-title">A little number magic.</h2><p class="modal-description">Solve the puzzle to collect this crystal.</p><div class="equation" aria-label="${q.a} ${q.operator === "+" ? "plus" : "minus"} ${q.b} equals what?"><span>${q.a}</span><span class="operator">${q.operator}</span><span>${q.b}</span><span class="operator">=</span><span class="answer-blank">?</span></div><form id="answer-form"><label class="sr-only" for="answer">Your answer</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="Your answer" autocomplete="off" autofocus required><button type="submit" class="primary-button">Check answer ${icon("arrow")}</button></form><div id="answer-feedback" class="answer-feedback" role="status" aria-live="polite">You've got this. Take your time.</div><button class="hint-button" id="show-hint">${icon("spark")} A little help, please</button><div id="hint-panel" hidden></div>`,
    "challenge",
  );
  bindClose();
  $("#answer").focus();
  $("#answer-form").onsubmit = (e) => {
    e.preventDefault();
    submitAnswer();
  };
  $("#show-hint").onclick = () => showHint(q);
}
function showHint(q) {
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
  if (Number(raw) !== q.answer) {
    $("#answer-feedback").className = "answer-feedback try-again";
    $("#answer-feedback").textContent =
      "Not quite yet. Try counting it out — you can do this!";
    input.classList.add("retry");
    input.select();
    sound("retry");
    if (attempts >= 2) showHint(q);
    return;
  }
  const index = activeChallenge;
  round.collected[index] = true;
  save.solved++;
  save.totalCrystals++;
  if (attempts === 1) save.correctFirst++;
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
    "Brilliant thinking! One crystal + 3 building blocks are yours.";
  $("#show-hint").hidden = true;
  $("#hint-panel").hidden = true;
  $("#modal-title").textContent = [
    "You made it sparkle!",
    "Look at you go!",
    "A little maths. Big magic!",
    "Another bright idea!",
    "Five crystals. One superstar!",
  ][index];
  $("#modal-content").insertAdjacentHTML(
    "beforeend",
    `<button class="primary-button wide" id="continue-adventure">${round.collected.every(Boolean) ? "Let’s wake the portal" : "Keep exploring"} ${icon("arrow")}</button>`,
  );
  $("#continue-adventure").focus();
  $("#continue-adventure").onclick = () => {
    closeModal();
    if (round.collected.every(Boolean))
      toast("All five crystals! Head to the glowing portal, then press E.");
  };
}
function pause() {
  if (currentScreen !== "play" || $("#modal").open) return;
  showModal(
    `${modalClose("Resume game")}<div class="modal-emblem mint">${icon("cube")}</div><div class="eyebrow centered">TAKE A BREATHER</div><h2 id="modal-title">Your adventure can wait.</h2><p class="modal-description">Your number crystals are saved.<br>The island will be right here.</p><button class="primary-button wide" id="resume-game">Keep exploring ${icon("play")}</button><div class="pause-links"><button id="pause-help">${icon("help")} Controls & help</button><button id="pause-settings">${icon("settings")} Parent settings</button><button id="go-home">${icon("home")} Back to islands</button></div>`,
  );
  bindClose();
  $("#resume-game").onclick = () => closeModal();
  $("#pause-help").onclick = () => showHelp();
  $("#pause-settings").onclick = () => showSettings();
  $("#go-home").onclick = goHome;
}
function goHome() {
  closeModal(false);
  currentScreen = "home";
  world.setMode("home");
  $("#home-screen").hidden = false;
  $("#game-hud").hidden = true;
  renderCards();
  updateStats();
}
function showHelp() {
  showModal(
    `${modalClose()}<div class="modal-emblem mint">${icon("book")}</div><h2 id="modal-title">Adventure starts here.</h2><p class="modal-description">Collect five number crystals, then step through the portal. Every correct answer earns 3 blocks to build with!</p><div class="help-grid"><div><kbd>W A S D</kbd><span>Walk around the island</span></div><div><kbd>MOUSE</kbd><span>Look around (or drag)</span></div><div><kbd>SPACE</kbd><span>Jump over blocks</span></div><div><kbd>E</kbd><span>Try a nearby number crystal</span></div><div><kbd>G</kbd><span>Go straight to the next crystal</span></div><div><kbd>B</kbd><span>Switch building on or off</span></div><div><kbd>1 · 2 · 3</kbd><span>Choose your building block</span></div><div><kbd>RIGHT CLICK</kbd><span>Place a block nearby</span></div><div><kbd>LEFT CLICK</kbd><span>Mine a block you placed</span></div><div><kbd>ESC</kbd><span>Pause and release the mouse</span></div></div><p class="gentle-note">Arrow keys work too. On a touchscreen, use the arrow pad and drag to look. Stuck? “Take me to the next crystal” will help.</p><button class="primary-button wide" id="help-done">Got it ${icon("check")}</button>`,
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
      )}</div></fieldset><div class="setting-row"><div><b>A little sound</b><small>Gentle notes for discoveries and answers</small></div><label class="toggle"><input type="checkbox" id="settings-sound" aria-label="Enable sound" ${save.sound ? "checked" : ""}><span></span></label></div><div class="progress-summary"><span><b>${save.solved}</b> puzzles solved</span><span><b>${save.completed.length} / 3</b> worlds completed</span></div><p class="privacy-note">Progress stays in this browser. No accounts or tracking.<br>Number settings apply to your next adventure. Building is for this visit.</p><button class="primary-button wide" id="save-settings">Save settings ${icon("check")}</button>`,
  );
  bindClose(currentScreen === "play");
  $("#save-settings").onclick = () => {
    save.range = Number($("input[name=range]:checked").value);
    save.operation = $("input[name=operation]:checked").value;
    save.sound = $("#settings-sound").checked;
    saveNow();
    closeModal(currentScreen === "play");
    toast("All set. Your next adventure will use these settings.");
  };
}
function complete() {
  if (!round.collected.every(Boolean)) return;
  round.finished = true;
  const id = WORLDS[selected].id;
  if (!save.completed.includes(id)) save.completed.push(id);
  saveNow();
  sound("complete");
  showModal(
    `<div class="completion-stars">${icon("spark")}${icon("trophy")}${icon("spark")}</div><div class="eyebrow centered">ADVENTURE COMPLETE</div><h2 id="modal-title">You brought the magic back.</h2><p class="modal-description">Five puzzles solved. Five crystals found.<br>Look what a little thinking can do.</p><div class="reward-row"><span>${icon("diamond")}<b>5 crystals</b></span><span>${icon("cube")}<b>15 blocks earned</b></span></div><div class="unlocked-world">${cubeArt(WORLDS[Math.min(selected + 1, 2)].id)}<div><small>${selected < 2 ? "YOUR NEXT ADVENTURE IS UNLOCKED" : "YOU’VE EXPLORED EVERY WORLD"}</small><strong>${selected < 2 ? WORLDS[selected + 1].name : "A world of possibilities."}</strong></div>${icon("check")}</div><button class="primary-button wide" id="next-world">${selected < 2 ? "Explore the next world" : "Back to your islands"} ${icon("arrow")}</button><button class="text-button" id="stay-build">Stay here and build a little more</button>`,
    "complete",
  );
  $("#next-world").onclick = () => {
    closeModal(false);
    if (selected < 2) {
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
  $("#build-label").innerHTML = enabled
    ? "MAKE A LITTLE SOMETHING <span>Right click: place · Left click: mine</span>"
    : "YOUR EXPLORER’S KIT <span>Press B to build</span>";
}
function updatePosition({ x, z, yaw, nearby, portal }) {
  const player = $("#map-player");
  player.style.left = `${50 + x * 1.55}%`;
  player.style.top = `${50 + z * 1.55}%`;
  player.style.transform = `translate(-50%,-50%) rotate(${-yaw}rad)`;
  const dirs = ["N", "NW", "W", "SW", "S", "SE", "E", "NE"];
  $("#heading").textContent =
    dirs[((Math.round(yaw / (Math.PI / 4)) % 8) + 8) % 8];
  $("#interaction").hidden = nearby < 0 && !portal;
  $("#interaction span").textContent = portal
    ? "Step into the portal"
    : `Solve number crystal ${nearby + 1}`;
}

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
$$("[data-slot]").forEach(
  (b) =>
    (b.onclick = () => {
      world.selectedBlock = Number(b.dataset.slot);
      $$("[data-slot]").forEach((s) => s.classList.toggle("selected", s === b));
    }),
);
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
$("#touch-jump").onclick = () => world.jump();
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
    challenge: showChallenge,
    complete,
    pause,
    tip: toast,
    position: updatePosition,
    stock: (n) => ($("#block-stock").textContent = n),
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
} catch (error) {
  console.error("Mathcraft could not initialise the 3D world.", error);
  $("#loading").innerHTML =
    `<span class="brand-cube">${icon("cube")}</span><strong>Let's get your world ready.</strong><p>This game needs WebGL 2. Try a current Chrome, Edge, Safari, or Firefox browser with hardware acceleration turned on.</p><button class="primary-button" onclick="location.reload()">Try again</button>`;
  $("#start-adventure").disabled = true;
}
