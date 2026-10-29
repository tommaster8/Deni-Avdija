// השוואת שתי עונות: בחירה חופשית, פסים מראה (עונה א׳ מימין, עונה ב׳ משמאל) והפרש לכל מדד.
// כל מדד מנורמל לפי הערך הגבוה בקריירה, כך שאורך הפס בר־השוואה בין עונות.
GN.compare = (() => {
  const { $ } = GN;
  const ROWS = ['pts', 'reb', 'ast', 'fg', 'tp'];
  const maxOf = Object.fromEntries(ROWS.map((m) => [m, Math.max(...SEASONS.map((s) => s[m])) * 1.08]));
  let shown = null; // הערכים שמוצגים כרגע, להנפשה מהם

  const bySeason = (v) => SEASONS.find((s) => s.season === v);

  function buildRows() {
    $('cmp-rows').innerHTML = ROWS.map((m) => `
      <div class="cmp-r" data-m="${m}">
        <span class="cmp-v a" data-side="a">0</span>
        <div class="cmp-bar a"><i></i></div>
        <div class="cmp-lbl"><b>${METRICS[m].en}</b><small>${METRICS[m].label}</small><em class="cmp-delta"></em></div>
        <div class="cmp-bar b"><i></i></div>
        <span class="cmp-v b" data-side="b">0</span>
      </div>`).join('');
  }

  function fillSelects() {
    ['cmp-a', 'cmp-b'].forEach((id) => {
      $(id).innerHTML = SEASONS.map((s) => `<option value="${s.season}">${s.season} · ${s.team}</option>`).join('');
    });
    $('cmp-a').value = '2023-24';
    $('cmp-b').value = '2025-26';
  }

  function chip(side, s) {
    $(`cmp-chip-${side}`).innerHTML = `<b>${s.season}</b><span class="team ${s.team.toLowerCase()}">${s.team}</span><small>${s.games} משחקים</small>`;
  }

  function update() {
    const a = bySeason($('cmp-a').value);
    const b = bySeason($('cmp-b').value);
    chip('a', a);
    chip('b', b);

    ROWS.forEach((m) => {
      const row = $('cmp-rows').querySelector(`[data-m="${m}"]`);
      const pct = METRICS[m].pct;
      const opts = { decimals: 1, suffix: pct ? '%' : '' };
      [['a', a], ['b', b]].forEach(([side, s]) => {
        row.querySelector(`.cmp-bar.${side} i`).style.width = `${(s[m] / maxOf[m]) * 100}%`;
        const el = row.querySelector(`.cmp-v.${side}`);
        GN.tween(el, shown ? shown[side][m] : 0, s[m], opts);
      });
      // הפרש מעונה א׳ לעונה ב׳
      const d = Math.round((b[m] - a[m]) * 10) / 10;
      const delta = row.querySelector('.cmp-delta');
      delta.className = `cmp-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'same'}`;
      delta.textContent = d === 0 ? '=' : `${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d).toFixed(1)}${pct ? ' נק׳ אחוז' : ''}`;
      row.querySelector('.cmp-bar.a i').classList.toggle('lead', a[m] > b[m]);
      row.querySelector('.cmp-bar.b i').classList.toggle('lead', b[m] > a[m]);
      row.setAttribute('aria-label', `${METRICS[m].label}: ${a.season} ${a[m]}, ${b.season} ${b[m]}`);
    });
    $('cmp-same').hidden = a.season !== b.season;
    shown = { a, b };
  }

  function init() {
    buildRows();
    fillSelects();
    $('cmp-a').addEventListener('change', update);
    $('cmp-b').addEventListener('change', update);
    $('cmp-swap').addEventListener('click', () => {
      const a = $('cmp-a').value;
      $('cmp-a').value = $('cmp-b').value;
      $('cmp-b').value = a;
      update();
    });
    GN.onSlideEnter((slide) => {
      if (!slide.contains($('cmp-rows'))) return;
      shown = null; // בכל כניסה לשקופית הפסים נבנים מאפס
      GN.$$('.cmp-bar i', slide).forEach((i) => { i.style.transition = 'none'; i.style.width = '0'; void i.offsetWidth; i.style.transition = ''; });
      requestAnimationFrame(update);
    });
  }

  return { init, update };
})();
