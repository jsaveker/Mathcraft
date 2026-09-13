import * as THREE from "three";
import { BLOCKS, blockKey } from "./blocks.js";

// One GPU draw per block material, even for thousands of saved blocks.
export class VoxelBuild {
  constructor(world) {
    this.world = world;
    this.groups = new Map();
    this.columns = new Map();
  }
  add(b) {
    const key = blockKey(b);
    if (this.world.blocks.has(key)) return null;
    let g = this.groups.get(b.type);
    if (!g) {
      g = { type: b.type, items: [], capacity: 0, mesh: null };
      this.groups.set(b.type, g);
    }
    const m = new THREE.Object3D();
    m.position.set(b.x, b.y, b.z);
    m.userData = {
      blockKey: key,
      blockType: b.type,
      instanceIndex: g.items.length,
    };
    g.items.push(m);
    this.world.blocks.set(key, m);
    const column = `${b.x},${b.z}`;
    if (!this.columns.has(column)) this.columns.set(column, new Set());
    this.columns.get(column).add(m);
    if (g.items.length > g.capacity) this.grow(g);
    else this.write(g, m);
    g.mesh.count = g.items.length;
    g.mesh.boundingSphere = null;
    return m;
  }
  grow(g) {
    const old = g.mesh;
    g.capacity = Math.max(32, g.capacity * 2);
    g.mesh = new THREE.InstancedMesh(
      this.world.geo,
      this.world.mats[BLOCKS[g.type].material],
      g.capacity,
    );
    g.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    g.mesh.castShadow = true;
    g.mesh.receiveShadow = true;
    g.mesh.userData.buildType = g.type;
    this.world.root.add(g.mesh);
    g.items.forEach((m) => this.write(g, m));
    if (old) {
      old.removeFromParent();
      old.dispose();
    }
  }
  write(g, m) {
    m.updateMatrix();
    g.mesh.setMatrixAt(m.userData.instanceIndex, m.matrix);
    g.mesh.instanceMatrix.needsUpdate = true;
    if (g.mesh.instanceColor) {
      g.mesh.setColorAt(m.userData.instanceIndex, new THREE.Color(0xffffff));
      g.mesh.instanceColor.needsUpdate = true;
    }
  }
  remove(key) {
    const m = this.world.blocks.get(key);
    if (!m) return null;
    this.columns.get(`${m.position.x},${m.position.z}`)?.delete(m);
    const g = this.groups.get(m.userData.blockType),
      index = m.userData.instanceIndex,
      last = g.items.pop();
    if (last !== m) {
      g.items[index] = last;
      last.userData.instanceIndex = index;
      this.write(g, last);
    }
    g.mesh.count = g.items.length;
    g.mesh.boundingSphere = null;
    this.world.blocks.delete(key);
    return m;
  }
  nearby(x, z) {
    const found = [];
    for (let cx = Math.round(x) - 1; cx <= Math.round(x) + 1; cx++)
      for (let cz = Math.round(z) - 1; cz <= Math.round(z) + 1; cz++)
        found.push(...(this.columns.get(`${cx},${cz}`) || []));
    return found;
  }
  hit(raycaster) {
    const ray = raycaster.ray,
      origin = ray.origin,
      dir = ray.direction,
      far = raycaster.far;
    let x = Math.floor(origin.x + 0.5),
      z = Math.floor(origin.z + 0.5),
      t = 0,
      best = null;
    const sx = Math.sign(dir.x),
      sz = Math.sign(dir.z),
      dx = dir.x ? Math.abs(1 / dir.x) : Infinity,
      dz = dir.z ? Math.abs(1 / dir.z) : Infinity;
    let tx = dir.x ? (x + (sx > 0 ? 0.5 : -0.5) - origin.x) / dir.x : Infinity;
    let tz = dir.z ? (z + (sz > 0 ? 0.5 : -0.5) - origin.z) / dir.z : Infinity;
    const bounds = new THREE.Box3(),
      point = new THREE.Vector3(),
      half = new THREE.Vector3(0.5, 0.5, 0.5);
    while (t <= far) {
      for (const m of this.columns.get(`${x},${z}`) || []) {
        bounds.min.copy(m.position).sub(half);
        bounds.max.copy(m.position).add(half);
        if (!ray.intersectBox(bounds, point)) continue;
        const distance = origin.distanceTo(point);
        if (distance > far || (best && distance >= best.distance)) continue;
        const d = point.clone().sub(m.position),
          normal = new THREE.Vector3();
        const axis =
          Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)
            ? "x"
            : Math.abs(d.y) >= Math.abs(d.z)
              ? "y"
              : "z";
        normal[axis] = Math.sign(d[axis]);
        best = { object: m, distance, point: point.clone(), face: { normal } };
      }
      if (best && best.distance <= Math.min(tx, tz)) return best;
      if (!Number.isFinite(Math.min(tx, tz))) break;
      if (tx < tz) {
        t = tx;
        tx += dx;
        x += sx;
      } else {
        t = tz;
        tz += dz;
        z += sz;
      }
    }
    return best;
  }
  tint(key, colour) {
    const m = this.world.blocks.get(key);
    if (!m) return;
    const g = this.groups.get(m.userData.blockType);
    g.mesh.setColorAt(m.userData.instanceIndex, new THREE.Color(colour));
    g.mesh.instanceColor.needsUpdate = true;
  }
  dispose() {
    this.groups.forEach((g) => {
      g.mesh?.removeFromParent();
      g.mesh?.dispose();
    });
    this.groups.clear();
    this.columns.clear();
  }
}
