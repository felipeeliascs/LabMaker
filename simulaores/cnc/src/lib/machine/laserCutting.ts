import * as THREE from 'three';
import { BED, CutPoint, CutProgram } from './cutProgram';

export type CutStatus = 'empty' | 'ready' | 'running' | 'paused' | 'completed';

/** Persistent sheet, planned path, and progressive kerf, all in machine coordinates. */
export class LaserCutting {
  group = new THREE.Group();
  program: CutProgram | null = null;
  status: CutStatus = 'empty';
  speedMultiplier = 1;
  elapsed = 0;
  position: CutPoint = { x: 0, y: 0 };
  laserOn = false;
  message = '';
  private index = 0;
  private segmentElapsed = 0;
  private trace: THREE.LineSegments | null = null;
  private preview: THREE.LineSegments | null = null;
  private tracePositions: THREE.BufferAttribute | null = null;
  private beam: THREE.Mesh;
  private spot: THREE.Mesh;

  constructor() {
    this.group.name = 'MDF and laser cut';
    const pixels = new Uint8Array(128 * 128 * 4);
    let seed = 42;
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed % 25) - 12;
      pixels[i] = 184 + grain; pixels[i + 1] = 139 + grain;
      pixels[i + 2] = 84 + grain; pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 128, 128);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 6);
    texture.needsUpdate = true;
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(BED.width, BED.height, BED.thickness),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0 }));
    sheet.name = 'Chapa MDF 960 x 720 x 3 mm';
    sheet.position.set(BED.x + BED.width / 2, BED.y - BED.height / 2, BED.z - BED.thickness / 2);
    sheet.receiveShadow = true;
    this.group.add(sheet);
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3311, transparent: true, opacity: 0.8 }));
    this.beam.rotation.x = Math.PI / 2;
    this.spot = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffa329 }));
    this.group.add(this.beam, this.spot);
    this.updateBeam();
  }

  get progress() { return this.program ? Math.min(1, this.elapsed / this.program.duration) : 0; }
  setSpeed(value: number) { this.speedMultiplier = Math.max(0.5, Math.min(10, value)); }

  load(program: CutProgram) {
    this.clearPaths();
    this.program = program;
    const positions = new Float32Array(program.segments.length * 6);
    program.segments.forEach((s, i) => {
      if (!s.cutting) return;
      positions.set([BED.x + s.from.x, BED.y - s.from.y, BED.z + 0.18,
        BED.x + s.to.x, BED.y - s.to.y, BED.z + 0.18], i * 6);
    });
    const previewGeo = new THREE.BufferGeometry();
    previewGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Travel segments are degenerate and therefore never mark the sheet.
    this.preview = new THREE.LineSegments(previewGeo,
      new THREE.LineBasicMaterial({ color: 0x765f43, transparent: true, opacity: 0.28 }));
    const traceGeo = new THREE.BufferGeometry();
    this.tracePositions = new THREE.BufferAttribute(new Float32Array(positions.length), 3);
    this.tracePositions.setUsage(THREE.DynamicDrawUsage);
    traceGeo.setAttribute('position', this.tracePositions);
    traceGeo.setDrawRange(0, 0);
    this.trace = new THREE.LineSegments(traceGeo, new THREE.LineBasicMaterial({ color: 0x241006 }));
    this.trace.frustumCulled = false;
    this.group.add(this.preview, this.trace);
    this.reset();
  }

  start() {
    if (!this.program || this.status === 'running' || this.status === 'completed') return;
    this.status = 'running'; this.message = '';
  }

  pause(message = 'Corte pausado.') {
    if (this.status === 'running') { this.status = 'paused'; this.message = message; }
    this.laserOn = false;
    this.updateBeam();
  }

  reset() {
    this.index = 0; this.segmentElapsed = 0; this.elapsed = 0;
    this.laserOn = false; this.message = '';
    this.status = this.program ? 'ready' : 'empty';
    if (this.program) this.position = { ...this.program.segments[0].from };
    this.trace?.geometry.setDrawRange(0, 0);
    this.updateBeam();
  }

  advance(dt: number) {
    if (this.status !== 'running' || !this.program) return;
    let remaining = Math.max(0, dt) * this.speedMultiplier;
    const segments = this.program.segments;
    while (remaining > 0 && this.index < segments.length) {
      const s = segments[this.index];
      const duration = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) / s.speed;
      const step = Math.min(remaining, duration - this.segmentElapsed);
      this.segmentElapsed += step; this.elapsed += step; remaining -= step;
      const t = Math.min(1, this.segmentElapsed / duration);
      this.position.x = s.from.x + (s.to.x - s.from.x) * t;
      this.position.y = s.from.y + (s.to.y - s.from.y) * t;
      this.laserOn = s.cutting;
      if (s.cutting && this.tracePositions && this.trace) {
        const vertex = this.index * 2;
        this.tracePositions.setXYZ(vertex, BED.x + s.from.x, BED.y - s.from.y, BED.z + 0.3);
        this.tracePositions.setXYZ(vertex + 1, BED.x + this.position.x, BED.y - this.position.y, BED.z + 0.3);
        this.tracePositions.needsUpdate = true;
        this.trace.geometry.setDrawRange(0, vertex + 2);
      }
      if (this.segmentElapsed >= duration - 1e-9) { this.index++; this.segmentElapsed = 0; }
    }
    if (this.index >= segments.length) {
      this.status = 'completed'; this.elapsed = this.program.duration; this.laserOn = false;
      this.message = 'Corte concluído. Reinicie para cortar uma nova chapa.';
    }
    this.updateBeam();
  }

  private updateBeam() {
    this.beam.visible = this.spot.visible = this.laserOn;
    this.beam.position.set(BED.x + this.position.x, BED.y - this.position.y, BED.z + 2);
    this.spot.position.set(BED.x + this.position.x, BED.y - this.position.y, BED.z + 0.5);
  }

  private clearPaths() {
    for (const line of [this.trace, this.preview]) {
      if (!line) continue;
      line.geometry.dispose(); (line.material as THREE.Material).dispose(); this.group.remove(line);
    }
    this.trace = this.preview = null; this.tracePositions = null;
  }

  dispose() {
    this.clearPaths();
    this.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material as THREE.MeshStandardMaterial;
        material.map?.dispose(); material.dispose();
      }
    });
    this.group.removeFromParent(); this.group.clear();
  }
}
