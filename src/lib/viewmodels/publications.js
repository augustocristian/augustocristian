// Publication view models: cards, detail overlays and homepage globe pins.
import { localize } from '../i18n.js';
import { escapeHtml, isEmpty, truncate } from '../richtext.js';
import { parseBibtex, bibField } from '../bibtex.js';
import { loadIcon } from '../icons.js';
import { readPublicationBib } from '../data.js';
import { buildAuthors, dateFmtFor } from './shared.js';

const PUB_LINK_TYPES = {
  pdf:     { label: 'PDF',     icon: 'pdf' },
  slides:  { label: 'Slides',  icon: 'slides' },
  arxiv:   { label: 'arXiv',   icon: 'external-link' },
  dataset: { label: 'Dataset', icon: 'dataset' },
  code:    { label: 'Code',    icon: 'code' },
  poster:  { label: 'Poster',  icon: 'poster' },
};

function makeLink(type, url) {
  const { label, icon } = PUB_LINK_TYPES[type];
  return { url, label, icon_svg: loadIcon(icon) };
}

function buildPubLinks(pub, doi, bibLabel) {
  const links = [];
  const yamlLinks = pub.links || {};
  if (yamlLinks.pdf)     links.push(makeLink('pdf',     yamlLinks.pdf));
  if (doi)               links.push({ url: `https://doi.org/${doi}`, label: 'DOI', icon_svg: loadIcon('external-link') });
  if (yamlLinks.arxiv)   links.push(makeLink('arxiv',   yamlLinks.arxiv));
  if (yamlLinks.slides)  links.push(makeLink('slides',  yamlLinks.slides));
  if (yamlLinks.dataset) links.push(makeLink('dataset', yamlLinks.dataset));
  if (yamlLinks.code)    links.push(makeLink('code',    yamlLinks.code));
  if (yamlLinks.poster)  links.push(makeLink('poster',  yamlLinks.poster));
  links.push({ url: `/cite/${pub.id}.bib`, label: bibLabel, icon_svg: loadIcon('download') });
  return links;
}

function projectsHtml(projectIds, projectsById, prefix, t) {
  if (!projectIds || projectIds.length === 0) return '';
  const links = projectIds.map((id) => {
    const project = projectsById[id];
    const title = project ? project.title : id;
    return `<a href="${prefix}projects/#${id}">${escapeHtml(title)}</a>`;
  });
  const label = links.length === 1 ? t.pub_related_project : t.pub_related_projects;
  return `${label}: ${links.join(', ')}`;
}

export function buildPublicationViewModels(rawPubs, coauthors, projectsById, lang, prefix, t) {
  const dateFmt = dateFmtFor(t);

  // First pass — base view models
  const base = rawPubs.map((pub) => {
    const bib = parseBibtex(readPublicationBib(pub));
    const bibTitle = bibField(bib, 'title');
    const bibVenue = bibField(bib, 'journal') ?? bibField(bib, 'booktitle');
    const abstract = localize(pub, 'abstract', lang);
    const abstractNorm = abstract ? abstract.trim().replace(/\s+/g, ' ') : '';

    // Sequential identifier embedded in venue_short, e.g. "(C1)" or "(J3)"
    const idMatch = (pub.venue_short || '').match(/\s*\(([CJ]\d+)\)\s*$/);
    const identifier = idMatch ? idMatch[1] : '';
    const venueShortDisplay = (pub.venue_short || '')
      .replace(/\s*\([CJ]\d+\)\s*$/, '')
      .replace(/\s*,\s*Q[1-4]\s*$/, '')
      .trim();

    const quartile = pub.quartile || '';
    const core = pub.core || '';

    return {
      id: pub.id,
      type: pub.type,
      year: String(new Date(pub.date).getUTCFullYear()),
      quartile,
      data_authors: (pub.authors || []).filter((a) => coauthors[a]).join(' '),
      title: pub.title || bibTitle,
      venue: isEmpty(pub.location) ? bibVenue : `${bibVenue}, ${pub.location}`,
      venue_short: venueShortDisplay,
      date: pub.date,
      date_formatted: dateFmt.monthYear(pub.date),
      authors: buildAuthors(coauthors, pub.authors),
      abstract: abstractNorm,
      excerpt: truncate(abstractNorm, 180),
      has_tags: (pub.tags || []).length > 0,
      tags: pub.tags || [],
      projects_html: projectsHtml(pub.projects, projectsById, prefix, t),
      links: buildPubLinks(pub, bib.doi, t.pub_bibtex),
      featured: !!pub.featured,
      pub_page_url: `${prefix}publications/#${pub.id}`,
      lat: pub.lat || null,
      lng: pub.lng || null,
      location_city: pub.location || '',
      core,
      has_core: !isEmpty(core),
      has_quartile: !isEmpty(quartile),
      identifier,
      has_identifier: !isEmpty(identifier),
      arxiv_url: (pub.links || {}).arxiv || '',
      has_arxiv: !isEmpty((pub.links || {}).arxiv || ''),
      _tags: pub.tags || [],
      _projects: pub.projects || [],
    };
  });

  // Second pass — related publications (tag overlap) and project detail cards
  return base.map((vm) => {
    const tagSet = new Set(vm._tags);
    const relatedPubs = tagSet.size > 0
      ? base
          .filter((p) => p.id !== vm.id)
          .map((p) => ({ p, score: p._tags.filter((tag) => tagSet.has(tag)).length }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score || String(b.p.date).localeCompare(String(a.p.date)))
          .slice(0, 3)
          .map(({ p }) => ({
            title: p.title,
            venue_short: p.venue_short,
            year: p.year,
            pub_page_url: p.pub_page_url,
          }))
      : [];

    const pubProjects = vm._projects
      .map((id) => {
        const proj = projectsById[id];
        if (!proj) return null;
        return {
          id,
          title: proj.title || id,
          full_title: proj.full_title || '',
          has_full_title: !isEmpty(proj.full_title || ''),
          image: proj.image ? `/${proj.image}` : '',
          has_image: !!proj.image,
          url: `${prefix}projects/#${id}`,
        };
      })
      .filter(Boolean);

    const { _tags, _projects, ...clean } = vm;
    return {
      ...clean,
      related_pubs: relatedPubs,
      has_related_pubs: relatedPubs.length > 0,
      pub_projects: pubProjects,
      has_pub_projects: pubProjects.length > 0,
    };
  });
}

export function buildMapLocations(publications, prefix) {
  const byKey = {};
  for (const pub of publications) {
    if (!pub.lat || !pub.lng) continue;
    const key = `${pub.lat},${pub.lng}`;
    if (!byKey[key]) {
      byKey[key] = { lat: pub.lat, lng: pub.lng, date: pub.date, items: [] };
    } else if (pub.date < byKey[key].date) {
      // Keep earliest date for progressive-reveal ordering
      byKey[key].date = pub.date;
    }
    const label = (pub.venue_short || '').replace(/\s*\([^)]*\)/g, '').trim();
    const city = (pub.location_city || '').split(',')[0].trim();
    byKey[key].items.push({
      label,
      year: pub.year,
      city,
      url: `${prefix}publications/#${pub.id}`,
    });
  }
  return Object.values(byKey);
}
