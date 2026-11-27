"""Rig de vista frontal (simétrico) para movimentos no plano frontal/transversal."""
from __future__ import annotations

import math

from rig import (EQUIP, EQUIP_DARK, ACCENT, FLOOR, Canvas, NEAR, SHADOW, SHOE, STEEL, STEEL_DARK, FAR, add, ease, ik,
                 tapered, vdown)

G = 552
CX = 320


def _interp(a, b, k):
    out = {}
    for key in set(a) | set(b):
        va, vb = a.get(key, b.get(key)), b.get(key, a.get(key))
        if isinstance(va, (int, float)) and not isinstance(va, bool):
            out[key] = va + (vb - va) * k
        elif isinstance(va, tuple) and va and va[0] == "ik" and isinstance(vb, tuple) and vb[0] == "ik":
            out[key] = ("ik", (va[1][0] + (vb[1][0] - va[1][0]) * k, va[1][1] + (vb[1][1] - va[1][1]) * k), va[2])
        elif (isinstance(va, tuple) and isinstance(vb, tuple) and len(va) == len(vb)
              and all(isinstance(x, (int, float)) for x in va + vb)):
            out[key] = tuple(x + (y - x) * k for x, y in zip(va, vb))
        else:
            out[key] = va if k < 0.5 else vb
    return out


def timeline(keys, trans_default=12):
    frames = []
    for i, key in enumerate(keys):
        pose, hold = key[0], key[1]
        trans = key[2] if len(key) > 2 else trans_default
        frames += [pose] * hold
        nxt = keys[(i + 1) % len(keys)][0]
        frames += [_interp(pose, nxt, ease(s / trans)) for s in range(1, trans)]
    return frames


DEFAULT = dict(cy=354, seated=False, shrug=0, arm=(8, 8), leg=(4, 4), knee=40, hop=0)


def solve(p):
    """Resolve a pose frontal.

    Pernas: ``leg=(a1, a2)`` (ângulos, simétricas) ou ``feet=(xE, xD)`` (tornozelos fixos no chão, IK,
    joelhos para fora). ``cx`` desloca o corpo na horizontal; ``cy`` é a altura do quadril.
    ``hand``: mão por lado em coordenadas absolutas ``{-1: (x, y), 1: (x, y)}`` (opcional, IK)."""
    q = dict(DEFAULT)
    q.update(p)
    cx = q.get("cx", CX)
    cy = q["cy"] - q["hop"]
    sh_y = cy - 120 - q["shrug"] * 0.2
    lean = q.get("lean", 0)          # inclinação lateral do tronco (px no ombro)
    pts = {"cy": cy, "sh_y": sh_y, "cx": cx, "lean": lean,
           "neck": (cx + lean, cy - 120), "head": (cx + lean * 1.25, cy - 160)}
    for s in (-1, 1):
        sh = (cx + lean + s * 50, sh_y - q["shrug"])
        arm = q.get("arm_" + ("l" if s < 0 else "r"), q["arm"])
        if isinstance(arm, tuple) and arm[0] == "ik":
            dx, dy = arm[1]
            tgt = (sh[0] + s * dx, sh[1] + dy)
            el, hd = ik(sh, tgt, 78, 72, arm[2] * -s)
        else:
            a1, a2 = arm
            e = vdown(a1, 78)
            el = add(sh, (s * e[0], e[1]))
            f = vdown(a2, 72)
            hd = add(el, (s * f[0], f[1]))
        hip = (cx + s * 26, cy)
        if q["seated"]:
            knee = (cx + s * q["knee"], cy + 30)
            ankle = (cx + s * (q["knee"] + 6), G - 8)
        elif q.get("feet"):
            fx = q["feet"][0 if s < 0 else 1]
            lift = q.get("lift", (0, 0))[0 if s < 0 else 1]
            knee, ankle = ik(hip, (fx, G - 8 - lift), 100, 98, -s)
        else:
            l1, l2 = q["leg"]
            t = vdown(l1, 100)
            knee = add(hip, (s * t[0], t[1]))
            u = vdown(l2, 98)
            ankle = add(knee, (s * u[0], u[1]))
        pts[s] = dict(sh=sh, el=el, hd=hd, hip=hip, knee=knee, ankle=ankle)
    return pts


