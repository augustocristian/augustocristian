// Teaching-session helpers over the `teaching` content collection.
//
// A session's id is its path: <subject-id>/<group>/<NN_slug>, e.g.
// `web-technologies/theory/02d_solid-y-patrones`. Everything the sidebar and
// the planning need — the session type, its position in the course and its
// short code — is read back out of that path, so adding a session is just
// creating a numbered folder. Frontmatter can still override any of it.
import { getCollection } from 'astro:content';
import { teachingPdfUrl, isPrivateTeachingDoc } from '../config.js';

// Group directory -> session type, in the order the sidebar lists them.
const GROUPS = [
  { dir: 'theory', type: 'theory', codeLetter: 'T' },
  { dir: 'labs', type: 'lab', codeLetter: 'S' },
  { dir: 'seminars', type: 'seminar', codeLetter: 'PA' },
];
const BY_DIR = new Map(GROUPS.map((g) => [g.dir, g]));
const BY_TYPE = new Map(GROUPS.map((g) => [g.type, g]));

// '02d_solid-y-patrones' -> { order: 2.04, label: '02d' }
// The letter suffix becomes a hundredths bump so a lettered session sorts
// between its neighbours (02 < 02d < 03) without renumbering anything.
function parseSlot(folder) {
  const match = /^(\d+)([a-z]*)[_-]/.exec(folder);
  if (!match) return { order: 99, label: '' };
  const [, digits, suffix] = match;
  const bump = suffix ? (suffix.codePointAt(0) - 96) / 100 : 0;
  return { order: Number(digits) + bump, label: digits + suffix };
}

// One collection entry -> the shape the subject page renders.
function toSession(entry, subjectId) {
  const [, dir = '', folder = ''] = entry.id.split('/');
  const group = BY_DIR.get(dir) ?? BY_TYPE.get(entry.data.type) ?? GROUPS[0];
  const slot = parseSlot(folder);

  // Documents: the `pdfs` list resolved against the materials repo, plus the
  // legacy single `pdf_url` (already absolute) appended if present.
  const docs = entry.data.pdfs.map((doc) => {
    // Exercise solutions are permanently course-private — fail loudly rather
    // than quietly publishing one. See TEACHING_PRIVATE_PATTERN in config.js.
    if (isPrivateTeachingDoc(doc.file) || isPrivateTeachingDoc(doc.label)) {
      throw new Error(
        `${entry.id}: "${doc.file}" looks like an exercise solution. ` +
          'Solutions are never published — remove it from the `pdfs:` list.',
      );
    }
    return { label: doc.label, url: teachingPdfUrl(subjectId, doc.file) };
  });
  if (entry.data.pdf_url) docs.push({ label: 'PDF', url: entry.data.pdf_url });

  return {
    entry,
    data: entry.data,
    type: entry.data.type ?? group.type,
    groupDir: group.dir,
    slug: folder,
    // Deep-link hash: #theory/02d_solid-y-patrones
    key: `${group.dir}/${folder}`,
    order: entry.data.order ?? slot.order,
    code: entry.data.code || (slot.label ? `${group.codeLetter}${slot.label}` : ''),
    docs,
  };
}

// Sessions of one subject, grouped by type and ordered by their folder number.
export async function loadSubjectSessions(subjectId) {
  const entries = await getCollection(
    'teaching',
    (entry) => !entry.data.hidden && entry.id.startsWith(`${subjectId}/`),
  );
  const byType = { theory: [], lab: [], seminar: [] };
  for (const entry of entries) {
    const session = toSession(entry, subjectId);
    byType[session.type].push(session);
  }
  for (const list of Object.values(byType)) list.sort((a, b) => a.order - b.order);
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
