"""Cardio/emagrecimento, core, mobilidade, peso corporal e funcional (vista lateral)."""
from __future__ import annotations

import math

from exercises import (AY, BAR_ON_BACK, G, STAND_LEGS, _b_plank, _b_squat, _b_stand, farmer_back, ik, jump_keys,
                       plank_front, squat_back, squat_front, torso_angle, walk_keys)
from exercises2 import ST, bench, combine, db_front, floor, kb_front
from rig import ACCENT, EQUIP, EQUIP_DARK, FAR, NEAR, STEEL, STEEL_DARK, add

# ======================================================================= CARDIO (máquinas)

CRANK = (360, 470)
CR = 34


def bike_back(cv, j, k):
    cv.floor(G)
    cv.line((236, 380), (300, G - 6), 12, STEEL_DARK)          # canote → base traseira
    cv.line((300, G - 6), (470, G - 6), 14, STEEL_DARK)         # base
    cv.line(CRANK, (440, 300), 12, STEEL_DARK)                  # coluna do guidão
    cv.line((236, 380), CRANK, 10, STEEL_DARK)
    cv.rect(206, 372, 270, 386, FAR, radius=7)                 # selim
    cv.circle((470, 470), 56, STEEL_DARK)                      # volante (roda de inércia)
    cv.circle((470, 470), 40, (40, 44, 54))
    cv.line((440, 300), (470, 292), 12, STEEL_DARK)             # guidão


def bike_front(cv, j, k):
    for a in (j.ankle_f, j.ankle_n):
        cv.line(CRANK, a, 7, STEEL)
    cv.circle(CRANK, 12, STEEL)


def _crank_keys(base, n=8, offset=0.0):
    keys = []
    for i in range(n):
        ang = 2 * math.pi * i / n + offset
        pn = (CRANK[0] + CR * math.cos(ang), CRANK[1] + CR * math.sin(ang))
        pf = (CRANK[0] - CR * math.cos(ang), CRANK[1] - CR * math.sin(ang))
        keys.append((dict(base, leg_n=ik(pn[0], pn[1]), leg_f=ik(pf[0], pf[1])), 0, 4))
    return keys


BIKE = dict(
    keys=_crank_keys(dict(hip=(240, 360), t=30, arm_n=ik(462, 292, 1), arm_f=ik(458, 294, 1), ft_n=100, ft_f=100)),
    back=bike_back, front=bike_front, hl=("quad", "glute"), duration=55,
)

ELL_C = (330, 488)


def ell_back(cv, j, k):
    cv.floor(G)
    cv.rect(150, G - 20, 520, G - 4, STEEL_DARK, radius=6)
    cv.line((470, G - 20), (480, 240), 14, STEEL_DARK)
    cv.rect(452, 214, 506, 244, FAR, radius=8)


def ell_front(cv, j, k):
    for a, h, col in ((j.ankle_f, j.hand_f, FAR), (j.ankle_n, j.hand_n, STEEL)):
        cv.rect(a[0] - 30, a[1] + 6, a[0] + 34, a[1] + 14, col, radius=4)
        cv.line((a[0] + 30, a[1] + 10), (476, 340), 7, col)
        cv.line((476, 340), h, 7, col)
    cv.circle((476, 340), 9, STEEL)


def _ell_keys(n=8):
    keys = []
    for i in range(n):
        ang = 2 * math.pi * i / n
        pn = (ELL_C[0] + 46 * math.cos(ang), ELL_C[1] + 12 * math.sin(ang))
        pf = (ELL_C[0] - 46 * math.cos(ang), ELL_C[1] - 12 * math.sin(ang))
        hn = (420 - 26 * math.cos(ang), 330)
        hf = (420 + 26 * math.cos(ang), 330)
        keys.append((dict(hip=(310, 0), anchor=None, t=6, leg_n=ik(*pn), leg_f=ik(*pf), ft_n=90, ft_f=90,
                          arm_n=ik(*hn, 1), arm_f=ik(*hf, 1)), 0, 4))
    return keys


ELIPTICO = dict(
    keys=[(dict(p, hip=(310, 300)), h, t) for p, h, t in _ell_keys()],
    back=ell_back, front=ell_front, hl=("quad", "glute"), duration=55, ground=G - 20,
)

RAIL_Y = 476


def rower_back(cv, j, k):
    cv.floor(G)
    cv.rect(140, RAIL_Y + 8, 470, RAIL_Y + 18, STEEL_DARK, radius=5)
    cv.rect(150, RAIL_Y + 18, 166, G, STEEL_DARK, radius=4)
    cv.circle((520, 470), 50, STEEL_DARK)
    cv.circle((520, 470), 34, (40, 44, 54))
    cv.rect(500, 470, 540, G, STEEL_DARK, radius=6)
    cv.rect(424, 440, 446, RAIL_Y + 8, FAR, radius=4)          # apoio dos pés


def rower_front(cv, j, k):
    cv.rect(j.hip[0] - 34, RAIL_Y - 6, j.hip[0] + 30, RAIL_Y + 8, FAR, radius=6)   # carrinho
    cv.line((500, 446), j.hand_n, 4, STEEL)
    cv.rect(j.hand_n[0] - 5, j.hand_n[1] - 14, j.hand_n[0] + 5, j.hand_n[1] + 14, STEEL_DARK, radius=4)
    cv.circle(j.hand_n, 10, NEAR)


