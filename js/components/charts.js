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

  // ---------- גרף עמודות ----------
  let barMetric = 'pts';

  function buildBars() {
    const chart = $('bar-chart');
    SEASONS.forEach((s) => {
      const bar = document.createElement('div');
      bar.className = `bar ${s.team.toLowerCase()}`;
      bar.innerHTML = `<div class="bar-fill"><span class="bar-val"></span></div><span class="bar-season">${s.season}</span>`;
      chart.appendChild(bar);
    });
  }

  function drawBars(metric = barMetric) {
    const chart = $('bar-chart');
    const max = Math.max(...SEASONS.map((s) => s[metric])) * 1.12;
    [...chart.children].forEach((bar, i) => {
      const v = SEASONS[i][metric];
      const fill = bar.querySelector('.bar-fill');
      bar.querySelector('.bar-val').textContent = formatValue(metric, v);
      fill.style.transitionDelay = '0ms';
      fill.style.height = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.transitionDelay = `${i * 70}ms`;
        fill.style.height = `${(v / max) * 100}%`;
      }));
    });
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
      if (slide.querySelector('#bar-chart')) drawBars();
    });
  }

  return { init };
})();
