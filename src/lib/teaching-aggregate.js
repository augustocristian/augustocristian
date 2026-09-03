// Aggregation over the teaching record.
//
// Deliberately pure and dependency-free: this module is imported BOTH by the
// Astro frontmatter (which server-renders the unfiltered charts, so the page
// works without JS) and by the page's client script (which re-renders them when
// a filter changes). One implementation means the two can never disagree.
//
// The unit is a *delivery*: one subject in one academic year. A delivery can
// reach several degrees — that is one class with several audiences, so its hours
// are counted once, which is how the certificate's own yearly totals add up.

export function filterDeliveries(deliveries, { years = [], degrees = [] } = {}) {
  return deliveries.filter(
    (d) =>
      (years.length === 0 || years.includes(d.year)) &&
      (degrees.length === 0 || d.degrees.some((id) => degrees.includes(id))),
  );
}

function blank() {
  return { hours: 0, theory: 0, practice: 0, count: 0 };
}

function add(bucket, d) {
  bucket.hours += d.hours;
  bucket.theory += d.theory;
  bucket.practice += d.practice;
  bucket.count += 1;
  return bucket;
}

// Rounds to one decimal without showing a trailing ".0" — the certificate has
// values like 45.6 alongside whole numbers.
export function fmtHours(n) {
  return (Math.round(n * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 });
}

export function aggregate(deliveries) {
  const totals = deliveries.reduce((acc, d) => add(acc, d), blank());

  const bySubject = new Map();
  const byYear = new Map();
  const degrees = new Set();

  for (const d of deliveries) {
    if (!bySubject.has(d.subject)) bySubject.set(d.subject, { key: d.subject, ...blank() });
    add(bySubject.get(d.subject), d);

    if (!byYear.has(d.year)) {
      byYear.set(d.year, { key: d.year, status: d.status, ...blank() });
    }
    add(byYear.get(d.year), d);

    for (const id of d.degrees) degrees.add(id);
  }

  const share = (h) => (totals.hours > 0 ? (h / totals.hours) * 100 : 0);
  const decorate = (rows) => rows.map((r) => ({ ...r, share: share(r.hours) }));

  return {
    totals: {
      ...totals,
      subjects: bySubject.size,
      degrees: degrees.size,
      years: byYear.size,
    },
    // Subjects ranked by hours — the ordering IS the message of that chart.
    subjects: decorate([...bySubject.values()].sort((a, b) => b.hours - a.hours)),
    // Years newest first, matching how the certificate reads.
    years: decorate([...byYear.values()].sort((a, b) => b.key.localeCompare(a.key))),
  };
}

/* ── Degree-centric views ──────────────────────────────────────────────────
   IMPORTANT — these use FULL attribution: a delivery that reached six degrees
   counts its hours for each of them. That is right for "where have I been
   present?", and it means these totals deliberately do NOT sum to the certified
   total (2 633 h against 1 417 h) — they answer a different question from the
   hours charts, and the UI says so. Never mix the two sums.                  */

// Degrees ranked by hours, with the presence measures the timeline shows.
export function aggregateDegrees(deliveries) {
  const map = new Map();
  for (const d of deliveries) {
    for (const id of d.degrees) {
      if (!map.has(id)) {
        map.set(id, { id, hours: 0, theory: 0, practice: 0, years: new Set(), subjects: new Set() });
      }
      const row = map.get(id);
      row.hours += d.hours;
      row.theory += d.theory;
      row.practice += d.practice;
      row.years.add(d.year);
      row.subjects.add(d.subject);
    }
  }
  return [...map.values()]
    .map((r) => ({
      id: r.id, hours: r.hours, theory: r.theory, practice: r.practice,
      years: r.years.size, subjects: r.subjects.size,
    }))
    .sort((a, b) => b.hours - a.hours || b.years - a.years);
}

// cell[degreeId][year] = { hours, theory, practice } — the timeline's columns.
// The lecture/lab split rides along so the timeline keeps the same distinction
// as the bar charts instead of collapsing to a single measure.
export function degreeYearMatrix(deliveries) {
  const m = {};
  for (const d of deliveries) {
    for (const id of d.degrees) {
      (m[id] ??= {});
      const cell = (m[id][d.year] ??= { hours: 0, theory: 0, practice: 0 });
      cell.hours += d.hours;
      cell.theory += d.theory;
      cell.practice += d.practice;
    }
  }
  return m;
}

// Every subject -> degree relationship, with the hours flowing along it.
// `fanOut` is how many degrees the subject reaches: the flow diagram's whole
// point is that one subject can put you in eight of them.
export function subjectDegreeLinks(deliveries) {
  const subjects = new Map();
  const links = new Map();

  for (const d of deliveries) {
    if (!subjects.has(d.subject)) {
      subjects.set(d.subject, { key: d.subject, hours: 0, theory: 0, practice: 0, degrees: new Set() });
    }
    const s = subjects.get(d.subject);
    s.hours += d.hours;
    s.theory += d.theory;
    s.practice += d.practice;
    for (const id of d.degrees) {
      s.degrees.add(id);
      const k = `${d.subject}\u0000${id}`;
      links.set(k, { subject: d.subject, degree: id, hours: (links.get(k)?.hours ?? 0) + d.hours });
    }
  }

  return {
    subjects: [...subjects.values()]
      .map((s) => ({
        key: s.key, hours: s.hours, theory: s.theory, practice: s.practice, fanOut: s.degrees.size,
      }))
      .sort((a, b) => b.hours - a.hours),
    links: [...links.values()].sort((a, b) => b.hours - a.hours),
  };
}

// Rewrites each delivery's degree list through a grouping map, de-duplicating
// so a delivery that reached six degrees of one group counts ONCE for it.
// Feed the result to the aggregations above and they need no changes.
export function groupDegrees(deliveries, groupOf) {
  if (!groupOf) return deliveries;
  return deliveries.map((d) => ({
    ...d,
    degrees: [...new Set(d.degrees.map((id) => groupOf[id] ?? id))],
  }));
}
