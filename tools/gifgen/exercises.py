"""Definição das animações de cada exercício (poses-chave + cenário)."""
from __future__ import annotations

import math

from rig import (ACCENT, EQUIP, EQUIP_DARK, FAR, FLOOR, NEAR, STEEL, STEEL_DARK, THICK, L,
                 add, vdown, vup)

G = 552          # linha do chão (topo do piso)
AY = G - 7       # altura do tornozelo com o pé apoiado

STAND_LEGS = dict(leg_n=(0, 0), leg_f=(0, 0))
BAR_ON_BACK = dict(arm_n=(-50, 160), arm_f=(-50, 160), arms_rel=True)


def ik(x, y, bend=-1):
    return ("ik", (x, y), bend)


def bar_on_back(j, t):
    up = vup(t, 1)
    back = (-math.cos(math.radians(t)), -math.sin(math.radians(t)))
    return (j.neck[0] - up[0] * 6 + back[0] * 22, j.neck[1] - up[1] * 6 + back[1] * 22)


def torso_angle(j):
    dx, dy = j.neck[0] - j.hip[0], j.neck[1] - j.hip[1]
    return math.degrees(math.atan2(dx, -dy))


def floor(cv, *_):
    cv.floor(G)


# --------------------------------------------------------------- agachamento

def squat_back(cv, j, k):
    cv.floor(G)
    cv.plate(bar_on_back(j, torso_angle(j)), 46)


def squat_front(cv, j, k):
    c = bar_on_back(j, torso_angle(j))
    cv.circle(c, 10, STEEL)


AGACHAMENTO = dict(
    keys=[
        (dict(anchor=("ankle_n", (300, AY)), t=4, **STAND_LEGS, **BAR_ON_BACK), 6, 16),
        (dict(anchor=("ankle_n", (300, AY)), t=42, leg_n=(82, -38), leg_f=(82, -38), **BAR_ON_BACK), 3, 14),
    ],
    back=squat_back, front=squat_front, hl=("th",),
)


# ------------------------------------------------------------------ leg press

LP_HIP = (230, 440)
LP_DIR = (math.cos(math.radians(-45)), math.sin(math.radians(-45)))


def lp_point(d):
    return (LP_HIP[0] + LP_DIR[0] * d, LP_HIP[1] + LP_DIR[1] * d)


def legpress_back(cv, j, k):
    cv.floor(G)
    # trilho diagonal
    a, b = lp_point(60), lp_point(330)
    cv.line(add(a, (14, 14)), add(b, (14, 14)), 14, STEEL_DARK)
    # base / assento
    cv.poly([(110, G), (330, G), (300, 470), (150, 470)], STEEL_DARK)
    back_a = add(LP_HIP, vup(-60, -10))
    back_b = add(LP_HIP, vup(-60, 150))
    cv.line(add(back_a, (-14, 10)), add(back_b, (-14, 10)), 26, FAR)
    cv.rect(150, 452, 290, 470, FAR, radius=8)


def legpress_front(cv, j, k):
    # plataforma perpendicular às pernas, onde está o pé
    c = j.ankle_n
    perp = (-LP_DIR[1], LP_DIR[0])
    p1 = (c[0] + perp[0] * -70 + LP_DIR[0] * 18, c[1] + perp[1] * -70 + LP_DIR[1] * 18)
    p2 = (c[0] + perp[0] * 70 + LP_DIR[0] * 18, c[1] + perp[1] * 70 + LP_DIR[1] * 18)
    cv.line(p1, p2, 16, STEEL)
    cv.plate(add(c, (LP_DIR[0] * 70 - 30, LP_DIR[1] * 70 - 30)), 40)


_lp = dict(hip=LP_HIP, t=-60, arm_n=(30, 75), arm_f=(30, 75), ft_n=-135, ft_f=-135)
LEG_PRESS = dict(
    keys=[
        (dict(_lp, leg_n=ik(*lp_point(192)), leg_f=ik(*lp_point(192))), 4, 14),
        (dict(_lp, leg_n=ik(*lp_point(108)), leg_f=ik(*lp_point(108))), 3, 14),
    ],
    back=legpress_back, front=legpress_front, hl=("th",),
)


# ------------------------------------------------------------ remada no cabo

