// View-model builders — pure data-shaping from raw YAML objects to the plain
// objects consumed by .astro components. Authors are structured objects
// rendered by AuthorChip/AuthorList; the only remaining HTML-string fields
// are the richText outputs (summary_html, …) and projects_html, rendered
// with set:html.
//
// Implementation is split by domain under src/lib/viewmodels/; this barrel
// keeps a single stable import path for pages and components.
export { byDateDesc, dateFmtFor, nameInitials, buildAuthor, buildAuthors } from './viewmodels/shared.js';
export { buildPublicationViewModels, buildMapLocations } from './viewmodels/publications.js';
export { buildTalkViewModels } from './viewmodels/talks.js';
export { buildEducationViewModels, buildExperienceViewModels, buildAwardViewModels } from './viewmodels/experience.js';
export { buildProjectViewModels } from './viewmodels/projects.js';
export { buildThesisViewModels } from './viewmodels/theses.js';
export { buildGithubViewModel } from './viewmodels/github.js';