_rw = dict(ft_n=170, ft_f=170)
REMO = dict(
    keys=[(dict(_rw, hip=(318, RAIL_Y - 10), t=28, leg_n=ik(430, 452), leg_f=ik(432, 452),
                arm_n=ik(452, 420, 1), arm_f=ik(450, 420, 1)), 1, 9),
          (dict(_rw, hip=(232, RAIL_Y - 10), t=-4, leg_n=ik(430, 452), leg_f=ik(432, 452),
                arm_n=ik(410, 400, 1), arm_f=ik(408, 400, 1)), 0, 6),
          (dict(_rw, hip=(208, RAIL_Y - 10), t=-20, leg_n=ik(430, 452), leg_f=ik(432, 452),
                arm_n=ik(298, 388, 1), arm_f=ik(296, 388, 1)), 2, 12)],
    back=rower_back, front=rower_front, hl=("back", "quad", "ham"),
)


def stairs_back(cv, j, k):
    cv.floor(G)
    cv.rect(430, 160, 450, G, STEEL_DARK, radius=6)
    cv.line((440, 270), (400, 300), 10, STEEL_DARK)
    off = (k * 3 * 56) % 56
    for i in range(-1, 6):
        y = 300 + i * 56 + off
        if 380 <= y <= G - 10:
            cv.rect(230 + (y - 380) * 0.0, y, 430, y + 14, FAR, radius=4)


ESCADA = dict(
    keys=[(dict(hip=(330, 330), t=10, leg_n=ik(372, 430), leg_f=ik(326, 488), ft_n=90, ft_f=90,
                arm_n=ik(402, 300, 1), arm_f=ik(400, 302, 1)), 1, 7),
          (dict(hip=(330, 324), t=10, leg_n=ik(336, 486), leg_f=ik(366, 430), ft_n=90, ft_f=90,
                arm_n=ik(402, 300, 1), arm_f=ik(400, 302, 1)), 1, 7)],
    back=stairs_back, front=None, hl=("quad", "glute", "calf"), ground=None,
)


def tread_incline(cv, j, k):
    cv.floor(G)
    y0, y1 = 520, 470                     # deck inclinado (esquerda baixa)
    cv.poly([(110, y0), (540, y1), (540, y1 + 22), (110, y0 + 22)], STEEL_DARK)
    off = (k * 200) % 60
    for i in range(-1, 9):
        x = 120 + i * 60 - off
        if 120 <= x <= 510:
            y = y0 + (y1 - y0) * (x - 110) / 430
            cv.line((x, y + 8), (x + 20, y + 8 + (y1 - y0) * 20 / 430), 5, FAR)
    cv.rect(110, y0 + 22, 130, G, STEEL_DARK, radius=4)
    cv.rect(510, y1 + 22, 530, G, STEEL_DARK, radius=4)
    cv.line((530, y1), (560, 290), 14, STEEL_DARK)
    cv.rect(536, 260, 590, 290, FAR, radius=8)


CAMINHADA_INCLINADA = dict(
    keys=walk_keys(10, (-28, 20), (28, 60), ground=497, x=320, hold=0, trans=8),
    back=tread_incline, front=None, hl=("glute", "calf", "ham"), far_offset=(-10, -4),
)

# ======================================================================= CARDIO (peso corporal)

_sk = dict(t=-2, ft_n=100, ft_f=100)
SKIPPING = dict(
    keys=[(dict(_sk, hip=(300, 0), anchor=("ground", G - 12), leg_n=(98, -6), leg_f=(2, -4),
                arm_n=(-40, 40), arm_f=(40, 120)), 0, 5),
          (dict(_sk, hip=(300, 0), anchor=("ground", G - 12), leg_f=(98, -6), leg_n=(2, -4),
                arm_f=(-40, 40), arm_n=(40, 120)), 0, 5)],
    back=floor, front=None, hl=("quad", "calf", "abs"), duration=50,
)

MARCHA = dict(
    keys=[(dict(hip=(300, 0), anchor=("ground", G), t=0, leg_n=(70, -10), leg_f=(0, 0), ft_n=96,
                arm_n=(-30, -10), arm_f=(30, 60)), 1, 10),
          (dict(hip=(300, 0), anchor=("ground", G), t=0, leg_f=(70, -10), leg_n=(0, 0), ft_f=96,
                arm_f=(-30, -10), arm_n=(30, 60)), 1, 10)],
    back=floor, front=None, hl=("quad",),
)

_lg_n = dict(leg_n=ik(395, AY), leg_f=ik(205, 524), ft_f=50, ft_n=90)
_lg_f = dict(leg_f=ik(395, AY), leg_n=ik(205, 524), ft_n=50, ft_f=90)
_jl_arms_a = dict(arm_n=(-30, -20), arm_f=(30, 60))
_jl_arms_b = dict(arm_f=(-30, -20), arm_n=(30, 60))
AFUNDO_SALTO = dict(
    keys=[(dict(_lg_n, hip=(300, 440), t=4, **_jl_arms_a), 2, 6),
          (dict(hip=(300, 300), t=0, leg_n=(30, -10), leg_f=(-20, -30), ft_n=80, ft_f=60, arm_n=(60, 90), arm_f=(60, 90)), 0, 5),
          (dict(_lg_f, hip=(300, 440), t=4, **_jl_arms_b), 2, 6),
          (dict(hip=(300, 300), t=0, leg_f=(30, -10), leg_n=(-20, -30), ft_n=60, ft_f=80, arm_n=(60, 90), arm_f=(60, 90)), 0, 5)],
    back=floor, front=None, hl=("quad", "glute"),
)

_s, _d, _a, _l = jump_keys(tuck=False)
_a = dict(_a, arm_n=(150, 170), arm_f=(146, 166))
AGACHAMENTO_SALTO = dict(
    keys=[(dict(_s, arm_n=(5, 5)), 3, 8), (dict(_d, t=30, leg_n=(80, -36), leg_f=(80, -36), arm_n=(-40, -30), arm_f=(-44, -34)), 1, 5),
          (_a, 1, 6), (_l, 1, 8)],
    back=floor, front=None, hl=("quad", "glute", "calf"),
)

