// גרפים: גרף קווי (וושינגטון) וגרף עמודות (כל העונות). נבנים ב־SVG וב־DOM, בלי ספרייה.
GN.charts = (() => {
  const { $, svgEl } = GN;
  const formatValue = (metric, v) => (METRICS[metric].pct ? `${v}%` : v.toFixed(1));

  // ---------- גרף קווי ----------
  const washington = SEASONS.filter((s) => s.team === 'WAS');
  let lineMetric = 'pts';

  function drawLine(metric = lineMetric) {
    const svg = $('line-chart');
    if (!svg) return;
    svg.innerHTML = '';
    const W = 400, H = 260, pad = { t: 30, r: 30, b: 34, l: 30 };
    const max = Math.ceil(Math.max(...washington.map((s) => s[metric])) * 1.25);
    const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (washington.length - 1);
    const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);

    const grad = svgEl('linearGradient', { id: 'areaGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svgEl('stop', { offset: '0%', 'stop-color': '#e03a3e', 'stop-opacity': .35 }),
                svgEl('stop', { offset: '100%', 'stop-color': '#e03a3e', 'stop-opacity': 0 }));
    const defs = svgEl('defs');
    defs.append(grad);
    svg.append(defs);

    for (let g = 0; g <= 4; g++) {
      const gy = pad.t + (g * (H - pad.t - pad.b)) / 4;
      svg.append(svgEl('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: gy, y2: gy }));
    }

    const pts = washington.map((s, i) => [x(i), y(s[metric])]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
    svg.append(svgEl('path', { class: 'area', d: `${d} L${x(washington.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z` }));
    const line = svgEl('path', { class: 'line', d });
    svg.append(line);

    washington.forEach((s, i) => {
      const label = svgEl('text', { class: 'axis-label', x: x(i), y: H - 10, 'text-anchor': 'middle' });
      label.textContent = s.season;
      const dot = svgEl('circle', { class: 'pt', cx: pts[i][0], cy: pts[i][1], r: 6 });
      const val = svgEl('text', { class: 'pt-label', x: pts[i][0], y: pts[i][1] - 14, 'text-anchor': 'middle' });
      val.textContent = formatValue(metric, s[metric]);
      svg.append(label, dot, val);
    });

    svg.setAttribute('aria-label', `${METRICS[metric].label} בוושינגטון: ` +
      washington.map((s) => `${s.season} ${s[metric]}`).join(', '));

    if (!GN.reduceMotion) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)';
      line.style.strokeDashoffset = 0;
    }
  }

  // ---------- גרף עמודות דינמי ----------
  // החלפת מדד לא מאפסת את הגרף: העמודות והמספרים עוברים מהערך הקודם לערך החדש.
  let barMetric = 'pts';
  let shownMetric = null; // המדד שמוצג כרגע (null = הגרף עדיין לא צויר בכניסה הזו)

  function buildBars() {
    const chart = $('bar-chart');
    SEASONS.forEach((s, i) => {
      const bar = document.createElement('div');
      bar.className = `bar ${s.team.toLowerCase()}`;
      bar.tabIndex = 0;
      bar.dataset.i = i;
      bar.innerHTML = `<div class="bar-col"><div class="bar-fill"><span class="bar-val">0</span></div></div><span class="bar-season">${s.season}</span>`;
      chart.appendChild(bar);
    });

    // טולטיפ בריחוף או בפוקוס: עונה, קבוצה, מספר משחקים וערך
    const tip = $('bar-tip');
    const show = (bar) => {
      const s = SEASONS[bar.dataset.i];
      const m = METRICS[barMetric];
      tip.innerHTML = `<b>${s.season} · ${s.team}</b>${m.label}: <strong>${formatValue(barMetric, s[barMetric])}</strong><small>${s.games} משחקים · עונה סדירה</small>`;
      const box = tip.parentElement.getBoundingClientRect();
      const r = bar.querySelector('.bar-fill').getBoundingClientRect();
      tip.style.left = `${r.left - box.left + r.width / 2}px`;
      tip.style.top = `${r.top - box.top}px`;
      tip.hidden = false;
      GN.$$('.bar', chart).forEach((b) => b.classList.toggle('dim', b !== bar));
    };
    const hide = () => { tip.hidden = true; GN.$$('.bar', chart).forEach((b) => b.classList.remove('dim')); };
    GN.$$('.bar', chart).forEach((bar) => {
      bar.addEventListener('mouseenter', () => show(bar));
      bar.addEventListener('focus', () => show(bar));
      bar.addEventListener('click', () => show(bar));
    });
    chart.addEventListener('mouseleave', hide);
    chart.addEventListener('focusout', (e) => { if (!chart.contains(e.relatedTarget)) hide(); });
  }

  function niceStep(x) {
    const p = 10 ** Math.floor(Math.log10(x));
    const n = x / p;
    return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => n <= c) * p;
  }

  function drawAxis(max, metric) {
    const axis = $('bar-axis');
    axis.innerHTML = '';
    for (let k = 1; k <= 4; k++) {
      const v = (max / 4) * k;
      const line = document.createElement('span');
      line.style.bottom = `${(k / 4) * 100}%`;
      line.innerHTML = `<em>${+v.toFixed(1)}${METRICS[metric].pct ? '%' : ''}</em>`;
      axis.appendChild(line);
    }
  }

  function drawBars(metric = barMetric) {
    const chart = $('bar-chart');
    // סקאלה "עגולה": 4 קווי רשת בצעד מתוך סדרת ערכים נוחים (כפול חזקת 10)
    const step = niceStep((Math.max(...SEASONS.map((s) => s[metric])) * 1.08) / 4);
    const max = step * 4;
    const fresh = shownMetric === null;
    const prev = shownMetric;
    drawAxis(max, metric);
    $('bar-tip').hidden = true;

    GN.$$('.bar', chart).forEach((bar, i) => {
      const v = SEASONS[i][metric];
      const fill = bar.querySelector('.bar-fill');
      const val = bar.querySelector('.bar-val');
      const from = fresh ? 0 : SEASONS[i][prev];
      const delay = fresh ? i * 70 : i * 30;
      if (fresh) { fill.style.transition = 'none'; fill.style.height = '0%'; void fill.offsetHeight; fill.style.transition = ''; }
      fill.style.transitionDelay = `${delay}ms`;
      fill.style.height = `${(v / max) * 100}%`;
      setTimeout(() => GN.tween(val, from, v, { decimals: 1, suffix: METRICS[metric].pct ? '%' : '' }), delay);
      bar.setAttribute('aria-label', `${SEASONS[i].season}: ${formatValue(metric, v)} ${METRICS[metric].label}`);
    });
    $('bar-metric-label').textContent = METRICS[metric].label;
    shownMetric = metric;
    chart.setAttribute('aria-label', `${METRICS[metric].label} לפי עונה: ` +
      SEASONS.map((s) => `${s.season} ${s[metric]}`).join(', '));
  }

  // ---------- כפתורי מדד ----------
  function bindToggle(attr, onChange) {
    GN.$$(`[${attr}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        GN.$$(`[${attr}]`).forEach((b) => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', b === btn);
        });
        onChange(btn.getAttribute(attr));
      });
    });
  }

  function init() {
    buildBars();
    bindToggle('data-line', (m) => { lineMetric = m; drawLine(); });
    bindToggle('data-bar', (m) => { barMetric = m; drawBars(); });
    GN.onSlideEnter((slide) => {
      if (slide.querySelector('#line-chart')) drawLine();
      if (slide.querySelector('#bar-chart')) { shownMetric = null; drawBars(); }
    });
  }

  return { init, drawBars, metric: () => barMetric };
})();
