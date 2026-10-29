// ניווט בין שקופיות: מקלדת, עכבר, מגע, קישור ישיר, ואינדיקציה לשקופית הנוכחית.
GN.nav = (() => {
  const { $ } = GN;
  let slides = [];
  let total = 0;
  let current = 0;
  let busy = false;

  function init() {
    slides = GN.$$('.slide');
    total = slides.length;

    // סדר כניסה לאנימציות
    slides.forEach((slide) => GN.$$('[data-anim]', slide).forEach((el, i) => el.style.setProperty('--i', i)));

    buildDots();
    bindEvents();

    current = indexFromHash();
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i !== current));
    slides[current].classList.add('active');
    enter();
  }

  function buildDots() {
    const dots = $('nav-dots');
    slides.forEach((slide, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `שקופית ${i + 1}: ${slide.dataset.title}`);
      b.addEventListener('click', () => goTo(i));
      dots.appendChild(b);
    });
  }

  function indexFromHash() {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isInteger(n) && n >= 1 && n <= total ? n - 1 : 0;
  }

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
      slide.setAttribute('aria-hidden', 'false');
      slide.scrollTop = 0;
      enter();
    };

    if (GN.reduceMotion) { swap(); return; }

    busy = true;
    const stinger = $('stinger');
    stinger.classList.toggle('replay', replay);
    stinger.classList.remove('run');
    void stinger.offsetWidth;
    stinger.classList.add('run');
    setTimeout(swap, 330);
    setTimeout(() => { stinger.classList.remove('run', 'replay'); busy = false; }, 800);
  }

  function enter() {
    const slide = slides[current];
    updateIndicator(slide);
    document.dispatchEvent(new CustomEvent('gn:slideenter', { detail: { slide, index: current } }));
  }

  function updateIndicator(slide) {
    const num = String(current + 1).padStart(2, '0');
    $('bug-quarter').textContent = slide.dataset.quarter;
    $('bug-count').textContent = `${num}/${total}`;
    const nextSlide = slides[current + 1];
    $('nav-label').innerHTML = `<b>${num}</b>${slide.dataset.title}` +
      (nextSlide ? `<span class="next-up">בהמשך: ${nextSlide.dataset.title}</span>` : '');
    $('progress-bar').style.width = `${((current + 1) / total) * 100}%`;
    [...$('nav-dots').children].forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.toggleAttribute('aria-current', i === current);
    });
    $('nav-prev').disabled = current === 0;
    $('nav-next').disabled = current === total - 1;
    $('announcer').textContent = `שקופית ${current + 1} מתוך ${total}: ${slide.dataset.title}`;
    if (location.hash !== `#${current + 1}`) history.replaceState(null, '', `#${current + 1}`);
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);
  const replay = () => goTo(current, { replay: true });

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'next') next();
      else if (action === 'prev') prev();
      else if (action === 'restart') goTo(0);
    });

    document.addEventListener('keydown', (e) => {
      if (GN.overlayOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : document.body;
      // חיצים בתוך בקר (סליידר, רשימה, טאבים) שייכים לבקר ולא מחליפים שקופית
      const onRange = target.matches('input[type="range"], select') || !!target.closest('[role="tablist"]');
      switch (e.key) {
        case 'ArrowLeft': if (!onRange) { e.preventDefault(); next(); } break; // RTL: שמאלה = קדימה
        case 'ArrowRight': if (!onRange) { e.preventDefault(); prev(); } break;
        case 'PageDown': e.preventDefault(); next(); break;
        case 'PageUp': e.preventDefault(); prev(); break;
        case ' ':
          if (target.closest('button, input, select')) return;
          e.preventDefault(); next(); break;
        case 'Home': e.preventDefault(); goTo(0); break;
        case 'End': e.preventDefault(); goTo(total - 1); break;
        case 'r': case 'R': case 'ר': replay(); break;
      }
    });

    // החלקה בנייד – ב־RTL החלקה ימינה מתקדמת
    let x0 = null, y0 = null;
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('.compare, .no-swipe')) { x0 = null; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx > 0 ? next() : prev();
      x0 = null;
    });

    window.addEventListener('hashchange', () => goTo(indexFromHash()));
  }

  return { init, goTo, next, prev, replay, current: () => slides[current] };
})();
