/**
 * Renderer, camera, lights, controls, render loop. Z-up world to match
 * printer/STL coordinates.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14171c);
  scene.fog = new THREE.Fog(0x14171c, 1200, 2600);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
  camera.up.set(0, 0, 1);
  camera.position.set(280, -280, 220);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 60);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.55; // don't dive far below the floor
  controls.minDistance = 30;
  controls.maxDistance = 2000;

  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x3a3f46, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(300, -400, 500);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.9);
  fill.position.set(-400, 300, 200);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd9a0, 0.6);
  rim.position.set(0, 500, 150);
  scene.add(rim);

  // floor disc for spatial grounding
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(900, 64),
    new THREE.MeshStandardMaterial({ color: 0x191d23, roughness: 0.95 })
  );
  floor.position.z = -63.5;
  scene.add(floor);

  const resizeCallbacks = [];
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const cb of resizeCallbacks) cb(w, h);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const frameCallbacks = [];
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    for (const cb of frameCallbacks) cb(dt);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    renderer, scene, camera, controls,
    onFrame: (cb) => frameCallbacks.push(cb),
    onResize: (cb) => resizeCallbacks.push(cb),
  };
}
