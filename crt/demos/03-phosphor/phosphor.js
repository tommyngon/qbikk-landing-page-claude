/* Demo 03: Phosphor burn. Same motion and logo as demo 01, plus analog-tube character:
 * bold stroke, fading afterglow trail, breathing bloom, RGB split + tear glitch on bounces, baked grain, hum bar.
 * Deterministic: all time comes from update(dt); randomness is a seeded PRNG. Everything is source-over, so no channel
 * can exceed the brightest palette channel (<= 235). */
(function () {
  var Q = QCRT, L = Q.LOGO, S = Q.SETTINGS, setup = Q.BounceSim.crtSetup(Q), sim = setup.sim, box = setup.box, sc = setup.scale, geo = setup.geo;
  var SW = S.stage.w, SH = S.stage.h;
  var path = new Path2D(L.d);
  var STROKE = 2 / sc;                         // ~2 stage px at final size, in path units
  var FADE_TAU = 0.35, SPLIT_MAX = 4, SPLIT_T = 0.4, PAD = 48;

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry32(5392);
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hexRgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }

  function place(c, x, y) { c.setTransform(sc, 0, 0, sc, x, y); c.translate(-L.ink.x, -L.ink.y); }
  function logo(c, colour, alpha) {
    c.globalAlpha = alpha; c.fillStyle = colour; c.strokeStyle = colour; c.lineWidth = STROKE; c.lineJoin = 'round';
    c.fill(path, 'evenodd'); c.stroke(path);
  }

  // Bloom: blurred logo per palette colour, rendered once. Shadow trick: shape drawn far off-canvas, its shadow lands in view.
  var BW = Math.ceil(geo.logoW + PAD * 2), BH = Math.ceil(geo.logoH + PAD * 2), OFF = 4000;
  var blooms = Q.PALETTE.map(function (p) {
    var c = cv(BW, BH), x = c.getContext('2d');
    var layers = [[34, 0.9], [18, 1], [7, 1]];
    layers.forEach(function (l) {
      x.save(); x.setTransform(sc, 0, 0, sc, PAD - OFF, PAD); x.translate(-L.ink.x, -L.ink.y);
      x.shadowColor = p.hex; x.shadowBlur = l[0]; x.shadowOffsetX = OFF; x.shadowOffsetY = 0;
      x.fillStyle = p.hex; x.strokeStyle = p.hex; x.lineWidth = STROKE; x.lineJoin = 'round';
      x.globalAlpha = l[1]; x.fill(path, 'evenodd'); x.stroke(path); x.restore();
    });
    return c;
  });

  // Phosphor trail: stage-sized offscreen canvas. A plain in-place fade leaves stuck 8-bit residue (grey smears), so the
  // canvas is rebuilt each update from a short history of cached colour sprites, each ghost at alpha*exp(-age/tau).
  var trail = cv(SW, SH), tc = trail.getContext('2d'), hist = [], stampN = 0, SP = 3;
  var sprites = Q.PALETTE.map(function (p) {
    var c = cv(Math.ceil(geo.logoW) + SP * 2, Math.ceil(geo.logoH) + SP * 2), x = c.getContext('2d');
    place(x, SP, SP); logo(x, p.hex, 1); return c;
  });

  // Grain: 3x3 stage-px blocks, soft light/dark speckle (light <= 225, dark = 16) so levels stay legal.
  var CELLS = 128, BLK = 3, grain;
  (function () {
    var small = cv(CELLS, CELLS), sx = small.getContext('2d'), id = sx.createImageData(CELLS, CELLS), g = mulberry32(77);
    for (var i = 0; i < CELLS * CELLS; i++) {
      var v = (g() + g() + g() - 1.5) / 1.5, k = i * 4;       // roughly gaussian, -1..1
      if (v > 0) { id.data[k] = id.data[k + 1] = id.data[k + 2] = 225; id.data[k + 3] = Math.min(255, v * 40); }
      else { id.data[k] = id.data[k + 1] = id.data[k + 2] = 16; id.data[k + 3] = Math.min(255, -v * 55); }
    }
    sx.putImageData(id, 0, 0);
    grain = cv(CELLS * BLK, CELLS * BLK); var gx = grain.getContext('2d'); gx.imageSmoothingEnabled = false; gx.drawImage(small, 0, 0, grain.width, grain.height);
  })();

  var t = 0, lastBounces = 0, splitAge = 99, tearFrames = 0, tear = [], gox = 0, goy = 0, flick = 0, stampAlpha = 0.6;

  function update(dt) {
    t += dt;
    Q.BounceSim.step(sim, dt);
    if (sim.bounces !== lastBounces) {
      lastBounces = sim.bounces; splitAge = 0; tearFrames = 3 + Math.floor(rng() * 3);
    } else splitAge += dt;
    tear = [];
    if (tearFrames > 0) {
      tearFrames--;
      var n = 4 + Math.floor(rng() * 3);
      for (var i = 0; i < n; i++) { var s = 3 + rng() * 6; tear.push(rng() < 0.5 ? -s : s); }
    }
    gox = Math.floor(rng() * grain.width); goy = Math.floor(rng() * grain.height);
    flick = (rng() - 0.5) * 2;
    // trail: age the history, add a ghost every 2nd update, rebuild the canvas
    for (var h = 0; h < hist.length; h++) hist[h].age += dt;
    if ((stampN++ & 1) === 0) hist.push({ x: box.x + sim.x, y: box.y + sim.y, c: sim.colour, age: 0 });
    while (hist.length && hist[0].age > 0.9) hist.shift();
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, SW, SH);
    for (h = 0; h < hist.length; h++) { tc.globalAlpha = stampAlpha * Math.exp(-hist[h].age / FADE_TAU); tc.drawImage(sprites[hist[h].c], hist[h].x - SP, hist[h].y - SP); }
    tc.globalAlpha = 1;
  }

  function draw(ctx, st) {
    var x = box.x + sim.x, y = box.y + sim.y, col = Q.PALETTE[sim.colour].hex;
    var breath = Math.sin(2 * Math.PI * 0.4 * t), bright = 1 + 0.10 * breath + 0.03 * flick;
    ctx.save();
    ctx.globalAlpha = 0.8; ctx.drawImage(trail, 0, 0, st.w, st.h);
    ctx.globalAlpha = Math.min(1, 0.62 * bright); ctx.drawImage(blooms[sim.colour], x - PAD, y - PAD);
    ctx.restore();

    var la = Math.min(1, 0.96 + 0.04 * (bright - 1) / 0.13);
    if (splitAge < SPLIT_T) {
      var s = SPLIT_MAX * (1 - splitAge / SPLIT_T);
      ctx.save(); place(ctx, x - s, y); logo(ctx, 'rgb(225,50,60)', 0.5); ctx.restore();
      ctx.save(); place(ctx, x + s, y); logo(ctx, 'rgb(50,80,225)', 0.5); ctx.restore();
    }
    if (tear.length) {
      var n = tear.length, bh = (geo.logoH + STROKE * sc * 2) / n, top = y - STROKE * sc;
      for (var i = 0; i < n; i++) {
        ctx.save(); ctx.beginPath(); ctx.rect(x - 20, top + i * bh, geo.logoW + 40, bh + (i === n - 1 ? 2 : 0)); ctx.clip();
        place(ctx, x + tear[i], y); logo(ctx, col, la); ctx.restore();
      }
    } else { ctx.save(); place(ctx, x, y); logo(ctx, col, la); ctx.restore(); }

    // film grain (pattern tiled with a per-frame offset)
    ctx.save();
    ctx.translate(-gox, -goy);
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, st.w + grain.width, st.h + grain.height);
    ctx.restore();

    // hum bar: soft darker band rolling down, 8 s period
    var bandH = 150, by = ((t / 8) % 1) * (st.h + bandH) - bandH;
    var gr = ctx.createLinearGradient(0, by, 0, by + bandH);
    gr.addColorStop(0, 'rgba(16,16,16,0)'); gr.addColorStop(0.5, 'rgba(16,16,16,0.16)'); gr.addColorStop(1, 'rgba(16,16,16,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, by, st.w, bandH);
  }

  Q.Shell.mount({ update: update, draw: draw });
  window.__bounce = setup;
})();
