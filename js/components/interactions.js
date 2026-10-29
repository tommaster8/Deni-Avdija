// רכיבים אינטראקטיביים כלליים: טאבים, כרטיס מתהפך, מספרים רצים, טיקר ואפקט לחיצה (ripple).
GN.ui = (() => {
  const { $ } = GN;

  // טאבים כלליים: <div data-tabs="name"> עם כפתורי [data-tab] ופאנלים [data-panel] באותו סדר
  function initTabs() {
    GN.$$('[data-tabs]').forEach((group) => {
      const name = group.dataset.tabs;
      const tabs = GN.$$('[data-tab]', group);
      const panels = GN.$$(`[data-panels="${name}"] > [data-panel]`);
      const select = (i) => {
        tabs.forEach((t, j) => {
          t.classList.toggle('active', i === j);
          t.setAttribute('aria-selected', i === j);
          t.tabIndex = i === j ? 0 : -1;
        });
        panels.forEach((p, j) => p.classList.toggle('active', i === j));
      };
      tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
      group.addEventListener('keydown', (e) => {
        const cur = tabs.findIndex((t) => t.classList.contains('active'));
        const next = { ArrowLeft: cur + 1, ArrowRight: cur - 1 }[e.key]; // RTL
        if (next === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        const i = (next + tabs.length) % tabs.length;
        select(i);
        tabs[i].focus();
      });
      select(0);
    });
  }

  function initFlipCards() {
    GN.$$('.flip-card').forEach((card) => card.addEventListener('click', (e) => {
      // גרירה לסיבוב הדמות התלת־ממדית אינה לחיצה, ולכן אינה הופכת את הכרטיס
      if (e.target.closest('.card-3d') && GN.player3d?.wasDragged()) return;
      card.classList.toggle('flipped');
    }, true));
  }

  // מספרים רצים: data-count="24.2" (מספר הספרות אחרי הנקודה נקבע מהערך)
  function countUp(el) {
    const target = Number(el.dataset.count);
    GN.tween(el, 0, target, { decimals: GN.decimalsOf(el.dataset.count), duration: 1100 });
  }

  function initTicker() {
    const track = $('ticker-track');
    [...TICKER_ITEMS, ...TICKER_ITEMS].forEach((text) => {
      const s = document.createElement('span');
      s.textContent = text;
      track.appendChild(s);
    });
  }

  // אפקט לחיצה: גל קטן מנקודת הלחיצה. רק transform ו־opacity, כדי לא לפגוע בביצועים.
  function initRipple() {
    document.addEventListener('pointerdown', (e) => {
      const host = e.target.closest('.btn, .chart-toggle button, .quiz-options button, .ctl-stop, .seg button, .nav-btn, .cmp-swap');
      if (!host || host.disabled || GN.reduceMotion) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      host.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  }

  function init() {
    initTabs();
    initFlipCards();
    initTicker();
    initRipple();
    GN.onSlideEnter((slide) => GN.$$('[data-count]', slide).forEach(countUp));
  }

  return { init };
})();
