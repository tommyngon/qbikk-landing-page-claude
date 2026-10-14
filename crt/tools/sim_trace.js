/* Print the expected per-frame state of a demo from the SAME code the page uses (no browser needed).
 * node tools/sim_trace.js <frames> [fps]  ->  JSON { geo, box, scale, frames:[[x,y,colour],...] } (x,y in stage units) */
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), ctx = {}; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['shared/crt-settings.js', 'shared/logo.js', 'shared/colors.js', 'demos/01-bounce/sim.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const Q = ctx.QCRT, n = Number(process.argv[2] || 1500), dt = 1 / Number(process.argv[3] || Q.SETTINGS.fps);
const { sim, geo, box, scale } = Q.BounceSim.crtSetup(Q), frames = [];
for (let i = 0; i < n; i++) { if (i > 0) Q.BounceSim.step(sim, dt); frames.push([sim.x, sim.y, sim.colour]); }
process.stdout.write(JSON.stringify({ geo, box, scale, ink: Q.LOGO.ink, stage: Q.SETTINGS.stage, out: Q.SETTINGS.out, palette: Q.PALETTE.map(c => c.hex), frames }));