def draw(cv: Canvas, P, hl=()):
    CX = P["cx"]
    LN = P["lean"]
    lowest = max(P[-1]["ankle"][1], P[1]["ankle"][1])
    lift = max(0, G - 8 - lowest)
    k = max(0.4, 1 - lift / 200)
    span = abs(P[1]["ankle"][0] - P[-1]["ankle"][0]) / 2 + 50
    mid = (P[-1]["ankle"][0] + P[1]["ankle"][0]) / 2
    cv.d.ellipse([mid - span * k, G - 7 * k, mid + span * k, G + 9 * k], fill=SHADOW)
    for s in (-1, 1):
        p = P[s]
        tapered(cv, p["hip"], p["knee"], 17, 12, NEAR)
        tapered(cv, p["knee"], p["ankle"], 12, 8, NEAR)
        if "quad" in hl:
            mid = lambda a, b, f: (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)  # noqa: E731
            tapered(cv, mid(p["hip"], p["knee"], .15), mid(p["hip"], p["knee"], .85), 10, 8, ACCENT)
        if "glute" in hl:
            cv.circle(add(p["hip"], (s * 14, -4)), 13, ACCENT)
        cv.line(p["ankle"], add(p["ankle"], (s * 18, 3)), 14, SHOE)
    cy, shy = P["cy"], P[1]["sh"][1]
    # tronco: trapézio do ombro ao quadril
    cv.poly([(CX + LN - 52, shy), (CX + LN + 52, shy), (CX + 32, cy), (CX - 32, cy)], NEAR)
    cv.line((CX + LN - 50, shy), (CX + LN + 50, shy), 28, NEAR)
    cv.line((CX - 30, cy), (CX + 30, cy), 26, NEAR)
    if "chest" in hl:
        for s in (-1, 1):
            cv.d.ellipse([CX + s * 6 - (34 if s < 0 else 0), shy + 4, CX + s * 6 + (34 if s > 0 else 0), shy + 44], fill=ACCENT)
    if "abs" in hl:
        cv.rect(CX - 18, shy + 52, CX + 18, cy - 8, ACCENT, radius=10)
    if "trap" in hl:
        cv.poly([(CX - 46, shy - 6), (CX + 46, shy - 6), (CX + 14, shy - 34), (CX - 14, shy - 34)], ACCENT)
    cv.line((CX + LN, shy), P["head"], 20, NEAR)
    cv.circle(P["head"], 27, NEAR)
    for s in (-1, 1):
        p = P[s]
        tapered(cv, p["sh"], p["el"], 13, 9, NEAR)
        tapered(cv, p["el"], p["hd"], 9.5, 7, NEAR)
        cv.circle(p["hd"], 10, NEAR)
        if "delt" in hl:
            cv.circle(p["sh"], 16, ACCENT)


def render(spec):
    poses = timeline(spec["keys"])
    frames = []
    n = len(poses)
    for i, pose in enumerate(poses):
        cv = Canvas()
        cv.floor(G)
        P = solve(pose)
        if spec.get("back"):
            spec["back"](cv, P, i / n)
        draw(cv, P, spec.get("hl", ()))
        if spec.get("front"):
            spec["front"](cv, P, i / n)
        frames.append(cv.frame())
    return frames, spec.get("duration", 60)


# ------------------------------------------------------------------ cenários

def bench_back(cv, P, k):
    cv.rect(236, 446, 404, 470, FAR, radius=8)
    cv.rect(250, 470, 268, G, STEEL_DARK, radius=4)
    cv.rect(372, 470, 390, G, STEEL_DARK, radius=4)


def hold_dumbbells(cv, P, k):
    for s in (-1, 1):
        h = P[s]["hd"]
        cv.circle(add(h, (0, 6)), 20, STEEL_DARK)
        cv.circle(add(h, (0, 6)), 14, STEEL)


def hold_dumbbells_side(cv, P, k):
    for s in (-1, 1):
        h = P[s]["hd"]
        cv.rect(h[0] - 6, h[1] - 26, h[0] + 6, h[1] + 26, STEEL_DARK, radius=5)
        cv.rect(h[0] - 14, h[1] - 30, h[0] + 14, h[1] - 16, STEEL, radius=4)
        cv.rect(h[0] - 14, h[1] + 16, h[0] + 14, h[1] + 30, STEEL, radius=4)
        cv.circle(h, 10, NEAR)


def crossover_back(cv, P, k):
    for x in (54, 586):
        cv.rect(x - 14, 40, x + 14, G, STEEL_DARK, radius=6)
    cv.rect(40, 40, 600, 56, STEEL_DARK, radius=6)


def crossover_front(cv, P, k):
    for s, x in ((-1, 70), (1, 570)):
        pul = (x, 96)
        cv.circle(pul, 12, STEEL)
        cv.line(pul, P[s]["hd"], 5, STEEL)
        cv.circle(P[s]["hd"], 10, NEAR)


def pecdeck_back(cv, P, k):
    bench_back(cv, P, k)
    cv.rect(CX - 60, P["sh_y"] - 90, CX + 60, P["cy"] - 10, FAR, radius=12)
    cv.rect(CX - 10, 40, CX + 10, P["sh_y"] - 90, STEEL_DARK, radius=4)


