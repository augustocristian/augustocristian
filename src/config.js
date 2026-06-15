// Site-wide feature flags and external-service configuration.

// Shows a banner on the teaching index while materials are being prepared.
export const TEACHING_UNDER_CONSTRUCTION = true;

// External repository hosting the teaching PDFs (one folder per subject id,
// e.g. teaching-materials/web-technologies/*.pdf). Set `enabled: true` once
// the repository exists — the subject pages will then list its PDFs live via
// the GitHub Contents API, with no site rebuild needed.
export const TEACHING_REPO = {
  owner: 'augustocristian',
  repo: 'teaching-materials',
  branch: 'main',
  enabled: false,
};
