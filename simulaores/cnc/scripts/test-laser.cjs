// Node 22.12+; uses the project's existing TypeScript dependency, no test framework.
/* eslint-disable @typescript-eslint/no-require-imports -- CJS loader transpiles project TS in memory for Node tests. */
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { parseGcode, prepareProgram, BED } = require('../src/lib/machine/cutProgram.ts');
const { LaserCutting } = require('../src/lib/machine/laserCutting.ts');
const { MachineState } = require('../src/lib/machine/machineState.ts');
const near = (a, b, epsilon = 1e-6) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);
const sample = () => parseGcode('G21 G90\nM3 S500\nG1 X100 F600\nM5\nG0 Y100\nM3\nG1 X0\nM2', 'test.nc');

test('G-code preserves mm, feed, laser-off travel and centers inside MDF', () => {
  const p = sample();
  assert.equal(p.width, 100); assert.equal(p.height, 100);
  assert.deepEqual(p.segments.map(s => s.cutting), [true, false, true]);
  assert.equal(p.segments[0].speed, 10);
  near(p.duration, 20 + 100 / 180);
  near(p.segments[0].from.x, 430); near(p.segments[0].from.y, 410);
});
test('inches and incremental coordinates; modal motion and S0', () => {
  const p = parseGcode('G20 G91\nM4 S100\nG1 X1 F60\nY1\nS0\nX-1\nM5', 'inch.nc');
  near(p.width, 25.4); near(p.height, 25.4); near(p.segments[0].speed, 25.4);
  assert.deepEqual(p.segments.map(s => s.cutting), [true, true, false]);
});
test('clockwise, counterclockwise and full-circle I/J arcs are continuous', () => {
  for (const command of ['G2', 'G3']) {
    const p = parseGcode(`G21 G90\nG0 X10 Y0\nM3\n${command} X10 Y0 I-10 J0 F600`, 'circle.nc');
    assert.ok(p.segments.length > 80); near(p.width, 20, 0.02); near(p.height, 20, 0.02);
    const cut = p.segments.filter(s => s.cutting);
    assert.deepEqual(cut[0].from, cut[cut.length - 1].to);
    for (let i = 1; i < p.segments.length; i++) assert.deepEqual(p.segments[i].from, p.segments[i - 1].to);
  }
});
test('malformed, unsupported, oversized and non-cutting files fail explicitly', () => {
  for (const text of ['G1 X10', 'M3\nG1 X9999', 'M3\nG1 X10 F0', 'M3\nG28', 'M3\nG1 Z5', 'M3\nG2 X10 R5', 'M3\nG2 X10 I1', 'G1 Xoops', 'M3\nG1 X10 X20']) {
    assert.throws(() => parseGcode(text, 'bad.nc'));
  }
  assert.throws(() => prepareProgram('bad', [{ from: { x: 0, y: 0 }, to: { x: NaN, y: 1 }, speed: 10, cutting: true }]));
});
test('frame-rate independent playback, exact pause/resume, completion and reset', () => {
  const a = new LaserCutting(), b = new LaserCutting();
  a.load(sample()); b.load(sample()); a.start(); b.start();
  for (let i = 0; i < 60; i++) a.advance(1 / 60);
  for (let i = 0; i < 30; i++) b.advance(1 / 30);
  near(a.position.x, b.position.x); near(a.elapsed, 1);
  a.pause(); const position = { ...a.position }; a.advance(10);
  assert.deepEqual(a.position, position); assert.equal(a.laserOn, false);
  a.start(); a.advance(9.2); assert.equal(a.laserOn, false); // G0 travel
  a.advance(100); assert.equal(a.status, 'completed'); near(a.progress, 1); assert.equal(a.laserOn, false);
  a.reset(); assert.equal(a.status, 'ready'); near(a.progress, 0);
  a.dispose(); b.dispose();
});
test('only cutting segments write kerf vertices; restart clears visible cut', () => {
  const c = new LaserCutting(); c.load(sample()); c.start(); c.advance(10.2);
  const lines = c.group.children.filter(o => o.isLineSegments);
  const trace = lines[1];
  assert.equal(trace.geometry.drawRange.count, 2);
  c.advance(100);
  const positions = trace.geometry.getAttribute('position');
  for (let i = 2; i < 4; i++) near(positions.getX(i), 0); // Rapid segment stays degenerate.
  c.reset(); assert.equal(trace.geometry.drawRange.count, 0); c.dispose();
});
test('machine interlocks pause travel and laser; manual jog cannot corrupt a job', () => {
  const m = new MachineState();
  m.loadedComponents.set('test-ready', {});
  m.loadCutProgram(sample()); assert.match(m.startCut(), /Ligue/);
  m.togglePower(); assert.equal(m.startCut(), null);
  m.updateFrame(1); assert.equal(m.cutting.status, 'running');
  near(m.groupLaser.position.x + m.componentPositions.tool.x, BED.x + m.cutting.position.x);
  near(m.groupGantry.position.y + m.componentPositions.tool.y, BED.y - m.cutting.position.y);
  const x = m.position_x; m.setPositionX(500); near(m.position_x, x);
  m.setDoorTarget(1); m.updateFrame(0.1); assert.equal(m.cutting.status, 'paused'); assert.equal(m.laser_actif, false);
  assert.match(m.startCut(), /tampa/);
  m.setDoorTarget(0); m.updateFrame(1); assert.equal(m.startCut(), null);
  m.estop(); m.updateFrame(1); assert.equal(m.cutting.status, 'paused'); assert.equal(m.laser_actif, false);
  m.togglePower(); m.startCut(); m.setMode('MANUAL'); m.updateFrame(0.1); assert.equal(m.cutting.status, 'paused');
  m.resetCut(); assert.equal(m.cutting.status, 'ready');
  m.loadedComponents.clear(); m.dispose();
});