_sprawl_plank = dict(_b_plank, hip=(250, 486), t=82)
SPRAWL = dict(
    keys=[(_b_stand, 3, 7), (_b_squat, 0, 5), (_sprawl_plank, 2, 6), (_b_squat, 0, 7)],
    back=floor, front=None, hl=("quad", "abs", "chest"),
)


def ropes_front(cv, j, k):
    for h, ph, col in ((j.hand_f, math.pi, FAR), (j.hand_n, 0.0, EQUIP)):
        pts = []
        x0, y0 = h
        x1, y1 = 600, 536
        for i in range(17):
            t = i / 16
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t + math.sin(2 * math.pi * (t * 1.6 - k * 4) + ph) * 26 * (1 - t) * min(1, t * 4)
            pts.append((x, y))
        cv.d.line(pts, fill=col, width=7, joint="curve")
        cv.circle(h, 10, NEAR if col == EQUIP else FAR)
    cv.rect(588, 520, 612, G, STEEL_DARK, radius=4)


_br = dict(anchor=("ankle_n", (300, AY)), t=22, leg_n=(52, -28), leg_f=(48, -30), ft_n=90, ft_f=90)
CORDA_NAVAL = dict(
    keys=[(dict(_br, arm_n=ik(400, 340, -1), arm_f=ik(398, 420, -1)), 0, 6),
          (dict(_br, arm_n=ik(400, 420, -1), arm_f=ik(398, 340, -1)), 0, 6)],
    back=floor, front=ropes_front, hl=("delt", "abs", "quad"), duration=50,
)

_bc = dict(hip=(262, 450), t=78, ft_n=0, ft_f=0)
BEAR_CRAWL = dict(
    keys=[(dict(_bc, leg_n=ik(222, AY, 1), leg_f=ik(190, AY, 1), arm_n=ik(392, AY + 2, 1), arm_f=ik(352, AY + 2, 1)), 0, 6),
          (dict(_bc, hip=(262, 444), leg_n=ik(206, AY - 24, 1), leg_f=ik(206, AY, 1), arm_n=ik(372, AY + 2, 1), arm_f=ik(372, AY - 24, 1)), 0, 6),
          (dict(_bc, leg_n=ik(190, AY, 1), leg_f=ik(222, AY, 1), arm_n=ik(352, AY + 2, 1), arm_f=ik(392, AY + 2, 1)), 0, 6),
          (dict(_bc, hip=(262, 444), leg_f=ik(206, AY - 24, 1), leg_n=ik(206, AY, 1), arm_f=ik(372, AY + 2, 1), arm_n=ik(372, AY - 24, 1)), 0, 6)],
    back=farmer_back, front=None, hl=("abs", "delt", "quad"),
)

_bx = dict(anchor=("ankle_n", (330, AY)), t=6, leg_n=(14, -6), leg_f=(-24, -30), ft_n=90, ft_f=70)
_guard = (28, 168)
BOXE_SOMBRA = dict(
    keys=[(dict(_bx, arm_n=_guard, arm_f=_guard), 1, 4), (dict(_bx, t=10, arm_n=(92, 90), arm_f=_guard), 1, 5),
          (dict(_bx, arm_n=_guard, arm_f=_guard), 1, 4), (dict(_bx, t=12, arm_n=_guard, arm_f=(94, 92)), 1, 5)],
    back=floor, front=None, hl=("delt", "abs"), duration=50,
)


def sled_front(cv, j, k):
    h = j.hand_n
    cv.line((h[0], h[1]), (h[0] + 30, G - 30), 10, STEEL_DARK)
    cv.rect(h[0] + 10, G - 44, h[0] + 150, G - 6, STEEL_DARK, radius=6)
    cv.plate((h[0] + 80, G - 70), 34)
    cv.circle(h, 10, NEAR)


TRENO = dict(
    keys=walk_keys(52, ik(420, 384, 1), ik(418, 386, 1), x=280, hold=0, trans=7, big=True),
    back=farmer_back, front=sled_front, hl=("quad", "glute", "calf"), far_offset=(-10, -4),
)

WALL_X = 540


def wall_back(cv, j, k):
    cv.floor(G)
    cv.rect(WALL_X, 40, WALL_X + 40, G, (34, 37, 45), radius=0)
    cv.circle((WALL_X, 130), 22, None, outline=ACCENT, width=6)


def ball_front(cv, j, k):
    c = ((j.hand_n[0] + j.hand_f[0]) / 2 + 14, (j.hand_n[1] + j.hand_f[1]) / 2 - 6)
    cv.circle(c, 28, EQUIP_DARK)
    cv.circle(c, 22, EQUIP)
    cv.circle(j.hand_n, 10, NEAR)


_wb_hold = dict(arm_n=(18, 160), arm_f=(18, 160), arms_rel=True)
WALL_BALL = dict(
    keys=[(dict(ST, t=6, **STAND_LEGS, **_wb_hold), 1, 12),
          (dict(ST, t=28, leg_n=(88, -40), leg_f=(88, -40), **_wb_hold), 1, 7),
          (dict(ST, t=-4, **STAND_LEGS, arm_n=(150, 158), arm_f=(150, 158), anchor=("toe_n", (334, G - 4)), ft_n=40, ft_f=40), 2, 9)],
    back=wall_back, front=ball_front, hl=("quad", "glute", "delt"),
)


def slam_front(cv, j, k):
    c = ((j.hand_n[0] + j.hand_f[0]) / 2 + 6, (j.hand_n[1] + j.hand_f[1]) / 2 + 4)
    c = (c[0], min(c[1], G - 26))
    cv.circle(c, 28, (48, 52, 62))
    cv.circle(c, 22, (78, 84, 98))
    cv.circle(j.hand_n, 10, NEAR)


