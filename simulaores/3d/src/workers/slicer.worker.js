/**
 * Slicer worker. Keeps the parsed mesh in module scope so re-slicing at a new
 * layer height skips re-parsing.
 *
 * main → worker:
 *   { cmd: 'analyze', buffer, fileName, infill, layerHeight }   (buffer transferred)
 *   { cmd: 'transform', offset: [dx,dy,dz], infill, layerHeight }
 *   { cmd: 'slice', layerHeight }
 *
 * worker → main:
 *   { type: 'progress', phase: 'parse'|'analyze'|'slice'|'toolpath', pct }
 *   { type: 'analysis', stats, positions }      (positions copy for preview mesh)
 *   { type: 'sliced', toolpath, layerCount, layerHeight }   (typed arrays transferred)
 *   { type: 'error', message }
 */
import { parseSTL } from '../core/stl-parser.js';
import { analyzeMesh, translatePositions } from '../core/mesh-analysis.js';
import { sliceMesh } from '../core/slicer.js';
import { buildToolpath } from '../core/toolpath.js';

let positions = null;

self.onmessage = (e) => {
  const msg = e.data;
  try {
    switch (msg.cmd) {
      case 'analyze': {
        progress('parse', 0);
        const parsed = parseSTL(msg.buffer);
        positions = parsed.positions;
        progress('analyze', 0.3);
        sendAnalysis(parsed.format, msg.infill, msg.layerHeight);
        break;
      }
      case 'transform': {
        if (!positions) throw new Error('Nenhum modelo carregado.');
        translatePositions(positions, msg.offset);
        sendAnalysis(undefined, msg.infill, msg.layerHeight);
        break;
      }
      case 'slice': {
        if (!positions) throw new Error('Nenhum modelo carregado.');
        progress('slice', 0);
        const layers = sliceMesh(positions, msg.layerHeight, (pct) => progress('slice', pct * 0.8));
        progress('toolpath', 0.8);
        const tp = buildToolpath(layers, (pct) => progress('toolpath', 0.8 + pct * 0.2));
        self.postMessage(
          {
            type: 'sliced',
            layerCount: layers.length,
            layerHeight: msg.layerHeight,
            toolpath: {
              endpoints: tp.endpoints,
              z: tp.z,
              kinds: tp.kinds,
              cumTime: tp.cumTime,
              cumPrintedSegments: tp.cumPrintedSegments,
              layerOfMove: tp.layerOfMove,
              layerStartMove: tp.layerStartMove,
              numMoves: tp.numMoves,
              totalTime: tp.totalTime,
              printDistance: tp.printDistance,
            },
          },
          [
            tp.endpoints.buffer, tp.z.buffer, tp.kinds.buffer, tp.cumTime.buffer,
            tp.cumPrintedSegments.buffer, tp.layerOfMove.buffer, tp.layerStartMove.buffer,
          ]
        );
        break;
      }
      default:
        throw new Error(`Comando desconhecido: ${msg.cmd}`);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};

function sendAnalysis(format, infill, layerHeight) {
  const stats = analyzeMesh(positions, { infill, layerHeight });
  if (format) stats.format = format;
  // copy positions for the main-thread preview mesh (original stays here)
  const copy = positions.slice();
  self.postMessage({ type: 'analysis', stats, positions: copy }, [copy.buffer]);
}

function progress(phase, pct) {
  self.postMessage({ type: 'progress', phase, pct });
}
