# Showing QBIKK on a CRT: connection guide

Written for a PAL television with a SCART socket. Anything I could not verify is marked **[uncertain]**; check it against your own TV's manual or the seller's page.

## 1. Pick how to play (best picture first)

| Option | What you need | Picture | Notes |
|---|---|---|---|
| **A. Raspberry Pi with RGB-over-SCART** | Pi + an RGB-SCART board/cable (RGB-Pi, Pi2SCART and similar boards, or a DPI "VGA666"-style adapter with an RGB-to-SCART cable) **[uncertain: exact products, wiring and config differ per board]** | Best: RGB is sharp, no colour crawl | Runs the HTML demo forever with no seam. Needs a TV SCART input that accepts RGB (see section 3). |
| **B. Raspberry Pi with composite** | Pi 3/4 (3.5 mm AV jack) + a composite cable + RCA-to-SCART adapter | Soft, usable | Cheapest. The Pi 4 needs a cable wired for the Pi, not every camcorder-style cable works **[uncertain]**. Pi 5 has no AV jack **[uncertain]**. |
| **C. Laptop + HDMI-to-SCART (or HDMI-to-composite) converter box** | converter that outputs PAL 576i | Varies by box: cheap ones are soft and may rescale badly | Needs no setup on the laptop beyond the resolution (section 4). |
| **D. DVD/media player with USB and SCART** | the MP4 on a USB stick | Good if it outputs RGB over SCART | Old players often cannot play H.264 **[uncertain]**; I can add an MPEG-2 or Xvid export if yours cannot. |

For this project I would pick **A** if you are willing to buy a small board, **B** to try it tonight, **C** if you want to use the laptop you already have.

Why the MP4 is the "reliable" fallback, but the HTML is the better demo: the MP4 is 5 minutes long and has a hard cut where it loops (an exact copy of a motion that never repeats cannot loop cleanly). The HTML demo runs without a seam.

## 2. Files

- `out/qbikk_01-bounce_pal_720x576_50p_300s.mp4`: H.264, 720x576, 50 fps progressive, 4:3 flagged (pixel aspect 16:15), limited range, BT.470 colours. Set your player to **repeat**.
- HTML: `./serve.sh`, then open `http://localhost:5392/demos/01-bounce/?mode=crt` in a browser and press **F** for fullscreen. Press **C** to switch to the laptop preview with simulated CRT effects. Use `?mode=crt` on the real TV so the effects are not doubled.

## 3. What to set on the TV

- Choose the SCART input (usually AV1/EXT-1, sometimes the one marked **RGB**) and, if the TV asks, set it to **RGB** (or "AV" for composite).
- Set picture format to **4:3** (not Auto/Zoom/16:9). Turn off any "dynamic" picture mode, "sharpness boost" and noise reduction **[uncertain: names differ per brand]**.
- Overscan: do nothing. The picture was designed with a 10 % safe margin, so whatever your tube crops (usually 3 to 8 %) is covered. The yellow dashed line in preview mode is title-safe.
- Brightness/contrast: set them with the QBIKK picture on screen. Dark grey background `#101010` should be just distinguishable from the black bezel.

## 4. What to set on the computer

| Source | Setting |
|---|---|
| Raspberry Pi, composite | PAL, 4:3, no software overscan. On older Raspberry Pi OS (non-KMS) `config.txt`: `sdtv_mode=2` (PAL), `sdtv_aspect=1` (4:3), `disable_overscan=1`. With the newer KMS graphics driver the composite output is set differently (an `overlay` line and a `video=Composite-1:` boot option) **[uncertain: depends on your Pi model and OS version, check the Raspberry Pi documentation for "composite" before editing]**. |
| Pi, browser kiosk | Chromium full screen, open `.../demos/01-bounce/?mode=crt`. The page recognises a 720x576 screen and fills it edge to edge (the CRT stretches it to 4:3). |
| Laptop to a converter box | Output a **4:3** resolution if the box accepts it: 720x576 @ 50 Hz is ideal, 1024x768 @ 50 or 60 Hz also works. If the box only takes 16:9 (720p/1080p) it may stretch the picture sideways to fill the 4:3 tube; the page letterboxes to 4:3, so the logo would look squeezed **[uncertain: depends on the box, look for an aspect or "4:3" switch on it]**. |
| Refresh rate | 50 Hz for PAL. A 60 Hz source into a PAL box is rescaled by the box and judders. |
| Video player | repeat on, scaling = none/native, aspect = 4:3 |

## 5. If something looks wrong

- Logo looks squashed or stretched: the aspect is off somewhere (TV zoom, converter, laptop resolution).
- Picture slightly shifted or cut at the edges: normal overscan; the logo stays inside the title-safe area so it should not be clipped. If it is, tell me which edge.
- Colours wash out or crawl on edges: composite limits colour detail. RGB over SCART removes it.
- Flicker on horizontal edges: expected on 576i with fine detail; the logo strokes are at least 5 px so it should be calm. Tell me where you see it.

## 6. What I need to know about your TV

1. Brand, model and screen size (and whether it is a 100 Hz model).
2. The labels on its SCART socket(s): AV1/AV2/EXT, "RGB", "S-VHS"; any other inputs (composite, S-video, component).
3. What you will play from: laptop, a Raspberry Pi, a DVD player, or a converter box (name it).
4. Whether the picture is clipped at the edges today on other devices.
