import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const out = path.resolve(root, 'out'), destination = path.resolve(root, 'dist');
if (path.dirname(destination) !== root) throw new Error('Destino inválido.');
await fs.access(path.join(out, 'index.html'));
// dist contém somente o resultado regenerável da exportação, nunca os fontes.
await fs.rm(destination, { recursive: true, force: true });
await fs.cp(out, destination, { recursive: true });
console.log('Versão estática em dist/, pronta para o servidor do Labmaker.');
