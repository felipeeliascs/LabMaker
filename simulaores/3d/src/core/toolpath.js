/**
 * Toolpath generation: ordered move list from sliced layers, prefix sums for
 * playback, print-time and material estimates. Pure functions.
 *
 * Move kinds:
 */
export const PRINT = 0;
export const TRAVEL = 1;

export const PRINT_SPEED = 50;   // mm/s
export const TRAVEL_SPEED = 150; // mm/s
export const LAYER_DWELL = 0.5;  // s pause at each layer change

/**
 * Build the flat move list and playback prefix sums.
 *
 * @param {Array<{z:number, contours:Array<{points:Float32Array, length:number, closed:boolean}>}>} layers
 * @param {(pct:number)=>void} [onProgress]
 * @returns {{
 *   endpoints: Float32Array,      // 4 per move: x0,y0,x1,y1
 *   z: Float32Array,              // 1 per move
 *   kinds: Uint8Array,            // PRINT | TRAVEL
 *   cumTime: Float64Array,        // numMoves+1, includes layer dwells
 *   cumPrintedSegments: Uint32Array, // numMoves+1: print segments completed before move i
 *   layerOfMove: Uint32Array,
 *   numMoves: number,
 *   totalTime: number,            // s
 *   printDistance: number,        // mm
 *   layerStartMove: Uint32Array,  // layerCount entries: first move index of each layer
 * }}
 */
export function buildToolpath(layers, onProgress) {
  // First pass: count moves. Each contour contributes (points-1 [+1 if closed])
  // print moves plus one leading travel move.
  let numMoves = 0;
  for (const layer of layers) {
    for (const c of layer.contours) {
      const n = c.points.length / 2;
      if (n < 2) continue;
      numMoves += 1 + (n - 1) + (c.closed ? 1 : 0);
    }
  }

  const endpoints = new Float32Array(numMoves * 4);
  const z = new Float32Array(numMoves);
  const kinds = new Uint8Array(numMoves);
  const cumTime = new Float64Array(numMoves + 1);
  const cumPrintedSegments = new Uint32Array(numMoves + 1);
  const layerOfMove = new Uint32Array(numMoves);
  const layerStartMove = new Uint32Array(layers.length);

  let m = 0;
  let curX = 0, curY = 0; // nozzle parked at origin
  let printDistance = 0;
  let time = 0;

  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    layerStartMove[li] = m;
    if (layer.contours.length > 0) time += LAYER_DWELL;

    // nearest-neighbor ordering of contours from the current position
    const remaining = layer.contours.filter((c) => c.points.length >= 4);
    while (remaining.length > 0) {
      let best = 0, bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i].points;
        const d = (p[0] - curX) ** 2 + (p[1] - curY) ** 2;
        if (d < bestDist) { bestDist = d; best = i; }
      }
      const contour = remaining.splice(best, 1)[0];
      const pts = contour.points;
      const n = pts.length / 2;

      // travel to contour start
      m = emit(m, TRAVEL, curX, curY, pts[0], pts[1], layer.z, li);
      curX = pts[0]; curY = pts[1];

      for (let i = 1; i < n; i++) {
        m = emit(m, PRINT, curX, curY, pts[i * 2], pts[i * 2 + 1], layer.z, li);
        curX = pts[i * 2]; curY = pts[i * 2 + 1];
      }
      if (contour.closed) {
        m = emit(m, PRINT, curX, curY, pts[0], pts[1], layer.z, li);
        curX = pts[0]; curY = pts[1];
      }
    }
    if (onProgress && (li & 31) === 31) onProgress(li / layers.length);
  }

  function emit(i, kind, x0, y0, x1, y1, zi, layerIndex) {
    endpoints[i * 4] = x0;
    endpoints[i * 4 + 1] = y0;
    endpoints[i * 4 + 2] = x1;
    endpoints[i * 4 + 3] = y1;
    z[i] = zi;
    kinds[i] = kind;
    layerOfMove[i] = layerIndex;
    const length = Math.hypot(x1 - x0, y1 - y0);
    const speed = kind === PRINT ? PRINT_SPEED : TRAVEL_SPEED;
    cumTime[i] = time;
    time += length / speed;
    cumPrintedSegments[i + 1] = cumPrintedSegments[i] + (kind === PRINT ? 1 : 0);
    if (kind === PRINT) printDistance += length;
    return i + 1;
  }

  cumTime[numMoves] = time;
  // cumTime[i] currently stores the START time of move i; playback needs that
  // plus the final total. (cumPrintedSegments already complete.)

  return {
    endpoints, z, kinds, cumTime, cumPrintedSegments, layerOfMove,
    layerStartMove, numMoves, totalTime: time, printDistance,
  };
}

/**
 * Full print-time estimate: perimeter toolpath time plus an approximation of
 * the infill we don't actually slice — infill volume converted to path length
 * at the nominal extrusion cross-section.
 */
export function estimatePrintTime(toolpath, innerVolumeMM3, infill, layerHeight, extrusionWidth = 0.4) {
  const infillLength = (infill * innerVolumeMM3) / (layerHeight * extrusionWidth);
  const infillTime = infillLength / PRINT_SPEED;
  return {
    perimeterTime: toolpath.totalTime,
    infillTime,
    totalTime: toolpath.totalTime + infillTime,
  };
}

/** "2h 34m" / "7m 05s" style formatting. */
export function formatDuration(seconds) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), rs = s % 60;
  if (m < 60) return `${m}min ${String(rs).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}min`;
}

/**
 * Binary-search the move active at simTime.
 * @returns {{ index: number, fraction: number }} clamped to the path ends
 */
export function moveAtTime(cumTime, numMoves, simTime) {
  if (numMoves === 0) return { index: 0, fraction: 0 };
  if (simTime <= cumTime[0]) return { index: 0, fraction: 0 };
  if (simTime >= cumTime[numMoves]) return { index: numMoves - 1, fraction: 1 };
  let lo = 0, hi = numMoves - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cumTime[mid] <= simTime) lo = mid;
    else hi = mid - 1;
  }
  const duration = cumTime[lo + 1] - cumTime[lo];
  // dwell gaps make duration > geometric time; fraction still maps sanely
  const fraction = duration > 0 ? Math.min((simTime - cumTime[lo]) / duration, 1) : 1;
  return { index: lo, fraction };
}
