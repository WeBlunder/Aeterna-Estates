// ==========================================================================
// scene-camera.js — defines the camera's flight path through the scene and
// smooths raw scroll-progress (0..1) into a damped value the camera follows.
// Keep this file free of rendering code — scene.js owns the renderer/objects,
// this module only answers "where should the camera be at progress t?".
// ==========================================================================

import * as THREE from 'three';

/**
 * The camera's journey, expressed as control points from t=0 (top of page)
 * to t=1 (bottom of page):
 *   0.00  Hero            — wide, high aerial establishing shot over the land grid
 *   0.25  Summary/Thesis  — gliding in, slightly lower
 *   0.50  Asset/Diligence — closest, lowest pass, orbiting near the "landmarks"
 *   0.75  Value/Landscape — rising back out, sweeping around
 *   1.00  Contact/Footer  — settles back into a calm, elevated closing shot
 */
const POSITION_KEYFRAMES = [
  new THREE.Vector3(0, 55, 115),
  new THREE.Vector3(55, 42, 80),
  new THREE.Vector3(85, 26, 15),
  new THREE.Vector3(30, 38, -55),
  new THREE.Vector3(-10, 60, 105),
];

const LOOKAT_KEYFRAMES = [
  new THREE.Vector3(0, 6, -25),
  new THREE.Vector3(15, 3, -20),
  new THREE.Vector3(25, 4, -25),
  new THREE.Vector3(5, 2, -10),
  new THREE.Vector3(0, 6, -25),
];

export class CameraPath {
  constructor() {
    this.positionCurve = new THREE.CatmullRomCurve3(
      POSITION_KEYFRAMES,
      false,
      'catmullrom',
      0.5
    );
    this.lookAtCurve = new THREE.CatmullRomCurve3(
      LOOKAT_KEYFRAMES,
      false,
      'catmullrom',
      0.5
    );
  }

  /**
   * @param {number} t - progress along the path, 0..1
   * @returns {{position: THREE.Vector3, lookAt: THREE.Vector3}}
   */
  getTransform(t) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    return {
      position: this.positionCurve.getPointAt(clamped),
      lookAt: this.lookAtCurve.getPointAt(clamped),
    };
  }
}

/**
 * Exponential-damped follower: call setTarget() whenever raw scroll progress
 * changes, call update(dt) once per frame, read .value. Produces the
 * "inertia" feel called for in instructions.md 3.2 instead of snapping the
 * camera directly to the scrollbar.
 */
export class SmoothedValue {
  constructor(initial = 0, dampingPerSecond = 3.2) {
    this.value = initial;
    this.target = initial;
    this.dampingPerSecond = dampingPerSecond;
  }

  setTarget(target) {
    this.target = THREE.MathUtils.clamp(target, 0, 1);
  }

  /** @param {number} dt - seconds since last frame */
  update(dt) {
    const factor = 1 - Math.exp(-this.dampingPerSecond * dt);
    this.value += (this.target - this.value) * factor;
    return this.value;
  }

  /** Snap value straight to target — used for the reduced-motion static shot. */
  snapToTarget() {
    this.value = this.target;
  }
}