ROW_PULLEY = (472, 455)


def row_back(cv, j, k):
    cv.floor(G)
    cv.rect(486, 150, 530, G, STEEL_DARK, radius=8)          # coluna
    for i in range(6):
        cv.rect(492, 360 + i * 22, 524, 378 + i * 22, EQUIP_DARK, radius=3)
    cv.rect(150, 478, 330, 494, FAR, radius=8)               # banco
    cv.rect(230, 494, 250, G, STEEL_DARK, radius=4)
    cv.rect(428, 380, 442, G, STEEL_DARK, radius=4)           # apoio dos pés


def row_front(cv, j, k):
    cv.line(ROW_PULLEY, j.hand_n, 5, STEEL)
    cv.circle(ROW_PULLEY, 12, STEEL)
    cv.line(add(j.hand_n, (0, -14)), add(j.hand_n, (0, 14)), 10, STEEL_DARK)


_row = dict(hip=(230, 465), leg_n=ik(418, 452), leg_f=ik(418, 452), ft_n=172, ft_f=172)
REMADA_CABO = dict(
    keys=[
        (dict(_row, t=20, arm_n=ik(398, 425, 1), arm_f=ik(398, 425, 1)), 4, 14),
        (dict(_row, t=-8, arm_n=ik(285, 430, 1), arm_f=ik(285, 430, 1)), 4, 14),
    ],
    back=row_back, front=row_front, hl=("ua", "torso"),
)


# ------------------------------------------------------------ afundo andando

def dumbbells_front(cv, j, k):
    cv.dumbbell_side(add(j.hand_n, (0, 8)), 22)


_lunge_arms = dict(arm_n=(3, 3), arm_f=(-3, -3))
AFUNDO = dict(
    keys=[
        (dict(hip=(290, 352), t=3, leg_n=ik(296, AY), leg_f=ik(284, AY), **_lunge_arms), 5, 9),
        (dict(hip=(300, 348), t=3, leg_n=ik(365, 505), leg_f=ik(284, AY), **_lunge_arms), 0, 8),
        (dict(hip=(300, 440), t=6, leg_n=ik(395, AY), leg_f=ik(205, 524), ft_f=50, **_lunge_arms), 4, 12),
        (dict(hip=(300, 348), t=3, leg_n=ik(365, 505), leg_f=ik(284, AY), **_lunge_arms), 0, 8),
    ],
    back=floor, front=dumbbells_front, hl=("th",),
)


# ------------------------------------------------------------------ barra fixa

BAR = (310, 128)


def pullup_back(cv, j, k):
    cv.floor(G)
    cv.rect(BAR[0] - 160, 40, BAR[0] + 160, 56, STEEL_DARK, radius=6)
    cv.line((BAR[0], 56), BAR, 10, STEEL_DARK)


def pullup_front(cv, j, k):
    cv.circle(BAR, 13, STEEL)
    cv.circle(j.hand_n, 11, NEAR)


def pullup_weighted_front(cv, j, k):
    belt = add(j.hip, (6, 6))
    plate_c = add(belt, (14, 92))
    cv.line(belt, add(plate_c, (0, -30)), 5, STEEL)
    cv.plate(plate_c, 34)
    pullup_front(cv, j, k)


_hang = dict(anchor=("hand_n", BAR), leg_n=(15, -40), leg_f=(12, -48))
_pull_keys = [
    (dict(_hang, t=-4, arm_n=(178, 178), arm_f=(178, 178)), 4, 14),
    (dict(_hang, t=-6, arm_n=(15, 170), arm_f=(15, 170)), 3, 14),
]
BARRA_FIXA = dict(keys=_pull_keys, back=pullup_back, front=pullup_front, hl=("ua", "torso"))
BARRA_CARGA = dict(keys=_pull_keys, back=pullup_back, front=pullup_weighted_front, hl=("ua", "torso"))


# ----------------------------------------------------------------- puxada alta

PD_PULLEY = (300, 62)


def pulldown_back(cv, j, k):
    cv.floor(G)
    cv.rect(392, 40, 418, G, STEEL_DARK, radius=6)
    cv.rect(260, 40, 418, 58, STEEL_DARK, radius=6)
    cv.rect(190, 458, 330, 474, FAR, radius=8)   # assento
    cv.rect(250, 474, 270, G, STEEL_DARK, radius=4)


