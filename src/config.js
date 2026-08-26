// Site-wide feature flags and external-service configuration.

// Shows a banner on the teaching index while materials are being prepared.
export const TEACHING_UNDER_CONSTRUCTION = false;

// External repository hosting the teaching PDFs. It is a shared multi-subject
// resources repo (also serves other degrees/subjects), so each subject lives
// under its own institutional-code folder rather than the site's subject id
// — see REPO_SUBJECT_PATHS below. Layout: <repo-folder>/apuntes/*.pdf and
// <repo-folder>/practicas/*.pdf, e.g. EPIG-GIITIN-TEW/apuntes/*.pdf.
//
// IMPORTANT — PDFs are linked through `pages_url`, NOT raw.githubusercontent.
// raw.githubusercontent.com serves PDFs as `application/octet-stream` with
// `X-Content-Type-Options: nosniff`, so browsers refuse to render them inline
// and an <iframe> just downloads the file. GitHub Pages serves the same file
// as `application/pdf` (plus `Access-Control-Allow-Origin: *`), which is what
// makes the on-page viewer work. Enable Pages on the materials repository.
export const TEACHING_REPO = {
  owner: 'augustocristian',
  repo: 'teaching-resources',
  branch: 'main',
  // Origin serving the PDFs. Must be the GitHub Pages site of the repo above.
  pages_url: 'https://augustocristian.github.io/teaching-resources',
  // `true` once the repository's GitHub Pages site is published: subject
  // pages then also list the repo folder live via the Contents API.
  enabled: true,
  // Subfolder of <repo-folder>/ that the live listing enumerates (the Contents
  // API is not recursive). Empty = the subject root — which lists nothing under
  // the apuntes/ + practicas/ layout, so set it to the folder you want listed.
  // Note this is largely redundant now: each session's viewer already probes
  // its own documents, so new uploads show up there without a rebuild either.
  list_path: 'practicas',
};

// Site subject id -> folder name inside the materials repo, only where they
// differ (the repo follows the institution's own folder codes, not the
// site's slug). Subjects not listed here use their site id as-is.
const REPO_SUBJECT_PATHS = {
  'web-technologies': 'EPIG-GIITIN-TEW',
};

export function repoSubjectPath(subjectId) {
  return REPO_SUBJECT_PATHS[subjectId] || subjectId;
}

// Documents that must NEVER reach students. The solutions to the lab exercise
// sheets ('Solucion Ejercicios SesionN.pdf') are course-private, permanently —
// they are not a "publish them later" case.
//
// Enforced in three places so copying the whole pdf-practicas/ folder into the
// materials repository cannot leak them:
//   1. src/lib/teaching.js  — the build FAILS if a session lists a match.
//   2. GithubPdfList.astro  — filtered out of the live repository listing.
//   3. The MDX files themselves only reference the guion + the exercise sheet.
// Kept as a source string so the same pattern works in the client-side script.
export const TEACHING_PRIVATE_PATTERN = 'soluci[oó]n|solution';

export function isPrivateTeachingDoc(name) {
  return new RegExp(TEACHING_PRIVATE_PATTERN, 'i').test(name);
}

// Absolute URL of a PDF inside the materials repo, from a subject-relative
// path (e.g. 'apuntes/00 Presentacion.pdf'). Each path segment is encoded so
// spaces and accents in the LaTeX-generated file names survive.
export function teachingPdfUrl(subjectId, file) {
  if (!file) return '';
  if (/^https?:\/\//.test(file)) return file;
  const segments = `${repoSubjectPath(subjectId)}/${file}`.split('/').filter(Boolean);
  return `${TEACHING_REPO.pages_url}/${segments.map(encodeURIComponent).join('/')}`;
}