SLAM_BALL = dict(
    keys=[(dict(ST, t=-6, **STAND_LEGS, arm_n=(172, 178), arm_f=(170, 176), anchor=("toe_n", (334, G - 4)), ft_n=40, ft_f=40), 2, 6),
          (dict(ST, t=52, leg_n=(64, -30), leg_f=(64, -30), arm_n=ik(392, 514, 1), arm_f=ik(390, 514, 1)), 2, 12)],
    back=floor, front=slam_front, hl=("abs", "back", "delt"),
)


def thr_front(cv, j, k):
    cv.dumbbell_side(add(j.hand_n, (0, -2)), 20)
    cv.circle(j.hand_n, 10, NEAR)


_rack = dict(arm_n=(14, 168), arm_f=(14, 168), arms_rel=True)
THRUSTER = dict(
    keys=[(dict(ST, t=22, leg_n=(88, -40), leg_f=(88, -40), **_rack), 2, 7),
          (dict(ST, t=4, **STAND_LEGS, **_rack), 0, 5),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(176, 178), arm_f=(176, 178)), 2, 10),
          (dict(ST, t=4, **STAND_LEGS, **_rack), 0, 8)],
    back=floor, front=thr_front, hl=("quad", "glute", "delt"),
)

# ======================================================================= FUNCIONAL (kettlebell)

KETTLEBELL_CLEAN = dict(
    keys=[(dict(ST, t=58, leg_n=(32, -18), leg_f=(32, -18), arm_n=(-14, -18), arm_f=(-8, -8)), 2, 10),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(10, 10), arm_f=(0, 0)), 0, 5),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(14, 165), arm_f=(0, 0)), 3, 10)],
    back=floor, front=kb_front, hl=("glute", "ham", "delt"),
)


def kb_rack_front(cv, j, k):
    h = j.hand_n
    up = h[1] < j.neck[1] - 40
    c = add(h, (-16, -18) if up else (-20, 0))
    cv.circle(c, 22, STEEL_DARK)
    cv.circle(c, 14, STEEL)
    cv.circle(h, 10, NEAR)


KETTLEBELL_PRESS = dict(
    keys=[(dict(ST, t=0, **STAND_LEGS, arm_n=(14, 165), arm_f=(0, 0)), 3, 13),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(176, 178), arm_f=(0, 0)), 3, 13)],
    back=floor, front=kb_rack_front, hl=("delt", "tri", "abs"),
)

# ======================================================================= CORE

_lie = dict(hip=(330, 524), t=-90)
DEAD_BUG = dict(
    keys=[(dict(_lie, arm_n=(180, 180), arm_f=(180, 180), leg_n=(180, 90), leg_f=(180, 90)), 2, 12),
          (dict(_lie, arm_n=(260, 260), arm_f=(180, 180), leg_n=(180, 90), leg_f=(96, 96)), 2, 12),
          (dict(_lie, arm_n=(180, 180), arm_f=(180, 180), leg_n=(180, 90), leg_f=(180, 90)), 2, 12),
          (dict(_lie, arm_n=(180, 180), arm_f=(260, 260), leg_n=(96, 96), leg_f=(180, 90)), 2, 12)],
    back=floor, front=None, hl=("abs",),
)

_qp = dict(anchor=("knee_n", (262, 538)), t=80, ft_n=-100, ft_f=-100)
_q_legs = dict(leg_n=(0, -90), leg_f=(0, -90))
_q_arms = dict(arm_n=(4, 4), arm_f=(4, 4))
BIRD_DOG = dict(
    keys=[(dict(_qp, **_q_legs, **_q_arms), 2, 12),
          (dict(_qp, leg_n=(0, -90), leg_f=(-88, -88), arm_n=(98, 98), arm_f=(4, 4)), 3, 12),
          (dict(_qp, **_q_legs, **_q_arms), 2, 12),
          (dict(_qp, anchor=("knee_f", (262, 538)), leg_f=(0, -90), leg_n=(-88, -88), arm_f=(98, 98), arm_n=(4, 4)), 3, 12)],
    back=floor, front=None, hl=("abs", "glute", "lowback"),
)

_hh = dict(arm_n=(-116, -116), arm_f=(-116, -116))
HOLLOW_HOLD = dict(
    keys=[(dict(_hh, hip=(330, 530), t=-72, leg_n=(108, 108), leg_f=(108, 108)), 10, 16),
          (dict(_hh, hip=(330, 530), t=-70, leg_n=(111, 111), leg_f=(111, 111)), 10, 16)],
    back=floor, front=plank_front, hl=("abs",),
)


def twist_front(cv, j, k):
    c = ((j.hand_n[0] + j.hand_f[0]) / 2, (j.hand_n[1] + j.hand_f[1]) / 2)
    near = j.hand_n[1] > j.hip[1] - 30
    r = 30 if near else 24
    cv.plate(c, r) if near else (cv.circle(c, r, EQUIP_DARK), cv.circle(c, r - 7, (90, 78, 54)))
    cv.circle(j.hand_n, 10, NEAR)


_rt = dict(hip=(300, 520), t=-42, leg_n=(130, 60), leg_f=(130, 60), ft_n=80, ft_f=80)
RUSSIAN_TWIST = dict(
    keys=[(dict(_rt, arm_n=ik(336, 524, 1), arm_f=ik(332, 524, 1)), 1, 9),
          (dict(_rt, t=-38, arm_n=ik(330, 440, 1), arm_f=ik(326, 440, 1)), 1, 9)],
    back=floor, front=twist_front, hl=("abs",),
)

