/* Export a demo to an H.264 MP4 for a real CRT.
 *   node tools/export.mjs <demo-id> [seconds=300] [std=pal]
 * Needs: node, playwright (+chromium) and ffmpeg on PATH. Set PLAYWRIGHT_PATH if playwright is not resolvable.
 * The demo page runs in ?export=1 mode: no rAF loop, this script steps it with a fixed dt and grabs each frame,
 * so the file is frame-exact (it does not depend on how fast the machine renders). */
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [demo, secArg, stdArg] = process.argv.slice(2);
if (!demo) { console.error('usage: node tools/export.mjs <demo-id> [seconds] [pal|ntsc]'); process.exit(2); }
const std = stdArg || 'pal';
const STD = { pal: { w: 720, h: 576, fps: 50, sar: '16/15', matrix: 'bt470bg', prim: 'bt470bg', trc: 'gamma28' },
              ntsc: { w: 640, h: 480, fps: 60, sar: '1/1', matrix: 'smpte170m', prim: 'smpte170m', trc: 'smpte170m' } }[std];
const seconds = Number(secArg || 300), frames = Math.round(seconds * STD.fps);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'out'); fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `qbikk_${demo}_${std}_${STD.w}x${STD.h}_${STD.fps}p_${seconds}s.mp4`);

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': t }); fs.createReadStream(f).pipe(res);
}).listen(0);
await new Promise(r => server.once('listening', r));
const port = server.address().port;

// Full-range RGB frames -> limited-range (16-235) Y'CbCr with the correct SD matrix, flagged as 4:3 via the SAR.
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(STD.fps), '-c:v', 'png', '-i', '-',
  '-vf', `scale=${STD.w}:${STD.h}:in_range=pc:out_range=tv:out_color_matrix=${STD.matrix},format=yuv420p,setsar=${STD.sar}`,
  '-c:v', 'libx264', '-preset', 'slow', '-x264-params', 'deblock=-2,-2:aq-mode=0',   // measured: keeps codec ringing from dipping below Y=16 next to the logo edges
  ...(process.env.QCRT_X264 ? process.env.QCRT_X264.split(' ') : []), '-crf', process.env.QCRT_CRF || '8', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
  '-color_range', 'tv', '-colorspace', STD.matrix, '-color_primaries', STD.prim, '-color_trc', STD.trc,
  '-r', String(STD.fps), '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise(r => ff.on('close', r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: STD.w, height: STD.h }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('page error', e.message); process.exit(1); });
await page.goto(`http://localhost:${port}/demos/${demo}/?export=1&std=${std}`);
await page.waitForFunction(() => window.__qcrt);
const [W, H] = await page.evaluate(() => window.__qcrt.size());
if (W !== STD.w || H !== STD.h) { console.error(`canvas is ${W}x${H}, expected ${STD.w}x${STD.h}`); process.exit(1); }
const dt = 1 / STD.fps;
for (let i = 0; i < frames; i++) {
  // frame 0 = the initial state (the original also shows its start state for one tick before moving)
  const b64 = await page.evaluate(({ i, dt }) => { if (i > 0) window.__qcrt.step(dt); window.__qcrt.render(); return window.__qcrt.canvas.toDataURL('image/png').split(',')[1]; }, { i, dt });
  if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 1500 === 0) console.log(`frame ${i}/${frames}`);
}
ff.stdin.end(); await done; await browser.close(); server.close();
console.log('wrote', outFile);
