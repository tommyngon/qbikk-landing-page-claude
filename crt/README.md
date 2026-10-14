# QBIKK on CRT

Animated QBIKK demos built for a real CRT television (PAL 576i/50 by default), plus a laptop preview that fakes the CRT look.

```bash
./serve.sh            # then open http://localhost:5392
```

- `index.html`: lists the demos. Each has **Preview** (simulated CRT, for your laptop) and **CRT mode** (plain picture, for the real tube).
- Keys in a demo: `C` mode, `G` safe-area guides, `F` fullscreen, `H` hide help.
- `out/`: exported CRT-ready video files (H.264, 720x576, 50p).
- `SPEC.md`: the motion spec, CRT rules, every difference from the reference, and what was verified.
- `GUIDE.md`: how to connect to the TV (SCART), what to set, what to tell me about your TV.

## Demos
| Folder | What |
|---|---|
| `demos/01-bounce` | Exact copy of the bouncingdvdlogo.com motion with the QBIKK wordmark (palette awaiting approval) |

## Tools (need node, python3, ffmpeg; Playwright + Chromium for export)
```bash
node tools/test-sim.js                              # port vs original Elm update logic, must print ALL PASS
node tools/export.mjs 01-bounce 300 pal             # -> out/qbikk_01-bounce_pal_720x576_50p_300s.mp4
python3 tools/check.py out/<file>.mp4               # stream, luma, safe area, position, colour, stroke checks
python3 tools/check_trace.py                        # traced logo vs the supplied logo
python3 tools/trace_logo.py shared/qbikk-logo-source.webp shared/qbikk-logo.svg   # redo the trace (needs: pip install potracer pillow numpy)
```
`PLAYWRIGHT_PATH=/path/to/playwright` if Playwright is not resolvable from the project.