_bic = dict(hip=(330, 526), t=-64, arm_n=(20, 170), arm_f=(20, 170), arms_rel=True)
ABDOMINAL_BICICLETA = dict(
    keys=[(dict(_bic, leg_n=(196, 84), leg_f=(100, 100)), 1, 9),
          (dict(_bic, leg_f=(196, 84), leg_n=(100, 100)), 1, 9)],
    back=floor, front=None, hl=("abs",),
)

V_UP = dict(
    keys=[(dict(hip=(330, 526), t=-90, arm_n=(270, 270), arm_f=(270, 270), leg_n=(92, 92), leg_f=(92, 92)), 2, 11),
          (dict(hip=(330, 532), t=-34, arm_n=(140, 140), arm_f=(140, 140), leg_n=(144, 144), leg_f=(144, 144)), 2, 11)],
    back=floor, front=None, hl=("abs",),
)

_pk = dict(hip=(255, 440), t=75, leg_n=ik(78, 512), leg_f=ik(74, 512), ft_n=0, ft_f=0)
SHOULDER_TAPS = dict(
    keys=[(dict(_pk, arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1)), 1, 7),
          (dict(_pk, t=76, arm_n=ik(352, 420, 1), arm_f=ik(378, AY + 2, 1)), 2, 7),
          (dict(_pk, arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1)), 1, 7),
          (dict(_pk, t=76, arm_n=ik(380, AY + 2, 1), arm_f=ik(352, 420, 1)), 2, 7)],
    back=floor, front=None, hl=("abs", "delt"),
)

PALLOF_COL = (150, 300)


def pallof_back(cv, j, k):
    cv.floor(G)
    cv.rect(PALLOF_COL[0] - 14, 60, PALLOF_COL[0] + 14, G, (52, 56, 66), radius=6)


def pallof_front(cv, j, k):
    cv.circle(PALLOF_COL, 10, STEEL)
    cv.line(PALLOF_COL, j.hand_n, 4, STEEL)
    cv.rect(j.hand_n[0] - 5, j.hand_n[1] - 12, j.hand_n[0] + 5, j.hand_n[1] + 12, STEEL_DARK, radius=4)
    cv.circle(j.hand_n, 10, NEAR)


_pa = dict(anchor=("ankle_n", (330, AY)), t=4, leg_n=(14, -8), leg_f=(10, -10))
PALLOF_PRESS = dict(
    keys=[(dict(_pa, arm_n=ik(346, 300, 1), arm_f=ik(344, 302, 1)), 2, 12),
          (dict(_pa, arm_n=ik(470, 300, 1), arm_f=ik(468, 302, 1)), 3, 12)],
    back=pallof_back, front=pallof_front, hl=("abs",),
)


def captain_back(cv, j, k):
    cv.floor(G)
    cv.rect(254, 130, 278, 330, FAR, radius=10)              # encosto
    cv.rect(270, 228, 400, 244, STEEL_DARK, radius=6)        # apoio de braço
    cv.rect(240, 110, 256, G, STEEL_DARK, radius=4)
    cv.rect(380, 244, 396, G, STEEL_DARK, radius=4)


_cap = dict(hip=(294, 340), t=0, arm_n=(0, 90), arm_f=(0, 90), ft_n=60, ft_f=60)
ELEV_JOELHOS_PARALELA = dict(
    keys=[(dict(_cap, leg_n=(4, 2), leg_f=(2, 0)), 3, 13), (dict(_cap, leg_n=(112, 8), leg_f=(110, 6)), 2, 13)],
    back=captain_back, front=None, hl=("abs",),
)

_fk = dict(hip=(330, 524), t=-88, arm_n=(88, 88), arm_f=(88, 88))
FLUTTER_KICKS = dict(
    keys=[(dict(_fk, leg_n=(102, 102), leg_f=(118, 118)), 0, 5), (dict(_fk, leg_n=(118, 118), leg_f=(102, 102)), 0, 5)],
    back=floor, front=None, hl=("abs",), duration=55,
)

# ======================================================================= MOBILIDADE


def catcow_front(cv, j, k):
    t = torso_angle(j)
    bump = max(0.0, min(1.0, (84 - t) / 12))
    if bump > 0.05:
        mid = ((j.hip[0] + j.neck[0]) / 2, (j.hip[1] + j.neck[1]) / 2 - 10 - 16 * bump)
        cv.circle(mid, 14 + 8 * bump, ACCENT)


GATO_VACA = dict(
    keys=[(dict(_qp, t=72, head_tilt=34, **_q_legs, **_q_arms), 3, 16),
          (dict(_qp, t=86, head_tilt=-34, **_q_legs, **_q_arms), 3, 16)],
    back=floor, front=catcow_front, hl=("abs", "lowback"),
)

_cp = dict(anchor=("knee_n", (340, 540)), leg_n=(70, -90), leg_f=(70, -90), ft_n=-100, ft_f=-100, head_tilt=10)
CRIANCA = dict(
    keys=[(dict(_cp, t=98, arm_n=(102, 96), arm_f=(102, 96)), 12, 18), (dict(_cp, t=95, arm_n=(100, 94), arm_f=(100, 94)), 12, 18)],
    back=floor, front=None, hl=("lowback", "back"),
)

_cb = dict(hip=(250, 530), leg_n=(-90, -90), leg_f=(-90, -90), ft_n=-96, ft_f=-96)
COBRA = dict(
    keys=[(dict(_cb, t=86, arm_n=ik(352, AY + 2, 1), arm_f=ik(348, AY + 2, 1)), 3, 16),
          (dict(_cb, t=38, head_tilt=-16, arm_n=ik(352, AY + 2, 1), arm_f=ik(348, AY + 2, 1)), 6, 16)],
    back=floor, front=None, hl=("abs", "lowback"),
)

