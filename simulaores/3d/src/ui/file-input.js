/** File open button, drag-drop overlay, and sample loader. */
import { emit } from '../app/state.js';

export function initFileInput() {
  const input = document.getElementById('file-input');
  const btnOpen = document.getElementById('btn-open');
  const overlay = document.getElementById('drop-overlay');
  const sampleSelect = document.getElementById('sample-select');

  btnOpen.addEventListener('click', () => input.click());

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (file) await loadFile(file);
    input.value = ''; // allow re-selecting the same file
  });

  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragDepth++;
    overlay.hidden = false;
  });
  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (--dragDepth <= 0) { dragDepth = 0; overlay.hidden = true; }
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDepth = 0;
    overlay.hidden = true;
    const file = e.dataTransfer.files[0];
    if (file) await loadFile(file);
  });

  sampleSelect.addEventListener('change', async () => {
    const url = sampleSelect.value;
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      emit('file-selected', { buffer, fileName: url.split('/').pop() });
    } catch (err) {
      emit('app-error', `Não foi possível carregar o exemplo: ${err.message}`);
    }
    sampleSelect.value = '';
  });

  async function loadFile(file) {
    if (!/\.stl$/i.test(file.name)) {
      emit('app-error', 'Selecione um arquivo .stl.');
      return;
    }
    const buffer = await file.arrayBuffer();
    emit('file-selected', { buffer, fileName: file.name });
  }
}
