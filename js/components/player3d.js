// איור תלת־ממדי מסוגנן של שחקן כדורסל בכרטיס השחקן (שקופית 2).
// זהו איור כללי בסגנון Low-Poly ולא דמותו של דני אבדיה: אין מודל חופשי של השחקן, ודמות שמחקה אדם אמיתי מעלה בעיית זכויות.
// Three.js נטען רק כשנכנסים לשקופית. אם הטעינה נכשלת (למשל בלי אינטרנט), נשאר הצללית ב־SVG.
GN.player3d = (() => {
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const C = { skin: 0xc68a63, hair: 0x2a1c14, jersey: 0xe03a3e, trim: 0x111111, shorts: 0x161616, sock: 0xf4f6fa, shoe: 0x0b0e14, ball: 0xe07a2e };

  let host, renderer, scene, camera, player, ball, armR, foreR, raf = 0, running = false, t0 = 0;
  let loading = null;
  let rotY = 0.5, velY = 0.35; // סיבוב אוטומטי + תנופה מגרירה
  let drag = null, dragged = false;

  const loadThree = () => loading || (loading = new Promise((resolve, reject) => {
    if (window.THREE) return resolve();
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.crossOrigin = 'anonymous';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  }));

  // ---------- בניית הדמות מצורות פשוטות ----------
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.05, ...extra });
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); return o; };
  const limb = (r1, r2, len, m) => { const g = new THREE.CylinderGeometry(r1, r2, len, 7); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, m); };

  // טקסטורת גופייה אחת סביב הגליל: ב־Three.js נקודת u=0 של גליל פונה קדימה (+z),
  // ולכן המספר הקדמי נחצה בין שני קצות הטקסטורה, והגב (שם ומספר) נמצא באמצע.
  function jerseyTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#e03a3e'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#111111'; g.fillRect(0, 0, 1024, 10); // פס בצווארון
    g.textAlign = 'center'; g.lineJoin = 'round';
    g.strokeStyle = '#111111'; g.fillStyle = '#ffffff';
    const text = (str, x, y, size) => {
      g.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
      g.lineWidth = size / 9;
      g.strokeText(str, x, y);
      g.fillText(str, x, y);
    };
    [0, 1024].forEach((x) => text('8', x, 190, 130)); // חזית
    text('8', 512, 215, 130);                         // גב
    text('AVDIJA', 512, 74, 40);
    return new THREE.CanvasTexture(c);
  }

  function ballTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e07a2e'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#2b1406'; g.lineWidth = 5;
    [[0, 64, 256, 64], [64, 0, 64, 128], [192, 0, 192, 128]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
    g.beginPath(); g.ellipse(128, 64, 40, 64, 0, 0, Math.PI * 2); g.stroke();
    return new THREE.CanvasTexture(c);
  }

  function buildPlayer() {
    const p = new THREE.Group();
    const skin = mat(C.skin), shorts = mat(C.shorts), sock = mat(C.sock), shoe = mat(C.shoe), trim = mat(C.trim);

    // רגליים, גרביים ונעליים
    [-0.17, 0.17].forEach((x) => {
      const thigh = limb(0.145, 0.115, 0.62, skin); thigh.position.set(x, 1.12, 0); p.add(thigh);
      const shin = limb(0.11, 0.085, 0.5, skin); shin.position.set(x, 0.52, 0); p.add(shin);
      p.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 7), sock, x, 0.14, 0));
      p.add(mesh(new THREE.BoxGeometry(0.2, 0.1, 0.36), shoe, x, 0.05, 0.06));
    });
    // מכנסיים
    p.add(mesh(new THREE.CylinderGeometry(0.37, 0.4, 0.44, 8), shorts, 0, 1.18, 0));
    p.add(mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.05, 8), mat(C.jersey), 0, 0.98, 0));
    // גופייה עם מספר מלפנים ושם ומספר מאחור
    p.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.84, 16), mat(C.jersey, { map: jerseyTexture() }), 0, 1.7, 0)); // רחבה מהמכנסיים, כדי שלא יבלטו
    [-0.43, 0.43].forEach((x) => p.add(mesh(new THREE.IcosahedronGeometry(0.12, 1), skin, x, 2.03, 0))); // כתפיים
    p.add(mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.07, 16), trim, 0, 2.13, 0)); // צווארון
    // צוואר, ראש ושיער
    p.add(mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.16, 7), skin, 0, 2.2, 0));
    p.add(mesh(new THREE.IcosahedronGeometry(0.21, 1), skin, 0, 2.45, 0.01));
    const hair = mesh(new THREE.SphereGeometry(0.215, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.1), mat(C.hair), 0, 2.49, -0.01);
    hair.scale.set(1.02, 0.85, 1.05);
    p.add(hair);
    // זרועות: שמאל רפויה, ימין מכדררת
    const armL = limb(0.1, 0.085, 0.44, skin); armL.position.set(-0.47, 2.02, 0); armL.rotation.z = -0.18; p.add(armL);
    const foreL = limb(0.085, 0.07, 0.4, skin); foreL.position.set(0, -0.44, 0); foreL.rotation.x = -0.35; armL.add(foreL);
    armR = limb(0.1, 0.085, 0.44, skin); armR.position.set(0.47, 2.02, 0); armR.rotation.set(-0.45, 0, 0.22); p.add(armR);
    foreR = limb(0.085, 0.07, 0.4, skin); foreR.position.set(0, -0.44, 0); foreR.rotation.x = -0.7; armR.add(foreR);
    // כדור
    ball = mesh(new THREE.SphereGeometry(0.15, 16, 12), mat(C.ball, { map: ballTexture(), flatShading: false, roughness: 0.6 }), 0.62, 1.0, 0.46);
    p.add(ball);
    return p;
  }

  function setup() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.6, 5.4);
    camera.lookAt(0, 1.32, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1015, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2, 4, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xe03a3e, 1.1); rim.position.set(-3, 2, -3); scene.add(rim);

    // צל רך על הרצפה
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    player = buildPlayer();
    scene.add(player);
    resize();
    new ResizeObserver(resize).observe(host);
    bindDrag();
    host.classList.add('ready');
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  }

  // ---------- תנועה ----------
  function animate(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    if (!drag) {
      rotY += velY * 0.016;
      velY += (0.35 - velY) * 0.02; // חזרה הדרגתית למהירות הבסיס אחרי גרירה
    }
    player.rotation.y = rotY;
    // כדרור: הכדור יורד לרצפה וחוזר ליד
    const k = Math.abs(Math.sin(t * 3.2));
    ball.position.y = 0.16 + k * 0.84;
    ball.rotation.x = t * 4;
    foreR.rotation.x = -0.7 + (1 - k) * 0.45;
    armR.rotation.x = -0.45 + (1 - k) * 0.15;
    player.position.y = Math.sin(t * 6.4) * 0.008;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  function renderOnce() { if (renderer) { player.rotation.y = rotY; renderer.render(scene, camera); } }

  function start() {
    if (!renderer || running) return;
    if (GN.reduceMotion) { renderOnce(); return; } // תנועה מופחתת: תמונה סטטית, עדיין אפשר לגרור
    running = true;
    t0 = performance.now();
    raf = requestAnimationFrame(animate);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // גרירה לסיבוב. גרירה של יותר מ־6px לא נחשבת לחיצה, ולכן לא הופכת את הכרטיס.
  function bindDrag() {
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, last: e.clientX, time: performance.now() }; dragged = false; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.last;
      if (Math.abs(e.clientX - drag.x) > 6) dragged = true;
      rotY += dx * 0.012;
      const now = performance.now();
      velY = (dx * 0.012) / Math.max(0.016, (now - drag.time) / 1000);
      drag.last = e.clientX; drag.time = now;
      if (!running) renderOnce();
    });
    const end = () => { drag = null; velY = Math.max(-4, Math.min(4, velY)); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  async function enter() {
    try {
      if (!renderer) { await loadThree(); setup(); }
      start();
    } catch (err) {
      host.classList.add('failed'); // הצללית ב־SVG נשארת
    }
  }

  function init() {
    host = document.getElementById('player3d');
    if (!host) return;
    const card = host.closest('.flip-card');
    GN.onSlideEnter((slide) => (slide.contains(host) ? enter() : stop()));
    // כשהכרטיס הפוך אין טעם לרנדר את הצד הקדמי
    card.addEventListener('click', () => setTimeout(() => (card.classList.contains('flipped') ? stop() : start()), 0));
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : host.closest('.slide.active') && !card.classList.contains('flipped') && start()));
  }

  // לצילומי מסך ולבדיקות: עצירה בזווית קבועה
  const freeze = (angle = 0) => { stop(); rotY = angle; renderOnce(); };

  return { init, freeze, wasDragged: () => dragged, isRunning: () => running };
})();
