// Teaching-session helpers over the `teaching` content collection.
// Session ids follow <subject-id>/<type>/<file>, e.g.
// web-technologies/theory/01-introduction-to-the-web.
import { getCollection } from 'astro:content';

// Sessions of one subject, grouped by type and ordered by frontmatter `order`.
export async function loadSubjectSessions(subjectId) {
  const entries = await getCollection(
    'teaching',
    (entry) => !entry.data.hidden && entry.id.startsWith(`${subjectId}/`),
  );
  const byType = { theory: [], lab: [], seminar: [] };
  for (const entry of entries) byType[entry.data.type].push(entry);
  for (const list of Object.values(byType)) {
    list.sort((a, b) => a.data.order - b.data.order);
  }
  return byType;
}

// Which session types exist per subject — used by the teaching index cards.
export async function subjectSessionTypes(subjectId) {
  const sessions = await loadSubjectSessions(subjectId);
  return {
    has_theory: sessions.theory.length > 0,
    has_labs: sessions.lab.length > 0,
    has_seminars: sessions.seminar.length > 0,
  };
}
