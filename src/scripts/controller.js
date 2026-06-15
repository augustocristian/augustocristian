// controller.js — application logic; wires model + view; attaches event listeners

import { filterItems, revealTargets } from './model.js';
import {
  showCard, hideCard, setCount,
  setActive, clearActive,
  markRevealed, scheduleReveal, triggerReveal,
} from './view.js';

// ── Theme ────────────────────────────────────────────────────────────────────
export function initTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  if (!btn) return;

  function isDark() {
    const t = html.dataset.theme;
    if (t === 'dark')  return true;
    if (t === 'light') return false;
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
}

// ── Navigation ───────────────────────────────────────────────────────────────
export function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Header scroll state ───────────────────────────────────────────────────────
// Adds .is-scrolled (hairline + shadow, see header.css) once the page scrolls.
export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;

  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

// ── Faceted filters ──────────────────────────────────────────────────────────
// One generic engine for every FilterBar on the page. Each [data-filter-root]
// filters the [data-filter-item] children of its data-target list. An item
// matches a facet when its space-separated data-<facet> values intersect the
// active set (OR within a facet, AND across facets); the optional text search
// substring-matches data-<searchField>.
//
// With data-page-size set, matched items are additionally paginated: page
// buttons render into [data-pager-for="<target>"] and the visible range into
// the .filter-range/.filter-count-n spans of [data-count-for="<target>"].
export function initFilters() {
  document.querySelectorAll('[data-filter-root]').forEach((root) => {
    const target = root.dataset.target;
    const items  = filterItems(target);
    if (!items.length) return;

    const searchInput = root.querySelector('[data-search]');
    const searchField = root.dataset.searchField || '';
    const buttons     = Array.from(root.querySelectorAll('.filter-btn'));
    const active      = new Map(); // facet name -> Set of active values
    let query = '';

    const pageSize  = Number(root.dataset.pageSize) || 0;
    const pager     = pageSize ? document.querySelector(`[data-pager-for="${target}"]`) : null;
    const countWrap = document.querySelector(`[data-count-for="${target}"]`);
    const countEl   = root.querySelector('.filter-count-n') || countWrap?.querySelector('.filter-count-n');
    const rangeEl   = countWrap?.querySelector('.filter-range');
    let page = 1;

    function matches(item) {
      for (const [facet, set] of active) {
        if (!set.size) continue;
        const values = new Set((item.data[facet] ?? '').split(/\s+/).filter(Boolean));
        if (![...set].some((v) => values.has(v))) return false;
      }
      return !query || (item.data[searchField] ?? '').includes(query);
    }

    function applyFilters() {
      const matched    = items.filter(matches);
      const totalPages = pageSize ? Math.max(1, Math.ceil(matched.length / pageSize)) : 1;
      if (page > totalPages) page = totalPages;

      const start = pageSize ? (page - 1) * pageSize : 0;
      const shown = pageSize ? matched.slice(start, start + pageSize) : matched;
      const visible = new Set(shown);
      items.forEach((item) => (visible.has(item) ? showCard(item) : hideCard(item)));

      setCount(countEl, matched.length);
      if (rangeEl) rangeEl.textContent = shown.length ? `${start + 1}–${start + shown.length}` : '0';
      renderPager(totalPages);
    }

    function renderPager(totalPages) {
      if (!pager) return;
      pager.replaceChildren();
      pager.hidden = totalPages <= 1;
      if (totalPages <= 1) return;

      const add = (label, targetPage, { active: isActive = false, disabled = false } = {}) => {
        const btn = document.createElement('button');
        btn.className = `pager-btn${isActive ? ' is-active' : ''}`;
        btn.textContent = label;
        btn.disabled = disabled;
        btn.addEventListener('click', () => {
          page = targetPage;
          applyFilters();
          document.querySelector(target)?.scrollIntoView({ block: 'start' });
        });
        pager.appendChild(btn);
      };

      for (let p = 1; p <= totalPages; p++) add(String(p), p, { active: p === page });
      add(pager.dataset.labelNext, Math.min(page + 1, totalPages), { disabled: page === totalPages });
      add(pager.dataset.labelLast, totalPages, { disabled: page === totalPages });
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const { filter, value } = btn.dataset;
        if (!active.has(filter)) active.set(filter, new Set());
        const set    = active.get(filter);
        const adding = !set.has(value);
        adding ? set.add(value) : set.delete(value);
        setActive(btn, adding);
        page = 1;
        applyFilters();
      });
    });

    searchInput?.addEventListener('input', () => {
      query = searchInput.value.toLowerCase();
      page = 1;
      applyFilters();
    });

    root.querySelector('.filter-reset')?.addEventListener('click', () => {
      active.forEach((set) => set.clear());
      clearActive(buttons);
      if (searchInput) searchInput.value = '';
      query = '';
      page = 1;
      applyFilters();
    });

    if (pageSize) applyFilters();
  });
}

// ── Publication detail overlay ────────────────────────────────────────────────
export function initPubDetail() {
  const dialog  = document.getElementById('pub-overlay');
  const body    = document.getElementById('pub-overlay-body');
  const closeBtn= document.getElementById('pub-overlay-close');
  if (!dialog || !body) return;

  function open(tpl) {
    body.innerHTML = '';
    body.appendChild(tpl.content.cloneNode(true));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    dialog.close();
    document.body.style.overflow = '';
  }

  // Click anywhere on pub-card body (not on links, buttons, or the abstract toggle)
  document.querySelectorAll('.pub-card').forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button, details, summary')) return;
      const tpl = card.closest('.pub-item')?.querySelector('.pub-detail-tpl');
      if (tpl) open(tpl);
    });
  });

  closeBtn?.addEventListener('click', close);

  // Click on ::backdrop (coordinates fall outside dialog bounding rect)
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right ||
        e.clientY < r.top  || e.clientY > r.bottom) close();
  });

  // Native Esc handling: <dialog> dispatches 'cancel' then closes itself;
  // we just need to restore body overflow.
  dialog.addEventListener('cancel', () => {
    document.body.style.overflow = '';
  });

  // Auto-open from URL hash (homepage card-link navigates to /publications/#id)
  const hash = globalThis.location.hash.slice(1);
  if (hash) {
    const article = document.getElementById(hash);
    const tpl     = article?.closest('.pub-item')?.querySelector('.pub-detail-tpl');
    if (tpl) requestAnimationFrame(() => open(tpl));
  }
}

// ── Scroll reveal (homepage only) ────────────────────────────────────────────
export function initScrollReveal() {
  if (!('IntersectionObserver' in globalThis) || !document.querySelector('.hero')) return;

  const targets = revealTargets();

  // Stagger cards within the same parent container (delay only on appear)
  const byParent = new Map();
  targets.forEach(({ el, variant }) => {
    if (variant !== 'card') return;
    const p = el.parentElement;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(el);
  });
  byParent.forEach((els) => {
    els.forEach((el, i) => {
      if (i > 0) el.dataset.revealDelay = `${i * 0.08}s`;
    });
  });

  // One-shot observer, threshold 0: float in as soon as the element's
  // leading edge enters the viewport (so the whole animation plays on
  // screen), then leave it alone — revealed elements stay put.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        triggerReveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0 });

  targets.forEach(({ el, variant }) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < globalThis.innerHeight) {
      markRevealed(el, variant);
    } else {
      scheduleReveal(el, variant);
      observer.observe(el);
    }
  });
}
