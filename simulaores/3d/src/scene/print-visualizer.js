/**
 * Progressive print rendering.
 *
 * Primary technique: ONE preallocated instanced fat-line batch holding every
 * print segment in print order; revealing progress is just
 * `geometry.instanceCount = n` — zero buffer uploads, instant bidirectional
 * scrubbing, one draw call.
 *
 * Fallback (huge models, > MAX_BATCH_SEGMENTS): clipping-plane reveal of the
 * original mesh plus only the current layer's segments as fat lines.
 */
import * as THREE from 'three';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { PRINT } from '../core/toolpath.js';

const MAX_BATCH_SEGMENTS = 2_000_000;
const COLOR_BOTTOM = new THREE.Color(0x3aa0ff);
const COLOR_TOP = new THREE.Color(0xff8c2e);

export function createPrintVisualizer(printedGroup, modelGroup) {
  const lineMaterial = new LineMaterial({
    vertexColors: true,
    worldUnits: true,
    linewidth: 0.3,
  });
  const partialMaterial = new LineMaterial({
    color: 0xffe08a,
    worldUnits: true,
    linewidth: 0.34,
  });

  let toolpath = null;
  let fallback = false;
  let batchLine = null;       // LineSegments2 for all segments (primary mode)
  let layerLine = null;       // current layer only (fallback mode)
  let layerLineLayer = -1;
  let partialLine = null;     // the one in-progress segment
  let clipPlane = null;
  let clippedMesh = null;
  let layerHeight = 0.2;

  /** Segment index range [first, last) of print segments belonging to layer li. */
  function layerSegmentRange(li) {
    const { layerStartMove, cumPrintedSegments, numMoves } = toolpath;
    const start = layerStartMove[li];
    const end = li + 1 < layerStartMove.length ? layerStartMove[li + 1] : numMoves;
    return [cumPrintedSegments[start], cumPrintedSegments[end]];
  }

  /** Build positions (+optional colors) for print segments [first, last). */
  function buildSegmentArrays(first, last, withColors, startMove = 0) {
    const { endpoints, z, kinds, numMoves, cumPrintedSegments } = toolpath;
    const count = last - first;
    const positions = new Float32Array(count * 6);
    const colors = withColors ? new Float32Array(count * 6) : null;
    const zMax = z[numMoves - 1] || 1;
    const color = new THREE.Color();
    let s = 0;
    for (let m = startMove; m < numMoves && s < count; m++) {
      if (kinds[m] !== PRINT) continue;
      const segIndex = cumPrintedSegments[m]; // index of this print segment
      if (segIndex < first) continue;
      const o = s * 6;
      positions[o] = endpoints[m * 4];
      positions[o + 1] = endpoints[m * 4 + 1];
      positions[o + 2] = z[m];
      positions[o + 3] = endpoints[m * 4 + 2];
      positions[o + 4] = endpoints[m * 4 + 3];
      positions[o + 5] = z[m];
      if (colors) {
        color.lerpColors(COLOR_BOTTOM, COLOR_TOP, z[m] / zMax);
        colors[o] = colors[o + 3] = color.r;
        colors[o + 1] = colors[o + 4] = color.g;
        colors[o + 2] = colors[o + 5] = color.b;
      }
      s++;
    }
    return { positions, colors };
  }

  function makeLine(positions, colors, material) {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(positions);
    if (colors) geo.setColors(colors);
    const line = new LineSegments2(geo, material);
    line.frustumCulled = false; // instanceCount changes per frame
    return line;
  }

  function disposeLine(line) {
    if (!line) return;
    line.parent?.remove(line);
    line.geometry.dispose();
  }

  return {
    /** Call after slicing finishes. */
    setToolpath(tp, lh) {
      this.clear();
      toolpath = tp;
      layerHeight = lh;
      lineMaterial.linewidth = lh * 1.5;
      partialMaterial.linewidth = lh * 1.7;

      const totalSegments = tp.cumPrintedSegments[tp.numMoves];
      fallback = totalSegments > MAX_BATCH_SEGMENTS ||
        new URLSearchParams(location.search).has('fallback');

      if (!fallback) {
        const { positions, colors } = buildSegmentArrays(0, totalSegments, true);
        batchLine = makeLine(positions, colors, lineMaterial);
        batchLine.geometry.instanceCount = 0;
        printedGroup.add(batchLine);
      } else {
        // clip the preview mesh from below as layers complete
        clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
        clippedMesh = modelGroup.children[0] || null;
        if (clippedMesh) {
          clippedMesh.material = clippedMesh.material.clone();
          clippedMesh.material.clippingPlanes = [clipPlane];
          clippedMesh.material.side = THREE.DoubleSide;
          clippedMesh.visible = true;
        }
      }

      const partial = new LineSegmentsGeometry();
      partial.setPositions(new Float32Array(6));
      partialLine = new LineSegments2(partial, partialMaterial);
      partialLine.frustumCulled = false;
      partialLine.visible = false;
      printedGroup.add(partialLine);
    },

    /**
     * Drive the reveal. Called every frame by the simulation.
     * @param {number} moveIndex current move
     * @param {number} fraction 0..1 within the move
     * @param {number} nozzleX @param {number} nozzleY current interpolated tip position
     */
    setProgress(moveIndex, fraction, nozzleX, nozzleY) {
      if (!toolpath || toolpath.numMoves === 0) return;
      const { endpoints, z, kinds, cumPrintedSegments, layerOfMove } = toolpath;
      const isPrinting = kinds[moveIndex] === PRINT;
      const completedSegments = cumPrintedSegments[moveIndex] + (isPrinting && fraction >= 1 ? 1 : 0);

      if (!fallback) {
        batchLine.geometry.instanceCount = completedSegments;
      } else {
        const li = layerOfMove[moveIndex];
        // completed layers below: clip plane at the top of the previous layer
        clipPlane.constant = z[moveIndex] - layerHeight / 2;
        if (li !== layerLineLayer) {
          disposeLine(layerLine);
          const [first, last] = layerSegmentRange(li);
          if (last > first) {
            const { positions } = buildSegmentArrays(first, last, false, toolpath.layerStartMove[li]);
            layerLine = makeLine(positions, null, lineMaterial);
            printedGroup.add(layerLine);
          } else {
            layerLine = null;
          }
          layerLineLayer = li;
        }
        if (layerLine) {
          const [first] = layerSegmentRange(li);
          layerLine.geometry.instanceCount = Math.max(0, completedSegments - first);
        }
      }

      // in-progress segment: from move start to the nozzle position
      if (isPrinting && fraction > 0 && fraction < 1) {
        const buf = partialLine.geometry.attributes.instanceStart.data;
        buf.array[0] = endpoints[moveIndex * 4];
        buf.array[1] = endpoints[moveIndex * 4 + 1];
        buf.array[2] = z[moveIndex];
        buf.array[3] = nozzleX;
        buf.array[4] = nozzleY;
        buf.array[5] = z[moveIndex];
        buf.needsUpdate = true;
        partialLine.visible = true;
      } else {
        partialLine.visible = false;
      }
    },

    onResize(w, h) {
      lineMaterial.resolution.set(w, h);
      partialMaterial.resolution.set(w, h);
    },

    get usingFallback() { return fallback; },

    clear() {
      disposeLine(batchLine); batchLine = null;
      disposeLine(layerLine); layerLine = null;
      disposeLine(partialLine); partialLine = null;
      layerLineLayer = -1;
      if (clippedMesh) {
        clippedMesh.material.clippingPlanes = null;
        clippedMesh = null;
      }
      clipPlane = null;
      toolpath = null;
    },
  };
}
