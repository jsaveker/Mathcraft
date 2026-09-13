import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Original vector artwork for the repository. Gameplay images are separate,
// unretouched browser captures; this illustration is not a game screenshot.
const out = fileURLToPath(new URL("../docs/images/", import.meta.url));
const cube = (x, y, size, top, left, right, height = size) =>
  `<g><path d="M${x} ${y}l${size} ${-size / 2} ${size} ${size / 2}-${size} ${size / 2}Z" fill="${top}"/><path d="M${x} ${y}l${size} ${size / 2}v${height}l-${size}-${size / 2}Z" fill="${left}"/><path d="M${x + size} ${y + size / 2}l${size}-${size / 2}v${height}l-${size} ${size / 2}Z" fill="${right}"/></g>`;
const block = (x, y, z, palette, unit = 21) =>
  cube((x - y) * unit, (x + y) * unit * 0.5 - z * unit, unit, ...palette);
const grass = ["#b8d993", "#699760", "#88b275"];
const soil = ["#ae9279", "#6e665e", "#8d7a64"];
const leaf = ["#b2d18a", "#54774f", "#7ea164"];
const stone = ["#c9d4e5", "#697891", "#91a2bd"];
const snow = ["#e7f5f2", "#95b6c4", "#b9d6dc"];
const gold = ["#f6d58e", "#bc884d", "#e0ab62"];
const purple = ["#e2c5ff", "#9075bc", "#b497de"];

function island(theme = "meadow") {
  let shape = "";
  for (let layer = -2; layer <= 0; layer++) {
    for (let depth = -6; depth <= 6; depth++) {
      for (let x = -3; x <= 3; x++) {
        const y = depth - x;
        if (Math.abs(y) > 3 || x * x + y * y > (layer + 5) ** 2 - 6) continue;
        shape += block(
          x,
          y,
          layer,
          layer < 0
            ? soil
            : theme === "moon"
              ? stone
              : theme === "crystal"
                ? snow
                : grass,
        );
      }
    }
  }
  if (theme === "meadow") {
    for (let z = 1; z < 4; z++)
      shape += block(-1, 0, z, ["#ba9471", "#72583f", "#937253"]);
    for (let z = 3; z <= 4; z++)
      for (let x = -2; x <= 0; x++)
        for (let y = -1; y <= 1; y++) shape += block(x, y, z, leaf);
    shape += block(2, 1, 1, gold);
  } else if (theme === "crystal") {
    shape +=
      '<path d="m-43-22 5-106 31 44-10 99Z" fill="#9676c4"/><path d="m-38-128 5 115 26-71Z" fill="#d0b2ff"/><path d="m22 8 9-80 30 39-14 61Z" fill="#a78bcf"/><path d="m31-72 4 92 26-53Z" fill="#e4cbff"/>';
  } else {
    for (let z = 1; z <= 5; z++) shape += block(0, 0, z, z === 5 ? gold : snow);
    shape += block(0, 0, 3, ["#a8e3ec", "#6095bd", "#78bfd3"]);
    shape += block(-1, 0, 1, ["#f0b48b", "#a95e5c", "#d1856e"]);
    shape += block(1, 0, 1, ["#f0b48b", "#a95e5c", "#d1856e"]);
  }
  return shape;
}

const stars = Array.from({ length: 50 }, (_, i) => {
  const x = 735 + ((i * 127) % 660),
    y = 20 + ((i * 83) % 390);
  return `<rect x="${x}" y="${y}" width="${i % 4 ? 2 : 4}" height="${i % 4 ? 2 : 4}" fill="#b5d4db" opacity="${i % 3 ? 0.22 : 0.55}"/>`;
}).join("");

