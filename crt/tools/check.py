"""Mechanical checks on an exported CRT video. Reports numbers, fixes nothing. Exit 1 if any FAIL.
Usage: python3 tools/check.py out/<file>.mp4 [--sim-frames N]
Checks: stream facts (size/fps/SAR/range), luma range 16-235, nothing outside the title-safe area,
logo position and colour vs the simulation on EVERY frame, minimum stroke thickness (>= 3 output px)."""
import json, subprocess, sys, os, numpy as np
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4 = sys.argv[1]
fails = []
def check(name, ok, detail):
    print(("PASS " if ok else "FAIL ") + name + ": " + detail)
    if not ok: fails.append(name)

# ---- 1. stream facts -------------------------------------------------------------------------------
pr = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
    "stream=width,height,r_frame_rate,sample_aspect_ratio,display_aspect_ratio,color_range,color_space,pix_fmt,nb_read_frames,codec_name",
    "-of", "json", mp4]))["streams"][0]
W, H, N = pr["width"], pr["height"], int(pr["nb_read_frames"])
check("resolution", (W, H) in [(720, 576), (640, 480)], f"{W}x{H}")
check("frame rate", pr["r_frame_rate"] in ("50/1", "60/1", "25/1", "30/1"), pr["r_frame_rate"])
check("codec/pixfmt", pr["codec_name"] == "h264" and pr["pix_fmt"] == "yuv420p", f'{pr["codec_name"]} {pr["pix_fmt"]}')
check("aspect flags", pr.get("display_aspect_ratio") == "4:3", f'SAR {pr.get("sample_aspect_ratio")} DAR {pr.get("display_aspect_ratio")}')
check("colour range tag", pr.get("color_range") == "tv", f'{pr.get("color_range")} / {pr.get("color_space")}')
fps = int(pr["r_frame_rate"].split("/")[0])

# ---- expected motion from the same code the page runs ------------------------------------------------
sim = json.loads(subprocess.check_output(["node", os.path.join(root, "tools", "sim_trace.js"), str(N), str(fps)]))
sx = W / sim["stage"]["w"]                      # stage -> output pixel scale (x); y is 1:1
box, ink = sim["box"], sim["ink"]
logoW_out, logoH_out = sim["geo"]["logoW"] * sx, sim["geo"]["logoH"]
ts = (36.0 * 0 + box["x"] * sx, box["y"], (box["x"] + box["w"]) * sx, box["y"] + box["h"])   # title-safe rect in output px
tx0, ty0, tx1, ty1 = ts

