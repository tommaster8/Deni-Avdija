// כלי עזר משותפים. כל הקוד של המצגת יושב תחת מרחב השמות GN.
window.GN = window.GN || {};

GN.$ = (id) => document.getElementById(id);
GN.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
GN.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

GN.svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

// אירוע כניסה לשקופית: רכיבים נרשמים ומגיבים כשהשקופית שלהם נכנסת
GN.onSlideEnter = (handler) => document.addEventListener('gn:slideenter', (e) => handler(e.detail.slide, e.detail.index));

// הנפשת מספר מערך לערך (עם האטה בסוף). משמש למספרים רצים, לגרפים ולהשוואה.
GN.tween = (el, from, to, { decimals = 0, suffix = '', duration = 900 } = {}) => {
  const fmt = (v) => `${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  cancelAnimationFrame(el._tween);
  if (GN.reduceMotion || from === to) { el.textContent = fmt(to); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) el._tween = requestAnimationFrame(tick);
  };
  el._tween = requestAnimationFrame(tick);
};

GN.decimalsOf = (v) => (String(v).split('.')[1] || '').length;
