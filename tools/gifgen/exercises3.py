"""Exercícios de máquina e variações para academia completa (vista lateral)."""
from __future__ import annotations

from exercises import AY, G, STAND_LEGS, bar_on_back, ik, squat_front, torso_angle
from exercises2 import (ST, _bp, _inc, _row_leg, bar_stub, bench, bench_backrest, combine, db_front, db_vertical,
                        flat_bench_back, floor, incline_back, plate_back)
from rig import EQUIP, EQUIP_DARK, FAR, NEAR, STEEL, STEEL_DARK, add


def handle(cv, j, k):
    h = j.hand_n
    cv.rect(h[0] - 6, h[1] - 20, h[0] + 6, h[1] + 20, STEEL_DARK, radius=5)
    cv.circle(h, 10, NEAR)


def machine_arm(pivot):
    def f(cv, j, k):
        cv.line(pivot, j.hand_n, 12, STEEL_DARK)
        cv.circle(pivot, 12, STEEL)
        handle(cv, j, k)
    return f


def column(x, top=50):
    def f(cv, j=None, k=0):
        cv.rect(x - 14, top, x + 14, G, STEEL_DARK, radius=6)
    return f


def cable_from(p):
    def f(cv, j, k):
        cv.circle(p, 11, STEEL)
        cv.line(p, j.hand_n, 5, STEEL)
        cv.circle(j.hand_n, 10, NEAR)
    return f


# ---------------------------------------------------------------- PEITO

_seat = dict(hip=(270, 445), t=-8, leg_n=(88, 0), leg_f=(88, 0))
SUPINO_MAQUINA = dict(
    keys=[(dict(_seat, arm_n=ik(305, 334, 1), arm_f=ik(305, 334, 1)), 3, 13),
          (dict(_seat, arm_n=ik(420, 334, 1), arm_f=ik(420, 334, 1)), 3, 13)],
    back=combine(bench_backrest, column(470, 90)), front=machine_arm((470, 160)), hl=("chest", "tri", "delt"),
)


def decline_back(cv, j, k):
    cv.floor(G)
    cv.line((392, 448), (176, 492), 20, FAR)
    cv.line((300, 470), (300, G), 12, STEEL_DARK)
    cv.circle((420, 488), 14, FAR)
    cv.plate(j.hand_n, 40)


SUPINO_DECLINADO = dict(
    keys=[(dict(hip=(345, 430), t=-100, leg_n=ik(420, 478), leg_f=ik(424, 478), arm_n=ik(236, 300, 1), arm_f=ik(236, 300, 1)), 3, 14),
          (dict(hip=(345, 430), t=-100, leg_n=ik(420, 478), leg_f=ik(424, 478), arm_n=ik(262, 412, 1), arm_f=ik(262, 412, 1)), 2, 14)],
    back=decline_back, front=bar_stub, hl=("chest", "tri"),
)

SUPINO_HALTERES = dict(
    keys=[(dict(_bp, arm_n=ik(234, 305, 1), arm_f=ik(234, 305, 1)), 3, 14),
          (dict(_bp, arm_n=ik(256, 418, 1), arm_f=ik(256, 418, 1)), 2, 14)],
    back=flat_bench_back, front=db_front, hl=("chest", "tri", "delt"),
)


def incline_plate(cv, j, k):
    incline_back(cv, j, k)
    cv.plate(j.hand_n, 38)


SUPINO_INCLINADO_BARRA = dict(
    keys=[(dict(_inc, arm_n=ik(232, 262, 1), arm_f=ik(232, 262, 1)), 3, 14),
          (dict(_inc, arm_n=ik(256, 374, 1), arm_f=ik(256, 374, 1)), 2, 14)],
    back=incline_plate, front=bar_stub, hl=("chest", "delt", "tri"),
)


# ---------------------------------------------------------------- COSTAS

def chest_pad(cv, j, k):
    cv.floor(G)
    cv.rect(180, 456, 330, 472, FAR, radius=8)
    cv.rect(232, 472, 250, G, STEEL_DARK, radius=4)
    cv.rect(318, 300, 344, 420, FAR, radius=10)
    cv.line((331, 420), (360, G), 12, STEEL_DARK)
    column(470, 120)(cv)


