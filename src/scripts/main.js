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
});
