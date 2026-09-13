import * as THREE from "three";
import { BLOCKS } from "./blocks.js";
export function installBuildMaterials(world) {
  for (const b of BLOCKS.slice(3)) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = b.color;
    ctx.fillRect(0, 0, 64, 64);
    if (b.pattern) {
      for (let i = 0; i < 32; i++) {
        ctx.fillStyle = i % 2 ? "#ffffff16" : "#00000010";
        ctx.fillRect((i * 29) % 64, (i * 17) % 64, 3 + (i % 7), 2 + (i % 4));
      }
      if (["brick", "cobble"].includes(b.pattern)) {
        ctx.strokeStyle = "#343d453b";
        ctx.lineWidth = 3;
        for (let y = 0; y <= 64; y += 16) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(64, y);
          ctx.stroke();
          for (let x = y % 32 ? 16 : 0; x < 64; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 16);
            ctx.stroke();
          }
        }
      }
      if (b.pattern === "log") {
        ctx.strokeStyle = "#49332188";
        ctx.lineWidth = 3;
        for (let x = 5; x < 64; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 2, 64);
          ctx.stroke();
        }
      }
      if (b.pattern === "leaves") {
        ctx.fillStyle = "#2145272b";
        for (let i = 0; i < 16; i++)
          ctx.fillRect((i * 21) % 60, (i * 37) % 60, 9, 9);
      }
      if (["glass", "metal", "glow"].includes(b.pattern)) {
        ctx.strokeStyle = b.pattern === "glass" ? "#ffffffbb" : "#3e4c493f";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 60, 60);
        ctx.fillStyle = "#ffffff55";
        ctx.fillRect(8, 8, 3, 22);
        ctx.fillRect(12, 8, 19, 3);
      }
      if (b.pattern === "checker") {
        ctx.fillStyle = "#647b83";
        for (let x = 0; x < 4; x++)
          for (let y = 0; y < 4; y++)
            if ((x + y) % 2) ctx.fillRect(x * 16, y * 16, 16, 16);
      }
      if (b.pattern === "tnt") {
        ctx.fillStyle = "#9e493b";
        for (let x = 7; x < 64; x += 16) ctx.fillRect(x, 0, 3, 64);
        ctx.fillStyle = "#fff7dc";
        ctx.fillRect(0, 20, 64, 25);
        ctx.fillStyle = "#443e37";
        ctx.font = "bold 21px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TNT", 32, 40);
      }
    }
    const map = new THREE.CanvasTexture(c);
    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    map.colorSpace = THREE.SRGBColorSpace;
    const glass = b.pattern === "glass",
      glow = b.pattern === "glow";
    world.mats[b.material] = new THREE.MeshStandardMaterial({
      map,
      roughness: glass ? 0.15 : 0.8,
      metalness: b.pattern === "metal" ? 0.45 : 0,
      transparent: glass,
      opacity: glass ? 0.5 : 1,
      depthWrite: !glass,
      emissive: glow ? new THREE.Color(b.color) : 0,
      emissiveIntensity: glow ? 0.55 : 0,
    });
  }
}
