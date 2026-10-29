// ציר הקריירה האינטראקטיבי: תחנות לחיצות, כרטיס עם אירועים ותמונה, ומעבר מונפש לפי כיוון התנועה.
GN.timeline = (() => {
  const { $ } = GN;
  let index = 0;
  let tabs = [];

  // ⚠ בטקסט הופך לסימון "דורש אימות"
  const markUnverified = (text) => text.replace(/\s*⚠/g, '<sup class="unverified" title="דורש אימות">⚠</sup>');

  function media(station) {
    const p = PHOTOS[station.photo];
    if (p) {
      return `<figure class="photo ctl-photo">
        <img src="${p.src}" alt="${p.alt}" style="object-position:${p.pos}" decoding="async">
        <figcaption><span>${p.caption}</span>
          <a class="credit" href="${p.page}" target="_blank" rel="noopener">${p.credit}</a></figcaption>
      </figure>`;
    }
    // בלי צילום: גרפיקה מספרית בסגנון שידור (לא תמונת דמה)
    return `<div class="ctl-graphic" aria-hidden="true">
      <b>${station.big || station.year}</b><span>${station.bigLabel || station.label}</span>
    </div>`;
  }

  function render(dir) {
    const s = TIMELINE[index];
    const card = $('ctl-card');
    card.innerHTML = `
      ${media(s)}
      <div class="ctl-body">
        <span class="ctl-tag">${s.tag}</span>
        <span class="ctl-year">${s.year}</span>
        <h3>${s.title}</h3>
        <ul>${s.events.map((e) => `<li>${markUnverified(e)}</li>`).join('')}</ul>
      </div>`;
    card.dataset.dir = dir;
    card.classList.remove('in');
    void card.offsetWidth;
    card.classList.add('in');

    tabs.forEach((t, i) => {
      t.classList.toggle('active', i === index);
      t.classList.toggle('past', i < index);
      t.setAttribute('aria-selected', i === index);
      t.tabIndex = i === index ? 0 : -1;
    });
    $('ctl-fill').style.width = `${(index / (TIMELINE.length - 1)) * 100}%`;
    $('ctl-count').textContent = `${index + 1} / ${TIMELINE.length}`;
    $('ctl-prev').disabled = index === 0;
    $('ctl-next').disabled = index === TIMELINE.length - 1;
  }

  function select(i, { focus = false } = {}) {
    i = Math.max(0, Math.min(TIMELINE.length - 1, i));
    if (i === index && $('ctl-card').childElementCount) return;
    const dir = i >= index ? 'fwd' : 'back';
    index = i;
    render(dir);
    if (focus) tabs[index].focus();
  }

  function init() {
    const track = $('ctl-track');
    TIMELINE.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-stop';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'ctl-card');
      b.innerHTML = `<span class="ctl-stop-year">${s.year}</span><span class="ctl-stop-label">${s.label}</span>`;
      b.addEventListener('click', () => select(i));
      track.appendChild(b);
    });
    tabs = [...track.querySelectorAll('.ctl-stop')];

    // מקלדת בתוך הציר: ב־RTL חץ שמאלה = התחנה הבאה. העצירה מונעת מעבר שקופית.
    track.addEventListener('keydown', (e) => {
      const from = tabs.includes(document.activeElement) ? tabs.indexOf(document.activeElement) : index;
      const keys = { ArrowLeft: from + 1, ArrowRight: from - 1, Home: 0, End: TIMELINE.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      e.stopPropagation();
      select(keys[e.key], { focus: true });
    });
    $('ctl-prev').addEventListener('click', () => select(index - 1));
    $('ctl-next').addEventListener('click', () => select(index + 1));

    // טעינה מוקדמת של הצילומים כשנכנסים לשקופית
    GN.onSlideEnter((slide) => {
      if (!slide.contains(track)) return;
      Object.values(PHOTOS).forEach((p) => { new Image().src = p.src; });
    });

    index = 0;
    render('fwd');
  }

  return { init, select, current: () => index };
})();
