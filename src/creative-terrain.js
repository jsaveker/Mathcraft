import * as THREE from "three";
import { createCreativeTerrain } from "./creative-worlds.js";
const noise = (x, z) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
// Only exposed faces are drawn. Spatial chunks let the GPU skip terrain behind
// the camera rather than drawing layers of hidden cubes across a huge world.
export function buildTerrainChunks(terrain, theme) {
  const chunks = new Map();
  const palette = theme.grass.map((c) => new THREE.Color(c)),
    side = new THREE.Color(theme.soil);
  function quad(chunk, points, color, shade = 1) {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      chunk.positions.push(...points[i]);
      chunk.colours.push(color.r * shade, color.g * shade, color.b * shade);
      chunk.uv.push(
        ...[
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ][i],
      );
    }
  }
  for (const [key, top] of terrain) {
    const [x, z] = key.split(",").map(Number),
      cx = Math.floor(x / 32),
      cz = Math.floor(z / 32),
      chunkKey = `${cx},${cz}`;
    if (!chunks.has(chunkKey))
      chunks.set(chunkKey, { positions: [], colours: [], uv: [] });
    const chunk = chunks.get(chunkKey);
    const colour = palette[Math.floor(noise(x, z) * 4)];
    quad(
      chunk,
      [
        [x - 0.5, top, z + 0.5],
        [x + 0.5, top, z + 0.5],
        [x + 0.5, top, z - 0.5],
        [x - 0.5, top, z - 0.5],
      ],
      colour,
    );
    for (const [dx, dz, shade] of [
      [1, 0, 0.85],
      [-1, 0, 0.7],
      [0, 1, 0.92],
      [0, -1, 0.78],
    ]) {
      const adjacent = terrain.get(`${x + dx},${z + dz}`) ?? -7;
      if (adjacent >= top) continue;
      const ax = x + dx * 0.5,
        az = z + dz * 0.5,
        tx = dz * 0.5,
        tz = -dx * 0.5;
      quad(
        chunk,
        [
          [ax - tx, adjacent, az - tz],
          [ax + tx, adjacent, az + tz],
          [ax + tx, top, az + tz],
          [ax - tx, top, az - tz],
        ],
        side,
        shade,
      );
    }
  }
  return chunks;
}
export function installCreativeTerrain(world, id) {
  world.terrain = createCreativeTerrain(id);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: world.texture(0xffffff),
    roughness: 1,
  });
  world.mats.creativeTerrain = material;
  for (const data of buildTerrainChunks(world.terrain, world.theme).values()) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(data.colours, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(data.uv, 2));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    world.root.add(mesh);
  }
}
