// Experience-page view models: education, work history and awards.
import { localize } from '../i18n.js';
import { isEmpty, richText } from '../richtext.js';
import { dateFmtFor, buildAuthor, byDateDesc } from './shared.js';

export function buildEducationViewModels(education, lang, t) {
  const dateFmt = dateFmtFor(t);
  return education.map((edu) => {
    const summary = localize(edu, 'summary', lang) || '';
    const buttonText = edu.button
      ? (localize(edu, 'button_text', lang) || edu.button.text)
      : '';
    return {
      ...edu,
      area: localize(edu, 'area', lang) || edu.area,
      institution: localize(edu, 'institution', lang) || edu.institution,
      institution_logo: edu.institution_logo || '',
      has_institution_logo: !isEmpty(edu.institution_logo),
      date_range: dateFmt.dateRange(edu.date_start, edu.date_end),
      has_summary: !isEmpty(summary),
      summary_html: richText(summary),
      has_button: !!edu.button,
      button: edu.button ? { text: buttonText, url: edu.button.url } : null,
    };
  });
}

export function buildExperienceViewModels(experience, lang, t, coauthors) {
  const dateFmt = dateFmtFor(t);
  return [...experience]
    .sort(byDateDesc('date_start'))
    .map((exp) => {
      const collabKey = exp.collaborator || '';
      const orgLogos = exp.company_logos
        ? exp.company_logos.map((p) => ({ path: p }))
        : exp.company_logo ? [{ path: exp.company_logo }] : [];

      const degrees = (exp.degrees || []).map((d) => ({
        name: localize(d, 'name', lang) || d.name || '',
        logo: d.logo || '',
        has_logo: !isEmpty(d.logo),
      }));

      const subjects = (exp.subjects || []).map((s) => ({
        name: localize(s, 'name', lang) || s.name || '',
        logo: s.logo || '',
        has_logo: !isEmpty(s.logo),
      }));

      return {
        ...exp,
        position: localize(exp, 'position', lang) || exp.position,
        company_name: localize(exp, 'company_name', lang) || exp.company_name,
        location: localize(exp, 'location', lang) || exp.location,
        date_range: dateFmt.dateRange(exp.date_start, exp.date_end),
        org_logos: orgLogos,
        has_org_logos: orgLogos.length > 0,
        degrees,
        has_degrees: degrees.length > 0,
        subjects,
        has_subjects: subjects.length > 0,
        summary_html: richText(localize(exp, 'summary', lang) || ''),
        has_collaborator: !isEmpty(collabKey),
        collaborator: collabKey ? buildAuthor(coauthors, collabKey) : null,
      };
    });
}

export function buildAwardViewModels(awards, lang, t) {
  const dateFmt = dateFmtFor(t);
  return awards.map((award) => {
    const summary = localize(award, 'summary', lang) || award.summary || '';
    return {
      ...award,
      title: localize(award, 'title', lang) || award.title,
      summary,
      date_formatted: dateFmt.monthYear(award.date),
      has_icon: !isEmpty(award.icon),
      has_url: !isEmpty(award.url),
      has_summary: !isEmpty(summary),
    };
  });
}