def pecdeck_front(cv, P, k):
    for s in (-1, 1):
        h = P[s]["hd"]
        cv.rect(h[0] - 12, h[1] - 50, h[0] + 12, h[1] + 30, STEEL_DARK, radius=8)
        cv.line((CX + s * 20, 46), (h[0], h[1] - 50), 8, STEEL_DARK)
        cv.circle(h, 10, NEAR)


def abductor_front(cv, P, k):
    for s in (-1, 1):
        kn = P[s]["knee"]
        cv.rect(kn[0] + s * 14 - 10, kn[1] - 34, kn[0] + s * 14 + 10, kn[1] + 30, STEEL_DARK, radius=8)


def jack_back(cv, P, k):
    pass


def hold_barbell(cv, P, k):
    l, r = P[-1]["hd"], P[1]["hd"]
    cv.line((l[0] - 60, l[1] + 4), (r[0] + 60, r[1] + 4), 8, STEEL)
    for x in (l[0] - 50, r[0] + 50):
        cv.rect(x - 9, l[1] - 34, x + 9, l[1] + 42, EQUIP_DARK, radius=5)
        cv.rect(x - 5, l[1] - 30, x + 5, l[1] + 38, EQUIP, radius=4)
    for s in (-1, 1):
        cv.circle(P[s]["hd"], 10, NEAR)


def topdown_bench(cv, P, k):
    cv.rect(CX - 46, P["sh_y"] - 70, CX + 46, P["cy"] + 40, FAR, radius=14)


def adductor_front(cv, P, k):
    for s in (-1, 1):
        kn = P[s]["knee"]
        cv.rect(kn[0] - s * 14 - 10, kn[1] - 34, kn[0] - s * 14 + 10, kn[1] + 30, STEEL_DARK, radius=8)


def low_cables_front(cv, P, k):
    for s, x in ((-1, 560), (1, 80)):
        pul = (x, 520)
        cv.circle(pul, 11, STEEL)
        cv.line(pul, P[s]["hd"], 5, STEEL)
        cv.circle(P[s]["hd"], 10, NEAR)


def low_cables_back(cv, P, k):
    for x in (60, 580):
        cv.rect(x - 14, 300, x + 14, G, STEEL_DARK, radius=6)


def one_dumbbell(cv, P, k):
    h = P[1]["hd"]
    cv.rect(h[0] - 7, h[1] - 30, h[0] + 7, h[1] + 30, STEEL_DARK, radius=5)
    cv.rect(h[0] - 18, h[1] - 38, h[0] + 18, h[1] - 18, STEEL, radius=5)
    cv.rect(h[0] - 18, h[1] + 18, h[0] + 18, h[1] + 38, STEEL, radius=5)
    cv.circle(h, 11, NEAR)


