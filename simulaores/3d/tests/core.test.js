/**
 * Unit tests for the pure core modules, exercised with a programmatically
 * generated 20 mm calibration cube (and broken variants).
 */
import { describe, it, expect } from 'vitest';
import { parseSTL, isBinarySTL } from '../src/core/stl-parser.js';
import {
  analyzeMesh, computeVolume, computeSurfaceArea, computeBBox,
  checkManifold, translatePositions,
} from '../src/core/mesh-analysis.js';
import { sliceMesh, chainSegments, polylineLength } from '../src/core/slicer.js';
import { buildToolpath, moveAtTime, PRINT, TRAVEL, PRINT_SPEED, LAYER_DWELL } from '../src/core/toolpath.js';

// ---------- helpers: build the same cube the samples script generates ----------

function boxTriangles(x0, y0, z0, x1, y1, z1, { openTop = false } = {}) {
  const t = [];
  const quad = (a, b, c, d) => { t.push([...a, ...b, ...c], [...a, ...c, ...d]); };
  quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
  if (!openTop) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]);
  quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]);
  quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
  return t;
}

const toPositions = (tris) => Float32Array.from(tris.flat());

function binarySTLBuffer(tris) {
  const buf = new ArrayBuffer(84 + 50 * tris.length);
  const view = new DataView(buf);
  view.setUint32(80, tris.length, true);
  tris.forEach((tri, i) => {
    const o = 84 + i * 50 + 12;
    tri.forEach((v, j) => view.setFloat32(o + j * 4, v, true));
  });
  return buf;
}

function asciiSTLBuffer(tris) {
  const lines = ['solid test'];
  for (const tri of tris) {
    lines.push('facet normal 0 0 0', 'outer loop');
    for (let v = 0; v < 3; v++) {
      lines.push(`vertex ${tri[v * 3]} ${tri[v * 3 + 1]} ${tri[v * 3 + 2]}`);
    }
    lines.push('endloop', 'endfacet');
  }
  lines.push('endsolid test');
  return new TextEncoder().encode(lines.join('\n')).buffer;
}

const CUBE = boxTriangles(-10, -10, 0, 10, 10, 20);

// ---------- parser ----------

describe('stl-parser', () => {
  it('parses binary STL (12 triangles)', () => {
    const { positions, triangleCount, format } = parseSTL(binarySTLBuffer(CUBE));
    expect(format).toBe('binary');
    expect(triangleCount).toBe(12);
    expect(positions).toHaveLength(108);
  });

  it('parses ASCII STL identically to binary', () => {
    const bin = parseSTL(binarySTLBuffer(CUBE));
    const asc = parseSTL(asciiSTLBuffer(CUBE));
    expect(asc.format).toBe('ascii');
    expect(Array.from(asc.positions)).toEqual(Array.from(bin.positions));
  });

  it('detects binary even when header starts with "solid"', () => {
    const buf = binarySTLBuffer(CUBE);
    new Uint8Array(buf).set(new TextEncoder().encode('solid fake'), 0);
    expect(isBinarySTL(buf)).toBe(true);
    expect(parseSTL(buf).format).toBe('binary');
  });

  it('rejects garbage', () => {
    expect(() => parseSTL(new TextEncoder().encode('hello world').buffer)).toThrow();
  });
});

// ---------- analysis ----------

describe('mesh-analysis', () => {
  const positions = toPositions(CUBE);

  it('computes the cube bbox and dimensions', () => {
    const bbox = computeBBox(positions);
    expect(bbox.size).toEqual([20, 20, 20]);
    expect(bbox.min[2]).toBe(0);
  });

  it('volume = 8000 mm³, area = 2400 mm²', () => {
    expect(computeVolume(positions)).toBeCloseTo(8000, 3);
    expect(computeSurfaceArea(positions)).toBeCloseTo(2400, 3);
  });

  it('cube is watertight; open box is not, with 4 boundary edges', () => {
    expect(checkManifold(positions).watertight).toBe(true);
    const open = checkManifold(toPositions(boxTriangles(-15, -15, 0, 15, 15, 25, { openTop: true })));
    expect(open.watertight).toBe(false);
    expect(open.boundaryEdges).toBe(4);
  });

  it('full analysis: 100 layers @0.2mm, fits build volume, no centering needed', () => {
    const a = analyzeMesh(positions, { infill: 0.2, layerHeight: 0.2 });
    expect(a.layerCount).toBe(100);
    expect(a.fits).toBe(true);
    expect(a.needsCentering).toBe(false);
    expect(a.material.grams).toBeGreaterThan(2); // 20% infill cube ≈ 3.6 g
    expect(a.material.grams).toBeLessThan(9.92); // < solid PLA mass
  });

  it('flags oversized model and offers centering offset', () => {
    const big = analyzeMesh(toPositions(boxTriangles(-150, -50, 0, 150, 50, 100)));
    expect(big.fits).toBe(false);
    expect(big.fitsBuildVolume.x).toBe(false);
    expect(big.fitsBuildVolume.y).toBe(true);

    const off = analyzeMesh(toPositions(boxTriangles(40, 20, 10, 60, 40, 30)));
    expect(off.needsCentering).toBe(true);
    const moved = toPositions(boxTriangles(40, 20, 10, 60, 40, 30));
    translatePositions(moved, off.centerOffset);
    const re = analyzeMesh(moved);
    expect(re.needsCentering).toBe(false);
  });
});

