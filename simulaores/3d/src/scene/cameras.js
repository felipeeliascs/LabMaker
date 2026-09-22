/**
 * Camera presets (smooth 0.4 s tween) and nozzle-follow mode.
 */
import * as THREE from 'three';

const PRESETS = {
  front: { pos: [0, -480, 160], target: [0, 0, 80] },
  top:   { pos: [0, -1, 560],   target: [0, 0, 0] },
  iso:   { pos: [300, -300, 240], target: [0, 0, 60] },
};

const TWEEN_DURATION = 0.4;

export function createCameraRig(camera, controls, nozzleTip) {
  let tween = null; // {fromPos, toPos, fromTarget, toTarget, t}
  let following = false;
  let savedTarget = null;
  const tipWorld = new THREE.Vector3();

  return {
    goTo(name) {
      const preset = PRESETS[name];
      if (!preset) return;
      this.setFollow(false);
      tween = {
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(...preset.pos),
        fromTarget: controls.target.clone(),
        toTarget: new THREE.Vector3(...preset.target),
        t: 0,
      };
    },

    get following() { return following; },

    setFollow(enabled) {
      if (enabled === following) return;
      following = enabled;
      if (enabled) {
        savedTarget = controls.target.clone();
        tween = null;
      } else if (savedTarget) {
        controls.target.copy(savedTarget);
        savedTarget = null;
      }
    },

    /** Call every frame. */
    update(dt) {
      if (tween) {
        tween.t += dt / TWEEN_DURATION;
        const k = tween.t >= 1 ? 1 : 1 - (1 - tween.t) ** 3; // ease-out cubic
        camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
        if (tween.t >= 1) tween = null;
      }
      if (following) {
        // keep the user's orbit offset, retarget onto the nozzle tip
        nozzleTip.getWorldPosition(tipWorld);
        const offset = camera.position.clone().sub(controls.target);
        controls.target.lerp(tipWorld, Math.min(1, dt * 8));
        camera.position.copy(controls.target).add(offset);
      }
    },
  };
}
