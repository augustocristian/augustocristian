// Teaching-record view model — flattens data/teaching/courses.yaml into the
// delivery list the chart consumes, plus the filter facets.
//
// See src/lib/teaching-aggregate.js for what a "delivery" is and why hours are
// counted once per delivery rather than once per degree.

// Degree ids in the order they should appear as filter chips: the ones with the
// most hours first, so the useful filters are not buried behind the marginal ones.
function degreeOrder(deliveries, degrees) {
  const hours = new Map();
  for (const d of deliveries) {
    for (const id of d.degrees) hours.set(id, (hours.get(id) ?? 0) + d.hours);
  }
  return [...hours.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, h]) => ({
      id,
      label: degrees[id]?.short ?? id,
      full: degrees[id]?.full ?? id,
      level: degrees[id]?.level ?? 'grado',
      hours: h,
    }));
}

export function buildTeachingRecord(record) {
  const degrees = record.degrees ?? {};

  const deliveries = record.courses.flatMap((course) =>
    course.teaching.map((item, i) => ({
      id: `${course.year}-${i}`,
      year: course.year,
      status: course.status,
      position: course.position,
      subject: item.subject,
      theory: item.theory ?? 0,
      practice: item.practice ?? 0,
      hours: item.hours,
      shared: Boolean(item.shared),
      english: Boolean(item.english),
      degrees: item.degrees.map((g) => g.id),
      // Audience detail is only needed by the table view, so it rides along
      // rather than being recomputed there.
      audience: item.degrees.map((g) => ({
        id: g.id,
        year: g.year,
        label: degrees[g.id]?.short ?? g.id,
        full: degrees[g.id]?.full ?? g.id,
      })),
    })),
  );

  // id -> group id, for the degrees that collapse into one row.
  const groups = record.degree_groups ?? {};
  const groupOf = {};
  for (const [gid, g] of Object.entries(groups)) {
    for (const member of g.members) groupOf[member] = gid;
  }

  return {
    deliveries,
    groups,
    groupOf,
    yearOptions: record.courses.map((c) => ({
      year: c.year,
      status: c.status,
      hours: c.teaching.reduce((n, t) => n + t.hours, 0),
    })),
    degreeOptions: degreeOrder(deliveries, degrees),
    source: record.source ?? '',
  };
}
