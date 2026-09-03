// YAML data loaders — all site content lives under data/ as plain YAML.
// Loaders are cached: Astro builds every page from the same Node process.
import fs from 'node:fs';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';

const DATA_DIR = path.resolve(process.cwd(), 'data');

// Strip the UTF-8 BOM (U+FEFF) that Windows editors may prepend — js-yaml 5 rejects it.
function stripBom(text) {
  return text.codePointAt(0) === 0xfeff ? text.slice(1) : text;
}

export function readYaml(filePath) {
  return parseYaml(stripBom(fs.readFileSync(filePath, 'utf8')));
}

function readDir(dir) {
  return fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
}

function cached(fn) {
  let value;
  return () => (value ??= fn());
}

export const loadProfile = cached(() => readYaml(path.join(DATA_DIR, 'profile.yaml')));
export const loadEducation = cached(() => readYaml(path.join(DATA_DIR, 'education.yaml')));
export const loadExperience = cached(() => readYaml(path.join(DATA_DIR, 'experience.yaml')));
export const loadAwards = cached(() => readYaml(path.join(DATA_DIR, 'awards.yaml')));
export const loadLanguages = cached(() => readYaml(path.join(DATA_DIR, 'languages.yaml')));
export const loadGithub = cached(() => readYaml(path.join(DATA_DIR, 'github.yaml')));

export const loadCoauthors = cached(() => {
  const coauthors = {};
  for (const file of readDir(path.join(DATA_DIR, 'coauthors'))) {
    coauthors[path.basename(file, '.yaml')] = readYaml(path.join(DATA_DIR, 'coauthors', file));
  }
  return coauthors;
});

function loadIdList(dir) {
  return readDir(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((file) => ({ id: path.basename(file, '.yaml'), ...readYaml(path.join(dir, file)) }));
}

export const loadProjects = cached(() => loadIdList(path.join(DATA_DIR, 'projects')));
export const loadTalks = cached(() => loadIdList(path.join(DATA_DIR, 'talks')));

// Publications: one directory per publication holding <ID>.yaml + <ID>.bib.
export const loadPublications = cached(() => {
  const results = [];
  function scanDir(dir) {
    for (const entry of readDir(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (entry.endsWith('.yaml')) {
        results.push({ id: path.basename(entry, '.yaml'), _dir: dir, ...readYaml(fullPath) });
      }
    }
  }
  scanDir(path.join(DATA_DIR, 'publications'));
  return results;
});

export function readPublicationBib(pub) {
  return fs.readFileSync(path.join(pub._dir, `${pub.id}.bib`), 'utf8');
}

function loadTeachingYamls(subdir) {
  const dir = path.join(DATA_DIR, 'teaching', subdir);
  if (!fs.existsSync(dir)) return [];
  return loadIdList(dir);
}

// Teaching record (courses.yaml) — transcribed from the official certificate.
export const loadCourses = cached(() => readYaml(path.join(DATA_DIR, 'teaching', 'courses.yaml')));
export const loadTFGs = cached(() => loadTeachingYamls('tfgs'));
export const loadTFMs = cached(() => loadTeachingYamls('tfms'));
