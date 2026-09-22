/** Analysis report panel: stats table, printability checks, action buttons. */
import { state, on, emit } from '../app/state.js';
import { BUILD_VOLUME } from '../core/mesh-analysis.js';
import { formatDuration } from '../core/toolpath.js';

const fmt = (v, digits = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: digits });

export function initReportPanel() {
  const el = (id) => document.getElementById(id);
  const empty = el('report-empty');
  const content = el('report-content');
  const checks = el('checks');
  const btnCenter = el('btn-center');
  const btnSlice = el('btn-slice');

  btnCenter.addEventListener('click', () => emit('center-requested'));
  btnSlice.addEventListener('click', () => emit('slice-requested'));

  on('analysis-ready', () => {
    const a = state.analysis;
    empty.hidden = true;
    content.hidden = false;

    el('stat-file').textContent = state.fileName ?? '–';
    el('stat-dims').textContent =
      `${fmt(a.bbox.size[0])} × ${fmt(a.bbox.size[1])} × ${fmt(a.bbox.size[2])} mm`;
    el('stat-tris').textContent = a.triangleCount.toLocaleString('pt-BR');
    el('stat-volume').textContent =
      `${fmt(a.volume / 1000, 2)} cm³${a.manifold.watertight ? '' : ' (aprox.)'}`;
    el('stat-area').textContent = `${fmt(a.surfaceArea / 100, 1)} cm²`;
    el('stat-material').textContent =
      `≈ ${fmt(a.material.grams, 1)} g PLA (${Math.round(state.infill * 100)}% de preenchimento)`;
    el('stat-layers').textContent = `${a.layerCount} @ ${state.layerHeight} mm`;
    el('stat-time').textContent = 'fatie para estimar';

    renderChecks(a);
    btnCenter.hidden = !a.needsCentering;
    btnSlice.disabled = false;
    btnSlice.textContent = 'Fatiar e preparar impressão ▸';
  });

  on('slice-ready', () => {
    const est = state.timeEstimate;
    if (est) {
      el('stat-time').textContent =
        `≈ ${formatDuration(est.totalTime)} (${formatDuration(est.perimeterTime)} paredes + ${formatDuration(est.infillTime)} preenchimento)`;
    }
    btnSlice.textContent = '✓ Fatiado — pronto para imprimir';
    btnSlice.disabled = true;
  });

  on('slice-stale', () => {
    if (!state.analysis) return;
    el('stat-time').textContent = 'fatie para estimar';
    el('stat-layers').textContent =
      `${Math.max(1, Math.ceil(state.analysis.bbox.size[2] / state.layerHeight))} @ ${state.layerHeight} mm`;
    btnSlice.textContent = 'Fatiar e preparar impressão ▸';
    btnSlice.disabled = false;
  });

  function renderChecks(a) {
    checks.innerHTML = '';
    const add = (cls, text) => {
      const li = document.createElement('li');
      li.className = cls;
      li.textContent = text;
      checks.appendChild(li);
    };

    if (a.fits) {
      add('ok', `Cabe no volume de impressão (${BUILD_VOLUME.x}×${BUILD_VOLUME.y}×${BUILD_VOLUME.z} mm)`);
    } else {
      const over = ['x', 'y', 'z'].filter((ax) => !a.fitsBuildVolume[ax]).join(', ').toUpperCase();
      add('bad', `Excede o volume de impressão em ${over}`);
    }

    if (a.manifold.watertight) {
      add('ok', 'Malha fechada e manifold');
    } else {
      const parts = [];
      if (a.manifold.boundaryEdges) parts.push(`${a.manifold.boundaryEdges} arestas de borda`);
      if (a.manifold.nonManifoldEdges) parts.push(`${a.manifold.nonManifoldEdges} arestas non-manifold`);
      if (a.manifold.inconsistentEdges) parts.push(`${a.manifold.inconsistentEdges} faces invertidas`);
      add('bad', `Malha não fechada (${parts.join(', ') || 'defeitos desconhecidos'}) — a impressão pode ter falhas`);
    }

    if (a.needsCentering) {
      add('warn', 'O modelo não está centralizado na mesa em Z=0');
    } else {
      add('ok', 'Centralizado na mesa em Z=0');
    }
  }
}
