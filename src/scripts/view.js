// view.js — pure DOM mutations; takes values as arguments, never reads state

export function showCard(card)  { card.el.style.display = ''; }
export function hideCard(card)  { card.el.style.display = 'none'; }
export function setCount(el, n) { if (el) el.textContent = n; }

export function setActive(btn, active) {
  btn.classList.toggle('is-active', active);
}

export function clearActive(btns) {
  btns.forEach((b) => b.classList.remove('is-active'));
}

// Set up hidden state for off-screen element, ready to animate in
export function scheduleReveal(el, variant) {
  el.classList.add('reveal');
  if (variant === 'card') el.classList.add('reveal--card');
}

// Trigger the appear transition — applies the stagger delay before showing
export function triggerReveal(el) {
  const delay = el.dataset.revealDelay;
  if (delay) el.style.setProperty('--reveal-delay', delay);
  el.classList.add('is-visible');
}
