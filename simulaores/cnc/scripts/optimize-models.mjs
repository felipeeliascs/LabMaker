// Geração offline: os STLs originais nunca são sobrescritos.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const require = createRequire(path.resolve(process.env.CNC_OPTIMIZER_TOOLS || '.', 'package.json'));
const dep = (name) => import(pathToFileURL(require.resolve(name)).href);
const { Document, NodeIO } = await dep('@gltf-transform/core');
const { ALL_EXTENSIONS } = await dep('@gltf-transform/extensions');
const { weld, meshopt, draco, cloneDocument } = await dep('@gltf-transform/functions');
const { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } = await dep('meshoptimizer');
const { default: dracoLib } = await dep('draco3dgltf');
await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
  'draco3d.encoder': await dracoLib.createEncoderModule(),
  'draco3d.decoder': await dracoLib.createDecoderModule(),
});
const source = path.resolve(process.argv[2] || 'assets/source');
const output = path.resolve(process.argv[3] || '.');
const web = path.join(output, 'public/models');
const stls = path.join(output, 'assets/optimized-stl');
await fs.mkdir(web, { recursive: true });
const manifest = {};
const report = [];
// Somente artefatos gerados nesta pasta; fontes ficam fora dela.
for (const name of await fs.readdir(web)) if (/^[\w.-]+\.[a-f0-9]{12}\.glb$/.test(name)) await fs.unlink(path.join(web, name));
async function walk(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  for (const item of items) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await walk(file));
    else if (/\.stl$/i.test(item.name)) result.push(file);
  }
  return result;
}
for (const folder of ['VLS4.60', 'ur5']) for (const file of await walk(path.join(source, folder))) {
  const started = performance.now();
  const bytes = await fs.readFile(file);
  const triangles = bytes.readUInt32LE(80);
  if (bytes.length !== 84 + triangles * 50) throw new Error(`STL binário inválido: ${file}`);
  let positions = new Float32Array(triangles * 9);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let t = 0; t < triangles; t++) for (let v = 0; v < 3; v++) for (let c = 0; c < 3; c++) {
    const n = bytes.readFloatLE(84 + t * 50 + 12 + v * 12 + c * 4);
    positions[t * 9 + v * 3 + c] = n;
    min[c] = Math.min(min[c], n); max[c] = Math.max(max[c], n);
  }
  const remap = MeshoptSimplifier.generatePositionRemap(positions, 3);
  const [compact, count] = MeshoptSimplifier.compactMesh(remap);
  const unique = new Float32Array(count * 3);
  for (let i = 0; i < compact.length; i++) if (compact[i] < count) unique.set(positions.subarray(i * 3, i * 3 + 3), compact[i] * 3);
  positions = unique;
  const target = Math.floor(triangles * (folder === 'VLS4.60' ? 0.08 : 0.12)) * 3;
  const [indices, error] = MeshoptSimplifier.simplify(remap, positions, 3, target, 0.001, ['LockBorder']);
  const reduced = indices.length / 3;
  const flat = new Float32Array(indices.length * 3), normals = new Float32Array(flat.length);
  const binary = Buffer.alloc(84 + reduced * 50);
  binary.write('Labmaker - malha simplificada; origem e licenca em LICENSE'); binary.writeUInt32LE(reduced, 80);
  for (let t = 0; t < reduced; t++) {
    for (let v = 0; v < 3; v++) for (let c = 0; c < 3; c++) flat[t*9+v*3+c] = positions[indices[t*3+v]*3+c];
    const o=t*9, ax=flat[o+3]-flat[o], ay=flat[o+4]-flat[o+1], az=flat[o+5]-flat[o+2];
    const bx=flat[o+6]-flat[o], by=flat[o+7]-flat[o+1], bz=flat[o+8]-flat[o+2];
    const n=[ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx], length=Math.hypot(...n)||1;
    for(let c=0;c<3;c++) { n[c]/=length; binary.writeFloatLE(n[c],84+t*50+c*4); }
    for(let v=0;v<3;v++) for(let c=0;c<3;c++) { normals[o+v*3+c]=n[c]; binary.writeFloatLE(flat[o+v*3+c],84+t*50+12+v*12+c*4); }
  }
  const key=path.relative(source,file).replaceAll('\\','/');
  const doc=new Document(), buffer=doc.createBuffer();
  const primitive=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(flat).setBuffer(buffer))
    .setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(normals).setBuffer(buffer));
  doc.createScene().addChild(doc.createNode(key).setMesh(doc.createMesh(key).addPrimitive(primitive)));
  await doc.transform(weld());
  const dracoDoc=cloneDocument(doc);
  await dracoDoc.transform(draco({quantizePosition:16,quantizeNormal:10}));
  const dracoBytes=await io.writeBinary(dracoDoc);
  await doc.transform(meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:10}));
  const glb=await io.writeBinary(doc);
  const decodeStart=performance.now();
  await io.readBinary(glb);
  const meshoptDecodeMs=performance.now()-decodeStart;
  const dracoStart=performance.now(); await io.readBinary(dracoBytes);
  const dracoDecodeMs=performance.now()-dracoStart;
  const hash=createHash('sha256').update(glb).digest('hex').slice(0,12);
  const name=key.replace(/\.stl$/i,'').replaceAll('/','-')+'.'+hash+'.glb';
  await fs.writeFile(path.join(web,name),glb);
  const stlPath=path.join(stls,key); await fs.mkdir(path.dirname(stlPath),{recursive:true}); await fs.writeFile(stlPath,binary);
  manifest[key]={url:'/models/'+name,min,max};
  const row={file:key,originalBytes:bytes.length,triangles,reducedTriangles:reduced,stlBytes:binary.length,glbBytes:glb.length,gzipBytes:gzipSync(glb).length,dracoBytes:dracoBytes.length,dracoGzipBytes:gzipSync(dracoBytes).length,meshoptDecodeMs,dracoDecodeMs,errorRelative:error,elapsedMs:performance.now()-started};
  report.push(row); console.log(`${key}: ${triangles} -> ${reduced} tri; ${(glb.length/1024).toFixed(0)} KiB GLB`);
}
await fs.writeFile(path.join(web,'manifest.json'),JSON.stringify(manifest,null,2));
await fs.mkdir(path.join(output,'src/lib/machine'),{recursive:true});
await fs.writeFile(path.join(output,'src/lib/machine/modelManifest.json'),JSON.stringify(manifest,null,2));
await fs.mkdir(path.join(output,'docs'),{recursive:true});
await fs.writeFile(path.join(output,'docs/model-optimization.json'),JSON.stringify(report,null,2));
console.log('Totais:',report.reduce((a,r)=>({originalBytes:a.originalBytes+r.originalBytes,glbBytes:a.glbBytes+r.glbBytes,triangles:a.triangles+r.triangles,reducedTriangles:a.reducedTriangles+r.reducedTriangles}),{originalBytes:0,glbBytes:0,triangles:0,reducedTriangles:0}));
