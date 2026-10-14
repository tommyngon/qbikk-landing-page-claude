/* Shared CRT-safe settings. Every demo reads this; change a number here, not in a demo.
 * Stage = the square-pixel picture all demos draw into (4:3). Output frame = what the CRT receives. */
(function (g) {
  g.QCRT = g.QCRT || {};
  var STANDARDS = {
    // 720x576 is anamorphic: pixels are 16:15 wide on a 4:3 tube, so we author on a 768x576 square-pixel stage.
    pal:  { name: 'PAL 576i/50',  outW: 720, outH: 576, fps: 50, stageW: 768, stageH: 576 },
    ntsc: { name: 'NTSC 480i/60', outW: 640, outH: 480, fps: 60, stageW: 640, stageH: 480 }
  };
  var std = 'pal'; // PAL confirmed by the user (Norway). NTSC kept as an option.
  try { var q = new URLSearchParams((g.location && g.location.search) || '').get('std'); if (STANDARDS[q]) std = q; } catch (e) {}
  var S = STANDARDS[std];
  g.QCRT.SETTINGS = {
    standard: std,
    standards: STANDARDS,
    out: { w: S.outW, h: S.outH },
    stage: { w: S.stageW, h: S.stageH },
    fps: S.fps,
    titleSafe: 0.90,     // fraction of the picture kept clear of overscan
    actionSafe: 0.93,
    minStrokePx: 3,      // thinnest feature allowed, in output pixels (interlace flicker)
    videoRange: { min: 16, max: 235 }, // 0-255 scale, broadcast-safe
    background: '#101010'              // headroom: RGB black encodes to Y=16 and codec noise then dips below 16; #101010 (Y~30) keeps every pixel legal
  };
  g.QCRT.safeRect = function (frac) {
    var s = g.QCRT.SETTINGS.stage, f = frac == null ? g.QCRT.SETTINGS.titleSafe : frac;
    return { x: s.w * (1 - f) / 2, y: s.h * (1 - f) / 2, w: s.w * f, h: s.h * f };
  };
})(typeof self !== 'undefined' ? self : this);
