/**
 * Print playback. Nozzle position is a PURE function of simTime (binary
 * search over cumTime), so any speed multiplier and scrubbing in both
 * directions cost O(log n) per frame — no per-move stepping.
 */
import { moveAtTime } from '../core/toolpath.js';

export function createSimulation() {
  let toolpath = null;
  let simTime = 0;
  let playing = false;
  let speed = 8;
  let finished = false;

  return {
    get playing() { return playing; },
    get speed() { return speed; },
    get simTime() { return simTime; },
    get finished() { return finished; },
    get totalTime() { return toolpath ? toolpath.totalTime : 0; },
    get loaded() { return !!toolpath; },

    setToolpath(tp) {
      toolpath = tp;
      simTime = 0;
      playing = false;
      finished = false;
    },

    play() { if (toolpath) { if (finished) this.restart(); playing = true; } },
    pause() { playing = false; },
    toggle() { playing ? this.pause() : this.play(); },
    restart() { simTime = 0; finished = false; },
    setSpeed(s) { speed = s; },

    /** Jump to a fraction of total print time (scrubber). */
    seek(fraction) {
      if (!toolpath) return;
      simTime = fraction * toolpath.totalTime;
      finished = fraction >= 1;
    },

    /**
     * Advance the clock and resolve the current state.
     * @param {number} dt wall-clock seconds since last frame
     * @returns {null | {moveIndex:number, fraction:number, x:number, y:number,
     *   z:number, layer:number, progress:number, printing:boolean}}
     */
    tick(dt) {
      if (!toolpath || toolpath.numMoves === 0) return null;
      if (playing && !finished) {
        simTime += Math.min(dt, 0.1) * speed;
        if (simTime >= toolpath.totalTime) {
          simTime = toolpath.totalTime;
          finished = true;
          playing = false;
        }
      }
      const { index, fraction } = moveAtTime(toolpath.cumTime, toolpath.numMoves, simTime);
      const e = toolpath.endpoints;
      const x = e[index * 4] + fraction * (e[index * 4 + 2] - e[index * 4]);
      const y = e[index * 4 + 1] + fraction * (e[index * 4 + 3] - e[index * 4 + 1]);
      return {
        moveIndex: index,
        fraction,
        x, y,
        z: toolpath.z[index],
        layer: toolpath.layerOfMove[index],
        progress: toolpath.totalTime > 0 ? simTime / toolpath.totalTime : 0,
        printing: playing,
      };
    },
  };
}
