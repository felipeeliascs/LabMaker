/**
 * Bootstrap: scene + printer + visualizer + simulation + worker + UI wiring.
 */
import * as THREE from 'three';
import { state, on, emit } from './app/state.js';
import { createScene } from './scene/scene.js';
import { createPrinter } from './scene/printer-model.js';
import { createPrintVisualizer } from './scene/print-visualizer.js';
import { createCameraRig } from './scene/cameras.js';
import { createSimulation } from './sim/simulation.js';
import { initFileInput } from './ui/file-input.js';
import { initReportPanel } from './ui/report-panel.js';
import { initPlaybackControls } from './ui/playback-controls.js';
import { initProgressOverlay } from './ui/progress.js';
import { estimateMaterial } from './core/mesh-analysis.js';
import { estimatePrintTime } from './core/toolpath.js';

// ---------- scene ----------
const canvas = document.getElementById('viewport');
const { scene, camera, controls, onFrame, onResize } = createScene(canvas);
const printer = createPrinter();
scene.add(printer.root);

const visualizer = createPrintVisualizer(printer.printedGroup, printer.modelGroup);
onResize((w, h) => visualizer.onResize(w, h));
visualizer.onResize(canvas.clientWidth, canvas.clientHeight);

const rig = createCameraRig(camera, controls, printer.nozzleTip);
const sim = createSimulation();

// ---------- UI ----------
initFileInput();
initReportPanel();
const progress = initProgressOverlay();
const updateReadouts = initPlaybackControls(sim);

const layerHeightSelect = document.getElementById('layer-height');
const infillSelect = document.getElementById('infill');
const btnFollow = document.getElementById('btn-follow');

state.layerHeight = parseFloat(layerHeightSelect.value);
state.infill = parseFloat(infillSelect.value);

layerHeightSelect.addEventListener('change', () => {
  state.layerHeight = parseFloat(layerHeightSelect.value);
  invalidateSlice();
});

infillSelect.addEventListener('change', () => {
  state.infill = parseFloat(infillSelect.value);
  if (state.analysis) {
    state.analysis.material = estimateMaterial(
      state.analysis.volume, state.analysis.surfaceArea, state.infill);
    emit('analysis-ready');
    invalidateSlice();
  }
});

for (const btn of document.querySelectorAll('.cam-btn[data-cam]')) {
  btn.addEventListener('click', () => rig.goTo(btn.dataset.cam));
}
btnFollow.addEventListener('click', () => {
  rig.setFollow(!rig.following);
  btnFollow.classList.toggle('active', rig.following);
});

// keyboard: space = play/pause
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
    e.preventDefault();
    document.getElementById('btn-play').click();
  }
});

function invalidateSlice() {
  if (state.sliced) {
    state.sliced = false;
    sim.pause();
  }
  emit('slice-stale');
}

// ---------- toast errors ----------
const toast = document.createElement('div');
toast.style.cssText =
  'position:fixed;bottom:64px;left:50%;transform:translateX(-50%);' +
  'background:#5a2424;color:#ffd9d9;border:1px solid #a04545;border-radius:6px;' +
  'padding:10px 18px;font-size:13px;z-index:50;display:none;max-width:60%';
document.body.appendChild(toast);
let toastTimer = 0;
on('app-error', (msg) => {
  console.error(msg);
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.style.display = 'none'), 5000);
});

// ---------- worker ----------
const worker = new Worker(new URL('./workers/slicer.worker.js', import.meta.url), {
  type: 'module',
});

worker.onmessage = (e) => {
  const msg = e.data;
  switch (msg.type) {
    case 'progress':
      progress.update(msg.phase, msg.pct);
      break;

    case 'analysis': {
      progress.hide();
      state.analysis = msg.stats;
      state.positions = msg.positions;
      state.sliced = false;
      state.layerCount = msg.stats.layerCount;
      buildPreviewMesh(msg.positions);
      // present the model: bed forward, gantry raised clear of the part
      printer.moveTool(0, 100, Math.min(msg.stats.bbox.max[2] + 20, 250));
      emit('model-loaded');
      emit('analysis-ready');
      emit('slice-stale');
      break;
    }

    case 'sliced': {
      progress.hide();
      state.toolpath = msg.toolpath;
      state.layerCount = msg.layerCount;
      state.sliced = true;
      state.timeEstimate = estimatePrintTime(
        msg.toolpath, state.analysis.material.innerVolume, state.infill, msg.layerHeight);
      sim.setToolpath(msg.toolpath);
      visualizer.setToolpath(msg.toolpath, msg.layerHeight);
      // primary mode shows printed strands only; fallback keeps the clipped mesh
      printer.modelGroup.visible = visualizer.usingFallback;
      emit('slice-ready');
      sim.play();
      document.getElementById('btn-play').textContent = '⏸';
      break;
    }

    case 'error':
      progress.hide();
      emit('app-error', msg.message);
      break;
  }
};

worker.onerror = (e) => {
  progress.hide();
  emit('app-error', `Erro no worker: ${e.message}`);
};

on('file-selected', ({ buffer, fileName }) => {
  state.fileName = fileName;
  sim.pause();
  progress.show('parse');
  worker.postMessage(
    { cmd: 'analyze', buffer, fileName, infill: state.infill, layerHeight: state.layerHeight },
    [buffer]
  );
});

on('center-requested', () => {
  if (!state.analysis) return;
  progress.show('analyze');
  worker.postMessage({
    cmd: 'transform',
    offset: state.analysis.centerOffset,
    infill: state.infill,
    layerHeight: state.layerHeight,
  });
});

on('slice-requested', () => {
  if (!state.analysis) return;
  if (!state.analysis.fits) {
    emit('app-error', 'O modelo excede o volume de impressão — centralize-o ou reduza a escala primeiro.');
    return;
  }
  if (state.analysis.needsCentering) {
    emit('app-error', 'O modelo precisa estar apoiado na mesa primeiro — use "Centralizar na mesa e apoiar em Z=0".');
    return;
  }
  sim.pause();
  progress.show('slice');
  worker.postMessage({ cmd: 'slice', layerHeight: state.layerHeight });
});

// ---------- preview mesh ----------
const previewMaterial = new THREE.MeshStandardMaterial({
  color: 0x9fb4cc, roughness: 0.55, metalness: 0.1,
});

function buildPreviewMesh(positions) {
  visualizer.clear();
  for (const child of [...printer.modelGroup.children]) {
    printer.modelGroup.remove(child);
    child.geometry?.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, previewMaterial.clone());
  printer.modelGroup.add(mesh);
  printer.modelGroup.visible = true;
}

// ---------- frame loop ----------
onFrame((dt) => {
  const tick = sim.tick(dt);
  if (tick) {
    printer.moveTool(tick.x, tick.y, tick.z);
    visualizer.setProgress(tick.moveIndex, tick.fraction, tick.x, tick.y);
    updateReadouts(tick);
  }
  rig.update(dt);
});
