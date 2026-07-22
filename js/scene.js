// ==========================================================================
// scene.js — builds and renders the persistent 3D background: an abstract
// stylized terrain with a floating land-parcel grid, a gradient sky with
// drifting clouds, and a camera that flies a scroll-linked path (see
// scene-camera.js). No external 3D assets — everything here is procedural,
// per instructions.md Section 3.1.
//
// Public API: initScene({ canvas, fallback }) -> { setScrollProgress(p), dispose() }
// ==========================================================================

import * as THREE from 'three';
import { CameraPath, SmoothedValue } from './scene-camera.js';

// ---- Brand palette (kept in sync with css/variables.css by hand — if you
// change the CSS tokens, update these too) ----
const COLOR = {
  bg: 0xeeeeee,
  brand: 0x6fcf97,
  deep: 0x1f6f5f,
  mid: 0x2fa084,
  skyTop: 0xdff2e8,
  skyBottom: 0x74c9a0,
  fog: 0x9fdcbe,
  terrainPlain: 0x2f9e7c,     // the flat developed land, near the camera
  terrainHill: 0x8be6b3,      // gentle rise between plain and mountains
  terrainMountain: 0x8a97a6,  // cool grey-blue distant rock
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_SMALL_SCREEN = window.innerWidth < 760;
const MAX_PIXEL_RATIO = IS_SMALL_SCREEN ? 1.5 : 2;

// --------------------------------------------------------------------------
// Tiny self-contained 2D value-noise (no external noise library needed).
// Good enough for gentle terrain undulation — not aiming for simplex-grade
// quality, just smooth, cheap, seeded pseudo-randomness.
// --------------------------------------------------------------------------
function makeValueNoise2D(seed = 1337) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const table = new Uint8Array(256).map((_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [table[i], table[j]] = [table[j], table[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = table[i & 255];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const gradAt = (ix, iy) => {
    const h = perm[(perm[ix & 255] + iy) & 255];
    return (h / 255) * Math.PI * 2;
  };
  const dot2 = (ix, iy, x, y) => {
    const angle = gradAt(ix, iy);
    return Math.cos(angle) * x + Math.sin(angle) * y;
  };

  return function noise2D(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const sx = fade(x - x0);
    const sy = fade(y - y0);
    const n00 = dot2(x0, y0, x - x0, y - y0);
    const n10 = dot2(x1, y0, x - x1, y - y0);
    const n01 = dot2(x0, y1, x - x0, y - y1);
    const n11 = dot2(x1, y1, x - x1, y - y1);
    const ix0 = lerp(n00, n10, sx);
    const ix1 = lerp(n01, n11, sx);
    return lerp(ix0, ix1, sy); // roughly -1..1
  };
}

// --------------------------------------------------------------------------
// Terrain: a single continuous mesh with three zones —
//   0.  Plain   (center)  — near-flat, this is "the property" the parcel grid sits on
//   1.  Hills   (mid-ring) — gentle rolling rise
//   2.  Mountains (outer edge) — tall, jagged, cool-toned distant ridge, fading
//       into fog/haze at the horizon so it reads as far away, not a wall
// --------------------------------------------------------------------------
function buildTerrain(noise2D, segments) {
  const size = 420;
  const half = size / 2;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const colorPlain = new THREE.Color(COLOR.terrainPlain);
  const colorHill = new THREE.Color(COLOR.terrainHill);
  const colorMountain = new THREE.Color(COLOR.terrainMountain);
  const colorHaze = new THREE.Color(COLOR.fog);

  const colors = [];
  const pos = geometry.attributes.position;

  const freqRidge = 0.01;   // broad, sweeping mountain silhouette
  const freqJagged = 0.05;  // finer detail on the peaks

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.sqrt(x * x + z * z);

    // Zone weights, 0..1, blending smoothly into each other
    const hillT = THREE.MathUtils.smoothstep(dist, 55, 130);       // 0 near center -> 1 by mid-ring
    const mountainT = THREE.MathUtils.smoothstep(dist, 145, half - 15); // 0 until ~145 -> 1 at the outer edge
    const hazeT = THREE.MathUtils.smoothstep(dist, half - 70, half);   // fades peaks into fog near the boundary

    const ridge = noise2D(x * freqRidge, z * freqRidge);   // ~-0.7..0.5
    const jagged = noise2D(x * freqJagged, z * freqJagged);

    const plainHeight = ridge * 1.2;                 // barely undulating — this is "the property"
    const hillHeight = ridge * 9;                     // gentle rise
    const mountainHeight = ridge * 55 + jagged * 22;   // tall, jagged peaks

    const h =
      plainHeight * (1 - hillT) +
      hillHeight * hillT * (1 - mountainT) +
      mountainHeight * mountainT;

    pos.setY(i, h);

    let c = colorPlain.clone().lerp(colorHill, hillT);
    c = c.lerp(colorMountain, mountainT);
    c = c.lerp(colorHaze, hazeT); // distant peaks recede into atmospheric haze
    colors.push(c.r, c.g, c.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });

  return new THREE.Mesh(geometry, material);
}

// --------------------------------------------------------------------------
// Land-parcel grid overlay: a canvas-drawn plot pattern (echoing the
// client's master-plan graphic), floated just above the terrain as a glowing
// emissive plane.
// --------------------------------------------------------------------------
function buildParcelGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(111, 207, 151, 0.9)';
  ctx.lineWidth = 2;

  // seeded pseudo-random so the layout is stable across reloads
  let s = 42;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  // irregular grid of "plots", denser toward the center — deliberately
  // abstract, not a literal copy of the client's real master plan
  const cols = 14;
  const rows = 14;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + cellH / 2;
      const distFromCenter = Math.hypot(cx - canvas.width / 2, cy - canvas.height / 2);
      if (distFromCenter < 160) continue; // leave a clearing for the "green" roundabout
      if (rand() < 0.12) continue; // sparse gaps so it doesn't look like a spreadsheet

      const jitter = 6;
      const x = c * cellW + (rand() - 0.5) * jitter;
      const y = r * cellH + (rand() - 0.5) * jitter;
      ctx.strokeRect(x, y, cellW - 4, cellH - 4);
    }
  }

  // central "green common" — echoes the roundabout/park in the client's
  // master-plan image
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height / 2, 130, 110, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(47, 160, 132, 0.95)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildParcelGrid() {
  const texture = buildParcelGridTexture();
  const geometry = new THREE.PlaneGeometry(150, 150);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 2.4;
  return mesh;
}

// --------------------------------------------------------------------------
// Sky: gradient dome (custom shader) — cheap, no texture download needed
// --------------------------------------------------------------------------
function buildSky() {
  const geometry = new THREE.SphereGeometry(400, 24, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      colorTop: { value: new THREE.Color(COLOR.skyTop) },
      colorBottom: { value: new THREE.Color(COLOR.skyBottom) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform vec3 colorTop;
      uniform vec3 colorBottom;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(colorBottom, colorTop, clamp(h, 0.0, 1.0)), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}

// --------------------------------------------------------------------------
// Clouds: soft billboarded sprites, slowly drifting
// --------------------------------------------------------------------------
function buildCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

function buildClouds(count) {
  const texture = buildCloudTexture();
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });

  const group = new THREE.Group();
  let s = 7;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(material.clone());
    const scale = 40 + rand() * 70;
    sprite.scale.set(scale, scale * 0.6, 1);
    sprite.position.set((rand() - 0.5) * 500, 45 + rand() * 45, (rand() - 0.5) * 500);
    sprite.userData.driftSpeed = 0.6 + rand() * 1.2;
    group.add(sprite);
  }
  return group;
}

