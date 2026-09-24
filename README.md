# QBIKK — landing page

Single-page landing site for QBIKK, the pocket-sized AI secretary.

- `index.html`: the whole page (inline CSS and JS). The cube is rendered with a WebGL shader.
- `assets/`: QBIKK wordmark (alpha mask) and app icon.
- `QBIKK-landing-prompt.md`: a full design and behaviour spec for rebuilding the page.

The transcription demo is scripted. No microphone or backend is used.

## Run locally

```bash
python3 -m http.server 5391
```

Then open http://localhost:5391.