writeFileSync(
  `${out}banner.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="520" viewBox="0 0 1440 520" role="img" aria-labelledby="title desc">
<title id="title">Mathcraft — Small numbers. Big worlds.</title><desc id="desc">Original voxel illustrations of a woodland island, a lunar rocket and glowing crystals. Five adventures, twenty-five quests, five creative worlds and thirty-six block types.</desc>
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#19363b"/><stop offset="1" stop-color="#11172c"/></linearGradient><radialGradient id="halo"><stop stop-color="#a6bbce" stop-opacity=".15"/><stop offset="1" stop-color="#a6bbce" stop-opacity="0"/></radialGradient></defs>
<rect width="1440" height="520" rx="24" fill="url(#bg)"/><circle cx="1100" cy="195" r="330" fill="url(#halo)"/>${stars}
<g fill="none" stroke="#708f97" stroke-opacity=".18"><ellipse cx="1120" cy="220" rx="276" ry="118" transform="rotate(-18 1120 220)"/><ellipse cx="1120" cy="220" rx="325" ry="157" transform="rotate(-18 1120 220)"/></g>
<g transform="translate(72 60)">${cube(0, 12, 16, "#d0e8ab", "#7ba26b", "#a7c78c", 22)}<text x="52" y="35" fill="#c3d7c6" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="4">PLAY. LEARN. CREATE.</text></g>
<g font-family="Arial,Helvetica,sans-serif"><text x="68" y="205" fill="#f4f5e9" font-size="100" font-weight="800" letter-spacing="-6">mathcraft<tspan fill="#dda46d">.</tspan></text><text x="73" y="268" fill="#c1d99e" font-size="37" font-weight="700" letter-spacing="-1">Small numbers. Big worlds.</text><text x="74" y="319" fill="#c1d0d3" font-size="22">A 3D maths adventure built for curious minds.</text><g transform="translate(74 350)"><rect width="244" height="42" rx="21" fill="#c6dca4"/><path d="m20 12 15 9-15 9Z" fill="#233b38"/><text x="48" y="27" font-size="15" font-weight="700" fill="#233b38">PLAY IN A BROWSER</text></g></g>
<g transform="translate(1117 201) scale(1.4)">${island("moon")}</g><g transform="translate(916 319) scale(.79)">${island("meadow")}</g><g transform="translate(1292 314) scale(.79)">${island("crystal")}</g>
<path d="M48 428h1344" stroke="#e2eedc" stroke-opacity=".15"/>
<g fill="#eef2e9" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">${[
    ["5", "ADVENTURES"],
    ["25", "WORLD-CHANGING QUESTS"],
    ["5", "CREATIVE WORLDS"],
    ["36", "BLOCK TYPES"],
  ]
    .map(
      ([n, label], i) =>
        `<text x="${205 + i * 343}" y="467" font-size="27" font-weight="700">${n}</text><text x="${205 + i * 343}" y="493" fill="#9ab2b6" font-size="12" letter-spacing="2">${label}</text>`,
    )
    .join("")}</g></svg>\n`,
);

const destinations = [
  ["Grassland Valley", "MEADOWS &amp; WOODLAND", "#b7d391", "meadow"],
  ["Moon Frontier", "CRATERS &amp; STARLIGHT", "#bdcce5", "moon"],
  ["Cloud Kingdom", "TERRACES IN THE SKY", "#a4d9d6", "cloud"],
  ["Desert Horizons", "DUNES &amp; PYRAMIDS", "#edc77c", "desert"],
  ["Crystal Highlands", "SNOW &amp; AURORAS", "#cbb4eb", "crystal"],
];
const scene = (theme) => {
  if (["meadow", "moon", "crystal"].includes(theme)) return island(theme);
  if (theme === "desert")
    return (
      cube(-100, 0, 100, ...gold, 24) +
      '<path d="m-61 8 61-106 62 106-62 34Z" fill="#f4d493"/><path d="M0-98v140L62 8Z" fill="#bf9056"/><path d="m-11 29 11-5 12 6v-24l-12-6-11 5Z" fill="#6f604b"/>'
    );
  return (
    cube(-100, 0, 100, ...grass, 25) +
    '<path d="M-73-57c-5-19 23-44 72-44s83 25 73 44-47 29-73 29-68-12-72-29Z" fill="#c2e7e7"/><path d="M-73-57H72l-5 12H-68Z" fill="#6b9cad"/><path d="m-23-24 8 29m39-29-8 29" stroke="#d2b374" stroke-width="4"/>' +
    cube(-22, 0, 22, ...gold, 15)
  );
};
writeFileSync(
  `${out}worlds.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="304" viewBox="0 0 1440 304" role="img" aria-labelledby="title desc"><title id="title">Five places to make your own</title><desc id="desc">Grassland Valley, Moon Frontier, Cloud Kingdom, Desert Horizons and Crystal Highlands. All five creative worlds are available from the start.</desc>${destinations.map(([name, subtitle, color, theme], i) => `<g transform="translate(${i * 290} 0)"><rect width="280" height="304" rx="16" fill="#172b34"/><rect x="20" y="20" width="30" height="4" rx="2" fill="${color}"/><text x="254" y="32" text-anchor="end" fill="#729099" font-size="12" font-family="Arial,sans-serif">0${i + 1}</text><g transform="translate(140 148) scale(.66)">${scene(theme)}</g><text x="140" y="253" text-anchor="middle" fill="#f0f1e7" font-size="21" font-weight="700" font-family="Arial,sans-serif">${name}</text><text x="140" y="280" text-anchor="middle" fill="${color}" font-size="10" letter-spacing="1.2" font-family="Arial,sans-serif">${subtitle}</text></g>`).join("")}</svg>\n`,
);
