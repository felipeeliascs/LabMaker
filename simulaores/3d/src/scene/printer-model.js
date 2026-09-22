/**
 * Stylized Ender-3-style bedslinger printer built from primitives.
 * Scene is Z-up, printer coordinates: bed surface at z=0, bed center at x=y=0.
 * Kinematics: head moves X (along gantry) and Z (gantry on columns), bed moves Y.
 *
 * The nozzle TIP lives at xCarriage local (0, 0, -NOZZLE_DROP), so
 * moveTool(x, y, z) puts the tip at world (x, 0, z) while the bed slides to
 * -y — the bed-local point (x, y) is then exactly under the tip.
 */
import * as THREE from 'three';

const BED_SIZE = 235;
const BUILD_XY = 220;
const COLUMN_HEIGHT = 360;
const GANTRY_SPAN = 400;
const GANTRY_Y = -30;     // crossbar/columns sit just behind the nozzle
const NOZZLE_DROP = 46;   // crossbar center down to nozzle tip

const frameMat = new THREE.MeshStandardMaterial({ color: 0x383e48, roughness: 0.55, metalness: 0.45 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0x55617a, roughness: 0.45, metalness: 0.55 });
const bedMat = new THREE.MeshStandardMaterial({ color: 0x121820, roughness: 0.85, metalness: 0.1 });
const hotendMat = new THREE.MeshStandardMaterial({ color: 0x8a93a3, roughness: 0.35, metalness: 0.85 });
const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.3, metalness: 0.95 });
const plasticMat = new THREE.MeshStandardMaterial({ color: 0xff8c2e, roughness: 0.6 });

function box(w, d, h, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
  m.position.set(x, y, z);
  return m;
}

export function createPrinter() {
  const root = new THREE.Group();

  // ---------- static frame ----------
  const frame = new THREE.Group();
  // base perimeter rails
  frame.add(box(GANTRY_SPAN, 42, 42, frameMat, 0, -150, -42));
  frame.add(box(GANTRY_SPAN, 42, 42, frameMat, 0, 150, -42));
  frame.add(box(42, 342, 42, frameMat, -GANTRY_SPAN / 2 + 21, 0, -42));
  frame.add(box(42, 342, 42, frameMat, GANTRY_SPAN / 2 - 21, 0, -42));
  // bed Y rail down the middle
  frame.add(box(60, 400, 12, accentMat, 0, 0, -27));
  // vertical columns + top crossbar
  frame.add(box(42, 42, COLUMN_HEIGHT, frameMat, -GANTRY_SPAN / 2 + 21, GANTRY_Y, COLUMN_HEIGHT / 2 - 21));
  frame.add(box(42, 42, COLUMN_HEIGHT, frameMat, GANTRY_SPAN / 2 - 21, GANTRY_Y, COLUMN_HEIGHT / 2 - 21));
  frame.add(box(GANTRY_SPAN, 42, 42, frameMat, 0, GANTRY_Y, COLUMN_HEIGHT));
  // PSU + screen blocks for character
  frame.add(box(100, 60, 50, accentMat, GANTRY_SPAN / 2 - 60, 120, 5));
  frame.add(box(70, 8, 50, accentMat, GANTRY_SPAN / 2 - 40, -190, 20));
  frame.add(box(60, 2, 38, new THREE.MeshStandardMaterial({
    color: 0x1a66cc, emissive: 0x10408a, roughness: 0.4,
  }), GANTRY_SPAN / 2 - 40, -195, 22));
  root.add(frame);

  // ---------- bed carriage (position.y = -toolY) ----------
  const bedCarriage = new THREE.Group();
  bedCarriage.add(box(BED_SIZE, BED_SIZE, 8, bedMat, 0, 0, -5));
  bedCarriage.add(box(BED_SIZE - 10, BED_SIZE - 10, 2, new THREE.MeshStandardMaterial({
    color: 0x0e1116, roughness: 0.4, metalness: 0.3,
  }), 0, 0, -1));
  // grid on the bed surface (GridHelper is XZ-plane → rotate into XY)
  const grid = new THREE.GridHelper(BUILD_XY, 11, 0x2e8bc0, 0x223344);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = 0.05;
  bedCarriage.add(grid);
  const half = BUILD_XY / 2;
  bedCarriage.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, -half, 0.1), new THREE.Vector3(half, -half, 0.1),
      new THREE.Vector3(half, half, 0.1), new THREE.Vector3(-half, half, 0.1),
    ]),
    new THREE.LineBasicMaterial({ color: 0x3aa0ff })
  ));
  root.add(bedCarriage);

  // groups the visualizer fills; parented to the bed so prints ride it in Y
  const printedGroup = new THREE.Group();
  bedCarriage.add(printedGroup);
  const modelGroup = new THREE.Group(); // uploaded STL preview
  bedCarriage.add(modelGroup);

  // ---------- Z gantry (position.z = toolZ + NOZZLE_DROP) ----------
  const zGantry = new THREE.Group();
  zGantry.add(box(GANTRY_SPAN - 84, 30, 30, accentMat, 0, GANTRY_Y, 0)); // crossbar
  zGantry.add(box(50, 50, 44, frameMat, -GANTRY_SPAN / 2 + 21, GANTRY_Y, 0));
  zGantry.add(box(50, 50, 44, frameMat, GANTRY_SPAN / 2 - 21, GANTRY_Y, 0));
  root.add(zGantry);

  // ---------- X carriage + nozzle (position.x = toolX) ----------
  const xCarriage = new THREE.Group();
  xCarriage.add(box(44, 24, 44, accentMat, 0, GANTRY_Y + 18, 0)); // carriage plate on crossbar
  xCarriage.add(box(34, 30, 26, hotendMat, 0, 0, -8));            // hotend block
  for (let i = 0; i < 3; i++) {
    xCarriage.add(box(30, 26, 2.5, hotendMat, 0, 0, -23 - i * 5)); // heat-sink fins
  }
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(4, 8, 16), nozzleMat);
  nozzle.rotation.x = -Math.PI / 2; // cone tip points -Z
  nozzle.position.set(0, 0, -NOZZLE_DROP + 4);
  xCarriage.add(nozzle);
  xCarriage.add(box(36, 4, 28, plasticMat, 0, 17, -22)); // fan shroud hint
  zGantry.add(xCarriage);

  // nozzle tip marker — world position queried by the follow cam
  const nozzleTip = new THREE.Object3D();
  nozzleTip.position.set(0, 0, -NOZZLE_DROP);
  xCarriage.add(nozzleTip);

  function moveTool(x, y, z) {
    xCarriage.position.x = x;
    zGantry.position.z = z + NOZZLE_DROP;
    bedCarriage.position.y = -y;
  }

  moveTool(0, 0, 0.2);

  return { root, moveTool, printedGroup, modelGroup, nozzleTip, bedCarriage };
}