ALONG_POSTERIOR = dict(
    keys=[(dict(ST, t=78, leg_n=(18, -4), leg_f=(18, -4), arm_n=(-4, -4), arm_f=(-4, -4), head_tilt=10), 10, 16),
          (dict(ST, t=86, leg_n=(22, -6), leg_f=(22, -6), arm_n=(-2, -2), arm_f=(-2, -2), head_tilt=12), 10, 16)],
    back=floor, front=None, hl=("ham", "calf"),
)


def wall_side(x):
    def f(cv, j, k):
        cv.floor(G)
        cv.rect(x, 40, x + 40, G, (34, 37, 45), radius=0)
    return f


_qs = dict(anchor=("ankle_f", (300, AY)), t=2, leg_f=(0, 0), ft_n=150, arm_f=ik(452, 300, 1))
ALONG_QUADRICEPS = dict(
    keys=[(dict(_qs, leg_n=(-22, -170), arm_n=ik(247, 348, -1)), 10, 16),
          (dict(_qs, leg_n=(-28, -172), arm_n=ik(241, 343, -1)), 10, 16)],
    back=wall_side(470), front=None, hl=("quad",),
)

def kneel(knee, a, **kw):
    """Pose ajoelhada sobre o joelho de trás: quadril calculado a partir do joelho e do ângulo da coxa."""
    hip = (knee[0] - 100 * math.sin(math.radians(a)), knee[1] - 100 * math.cos(math.radians(a)))
    return dict(kw, hip=hip, leg_f=(a, -90), ft_f=-100)


_hf = dict(leg_n=ik(392, AY), ft_n=90, arm_n=(174, 178), arm_f=(170, 176))
ALONG_FLEXOR = dict(
    keys=[(kneel((236, 538), -14, t=-2, **_hf), 4, 18), (kneel((236, 538), -34, t=-8, **_hf), 8, 18)],
    back=floor, front=None, hl=("quad", "glute", "abs"),
)

POST_X = 210


def post_back(cv, j, k):
    cv.floor(G)
    cv.rect(POST_X - 14, 120, POST_X + 14, G, (52, 56, 66), radius=6)


_pe = dict(anchor=("ankle_n", (330, AY)), leg_n=(8, -4), leg_f=(-10, -12), arm_f=(4, 4))
ALONG_PEITORAL = dict(
    keys=[(dict(_pe, t=2, arm_n=ik(POST_X + 14, 236, 1)), 8, 16), (dict(_pe, t=10, arm_n=ik(POST_X + 14, 240, 1)), 10, 16)],
    back=post_back, front=None, hl=("chest", "delt"),
)

AGACH_PROFUNDO = dict(
    keys=[(dict(ST, t=30, leg_n=(104, -26), leg_f=(104, -26), arm_n=(40, 150), arm_f=(40, 150), arms_rel=True), 10, 16),
          (dict(ST, t=24, leg_n=(102, -28), leg_f=(102, -28), arm_n=(44, 150), arm_f=(44, 150), arms_rel=True), 10, 16)],
    back=floor, front=None, hl=("quad", "glute"),
)

ROTACAO_TORACICA = dict(
    keys=[(dict(_qp, **_q_legs, arm_n=(8, 150), arm_f=(4, 4), head_tilt=20), 3, 15),
          (dict(_qp, t=76, **_q_legs, arm_n=(186, 300), arm_f=(4, 4), head_tilt=-30), 4, 15)],
    back=floor, front=None, hl=("back", "delt"),
)

_an = dict(leg_n=ik(380, AY), ft_n=90, arm_n=ik(466, 356, 1), arm_f=ik(464, 358, 1))
MOBILIDADE_TORNOZELO = dict(
    keys=[(kneel((250, 538), -6, t=6, **_an), 3, 13), (kneel((250, 538), -28, t=8, **_an), 3, 13)],
    back=wall_side(470), front=None, hl=("calf",),
)

# ======================================================================= PESO CORPORAL

_pu = dict(leg_n=ik(78, 512), leg_f=ik(74, 512), ft_n=0, ft_f=0)
FLEXAO_DIAMANTE = dict(
    keys=[(dict(_pu, hip=(255, 440), t=75, arm_n=ik(366, AY + 2, 1), arm_f=ik(364, AY + 2, 1)), 3, 13),
          (dict(_pu, hip=(262, 488), t=85, arm_n=ik(366, AY + 2, 1), arm_f=ik(364, AY + 2, 1)), 2, 13)],
    back=floor, front=None, hl=("tri", "chest"),
)

INC_TOP = 452


def inc_bench(cv, j, k):
    cv.floor(G)
    bench(360, 500, INC_TOP)(cv)


_pi = dict(leg_n=ik(86, AY), leg_f=ik(82, AY), ft_n=0, ft_f=0)
FLEXAO_INCLINADA = dict(
    keys=[(dict(_pi, hip=(234, 418), t=50, arm_n=ik(420, INC_TOP - 2, 1), arm_f=ik(416, INC_TOP - 2, 1)), 3, 13),
          (dict(_pi, hip=(252, 440), t=60, arm_n=ik(420, INC_TOP - 2, 1), arm_f=ik(416, INC_TOP - 2, 1)), 2, 13)],
    back=inc_bench, front=None, hl=("chest", "tri"),
)

_kn = dict(anchor=("knee_n", (220, 538)), ft_n=-150, ft_f=-150)
FLEXAO_JOELHOS = dict(
    keys=[(dict(_kn, t=56, leg_n=(-56, -150), leg_f=(-56, -150), arm_n=ik(392, AY + 2, 1), arm_f=ik(388, AY + 2, 1)), 3, 13),
          (dict(_kn, t=74, leg_n=(-74, -150), leg_f=(-74, -150), arm_n=ik(392, AY + 2, 1), arm_f=ik(388, AY + 2, 1)), 2, 13)],
    back=floor, front=None, hl=("chest", "tri"),
)

