/* eslint-disable @typescript-eslint/no-require-imports -- Testes Node com transpilação em memória. */
require('./test-laser.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ModelLoader } = require('../src/lib/machine/modelLoader.ts');
const { UR5State } = require('../src/lib/machine/ur5State.ts');
const { MachineState } = require('../src/lib/machine/machineState.ts');
const { createRenderScheduler } = require('../src/lib/machine/renderScheduler.ts');
const manifest = require('../src/lib/machine/modelManifest.json');

test('renderiza sob demanda, limita um frame e não avança após ficar oculto', () => {
  const queue = new Map(); let id = 0, moving = false; const times = [];
  const scheduler = createRenderScheduler(dt => { times.push(dt); return moving; }, cb => { queue.set(++id, cb); return id; }, id => queue.delete(id));
  const tick = time => { const [id, cb] = queue.entries().next().value; queue.delete(id); cb(time); };
  scheduler.invalidate(); scheduler.invalidate(); assert.equal(queue.size, 1);
  tick(100); assert.equal(queue.size, 0);
  moving = true; scheduler.invalidate(); tick(200); tick(216); assert.equal(queue.size, 1);
  scheduler.setActive(false); assert.equal(queue.size, 0);
  scheduler.setActive(true); tick(90000); assert.equal(times.at(-1), 0);
  scheduler.dispose(); scheduler.invalidate(); assert.equal(queue.size, 0);
});

test('decodifica os 20 GLBs e preserva coordenadas, limites e índices', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (!String(url).includes('/models/')) return originalFetch(url, options);
    options?.signal?.throwIfAborted();
    return new Response(fs.readFileSync(path.join(__dirname, '../public', String(url))));
  };
  try {
    const loader = new ModelLoader(); let triangles = 0;
    for (const [key, entry] of Object.entries(manifest)) {
      const g = await loader.load(key);
      assert.ok(g.index, key + ' deve ser indexado');
      triangles += g.index.count / 3;
      assert.deepEqual(g.userData.originalBounds, {min: entry.min, max: entry.max});
      const tolerance = Math.max(...entry.max.map((n,i) => n-entry.min[i])) * 0.002 + 0.002;
      for (const [i,axis] of ['x','y','z'].entries()) {
        assert.ok(Math.abs(g.boundingBox.min[axis]-entry.min[i]) < tolerance, key+' min '+axis);
        assert.ok(Math.abs(g.boundingBox.max[axis]-entry.max[i]) < tolerance, key+' max '+axis);
      }
      g.dispose();
    }
    assert.ok(triangles < 400000); loader.dispose();
    await assert.rejects(loader.load(Object.keys(manifest)[0]), { name: 'AbortError' });
    const machine = new MachineState(); machine.initSTLLoader(); assert.equal(await machine.loadMachineComponents(), true);
    const pivot = machine.doorPivot.position.clone();
    machine.dispose(); machine.initSTLLoader(); assert.equal(await machine.loadMachineComponents(), true);
    assert.ok(machine.doorPivot.position.distanceTo(pivot)<1e-6);
    assert.ok(machine.cutting.group.children.length>=3); machine.dispose();
    const robot = new UR5State(); assert.equal(await robot.loadRobot(),true);
    robot.dispose(); assert.equal(robot.loaded,false); assert.equal(await robot.loadRobot(),true); robot.dispose();
  } finally { global.fetch = originalFetch; }
});

test('exportação publica apenas GLB, licença e arquivos estáticos', () => {
  const report = require('../docs/model-optimization.json');
  const cnc = report.filter(r => r.file.startsWith('VLS4.60/'));
  assert.ok(cnc.reduce((n,r)=>n+r.reducedTriangles,0)<300000);
  assert.ok(cnc.reduce((n,r)=>n+r.glbBytes,0)<4*1024*1024);
  assert.equal(fs.readFileSync(path.join(__dirname,'../LICENSE'),'utf8'),fs.readFileSync(path.join(__dirname,'../public/LICENSE.txt'),'utf8'));
});

const mainFile = [path.resolve(__dirname,'../../../src/main.js'),path.resolve(__dirname,'../main.js')].find(p=>fs.existsSync(p));
test('Labmaker suspende e restaura o loop A-Frame sem duplicar ouvintes', {skip: !mainFile}, () => {
  const source = fs.readFileSync(mainFile,'utf8');
  assert.match(source.slice(source.indexOf('function abrirAtividadeJogo'), source.indexOf('function fecharJogo')), /suspenderCenaParaAtividade\(scene\)/);
  assert.match(source.slice(source.indexOf('function fecharJogo')), /retomarCenaAposAtividade\(\)/);
  const start = source.indexOf('var cenaSuspensaParaAtividade = null;');
  const end = source.indexOf('// Abre a atividade (jogo Blockly ou simulador)', start);
  assert.ok(start>=0 && end>start);
  const context = require('node:vm').createContext({});
  require('node:vm').runInContext(source.slice(start,end),context);
  const listeners = new Map(), calls = [];
  const scene = {isPlaying:true,renderStarted:true,render(){},pause(){this.isPlaying=false;},play(){this.isPlaying=true;},
    clock:{getDelta:()=>calls.push('clock')},renderer:{setAnimationLoop:fn=>calls.push(fn)},
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  for(let i=0;i<3;i++) {
    context.suspenderCenaParaAtividade(scene);context.suspenderCenaParaAtividade(scene);
    assert.equal(scene.isPlaying,false);assert.equal(calls.at(-1),null);assert.equal(listeners.size,2);
    context.retomarCenaAposAtividade();assert.equal(scene.isPlaying,true);assert.equal(calls.at(-1),scene.render);assert.equal(listeners.size,0);
  }
});