_rm = dict(hip=(270, 445), t=6, leg_n=(88, 0), leg_f=(88, 0))
REMADA_MAQUINA = dict(
    keys=[(dict(_rm, arm_n=ik(420, 372, 1), arm_f=ik(420, 372, 1)), 3, 13),
          (dict(_rm, arm_n=ik(312, 382, 1), arm_f=ik(312, 382, 1)), 3, 13)],
    back=chest_pad, front=machine_arm((470, 200)), hl=("back", "bi"),
)


def tbar_back(cv, j, k):
    cv.floor(G)
    cv.line((150, G - 6), add(j.hand_n, (30, 6)), 10, STEEL_DARK)
    cv.circle((150, G - 6), 10, STEEL)
    cv.plate(add(j.hand_n, (30, 6)), 40)


REMADA_CAVALINHO = dict(
    keys=[(dict(ST, t=50, **_row_leg, arm_n=(0, 0), arm_f=(0, 0)), 3, 12),
          (dict(ST, t=50, **_row_leg, arm_n=(-70, 6), arm_f=(-70, 6)), 3, 12)],
    back=tbar_back, front=handle, hl=("back", "bi", "delt"),
)


# ---------------------------------------------------------------- OMBROS

_press = dict(hip=(270, 442), t=-6, leg_n=(88, 0), leg_f=(88, 0))
DESENV_MAQUINA = dict(
    keys=[(dict(_press, arm_n=ik(292, 306, 1), arm_f=ik(292, 306, 1)), 3, 14),
          (dict(_press, arm_n=ik(280, 172, 1), arm_f=ik(280, 172, 1)), 3, 14)],
    back=combine(bench_backrest, column(150, 60)), front=machine_arm((150, 120)), hl=("delt", "tri"),
)


# ---------------------------------------------------------------- PERNAS

def hack_back(cv, j, k):
    cv.floor(G)
    cv.line((150, G), (300, 120), 14, STEEL_DARK)
    d = (j.neck[0] - j.hip[0], j.neck[1] - j.hip[1])
    cv.line(add(j.hip, (-26 - d[0] * 0.15, 6 - d[1] * 0.15)), add(j.neck, (-26 + d[0] * 0.2, 6 + d[1] * 0.2)), 24, FAR)
    cv.poly([(330, AY + 10), (440, AY - 20), (450, AY), (340, G)], STEEL_DARK)


def hack_front(cv, j, k):
    cv.rect(j.neck[0] - 18, j.neck[1] - 18, j.neck[0] + 22, j.neck[1] + 4, FAR, radius=8)


_hk = dict(anchor=("ankle_n", (370, AY - 14)), ft_n=78, ft_f=78, arm_n=(150, 200), arm_f=(150, 200), arms_rel=True)
HACK_SQUAT = dict(
    keys=[(dict(_hk, t=-24, leg_n=(18, 18), leg_f=(18, 18)), 3, 15),
          (dict(_hk, t=-14, leg_n=(100, -14), leg_f=(100, -14)), 3, 15)],
    back=hack_back, front=hack_front, hl=("quad", "glute"),
)


def smith_back(cv, j, k):
    cv.floor(G)
    bar = bar_on_back(j, torso_angle(j))
    for dx in (-6, 6):
        cv.line((bar[0] + dx, 40), (bar[0] + dx, G), 6, STEEL_DARK)
    cv.plate(bar, 46)


_smith = dict(anchor=("ankle_n", (306, AY)), arm_n=(-50, 160), arm_f=(-50, 160), arms_rel=True)
AGACHAMENTO_SMITH = dict(
    keys=[(dict(_smith, t=4, **STAND_LEGS), 5, 15), (dict(_smith, t=30, leg_n=(84, -30), leg_f=(84, -30)), 3, 14)],
    back=smith_back, front=squat_front, hl=("quad", "glute"),
)