_pk2 = dict(leg_n=ik(232, AY), leg_f=ik(228, AY), ft_n=60, ft_f=60)
PIKE_PUSHUP = dict(
    keys=[(dict(_pk2, hip=(290, 356), t=132, arm_n=ik(436, AY + 2, 1), arm_f=ik(432, AY + 2, 1)), 3, 13),
          (dict(_pk2, hip=(306, 366), t=160, arm_n=ik(436, AY + 2, 1), arm_f=ik(432, AY + 2, 1)), 2, 13)],
    back=floor, front=None, hl=("delt", "tri"),
)

LOW_BAR = (392, 330)


def lowbar_back(cv, j, k):
    cv.floor(G)
    cv.rect(LOW_BAR[0] - 8, LOW_BAR[1] - 6, LOW_BAR[0] + 8, G, (52, 56, 66), radius=4)


def lowbar_front(cv, j, k):
    cv.circle(LOW_BAR, 9, STEEL)
    cv.circle(j.hand_n, 10, NEAR)


_ir = dict(leg_n=ik(110, AY), leg_f=ik(106, AY), ft_n=170, ft_f=170)
REMADA_INVERTIDA = dict(
    keys=[(dict(_ir, hip=(250, 498), t=72, arm_n=ik(*LOW_BAR, 1), arm_f=ik(*LOW_BAR, 1)), 2, 13),
          (dict(_ir, hip=(262, 440), t=55, arm_n=ik(*LOW_BAR, 1), arm_f=ik(*LOW_BAR, 1)), 3, 13)],
    back=lowbar_back, front=lowbar_front, hl=("back", "bi"),
)

_ws = dict(hip=(262, 447), arm_n=(60, 100), arm_f=(60, 100), leg_n=(90, 0), leg_f=(90, 0), ft_n=90, ft_f=90)
CADEIRA_ISOMETRICA = dict(
    keys=[(dict(_ws, t=0), 10, 16), (dict(_ws, t=1, hip=(262, 446)), 10, 16)],
    back=combine(wall_side(196), plank_front), front=None, hl=("quad", "glute"),
)

GOOD_MORNING = dict(
    keys=[(dict(ST, t=0, leg_n=(4, -2), leg_f=(4, -2), **BAR_ON_BACK), 3, 15),
          (dict(ST, t=74, leg_n=(18, -8), leg_f=(18, -8), **BAR_ON_BACK), 3, 15)],
    back=squat_back, front=squat_front, hl=("ham", "glute", "lowback"),
)


def nordic_back(cv, j, k):
    cv.floor(G)
    cv.rect(100, 490, 150, G, STEEL_DARK, radius=6)
    cv.rect(96, 510, 152, 526, FAR, radius=8)


_nd = dict(anchor=("knee_n", (240, 540)), ft_n=-100, ft_f=-100, arm_n=(30, 120), arm_f=(30, 120), arms_rel=True)
FLEXAO_NORDICA = dict(
    keys=[(dict(_nd, t=0, leg_n=(0, -90), leg_f=(0, -90)), 2, 22), (dict(_nd, t=58, leg_n=(-58, -90), leg_f=(-58, -90)), 2, 12)],
    back=nordic_back, front=None, hl=("ham",),
)

_pg = dict(leg_f=ik(428, AY), arm_n=(80, 86), arm_f=(80, 86), ft_n=90, ft_f=90)
PONTE_UNILATERAL = dict(
    keys=[(dict(_pg, hip=(316, 522), t=-86, leg_n=(110, 110)), 3, 13), (dict(_pg, hip=(316, 470), t=-111, leg_n=(111, 111)), 4, 13)],
    back=floor, front=None, hl=("glute", "ham"),
)

# ======================================================================= PERNAS / GLÚTEOS

_ra = dict(arm_n=(3, 3), arm_f=(-3, -3))
AFUNDO_REVERSO = dict(
    keys=[(dict(_ra, hip=(356, 350), t=2, leg_n=ik(360, AY), leg_f=ik(352, AY)), 4, 9),
          (dict(_ra, hip=(346, 352), t=4, leg_n=ik(360, AY), leg_f=ik(282, 500), ft_f=40), 0, 8),
          (dict(_ra, hip=(320, 440), t=6, leg_n=ik(368, AY), leg_f=ik(206, 524), ft_f=50), 4, 12),
          (dict(_ra, hip=(346, 352), t=4, leg_n=ik(360, AY), leg_f=ik(282, 500), ft_f=40), 0, 8)],
    back=floor, front=db_front, hl=("quad", "glute"),
)

COICE_QUATRO_APOIOS = dict(
    keys=[(dict(_qp, **_q_legs, **_q_arms), 2, 12),
          (dict(_qp, anchor=("knee_f", (262, 538)), leg_f=(0, -90), leg_n=(-104, -186), **_q_arms), 3, 12)],
    back=floor, front=None, hl=("glute", "ham"),
)


def ychest_back(cv, j, k):
    cv.floor(G)
    cv.line((206, 470), (330, 330), 22, FAR)                   # banco inclinado
    cv.line((250, 440), (250, G), 12, STEEL_DARK)
    cv.line((206, 470), (190, G), 12, STEEL_DARK)


