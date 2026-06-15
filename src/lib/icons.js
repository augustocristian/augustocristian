// Inline SVG icons, read from public/img/icons at build time.
import fs from 'node:fs';
import path from 'node:path';

const ICONS_DIR = path.resolve(process.cwd(), 'public', 'img', 'icons');
const cache = new Map();

export function loadIcon(name) {
  if (!cache.has(name)) {
    cache.set(name, fs.readFileSync(path.join(ICONS_DIR, `${name}.svg`), 'utf8').trim());
  }
  return cache.get(name);
}
