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