def pulldown_front(cv, j, k):
    cv.line(PD_PULLEY, j.hand_n, 5, STEEL)
    cv.circle(PD_PULLEY, 12, STEEL)
    cv.circle(j.hand_n, 12, STEEL_DARK)
    cv.circle(j.hand_n, 9, NEAR)
    cv.rect(j.knee_n[0] - 30, j.knee_n[1] - 40, j.knee_n[0] + 18, j.knee_n[1] - 20, FAR, radius=9)


_pd = dict(hip=(270, 445), leg_n=(88, 0), leg_f=(88, 0))
PUXADA_ALTA = dict(
    keys=[
        (dict(_pd, t=-12, arm_n=ik(304, 172, 1), arm_f=ik(304, 172, 1)), 4, 14),
        (dict(_pd, t=-22, arm_n=ik(286, 322, 1), arm_f=ik(286, 322, 1)), 3, 14),
    ],
    back=pulldown_back, front=pulldown_front, hl=("ua", "torso"),
)


# -------------------------------------------------------------------- paralelas

DIP_HAND = (310, 330)


def dips_back(cv, j, k):
    cv.floor(G)
    for x in (200, 420):
        cv.rect(x - 8, DIP_HAND[1] + 8, x + 8, G, STEEL_DARK, radius=4)


def dips_front(cv, j, k):
    cv.line((180, DIP_HAND[1] + 12), (440, DIP_HAND[1] + 12), 14, STEEL)
    cv.circle(j.hand_n, 11, NEAR)


_dip = dict(anchor=("hand_n", DIP_HAND), leg_n=(14, -62), leg_f=(10, -70))
PARALELAS = dict(
    keys=[
        (dict(_dip, t=6, arm_n=(0, 0), arm_f=(0, 0)), 4, 14),
        (dict(_dip, t=24, arm_n=(-75, 40), arm_f=(-75, 40)), 3, 14),
    ],
    back=dips_back, front=dips_front, hl=("ua",),
)


# --------------------------------------------------------------- rosca direta

def curl_front(cv, j, k):
    cv.plate(j.hand_n, 40)


ROSCA_DIRETA = dict(
    keys=[
        (dict(anchor=("ankle_n", (300, AY)), t=0, **STAND_LEGS, arm_n=(6, 8), arm_f=(6, 8)), 4, 13),
        (dict(anchor=("ankle_n", (300, AY)), t=-2, **STAND_LEGS, arm_n=(12, 152), arm_f=(12, 152)), 3, 13),
    ],
    back=floor, front=curl_front, hl=("ua",),
)


# --------------------------------------------------------------- tríceps corda

TRI_PULLEY = (404, 92)


def triceps_back(cv, j, k):
    cv.floor(G)
    cv.rect(418, 60, 446, G, STEEL_DARK, radius=6)


def triceps_front(cv, j, k):
    cv.circle(TRI_PULLEY, 12, STEEL)
    cv.line(TRI_PULLEY, j.hand_n, 5, STEEL)
    cv.line(j.hand_n, add(j.hand_n, (4, 22)), 9, EQUIP)
    cv.circle(add(j.hand_n, (4, 24)), 8, EQUIP_DARK)


_tri = dict(anchor=("ankle_n", (290, AY)), t=14, leg_n=(8, -4), leg_f=(8, -4))
TRICEPS_CORDA = dict(
    keys=[
        (dict(_tri, arm_n=(14, 128), arm_f=(14, 128)), 3, 12),
        (dict(_tri, arm_n=(10, 6), arm_f=(10, 6)), 4, 12),
    ],
    back=triceps_back, front=triceps_front, hl=("ua",),
)


# ---------------------------------------------------------- terra com trap bar

def trap_front(cv, j, k):
    cv.plate(add(j.hand_n, (0, 4)), 54)
    cv.line(add(j.hand_n, (-14, 0)), add(j.hand_n, (14, 0)), 9, STEEL)
    cv.circle(j.hand_n, 11, NEAR)


