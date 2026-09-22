/**
 * Mesh slicing: intersect triangles with horizontal mid-layer planes and
 * chain the resulting segments into contours. Pure functions.
 *
 * Layer k's plane sits at z = zMin + (k + 0.5) * layerHeight — mid-layer
 * planes avoid the degenerate vertex-exactly-on-plane case that plagues
 * axis-aligned models sliced at z = k * layerHeight.
 */

const EPS = 1e-9;
const QUANT = 1024; // endpoint hash grid ≈ 1 µm
const SIMPLIFY_TOLERANCE = 0.02; // mm perpendicular deviation

/**
 * @param {Float32Array} positions 9 floats per triangle, already on the bed (zMin ≈ 0)
 * @param {number} layerHeight mm
 * @param {(pct: number) => void} [onProgress]
 * @returns {Array<{ z: number, contours: Array<{points: Float32Array, length: number, closed: boolean}> }>}
 */
export function sliceMesh(positions, layerHeight, onProgress) {
  const triCount = positions.length / 9;
  let zMin = Infinity, zMax = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i];
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  if (!(zMax > zMin)) return [];

  const layerCount = Math.max(1, Math.ceil((zMax - zMin) / layerHeight));
  const layerZ = (k) => zMin + (k + 0.5) * layerHeight;

  // --- bucket triangles by the layer range they span (counting sort) ---
  const firstLayer = new Int32Array(triCount);
  const lastLayer = new Int32Array(triCount);
  const counts = new Uint32Array(layerCount + 1);
  for (let t = 0; t < triCount; t++) {
    const o = t * 9;
    const z0 = positions[o + 2], z1 = positions[o + 5], z2 = positions[o + 8];
    const tMin = Math.min(z0, z1, z2), tMax = Math.max(z0, z1, z2);
    // layer k's plane crosses the triangle iff layerZ(k) ∈ [tMin, tMax]
    let kFirst = Math.ceil((tMin - zMin) / layerHeight - 0.5);
    let kLast = Math.floor((tMax - zMin) / layerHeight - 0.5);
    if (kFirst < 0) kFirst = 0;
    if (kLast > layerCount - 1) kLast = layerCount - 1;
    firstLayer[t] = kFirst;
    lastLayer[t] = kLast;
    for (let k = kFirst; k <= kLast; k++) counts[k]++;
  }
  const offsets = new Uint32Array(layerCount + 1);
  for (let k = 0; k < layerCount; k++) offsets[k + 1] = offsets[k] + counts[k];
  const buckets = new Uint32Array(offsets[layerCount]);
  const cursor = offsets.slice(0, layerCount);
  for (let t = 0; t < triCount; t++) {
    for (let k = firstLayer[t]; k <= lastLayer[t]; k++) buckets[cursor[k]++] = t;
  }

  // --- slice each layer ---
  const layers = [];
  for (let k = 0; k < layerCount; k++) {
    const z = layerZ(k);
    const segments = [];
    for (let b = offsets[k]; b < offsets[k + 1]; b++) {
      const seg = intersectTriangle(positions, buckets[b] * 9, z);
      if (seg) segments.push(seg);
    }
    layers.push({ z, contours: chainSegments(segments) });
    if (onProgress && (k & 31) === 31) onProgress(k / layerCount);
  }
  return layers;
}

/**
 * Intersect one triangle with plane z=zp.
 * Returns [x0,y0,x1,y1] oriented so the solid interior lies to the LEFT of
 * the segment direction (outer contours wind CCW, holes CW), or null.
 */
export function intersectTriangle(positions, o, zp) {
  let ax = positions[o],     ay = positions[o + 1], az = positions[o + 2] - zp;
  let bx = positions[o + 3], by = positions[o + 4], bz = positions[o + 5] - zp;
  let cx = positions[o + 6], cy = positions[o + 7], cz = positions[o + 8] - zp;
  // nudge vertices off the plane so each is strictly above or below
  if (Math.abs(az) < EPS) az = EPS;
  if (Math.abs(bz) < EPS) bz = EPS;
  if (Math.abs(cz) < EPS) cz = EPS;

  const aUp = az > 0, bUp = bz > 0, cUp = cz > 0;
  if (aUp === bUp && bUp === cUp) return null;

  // rotate so that `a` is the lone vertex on its side
  if (bUp !== aUp && cUp !== aUp) {
    // a alone — fine
  } else if (aUp !== bUp && cUp !== bUp) {
    [ax, ay, az, bx, by, bz, cx, cy, cz] = [bx, by, bz, cx, cy, cz, ax, ay, az];
  } else {
    [ax, ay, az, bx, by, bz, cx, cy, cz] = [cx, cy, cz, ax, ay, az, bx, by, bz];
  }

  // crossings on edges a-b and a-c
  const tb = az / (az - bz);
  const px = ax + tb * (bx - ax), py = ay + tb * (by - ay);
  const tc = az / (az - cz);
  const qx = ax + tc * (cx - ax), qy = ay + tc * (cy - ay);

  // CCW triangle (outward normal): if `a` is above the plane, walking
  // a-b crossing → a-c crossing keeps the interior on the left; if `a`
  // is below, the direction flips.
  return az > 0 ? [px, py, qx, qy] : [qx, qy, px, py];
}

