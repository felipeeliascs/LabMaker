import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [outputArgument, baseArgument = ''] = process.argv.slice(2);
if (!outputArgument) throw new Error('Uso: node scripts/prepare-static.mjs <pasta-vazia> [caminho-base]');
const basePath = baseArgument.replace(/\/$/, '');
if (basePath && !/^\/[A-Za-z0-9_/-]+$/.test(basePath)) throw new Error('Caminho-base inválido.');
const output = path.resolve(outputArgument);
if (output === root || root.startsWith(output + path.sep)) throw new Error('Escolha uma pasta de publicação separada.');
await fs.mkdir(output, { recursive: true });
if ((await fs.readdir(output)).length) throw new Error('A pasta de publicação precisa estar vazia.');

const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const rootFiles = new Set(['index.html', 'acessibilidade.html', 'LICENSE']);
const prefixes = ['src/', 'styles/', 'assets/', 'jogos/', 'simulaores/3d/dist/', 'simulaores/cnc/dist/', 'simulaores/cnc-laser/'];
const cncPrefix = '/simulaores/cnc/dist';
let count = 0, bytes = 0, adjusted = 0;
for (const relative of files) {
  if (!rootFiles.has(relative) && !prefixes.some(prefix => relative.startsWith(prefix))) continue;
  if (/(^|\/)(node_modules|\.git)(\/|$)/.test(relative) || /\.(zip|psd)$/i.test(relative)) continue;
  const source = path.join(root, relative);
  const stat = await fs.lstat(source);
  if (!stat.isFile()) throw new Error(`Arquivo inválido: ${relative}`);
  let content = await fs.readFile(source);
  // A exportação CNC usa URLs absolutas. Adapta apenas a cópia de publicação;
  // a versão local e a exportação destinada ao cPanel permanecem intactas.
  if (basePath && relative.startsWith('simulaores/cnc/dist/') && /\.(html|js|json|txt|css)$/.test(relative)) {
    const original = content.toString('utf8');
    const relocated = original.replaceAll(cncPrefix, basePath + cncPrefix);
    if (relocated !== original) { content = Buffer.from(relocated); adjusted++; }
  }
  const destination = path.join(output, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content);
  count++; bytes += content.length;
}
for (const required of ['index.html', 'src/scenes.js', 'simulaores/cnc/dist/index.html', 'simulaores/3d/dist/index.html', 'simulaores/cnc-laser/index.html']) {
  await fs.access(path.join(output, required));
}
if (basePath && !adjusted) throw new Error('Nenhum caminho CNC foi adaptado; confira a exportação.');
await fs.writeFile(path.join(output, '.nojekyll'), '');
console.log(JSON.stringify({ output, basePath, files: count, megabytes: +(bytes / 1024 / 1024).toFixed(2), cncFilesAdjusted: adjusted }, null, 2));