TERRA_TRAP = dict(
    keys=[
        (dict(anchor=("ankle_n", (300, AY)), t=46, leg_n=(70, -25), leg_f=(70, -25), arm_n=(0, 0), arm_f=(0, 0)), 3, 15),
        (dict(anchor=("ankle_n", (300, AY)), t=0, **STAND_LEGS, arm_n=(0, 0), arm_f=(0, 0)), 4, 15),
    ],
    back=floor, front=trap_front, hl=("th", "torso"),
)


# ------------------------------------------------------------- búlgaro c/ barra

def bulgarian_back(cv, j, k):
    squat_back(cv, j, k)
    cv.rect(100, 476, 236, 496, FAR, radius=8)
    cv.rect(120, 496, 136, G, STEEL_DARK, radius=4)
    cv.rect(200, 496, 216, G, STEEL_DARK, radius=4)


_bulg = dict(leg_n=ik(362, AY), leg_f=ik(196, 462), ft_f=-96, **BAR_ON_BACK)
BULGARO = dict(
    keys=[
        (dict(_bulg, hip=(292, 372), t=10), 5, 14),
        (dict(_bulg, hip=(286, 452), t=18), 3, 14),
    ],
    back=bulgarian_back, front=squat_front, hl=("th",),
)


# -------------------------------------------------------------- saltos

def jump_keys(x0=300, air=(300, 228), land=None, land_ground=G, tuck=True):
    stand = dict(hip=(x0, 0), anchor=("ground", G), t=0, **STAND_LEGS, arm_n=(5, 5), arm_f=(0, 0))
    dip = dict(hip=(x0 - 6, 0), anchor=("ground", G), t=36, leg_n=(66, -30), leg_f=(66, -30),
               arm_n=(-62, -50), arm_f=(-66, -54))
    airp = dict(hip=air, t=10, leg_n=(125, -5) if tuck else (40, -20), leg_f=(118, -12) if tuck else (30, -30),
                arm_n=(80, 115), arm_f=(74, 108))
    lx = land if land is not None else x0
    landp = dict(hip=(lx, 0), anchor=("ground", land_ground), t=40, leg_n=(76, -36), leg_f=(76, -36),
                 arm_n=(55, 85), arm_f=(50, 80))
    return stand, dip, airp, landp


_s, _d, _a, _l = jump_keys()
SALTO_GRUPADO = dict(
    keys=[(_s, 4, 9), (_d, 1, 5), (_a, 2, 6), (_l, 1, 9)],
    back=floor, front=None, hl=("th", "sh"),
)

BOX = (392, 430, 536)   # x0, topo, x1


def box_back(cv, j, k):
    cv.floor(G)
    x0, top, x1 = BOX
    cv.rect(x0, top, x1, G, EQUIP_DARK, radius=8)
    cv.rect(x0 + 10, top + 10, x1 - 10, G - 2, EQUIP, radius=6)
    cv.rect(x0 + 40, top + 40, x1 - 40, top + 58, EQUIP_DARK, radius=6)


_s2, _d2, _a2, _l2 = jump_keys(x0=250, air=(370, 236), land=455, land_ground=BOX[1])
_top = dict(hip=(462, 0), anchor=("ground", BOX[1]), t=0, **STAND_LEGS, arm_n=(5, 5), arm_f=(0, 0))
SALTO_CAIXOTE = dict(
    keys=[(_s2, 4, 9), (_d2, 1, 5), (_a2, 1, 6), (_l2, 1, 8), (_top, 4, 9)],
    back=box_back, front=None, hl=("th", "sh"),
)


# ------------------------------------------------------ desenvolvimento sentado

def press_back(cv, j, k):
    cv.floor(G)
    cv.rect(180, 456, 330, 472, FAR, radius=8)
    cv.line((214, 456), (204, 236), 26, FAR)
    cv.rect(232, 472, 250, G, STEEL_DARK, radius=4)


def press_back_plate(cv, j, k):
    press_back(cv, j, k)
    cv.plate(j.hand_n, 36)


def press_front(cv, j, k):
    cv.circle(j.hand_n, 10, STEEL)
    cv.circle(j.hand_n, 11, NEAR)


