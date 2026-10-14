# QBIKK on CRT: shared spec

Everything an agent or contributor needs in one place: the motion spec of demo 01, the CRT rules, who owns which files, and what "done" means.

## 1. Source of truth for demo 01 (bouncing logo)

No video of the reference was supplied. The reference is the compiled Elm bundle of bouncingdvdlogo.com (site was unreachable from the build
machine, the user pasted the bundle). The motion is therefore read from its code, which is exact, rather than measured from a recording.
`reference/elm-update-excerpt.js` is a verbatim excerpt of that bundle (model init + update function). `tools/test-sim.js` runs it against our port.

### Motion spec (as implemented, PAL)

| Item | Value |
|---|---|
| Frame rate | 50 fps fixed (dt = 20 ms). The original uses real frame time, capped at 100 ms/frame; the HTML demo keeps that cap. |
| Easing | **None.** Constant speed, instant reversal at an edge. |
| Direction | Diagonal, both axes at the same speed. Start: top-left of the box, "right" and "up". |
| Speed | `max(W,H) / 7.5` px/s with W,H = stage (768x576) = **102.4 stage px/s** per axis = 96 px/s horizontally in 720-px output pixels. |
| Logo width | stage width / 2.5 = **307.2 stage px = 288 output px** (the original uses viewport/2.5 below 768 px wide, viewport/3.8 above; the 720-px PAL frame is below the breakpoint). Height follows the logo's own ratio (6.2:1 ink box): 49.4 px. |
| Bounce rule | Per axis, per frame: if the next step would leave the box, the direction flips and the logo moves one step the other way (it does not mirror the overshoot). Ported literally. |
| Bounce box | the title-safe rectangle: x 36..684, y 28.8..547.2 output px (see CRT-forced changes) |
| Frame 0 | start state is shown for one tick. At frame 1 the "up" start direction hits the top edge and flips: that counts as a bounce, so the colour changes at frame 1 (0.02 s). Faithful to the original. |
| Colour | index +1 (mod 7) on **every** wall hit; a corner hit (both axes in one frame) is one change. Colour is only a function of bounce count. |
| Timeline | x-axis hit every 3.75 s, y-axis hit every 4.58 s (period 7.50 s / 9.16 s); first colour changes at 0.02, 3.76, 4.58, 7.48, 9.12, 11.20, 13.66, 14.92 s ... 147 changes in 300 s. |
| Corner counter | exists in the original state (`I`), never displayed. Ported, not drawn. |
| Loop | The original never loops (x and y periods only re-align after ~28 min, colours after hours). The best seam within 17 min still jumps 23 px. The MP4 is 300 s with a hard seam; the HTML demo runs forever. |

### Colours
The original's 7 logo colours live in `dvdlogo-01..07.svg` and were not obtainable. **`shared/colors.js` PALETTE is a proposal awaiting approval**
(brand-derived, CRT-safe: off-white, blue, teal, green, orange, yellow, pink). Replace the 7 hex values and re-export to use the originals.

## 2. CRT rules (shared by all demos, values in `shared/crt-settings.js`)

- Authoring: square-pixel 4:3 stage, 768x576 (PAL) or 640x480 (NTSC). Output frame 720x576 (PAL, pixel aspect 16:15) or 640x480.
- Title-safe: 90 % of the picture. Action-safe guide: 93 %. Keep everything that matters inside title-safe.
- Thinnest feature: 3 output px (interlace flicker). Logo measured: a 3 px opening removes 0.26 % of the ink; the first diameter that removes >1 % is 5 px.
- No pure white, no saturated red. Channel range 16..235.
- Coded luma must stay within Y 16..235. RGB black encodes to exactly Y=16 and codec noise then dips below it, so the background is `#101010` (Y~30) and the encoder runs `-crf 8 -x264-params deblock=-2,-2:aq-mode=0` (measured: Y min 21, max 222, 0 pixels outside range over 15,000 frames).
- Frame rate matches the display: 50 fps PAL (25 also valid), 60 fps NTSC (30 valid).
- Preview mode = simulated CRT (WebGL: curvature, scanlines, glow, colour bleed, noise, safe-area guides). CRT mode = plain picture, nothing else, no HUD, hidden cursor. Never stack the simulation on a real CRT.

