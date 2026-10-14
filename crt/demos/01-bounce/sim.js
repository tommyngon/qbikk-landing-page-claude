/* Bouncing-logo simulation: a literal port of the update logic in the reference Elm app
 * (reference/bouncingdvdlogo.js). Same step order, same "reverse the step on a bounce" rule,
 * same colour cycle. UMD so Node tests and the browser share one file. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.QCRT = root.QCRT || {}; root.QCRT.BounceSim = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // o: { boxW, boxH, logoW, logoH, speed (px/s), colours }
  function create(o) {
    return {
      boxW: o.boxW, boxH: o.boxH, logoW: o.logoW, logoH: o.logoH, speed: o.speed, colours: o.colours,
      x: 0, y: 0,
      right: true,   // Elm B: initial true
      down: false,   // Elm C: initial false (so the very first move flips it, as in the original)
      colour: 0, corners: 0, bounces: 0
    };
  }
  // Advance by dt seconds. The Elm caps a frame at 100 ms; callers pass the capped dt.
  function step(s, dt) {
    var d = s.speed * dt;
    var maxX = s.boxW - s.logoW, maxY = s.boxH - s.logoH;
    var newDown = s.down ? (s.y + d <= maxY) : (s.y - d < 0);
    var newRight = s.right ? (s.x + d <= maxX) : (s.x - d < 0);
    var nx = s.x + (newRight ? d : -d), ny = s.y + (newDown ? d : -d);
    var bounced = newRight !== s.right || newDown !== s.down;
    var nearX = s.x <= d || s.x >= maxX - d;      // Elm yu: measured on the OLD position
    var nearY = s.y <= d || s.y >= maxY - d;
    if (bounced && nearX && nearY) s.corners++;
    if (bounced) { s.bounces++; s.colour = (s.colour + 1) % s.colours; }
    s.x = nx; s.y = ny; s.right = newRight; s.down = newDown;
    return s;
  }
  // Geometry from the Elm app's own formulas (viewport -> logo size and speed).
  // aspect = logo width / height. smallBreakpoint: Elm uses /2.5 below 768 px wide, else /3.8.
  function elmGeometry(vw, vh, aspect, forceSmall) {
    var small = forceSmall != null ? forceSmall : vw < 768;
    var logoW = vw / (small ? 2.5 : 3.8);
    return { logoW: logoW, logoH: logoW / aspect, speed: Math.max(vw, vh) / 7.5 };
  }
  // CRT set-up shared by the demo, the exporter and the checks: Elm formulas on the stage (small-screen branch, because
  // the 720 px PAL frame is under the 768 px breakpoint), bouncing inside the title-safe rectangle.
  // Q = the QCRT namespace (needs SETTINGS, LOGO, PALETTE, safeRect).
  function crtSetup(Q) {
    var S = Q.SETTINGS, ink = Q.LOGO.ink, box = Q.safeRect(S.titleSafe);
    var geo = elmGeometry(S.stage.w, S.stage.h, ink.w / ink.h, true);
    var sim = create({ boxW: box.w, boxH: box.h, logoW: geo.logoW, logoH: geo.logoH, speed: geo.speed, colours: Q.PALETTE.length });
    return { sim: sim, geo: geo, box: box, scale: geo.logoW / ink.w };
  }
  return { create: create, step: step, elmGeometry: elmGeometry, crtSetup: crtSetup };
});
