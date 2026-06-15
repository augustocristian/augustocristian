// Minimal BibTeX parser — extracts fields from the single entry in each
// data/publications/<ID>/<ID>.bib file.
import { isEmpty } from './richtext.js';

const LATEX_ACCENTS = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú',
};

function unescapeLatex(str) {
  return str
    .replace(/\\'\{?([a-zA-Z])\}?/g, (_, c) => LATEX_ACCENTS[c] ?? c)
    .replace(/\\~\{?([nN])\}?/g, (_, c) => (c === 'n' ? 'ñ' : 'Ñ'))
    .replace(/\\"\{?([a-zA-Z])\}?/g, (_, c) => c)
    .replace(/[{}]/g, '');
}

function isFullyWrapped(str) {
  if (str.length < 2 || str[0] !== '{' || str[str.length - 1] !== '}') return false;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    if (depth === 0 && i < str.length - 1) return false;
  }
  return depth === 0;
}

function stripOuterBraces(str) {
  let result = str.trim();
  while (isFullyWrapped(result)) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

export function parseBibtex(content) {
  const text = content.trim();
  const bodyStart = text.indexOf('{');

  let i = bodyStart + 1;
  while (text[i] !== ',') i++;
  i++;

  const fields = {};
  while (i < text.length) {
    while (/[\s,]/.test(text[i])) i++;
    if (text[i] === '}') break;

    const nameMatch = text.slice(i).match(/^[a-zA-Z][\w-]*/);
    const name = nameMatch[0].toLowerCase();
    i += nameMatch[0].length;

    while (/\s/.test(text[i])) i++;
    i++;
    while (/\s/.test(text[i])) i++;

    let value;
    if (text[i] === '{') {
      let depth = 0;
      const start = i;
      do {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
      } while (depth > 0);
      value = text.slice(start, i);
    } else if (text[i] === '"') {
      i++;
      const start = i;
      while (text[i] !== '"') i++;
      value = text.slice(start, i);
      i++;
    } else {
      const tokenMatch = text.slice(i).match(/^[^\s,}]+/);
      value = tokenMatch[0];
      i += tokenMatch[0].length;
    }

    fields[name] = stripOuterBraces(value);
  }

  return fields;
}

export function bibField(fields, name) {
  if (isEmpty(fields[name])) return undefined;
  return unescapeLatex(fields[name]).replace(/\s+/g, ' ').trim();
}
