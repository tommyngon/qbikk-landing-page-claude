/* Shared display shell for every QCRT demo.
 *   QCRT.Shell.mount({ update(dt), draw(ctx, stage) })
 * - Stage: all drawing is in square-pixel 4:3 "stage" units (768x576 for PAL), whatever the real canvas size.
 * - Two modes: PREVIEW (WebGL CRT simulation + optional safe-area guides) and CRT (the plain picture, no effects).
 *   Keys: C mode, G guides, F fullscreen, H help text.  URL: ?mode=crt | ?mode=preview, ?std=pal|ntsc, ?export=1
 * - Layout: a 720x576 viewport (aspect 1.25) is treated as PAL anamorphic and filled edge to edge, because the
 *   CRT stretches it to 4:3. Any other viewport is letterboxed to 4:3. */
(function (g) {
  var Q = g.QCRT = g.QCRT || {};
  var P = new URLSearchParams(g.location.search);
  var state = { mode: 'preview', guides: true, hud: true };
  try { var m = localStorage.getItem('qcrt.mode'); if (m === 'crt' || m === 'preview') state.mode = m; } catch (e) {}
  if (P.get('mode') === 'crt' || P.get('mode') === 'preview') state.mode = P.get('mode');
  var EXPORT = P.get('export') === '1';
  if (EXPORT) state.mode = 'crt';

  var VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform vec2 res;uniform float time;',
    'float h(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);}',
    'vec3 samp(vec2 c){return texture2D(tex,c).rgb;}',
    'void main(){',
    ' vec2 c=uv*2.-1.; c*=1.+.045*vec2(c.y*c.y,c.x*c.x); vec2 q=c*.5+.5;',          // slight barrel curvature
    ' if(q.x<0.||q.x>1.||q.y<0.||q.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}',
    ' vec2 px=1./res; float bl=1.6*px.x;',
    ' vec3 col=vec3(samp(q+vec2(bl,0.)).r,samp(q).g,samp(q-vec2(bl,0.)).b);',        // horizontal colour bleed
    ' vec3 glow=vec3(0.); for(int i=-3;i<=3;i++){for(int j=-3;j<=3;j++){glow+=samp(q+vec2(float(i),float(j))*px*3.);}}',
    ' glow/=49.; col+=glow*.55;',                                                    // phosphor glow
    ' float sl=.5+.5*cos(q.y*288.*6.2831853); col*=.72+.28*sl;',                      // scanlines (288 per field)
    ' float mask=.94+.06*sin(q.x*res.x*2.094395); col*=mask;',                        // faint phosphor triads
    ' col+=(h(q*res+fract(time))-.5)*.05;',                                            // noise
    ' vec2 v=q*(1.-q.yx); col*=pow(v.x*v.y*15.,.18);',                                 // vignette
    ' gl_FragColor=vec4(col*1.12,1.);}'
  ].join('\n');

  function el(tag, id) { var e = document.createElement(tag); if (id) e.id = id; return e; }

  g.addEventListener('DOMContentLoaded', function () {});
  function mount(demo) {
    var S = Q.SETTINGS;
    var stageEl = el('div', 'qcrt-stage'), src = el('canvas', 'qcrt-source'), disp = el('canvas', 'qcrt-display'), hud = el('div', 'qcrt-hud');
    stageEl.appendChild(src); stageEl.appendChild(disp);
    document.body.appendChild(stageEl); document.body.appendChild(hud);
    var ctx = src.getContext('2d'), gl = null, prog, tex, uRes, uTime;
    try {
      gl = disp.getContext('webgl', { antialias: false, preserveDrawingBuffer: EXPORT });
      if (gl) {
        var mk = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
        prog = gl.createProgram(); gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        uRes = gl.getUniformLocation(prog, 'res'); uTime = gl.getUniformLocation(prog, 'time');
      }
    } catch (e) { gl = null; }

    var W = 0, H = 0, dpr = 1;
    function layout() {
      var vw = g.innerWidth, vh = g.innerHeight; dpr = EXPORT ? 1 : (g.devicePixelRatio || 1);
      var anamorphic = S.standard === 'pal' && Math.abs(vw / vh - 720 / 576) < 0.02;
      var w = vw, h = vh;
      if (!anamorphic) { if (vw / vh > 4 / 3) { w = vh * 4 / 3; } else { h = vw * 3 / 4; } }
      stageEl.style.width = w + 'px'; stageEl.style.height = h + 'px';
      stageEl.style.left = (vw - w) / 2 + 'px'; stageEl.style.top = (vh - h) / 2 + 'px';
      W = Math.round(w * dpr); H = Math.round(h * dpr);
      src.width = disp.width = W; src.height = disp.height = H;
      if (gl) gl.viewport(0, 0, W, H);
    }
    function applyMode() {
      document.body.classList.toggle('preview', state.mode === 'preview');
      document.body.classList.toggle('crt', state.mode === 'crt');
      document.body.classList.toggle('nohud', !state.hud);
      try { if (!EXPORT) localStorage.setItem('qcrt.mode', state.mode); } catch (e) {}
      hud.textContent = (state.mode === 'preview' ? 'PREVIEW (simulated CRT)' : 'CRT mode (no effects)') + ' | ' + S.standard.toUpperCase() + ' ' + S.out.w + 'x' + S.out.h + ' @' + S.fps +
        '\nC mode  G guides  F fullscreen  H hide this';
    }
    function drawGuides() {
      var st = S.stage; ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      [[S.actionSafe, 'rgba(80,200,255,.8)'], [S.titleSafe, 'rgba(255,200,60,.9)']].forEach(function (a) {
        var r = Q.safeRect(a[0]); ctx.strokeStyle = a[1]; ctx.strokeRect(r.x, r.y, r.w, r.h);
      });
      ctx.restore();
    }
    function render(time) {
      var st = S.stage;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = S.background; ctx.fillRect(0, 0, W, H);
      ctx.setTransform(W / st.w, 0, 0, H / st.h, 0, 0);
      demo.draw(ctx, st);
      if (state.mode === 'preview' && state.guides) drawGuides();   // guides never appear in CRT mode
      if (state.mode === 'preview' && gl) {
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.uniform2f(uRes, W, H); gl.uniform1f(uTime, (time / 1000) % 100); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
    var last = null;
    function frame(ts) {
      var dt = last == null ? 0 : Math.min(ts - last, 100) / 1000;  // same 100 ms cap as the original
      last = ts;
      if (dt > 0 || demo.stepOnFirstFrame) demo.update(dt);
      render(ts);
      g.requestAnimationFrame(frame);
    }
    g.addEventListener('resize', layout);
    g.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      if (k === 'c') { state.mode = state.mode === 'crt' ? 'preview' : 'crt'; applyMode(); }
      else if (k === 'g') state.guides = !state.guides;
      else if (k === 'h') { state.hud = !state.hud; applyMode(); }
      else if (k === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); }
    });
    layout(); applyMode();
    if (EXPORT) {
      // Deterministic frame stepping for tools/export.mjs: no rAF loop, the exporter drives time.
      g.__qcrt = { step: function (dt) { demo.update(dt); }, render: function () { render(0); }, canvas: src, size: function () { return [W, H]; } };
    } else g.requestAnimationFrame(frame);
    return { state: state };
  }
  Q.Shell = { mount: mount, state: state };
})(window);
