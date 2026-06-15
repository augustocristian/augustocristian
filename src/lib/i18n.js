// i18n helpers — three fixed languages, EN unprefixed at the site root.
import path from 'node:path';
import { readYaml } from './data.js';

export const LANGS = [
  { code: 'en', prefix: '/' },
  { code: 'es', prefix: '/es/' },
  { code: 'it', prefix: '/it/' },
];

const I18N_DIR = path.resolve(process.cwd(), 'data', 'i18n');
const cache = new Map();

// UI-string dictionary for a language (data/i18n/<lang>.yaml).
export function loadI18n(lang) {
  if (!cache.has(lang)) {
    cache.set(lang, readYaml(path.join(I18N_DIR, `${lang}.yaml`)));
  }
  return cache.get(lang);
}

// Most specific translation for a content field: obj[field_lang] → obj[field].
export function localize(obj, field, lang) {
  return obj[`${field}_${lang}`] ?? obj[field] ?? '';
}

export function prefixFor(lang) {
  return lang === 'en' ? '/' : `/${lang}/`;
}

// getStaticPaths entries for the [...lang] route tree — EN maps to the rest
// param being undefined so English pages land at the site root.
export function langStaticPaths() {
  return LANGS.map(({ code }) => ({
    params: { lang: code === 'en' ? undefined : code },
    props: { lang: code },
  }));
}

// Language-switcher entries. pagePath: '' for home, 'publications/' etc.
export function langLinks(currentLang, pagePath) {
  return [
    { code: 'EN', lang: 'en', url: `/${pagePath}`, active: currentLang === 'en' },
    { code: 'ES', lang: 'es', url: `/es/${pagePath}`, active: currentLang === 'es' },
    { code: 'IT', lang: 'it', url: `/it/${pagePath}`, active: currentLang === 'it' },
  ];
}

// Locale-aware date formatters built from the i18n months array.
export function makeDateFmt(months, presentLabel) {
  function monthYear(dateValue) {
    const d = new Date(dateValue);
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  function dateRange(start, end) {
    const startLabel = monthYear(start);
    const endLabel = end === undefined || end === null || end === '' ? presentLabel : monthYear(end);
    return `${startLabel} – ${endLabel}`;
  }

  function talkRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const sM = startDate.getUTCMonth();
    const sD = startDate.getUTCDate();
    const sY = startDate.getUTCFullYear();
    const eM = endDate.getUTCMonth();
    const eD = endDate.getUTCDate();
    const eY = endDate.getUTCFullYear();

    if (sY === eY && sM === eM && sD === eD) return `${months[sM]} ${sD}, ${sY}`;
    if (sY === eY && sM === eM) return `${months[sM]} ${sD}–${eD}, ${sY}`;
    if (sY === eY) return `${months[sM]} ${sD} – ${months[eM]} ${eD}, ${sY}`;
    return `${months[sM]} ${sD}, ${sY} – ${months[eM]} ${eD}, ${eY}`;
  }

  return { monthYear, dateRange, talkRange };
}
