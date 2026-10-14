/* Demo 02: neon pulse. Same motion and glyphs as 01; adds bold stroke, breathing halo, impact flash,
 * radiating echoes and a sheen. Deterministic: all animation is driven by t += dt in update(). */
(function () {
  var Q = QCRT, L = Q.LOGO, ink = L.ink, setup = Q.BounceSim.crtSetup(Q), sim = setup.sim, box = setup.box, sc = setup.scale;
  var path = new Path2D(L.d);
  var PAL = Q.PALETTE.map(function (p) { return p.hex; });
  var WHITE = [230, 230, 230];
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  var RGB = PAL.map(rgb);
  function mix(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * k); }).join(',') + ')'; }

  var STROKE = 2.5 / sc;            // ~2.5 stage px
  var PAD = 40;                     // glow padding, stage px
  var cx = ink.x + ink.w / 2, cy = ink.y + ink.h / 2;
  var gw = Math.ceil(ink.w * sc + PAD * 2), gh = Math.ceil(ink.h * sc + PAD * 2);

  // Pre-render a blurred halo per palette colour (once). The shadow trick draws only the blur, offset into view.
  function makeGlow(hex) {
    var c = document.createElement('canvas'); c.width = gw; c.height = gh;
    var g = c.getContext('2d'), OFF = 4000;
    function pass(blur, lw) {
      g.save(); g.shadowColor = hex; g.shadowBlur = blur; g.shadowOffsetX = OFF;
      g.translate(PAD - OFF, PAD); g.scale(sc, sc); g.translate(-ink.x, -ink.y);
      g.fillStyle = hex; g.strokeStyle = hex; g.lineWidth = lw / sc; g.lineJoin = 'round';
      g.fill(path, 'evenodd'); g.stroke(path); g.restore();
    }
    pass(26, 6); pass(10, 3);
    return c;
  }
  var glows = PAL.map(makeGlow);

  var t = 0, lastB = 0, hitT = -100, prevCol = 0, curCol = 0, echoes = [], hits = 0;
  var FLASH = 0.06, XFADE = 0.25, ECHO_LIFE = 0.9, GLOW_DECAY = 0.6;

  function sheenProgress() { var p = (t % 4) / 4; return p < 0.3 ? p / 0.3 : -1; }

  Q.Shell.mount({
    update: function (dt) {
      t += dt;
      Q.BounceSim.step(sim, dt);
      if (sim.bounces !== lastB) {
        lastB = sim.bounces; hitT = t; prevCol = curCol; curCol = sim.colour; hits++;
        echoes.push({ t0: t });
        if (hits % 2 === 0) echoes.push({ t0: t + 0.15 });
        if (echoes.length > 8) echoes.shift();
      }
    },
    draw: function (ctx) {
      var age = t - hitT;
      var pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 1.6);
      var spike = age >= 0 ? Math.exp(-age / (GLOW_DECAY / 3)) : 0;      // ~5% left at 0.6 s
      var gAlpha = Math.min(1, (0.35 + 0.3 * pulse) * (1 + 1.5 * spike));
      var w = age < FLASH ? 0 : Math.min(1, (age - FLASH) / XFADE);
      var fill;
      if (age < FLASH) fill = mix(WHITE, WHITE, 0);
      else fill = mix(WHITE, RGB[curCol], w);
      if (hitT < 0 && age > 50) fill = PAL[curCol];
      if (age >= FLASH + XFADE) fill = PAL[curCol];

      ctx.save();
      ctx.translate(box.x + sim.x, box.y + sim.y); ctx.scale(sc, sc); ctx.translate(-ink.x, -ink.y);

      // halo (behind): old colour fades out, new fades in
      var gx = ink.x - PAD / sc, gy = ink.y - PAD / sc, gW = gw / sc, gH = gh / sc;
      ctx.globalAlpha = gAlpha * (1 - w) * (prevCol !== curCol ? 1 : 0);
      if (ctx.globalAlpha > 0) ctx.drawImage(glows[prevCol], gx, gy, gW, gH);
      ctx.globalAlpha = gAlpha * (prevCol !== curCol ? w : 1);
      ctx.drawImage(glows[curCol], gx, gy, gW, gH);
      ctx.globalAlpha = 1;

      // radiating echoes
      ctx.lineJoin = 'round'; ctx.strokeStyle = PAL[curCol]; ctx.lineWidth = 3.6 / sc;
      for (var i = 0; i < echoes.length; i++) {
        var e = (t - echoes[i].t0) / ECHO_LIFE;
        if (e < 0 || e >= 1) continue;
        var k = 1 + 0.4 * (1 - Math.pow(1 - e, 2)), a = 0.75 * (1 - e);
        ctx.save(); ctx.globalAlpha = a;
        ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
        ctx.lineWidth = 3.6 / sc / k;
        ctx.stroke(path); ctx.restore();
      }
      ctx.globalAlpha = 1;

      // solid logo, bold
      ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineWidth = STROKE;
      ctx.fill(path, 'evenodd'); ctx.stroke(path);

      // sheen clipped to the glyphs
      var sp = sheenProgress();
      if (sp >= 0) {
        ctx.save(); ctx.clip(path, 'evenodd');
        var bw = ink.w * 0.22, x0 = ink.x - bw * 2 + sp * (ink.w + bw * 4), sk = ink.h * 0.5;
        var gr = ctx.createLinearGradient(x0 - bw, 0, x0 + bw, 0);
        gr.addColorStop(0, 'rgba(230,230,230,0)'); gr.addColorStop(0.5, 'rgba(230,230,230,0.6)'); gr.addColorStop(1, 'rgba(230,230,230,0)');
        ctx.fillStyle = gr; ctx.transform(1, 0, -0.3, 1, 0, 0);
        ctx.fillRect(x0 - bw + sk * 0.3, ink.y - 2, bw * 2, ink.h + 4);
        ctx.restore();
      }
      ctx.restore();
    }
  });
  window.__bounce = setup;
})();
