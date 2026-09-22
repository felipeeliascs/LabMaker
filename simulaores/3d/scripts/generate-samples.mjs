/**
 * Generates sample STL files into public/samples/ for testing and demos.
 *   node scripts/generate-samples.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples');
mkdirSync(outDir, { recursive: true });

// ---------- mesh builders (triangles as flat arrays of 9 numbers) ----------

/** Axis-aligned box [x0,x1]×[y0,y1]×[z0,z1], outward CCW winding, optionally without the top face. */
function boxTriangles(x0, y0, z0, x1, y1, z1, { openTop = false } = {}) {
  const t = [];
  const quad = (a, b, c, d) => { t.push([...a, ...b, ...c], [...a, ...c, ...d]); };
  quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);          // bottom (normal -Z)
  if (!openTop) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // top (+Z)
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);          // front (-Y)
  quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]);          // back (+Y)
  quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]);          // left (-X)
  quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);          // right (+X)
  return t;
}

/** Twisted square tower: square cross-section rotating with height. */
function towerTriangles(side = 40, height = 80, twistDeg = 90, steps = 80) {
  const tris = [];
  const ring = (z, angle) => {
    const h = side / 2, c = Math.cos(angle), s = Math.sin(angle);
    return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => [x * c - y * s, x * s + y * c, z]);
  };
  const cap = (pts, up) => {
    // fan triangulation of the square
    const [a, b, c, d] = pts;
    if (up) tris.push([...a, ...b, ...c], [...a, ...c, ...d]);
    else tris.push([...a, ...c, ...b], [...a, ...d, ...c]);
  };
  let prev = ring(0, 0);
  cap(prev, false);
  for (let i = 1; i <= steps; i++) {
    const z = (height * i) / steps;
    const angle = (twistDeg * Math.PI / 180) * (i / steps);
    const cur = ring(z, angle);
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      tris.push([...prev[k], ...prev[k2], ...cur[k2]], [...prev[k], ...cur[k2], ...cur[k]]);
    }
    prev = cur;
  }
  cap(prev, true);
  return tris;
}

function translate(tris, dx, dy, dz) {
  return tris.map((tri) => tri.map((v, i) => v + [dx, dy, dz][i % 3]));
}

// ---------- writers ----------

function writeBinary(name, tris) {
  const buf = Buffer.alloc(84 + 50 * tris.length);
  buf.write(`generated: ${name}`, 0, 'ascii');
  buf.writeUInt32LE(tris.length, 80);
  tris.forEach((tri, i) => {
    const o = 84 + i * 50;
    // normal from winding
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = tri;
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    buf.writeFloatLE(nx / len, o); buf.writeFloatLE(ny / len, o + 4); buf.writeFloatLE(nz / len, o + 8);
    tri.forEach((v, j) => buf.writeFloatLE(v, o + 12 + j * 4));
  });
  writeFileSync(join(outDir, name), buf);
  console.log(`  ${name}  (${tris.length} tris, binary)`);
}

function writeAscii(name, tris) {
  const lines = ['solid generated'];
  for (const tri of tris) {
    lines.push('  facet normal 0 0 0', '    outer loop');
    for (let v = 0; v < 3; v++) {
      lines.push(`      vertex ${tri[v * 3]} ${tri[v * 3 + 1]} ${tri[v * 3 + 2]}`);
    }
    lines.push('    endloop', '  endfacet');
  }
  lines.push('endsolid generated');
  writeFileSync(join(outDir, name), lines.join('\n'));
  console.log(`  ${name}  (${tris.length} tris, ascii)`);
}

// ---------- generate ----------
console.log(`Writing samples to ${outDir}`);
const cube = boxTriangles(-10, -10, 0, 10, 10, 20);
writeBinary('cube20-binary.stl', cube);
writeAscii('cube20-ascii.stl', cube);
writeBinary('cube-offset.stl', translate(cube, 50, 30, 10));
writeBinary('openbox.stl', boxTriangles(-15, -15, 0, 15, 15, 25, { openTop: true }));
writeBinary('bigbox.stl', boxTriangles(-150, -50, 0, 150, 50, 100));
writeBinary('tower.stl', towerTriangles());
console.log('Done.');
