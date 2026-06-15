// Helpers shared by every view-model builder: date sorting/formatting and
// structured author objects (rendered by AuthorChip/AuthorList components).
import { makeDateFmt } from '../i18n.js';

export function byDateDesc(field) {
  return (a, b) => (a[field] < b[field] ? 1 : a[field] > b[field] ? -1 : 0);
}

export function dateFmtFor(t) {
  return makeDateFmt(t.months, t.present);
}

// ── Authors ────────────────────────────────────────────────────────────────

export function nameInitials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Structured author for one coauthor key (or a plain-string author name).
// The site owner ('augusto') renders bold and never links out.
export function buildAuthor(coauthors, key) {
  const coauthor = coauthors[key];
  const bold = key === 'augusto';
  const name = coauthor ? coauthor.name : key;
  return {
    name,
    url: (!bold && coauthor?.url) || '',
    avatar_path: coauthor?.avatar ? `/${coauthor.avatar}` : '',
    initials: nameInitials(name),
    bold,
  };
}

export function buildAuthors(coauthors, keys = []) {
  return keys.map((key) => buildAuthor(coauthors, key));
}
