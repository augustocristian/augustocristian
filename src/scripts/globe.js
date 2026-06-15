// globe.js — scroll-driven 3D globe, margin labels with SVG connectors

// Creates a 4×2 px solid-color canvas data-URL usable as a Globe.gl texture.
function solidTexture(color) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 2);
  return c.toDataURL();
}

// Globe colours come from the CSS design tokens (tokens.css defines the
// --globe-* set per theme), so they can never drift from the site palette.
// `ocean` is used as a solid-color texture on the globe sphere surface;
// `country` overlays on top and should contrast with the ocean shade.
function getTheme() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(name).trim();
  return {
    bg:      token('--color-bg'),
    ocean:   token('--globe-ocean'),
    atm:     token('--color-accent'),
    country: token('--globe-country'),
    stroke:  token('--globe-stroke'),
    accent:  token('--globe-pin'),
  };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error(src));
    document.head.appendChild(el);
  });
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { return false; }
}

function computeCentroid(locs) {
  let sLat = 0, sLng = 0, total = 0;
  for (const loc of locs) {
    const w = loc.items.length;
    sLat += loc.lat * w; sLng += loc.lng * w; total += w;
  }
  return total ? { lat: sLat / total, lng: sLng / total } : { lat: 20, lng: 0 };
}

function lngDist(a, b) {
  return Math.abs(((a - b) + 540) % 360 - 180);
}

export function initGlobe() {
  const container = document.getElementById('globe-viz');
  const driverEl  = document.getElementById('globe-scroll-driver');
  const stickyEl  = document.getElementById('globe-sticky');
  if (!container || !driverEl || !stickyEl || !globalThis.GLOBE_LOCATIONS) return;
  if (!hasWebGL()) return;

  const locs = globalThis.GLOBE_LOCATIONS;
  if (!locs.length) return;

  // Defer the heavy CDN loading (Globe.gl ~700 KB) until the section is
  // within 500 px of the viewport — avoids penalising initial page load.
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    loadAndRun().catch(() => {});
  }, { rootMargin: '500px' });
  observer.observe(driverEl);
}

