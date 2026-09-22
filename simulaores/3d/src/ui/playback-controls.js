/** Playback bar: play/pause, speed slider, scrubber, layer indicator. */
import { state, on } from '../app/state.js';

// log-scale slider 0..100 → 0.5×..100×
const sliderToSpeed = (v) => 0.5 * Math.pow(200, v / 100);
const speedLabel = (s) => (s >= 10 ? `${Math.round(s)}×` : `${s.toFixed(1)}×`);

export function initPlaybackControls(sim) {
  const bar = document.getElementById('playback-bar');
  const btnPlay = document.getElementById('btn-play');
  const btnRestart = document.getElementById('btn-restart');
  const slider = document.getElementById('speed-slider');
  const label = document.getElementById('speed-label');
  const scrubber = document.getElementById('scrubber');
  const pct = document.getElementById('progress-pct');
  const layerIndicator = document.getElementById('layer-indicator');

  let scrubbing = false;

  sim.setSpeed(sliderToSpeed(+slider.value));
  label.textContent = speedLabel(sim.speed);

  btnPlay.addEventListener('click', () => {
    sim.toggle();
    btnPlay.textContent = sim.playing ? '⏸' : '▶';
  });
  btnRestart.addEventListener('click', () => sim.restart());

  slider.addEventListener('input', () => {
    sim.setSpeed(sliderToSpeed(+slider.value));
    label.textContent = speedLabel(sim.speed);
  });

  scrubber.addEventListener('pointerdown', () => { scrubbing = true; });
  scrubber.addEventListener('pointerup', () => { scrubbing = false; });
  scrubber.addEventListener('input', () => sim.seek(+scrubber.value / 10000));

  on('slice-ready', () => {
    bar.classList.remove('disabled');
    btnPlay.textContent = '▶';
    scrubber.value = 0;
  });

  on('slice-stale', () => {
    bar.classList.add('disabled');
  });

  on('model-loaded', () => {
    bar.classList.add('disabled');
  });

  /** Called every frame with the sim tick result (or null). */
  return function updateReadouts(tick) {
    if (!tick) return;
    if (!scrubbing) scrubber.value = Math.round(tick.progress * 10000);
    pct.textContent = `${Math.round(tick.progress * 100)}%`;
    layerIndicator.textContent = `Camada ${tick.layer + 1} / ${state.layerCount}`;
    if (!sim.playing && btnPlay.textContent === '⏸') btnPlay.textContent = '▶';
  };
}
