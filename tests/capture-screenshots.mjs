// צילומי מסך אמיתיים לתיעוד: Chrome ללא ממשק + פרוטוקול DevTools, בזמן אמת (בלי "זמן וירטואלי").
// דרישות: Google Chrome מותקן, Node 22 ומעלה (WebSocket מובנה), שרת מקומי פעיל על פורט 5173.
// הרצה: node tests/capture-screenshots.mjs
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:5173/tests/screenshot.html?shot=';
const OUT = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
const SHOTS = [
  ['opening', 1280, 720], ['card', 1280, 720], ['timeline', 1280, 720], ['chart', 1280, 720],
  ['compare', 1280, 720], ['national', 1280, 720], ['night', 1280, 720], ['quiz', 1280, 720],
  ['timeline', 390, 844, 'mobile-timeline'],
];
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--hide-scrollbars',
  `--user-data-dir=${join(tmpdir(), 'gn-shots')}`, 'about:blank'], { stdio: 'ignore' });

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  return { send, close: () => ws.close() };
}

try {
  await mkdir(OUT, { recursive: true });
  let version;
  for (let i = 0; i < 40 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); } }
  for (const [shot, w, h, name = shot] of SHOTS) {
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const page = await cdp(target.webSocketDebuggerUrl);
    await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false, screenWidth: w, screenHeight: h });
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: BASE + shot });
    // מחכים שעמוד העזר יסמן שסיים את הלחיצות (document.title === 'ready')
    for (let i = 0; i < 60; i++) {
      const r = await page.send('Runtime.evaluate', { expression: 'document.title' });
      if (r?.result?.value === 'ready') break;
      await sleep(250);
    }
    const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
    console.log(`✓ ${name}.png (${w}×${h})`);
    page.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
  }
} finally {
  chrome.kill();
}