async function loadAndRun() {
  const container = document.getElementById('globe-viz');
  const driverEl  = document.getElementById('globe-scroll-driver');
  const stickyEl  = document.getElementById('globe-sticky');

  try {
    await loadScript('https://unpkg.com/topojson-client@3/dist/topojson-client.min.js');
    await loadScript('https://unpkg.com/globe.gl@2/dist/globe.gl.min.js');
  } catch { return; }

  const locs = globalThis.GLOBE_LOCATIONS;

  let theme    = getTheme();
  const center = computeCentroid(locs);
  const startLng = center.lng - 20;

  // ── Globe instance (no htmlElementsData — we manage labels ourselves) ────
  const globe = Globe({ rendererConfig: { antialias: true } })
    .width(container.offsetWidth)
    .height(container.offsetHeight)
    .backgroundColor(theme.bg)
    .globeImageUrl(solidTexture(theme.ocean))
    .atmosphereColor(theme.atm)
    .atmosphereAltitude(0.18)
    .pointsData([])
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointColor(() => theme.accent)
    .pointRadius(0.45)
    .pointAltitude(0.02)
    (container);

  const controls = globe.controls();
  controls.enableZoom   = false;
  controls.enablePan    = false;
  controls.enableRotate = false;
  controls.autoRotate   = false;

  globe.pointOfView({ lat: 25, lng: startLng, altitude: 2.2 });

  // ── Country polygons ───────────────────────────────────────────────────────
  fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries).features;
      globe
        .polygonsData(countries)
        .polygonCapColor(() => theme.country)
        .polygonSideColor(() => 'transparent')
        .polygonStrokeColor(() => theme.stroke)
        .polygonAltitude(0.004);
    })
    .catch(() => {});

  // ── SVG overlay + label container (appended to vizWrap, not to the canvas) ─
  const vizWrap = container.parentElement;

  const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgOverlay.setAttribute('class', 'globe-overlay-svg');
  svgOverlay.setAttribute('aria-hidden', 'true');
  vizWrap.appendChild(svgOverlay);

  const labelsDiv = document.createElement('div');
  labelsDiv.className = 'globe-labels-container';
  vizWrap.appendChild(labelsDiv);

  // ── Label + SVG element pools ──────────────────────────────────────────────
  const labelEls = new Map();  // key → div
  const svgEls   = new Map();  // key → {line, dot}

  const LABEL_W       = 128;
  const LABEL_H       = 38;
  const GAP           = 6;
  const GAP_FROM_EDGE = 6;   // px gap between label and globe sphere edge
  const SCREEN_PAD_X  = 4;   // minimum distance from container edge
  const PAD_Y         = 10;

  function ensureLabel(key, loc, isNew) {
    if (labelEls.has(key)) return;
    const el = document.createElement('div');
    el.className = 'globe-pin-label' + (isNew ? ' globe-pin-label--emerge' : '');
    const f     = loc.items[0];
    const extra = loc.items.length > 1
      ? `<span class="globe-pin-extra"> +${loc.items.length - 1}</span>` : '';
    el.innerHTML =
      `<span class="globe-pin-acronym">${f.label}${extra}</span>` +
      `<span class="globe-pin-meta">${f.city} · ${f.year}</span>`;
    el.addEventListener('click', () => { globalThis.location.href = f.url; });
    labelsDiv.appendChild(el);
    labelEls.set(key, el);
  }

  function ensureSvg(key) {
    if (svgEls.has(key)) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'globe-connector');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'globe-connector-dot');
    dot.setAttribute('r', '3');
    svgOverlay.appendChild(line);
    svgOverlay.appendChild(dot);
    svgEls.set(key, { line, dot });
  }

  function removePin(key) {
    const el = labelEls.get(key);
    if (el) { labelsDiv.removeChild(el); labelEls.delete(key); }
    const s = svgEls.get(key);
    if (s) { svgOverlay.removeChild(s.line); svgOverlay.removeChild(s.dot); svgEls.delete(key); }
  }

  // ── 3D → 2D projection using camera matrices ──────────────────────────────
  // Globe.gl keeps the mesh fixed; the camera orbits it.
  // globe.getCoords(lat, lng, alt) → {x,y,z} in Three.js world space.
  // We project using the camera's current matrixWorldInverse + projectionMatrix.
  function project(wx, wy, wz, W, H) {
    const cam = globe.camera();
    const mv  = cam.matrixWorldInverse.elements;   // column-major 4×4
    const pp  = cam.projectionMatrix.elements;

    // World → View
    const vx = mv[0]*wx + mv[4]*wy + mv[8]*wz  + mv[12];
    const vy = mv[1]*wx + mv[5]*wy + mv[9]*wz  + mv[13];
    const vz = mv[2]*wx + mv[6]*wy + mv[10]*wz + mv[14];
    const vw = mv[3]*wx + mv[7]*wy + mv[11]*wz + mv[15];

    // View → Clip
    const cx = pp[0]*vx + pp[4]*vy + pp[8]*vz  + pp[12]*vw;
    const cy = pp[1]*vx + pp[5]*vy + pp[9]*vz  + pp[13]*vw;
    const cz = pp[2]*vx + pp[6]*vy + pp[10]*vz + pp[14]*vw;
    const cw = pp[3]*vx + pp[7]*vy + pp[11]*vz + pp[15]*vw;

    return {
      x: ((cx / cw) + 1) / 2 * W,
      y: (1 - (cy / cw)) / 2 * H,
    };
  }

  // ── Layout: place labels in left/right margins + draw connectors ──────────
  // All layout READS happen up front, once per frame (container size, camera
  // matrices, projections); the style WRITES follow in placeSide — no
  // interleaved read/write thrash on the scroll path.
  function updateLayout() {
    if (!labelEls.size) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;

    // Force camera matrices to be current once, then project every pin
    globe.camera().updateMatrixWorld();

    const items = [];
    for (const [key] of labelEls) {
      const loc = locs.find(l => `${l.lat},${l.lng}` === key);
      if (!loc) continue;
      const { x: wx, y: wy, z: wz } = globe.getCoords(loc.lat, loc.lng, 0);
      const { x: sx, y: sy } = project(wx, wy, wz, W, H);
      items.push({ key, sx, sy, left: sx < W / 2 });
    }

    const leftItems  = items.filter(i =>  i.left).sort((a, b) => a.sy - b.sy);
    const rightItems = items.filter(i => !i.left).sort((a, b) => a.sy - b.sy);

    const circle = getGlobeCircle(W, H);
    placeSide(leftItems,  'left',  W, H, circle);
    placeSide(rightItems, 'right', W, H, circle);
  }

  // Project the globe's screen-space circle: center + radius.
  // Center = projection of world origin (0,0,0).
  // Radius = distance from center to the equatorial tangent (±90° from camera).
  // Caller must have refreshed the camera matrices already.
  function getGlobeCircle(W, H) {
    const center = project(0, 0, 0, W, H);
    const { x: tx, y: ty, z: tz } = globe.getCoords(0, lastLng + 90, 0);
    const tangent = project(tx, ty, tz, W, H);
    return { cx: center.x, cy: center.y, r: Math.abs(tangent.x - center.x) };
  }

  // Safe label X for a given Y, accounting for the circular globe boundary.
  // Each label gets its own X so no label can overlap the sphere at any height.
  function safeLabelX(side, W, labelTopY, cx, cy, r) {
    const midY = labelTopY + LABEL_H / 2;
    const dy   = midY - cy;
    // Horizontal extent of the sphere circle at this Y
    const xExt = Math.abs(dy) < r ? Math.sqrt(r * r - dy * dy) : r;
    return side === 'left'
      ? Math.max(SCREEN_PAD_X,            cx - xExt - LABEL_W - GAP_FROM_EDGE)
      : Math.min(W - LABEL_W - SCREEN_PAD_X, cx + xExt + GAP_FROM_EDGE);
  }

  function placeSide(items, side, W, H, { cx, cy, r }) {
    const maxY = H - PAD_Y - LABEL_H;
    let nextY  = PAD_Y;

    for (const item of items) {
      const el  = labelEls.get(item.key);
      const svg = svgEls.get(item.key);

      // No room left — hide this label and its connector rather than overlapping
      if (nextY > maxY) {
        if (el)  el.style.display = 'none';
        if (svg) { svg.line.style.display = 'none'; svg.dot.style.display = 'none'; }
        continue;
      }

      const idealY = item.sy - LABEL_H / 2;
      const ly     = Math.max(nextY, Math.min(maxY, idealY));
      nextY        = ly + LABEL_H + GAP;

      const lx = safeLabelX(side, W, ly, cx, cy, r);

      if (el) {
        el.style.display = '';
        el.style.left    = lx + 'px';
        el.style.top     = ly + 'px';
        el.style.width   = LABEL_W + 'px';
      }

      // Connector anchor = closer edge of the label (facing the globe)
      const anchorX = side === 'left' ? lx + LABEL_W : lx;
      const anchorY = ly + LABEL_H / 2;

      ensureSvg(item.key);
      const { line, dot } = svgEls.get(item.key);
      line.style.display = '';
      dot.style.display  = '';
      line.setAttribute('x1', anchorX);
      line.setAttribute('y1', anchorY);
      line.setAttribute('x2', item.sx);
      line.setAttribute('y2', item.sy);
      dot.setAttribute('cx', item.sx);
      dot.setAttribute('cy', item.sy);
    }
  }

  // ── Rotation-aware pin visibility ──────────────────────────────────────────
  const knownKeys   = new Set();
  const currentPins = new Set();

  function syncPins(cameraLng) {
    let changed  = false;
    const newKeys = new Set();

    for (const loc of locs) {
      const key     = `${loc.lat},${loc.lng}`;
      const onFront = lngDist(loc.lng, cameraLng) < 88;

      if (onFront && !currentPins.has(key)) {
        currentPins.add(key);
        if (!knownKeys.has(key)) { knownKeys.add(key); newKeys.add(key); }
        ensureLabel(key, loc, newKeys.has(key));
        changed = true;
      } else if (!onFront && currentPins.has(key)) {
        currentPins.delete(key);
        removePin(key);
        changed = true;
      }
    }

    if (changed) {
      globe.pointsData(locs.filter(l => currentPins.has(`${l.lat},${l.lng}`)));
    }
    updateLayout();
  }

  // ── Scroll → rotation ─────────────────────────────────────────────────────
  function getProgress() {
    const extra = driverEl.offsetHeight - globalThis.innerHeight;
    if (extra <= 0) return 0;
    const rect = driverEl.getBoundingClientRect();
    return Math.max(0, Math.min(1, -rect.top / extra));
  }

  let lastLng = startLng;

  function applyRotation() {
    const progress = getProgress();
    const lng      = startLng + progress * 360;
    if (Math.abs(lng - lastLng) < 0.05) return;
    lastLng = lng;
    globe.pointOfView({ lat: 25, lng, altitude: 2.2 }, 0);
    syncPins(lng);
  }

  // rAF-throttled scroll handler — at most one rotation + label layout per frame
  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      applyRotation();
    });
  }

  const reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    // Static globe: no scroll-driven rotation, no entrance animation —
    // just render the centroid hemisphere with its pins visible.
    syncPins(startLng);
  } else {
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    applyRotation();
    syncPins(lastLng);

    // Emerge animation for the sticky section
    stickyEl.style.cssText = 'opacity:0;transform:translateY(60px);transition:opacity .9s ease,transform .9s cubic-bezier(.22,1,.36,1)';
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(() => {
          stickyEl.style.opacity   = '1';
          stickyEl.style.transform = 'translateY(0)';
        });
      }
    }, { threshold: 0.01 }).observe(driverEl);
  }

  // ── Theme ──────────────────────────────────────────────────────────────────
  function applyTheme() {
    theme = getTheme();
    globe
      .backgroundColor(theme.bg)
      .globeImageUrl(solidTexture(theme.ocean))
      .atmosphereColor(theme.atm)
      .polygonCapColor(() => theme.country)
      .polygonStrokeColor(() => theme.stroke)
      .pointColor(() => theme.accent);
    for (const { line, dot } of svgEls.values()) {
      line.setAttribute('stroke', theme.accent);
      dot.setAttribute('fill',   theme.accent);
    }
  }

  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
  globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  // ── Resize ─────────────────────────────────────────────────────────────────
  new ResizeObserver(() => {
    globe.width(container.offsetWidth).height(container.offsetHeight);
    updateLayout();
  }).observe(container);
}
