// Build-time Gravatar lookup. The email is SHA-256-hashed after trimming and
// lowercasing — only the hash is ever published, never the address itself.
// Results are promise-cached per email so each address is checked exactly
// once per build, even though thesis view models are built for 3 languages
// × 2 lists. Any failure (offline CI, timeout, non-200) resolves to '' so
// the caller falls back to the initials avatar — the build never breaks.
import { createHash } from 'node:crypto';

const cache = new Map(); // normalized email -> Promise<'' | url>

export function gravatarUrl(email, size = 64) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return Promise.resolve('');
  if (!cache.has(key)) cache.set(key, lookup(key, size));
  return cache.get(key);
}

async function lookup(email, size) {
  const hash = createHash('sha256').update(email).digest('hex');
  // d=404 makes Gravatar answer 404 for unknown emails instead of a default
  // image, which is what lets us distinguish "has a Gravatar" from "hasn't".
  const url = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    return res.ok ? url : '';
  } catch {
    return '';
  }
}