// ---------- slicer ----------

describe('slicer', () => {
  it('slices the cube into 100 layers, each one closed 80 mm square contour', () => {
    const layers = sliceMesh(toPositions(CUBE), 0.2);
    expect(layers).toHaveLength(100);
    for (const layer of layers) {
      expect(layer.contours).toHaveLength(1);
      const c = layer.contours[0];
      expect(c.closed).toBe(true);
      expect(c.points.length / 2).toBe(4); // simplified to the 4 corners
      expect(c.length).toBeCloseTo(80, 3);
    }
    expect(layers[0].z).toBeCloseTo(0.1, 6);
    expect(layers[99].z).toBeCloseTo(19.9, 6);
  });

  it('chains unordered segments into a closed contour', () => {
    const segs = [
      [0, 0, 10, 0],
      [10, 10, 0, 10],
      [10, 0, 10, 10],
      [0, 10, 0, 0],
    ];
    const contours = chainSegments(segs);
    expect(contours).toHaveLength(1);
    expect(contours[0].closed).toBe(true);
    expect(contours[0].length).toBeCloseTo(40, 6);
  });

  it('emits an open polyline when the loop cannot close', () => {
    const contours = chainSegments([
      [0, 0, 10, 0],
      [10, 0, 10, 10],
    ]);
    expect(contours).toHaveLength(1);
    expect(contours[0].closed).toBe(false);
    expect(contours[0].length).toBeCloseTo(20, 6);
  });

  it('polylineLength closes the loop for closed contours', () => {
    expect(polylineLength(Float32Array.from([0, 0, 10, 0, 10, 10, 0, 10]), true)).toBeCloseTo(40);
  });
});

// ---------- toolpath ----------

describe('toolpath', () => {
  const layers = sliceMesh(toPositions(CUBE), 0.2);
  const tp = buildToolpath(layers);

  it('emits 1 travel + 4 print moves per layer', () => {
    expect(tp.numMoves).toBe(100 * 5);
    let prints = 0, travels = 0;
    for (const k of tp.kinds) k === PRINT ? prints++ : travels++;
    expect(prints).toBe(400);
    expect(travels).toBe(100);
  });

  it('print distance = 100 layers × 80 mm; time ≈ distance/speed + dwells', () => {
    expect(tp.printDistance).toBeCloseTo(8000, 1);
    const expected = 8000 / PRINT_SPEED + 100 * LAYER_DWELL;
    expect(tp.totalTime).toBeGreaterThan(expected);
    expect(tp.totalTime).toBeLessThan(expected * 1.1); // travel adds a little
  });

  it('prefix sums are monotonic and consistent', () => {
    for (let i = 0; i < tp.numMoves; i++) {
      expect(tp.cumTime[i + 1]).toBeGreaterThanOrEqual(tp.cumTime[i]);
    }
    expect(tp.cumPrintedSegments[tp.numMoves]).toBe(400);
  });

  it('moveAtTime maps simTime to the right move', () => {
    expect(moveAtTime(tp.cumTime, tp.numMoves, -1)).toEqual({ index: 0, fraction: 0 });
    const end = moveAtTime(tp.cumTime, tp.numMoves, tp.totalTime + 5);
    expect(end.index).toBe(tp.numMoves - 1);
    expect(end.fraction).toBe(1);
    const mid = moveAtTime(tp.cumTime, tp.numMoves, tp.totalTime / 2);
    expect(mid.index).toBeGreaterThan(0);
    expect(mid.index).toBeLessThan(tp.numMoves - 1);
    expect(tp.cumTime[mid.index]).toBeLessThanOrEqual(tp.totalTime / 2);
    expect(tp.cumTime[mid.index + 1]).toBeGreaterThanOrEqual(tp.totalTime / 2);
  });

  it('layer bookkeeping: layerStartMove aligns with layerOfMove', () => {
    for (let li = 0; li < layers.length; li++) {
      expect(tp.layerOfMove[tp.layerStartMove[li]]).toBe(li);
    }
  });
});
