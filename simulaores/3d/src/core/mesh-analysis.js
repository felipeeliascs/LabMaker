/**
 * Mesh analysis — bounding box, volume, surface area, manifold check,
 * printability checks, material estimate. Pure functions.
 */

export const BUILD_VOLUME = { x: 220, y: 220, z: 250 }; // mm
export const PLA_DENSITY = 1.24; // g/cm³
export const EXTRUSION_WIDTH = 0.4; // mm
export const PERIMETER_SHELLS = 2;

/** Axis-aligned bounding box of a 9-floats-per-triangle position array. */
export function computeBBox(positions) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ],
           size: [maxX - minX, maxY - minY, maxZ - minZ] };
}

/** Signed-tetrahedra volume in mm³ (reliable only for watertight meshes). */
export function computeVolume(positions) {
  let vol = 0;
  for (let i = 0; i < positions.length; i += 9) {
    const x0 = positions[i],     y0 = positions[i + 1], z0 = positions[i + 2];
    const x1 = positions[i + 3], y1 = positions[i + 4], z1 = positions[i + 5];
    const x2 = positions[i + 6], y2 = positions[i + 7], z2 = positions[i + 8];
    vol += x0 * (y1 * z2 - z1 * y2) - y0 * (x1 * z2 - z1 * x2) + z0 * (x1 * y2 - y1 * x2);
  }
  return Math.abs(vol / 6);
}

/** Total surface area in mm². */
export function computeSurfaceArea(positions) {
  let area = 0;
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i + 3] - positions[i];
    const ay = positions[i + 4] - positions[i + 1];
    const az = positions[i + 5] - positions[i + 2];
    const bx = positions[i + 6] - positions[i];
    const by = positions[i + 7] - positions[i + 1];
    const bz = positions[i + 8] - positions[i + 2];
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    area += Math.sqrt(cx * cx + cy * cy + cz * cz) / 2;
  }
  return area;
}

/**
 * Weld identical vertices and pair directed edges.
 * Watertight+manifold iff every undirected edge is used exactly once in
 * each direction.
 */
export function checkManifold(positions) {
  const vertexIds = new Map();
  const triCount = positions.length / 9;
  const indices = new Uint32Array(triCount * 3);
  for (let i = 0; i < triCount * 3; i++) {
    const key = `${positions[i * 3]}|${positions[i * 3 + 1]}|${positions[i * 3 + 2]}`;
    let id = vertexIds.get(key);
    if (id === undefined) {
      id = vertexIds.size;
      vertexIds.set(key, id);
    }
    indices[i] = id;
  }

  // edge key "min,max" → bit-packed counts: low 16 bits forward, high 16 backward
  const edges = new Map();
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3], b = indices[t * 3 + 1], c = indices[t * 3 + 2];
    addEdge(edges, a, b);
    addEdge(edges, b, c);
    addEdge(edges, c, a);
  }

  let boundaryEdges = 0, nonManifoldEdges = 0, inconsistentEdges = 0;
  for (const counts of edges.values()) {
    const fwd = counts & 0xffff, bwd = counts >>> 16;
    const total = fwd + bwd;
    if (total === 1) boundaryEdges++;
    else if (total > 2) nonManifoldEdges++;
    else if (fwd !== 1 || bwd !== 1) inconsistentEdges++; // 2+0: same winding twice
  }
  return {
    watertight: boundaryEdges === 0 && nonManifoldEdges === 0 && inconsistentEdges === 0,
    boundaryEdges,
    nonManifoldEdges,
    inconsistentEdges,
    vertexCount: vertexIds.size,
  };
}

function addEdge(edges, from, to) {
  const forward = from < to;
  const key = forward ? `${from},${to}` : `${to},${from}`;
  const prev = edges.get(key) || 0;
  edges.set(key, prev + (forward ? 1 : 0x10000));
}

/**
 * Material estimate: 2 perimeter shells as a surface skin plus partial infill
 * of the remaining interior volume.
 * @returns {{ grams: number, shellVolume: number, innerVolume: number }}
 */
export function estimateMaterial(volumeMM3, surfaceAreaMM2, infill) {
  const shellVolume = Math.min(surfaceAreaMM2 * EXTRUSION_WIDTH * PERIMETER_SHELLS, volumeMM3);
  const innerVolume = Math.max(volumeMM3 - shellVolume, 0);
  const usedVolume = shellVolume + infill * innerVolume;
  return { grams: PLA_DENSITY * usedVolume / 1000, shellVolume, innerVolume };
}

/**
 * Full analysis pass over raw positions.
 * @returns analysis object consumed by the report panel
 */
export function analyzeMesh(positions, { infill = 0.2, layerHeight = 0.2 } = {}) {
  const bbox = computeBBox(positions);
  const volume = computeVolume(positions);
  const surfaceArea = computeSurfaceArea(positions);
  const manifold = checkManifold(positions);
  const material = estimateMaterial(volume, surfaceArea, infill);
  const layerCount = Math.max(1, Math.ceil(bbox.size[2] / layerHeight));

  const fitsBuildVolume = {
    x: bbox.size[0] <= BUILD_VOLUME.x,
    y: bbox.size[1] <= BUILD_VOLUME.y,
    z: bbox.size[2] <= BUILD_VOLUME.z,
  };
  const centerX = (bbox.min[0] + bbox.max[0]) / 2;
  const centerY = (bbox.min[1] + bbox.max[1]) / 2;
  const needsCentering =
    Math.abs(centerX) > 0.05 || Math.abs(centerY) > 0.05 || Math.abs(bbox.min[2]) > 0.005;

  return {
    bbox,
    triangleCount: positions.length / 9,
    volume,            // mm³
    surfaceArea,       // mm²
    manifold,
    material,
    layerCount,
    fitsBuildVolume,
    fits: fitsBuildVolume.x && fitsBuildVolume.y && fitsBuildVolume.z,
    needsCentering,
    centerOffset: [-centerX, -centerY, -bbox.min[2]],
  };
}

/** In-place translation; used by "Center & Drop". */
export function translatePositions(positions, [dx, dy, dz]) {
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += dx;
    positions[i + 1] += dy;
    positions[i + 2] += dz;
  }
}
