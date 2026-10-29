// "השעון הישראלי" ומצב "ישראל ערה"
GN.clock = (() => {
  const { $ } = GN;
  const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
  const fmtUS = fmt('America/Los_Angeles');
  const fmtIL = fmt('Asia/Jerusalem');
  const windows = [];
  let timers = [];
  let lastFocus = null;

  const moment = () => CLOCK_MOMENTS[GN.nav.current()?.dataset.moment] || null;

  function update() {
    const m = moment();
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
      clock.title = 'השעה עכשיו בפורטלנד ובישראל – לחצו למצב "ישראל ערה"';
    }
  }

  function buildCity() {
    const city = $('night-city');
    let x = 0;
    let seed = 8;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; // אותה עיר בכל טעינה
    while (x < 1200) {
      const w = 60 + rand() * 70;
      const h = 90 + rand() * 190;
      const top = 300 - h;
      city.append(GN.svgEl('rect', { class: 'bld', x, y: top, width: w - 4, height: h }));
      for (let wy = top + 14; wy < 290; wy += 22) {
        for (let wx = x + 10; wx < x + w - 18; wx += 16) {
          const win = GN.svgEl('rect', { class: 'win', x: wx, y: wy, width: 8, height: 11, rx: 1 });
          city.append(win);
          windows.push(win);
        }
      }
      x += w;
    }
  }

  function lightCity() {
    timers.forEach(clearTimeout);
    timers = [];
    windows.forEach((w) => w.classList.remove('on', 'screen'));
    const lit = windows.map((w) => [w, Math.random()]).sort((a, b) => a[1] - b[1]).map(([w]) => w)
      .slice(0, Math.floor(windows.length * 0.55));
    lit.forEach((w, i) => {
      const cls = Math.random() < 0.35 ? 'screen' : 'on';
      if (GN.reduceMotion) { w.classList.add(cls); return; }
      timers.push(setTimeout(() => w.classList.add(cls), 400 + i * (3200 / lit.length) + Math.random() * 300));
    });
  }

  function open() {
    const m = moment();
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
    GN.overlayOpen = true;
    $('night-close').focus();
    lightCity();
  }

  function close() {
    $('night').hidden = true;
    GN.overlayOpen = false;
    timers.forEach(clearTimeout);
    lastFocus?.focus();
  }

  function init() {
    buildCity();
    $('clock').addEventListener('click', open);
    $('night-close').addEventListener('click', close);
    document.addEventListener('click', (e) => { if (e.target.closest('[data-action="night"]')) open(); });
    document.addEventListener('keydown', (e) => {
      if (GN.overlayOpen && e.key === 'Escape') close();
      else if (!GN.overlayOpen && !e.metaKey && !e.ctrlKey && ['n', 'N', 'מ'].includes(e.key)) open();
    });
    GN.onSlideEnter(update);
    setInterval(() => { if (!moment()) update(); }, 15000);
  }

  return { init, open, close };
})();