_press = dict(hip=(270, 442), t=-6, leg_n=(88, 0), leg_f=(88, 0))
DESENVOLVIMENTO = dict(
    keys=[
        (dict(_press, arm_n=ik(292, 306, 1), arm_f=ik(292, 306, 1)), 3, 14),
        (dict(_press, arm_n=ik(274, 170, 1), arm_f=ik(274, 170, 1)), 3, 14),
    ],
    back=press_back_plate, front=press_front, hl=("ua",),
)


# --------------------------------------------- supino c/ halteres em ponte

def floorpress_front(cv, j, k):
    c = j.hand_n
    cv.line(add(c, (-24, 0)), add(c, (24, 0)), 8, STEEL)
    cv.dumbbell_side(add(c, (-22, 0)), 18)
    cv.dumbbell_side(add(c, (22, 0)), 18)


_fp = dict(hip=(316, 470), t=-111, leg_n=ik(422, AY), leg_f=ik(426, AY), ft_n=90, ft_f=90)
SUPINO_PONTE = dict(
    keys=[
        (dict(_fp, arm_n=(70, 180), arm_f=(70, 180)), 3, 14),
        (dict(_fp, arm_n=(176, 178), arm_f=(176, 178)), 3, 14),
    ],
    back=floor, front=floorpress_front, hl=("ua", "torso"),
)


# --------------------------------------------------------------------- prancha

def plank_front(cv, j, k):
    # cronômetro circular no canto
    c, r = (540, 120), 46
    cv.circle(c, r, None, outline=FLOOR, width=10)
    extent = 360 * k
    cv.d.arc([c[0] - r, c[1] - r, c[0] + r, c[1] + r], -90, -90 + max(extent, 1), fill=ACCENT, width=10)
    cv.line(c, (c[0] + math.sin(math.radians(extent)) * 28, c[1] - math.cos(math.radians(extent)) * 28), 6, NEAR)


_pl = dict(t=80, leg_n=(-79, -79), leg_f=(-79, -79), ft_n=10, ft_f=10, arm_n=(0, 90), arm_f=(0, 90))
PRANCHA = dict(
    keys=[(dict(_pl, hip=(300, 480)), 10, 16), (dict(_pl, hip=(300, 476)), 10, 16)],
    back=floor, front=plank_front, hl=("torso",),
)


# ------------------------------------------------------------- abdominal infra

_ab = dict(arm_n=(90, 90), arm_f=(90, 90))
ABDOMINAL_INFRA = dict(
    keys=[
        (dict(_ab, hip=(340, 525), t=-90, leg_n=(98, 98), leg_f=(98, 98)), 3, 14),
        (dict(_ab, hip=(336, 514), t=-84, leg_n=(186, 150), leg_f=(186, 150)), 3, 14),
    ],
    back=floor, front=None, hl=("torso",),
)


# -------------------------------------------------------------- farmer's carry

def farmer_back(cv, j, k):
    cv.floor(G)
    off = (k * 220) % 110
    for i in range(-1, 7):
        x = 40 + i * 110 - off
        cv.rect(x, G + 2, x + 50, G + 8, (70, 74, 86), radius=3)


def farmer_front(cv, j, k):
    c = add(j.hand_n, (0, 16))
    cv.rect(c[0] - 26, c[1] - 6, c[0] + 26, c[1] + 6, STEEL_DARK, radius=4)
    cv.dumbbell_side(add(c, (0, 8)), 28)
    cv.circle(j.hand_n, 11, NEAR)


def walk_keys(t, arms_n, arms_f, ground=G, x=300, hold=1, trans=6, big=False):
    s = 1.6 if big else 1.0
    a = dict(leg_n=(26 * s, 8 * s), leg_f=(-22 * s, -36 * s), ft_n=96, ft_f=60)
    b = dict(leg_n=(4, -2), leg_f=(16 * s, -55 * s), ft_n=90, ft_f=70)
    c = dict(leg_n=(-22 * s, -36 * s), leg_f=(26 * s, 8 * s), ft_n=60, ft_f=96)
    d = dict(leg_n=(16 * s, -55 * s), leg_f=(4, -2), ft_n=70, ft_f=90)
    keys = []
    for i, legs in enumerate((a, b, c, d)):
        an, af = (arms_n, arms_f) if i in (0, 1) else (arms_f, arms_n)
        if isinstance(an, list):
            an, af = an[i], af[i]
        keys.append((dict(hip=(x, 0), anchor=("ground", ground), t=t, arm_n=an, arm_f=af, **legs), hold, trans))
    return keys


