// הרצת סוללת הבדיקות (tests/qa.html) ב־Chrome ללא ממשק, כדי שלשונית ברקע לא תעצור אנימציות ותגרום לכישלון שגוי.
// דרישות: Google Chrome, Node 22 ומעלה, שרת מקומי פעיל על פורט 5173.
// הרצה: node tests/run-qa.mjs
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), 'gn-qa')}`, '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });

try {
  for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:5173/tests/qa.html?run=${Date.now()}` });
  await sleep(1500);
  await evaluate("document.getElementById('run').click()");
  const t0 = Date.now();
  while (!(await evaluate('window.QA_DONE === true'))) {
    if (Date.now() - t0 > 600000) throw new Error('timeout');
    await sleep(3000);
  }
  const results = await evaluate('JSON.stringify(window.QA_RESULTS)');
  const summary = await evaluate("document.getElementById('summary').textContent");
  for (const r of JSON.parse(results)) console.log(`${r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : 'ℹ'} ${r.id.padEnd(4)} ${r.name}${r.status === 'fail' ? `\n      ${r.detail}` : ''}`);
  console.log(`\n${summary}`);
  ws.close();
} finally {
  chrome.kill();
}
