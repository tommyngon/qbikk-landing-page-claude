Build a single-page landing site for **QBIKK**, a pocket-sized AI voice-transcription device ("AI secretary"). Deliver one self-contained `index.html` (inline CSS + JS, no framework, no build step) plus the logo asset I attach. The page must fit exactly one viewport (100dvh, no scrolling on desktop), and look premium, restrained, futuristic and clean — Apple-level polish, nothing decorative that doesn't serve the product.

## Assets
- Attached QBIKK logo sheet: cut out the black **QBIKK wordmark** (the version with the Q whose tail is a short diagonal stroke) as a transparent PNG alpha mask. Render it via CSS `mask-image` with `background: var(--ink)` so it recolours automatically in light/dark mode. Height 19px desktop, 16px mobile, aspect ratio 460/114. Do not redraw or restyle it.
- Use the rounded-square "Q" app icon from the same sheet as favicon / apple-touch-icon (180×180, transparent rounded corners).

## Typography (Google Fonts)
- **Geist** 400/500 — all UI and headline.
- **Instrument Serif** italic — only for the word "secretary".
- **Geist Mono** 400 — only for the small timer.

## Colour tokens
Supernova accents (shared): blue `#2A6BFF`, teal `#1FC7DB`, green `#4CDB85`, orange `#FF8F38`.

Light theme: bg `#FAFAFB`, ink `#0B0C10`, ink-2 `#5E6270`, ink-3 `#A2A6B3`, hairline `rgba(11,12,16,.07)`, glass fill `rgba(244,246,250,.58)`, glass rim `rgba(255,255,255,.9)`, glass outer edge `rgba(11,12,16,.09)`, glass shadow `0 12px 32px -14px rgba(20,40,80,.22), 0 1px 2px rgba(11,12,16,.04)`, solid button `#0B0C10` with white text.

Dark theme: bg `#06070A`, ink `#F3F4F7`, ink-2 `#9A9FAE`, ink-3 `#5A5F6E`, glass fill `rgba(255,255,255,.06)`, rim `rgba(255,255,255,.13)`, outer edge `rgba(0,0,0,.6)`, shadow `0 16px 40px -16px rgba(0,0,0,.9)`, solid button `#F3F4F7` with dark text.

Glass recipe (used for the theme button, the speech pill and the result chips): fill colour above, `backdrop-filter: blur(20px) saturate(180%)`, 0.5px rim border, `inset 0 .5px 0` top highlight (white in light, `rgba(255,255,255,.2)` in dark), 0.5px outer edge ring, soft shadow. The glass must always be distinguishable from the page background.

Easing everywhere: `cubic-bezier(.2,.8,.2,1)`.

## Layout (single centred axis)
CSS grid, rows: header / intro / stage (1fr) / dock.

1. **Header** (padding 24px, horizontal clamp(20px, 3.2vw, 44px)): wordmark left. Right side: a 36px circular **glass theme toggle** (15px sun/moon line icons that crossfade with a rotate+scale) and a 36px-high solid pill CTA **"Join the waitlist →"** (13.5px, weight 500; on mobile shows only "Join →"; arrow nudges 2px right on hover).
2. **Intro**, centred: `<h1>` "Your AI *secretary*." — Geist 500, clamp(38px, 4.4vw, 64px), line-height 1, letter-spacing −0.045em; "secretary" in Instrument Serif italic at 1.1em. Below it (14px gap) the slogan **"Your pocket-sized perfect memory."** in ink-2, clamp(15px, 1.2vw, 17px). The slogan is the subheadline: the headline says what it is, the slogan says what it does.
3. **Stage**: empty flex space; the cube canvas is centred on it.
4. **Dock** (bottom padding 28px): the compact glass speech pill, and under it an 11px ink-3 note: "Scripted preview · no audio is recorded".

Light/dark: default to `prefers-color-scheme`, persist the user's choice in localStorage (wrap in try/catch), and set `data-theme` on `<html>` before first paint to avoid a flash.

## The AI cube (WebGL fragment shader, full-quad)
A **volumetric, translucent, frosted-gel rounded cube** — not a mesh, not a CSS blur blob.

