"""Rig 2D simples (vista lateral e frontal) para gerar GIFs de exercícios.

Convenções (coordenadas de tela, y para baixo, figura olhando para a direita):
- Tronco ``t``: graus a partir da vertical para cima; positivo = inclina para frente (+x).
- Membros (ângulos absolutos): graus a partir de "apontando para baixo";
  positivo = gira para frente (+x). 90 = horizontal para frente, 180 = para cima.
- Um membro pode ser dado por ângulos ``(a1, a2)`` ou por IK ``("ik", (x, y), dobra)``,
  onde ``dobra`` (+1/-1) escolhe o lado em que o joelho/cotovelo fica.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from PIL import Image, ImageDraw

# Tudo é desenhado em 2x e reduzido no final (antialias).
SS = 2
W = H = 320 * SS

BG = (21, 22, 27)
FLOOR = (52, 55, 64)
NEAR = (236, 233, 228)
FAR = (120, 124, 136)
ACCENT = (226, 69, 79)
ACCENT_FAR = (140, 52, 60)
EQUIP = (201, 162, 39)
EQUIP_DARK = (120, 98, 30)
STEEL = (150, 156, 168)
STEEL_DARK = (88, 92, 102)

L = dict(torso=120, neck=10, head=27, ua=78, fa=72, th=100, sh=98, ft=34)
THICK = dict(torso=34, ua=22, fa=19, th=27, sh=22, ft=13)


def rad(a):
    return math.radians(a)


def vdown(a, length):
    """Vetor de um membro com ângulo absoluto ``a`` (0 = para baixo)."""
    return (math.sin(rad(a)) * length, math.cos(rad(a)) * length)


def vup(t, length):
    return (math.sin(rad(t)) * length, -math.cos(rad(t)) * length)


def add(p, v):
    return (p[0] + v[0], p[1] + v[1])


def sub(p, q):
    return (p[0] - q[0], p[1] - q[1])


def lerp(a, b, k):
    return a + (b - a) * k


def ik(root, target, a, b, bend):
    dx, dy = target[0] - root[0], target[1] - root[1]
    d = math.hypot(dx, dy)
    d = max(min(d, a + b - 0.01), abs(a - b) + 0.01)
    base = math.atan2(dy, dx)
    cos_alpha = (a * a + d * d - b * b) / (2 * a * d)
    alpha = math.acos(max(-1.0, min(1.0, cos_alpha)))
    ang = base + bend * alpha
    joint = (root[0] + a * math.cos(ang), root[1] + a * math.sin(ang))
    # A extremidade fica na direção do alvo, na distância alcançável.
    end_dir = math.atan2(target[1] - joint[1], target[0] - joint[0])
    end = (joint[0] + b * math.cos(end_dir), joint[1] + b * math.sin(end_dir))
    return joint, end


def is_ik(spec):
    return isinstance(spec, tuple) and len(spec) == 3 and spec[0] == "ik"


def limb(root, spec, la, lb):
    if is_ik(spec):
        return ik(root, spec[1], la, lb, spec[2])
    a1, a2 = spec
    j = add(root, vdown(a1, la))
    e = add(j, vdown(a2, lb))
    return j, e


@dataclass
class Joints:
    hip: tuple
    neck: tuple
    head: tuple
    elbow_n: tuple
    hand_n: tuple
    elbow_f: tuple
    hand_f: tuple
    knee_n: tuple
    ankle_n: tuple
    knee_f: tuple
    ankle_f: tuple
    toe_n: tuple
    toe_f: tuple

    def translate(self, d):
        for k, v in self.__dict__.items():
            setattr(self, k, add(v, d))
        return self


DEFAULT = dict(
    hip=(300, 354), t=0, arm_n=(0, 0), arm_f=(0, 0), leg_n=(0, 0), leg_f=(0, 0),
    ft_n=90, ft_f=90, head_tilt=0, arms_rel=False,
)


def solve(pose):
    p = dict(DEFAULT)
    p.update(pose)
    hip = p["hip"]
    t = p["t"]
    neck = add(hip, vup(t, L["torso"]))
    head = add(neck, vup(t + p["head_tilt"], L["neck"] + L["head"]))

    def arm(spec):
        if not is_ik(spec) and p["arms_rel"]:
            spec = (spec[0] + t, spec[1] + t)
        return limb(neck, spec, L["ua"], L["fa"])

    en, hn = arm(p["arm_n"])
    ef, hf = arm(p["arm_f"])
    kn, an = limb(hip, p["leg_n"], L["th"], L["sh"])
    kf, af = limb(hip, p["leg_f"], L["th"], L["sh"])
    tn = add(an, vdown(p["ft_n"], L["ft"]))
    tf = add(af, vdown(p["ft_f"], L["ft"]))
    j = Joints(hip, neck, head, en, hn, ef, hf, kn, an, kf, af, tn, tf)

    anchor = p.get("anchor")
    if anchor:
        name, target = anchor
        if name == "ground":
            # Mantém o x do quadril e apoia o ponto mais baixo do pé no chão.
            low = max(j.ankle_n[1] + 6, j.ankle_f[1] + 6, j.toe_n[1] + 4, j.toe_f[1] + 4)
            j.translate((0, target - low))
        else:
            cur = getattr(j, name)
            j.translate(sub(target, cur))
    return j


# ---------------------------------------------------------------- interpolação

def _interp_value(a, b, k):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return lerp(a, b, k)
    if is_ik(a) and is_ik(b):
        return ("ik", (lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k)), a[2] if k < 0.5 else b[2])
    if isinstance(a, tuple) and isinstance(b, tuple) and len(a) == len(b) and not is_ik(a):
        return tuple(_interp_value(x, y, k) for x, y in zip(a, b))
    return a if k < 0.5 else b


def _limb_to_ik(pose, key, other_bend):
    """Converte um membro por ângulos em alvo IK (posição da extremidade)."""
    j = solve(pose)
    end = {"arm_n": j.hand_n, "arm_f": j.hand_f, "leg_n": j.ankle_n, "leg_f": j.ankle_f}[key]
    return ("ik", end, other_bend)


def interp(pa, pb, k):
    a = dict(DEFAULT)
    a.update(pa)
    b = dict(DEFAULT)
    b.update(pb)
    same_anchor = (a.get("anchor") and b.get("anchor") and a["anchor"][0] == b["anchor"][0])
    if not same_anchor:
        # Resolve as âncoras e interpola a posição absoluta do quadril.
        ja, jb = solve(a), solve(b)
        a = dict(a, hip=ja.hip, anchor=None)
        b = dict(b, hip=jb.hip, anchor=None)
        # Alvos IK absolutos não mudam; ângulos idem.
    for key in ("arm_n", "arm_f", "leg_n", "leg_f"):
        if is_ik(a[key]) != is_ik(b[key]):
            if is_ik(a[key]):
                b[key] = _limb_to_ik(b, key, a[key][2])
            else:
                a[key] = _limb_to_ik(a, key, b[key][2])
    out = {}
    for key in set(a) | set(b):
        if key == "anchor":
            if same_anchor:
                out[key] = (a[key][0], _interp_value(a[key][1], b[key][1], k))
            continue
        out[key] = _interp_value(a.get(key), b.get(key), k)
    return out


def ease(k):
    return 0.5 - 0.5 * math.cos(math.pi * k)


def timeline(keys, fps_frames=8):
    """keys: lista de (pose, hold, trans). Retorna lista de (pose, índice_quadro)."""
    frames = []
    n = len(keys)
    for i, key in enumerate(keys):
        pose, hold = key[0], key[1]
        trans = key[2] if len(key) > 2 else fps_frames
        for _ in range(hold):
            frames.append(pose)
        nxt = keys[(i + 1) % n][0]
        for s in range(1, trans):
            frames.append(interp(pose, nxt, ease(s / trans)))
    return frames


# ------------------------------------------------------------------- desenho

class Canvas:
    def __init__(self):
        self.img = Image.new("RGB", (W, H), BG)
        self.d = ImageDraw.Draw(self.img)

    def line(self, a, b, w, color):
        self.d.line([a, b], fill=color, width=int(w))
        r = w / 2
        for p in (a, b):
            self.d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color)

    def circle(self, c, r, fill, outline=None, width=0):
        self.d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=fill, outline=outline, width=width)

    def rect(self, x0, y0, x1, y1, fill, radius=6):
        self.d.rounded_rectangle([min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)], radius=radius, fill=fill)

    def poly(self, pts, fill):
        self.d.polygon(pts, fill=fill)

    def floor(self, y, x0=30, x1=W - 30):
        self.rect(x0, y, x1, y + 10, FLOOR, radius=5)

    def plate(self, c, r=50):
        self.circle(c, r, EQUIP_DARK)
        self.circle(c, r - 9, EQUIP)
        self.circle(c, 9, STEEL_DARK)

    def dumbbell_side(self, c, r=22):
        self.circle(c, r, STEEL_DARK)
        self.circle(c, r - 6, STEEL)

    def frame(self):
        return self.img.resize((W // SS, H // SS), Image.LANCZOS)


SKIN = NEAR
SKIN_FAR = FAR
SHOE = (60, 64, 76)
SHOE_FAR = (44, 47, 56)
SHADOW = (14, 15, 19)

# Raios (início, fim) de cada segmento: dá volume à figura.
RADII = dict(torso=(17, 23), th=(16, 11), sh=(12, 7), ua=(12, 9), fa=(9.5, 7))

# Músculos destacáveis: segmento, lado ('front'/'back'), trecho [a, b] e escala do raio.
MUSCLES = {
    "chest": ("torso", "front", 0.55, 0.92, 0.62),
    "abs": ("torso", "front", 0.10, 0.55, 0.55),
    "back": ("torso", "back", 0.35, 0.92, 0.66),
    "lowback": ("torso", "back", 0.05, 0.40, 0.5),
    "trap": ("torso", "back", 0.82, 1.04, 0.5),
    "quad": ("th", "front", 0.12, 0.86, 0.66),
    "ham": ("th", "back", 0.14, 0.86, 0.62),
    "calf": ("sh", "back", 0.10, 0.55, 0.78),
    "shin": ("sh", "front", 0.10, 0.70, 0.55),
    "bi": ("ua", "front", 0.18, 0.88, 0.66),
    "tri": ("ua", "back", 0.15, 0.88, 0.66),
    "fa": ("fa", "front", 0.05, 0.70, 0.66),
}
LEGACY = {"th": ("quad",), "sh": ("calf",), "ua": ("bi",), "fa": ("fa",), "torso": ("chest", "abs")}


def _unit(v):
    n = math.hypot(v[0], v[1]) or 1.0
    return (v[0] / n, v[1] / n)


def tapered(cv, a, b, ra, rb, color):
    """Membro com espessura variável (cone com pontas arredondadas)."""
    d = _unit(sub(b, a))
    nrm = (-d[1], d[0])
    pts = [add(a, (nrm[0] * ra, nrm[1] * ra)), add(b, (nrm[0] * rb, nrm[1] * rb)),
           add(b, (-nrm[0] * rb, -nrm[1] * rb)), add(a, (-nrm[0] * ra, -nrm[1] * ra))]
    cv.poly(pts, color)
    cv.circle(a, ra, color)
    cv.circle(b, rb, color)


def _segment_points(j, seg, near):
    sfx = "n" if near else "f"
    return {
        "torso": (j.hip, j.neck),
        "th": (j.hip, getattr(j, "knee_" + sfx)),
        "sh": (getattr(j, "knee_" + sfx), getattr(j, "ankle_" + sfx)),
        "ua": (j.neck, getattr(j, "elbow_" + sfx)),
        "fa": (getattr(j, "elbow_" + sfx), getattr(j, "hand_" + sfx)),
    }[seg]


def _muscle(cv, j, name, near, offset):
    seg, side, ka, kb, sc = MUSCLES[name]
    a, b = _segment_points(j, seg, near)
    a, b = add(a, offset), add(b, offset)
    d = _unit(sub(b, a))
    # "frente" do segmento: tronco usa (-dy, dx); membros (dy, -dx)
    front = (-d[1], d[0]) if seg == "torso" else (d[1], -d[0])
    sign = 1 if side == "front" else -1
    ra, rb = RADII[seg]
    pa = (a[0] + (b[0] - a[0]) * ka, a[1] + (b[1] - a[1]) * ka)
    pb = (a[0] + (b[0] - a[0]) * kb, a[1] + (b[1] - a[1]) * kb)
    r1 = (ra + (rb - ra) * ka) * sc
    r2 = (ra + (rb - ra) * kb) * sc
    shift = lambda p, r: add(p, (front[0] * sign * r * 0.32, front[1] * sign * r * 0.32))  # noqa: E731
    tapered(cv, shift(pa, r1), shift(pb, r2), r1, r2, ACCENT if near else ACCENT_FAR)


def _special(cv, j, name, near, offset):
    if name == "delt":
        c = add(j.neck, offset)
        cv.circle(add(c, (0, 4)), 13, ACCENT if near else ACCENT_FAR)
    elif name == "glute":
        d = _unit(sub(j.neck, j.hip))
        back = (d[1], -d[0])  # oposto da frente do tronco
        c = add(add(j.hip, offset), (back[0] * 11 + d[0] * 4, back[1] * 11 + d[1] * 4))
        cv.circle(c, 14, ACCENT if near else ACCENT_FAR)


def shadow(cv, j, ground):
    xs = [j.ankle_n[0], j.ankle_f[0], j.toe_n[0], j.toe_f[0], j.hip[0]]
    low = max(j.ankle_n[1], j.ankle_f[1], j.toe_n[1], j.toe_f[1], j.hip[1], j.hand_n[1])
    lift = max(0.0, ground - low - 10)
    k = max(0.35, 1 - lift / 260)
    cx = (min(xs) + max(xs)) / 2
    half = ((max(xs) - min(xs)) / 2 + 40) * k
    cv.d.ellipse([cx - half, ground - 7 * k, cx + half, ground + 9 * k], fill=SHADOW)


def draw_figure(cv: Canvas, j: Joints, hl=(), far_offset=(0, 0), ground=None):
    """Desenha a figura com volume e destaca os músculos em ``hl``.

    Nomes: chest, abs, back, lowback, trap, quad, ham, calf, shin, bi, tri, fa, delt, glute.
    """
    names = []
    for h in hl:
        names.extend(LEGACY.get(h, (h,)))
    o = far_offset
    fo = lambda p: add(p, o)  # noqa: E731
    if ground is not None:
        shadow(cv, j, ground)

    def leg(near):
        sfx = "n" if near else "f"
        off = (0, 0) if near else o
        knee, ankle, toe = (add(getattr(j, k + sfx), off) for k in ("knee_", "ankle_", "toe_"))
        hip = add(j.hip, off)
        skin = SKIN if near else SKIN_FAR
        tapered(cv, hip, knee, *RADII["th"], skin)
        tapered(cv, knee, ankle, *RADII["sh"], skin)
        cv.line(ankle, toe, 14, SHOE if near else SHOE_FAR)
        cv.circle(add(ankle, _scale(_unit(sub(ankle, toe)), 3)), 8, SHOE if near else SHOE_FAR)

    def arm(near):
        sfx = "n" if near else "f"
        off = (0, 0) if near else o
        sh = add(j.neck, off)
        el, hd = add(getattr(j, "elbow_" + sfx), off), add(getattr(j, "hand_" + sfx), off)
        skin = SKIN if near else SKIN_FAR
        tapered(cv, sh, el, *RADII["ua"], skin)
        tapered(cv, el, hd, *RADII["fa"], skin)
        cv.circle(hd, 10, skin)

    def muscles(near, segs):
        off = (0, 0) if near else o
        for n in names:
            if n in MUSCLES and MUSCLES[n][0] in segs:
                _muscle(cv, j, n, near, off)
            elif n == "glute" and "torso" in segs:
                _special(cv, j, n, near, off)
            elif n == "delt" and "ua" in segs:
                _special(cv, j, n, near, off)

    leg(False); muscles(False, ("th", "sh"))  # noqa: E702
    arm(False); muscles(False, ("ua", "fa"))  # noqa: E702
    tapered(cv, j.hip, j.neck, *RADII["torso"], SKIN)
    muscles(True, ("torso",))
    # pescoço + cabeça
    cv.line(j.neck, add(j.neck, _scale(_unit(sub(j.head, j.neck)), 16)), 16, SKIN)
    cv.circle(j.head, L["head"], SKIN)
    leg(True); muscles(True, ("th", "sh"))  # noqa: E702
    arm(True); muscles(True, ("ua", "fa"))  # noqa: E702


def _scale(v, k):
    return (v[0] * k, v[1] * k)


def save_gif(frames, path, duration=60):
    # Paleta única tirada de vários quadros, para as cores não "piscarem".
    sample = frames[:: max(1, len(frames) // 6)][:6]
    w, h = sample[0].size
    montage = Image.new("RGB", (w * len(sample), h))
    for i, f in enumerate(sample):
        montage.paste(f, (i * w, 0))
    pal_src = montage.quantize(colors=48, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal_src, dither=Image.Dither.NONE) for f in frames]
    q[0].save(path, save_all=True, append_images=q[1:], duration=duration, loop=0, optimize=True, disposal=1)
