// model.js — reads DOM state; returns plain data objects without mutating the DOM

// Filterable items of a FilterBar target list: every [data-filter-item]
// under `targetSelector`, with its dataset exposed for facet matching.
export function filterItems(targetSelector) {
  return Array.from(document.querySelectorAll(`${targetSelector} [data-filter-item]`))
    .map((el) => ({ el, data: el.dataset }));
}

export function revealTargets() {
  // Only reveal tag-rows that are NOT inside a card — those come with
  // the card as a unit and must not animate independently.
  const standaloneTagRows = [...document.querySelectorAll('.section:not(.hero) .tag-row')]
    .filter((el) => !el.closest('.card-link, .pub-card'));

  // Filtered lists (publications, TFG/TFM) toggle their items' display, so the
  // items themselves must never carry reveal classes — reveal each list's
  // container once instead.
  const filterContainers = [...new Set(
    [...document.querySelectorAll('[data-filter-item]')].map((el) => el.parentElement),
  )];

  return [
    ...[...document.querySelectorAll('.section-head')]
      .filter((el) => !el.closest('.hero'))
      .map((el) => ({ el, variant: 'default' })),
    ...standaloneTagRows.map((el) => ({ el, variant: 'default' })),
    ...filterContainers.map((el) => ({ el, variant: 'default' })),
    ...[...document.querySelectorAll('.card-link, .talk-card, .timeline-item, .proj-item, .award-card')]
      .map((el) => ({ el, variant: 'card' })),
  ];
}
