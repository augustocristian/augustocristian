// Talk / event view models (talks page and homepage section).
import { localize } from '../i18n.js';
import { loadIcon } from '../icons.js';
import { byDateDesc, dateFmtFor } from './shared.js';

export function buildTalkViewModels(rawTalks, lang, t) {
  const dateFmt = dateFmtFor(t);
  return rawTalks
    .map((talk) => {
      const title = localize(talk, 'title', lang) || talk.title;
      const abstract = localize(talk, 'abstract', lang);
      return {
        id: talk.id,
        title,
        event_url: talk.event_url || '',
        has_event_url: !!talk.event_url,
        location: localize(talk, 'location', lang) || talk.location,
        summary: localize(talk, 'summary', lang) || talk.summary,
        abstract: abstract ? abstract.trim().replace(/\s+/g, ' ') : '',
        date_range: dateFmt.talkRange(talk.date_start, talk.date_end),
        date_start: talk.date_start,
        image: talk.image,
        has_links: (talk.links || []).length > 0,
        links: (talk.links || []).map((link) => ({ ...link, icon_svg: loadIcon('external-link') })),
      };
    })
    .sort(byDateDesc('date_start'));
}
