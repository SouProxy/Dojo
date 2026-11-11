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


def draw_figure(cv: Canvas, j: Joints, hl=(), far_offset=(0, 0)):
    """Desenha a figura. ``hl`` = segmentos destacados: torso, ua, fa, th, sh."""
    def col(seg, near=True):
        if seg in hl:
            return ACCENT if near else ACCENT_FAR
        return NEAR if near else FAR

    o = far_offset
    fo = lambda p: add(p, o)  # noqa: E731
    # membros de trás
    cv.line(fo(j.hip), fo(j.knee_f), THICK["th"], col("th", False))
    cv.line(fo(j.knee_f), fo(j.ankle_f), THICK["sh"], col("sh", False))
    cv.line(fo(j.ankle_f), fo(j.toe_f), THICK["ft"], FAR)
    cv.line(fo(j.neck), fo(j.elbow_f), THICK["ua"], col("ua", False))
    cv.line(fo(j.elbow_f), fo(j.hand_f), THICK["fa"], col("fa", False))
    # tronco e cabeça
    cv.line(j.hip, j.neck, THICK["torso"], col("torso"))
    cv.circle(j.head, L["head"], NEAR)
    # membros da frente
    cv.line(j.hip, j.knee_n, THICK["th"], col("th"))
    cv.line(j.knee_n, j.ankle_n, THICK["sh"], col("sh"))
    cv.line(j.ankle_n, j.toe_n, THICK["ft"], NEAR)
    cv.line(j.neck, j.elbow_n, THICK["ua"], col("ua"))
    cv.line(j.elbow_n, j.hand_n, THICK["fa"], col("fa"))
    cv.circle(j.hand_n, 11, NEAR)


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
