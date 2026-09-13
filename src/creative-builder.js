import * as THREE from "three";
import {
  BLOCKS,
  TNT,
  CREATIVE_LIMIT,
  CREATIVE_HEIGHT,
  blockData,
  blockKey,
  brushBlocks,
  blueprintBlocks,
} from "./blocks.js";

export class CreativeBuilder {
  constructor(world) {
    this.world = world;
    this.mode = "single";
    this.anchor = null;
    this.rotation = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.fuses = new Map();
    this.chain = null;
    this.effects = [];
    this.clock = 0;
  }
  preview(point) {
    if (!point) {
      if (this.ghost) this.ghost.visible = false;
      return;
    }
    const cells = this.mode.startsWith("stamp:")
      ? blueprintBlocks(this.mode.slice(6), point, this.rotation)
      : this.anchor
        ? brushBlocks(this.mode, this.anchor, point, this.world.selectedBlock)
        : [{ ...point, type: this.world.selectedBlock }];
    if (!this.ghost) {
      this.ghost = new THREE.InstancedMesh(
        this.world.geo,
        new THREE.MeshBasicMaterial({
          color: 0x95f2bd,
          transparent: true,
          opacity: 0.35,
          wireframe: true,
          depthWrite: false,
        }),
        1024,
      );
      this.ghost.frustumCulled = false;
      this.world.root.add(this.ghost);
    }
    this.ghost.visible = !!cells.length && !this.fuses.size;
    this.ghost.count = Math.min(1024, cells.length);
    const matrix = new THREE.Matrix4();
    cells
      .slice(0, 1024)
      .forEach((b, i) =>
        this.ghost.setMatrixAt(i, matrix.makeTranslation(b.x, b.y, b.z)),
      );
    this.ghost.instanceMatrix.needsUpdate = true;
    const free = cells.filter((b) => !this.world.blocks.has(blockKey(b)));
    this.ghost.material.color.set(
      free.some((b) => !this.valid(b)) ||
        this.world.blocks.size + free.length > CREATIVE_LIMIT
        ? 0xff7666
        : 0x95f2bd,
    );
  }
  choose(mode) {
    this.mode = mode;
    this.anchor = null;
    this.world.callbacks.creative?.();
  }
  valid(b) {
    const w = this.world;
    return (
      BLOCKS[b.type] &&
      Number.isInteger(b.x) &&
      Number.isInteger(b.z) &&
      Number.isFinite(b.y) &&
      b.y <= CREATIVE_HEIGHT &&
      b.y >= w.heightAt(b.x, b.z) + 0.45 &&
      w.heightAt(b.x, b.z) > -5 &&
      !(
        Math.abs(b.x - w.player.x) < 0.8 &&
        Math.abs(b.z - w.player.z) < 0.8 &&
        Math.abs(b.y - w.player.y) < 2
      )
    );
  }
  commit(edit) {
    if (!edit.added.length && !edit.removed.length) return false;
    this.undoStack.push(edit);
    if (this.undoStack.length > 24) this.undoStack.shift();
    this.redoStack = [];
    this.changed();
    return true;
  }
  changed() {
    this.world.renderer.shadowMap.needsUpdate = true;
    this.world.changedBuilding();
    this.world.callbacks.creative?.();
  }
  place(point) {
    const w = this.world;
    if (this.fuses.size) {
      w.callbacks.tip?.("Let the TNT finish, or undo to stop the fuse.");
      return;
    }
    let cells;
    if (["line", "wall", "floor"].includes(this.mode)) {
      if (!this.anchor) {
        this.anchor = { ...point };
        w.callbacks.tip?.(
          "First corner set. Aim at the other corner and place again.",
        );
        w.callbacks.creative?.();
        return;
      }
      cells = brushBlocks(this.mode, this.anchor, point, w.selectedBlock);
      this.anchor = null;
      w.callbacks.creative?.();
      if (!cells.length) {
        w.callbacks.tip?.("Choose corners no more than 24 blocks apart.");
        return;
      }
    } else if (this.mode.startsWith("stamp:"))
      cells = blueprintBlocks(this.mode.slice(6), point, this.rotation);
    else cells = [{ ...point, type: w.selectedBlock }];
    const added = cells.filter((b) => !w.blocks.has(blockKey(b)));
    if (w.blocks.size + added.length > CREATIVE_LIMIT) {
      w.callbacks.tip?.(
        "This world has room for 8,000 blocks. Mine or undo something to make space.",
      );
      return;
    }
    if (added.some((b) => !this.valid(b))) {
      w.callbacks.tip?.(
        "Move the design onto clear ground, away from you and within the height limit.",
      );
      return;
    }
    added.forEach((b) => w.voxels.add(b));
    if (
      this.commit({
        added,
        removed: [],
        label: this.mode.startsWith("stamp:") ? "blueprint" : "build",
      })
    )
      w.callbacks.tip?.(
        added.length > 1
          ? `${added.length} blocks built. Z undoes this whole design.`
          : `${BLOCKS[w.selectedBlock].name} placed`,
      );
  }
  mine(record) {
    if (this.fuses.size) {
      this.world.callbacks.tip?.(
        "Let the TNT finish, or press Z to stop the fuse.",
      );
      return;
    }
    const b = blockData(record);
    this.world.voxels.remove(blockKey(b));
    this.world.burst(record.position, 5);
    this.commit({ added: [], removed: [b], label: "mining" });
  }
  ignite(record, seconds = 3) {
    const key = record?.userData.blockKey;
    if (record?.userData.blockType !== TNT || this.fuses.has(key)) return false;
    this.chain ??= { added: [], removed: [], label: "TNT blast" };
    this.fuses.set(key, seconds);
    this.world.callbacks.creative?.();
    return true;
  }
  stopFuses() {
    this.fuses.forEach((_, key) => this.world.voxels.tint(key, 0xffffff));
    this.fuses.clear();
  }
  undo() {
    if (this.fuses.size) {
      this.stopFuses();
      const edit = this.chain;
      this.chain = null;
      if (edit?.removed.length) this.commit(edit);
      else {
        this.world.callbacks.tip?.("Fuse stopped. Your TNT is safe to move.");
        this.world.callbacks.creative?.();
        return;
      }
    }
    const edit = this.undoStack.pop();
    if (!edit) {
      this.world.callbacks.tip?.("Nothing to undo from this world visit yet.");
      return;
    }
    edit.added.forEach((b) => this.world.voxels.remove(blockKey(b)));
    edit.removed.forEach((b) => this.world.voxels.add(b));
    this.redoStack.push(edit);
    this.world.ensureBuildClearance();
    this.changed();
    this.world.callbacks.tip?.(`Undid ${edit.label}. Y puts it back.`);
  }
  redo() {
    if (this.fuses.size) return;
    const edit = this.redoStack.pop();
    if (!edit) return;
    edit.removed.forEach((b) => this.world.voxels.remove(blockKey(b)));
    edit.added.forEach((b) => this.world.voxels.add(b));
    this.undoStack.push(edit);
    this.world.ensureBuildClearance();
    this.changed();
  }
  detonate(key) {
    const source = this.world.blocks.get(key);
    if (!source) return;
    const center = source.position.clone();
    for (const m of [...this.world.blocks.values()]) {
      if (m.position.distanceTo(center) > 4.5) continue;
      if (m.userData.blockType === TNT && m !== source) {
        this.ignite(m, 0.25 + m.position.distanceTo(center) * 0.06);
        continue;
      }
      this.chain.removed.push(blockData(m));
      this.world.voxels.remove(m.userData.blockKey);
    }
    this.blastEffect(center);
    this.world.callbacks.explosion?.();
    this.world.renderer.shadowMap.needsUpdate = true;
  }
  blastEffect(center) {
    const w = this.world;
    const material = new THREE.MeshBasicMaterial({
      color: 0xffbb5c,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material);
    shell.position.copy(center);
    w.root.add(shell);
    this.effects.push({ shell, life: 0 });
    w.burst(center, w.reducedMotion ? 12 : 55);
  }
  update(dt) {
    if (dt <= 0) return;
    this.clock += dt;
    let count = 0;
    for (const [key, time] of [...this.fuses]) {
      this.fuses.set(key, time - dt);
      this.world.voxels.tint(
        key,
        Math.sin(this.clock * 18) > 0 ? 0xffe0bb : 0xffffff,
      );
      if (time <= 0 && count++ < 4) {
        this.fuses.delete(key);
        this.detonate(key);
      }
    }
    if (count > 0 && this.fuses.size) this.world.changedBuilding();
    if (this.chain && !this.fuses.size) {
      const edit = this.chain;
      this.chain = null;
      this.commit(edit);
      this.world.callbacks.tip?.(
        `Boom! ${edit.removed.length} blocks cleared. Press Z to rebuild them.`,
      );
    }
    this.effects = this.effects.filter((e) => {
      e.life += dt;
      e.shell.scale.setScalar(0.5 + e.life * 8);
      e.shell.material.opacity = Math.max(0, 0.45 - e.life * 0.6);
      if (e.life < 0.8) return true;
      e.shell.removeFromParent();
      e.shell.geometry.dispose();
      e.shell.material.dispose();
      return false;
    });
  }
  dispose() {
    this.stopFuses();
    this.ghost?.removeFromParent();
    this.ghost?.material.dispose();
    this.ghost?.dispose();
    this.effects.forEach((e) => {
      e.shell.removeFromParent();
      e.shell.geometry.dispose();
      e.shell.material.dispose();
    });
    this.effects = [];
  }
}