_yr = dict(anchor=("ankle_n", (212, AY)), t=46, leg_n=(-20, -6), leg_f=(-24, -10), ft_n=80, ft_f=80)
ELEVACAO_Y = dict(
    keys=[(dict(_yr, arm_n=(10, 10), arm_f=(8, 8)), 3, 13), (dict(_yr, arm_n=(132, 132), arm_f=(128, 128)), 3, 13)],
    back=ychest_back, front=db_front, hl=("delt", "trap", "back"),
)

# ======================================================================= INICIANTE / BAIXO IMPACTO

from rig import solve as _solve  # noqa: E402

_ac_low = dict(ST, t=34, leg_n=(84, -36), leg_f=(84, -36), arm_n=(86, 86), arm_f=(86, 86))
_hip_low = _solve(_ac_low).hip
CHAIR = (_hip_low[0] - 110, _hip_low[0] + 80, _hip_low[1] + 24)       # x0, x1, assento


def chair_back(cv, j, k):
    cv.floor(G)
    x0, x1, y = CHAIR
    cv.rect(x0, y, x1 - 60, y + 16, FAR, radius=6)
    cv.rect(x0, y - 150, x0 + 16, y + 16, FAR, radius=6)
    cv.rect(x0 + 2, y + 16, x0 + 16, G, STEEL_DARK, radius=4)
    cv.rect(x1 - 76, y + 16, x1 - 62, G, STEEL_DARK, radius=4)


AGACHAMENTO_CADEIRA = dict(
    keys=[(dict(ST, t=4, **STAND_LEGS, arm_n=(86, 86), arm_f=(86, 86)), 3, 15),
          (_ac_low, 3, 15)],
    back=chair_back, front=None, hl=("quad", "glute"),
)

STEP_A = (360, 500, 500)   # x0, topo, x1


def aerobic_step(cv, j, k):
    cv.floor(G)
    x0, top, x1 = STEP_A
    cv.rect(x0, top, x1, G - 2, (60, 66, 80), radius=8)
    cv.rect(x0 + 8, top, x1 - 8, top + 10, FAR, radius=5)


_sa2 = dict(arm_n=(10, 20), arm_f=(-10, -10))
STEP_AEROBICO = dict(
    keys=[(dict(_sa2, hip=(300, 349), t=2, leg_n=ik(304, AY), leg_f=ik(298, AY)), 1, 9),
          (dict(_sa2, hip=(330, 330), t=8, leg_n=ik(410, STEP_A[1] - 7), leg_f=ik(298, AY), arm_n=(40, 90)), 0, 8),
          (dict(_sa2, hip=(414, 303), t=2, leg_n=ik(418, STEP_A[1] - 7), leg_f=ik(412, STEP_A[1] - 7)), 2, 9),
          (dict(_sa2, hip=(380, 330), t=-2, leg_n=ik(418, STEP_A[1] - 7), leg_f=ik(304, AY), arm_f=(40, 90)), 0, 8)],
    back=aerobic_step, front=None, hl=("quad", "glute", "calf"),
)


SIDE4 = {
    "bike_ergometrica": BIKE,
    "eliptico": ELIPTICO,
    "remo_ergometro": REMO,
    "escada": ESCADA,
    "caminhada_inclinada": CAMINHADA_INCLINADA,
    "skipping": SKIPPING,
    "marcha_estacionaria": MARCHA,
    "afundo_salto": AFUNDO_SALTO,
    "agachamento_salto": AGACHAMENTO_SALTO,
    "sprawl": SPRAWL,
    "corda_naval": CORDA_NAVAL,
    "bear_crawl": BEAR_CRAWL,
    "boxe_sombra": BOXE_SOMBRA,
    "treno": TRENO,
    "wall_ball": WALL_BALL,
    "slam_ball": SLAM_BALL,
    "thruster": THRUSTER,
    "kettlebell_clean": KETTLEBELL_CLEAN,
    "kettlebell_press": KETTLEBELL_PRESS,
    "dead_bug": DEAD_BUG,
    "bird_dog": BIRD_DOG,
    "hollow_hold": HOLLOW_HOLD,
    "russian_twist": RUSSIAN_TWIST,
    "abdominal_bicicleta": ABDOMINAL_BICICLETA,
    "v_up": V_UP,
    "shoulder_taps": SHOULDER_TAPS,
    "pallof_press": PALLOF_PRESS,
    "elevacao_joelhos_paralela": ELEV_JOELHOS_PARALELA,
    "flutter_kicks": FLUTTER_KICKS,
    "gato_vaca": GATO_VACA,
    "crianca": CRIANCA,
    "cobra": COBRA,
    "alongamento_posterior": ALONG_POSTERIOR,
    "alongamento_quadriceps": ALONG_QUADRICEPS,
    "alongamento_flexor": ALONG_FLEXOR,
    "alongamento_peitoral": ALONG_PEITORAL,
    "agachamento_profundo": AGACH_PROFUNDO,
    "rotacao_toracica": ROTACAO_TORACICA,
    "mobilidade_tornozelo": MOBILIDADE_TORNOZELO,
    "flexao_diamante": FLEXAO_DIAMANTE,
    "flexao_inclinada": FLEXAO_INCLINADA,
    "flexao_joelhos": FLEXAO_JOELHOS,
    "pike_pushup": PIKE_PUSHUP,
    "remada_invertida": REMADA_INVERTIDA,
    "cadeira_isometrica": CADEIRA_ISOMETRICA,
    "good_morning": GOOD_MORNING,
    "flexao_nordica": FLEXAO_NORDICA,
    "ponte_unilateral": PONTE_UNILATERAL,
    "afundo_reverso": AFUNDO_REVERSO,
    "coice_quatro_apoios": COICE_QUATRO_APOIOS,
    "elevacao_y": ELEVACAO_Y,
    "agachamento_cadeira": AGACHAMENTO_CADEIRA,
    "step_aerobico": STEP_AEROBICO,
}
