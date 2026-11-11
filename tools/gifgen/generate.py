"""Gera os GIFs dos exercícios em app/src/main/assets/www/gifs/.

Uso:  python3 tools/gifgen/generate.py [--sheet saida.png] [nome ...]
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))

from exercises import G, SIDE  # noqa: E402
from exercises2 import SIDE2  # noqa: E402
import front  # noqa: E402
from rig import (ACCENT, FAR, NEAR, STEEL, STEEL_DARK, THICK, Canvas, add, draw_figure,  # noqa: E402
                 ease, save_gif, solve, timeline, vdown)

OUT = Path(__file__).resolve().parents[2] / "app/src/main/assets/www/gifs"


def render_side(spec):
    poses = timeline(spec["keys"])
    frames = []
    n = len(poses)
    for i, pose in enumerate(poses):
        k = i / n
        cv = Canvas()
        j = solve(pose)
        if spec.get("back"):
            spec["back"](cv, j, k)
        draw_figure(cv, j, hl=spec.get("hl", ()), far_offset=spec.get("far_offset", (-6, -3)), ground=spec.get("ground", G))
        if spec.get("front"):
            spec["front"](cv, j, k)
        frames.append(cv.frame())
    return frames, spec.get("duration", 60)


def render_lateral_raise():
    """Elevação lateral sentado, em vista frontal."""
    frames = []
    seq = [(0.0, 5), None, (1.0, 3), None]
    trans = 14
    values = []
    for i, item in enumerate(seq):
        if item is None:
            a = seq[i - 1][0]
            b = seq[(i + 1) % len(seq)][0]
            values += [a + (b - a) * ease(s / trans) for s in range(1, trans)]
        else:
            values += [item[0]] * item[1]
    cx, hip_y = 320, 440
    sh_y = hip_y - 120
    for v in values:
        cv = Canvas()
        cv.floor(G)
        cv.rect(240, 446, 400, 470, FAR, radius=8)          # banco
        cv.rect(250, 470, 268, G, STEEL_DARK, radius=4)
        cv.rect(372, 470, 390, G, STEEL_DARK, radius=4)
        # pernas (coxas para o observador, encurtadas)
        for s in (-1, 1):
            hip = (cx + s * 26, hip_y)
            knee = (cx + s * 40, hip_y + 34)
            ankle = (cx + s * 46, G - 8)
            cv.line(hip, knee, THICK["th"] + 4, NEAR)
            cv.line(knee, ankle, THICK["sh"], NEAR)
            cv.line(ankle, (ankle[0] + s * 16, ankle[1] + 2), THICK["ft"], NEAR)
        # tronco
        cv.poly([(cx - 50, sh_y), (cx + 50, sh_y), (cx + 30, hip_y), (cx - 30, hip_y)], NEAR)
        cv.line((cx - 50, sh_y), (cx + 50, sh_y), 30, NEAR)
        cv.line((cx - 28, hip_y), (cx + 28, hip_y), 28, NEAR)
        cv.line((cx, sh_y), (cx, sh_y - 20), 22, NEAR)
        cv.circle((cx, sh_y - 44), 27, NEAR)
        a1 = 8 + 77 * v
        a2 = 8 + 70 * v
        for s in (-1, 1):
            sh = (cx + s * 50, sh_y)
            e = add(sh, (s * vdown(a1, 78)[0], vdown(a1, 78)[1]))
            h = add(e, (s * vdown(a2, 72)[0], vdown(a2, 72)[1]))
            cv.circle(sh, 18, ACCENT)                         # deltoide
            cv.line(sh, e, THICK["ua"], ACCENT)
            cv.line(e, h, THICK["fa"], NEAR)
            cv.circle(h, 11, NEAR)
            cv.circle(add(h, (0, 6)), 20, STEEL_DARK)
            cv.circle(add(h, (0, 6)), 14, STEEL)
        frames.append(cv.frame())
    return frames, 60


def build(names=None):
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = {}
    for k, v in {**SIDE, **SIDE2}.items():
        jobs[k] = ("side", v)
    for k, v in front.FRONT.items():
        jobs[k] = ("front", v)
    out = {}
    for name in sorted(jobs):
        if names and name not in names:
            continue
        kind, spec = jobs[name]
        frames, dur = render_side(spec) if kind == "side" else front.render(spec)
        path = OUT / f"{name}.gif"
        save_gif(frames, path, duration=dur)
        out[name] = frames
        print(f"{name:26s} {len(frames):3d} quadros  {path.stat().st_size / 1024:6.1f} KB")
    return out


def contact_sheet(all_frames, path, per=4):
    names = sorted(all_frames)
    w, h = 160, 160
    sheet = Image.new("RGB", (w * per, h * len(names)), (0, 0, 0))
    for r, name in enumerate(names):
        fr = all_frames[name]
        for c in range(per):
            f = fr[int(c * len(fr) / per)].resize((w, h))
            sheet.paste(f, (c * w, r * h))
    sheet.save(path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*")
    ap.add_argument("--sheet")
    args = ap.parse_args()
    res = build(set(args.names) or None)
    if args.sheet:
        contact_sheet(res, args.sheet)
