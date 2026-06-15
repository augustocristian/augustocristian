// Funded-project view models (projects timeline page).
import { localize } from '../i18n.js';
import { isEmpty } from '../richtext.js';
import { dateFmtFor } from './shared.js';

export function buildProjectViewModels(projects, lang, t) {
  const dateFmt = dateFmtFor(t);
  return [...projects]
    .sort((a, b) => (a.date_start < b.date_start ? -1 : a.date_start > b.date_start ? 1 : 0))
    .map((project) => ({
      ...project,
      title:        localize(project, 'title', lang)        || project.title,
      full_title:   localize(project, 'full_title', lang)   || project.full_title,
      funding_body: localize(project, 'funding_body', lang) || project.funding_body,
      partners:     localize(project, 'partners', lang)     || project.partners,
      researchers:  localize(project, 'researchers', lang)  || project.researchers,
      role:         localize(project, 'role', lang)         || project.role,
      status_label: project.status === 'open' ? t.project_ongoing : t.project_completed,
      date_range: dateFmt.dateRange(project.date_start, project.date_end),
      has_amount: !isEmpty(project.amount),
      has_role: !isEmpty(localize(project, 'role', lang) || project.role),
      year_start: String(new Date(project.date_start).getUTCFullYear()),
    }));
}
