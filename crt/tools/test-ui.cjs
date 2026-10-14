/* Browser smoke test: modes, key toggles, CRT-mode cleanliness, PAL anamorphic fill. node tools/test-ui.cjs (server on :5392) */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const fails = []; const ok = (n, c, d = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ': ' + d : '')); if (!c) fails.push(n); };
  const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5392/demos/01-bounce/?mode=preview'); await p.waitForTimeout(500);
  const cls = () => p.evaluate(() => document.body.className);
  ok('starts in preview', (await cls()).includes('preview'));
  await p.keyboard.press('c'); ok('C -> CRT mode', (await cls()).includes('crt') && !(await cls()).includes('preview'));
  ok('HUD hidden in CRT mode', await p.evaluate(() => getComputedStyle(document.getElementById('qcrt-hud')).display === 'none'));
  ok('effects canvas hidden in CRT mode', await p.evaluate(() => getComputedStyle(document.getElementById('qcrt-display')).display === 'none'));
  await p.keyboard.press('c'); ok('C -> back to preview', (await cls()).includes('preview'));
  // CRT mode: pixel-identical to the bare canvas (no guides, no effects drawn into it)
  await p.keyboard.press('c'); await p.waitForTimeout(100);
  const bg = await p.evaluate(() => { const c = document.getElementById('qcrt-source'); const d = c.getContext('2d').getImageData(2, 2, 1, 1).data; return [...d]; });
  ok('CRT-mode corner pixel is the plain background', bg[0] === 16 && bg[1] === 16 && bg[2] === 16, JSON.stringify(bg));
  // PAL anamorphic: 720x576 viewport fills the whole viewport
  const q = await b.newPage({ viewport: { width: 720, height: 576 } });
  await q.goto('http://localhost:5392/demos/01-bounce/?mode=crt'); await q.waitForTimeout(400);
  const r = await q.evaluate(() => { const e = document.getElementById('qcrt-stage').getBoundingClientRect(); const c = document.getElementById('qcrt-source'); return [e.width, e.height, c.width, c.height]; });
  ok('720x576 viewport: stage fills it, canvas is 720x576', r.join() === '720,576,720,576', r.join('x'));
  const s = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await s.goto('http://localhost:5392/demos/01-bounce/?mode=crt'); await s.waitForTimeout(400);
  const r2 = await s.evaluate(() => { const e = document.getElementById('qcrt-stage').getBoundingClientRect(); return [Math.round(e.width), Math.round(e.height)]; });
  ok('other viewports: letterboxed to 4:3', Math.abs(r2[0] / r2[1] - 4 / 3) < 0.01, r2.join('x'));
  ok('no page errors', errs.length === 0, errs.join('; '));
  // index lists the demo
  const i = await b.newPage(); await i.goto('http://localhost:5392/'); await i.waitForSelector('.card h2');
  ok('index lists demos', (await i.locator('.card h2').allTextContents()).some(t => t.includes('Bouncing QBIKK')));
  await i.setViewportSize({ width: 900, height: 600 }); await i.screenshot({ path: process.env.SHOT || '/tmp/index.png' });
  await b.close(); process.exit(fails.length ? 1 : 0);
})();
