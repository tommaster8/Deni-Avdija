// Game Night – לוגיקת המצגת
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let busy = false;

  // ---------- Setup ----------
  slides.forEach((slide) => {
    slide.querySelectorAll('[data-anim]').forEach((el, i) => el.style.setProperty('--i', i));
  });

  const dots = $('nav-dots');
  slides.forEach((slide, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `שקופית ${i + 1}: ${slide.dataset.title}`);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
  });

  const track = $('ticker-track');
  [...TICKER_ITEMS, ...TICKER_ITEMS].forEach((text) => {
    const s = document.createElement('span');
    s.textContent = text;
    track.appendChild(s);
  });

  // ---------- Navigation ----------
  function goTo(index, { replay = false } = {}) {
    index = Math.max(0, Math.min(total - 1, index));
    if (busy || (index === current && !replay)) return;

    const swap = () => {
      slides[current].classList.remove('active');
      slides[current].setAttribute('aria-hidden', 'true');
      current = index;
      const slide = slides[current];
      void slide.offsetWidth; // מאתחל את אנימציות הכניסה
      slide.classList.add('active');
      slide.removeAttribute('aria-hidden');
      slide.scrollTop = 0;
      onEnter(slide);
      updateChrome();
    };

    if (reduceMotion) { swap(); return; }

    busy = true;
    const stinger = $('stinger');
    stinger.classList.toggle('replay', replay);
    stinger.classList.remove('run');
    void stinger.offsetWidth;
    stinger.classList.add('run');
    setTimeout(swap, 330);
    setTimeout(() => { stinger.classList.remove('run', 'replay'); busy = false; }, 800);
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);
  const replay = () => goTo(current, { replay: true });

  function updateChrome() {
    const slide = slides[current];
    $('bug-quarter').textContent = slide.dataset.quarter;
    $('bug-count').textContent = `${String(current + 1).padStart(2, '0')}/${total}`;
    $('progress-bar').style.width = `${((current + 1) / total) * 100}%`;
    [...dots.children].forEach((d, i) => d.classList.toggle('active', i === current));
    document.querySelector('[data-action="prev"].nav-btn').disabled = current === 0;
    document.querySelector('[data-action="next"].nav-btn').disabled = current === total - 1;
    $('announcer').textContent = `שקופית ${current + 1} מתוך ${total}: ${slide.dataset.title}`;
    history.replaceState(null, '', `#${current + 1}`);
    updateClock();
  }

  function onEnter(slide) {
    slide.querySelectorAll('[data-count]').forEach(countUp);
    if (slide.querySelector('#line-chart')) drawLine(activeLine);
    if (slide.querySelector('#bar-chart')) drawBars(activeBar);
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'next') next();
    else if (action === 'prev') prev();
    else if (action === 'restart') goTo(0);
    else if (action === 'night') openNight();
  });

  document.addEventListener('keydown', (e) => {
    if (!$('night').hidden) {
      if (e.key === 'Escape') closeNight();
      return;
    }
    const onRange = e.target.matches('input[type="range"]');
    switch (e.key) {
      case 'ArrowLeft': if (!onRange) { e.preventDefault(); next(); } break; // RTL: שמאלה = קדימה
      case 'ArrowRight': if (!onRange) { e.preventDefault(); prev(); } break;
      case 'PageDown': case ' ':
        if (e.target.closest('button')) return;
        e.preventDefault(); next(); break;
      case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(total - 1); break;
      case 'r': case 'R': case 'ר': replay(); break;
      case 'n': case 'N': case 'מ': openNight(); break;
    }
  });

  // החלקה בנייד – ב־RTL החלקה ימינה מתקדמת
  let touchX = null, touchY = null;
  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('.compare')) { touchX = null; return; }
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx > 0 ? next() : prev();
    touchX = null;
  });

  // ---------- Count-up ----------
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- Slide 2: flip card ----------
  document.querySelector('.flip-card').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('flipped');
  });

  // ---------- Slide 3: timeline ----------
  const tlItems = [...document.querySelectorAll('.tl-item')];
  const tlPanels = [...document.querySelectorAll('.tl-panel')];
  tlItems.forEach((item, i) => {
    item.setAttribute('aria-selected', i === 0);
    item.addEventListener('click', () => {
      tlItems.forEach((t, j) => { t.classList.toggle('active', i === j); t.setAttribute('aria-selected', i === j); });
      tlPanels.forEach((p, j) => p.classList.toggle('active', i === j));
    });
  });

  // ---------- Slide 4: medals (מגע) ----------
  document.querySelectorAll('.medal').forEach((m) => {
    m.addEventListener('click', () => m.classList.toggle('open'));
  });

  // ---------- Slide 7: line chart ----------
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  const washington = SEASONS.filter((s) => s.team === 'WAS');
  let activeLine = 'pts';

  function drawLine(metric) {
    const svg = $('line-chart');
    svg.innerHTML = '';
    const W = 400, H = 260, pad = { t: 30, r: 30, b: 34, l: 30 };
    const max = Math.ceil(Math.max(...washington.map((s) => s[metric])) * 1.25);
    const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (washington.length - 1);
    const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);

    const defs = svgEl('defs', {});
    const grad = svgEl('linearGradient', { id: 'areaGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svgEl('stop', { offset: '0%', 'stop-color': '#e03a3e', 'stop-opacity': .35 }),
                svgEl('stop', { offset: '100%', 'stop-color': '#e03a3e', 'stop-opacity': 0 }));
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
      svg.append(label);
      const dot = svgEl('circle', { class: 'pt', cx: pts[i][0], cy: pts[i][1], r: 6 });
      const val = svgEl('text', { class: 'pt-label', x: pts[i][0], y: pts[i][1] - 14, 'text-anchor': 'middle' });
      val.textContent = s[metric].toFixed(1);
      svg.append(dot, val);
    });

    if (!reduceMotion) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)';
      line.style.strokeDashoffset = 0;
    }
  }

  document.querySelectorAll('[data-line]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLine = btn.dataset.line;
      document.querySelectorAll('[data-line]').forEach((b) => b.classList.toggle('active', b === btn));
      drawLine(activeLine);
    });
  });

  // ---------- Slide 8: compare slider ----------
  const range = $('compare-range');
  const compare = range.closest('.compare');
  const setSplit = () => compare.style.setProperty('--split', `${range.value}%`);
  range.addEventListener('input', setSplit);
  setSplit();

  // ---------- Slide 9: bar chart ----------
  const barChart = $('bar-chart');
  let activeBar = 'pts';
  SEASONS.forEach((s) => {
    const bar = document.createElement('div');
    bar.className = `bar ${s.team.toLowerCase()}`;
    bar.innerHTML = `<div class="bar-fill"><span class="bar-val"></span></div><span class="bar-season">${s.season}</span>`;
    barChart.appendChild(bar);
  });

  function drawBars(metric) {
    const max = Math.max(...SEASONS.map((s) => s[metric])) * 1.12;
    [...barChart.children].forEach((bar, i) => {
      const v = SEASONS[i][metric];
      const fill = bar.querySelector('.bar-fill');
      bar.querySelector('.bar-val').textContent = metric === 'fg' ? `${v}%` : v.toFixed(1);
      fill.style.height = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.transitionDelay = `${i * 70}ms`;
        fill.style.height = `${(v / max) * 100}%`;
      }));
    });
    barChart.setAttribute('aria-label', `${METRICS[metric].label} לפי עונה: ` +
      SEASONS.map((s) => `${s.season} ${s[metric]}`).join(', '));
  }

  document.querySelectorAll('[data-bar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeBar = btn.dataset.bar;
      document.querySelectorAll('[data-bar]').forEach((b) => b.classList.toggle('active', b === btn));
      drawBars(activeBar);
    });
  });

  // ---------- Slide 12: quiz ----------
  let qIndex = 0, score = 0;
  $('quiz-total').textContent = QUIZ.length;

  function renderQuiz() {
    const opts = $('quiz-options');
    opts.innerHTML = '';
    $('quiz-explain').textContent = '';
    $('quiz-next').hidden = true;

    if (qIndex >= QUIZ.length) {
      $('quiz-q').textContent = score === QUIZ.length ? 'FINAL: ניקוד מושלם! 🏆' : `FINAL: ${score} מתוך ${QUIZ.length}`;
      const again = document.createElement('button');
      again.type = 'button';
      again.textContent = '⟲ שחקו שוב';
      again.addEventListener('click', () => { qIndex = 0; score = 0; $('quiz-score').textContent = 0; renderQuiz(); });
      opts.appendChild(again);
      return;
    }

    const item = QUIZ[qIndex];
    $('quiz-q').textContent = `${qIndex + 1}. ${item.q}`;
    item.options.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => {
        [...opts.children].forEach((o, j) => {
          o.disabled = true;
          if (j === item.answer) o.classList.add('correct');
        });
        if (i === item.answer) { score++; $('quiz-score').textContent = score; }
        else b.classList.add('wrong');
        $('quiz-explain').textContent = item.explain;
        $('quiz-next').hidden = false;
        $('quiz-next').textContent = qIndex === QUIZ.length - 1 ? 'לתוצאה ←' : 'הבא ←';
      });
      opts.appendChild(b);
    });
  }
  $('quiz-next').addEventListener('click', () => { qIndex++; renderQuiz(); });
  renderQuiz();

  // ---------- The Israeli clock ----------
  const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
  const fmtUS = fmt('America/Los_Angeles');
  const fmtIL = fmt('Asia/Jerusalem');

  function currentMoment() {
    return CLOCK_MOMENTS[slides[current].dataset.moment] || null;
  }

  function updateClock() {
    const m = currentMoment();
    const clock = $('clock');
    if (m) {
      $('clock-us-label').textContent = m.usCity.replace(/\s*\(.*\)/, '');
      $('clock-us').textContent = m.usTime;
      $('clock-il').textContent = m.ilTime;
      clock.classList.add('moment');
      clock.title = `${m.title}: ${m.ilTime} בישראל (בקירוב) – לחצו למצב "ישראל ערה"`;
    } else {
      const now = new Date();
      $('clock-us-label').textContent = 'פורטלנד';
      $('clock-us').textContent = fmtUS.format(now);
      $('clock-il').textContent = fmtIL.format(now);
      clock.classList.remove('moment');
      clock.title = 'השעה עכשיו בפורטלנד ובישראל';
    }
  }
  setInterval(() => { if (!currentMoment()) updateClock(); }, 15000);
  $('clock').addEventListener('click', openNight);

  // ---------- "ישראל ערה" overlay ----------
  const city = $('night-city');
  const windows = [];
  (function buildCity() {
    let xPos = 0;
    let seed = 8;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; // תוצאה זהה בכל טעינה
    while (xPos < 1200) {
      const w = 60 + rand() * 70;
      const h = 90 + rand() * 190;
      const top = 300 - h;
      city.append(svgEl('rect', { class: 'bld', x: xPos, y: top, width: w - 4, height: h }));
      for (let wy = top + 14; wy < 290; wy += 22) {
        for (let wx = xPos + 10; wx < xPos + w - 18; wx += 16) {
          const win = svgEl('rect', { class: 'win', x: wx, y: wy, width: 8, height: 11, rx: 1 });
          city.append(win);
          windows.push(win);
        }
      }
      xPos += w;
    }
  })();

  let nightTimers = [];
  function lightCity() {
    nightTimers.forEach(clearTimeout);
    nightTimers = [];
    windows.forEach((w) => w.classList.remove('on', 'screen'));
    const order = windows.map((w) => [w, Math.random()]).sort((a, b) => a[1] - b[1]).map(([w]) => w);
    const lit = order.slice(0, Math.floor(order.length * 0.55));
    lit.forEach((w, i) => {
      const cls = Math.random() < 0.35 ? 'screen' : 'on';
      if (reduceMotion) { w.classList.add(cls); return; }
      nightTimers.push(setTimeout(() => w.classList.add(cls), 400 + i * (3200 / lit.length) + Math.random() * 300));
    });
  }

  let lastFocus = null;
  function openNight() {
    const m = currentMoment();
    const now = new Date();
    $('night-date').textContent = m ? `${m.date} · ISRAEL IS AWAKE` : 'עכשיו · ISRAEL TIME';
    $('night-title').textContent = m ? m.title : 'מה השעה עכשיו בישראל?';
    $('night-us-city').textContent = m ? m.usCity : 'פורטלנד (PT)';
    $('night-us').textContent = m ? m.usTime : fmtUS.format(now);
    $('night-il').textContent = m ? m.ilTime : fmtIL.format(now);
    $('night-line').textContent = m ? m.line
      : 'משחקי הבית של פורטלנד מתחילים בדרך כלל ב־19:00 שעון החוף המערבי – בסביבות חמש לפנות בוקר בישראל.';
    lastFocus = document.activeElement;
    $('night').hidden = false;
    $('night-close').focus();
    lightCity();
  }

  function closeNight() {
    $('night').hidden = true;
    nightTimers.forEach(clearTimeout);
    if (lastFocus) lastFocus.focus();
  }
  $('night-close').addEventListener('click', closeNight);

  // ---------- Start ----------
  const slideFromHash = () => {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isInteger(n) && n >= 1 && n <= total ? n - 1 : 0;
  };
  window.addEventListener('hashchange', () => goTo(slideFromHash()));
  current = slideFromHash();
  slides.forEach((s, i) => { if (i !== current) s.setAttribute('aria-hidden', 'true'); });
  slides[current].classList.add('active');
  onEnter(slides[current]);
  updateChrome();
})();
