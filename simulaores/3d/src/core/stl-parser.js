/**
 * STL parsing — binary and ASCII. Pure functions, no DOM/three.js.
 * Output positions are 9 floats per triangle (v0 v1 v2), stored normals ignored.
 */

/**
 * @param {ArrayBuffer} buffer raw file contents
 * @returns {{ positions: Float32Array, triangleCount: number, format: 'binary'|'ascii' }}
 */
export function parseSTL(buffer) {
  if (isBinarySTL(buffer)) return parseBinary(buffer);
  const text = new TextDecoder().decode(buffer);
  if (/facet\s+normal/i.test(text) && /vertex/i.test(text)) return parseAscii(text);
    throw new Error('Arquivo STL inválido (formato binário ou ASCII não detectado).');
}

// The "solid" prefix is unreliable (many binary exporters write it),
// so binary detection uses the size invariant: 80-byte header + 4-byte
// count + 50 bytes per triangle.
export function isBinarySTL(buffer) {
  if (buffer.byteLength < 84) return false;
  const triCount = new DataView(buffer).getUint32(80, true);
  return buffer.byteLength === 84 + 50 * triCount;
}

function parseBinary(buffer) {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const positions = new Float32Array(triangleCount * 9);
  // Records are 50 bytes (84 + i*50): not 4-byte aligned, so Float32Array
  // views over the buffer are impossible — DataView reads are required.
  for (let i = 0; i < triangleCount; i++) {
    const base = 84 + i * 50 + 12; // skip 12-byte normal
    for (let j = 0; j < 9; j++) {
      positions[i * 9 + j] = view.getFloat32(base + j * 4, true);
    }
  }
  return { positions, triangleCount, format: 'binary' };
}

function parseAscii(text) {
  const tokens = text.split(/\s+/);
  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'vertex') count++;
  }
  if (count === 0 || count % 3 !== 0) {
    throw new Error(`STL ASCII tem ${count} vértices — esperado um múltiplo positivo de 3.`);
  }
  const positions = new Float32Array(count * 3);
  let p = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'vertex') continue;
    const x = parseFloat(tokens[i + 1]);
    const y = parseFloat(tokens[i + 2]);
    const z = parseFloat(tokens[i + 3]);
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
      throw new Error('STL ASCII contém um vértice malformado.');
    }
    positions[p++] = x;
    positions[p++] = y;
    positions[p++] = z;
    i += 3;
  }
  return { positions, triangleCount: count / 3, format: 'ascii' };
}