def front_rack_back(cv, j, k):
    cv.floor(G)
    cv.plate(add(j.hand_n, (6, 0)), 40)


_fr = dict(anchor=("ankle_n", (300, AY)), arm_n=(95, -110), arm_f=(95, -110), arms_rel=True)
AGACHAMENTO_FRONTAL = dict(
    keys=[(dict(_fr, t=2, **STAND_LEGS), 5, 15), (dict(_fr, t=20, leg_n=(88, -42), leg_f=(88, -42)), 3, 14)],
    back=front_rack_back, front=bar_stub, hl=("quad", "glute", "abs"),
)


# ---------------------------------------------------------------- BRAÇOS

def incline_curl_back(cv, j, k):
    cv.floor(G)
    cv.line((300, 470), (190, 300), 24, FAR)
    cv.rect(260, 460, 340, 476, FAR, radius=8)
    cv.rect(292, 476, 308, G, STEEL_DARK, radius=4)


_ic = dict(hip=(296, 452), t=-34, leg_n=(78, 4), leg_f=(78, 4))
ROSCA_INCLINADA = dict(
    keys=[(dict(_ic, arm_n=(-8, -8), arm_f=(-8, -8)), 3, 13), (dict(_ic, arm_n=(-6, 132), arm_f=(-6, 132)), 3, 13)],
    back=incline_curl_back, front=db_vertical, hl=("bi",),
)

ROSCA_CABO = dict(
    keys=[(dict(ST, t=0, **STAND_LEGS, arm_n=(6, 10), arm_f=(6, 10)), 3, 13),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(12, 150), arm_f=(12, 150)), 3, 13)],
    back=combine(floor, column(420, 300)), front=cable_from((420, 528)), hl=("bi",),
)


def kickback_back(cv, j, k):
    cv.floor(G)
    bench(380, 560, 470)(cv)


_kk = dict(anchor=("ankle_n", (260, AY)), t=72, leg_n=(22, -8), leg_f=(10, -4), arm_f=ik(430, 470, 1))
TRICEPS_COICE = dict(
    keys=[(dict(_kk, arm_n=(-82, 2)), 3, 12), (dict(_kk, arm_n=(-82, -80)), 3, 12)],
    back=kickback_back, front=db_vertical, hl=("tri",),
)


# ---------------------------------------------------------------- CORE

AB_PULLEY = (380, 70)


def cable_crunch_front(cv, j, k):
    cv.circle(AB_PULLEY, 11, STEEL)
    cv.line(AB_PULLEY, j.hand_n, 5, STEEL)
    cv.circle(add(j.hand_n, (0, 8)), 7, EQUIP_DARK)
    cv.circle(j.hand_n, 10, NEAR)


_cc2 = dict(anchor=("knee_n", (300, 538)), leg_n=(0, -90), leg_f=(0, -90), ft_n=-100, ft_f=-100,
            arm_n=(120, -110), arm_f=(120, -110), arms_rel=True)
ABDOMINAL_POLIA = dict(
    keys=[(dict(_cc2, t=12), 3, 12), (dict(_cc2, t=80), 2, 12)],
    back=combine(floor, column(400, 50)), front=cable_crunch_front, hl=("abs",),
)


SIDE3 = {
    "supino_maquina": SUPINO_MAQUINA,
    "supino_declinado": SUPINO_DECLINADO,
    "supino_halteres": SUPINO_HALTERES,
    "supino_inclinado_barra": SUPINO_INCLINADO_BARRA,
    "remada_maquina": REMADA_MAQUINA,
    "remada_cavalinho": REMADA_CAVALINHO,
    "desenvolvimento_maquina": DESENV_MAQUINA,
    "hack_squat": HACK_SQUAT,
    "agachamento_smith": AGACHAMENTO_SMITH,
    "agachamento_frontal": AGACHAMENTO_FRONTAL,
    "rosca_inclinada": ROSCA_INCLINADA,
    "rosca_cabo": ROSCA_CABO,
    "triceps_coice": TRICEPS_COICE,
    "abdominal_polia": ABDOMINAL_POLIA,
}
