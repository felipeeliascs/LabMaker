import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export interface CutPoint { x: number; y: number }
export interface CutSegment {
  from: CutPoint;
  to: CutPoint;
  cutting: boolean;
  speed: number; // mm/s
}
export interface CutProgram {
  name: string;
  segments: CutSegment[];
  width: number;
  height: number;
  duration: number;
}
export const MAX_SEGMENTS = 50000;
export const BED = { width: 960, height: 720, thickness: 3, x: 240, y: 822, z: 846 };
const distance = (a: CutPoint, b: CutPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/** Preserve physical size; center the drawing on the sheet, converting Y to screen-down. */
export function prepareProgram(name: string, segments: CutSegment[], flipY = false): CutProgram {
  if (!segments.some(s => s.cutting && distance(s.from, s.to) > 0.001)) {
    throw new Error('O arquivo não contém trajetórias de corte. No G-code, use M3/M4 e potência S maior que zero.');
  }
  if (segments.length > MAX_SEGMENTS) throw new Error('Desenho muito complexo: limite de 50.000 segmentos.');
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of segments) {
    if (!Number.isFinite(s.speed) || s.speed <= 0) throw new Error('Velocidade inválida.');
    for (const p of [s.from, s.to]) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Coordenadas inválidas.');
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
  }
  const width = maxX - minX, height = maxY - minY;
  if (width > BED.width + 0.001 || height > BED.height + 0.001) {
    throw new Error(`Desenho de ${width.toFixed(1)} × ${height.toFixed(1)} mm excede o MDF de ${BED.width} × ${BED.height} mm. Reduza o desenho no arquivo.`);
  }
  const map = (p: CutPoint) => ({
    x: p.x - minX + (BED.width - width) / 2,
    y: (flipY ? maxY - p.y : p.y - minY) + (BED.height - height) / 2,
  });
  const mapped = segments.filter(s => distance(s.from, s.to) > 0.00001)
    .map(s => ({ ...s, from: map(s.from), to: map(s.to) }));
  return { name, width, height, segments: mapped,
    duration: mapped.reduce((sum, s) => sum + distance(s.from, s.to) / s.speed, 0) };
}

/** Deliberately restricted laser dialect. Unknown motion is rejected rather than guessed. */
export function parseGcode(text: string, name: string): CutProgram {
  const segments: CutSegment[] = [];
  let point = { x: 0, y: 0 }, unit = 1, absolute = true, motion = 0;
  let feed = 1200, laser = false, power = 1;
  const push = (to: CutPoint, cutting: boolean, speed: number) => {
    segments.push({ from: point, to, cutting, speed }); point = to;
    if (segments.length > MAX_SEGMENTS) throw new Error('G-code muito complexo: limite de 50.000 segmentos.');
  };
  const lines = text.split(/\r?\n/);
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].replace(/\([^)]*\)/g, '').split(';')[0].trim().toUpperCase();
    if (!line || line === '%') continue;
    const fail = (message: string): never => { throw new Error(`Linha ${lineNo + 1}: ${message}`); };
    const words = [...line.matchAll(/([A-Z])\s*([+-]?(?:\d+\.?\d*|\.\d+))/g)];
    if (line.replace(/([A-Z])\s*([+-]?(?:\d+\.?\d*|\.\d+))/g, '').trim()) fail('sintaxe não suportada.');
    const values = new Map<string, number>();
    let end = false;
    for (const [, letter, raw] of words) {
      const v = Number(raw);
      if (!Number.isFinite(v)) fail('valor numérico inválido.');
      if (letter === 'G') {
        if ([0, 1, 2, 3].includes(v)) motion = v;
        else if (v === 20) unit = 25.4;
        else if (v === 21) unit = 1;
        else if (v === 90) absolute = true;
        else if (v === 91) absolute = false;
        else if (![17, 94, 91.1].includes(v)) fail(`G${v} não suportado. Use XY, G0/G1 ou G2/G3 com I/J relativos.`);
      } else if (letter === 'M') {
        if (v === 3 || v === 4) laser = true;
        else if (v === 5) laser = false;
        else if (v === 2 || v === 30) end = true;
        else if (v !== 8 && v !== 9) fail(`M${v} não suportado.`);
      } else if ('XYIJSFN'.includes(letter)) {
        if (values.has(letter)) fail(`parâmetro ${letter} repetido.`);
        values.set(letter, v);
      } else fail(`parâmetro ${letter} não suportado. Exporte um arquivo de laser 2D (arcos com I/J).`);
    }
    if (values.has('F')) {
      feed = values.get('F')! * unit;
      if (feed <= 0) fail('F deve ser maior que zero.');
    }
    if (values.has('S')) {
      power = values.get('S')!;
      if (power < 0) fail('S deve ser zero ou positivo.');
    }
    if (end) break;
    if (!['X', 'Y', 'I', 'J'].some(k => values.has(k))) continue;
    const to = {
      x: values.has('X') ? values.get('X')! * unit + (absolute ? 0 : point.x) : point.x,
      y: values.has('Y') ? values.get('Y')! * unit + (absolute ? 0 : point.y) : point.y,
    };
    const cutting = motion !== 0 && laser && power > 0;
    if (motion < 2) {
      if (values.has('I') || values.has('J')) fail('I/J requer G2 ou G3.');
      push(to, cutting, motion === 0 ? 180 : feed / 60);
    } else {
      if (!values.has('I') && !values.has('J')) fail('arco requer I/J relativos ao início.');
      const start = point;
      const center = { x: start.x + (values.get('I') ?? 0) * unit, y: start.y + (values.get('J') ?? 0) * unit };
      const radius = distance(start, center);
      if (radius < 0.001 || Math.abs(distance(to, center) - radius) > Math.max(0.1, radius * 0.001)) fail('raio do arco inconsistente.');
      const a = Math.atan2(start.y - center.y, start.x - center.x);
      let sweep = Math.atan2(to.y - center.y, to.x - center.x) - a;
      if (motion === 2 && sweep >= -1e-10) sweep -= Math.PI * 2;
      if (motion === 3 && sweep <= 1e-10) sweep += Math.PI * 2;
      const steps = Math.max(2, Math.ceil(Math.abs(sweep) * radius / 0.75));
      if (steps + segments.length > MAX_SEGMENTS) fail('arco muito complexo.');
      for (let i = 1; i <= steps; i++) {
        const angle = a + sweep * i / steps;
        push(i === steps ? to : { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }, cutting, feed / 60);
      }
    }
  }
  return prepareProgram(name, segments, true);
}

