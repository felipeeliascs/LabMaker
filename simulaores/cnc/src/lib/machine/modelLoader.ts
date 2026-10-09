import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer/decoder';
import manifest from './modelManifest.json';

export const assetUrl = (url: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${url}`;
type Entry = { url: string; min: number[]; max: number[] };

/** Uma sessão possui suas requisições; fechar o simulador cancela a transferência. */
export class ModelLoader {
  private controller = new AbortController();
  private loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

  async load(key: string): Promise<THREE.BufferGeometry> {
    const entry = (manifest as Record<string, Entry>)[key.replace(/^\//, '')];
    if (!entry) throw new Error(`Modelo não encontrado: ${key}`);
    const signal = this.controller.signal;
    const response = await fetch(assetUrl(entry.url), { signal });
    if (!response.ok) throw new Error(`Não foi possível carregar ${key} (${response.status}).`);
    const gltf = await this.loader.parseAsync(await response.arrayBuffer(), '');
    gltf.scene.updateMatrixWorld(true);
    let geometry: THREE.BufferGeometry | undefined;
    gltf.scene.traverse(node => {
      const object = node as THREE.Mesh;
      if (!object.isMesh) return;
      if (!signal.aborted && !geometry) {
        const decoded: THREE.BufferGeometry = object.geometry.clone();
        geometry = decoded;
        // A quantização do GLB inclui escala/translação no nó. Restaurar os
        // vértices locais originais antes de aplicar a cinemática da máquina.
        for (const name of ['position', 'normal']) {
          const attribute = decoded.getAttribute(name);
          if (!attribute) continue;
          const floats = new Float32Array(attribute.count * 3);
          for (let i = 0; i < attribute.count; i++) {
            floats[i*3] = attribute.getX(i); floats[i*3+1] = attribute.getY(i); floats[i*3+2] = attribute.getZ(i);
          }
          decoded.setAttribute(name, new THREE.BufferAttribute(floats, 3));
        }
        decoded.applyMatrix4(object.matrixWorld);
        decoded.userData.originalBounds = { min: entry.min, max: entry.max };
        decoded.computeBoundingBox(); decoded.computeBoundingSphere();
      }
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose());
    });
    if (signal.aborted) throw new DOMException('Carregamento cancelado', 'AbortError');
    if (!geometry) throw new Error(`Modelo vazio: ${key}`);
    return geometry;
  }

  dispose() { this.controller.abort(); }
}