# ---- 2. every frame, luma (gray) ----------------------------------------------------------------------
cmd = ["ffmpeg", "-v", "error", "-i", mp4, "-vf", "scale=in_range=tv:out_range=tv", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
fsz = W * H * 3 // 2   # yuv420p frame: Y plane first, then U, V
ymin, ymax, out_max = 255, 0, 0
pos_err = []
yy, xx = np.mgrid[0:H, 0:W]
# pixels the title-safe edge only partly covers count as inside
outside = ~((xx >= int(np.floor(tx0))) & (xx < int(np.ceil(tx1))) & (yy >= int(np.floor(ty0))) & (yy < int(np.ceil(ty1))))
i = 0
while True:
    buf = p.stdout.read(fsz)
    if len(buf) < fsz: break
    f = np.frombuffer(buf, np.uint8, W * H).reshape(H, W)   # Y plane = the coded luma
    ymin, ymax = min(ymin, int(f.min())), max(ymax, int(f.max()))
    out_max = max(out_max, int(f[outside].max()))
    m = f > 66   # ~half of the dimmest palette colour's luma step above black
    if m.any():
        cols = np.where(m.any(0))[0]; rows = np.where(m.any(1))[0]
        ex = (box["x"] + sim["frames"][i][0]) * sx; ey = box["y"] + sim["frames"][i][1]
        pos_err.append(max(abs(cols[0] - ex), abs(cols[-1] + 1 - (ex + logoW_out)), abs(rows[0] - ey), abs(rows[-1] + 1 - (ey + logoH_out))))
    else: pos_err.append(999)
    i += 1
check("frame count", i == N, f"{i} decoded of {N}")
check("luma range 16..235", ymin >= 16 and ymax <= 235, f"Y min {ymin}, max {ymax}")
BG_Y = 16 + 16 * 219 / 255   # the #101010 background after RGB->video-range conversion (~29.7)
check("title-safe area (nothing but background outside)", out_max <= BG_Y + 8, f"brightest pixel outside the title-safe box: Y={out_max} (background Y~{BG_Y:.0f}; +8 allows codec ringing)")
pe = np.array(pos_err)
check("position vs simulation, every frame", pe.max() <= 2.0, f"{len(pe)} frames, max edge error {pe.max():.2f} px, mean {pe.mean():.2f} px")

# ---- 3. colour on sampled frames --------------------------------------------------------------------------
pal = [tuple(int(h[k:k + 2], 16) for k in (1, 3, 5)) for h in sim["palette"]]
cmd = ["ffmpeg", "-v", "error", "-i", mp4, "-vf", "select='not(mod(n\\,10))',scale=in_color_matrix=auto:out_range=pc", "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE); k = 0; worst = 0; wrong = 0; seen = set()
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(int)
    # dominant ink colour: most common 8-level colour bin among clearly-lit pixels (edge/AA/4:2:0 fringes don't vote)
    s = f.sum(2); lit = f[s > 250]; q = (lit // 8); key = q[:, 0] * 1024 + q[:, 1] * 32 + q[:, 2]
    mode = np.bincount(key).argmax(); col = lit[key == mode].mean(0); exp = pal[sim["frames"][k * 10][2]]
    d = np.abs(col - np.array(exp)).max(); worst = max(worst, d)
    if os.environ.get('QCRT_DEBUG') and k % 12 == 0: print('   sample', k, 'got', col.round(), 'expected', exp)
    near = int(np.argmin([np.abs(col - np.array(c)).sum() for c in pal]))
    if near != sim["frames"][k * 10][2]: wrong += 1
    seen.add(sim["frames"][k * 10][2]); k += 1
check("colour per frame", worst <= 10 and wrong == 0, f"{k} sampled frames, worst channel error {worst:.1f}/255, wrong palette entry in {wrong}, palette entries seen {len(seen)}/{len(pal)}")

# ---- 4. minimum stroke thickness (traced logo at output scale) ----------------------------------------------
if True:
    ref = (np.array(Image.open(os.path.join(root, "shared", "qbikk-logo-source.webp")).convert("L")) < 128)[ink["y"]:ink["y"] + ink["h"], ink["x"]:ink["x"] + ink["w"]]
    sxs, sys_ = logoW_out / ink["w"], logoH_out / ink["h"]          # output px per source px
    def opened_loss(d_out):
        rx, ry = d_out / 2 / sxs, d_out / 2 / sys_
        offs = [(dx, dy) for dy in range(-int(ry), int(ry) + 1) for dx in range(-int(rx), int(rx) + 1) if (dx / rx) ** 2 + (dy / ry) ** 2 <= 1]
        def shift_and(a):
            r = np.ones_like(a)
            for dx, dy in offs: r &= np.roll(np.roll(a, dy, 0), dx, 1)
            return r
        def shift_or(a):
            r = np.zeros_like(a)
            for dx, dy in offs: r |= np.roll(np.roll(a, -dy, 0), -dx, 1)
            return r
        op = shift_or(shift_and(ref))
        return 1 - (op & ref).sum() / ref.sum()
    loss3 = opened_loss(3.0); thin = [d for d in (2, 3, 4, 5, 6, 8) if opened_loss(d) > 0.01]
    check("min stroke >= 3 output px", loss3 < 0.01, f"ink lost by a 3 px opening: {loss3*100:.2f}% (first diameter that removes >1% of the logo: {thin[0] if thin else '>8'} px)")
print("\nRESULT:", "ALL PASS" if not fails else "FAILED: " + ", ".join(fails))
sys.exit(1 if fails else 0)