function physicalLength(value: string | null): number | null {
  if (!value) return null;
  const match = value.trim().match(/^([\d.+-]+)(mm|cm|in|pt|pc|px)?$/i);
  if (!match || !Number.isFinite(Number(match[1]))) throw new Error('Dimensão SVG inválida. Use mm, cm, in, px, pt ou pc.');
  const factors: Record<string, number> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, px: 25.4 / 96 };
  return Number(match[1]) * factors[(match[2] || 'px').toLowerCase()];
}

export function parseSvg(text: string, name: string): CutProgram {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('SVG inválido.');
  if (doc.querySelector('text, image, use, clipPath, mask, svg svg')) {
    throw new Error('Converta textos, imagens, clones e recortes em caminhos antes de exportar o SVG. SVGs aninhados não são suportados.');
  }
  const root = doc.documentElement;
  let sx = 25.4 / 96, sy = sx;
  if (root.hasAttribute('viewBox')) {
    const vb = root.getAttribute('viewBox')!.trim().split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || vb.some(v => !Number.isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) throw new Error('viewBox SVG inválido.');
    const w = physicalLength(root.getAttribute('width'));
    const h = physicalLength(root.getAttribute('height'));
    sx = w === null ? (h === null ? sx : h / vb[3]) : w / vb[2];
    sy = h === null ? sx : h / vb[3];
    const aspect = root.getAttribute('preserveAspectRatio') || '';
    if (aspect.includes('slice')) throw new Error('Exporte o SVG sem preserveAspectRatio="slice".');
    if (aspect !== 'none') sx = sy = Math.min(sx, sy);
  }
  if (sx <= 0 || sy <= 0) throw new Error('Dimensões SVG devem ser positivas.');
  const loader = new SVGLoader();
  loader.defaultDPI = 96;
  const { paths } = loader.parse(text);
  const segments: CutSegment[] = [];
  let last: CutPoint | null = null;
  for (const path of paths) {
    const style = path.userData?.style;
    let hidden = false;
    for (let node = path.userData?.node as Element | null; node; node = node.parentElement) {
      if (node.getAttribute('display') === 'none' || /display\s*:\s*none/i.test(node.getAttribute('style') || '')) hidden = true;
    }
    if (hidden || style?.visibility === 'hidden' || style?.opacity === 0 || (style?.fill === 'none' && style?.stroke === 'none')) continue;
    for (const sub of path.subPaths) {
      const points: CutPoint[] = [];
      for (const curve of sub.curves) {
        const length = curve.getLength() * Math.max(sx, sy);
        const count = curve.type === 'LineCurve' ? 1 : Math.min(4096, Math.max(8, Math.ceil(length / 0.75)));
        for (const p of curve.getPoints(count)) points.push({ x: p.x * sx, y: p.y * sy });
        if (points.length + segments.length > MAX_SEGMENTS * 2) throw new Error('SVG muito complexo. Simplifique os caminhos.');
      }
      if (points.length < 2) continue;
      if (sub.autoClose && distance(points[0], points[points.length - 1]) > 0.001) points.push(points[0]);
      if (last) segments.push({ from: last, to: points[0], cutting: false, speed: 180 });
      for (let i = 1; i < points.length; i++) {
        if (distance(points[i - 1], points[i]) > 0.00001) segments.push({ from: points[i - 1], to: points[i], cutting: true, speed: 30 });
      }
      last = points[points.length - 1];
    }
  }
  return prepareProgram(name, segments);
}

export function parseCutFile(text: string, name: string): CutProgram {
  if (text.length > 2 * 1024 * 1024) throw new Error('Limite de 2 MB por arquivo.');
  if (/\.svg$/i.test(name)) return parseSvg(text, name);
  if (/\.(gcode|nc|gc|tap)$/i.test(name)) return parseGcode(text, name);
  throw new Error('Escolha um arquivo SVG ou G-code (.gcode, .nc, .gc, .tap).');
}