/**
 * Chain unordered directed segments into contours.
 * @param {number[][]} segments [x0,y0,x1,y1][]
 * @returns {Array<{points: Float32Array, length: number, closed: boolean}>}
 */
export function chainSegments(segments) {
  // map: quantized start-point key → indices of segments starting there
  const byStart = new Map();
  for (let i = 0; i < segments.length; i++) {
    const key = pointKey(segments[i][0], segments[i][1]);
    const list = byStart.get(key);
    if (list) list.push(i);
    else byStart.set(key, [i]);
  }

  const used = new Uint8Array(segments.length);
  const contours = [];

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const seg = segments[i];
    const pts = [seg[0], seg[1], seg[2], seg[3]];
    const startKey = pointKey(seg[0], seg[1]);
    let closed = false;

    for (;;) {
      const tailKey = pointKey(pts[pts.length - 2], pts[pts.length - 1]);
      if (tailKey === startKey && pts.length >= 6) {
        closed = true;
        pts.length -= 2; // last point duplicates the first
        break;
      }
      const candidates = byStart.get(tailKey);
      let next = -1;
      if (candidates) {
        for (const c of candidates) {
          if (!used[c]) { next = c; break; }
        }
      }
      if (next === -1) break; // open polyline (non-manifold input)
      used[next] = 1;
      pts.push(segments[next][2], segments[next][3]);
    }

    // drop degenerate fragments (single dangling segment shorter than noise)
    if (pts.length < 6 && !closed) {
      const dx = pts[2] - pts[0], dy = pts[3] - pts[1];
      if (dx * dx + dy * dy < 1e-6) continue;
    }

    const simplified = simplifyPolyline(pts, closed);
    contours.push({
      points: simplified,
      length: polylineLength(simplified, closed),
      closed,
    });
  }
  return contours;
}

function pointKey(x, y) {
  return `${Math.round(x * QUANT)}|${Math.round(y * QUANT)}`;
}

/**
 * Collapse runs of near-collinear points (perpendicular deviation below
 * tolerance). Keeps Float32Array xy pairs.
 */
export function simplifyPolyline(pts, closed, tolerance = SIMPLIFY_TOLERANCE) {
  const n = pts.length / 2;
  if (n <= 3) return Float32Array.from(pts);
  const keep = new Uint8Array(n);
  keep[0] = 1;
  if (!closed) keep[n - 1] = 1;

  let anchor = 0;
  for (let i = 1; i < n; i++) {
    const next = (i + 1) % n;
    if (!closed && i === n - 1) break;
    // deviation of point i from the line anchor→next
    const ax = pts[anchor * 2], ay = pts[anchor * 2 + 1];
    const nx = pts[next * 2], ny = pts[next * 2 + 1];
    const px = pts[i * 2], py = pts[i * 2 + 1];
    const dx = nx - ax, dy = ny - ay;
    const len = Math.hypot(dx, dy);
    const dev = len < 1e-12
      ? Math.hypot(px - ax, py - ay)
      : Math.abs(dx * (ay - py) - (ax - px) * dy) / len;
    if (dev > tolerance) {
      keep[i] = 1;
      anchor = i;
    }
  }

  // Closed contours: point 0 was force-kept, but it may sit mid-run on a
  // straight side (the chain can start anywhere). Drop it if it's collinear
  // with its kept neighbours.
  if (closed) {
    let prevKept = -1, nextKept = -1;
    for (let i = n - 1; i > 0; i--) if (keep[i]) { prevKept = i; break; }
    for (let i = 1; i < n; i++) if (keep[i]) { nextKept = i; break; }
    if (prevKept > 0 && nextKept > 0 && prevKept !== nextKept) {
      const ax = pts[prevKept * 2], ay = pts[prevKept * 2 + 1];
      const nx = pts[nextKept * 2], ny = pts[nextKept * 2 + 1];
      const dx = nx - ax, dy = ny - ay;
      const len = Math.hypot(dx, dy);
      const dev = len < 1e-12
        ? Math.hypot(pts[0] - ax, pts[1] - ay)
        : Math.abs(dx * (ay - pts[1]) - (ax - pts[0]) * dy) / len;
      if (dev <= tolerance) keep[0] = 0;
    }
  }

  let outCount = 0;
  for (let i = 0; i < n; i++) outCount += keep[i];
  if (closed && outCount < 3) return Float32Array.from(pts); // refuse to over-simplify
  const out = new Float32Array(outCount * 2);
  let p = 0;
  for (let i = 0; i < n; i++) {
    if (keep[i]) {
      out[p++] = pts[i * 2];
      out[p++] = pts[i * 2 + 1];
    }
  }
  return out;
}

export function polylineLength(pts, closed) {
  const n = pts.length / 2;
  let len = 0;
  for (let i = 1; i < n; i++) {
    len += Math.hypot(pts[i * 2] - pts[(i - 1) * 2], pts[i * 2 + 1] - pts[(i - 1) * 2 + 1]);
  }
  if (closed && n > 2) {
    len += Math.hypot(pts[0] - pts[(n - 1) * 2], pts[1] - pts[(n - 1) * 2 + 1]);
  }
  return len;
}
