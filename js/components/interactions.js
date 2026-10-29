// רכיבים אינטראקטיביים בסיסיים: טאבים, כרטיס מתהפך, סליידר השוואה, מספרים רצים, טיקר.
GN.ui = (() => {
  const { $ } = GN;

  // טאבים כלליים: <div data-tabs="name"> עם כפתורי [data-tab] ופאנלים [data-panel] באותו סדר
  function initTabs() {
    GN.$$('[data-tabs]').forEach((group) => {
      const name = group.dataset.tabs;
      const tabs = GN.$$('[data-tab]', group);
      const panels = GN.$$(`[data-panels="${name}"] > [data-panel]`);
      const select = (i) => {
        tabs.forEach((t, j) => { t.classList.toggle('active', i === j); t.setAttribute('aria-selected', i === j); });
        panels.forEach((p, j) => p.classList.toggle('active', i === j));
      };
      tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
      select(0);
    });
  }

  function initFlipCards() {
    GN.$$('.flip-card').forEach((card) => card.addEventListener('click', () => card.classList.toggle('flipped')));
  }

  function initCompare() {
    const range = $('compare-range');
    if (!range) return;
    const box = range.closest('.compare');
    const set = () => box.style.setProperty('--split', `${range.value}%`);
    range.addEventListener('input', set);
    set();
  }

  function countUp(el) {
    const target = Number(el.dataset.count);
    if (GN.reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initTicker() {
    const track = $('ticker-track');
    [...TICKER_ITEMS, ...TICKER_ITEMS].forEach((text) => {
      const s = document.createElement('span');
      s.textContent = text;
      track.appendChild(s);
    });
  }

  function init() {
    initTabs();
    initFlipCards();
    initCompare();
    initTicker();
    GN.onSlideEnter((slide) => GN.$$('[data-count]', slide).forEach(countUp));
  }

  return { init };
})();
