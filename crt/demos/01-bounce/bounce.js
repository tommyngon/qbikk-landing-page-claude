/* Demo 01: exact copy of bouncingdvdlogo.com with the QBIKK wordmark.
 * Motion = reference formulas (see SPEC.md), with the two CRT-forced changes listed there:
 * the bounce box is the title-safe rectangle, and sizes/speed are authored on the square-pixel stage. */
(function () {
  var Q = QCRT, L = Q.LOGO, setup = Q.BounceSim.crtSetup(Q), sim = setup.sim, box = setup.box, sc = setup.scale;
  var path = new Path2D(L.d);
  Q.Shell.mount({
    update: function (dt) { Q.BounceSim.step(sim, dt); },
    draw: function (ctx) {
      ctx.save();
      ctx.translate(box.x + sim.x, box.y + sim.y); ctx.scale(sc, sc); ctx.translate(-L.ink.x, -L.ink.y);
      ctx.fillStyle = Q.PALETTE[sim.colour].hex; ctx.fill(path, 'evenodd');
      ctx.restore();
    }
  });
  window.__bounce = setup;
})();
