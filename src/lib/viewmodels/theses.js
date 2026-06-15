// TFG / TFM view models plus the filter facets for the teaching index lists.
import path from 'node:path';
import { localize } from '../i18n.js';
import { isEmpty, slugify } from '../richtext.js';
import { buildAuthor } from './shared.js';

export function buildThesisViewModels(items, coauthors, lang) {
  const sorted = [...items].sort((a, b) => (b.year || 0) - (a.year || 0));

  const viewModels = sorted.map((item) => {
    const coKey = item.cosupervisor || '';
    const title = localize(item, 'title', lang) || item.title || '';
    const abstract = (localize(item, 'abstract', lang) || '').trim().replace(/\s+/g, ' ');
    const degree = localize(item, 'degree', lang) || item.degree || '';
    const keywords = item.keywords || [];
    const degreeSlug = degree ? slugify(degree) : '';
    const institutionSlug = item.institution_logo
      ? path.basename(item.institution_logo, path.extname(item.institution_logo))
      : '';
    return {
      id: item.id,
      title,
      student: item.student || '',
      student_lower: (item.student || '').toLowerCase(),
      year: item.year,
      degree,
      degree_slug: degreeSlug,
      has_degree: !isEmpty(degree),
      institution_slug: institutionSlug,
      abstract,
      has_abstract: !isEmpty(abstract),
      keywords: keywords.map((k) => ({ keyword: k, keyword_slug: slugify(k) })),
      has_keywords: keywords.length > 0,
      keywords_data: keywords.map((k) => slugify(k)).join(' '),
      documentation: item.documentation || '',
      repo: item.repo || '',
      has_documentation: !isEmpty(item.documentation),
      has_repo: !isEmpty(item.repo),
      has_links: !isEmpty(item.documentation) || !isEmpty(item.repo),
      has_institution_logo: !isEmpty(item.institution_logo),
      institution_logo: item.institution_logo || '',
      has_cosupervisor: !isEmpty(coKey),
      cosupervisor: coKey ? buildAuthor(coauthors, coKey) : null,
    };
  });

  const filterYears = [...new Set(sorted.map((t) => t.year).filter(Boolean))]
    .sort((a, b) => b - a)
    .map((y) => ({ label: String(y), value: String(y) }));

  const degreeMap = new Map();
  viewModels.forEach((vm) => { if (vm.degree_slug) degreeMap.set(vm.degree_slug, vm.degree); });
  const filterDegrees = [...degreeMap.entries()].map(([value, label]) => ({ value, label }));

  const kwMap = new Map();
  sorted.forEach((t) => (t.keywords || []).forEach((k) => kwMap.set(slugify(k), k)));
  const filterKeywords = [...kwMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const institutionMap = new Map();
  viewModels.forEach((vm) => {
    if (vm.institution_slug && !institutionMap.has(vm.institution_slug)) {
      institutionMap.set(vm.institution_slug, `/${vm.institution_logo}`);
    }
  });
  const filterInstitutions = [...institutionMap.entries()].map(([value, logo_path]) => ({
    value,
    logo_path,
    name: value.replace(/^org-/, '').toUpperCase(),
  }));

  return { items: viewModels, filterYears, filterDegrees, filterKeywords, filterInstitutions };
}
