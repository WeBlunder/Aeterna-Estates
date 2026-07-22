// ==========================================================================
// main.js — page chrome behavior (nav, scroll reveals, form, footer year)
// plus wiring for the persistent 3D scene (scene.js / scene-camera.js).
//
// IMPORTANT: the 3D scene is loaded with a *dynamic* import (see bottom of
// this file), deliberately kept separate from everything above it. scene.js
// pulls in Three.js from a CDN — if that fails (offline, the CDN blocked, or
// this page opened directly from disk via file:// instead of a local
// server), that failure must NOT take the rest of the page down with it.
// ==========================================================================

// This must be the first thing that runs: it's the signal to base.css that
// JS successfully executed, which is what makes .reveal elements hide
// themselves pending animation (see the comment in css/base.css). If this
// script never runs at all, .reveal content stays visible by default.
document.documentElement.classList.add('js-ready');

// ---- 3D scene: loaded dynamically so a failure here is isolated ----
function showSceneFallback() {
  const canvas = document.getElementById('scene-canvas');
  const fallback = document.getElementById('scene-fallback');
  if (canvas) canvas.hidden = true;
  if (fallback) fallback.hidden = false;
}

let sceneAPI = { setScrollProgress() {} }; // no-op until (if) the real scene loads

import('./scene.js')
  .then((mod) => {
    sceneAPI = mod.initScene({
      canvas: document.getElementById('scene-canvas'),
      fallback: document.getElementById('scene-fallback'),
    });
  })
  .catch((err) => {
    console.error('3D scene failed to load — falling back to static background.', err);
    showSceneFallback();
  });

function updateSceneScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  sceneAPI.setScrollProgress(progress);
}
updateSceneScrollProgress();
window.addEventListener('scroll', updateSceneScrollProgress, { passive: true });
window.addEventListener('resize', updateSceneScrollProgress);

// ---- Footer year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Nav: solidify background after scrolling past hero, mobile toggle ----
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function updateNavState() {
  nav.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
}
updateNavState();
window.addEventListener('scroll', updateNavState, { passive: true });

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// close mobile nav after choosing a link
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---- Scroll-reveal animations ----
const revealTargets = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
} else {
  // no IntersectionObserver support — just show everything
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

// ---- Contact form (placeholder submit handler) ----
const form = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // TODO: point this at the real form endpoint (Formspree/Basin/serverless
  // function) per instructions.md Section 8. Until then this is a stub that
  // does NOT actually send data anywhere — do not present this as a working
  // submission to real users.
  formStatus.dataset.state = 'error';
  formStatus.textContent =
    'Form endpoint not yet connected — see js/form.js TODO before going live.';
});
