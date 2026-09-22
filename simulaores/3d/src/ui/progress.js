/** Modal progress overlay shown while the worker parses/analyzes/slices. */

const PHASE_LABELS = {
  parse: 'Lendo STL…',
  analyze: 'Analisando malha…',
  slice: 'Fatiando camadas…',
  toolpath: 'Gerando trajetória…',
};

export function initProgressOverlay() {
  const overlay = document.getElementById('progress-overlay');
  const label = document.getElementById('progress-label');
  const bar = document.getElementById('progress-bar');

  return {
    show(phase = 'parse') {
      overlay.hidden = false;
      label.textContent = PHASE_LABELS[phase] || 'Processando…';
      bar.style.width = '0%';
    },
    update(phase, pct) {
      overlay.hidden = false;
      label.textContent = PHASE_LABELS[phase] || 'Processando…';
      bar.style.width = `${Math.round(pct * 100)}%`;
    },
    hide() {
      overlay.hidden = true;
    },
  };
}
