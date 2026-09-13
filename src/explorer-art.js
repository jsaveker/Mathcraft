export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function avatarArt(kind = "fox") {
  const colours = {
    fox: ["#eb9755", "#7a5038"],
    astronaut: ["#a7ddd5", "#486672"],
    dragon: ["#aaa0df", "#5c5580"],
    panda: ["#e9e7dc", "#3e5554"],
  };
  const [base, dark] = colours[kind] || colours.fox;
  const ears =
    kind === "fox" || kind === "dragon"
      ? `<path fill="${dark}" d="M9 20V6h12v14M43 20V6h12v14"/>`
      : "";
  return `<svg class="explorer-avatar" viewBox="0 0 64 64" role="img" aria-label="${kind} explorer"><rect x="4" y="10" width="56" height="50" rx="8" fill="${dark}"/>${ears}<path fill="${base}" d="M10 14h44v38H10z"/><path fill="#fff8df" d="M16 30h32v20H16z"/><path fill="${dark}" d="M18 27h8v9h-8zM38 27h8v9h-8zM28 41h8v5h-8z"/>${kind === "astronaut" ? '<path fill="none" stroke="#ecfffa" stroke-width="5" d="M12 20h40v27H12z"/>' : ""}${kind === "dragon" ? '<path fill="#f3d681" d="M26 13h12v8H26z"/>' : ""}</svg>`;
}
