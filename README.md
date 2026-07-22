# Aeterna Estates — dev notes

## Preview locally
No build step needed. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
**Do not open `index.html` by double-clicking it.** That loads it over
`file://`, and browsers block ES module scripts (`<script type="module">`)
entirely on `file://` — Three.js and the CDN import would fail to fetch, and
depending on the browser, `js/main.js` may not run at all. Always use a local
server (the command above, or VS Code's "Live Server" extension) instead.

The page is now built to degrade gracefully either way (see "Resilience"
below) — but the 3D scene and full interactivity only work when served over
`http(s)://`.

## Resilience — why the page shouldn't ever go fully blank
Two things were fixed after an early version went blank end-to-end when
opened incorrectly:
- `main.js` now loads the 3D scene (`scene.js`, which pulls Three.js from a
  CDN) via a **dynamic** `import()` wrapped in `.catch()`, isolated from the
  rest of the file. If the CDN is unreachable, only the 3D background falls
  back to the static placeholder image — nav, scroll animations, and the
  form still work.
- The scroll-reveal animation is **opt-in**, not opt-out: sections are
  visible by default in CSS. Only after `main.js` successfully runs does it
  add a `.js-ready` class to `<html>`, which is what makes `.reveal` elements
  hide themselves pending the on-scroll animation. If the module script is
  blocked entirely (e.g. the `file://` case above), that class never gets
  added, and content simply shows immediately instead of staying invisible.

## No images, anywhere
This project uses **zero image files**. Everything visual — the terrain, mountains,
sky, clouds, and the plot-layout swatch in the Asset Profile section — is drawn
by code: Three.js geometry/shaders for the 3D scene, and pure CSS gradients for
the small plot-grid graphic. There is no `assets` folder. If you want a real
photo, drone shot, or master-plan graphic in the future, that's a deliberate
addition to make later — nothing here depends on one.

The nav/footer logo is an inline placeholder diamond drawn directly in
`index.html` as SVG markup (not a file) — swap its `<path>` data for the real
Auxo Holdings vector mark when available; it can stay inline, no need to make
it an image file either.

## Fonts
`index.html` currently loads Playfair Display + Inter from Google Fonts as
stand-ins for Garnet / Lovato / Marid. Swap the `<link>` block in `<head>`
for the client's real font kit once licensing is confirmed (see
`instructions.md` Section 1.2).

## What's built so far
- Full semantic HTML structure, all 12 sections from `instructions.md`.
- Design tokens (`css/variables.css`), base styles + nav/buttons/cards
  (`css/base.css`), per-section styles (`css/sections.css`), responsive
  overrides (`css/responsive.css`).
- Page chrome JS: mobile nav toggle, scroll-based nav solidify-on-scroll,
  `IntersectionObserver` scroll-reveal animations, contact form stub.
- **The 3D scene** (`js/scene.js` + `js/scene-camera.js`), loaded via Three.js
  through an import map in `index.html` — no build step, no npm install
  required to run it:
  - Procedurally generated, low-poly rolling terrain (self-contained value-noise,
    no external noise library) with a vertex-color gradient from deep to
    brand green.
  - A glowing, canvas-drawn "land parcel grid" floated above the terrain,
    echoing the client's master-plan layout (abstracted, not a literal copy).
  - A gradient sky dome (custom shader, no texture download) with soft
    drifting cloud sprites.
  - A camera that flies a fixed Catmull-Rom path across the whole page,
    driven by scroll position and smoothed with exponential damping (no
    snapping to the scrollbar) — see `js/scene-camera.js` for the keyframes.
  - `prefers-reduced-motion` support: renders one static establishing shot
    and skips the render loop entirely, no scroll-driven camera, no cloud drift.
  - Render loop pauses via the Page Visibility API when the tab isn't active.
  - Pixel ratio capped (1.5 on small screens, 2 otherwise), terrain polycount
    halved and cloud count reduced under ~760px viewports.
  - WebGL failure (unsupported browser/driver) falls back to
    `#scene-fallback` (currently showing the placeholder master-plan image)
    instead of a blank/broken canvas.

  **Sanity-tested outside the browser:** the camera path math and the
  scroll-damping logic were run directly against the real `three` package in
  Node to confirm the keyframes and easing behave as intended before you see
  them rendered. The noise function was checked for a bounded, smooth
  (no-jump) output range. Actual visual tuning (terrain amplitude, cloud
  density, camera framing per section) still needs your eyes in a real
  browser — see "Preview locally" above.

## Not built yet (next step)
- Real contact form endpoint (currently a stub in `main.js` that
  intentionally does *not* submit anywhere; see the TODO comment — wire to
  Formspree/Basin/a serverless function per `instructions.md` Section 8).
- Visual tuning pass once you've seen it live: terrain height/amplitude,
  camera framing at each section, fog distance, cloud count/speed are all
  reasonable starting values, not final.
- Swapping placeholder assets (masterplan image, logo, fonts) per the notes
  above.
