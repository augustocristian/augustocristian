// main.js — entry point; imports and initializes all controllers
// FOUC prevention (localStorage → data-theme) is handled by the inline script in <head>

import { initTheme, initNav, initHeaderScroll, initFilters, initScrollReveal, initPubDetail } from './controller.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initHeaderScroll();
  initFilters();
  initScrollReveal();
  initPubDetail();

  // Globe.js is only needed on the homepage — dynamic import keeps it out of
  // every other page's module graph entirely.
  if (document.getElementById('globe-viz')) {
    import('./globe.js').then(({ initGlobe }) => initGlobe());
  }
});