- **Render**: raymarch a rounded-box SDF (half-size 0.56, corner radius 0.22) through a bounding sphere (R 2.2). Camera at z 3.6, ray dir `normalize(vec3(uv, -0.92))`, up to 80 steps with dt ≈ 1.9/60, per-pixel hash jitter on the start, and empty-space skipping (`t += max(dt, (d-0.32)*0.7)`). Density = soft interior fill (`1 - smoothstep(-0.4, 0.18, d)`, ×0.5) + a bright surface shell (`exp(-|d|*13)`, ×1.3). Composite front-to-back.
- **Cube identity**: soft face weights `pow(|q|/max|q|, 9)` normalised; faint lighter crease lines where faces meet; lit faces (light from upper-left-front) frost toward white (~26% light mode, ~14% dark).
- **Colour: supernova per-face tints** carried by the rotation — +x orange `#FF8F38`, −x green `#4CDB85`, +y blue `#3D78FF`, −y teal `#1FC7DB`, +z sky `#3A9EFF`, −z jade `#33D1A8`, soft-blended at the creases. **Only faces turned toward the viewer carry colour**; back faces fade to a neutral cool mist (light `#D6E5F2`, dark `#4D6B85`), so opposite colours never mix into mud. Add slow internal colour currents (a sin-based flow field that is 18–38% of the mix) and thin **warm orange filaments** (veins) sliding through the gel.
- **Organism motion (always on)**: two-layer domain warp — a slow tidal swell (amplitude ~0.062) plus a fine surface shiver at ~5× frequency — so the surface keeps shifting like gel or liquid crystal while still reading as a cube. Anisotropic breathing: per-axis scale ±3.5% at ~1.13 rad/s, phase-offset by 2.1 rad per axis. Overall breath ±2.5%.
- **Rotation**: yaw at ~0.34 rad/s idle (noticeably alive, not a slow crawl), with pitch 0.5 + 0.17·sin(0.37t) + 0.07·sin(0.83t) and roll 0.13·sin(0.29t) + 0.06·sin(0.71t), so the tumble never repeats exactly. It floats: translateY ±8–12px and translateX ±4px on slow sines.
- **Finish**: fine animated film grain (18 fps, strength ~0.07 × opacity) so it never looks like a clean vector gradient; a soft radial glow around it (1.8× stronger in dark mode, where the cube should look self-luminous like a nebula). Composite directly onto the page background colour in the shader and output opaque pixels (this avoids alpha banding rings); add ±0.5/255 dither.
- **Size**: canvas = min(stageHeight × 1.72, viewportWidth × 1.22) square, DPR capped at 1.5, centred on the stage. The cube should dominate the page without touching the headline or the pill.
- Respect `prefers-reduced-motion` (run at ~35% speed).

## Speech pill (compact liquid glass)
46px tall, `min(380px, 100vw − 32px)` wide, fully rounded. Left to right:
- a 6px status dot: idle ink-3; listening green with glow and pulse; processing blue; done orange.
- a single line of 14px text that keeps the **newest words in view** by translating the line left, with a 28px fade mask on the left edge when it overflows.
- a tabular mono timer (11px, "0:07"), visible only while listening.
- a 34px solid circular mic button (15px mic icon). While listening it turns white with a stop square, and a blurred conic ring (blue → teal → green → orange) behind it scales with the voice level. While processing, a thin teal arc orbits the button.
- Idle placeholder: "Tap to preview QBIKK".

## Demo interaction (scripted; there is no transcription backend)
Tapping the mic or pressing Space plays the next of five scripted scenes, cycling. Tapping again while it's listening skips to the end of the scene. **No microphone is requested.**

1. **Listening** (after a 420ms lead-in): words stream in one by one. Delay = 90ms + 34ms per character + 0–70ms random, with +280ms after commas and dashes. The last 2–3 words stay grey ("tentative") and earlier words settle into ink, like a live recogniser. Each word "kicks" a synthetic voice envelope (0.6–1.0, decaying at 3.2/s, modulated by a fast syllable wobble). That envelope drives the cube: more warp amplitude, faster spin, +7% swell, denser glow and a warmer tint, plus the mic ring's scale.
2. **Processing** (1.1s): the full text settles into ink; the cube contracts ~5% and a band of light sweeps vertically through it.
3. **Done**: the cube does a brief bloom (brighter, +3.5% scale, fading out over about a second). The pill text becomes "✓ {label}" (orange check), and 1–2 small glass **memory chips** (30px tall, 12.5px text: grey key + ink value in weight 500) float up above the pill, staggered 130ms apart.

Scenes (text → label → chips):
- "Okay — so Maria sends the revised budget by Thursday, and we move the launch review to the 14th." → "Remembered · 2 items" → Maria / Revised budget, Thursday; Launch review / Moved to the 14th
- "Idea for onboarding: skip the tutorial, let people talk to it in the first ten seconds." → "Saved to Ideas" → Onboarding / Voice-first in 10 seconds
- "One tablet with breakfast for ten days, and come back if the cough lasts past Friday." → "Reminders set · 2" → Daily / One tablet with breakfast; Friday / Follow up if cough persists
- "This is Jonas — he runs partnerships at Nordlys and knows the retail buyers in Oslo." → "New contact" → Jonas / Partnerships, Nordlys; Knows / Retail buyers in Oslo
- "What did Maria say she'd send us?" → "Recalled from your meeting" → Maria / Revised budget, by Thursday

The last scene recalls the first one: that is the "pocket-sized perfect memory" payoff.

## Responsive and accessibility
- Under 640px: 16px header padding and a shorter CTA label. Everything stays on the centred axis.
- If the viewport is shorter than 620px, allow scrolling.
- Visible focus rings (1.5px teal). aria-live on the pill text. `aria-pressed` and a changing aria-label on the mic button. aria-label on the theme button that says which mode it switches to.
- If WebGL is unavailable, hide the canvas gracefully.

## Don't
- No nav links, no sections below the fold, no language switcher, no placeholder brand names.
- No flat CSS gradient blob in place of the cube.
- Don't make the cube opaque or give it a hard silhouette.
- No big text cards; the speech UI is a compact pill.
- Never claim the demo is live transcription.