// --------------------------------------------------------------------------
// Public init
// --------------------------------------------------------------------------
export function initScene({ canvas, fallback }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // lets us reliably read back pixels for debugging
    });
  } catch (err) {
    console.error('Three.js: WebGLRenderer construction threw — falling back.', err);
    showFallback();
    return { setScrollProgress() {}, dispose() {} };
  }

  if (!renderer.getContext()) {
    console.error('Three.js: no WebGL context available — falling back. Check chrome://gpu or https://get.webgl.org');
    showFallback();
    return { setScrollProgress() {}, dispose() {} };
  }

  function showFallback() {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(COLOR.skyBottom, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLOR.fog, 140, 420);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // ---- Lighting ----
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(120, 160, 80);
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(COLOR.skyTop, COLOR.deep, 0.65);
  scene.add(hemi);

  // ---- Geometry ----
  const noise2D = makeValueNoise2D(2026);
  const terrainSegments = IS_SMALL_SCREEN ? 60 : 120;
  const terrain = buildTerrain(noise2D, terrainSegments);
  scene.add(terrain);

  const parcelGrid = buildParcelGrid();
  scene.add(parcelGrid);

  const sky = buildSky();
  scene.add(sky);

  const clouds = buildClouds(IS_SMALL_SCREEN ? 6 : 14);
  scene.add(clouds);

  // ---- Camera path + scroll smoothing ----
  const cameraPath = new CameraPath();
  const smoothedProgress = new SmoothedValue(0, 3.2);

  function applyCameraForProgress(p) {
    const { position, lookAt } = cameraPath.getTransform(p);
    camera.position.copy(position);
    camera.lookAt(lookAt);
  }

  // Reduced motion: render a single static, pleasant establishing shot and
  // stop — no RAF loop, no scroll-driven camera, no cloud drift.
  if (REDUCED_MOTION) {
    applyCameraForProgress(0.08);
    renderer.render(scene, camera);
    return {
      setScrollProgress() {}, // intentionally inert
      dispose: () => renderer.dispose(),
    };
  }

  // ---- Render loop ----
  const clock = new THREE.Clock();
  let rafId = null;
  let frameCount = 0;

  function tick() {
    try {
      const dt = Math.min(clock.getDelta(), 0.1);
      smoothedProgress.update(dt);
      applyCameraForProgress(smoothedProgress.value);

      clouds.children.forEach((sprite) => {
        sprite.position.x += sprite.userData.driftSpeed * dt;
        if (sprite.position.x > 260) sprite.position.x = -260;
      });

      renderer.render(scene, camera);

      frameCount++;
      if (frameCount === 1) {
        console.log('Three.js: first frame rendered.', {
          cameraPosition: camera.position.toArray(),
          rendererSize: renderer.getSize(new THREE.Vector2()).toArray(),
        });
      }
      if (frameCount % 180 === 0) {
        console.log('Three.js: heartbeat — frame', frameCount, 'still rendering.');
      }
    } catch (err) {
      console.error('Three.js: render loop crashed on frame', frameCount, err);
      return; // stop scheduling further frames so the error is the last thing logged
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (rafId === null) {
      clock.getDelta(); // reset delta so we don't jump after being paused
      rafId = requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  });

  start();

  console.log('Three.js scene initialized and rendering.');

  return {
    setScrollProgress(p) {
      smoothedProgress.setTarget(p);
    },
    dispose() {
      stop();
      renderer.dispose();
    },
  };
}
