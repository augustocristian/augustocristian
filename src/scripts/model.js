// model.js — reads DOM state; returns plain data objects without mutating the DOM

// Filterable items of a FilterBar target list: every [data-filter-item]
// under `targetSelector`, with its dataset exposed for facet matching.
export function filterItems(targetSelector) {
  return Array.from(document.querySelectorAll(`${targetSelector} [data-filter-item]`))
    .map((el) => ({ el, data: el.dataset }));
}

export function revealTargets() {
  // Only reveal tag-rows that are NOT inside a card-link — those come with
  // the card as a unit and must not animate independently.
  const standaloneTagRows = [...document.querySelectorAll('.section:not(.hero) .tag-row')]
    .filter((el) => !el.closest('.card-link'));

  return [
    ...[...document.querySelectorAll('.section:not(.hero) .section-head')]
      .map((el) => ({ el, variant: 'default' })),
    ...standaloneTagRows.map((el) => ({ el, variant: 'default' })),
    ...[...document.querySelectorAll('.card-link')]
      .map((el) => ({ el, variant: 'card' })),
    ...[...document.querySelectorAll('.talk-card')]
      .map((el) => ({ el, variant: 'card' })),
  ];
}