FARMER = dict(
    keys=walk_keys(3, (2, 2), (-2, -2)),
    back=farmer_back, front=farmer_front, hl=("fa",), far_offset=(-10, -4),
)


# ------------------------------------------------------------- tiro na esteira

DECK = 498


def tread_back(cv, j, k):
    cv.floor(G)
    cv.poly([(110, DECK), (540, DECK), (548, DECK + 24), (100, DECK + 24)], STEEL_DARK)
    off = (k * 260) % 65
    for i in range(-1, 9):
        x = 110 + i * 65 - off
        if 110 <= x <= 520:
            cv.rect(x, DECK + 6, x + 22, DECK + 12, FAR, radius=3)
    cv.rect(110, DECK + 24, 130, G, STEEL_DARK, radius=4)
    cv.rect(510, DECK + 24, 530, G, STEEL_DARK, radius=4)
    cv.line((530, DECK), (560, 300), 14, STEEL_DARK)
    cv.line((560, 300), (500, 300), 12, STEEL_DARK)
    cv.rect(536, 270, 590, 300, FAR, radius=8)


ESTEIRA = dict(
    keys=walk_keys(12, [(-45, 40), (0, 80), (45, 140), (0, 80)], [(45, 140), (0, 80), (-45, 40), (0, 80)],
                   ground=DECK, x=320, hold=0, trans=5, big=True),
    back=tread_back, front=None, hl=("th", "sh"), duration=45, far_offset=(-10, -4),
)


# ---------------------------------------------------------------------- burpee

_b_stand = dict(hip=(300, 356), t=0, leg_n=ik(302, AY), leg_f=ik(298, AY), arm_n=(5, 5), arm_f=(0, 0))
_b_squat = dict(hip=(280, 470), t=60, leg_n=ik(306, AY), leg_f=ik(302, AY),
                arm_n=ik(392, AY + 2, 1), arm_f=ik(388, AY + 2, 1))
_b_plank = dict(hip=(255, 440), t=75, leg_n=ik(78, 512), leg_f=ik(74, 512), ft_n=0, ft_f=0,
                arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1))
_b_jump = dict(hip=(300, 282), t=-3, leg_n=ik(300, 485), leg_f=ik(298, 485), ft_n=30, ft_f=30,
               arm_n=(170, 178), arm_f=(166, 176))
BURPEE = dict(
    keys=[(_b_stand, 3, 8), (_b_squat, 1, 6), (_b_plank, 3, 6), (_b_squat, 1, 7), (_b_jump, 2, 8)],
    back=floor, front=None, hl=("th", "torso"),
)


# ---------------------------------------------------------------------- flexão

_pu = dict(leg_n=ik(78, 512), leg_f=ik(74, 512), ft_n=0, ft_f=0)
FLEXAO = dict(
    keys=[
        (dict(_pu, hip=(255, 440), t=75, arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1)), 3, 13),
        (dict(_pu, hip=(262, 490), t=85.6, arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1)), 2, 13),
    ],
    back=floor, front=None, hl=("ua", "torso"),
)


SIDE = {
    "agachamento": AGACHAMENTO,
    "leg_press": LEG_PRESS,
    "remada_cabo": REMADA_CABO,
    "afundo": AFUNDO,
    "barra_fixa": BARRA_FIXA,
    "barra_carga": BARRA_CARGA,
    "puxada_alta": PUXADA_ALTA,
    "paralelas": PARALELAS,
    "rosca_direta": ROSCA_DIRETA,
    "triceps_corda": TRICEPS_CORDA,
    "terra_trap": TERRA_TRAP,
    "bulgaro": BULGARO,
    "salto_grupado": SALTO_GRUPADO,
    "salto_caixote": SALTO_CAIXOTE,
    "desenvolvimento": DESENVOLVIMENTO,
    "supino_ponte": SUPINO_PONTE,
    "prancha": PRANCHA,
    "abdominal_infra": ABDOMINAL_INFRA,
    "farmer": FARMER,
    "esteira": ESTEIRA,
    "burpee": BURPEE,
    "flexao": FLEXAO,
}
