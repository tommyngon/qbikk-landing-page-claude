"""Trace fidelity: rasterise shared/qbikk-logo.svg at the source size and compare with the supplied logo (IoU of the ink masks).
Usage: python3 tools/check_trace.py   (needs playwright + chromium for the rasterising step)"""
import subprocess, sys, os, numpy as np
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
png = "/tmp/qcrt_trace.png"
js = f"""
const {{ chromium }} = require('/opt/node-tools/node_modules/playwright');
(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:2000,height:437}}}});
await p.setContent('<body style="margin:0;background:#fff"><img src="file://{root}/shared/qbikk-logo.svg" style="color:#000;display:block">');
await p.setContent('<body style="margin:0;background:#fff">'+require('fs').readFileSync('{root}/shared/qbikk-logo.svg','utf8').replace('currentColor','#000'));
await p.screenshot({{path:'{png}'}});await b.close();}})();"""
open("/tmp/qcrt_raster.cjs", "w").write(js)
subprocess.run(["node", "/tmp/qcrt_raster.cjs"], check=True)
ref = np.array(Image.open(f"{root}/shared/qbikk-logo-source.webp").convert("L")) < 128
got = np.array(Image.open(png).convert("L")) < 128
inter = (ref & got).sum(); union = (ref | got).sum()
iou = inter / union
print(f"IoU = {iou:.5f}  (ref ink px {ref.sum()}, traced ink px {got.sum()}, differing px {(ref ^ got).sum()})")
sys.exit(0 if iou > 0.985 else 1)
