/* Frame-by-frame check: port (demos/01-bounce/sim.js) vs the original Elm update logic (reference/elm-update-excerpt.js).
 * Run: node tools/test-sim.js            Exit code 1 on any mismatch. */
const ref = require('../reference/elm-update-excerpt.js');
const Sim = require('../demos/01-bounce/sim.js');
const { ku, init, v } = ref;
const EPS = 1e-9;

function runCase(name, vw, vh, dts) {
  let m = init();
  m = v(ku, { $: 2, a: { aA: { aV: vw, aI: vh } } }, m).a;                 // viewport message
  const g = Sim.elmGeometry(vw, vh, 394 / 180);
  const sim = Sim.create({ boxW: vw, boxH: vh, logoW: g.logoW, logoH: g.logoH, speed: g.speed, colours: 7 });
  if (Math.abs(m.N - g.speed) > EPS || Math.abs(m.h.a - g.logoW) > EPS || Math.abs(m.h.b - g.logoH) > EPS)
    return `${name}: geometry mismatch Elm(N=${m.N}, w=${m.h.a}, h=${m.h.b}) vs port(${g.speed}, ${g.logoW}, ${g.logoH})`;
  let t = 1000;
  m = v(ku, { $: 3, a: t }, m).a;                                           // first tick: Elm only records the time
  let worst = 0, bounces = 0, corners = 0;
  for (let i = 0; i < dts.length; i++) {
    const tPrev = t; t += dts[i];
    m = v(ku, { $: 3, a: t }, m).a;
    // Elm derives dt from the difference of two accumulated timestamps (carries ~1e-13 of float error); feed the port the same dt.
    Sim.step(sim, Math.min(t - tPrev, 100) / 1000);
    const dx = Math.abs(m.h.j - sim.x), dy = Math.abs(m.h.k - sim.y);
    worst = Math.max(worst, dx, dy);
    if (dx > EPS || dy > EPS) return `${name}: position mismatch at step ${i}: Elm(${m.h.j},${m.h.k}) port(${sim.x},${sim.y})`;
    if (m.v.J !== sim.colour) return `${name}: colour mismatch at step ${i}: Elm ${m.v.J} port ${sim.colour}`;
    if (m.I !== sim.corners) return `${name}: corner count mismatch at step ${i}: Elm ${m.I} port ${sim.corners}`;
    if (m.h.B !== sim.right || m.h.C !== sim.down) return `${name}: direction flag mismatch at step ${i}`;
  }
  console.log(`PASS ${name}: ${dts.length} steps, max |dpos| = ${worst.toExponential(2)}, bounces=${sim.bounces}, corners=${sim.corners}, colour=${sim.colour}`);
  return null;
}
const fixed = (ms, n) => Array(n).fill(ms);
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const jitter = n => Array.from({ length: n }, () => 5 + Math.floor(rnd() * 250)); // includes >100 ms frames (cap path)
const cases = [
  ['PAL frame 720x576 @50Hz', 720, 576, fixed(20, 30000)],
  ['PAL frame 720x576 @25Hz', 720, 576, fixed(40, 15000)],
  ['NTSC frame 640x480 @60Hz', 640, 480, fixed(1000 / 60, 36000)],
  ['Desktop 1920x1080 @60Hz', 1920, 1080, fixed(1000 / 60, 36000)],
  ['Breakpoint 768x600', 768, 600, fixed(16, 20000)],
  ['Jittery dt incl. >100ms', 720, 576, jitter(20000)]
];
const fails = cases.map(c => runCase(...c)).filter(Boolean);
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('ALL PASS');