## 3. CRT-forced or assumed changes (every difference from the reference)

1. **Bounce box is the title-safe area**, not the whole screen. A real CRT crops the edges (overscan), so bouncing at the very edge would hide the logo. Bounces are slightly more frequent than on a full-screen page.
2. **Pixel aspect.** Authored on a 768x576 square-pixel stage and drawn anamorphically into 720x576. Horizontal numbers are identical to the original in output pixels (288 px, 96 px/s); vertical speed is 6.7 % higher in output pixels (102.4 px/s) so the motion stays at 45 degrees on the 4:3 screen.
3. **Background `#101010`** (the reference JS does not define its page background; a dark one is assumed), lifted for codec headroom as above.
4. **Palette proposed**, see Colours.
5. **QBIKK is much wider than the DVD logos** (6.2:1 vs 2.19:1). The width fraction is kept (the user's choice), so it is shorter. It bounces on its ink edges, not on the image margin.
6. Fixed 50 fps instead of display-synced timing.
7. 300 s MP4 with a hard seam (see Loop).

## 4. Verification (what was actually compared)

- `node tools/test-sim.js`: our port vs the verbatim original update logic, **0.0 px difference** over 157,000 steps in 6 cases (PAL 50 Hz, PAL 25 Hz, NTSC 60 Hz, 1920x1080, the 768 breakpoint, jittery frame times incl. >100 ms). Position, direction flags, colour index and corner count identical every step.
- `python3 tools/check.py out/<file>.mp4`: decodes the real MP4. 15,000 frames: position vs simulation max 0.87 px (mean 0.48), colour error max 5.5/255 and right palette entry on all sampled frames, nothing but background outside the title-safe area, luma 21..222.
- `python3 tools/check_trace.py`: the traced vector vs your supplied logo, IoU 0.991 (same ink area to 0.005 %; the rest is edge anti-aliasing).
- `node tools/test-ui.cjs`: modes, keys, layout (needs `./serve.sh` running).
- **Not verified:** the original site's rendering (size of its logo files, colours, background) because the site was unreachable and no recording was supplied.

## 5. File ownership map

| Area | Files |
|---|---|
| Logo + colours + CRT constants | `shared/qbikk-logo-source.webp`, `shared/qbikk-logo.svg`, `shared/logo.js` (generated by `tools/trace_logo.py`), `shared/colors.js`, `shared/crt-settings.js` |
| Display shell (modes, effects, layout) | `shared/crt-shell.js`, `shared/crt.css` |
| Demo 01 | `demos/01-bounce/*` |
| Index + server | `index.html`, `serve.sh`, `demos/manifest.json` |
| Export + checks | `tools/export.mjs`, `tools/check.py`, `tools/sim_trace.js`, `tools/test-*.js`, `tools/check_trace.py` |
| Reference | `reference/*` (do not edit) |

## 6. Adding a demo

1. `demos/NN-name/` with `index.html` (copy demo 01's script tags), `demo.json` (`id`, `title`, `description`), your JS calling `QCRT.Shell.mount({ update(dt), draw(ctx, stage) })`.
2. Add `"NN-name"` to `demos/manifest.json`. It shows up on the index page.
3. Draw only in stage units, inside `QCRT.safeRect()`, colours from `QCRT.PALETTE` / `QCRT.BRAND` clamped to 16..235.
4. `node tools/export.mjs NN-name 60` then `python3 tools/check.py out/<file>.mp4` (the position and colour checks are specific to demo 01; the stream, luma, safe-area and stroke checks apply to every demo).

## 7. Done criteria (demo 01)

- [x] Motion equals the reference logic exactly (bit-exact test).
- [x] Runs locally with one command; MP4 exported in CRT format.
- [x] Everything inside title-safe; no strokes under 3 px; luma 16..235.
- [x] Preview mode and CRT mode both work.
- [x] Project structure ready for more demos.
- [ ] Palette approved. [ ] Real CRT test with the user's TV.