def kb_between(cv, P, k):
    l, r = P[-1]["hd"], P[1]["hd"]
    c = ((l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 26)
    cv.circle(c, 30, STEEL_DARK)
    cv.circle(c, 21, STEEL)
    cv.line((c[0] - 14, c[1] - 26), (c[0] + 14, c[1] - 26), 7, STEEL_DARK)
    for s in (-1, 1):
        cv.circle(P[s]["hd"], 10, NEAR)


def band_knees(cv, P, k):
    a = P[-1]["knee"]
    b = P[1]["knee"]
    cv.line((a[0] + 6, a[1] + 14), (b[0] - 6, b[1] + 14), 6, ACCENT)


def scroll_floor(cv, P, k):
    off = (k * 200) % 100
    for i in range(-1, 8):
        x = 40 + i * 100 - off
        cv.rect(x, G + 2, x + 46, G + 8, (70, 74, 86), radius=3)


FRONT = {
    "elevacao_lateral": dict(
        keys=[(dict(cy=440, seated=True, arm=(8, 8)), 5, 14), (dict(cy=440, seated=True, arm=(85, 78)), 3, 14)],
        back=bench_back, front=hold_dumbbells, hl=("delt",)),
    "encolhimento": dict(
        keys=[(dict(arm=(6, 6), shrug=0), 4, 10), (dict(arm=(6, 6), shrug=34), 4, 10)],
        front=hold_dumbbells_side, hl=("trap",)),
    "crossover": dict(
        keys=[(dict(arm=("ik", (130, -40), 1)), 4, 14), (dict(arm=("ik", (-38, 120), 1)), 3, 14)],
        back=crossover_back, front=crossover_front, hl=("chest", "delt")),
    "voador": dict(
        keys=[(dict(cy=440, seated=True, arm=("ik", (110, 20), -1)), 4, 14),
              (dict(cy=440, seated=True, arm=("ik", (-22, 20), -1)), 3, 14)],
        back=pecdeck_back, front=pecdeck_front, hl=("chest",)),
    "abdutora": dict(
        keys=[(dict(cy=440, seated=True, knee=34, arm=(14, 30)), 3, 14),
              (dict(cy=440, seated=True, knee=92, arm=(14, 30)), 3, 14)],
        back=bench_back, front=abductor_front, hl=("glute",)),
    "encolhimento_barra": dict(
        keys=[(dict(arm=(4, 4), shrug=0), 4, 10), (dict(arm=(4, 4), shrug=22), 4, 10)],
        front=hold_barbell, hl=("trap",)),
    "crucifixo": dict(
        keys=[(dict(arm=("ik", (140, 6), 1)), 3, 14), (dict(arm=("ik", (-8, -40), 1)), 3, 14)],
        back=topdown_bench, front=hold_dumbbells, hl=("chest",)),
    "elevacao_lateral_cabo": dict(
        keys=[(dict(arm=(-12, -12)), 4, 14), (dict(arm=(84, 78)), 3, 14)],
        back=low_cables_back, front=low_cables_front, hl=("delt",)),
    "crucifixo_invertido": dict(
        keys=[(dict(cy=440, seated=True, arm=("ik", (-6, 110), 1)), 3, 14),
              (dict(cy=440, seated=True, arm=("ik", (128, 40), 1)), 3, 14)],
        back=bench_back, front=hold_dumbbells, hl=("delt", "trap")),
    "cadeira_adutora": dict(
        keys=[(dict(cy=440, seated=True, knee=92, arm=(14, 30)), 3, 14),
              (dict(cy=440, seated=True, knee=34, arm=(14, 30)), 3, 14)],
        back=bench_back, front=adductor_front, hl=("quad",)),
    "polichinelo": dict(
        keys=[(dict(arm=(8, 8), leg=(3, 3), hop=0), 1, 6), (dict(arm=(95, 100), leg=(12, 12), hop=26), 0, 5),
              (dict(arm=(168, 172), leg=(20, 20), hop=0), 1, 6), (dict(arm=(95, 100), leg=(12, 12), hop=26), 0, 5)],
        hl=("delt", "quad"), duration=50),
    "suitcase_carry": dict(
        keys=[(dict(cy=352, feet=(286, 352), lift=(0, 14), lean=-6, arm=(4, 4), arm_l=(10, 30)), 0, 7),
              (dict(cy=354, feet=(290, 350), lift=(0, 0), lean=-6, arm=(4, 4), arm_l=(10, 30)), 0, 7),
              (dict(cy=352, feet=(288, 354), lift=(14, 0), lean=-6, arm=(4, 4), arm_l=(10, 30)), 0, 7),
              (dict(cy=354, feet=(290, 350), lift=(0, 0), lean=-6, arm=(4, 4), arm_l=(10, 30)), 0, 7)],
        back=scroll_floor, front=one_dumbbell, hl=("abs", "trap")),
    "agachamento_sumo": dict(
        keys=[(dict(cy=360, feet=(196, 444), arm=(4, 4), arm_l=("ik", (26, 150), 1), arm_r=("ik", (26, 150), 1)), 3, 14),
              (dict(cy=452, feet=(196, 444), arm=(4, 4), arm_l=("ik", (26, 150), 1), arm_r=("ik", (26, 150), 1)), 3, 14)],
        front=kb_between, hl=("quad", "glute")),
    "afundo_lateral": dict(
        keys=[(dict(cx=320, cy=362, feet=(170, 470), arm=("ik", (-40, 70), 1)), 2, 12),
              (dict(cx=396, cy=444, feet=(170, 470), arm=("ik", (-40, 70), 1)), 3, 12),
              (dict(cx=320, cy=362, feet=(170, 470), arm=("ik", (-40, 70), 1)), 2, 12),
              (dict(cx=244, cy=444, feet=(170, 470), arm=("ik", (-40, 70), 1)), 3, 12)],
        hl=("quad", "glute")),
    "passada_lateral": dict(
        keys=[(dict(cx=300, cy=404, feet=(244, 356), arm=("ik", (-36, 74), 1)), 1, 9),
              (dict(cx=330, cy=400, feet=(244, 416), lift=(0, 12), arm=("ik", (-36, 74), 1)), 0, 7),
              (dict(cx=350, cy=404, feet=(294, 406), lift=(12, 0), arm=("ik", (-36, 74), 1)), 1, 9),
              (dict(cx=320, cy=400, feet=(234, 406), lift=(12, 0), arm=("ik", (-36, 74), 1)), 0, 7)],
        front=band_knees, hl=("glute",)),
    "remada_alta": dict(
        keys=[(dict(arm=("ik", (-34, 146), 1)), 3, 13), (dict(arm=("ik", (-38, 26), 1)), 3, 13)],
        front=hold_barbell, hl=("delt", "trap")),
}
