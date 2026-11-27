"""Exercícios da biblioteca expandida (vista lateral)."""
from __future__ import annotations

import math

from exercises import AY, BAR, G, STAND_LEGS, ik, pullup_back, pullup_front
from rig import EQUIP, EQUIP_DARK, FAR, NEAR, STEEL, STEEL_DARK, add, sub

ST = dict(anchor=("ankle_n", (300, AY)))


def floor(cv, *_):
    cv.floor(G)


def db_front(cv, j, k):
    cv.dumbbell_side(add(j.hand_n, (0, 4)), 20)
    cv.circle(j.hand_n, 10, NEAR)


def db_vertical(cv, j, k):
    h = j.hand_n
    cv.rect(h[0] - 6, h[1] - 26, h[0] + 6, h[1] + 26, STEEL_DARK, radius=5)
    cv.rect(h[0] - 14, h[1] - 30, h[0] + 14, h[1] - 16, STEEL, radius=4)
    cv.rect(h[0] - 14, h[1] + 16, h[0] + 14, h[1] + 30, STEEL, radius=4)
    cv.circle(h, 10, NEAR)


def both_db(cv, j, k):
    cv.dumbbell_side(add(j.hand_f, (-6, 1)), 18)
    db_front(cv, j, k)


def plate_back(r=44, dy=0):
    def f(cv, j, k):
        cv.floor(G)
        cv.plate(add(j.hand_n, (0, dy)), r)
    return f


def bar_stub(cv, j, k):
    cv.circle(j.hand_n, 9, STEEL)
    cv.circle(j.hand_n, 10, NEAR)


def bench(x0, x1, top, legs=True, color=FAR):
    def f(cv, j=None, k=0):
        cv.rect(x0, top, x1, top + 18, color, radius=8)
        if legs:
            cv.rect(x0 + 20, top + 18, x0 + 36, G, STEEL_DARK, radius=4)
            cv.rect(x1 - 36, top + 18, x1 - 20, G, STEEL_DARK, radius=4)
    return f


def combine(*fs):
    def f(cv, j, k):
        for g in fs:
            g(cv, j, k)
    return f


# ======================================================================= PEITO

_bp = dict(hip=(345, 452), t=-90, leg_n=ik(432, AY), leg_f=ik(438, AY))


def rack_back(cv, j, k):
    cv.floor(G)
    cv.rect(196, 230, 212, G, STEEL_DARK, radius=4)
    cv.rect(196, 300, 236, 310, STEEL_DARK, radius=3)
    bench(150, 400, 470)(cv)
    cv.plate(j.hand_n, 40)


SUPINO_RETO = dict(
    keys=[(dict(_bp, arm_n=ik(232, 305, 1), arm_f=ik(232, 305, 1)), 3, 14),
          (dict(_bp, arm_n=ik(262, 420, 1), arm_f=ik(262, 420, 1)), 2, 14)],
    back=rack_back, front=bar_stub, hl=("chest", "tri", "delt"),
)

_inc = dict(hip=(330, 468), t=-60, leg_n=ik(440, AY), leg_f=ik(446, AY))


def incline_back(cv, j, k):
    cv.floor(G)
    d = (-0.866, -0.5)
    back = (-0.5, 0.866)
    a = add((330, 468), (back[0] * 26 + 30 * -d[0], back[1] * 26 + 30 * -d[1]))
    b = add((330, 468), (back[0] * 26 + 165 * d[0], back[1] * 26 + 165 * d[1]))
    cv.line(a, b, 24, FAR)
    cv.rect(300, 478, 380, 494, FAR, radius=8)
    cv.rect(330, 494, 346, G, STEEL_DARK, radius=4)
    cv.line((250, 440), (220, G), 12, STEEL_DARK)


SUPINO_INCLINADO = dict(
    keys=[(dict(_inc, arm_n=ik(232, 262, 1), arm_f=ik(232, 262, 1)), 3, 14),
          (dict(_inc, arm_n=ik(254, 372, 1), arm_f=ik(254, 372, 1)), 2, 14)],
    back=incline_back, front=db_front, hl=("chest", "delt", "tri"),
)


# ====================================================================== COSTAS

_row_leg = dict(leg_n=(25, -15), leg_f=(25, -15))
REMADA_CURVADA = dict(
    keys=[(dict(ST, t=56, **_row_leg, arm_n=(0, 0), arm_f=(0, 0)), 3, 12),
          (dict(ST, t=56, **_row_leg, arm_n=(-72, 8), arm_f=(-72, 8)), 3, 12)],
    back=plate_back(44), front=bar_stub, hl=("back", "bi", "delt"),
)


def serrote_back(cv, j, k):
    cv.floor(G)
    bench(160, 470, 500)(cv)


_ser = dict(hip=(290, 390), t=80, leg_n=ik(250, AY), leg_f=(5, -90), ft_f=-95,
            arm_f=ik(412, 500, 1))
SERROTE = dict(
    keys=[(dict(_ser, arm_n=(0, 0)), 3, 12), (dict(_ser, arm_n=(-72, 8)), 3, 12)],
    back=serrote_back, front=db_vertical, hl=("back", "bi"),
)

TERRA = dict(
    keys=[(dict(ST, t=55, leg_n=(60, -20), leg_f=(60, -20), arm_n=(0, 0), arm_f=(0, 0)), 3, 15),
          (dict(ST, t=0, **STAND_LEGS, arm_n=(0, 0), arm_f=(0, 0)), 4, 15)],
    back=plate_back(58, 4), front=bar_stub, hl=("glute", "ham", "lowback", "quad"),
)

PD_PULLEY = (430, 70)


def straight_pd_back(cv, j, k):
    cv.floor(G)
    cv.rect(440, 40, 466, G, STEEL_DARK, radius=6)


def straight_pd_front(cv, j, k):
    cv.circle(PD_PULLEY, 12, STEEL)
    cv.line(PD_PULLEY, j.hand_n, 5, STEEL)
    cv.line(add(j.hand_n, (-4, -12)), add(j.hand_n, (4, 12)), 9, STEEL_DARK)
    cv.circle(j.hand_n, 10, NEAR)


_spd = dict(anchor=("ankle_n", (270, AY)), t=28, leg_n=(14, -6), leg_f=(14, -6))
PULLDOWN_RETO = dict(
    keys=[(dict(_spd, arm_n=(150, 150), arm_f=(150, 150)), 3, 14),
          (dict(_spd, arm_n=(-8, -8), arm_f=(-8, -8)), 3, 14)],
    back=straight_pd_back, front=straight_pd_front, hl=("back",),
)


def hyper_back(cv, j, k):
    cv.floor(G)
    cv.line((180, 540), (330, 400), 14, STEEL_DARK)
    cv.line((330, 400), (330, G), 14, STEEL_DARK)
    cv.line((150, 545), (220, 545), 12, STEEL_DARK)


def hyper_front(cv, j, k):
    cv.circle(add((330, 380), (14, 14)), 20, FAR)
    cv.circle(add(j.ankle_n, (-4, -12)), 11, FAR)


_hy = dict(hip=(330, 380), leg_n=(-45, -45), leg_f=(-45, -45), ft_n=45, ft_f=45,
           arm_n=(20, 170), arm_f=(20, 170), arms_rel=True)
HIPEREXTENSAO = dict(
    keys=[(dict(_hy, t=45), 3, 14), (dict(_hy, t=160), 2, 14)],
    back=hyper_back, front=hyper_front, hl=("lowback", "glute", "ham"),
)


# ===================================================================== OMBROS

DESENV_HALTERES = dict(
    keys=[(dict(ST, t=0, **STAND_LEGS, arm_n=(35, 175), arm_f=(35, 175)), 3, 13),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(175, 178), arm_f=(175, 178)), 3, 13)],
    back=floor, front=db_front, hl=("delt", "tri"),
)

ELEVACAO_FRONTAL = dict(
    keys=[(dict(ST, t=0, **STAND_LEGS, arm_n=(5, 5), arm_f=(5, 5)), 3, 13),
          (dict(ST, t=-2, **STAND_LEGS, arm_n=(90, 88), arm_f=(90, 88)), 3, 13)],
    back=floor, front=db_front, hl=("delt",),
)

FP_PULLEY = (470, 238)


def facepull_back(cv, j, k):
    cv.floor(G)
    cv.rect(484, 60, 510, G, STEEL_DARK, radius=6)


def facepull_front(cv, j, k):
    cv.circle(FP_PULLEY, 12, STEEL)
    cv.line(FP_PULLEY, j.hand_n, 5, STEEL)
    cv.circle(add(j.hand_n, (2, 10)), 7, EQUIP_DARK)
    cv.circle(j.hand_n, 10, NEAR)


_fp = dict(anchor=("ankle_n", (290, AY)), t=-4, leg_n=(8, -4), leg_f=(-6, -6))
FACE_PULL = dict(
    keys=[(dict(_fp, arm_n=ik(432, 238, 1), arm_f=ik(432, 238, 1)), 3, 13),
          (dict(_fp, arm_n=ik(318, 214, -1), arm_f=ik(318, 214, -1)), 3, 13)],
    back=facepull_back, front=facepull_front, hl=("delt", "trap", "back"),
)


# ===================================================================== BÍCEPS

_curl_up = (12, 152)
ROSCA_ALTERNADA = dict(
    keys=[(dict(ST, **STAND_LEGS, arm_n=(6, 8), arm_f=(6, 8)), 2, 12),
          (dict(ST, **STAND_LEGS, arm_n=_curl_up, arm_f=(6, 8)), 2, 12),
          (dict(ST, **STAND_LEGS, arm_n=(6, 8), arm_f=(6, 8)), 2, 12),
          (dict(ST, **STAND_LEGS, arm_n=(6, 8), arm_f=_curl_up), 2, 12)],
    back=floor, front=both_db, hl=("bi",),
)

ROSCA_MARTELO = dict(
    keys=[(dict(ST, **STAND_LEGS, arm_n=(6, 8), arm_f=(6, 8)), 3, 13),
          (dict(ST, **STAND_LEGS, arm_n=_curl_up, arm_f=_curl_up), 3, 13)],
    back=floor, front=db_vertical, hl=("bi", "fa"),
)


def scott_back(cv, j, k):
    cv.floor(G)
    cv.rect(180, 452, 320, 468, FAR, radius=8)
    cv.rect(240, 468, 256, G, STEEL_DARK, radius=4)
    sh = j.neck
    el = j.elbow_n
    d = sub(el, sh)
    n = math.hypot(*d)
    u = (d[0] / n, d[1] / n)
    under = (u[1], -u[0])
    a = add(sh, (u[0] * 20 + under[0] * -20, u[1] * 20 + under[1] * -20))
    b = add(el, (u[0] * 18 + under[0] * -20, u[1] * 18 + under[1] * -20))
    cv.line(a, b, 26, FAR)
    cv.line(add(b, (-10, 10)), (360, G), 12, STEEL_DARK)


_sc = dict(hip=(260, 450), t=12, leg_n=(80, 0), leg_f=(80, 0))
ROSCA_SCOTT = dict(
    keys=[(dict(_sc, arm_n=(42, 60), arm_f=(42, 60)), 3, 13), (dict(_sc, arm_n=(42, 168), arm_f=(42, 168)), 3, 13)],
    back=scott_back, front=bar_stub, hl=("bi",),
)

_cc = dict(hip=(270, 440), t=40, leg_n=(88, 0), leg_f=(80, -6))
ROSCA_CONCENTRADA = dict(
    keys=[(dict(_cc, arm_n=(-5, 0), arm_f=(30, 40)), 3, 13), (dict(_cc, arm_n=(-5, 150), arm_f=(30, 40)), 3, 13)],
    back=combine(floor, bench(170, 330, 454)), front=db_vertical, hl=("bi",),
)


# ==================================================================== TRÍCEPS

def flat_bench_back(cv, j, k):
    cv.floor(G)
    bench(150, 400, 470)(cv)


def skull_back(cv, j, k):
    flat_bench_back(cv, j, k)
    cv.plate(j.hand_n, 30)


TRICEPS_TESTA = dict(
    keys=[(dict(_bp, arm_n=(190, 185), arm_f=(190, 185)), 3, 13), (dict(_bp, arm_n=(192, 282), arm_f=(192, 282)), 3, 13)],
    back=skull_back, front=bar_stub, hl=("tri",),
)


def bench_backrest(cv, j, k):
    cv.floor(G)
    cv.rect(180, 456, 330, 472, FAR, radius=8)
    cv.line((214, 456), (206, 300), 26, FAR)
    cv.rect(232, 472, 250, G, STEEL_DARK, radius=4)


_tf = dict(hip=(270, 445), t=-4, leg_n=(88, 0), leg_f=(88, 0))
TRICEPS_FRANCES = dict(
    keys=[(dict(_tf, arm_n=(178, 178), arm_f=(178, 178)), 3, 13), (dict(_tf, arm_n=(176, 342), arm_f=(176, 342)), 3, 13)],
    back=bench_backrest, front=db_vertical, hl=("tri",),
)

_md = dict(anchor=("hand_n", (285, 466)), t=-5, ft_n=150, ft_f=150)
MERGULHO_BANCO = dict(
    keys=[(dict(_md, arm_n=(-8, -8), arm_f=(-8, -8), leg_n=(55, 60), leg_f=(55, 60)), 3, 13),
          (dict(_md, arm_n=(-80, 10), arm_f=(-80, 10), leg_n=(70, 80), leg_f=(70, 80)), 3, 13)],
    back=combine(floor, bench(150, 292, 470)), front=None, hl=("tri", "chest"),
)


# ===================================================================== PERNAS

def ext_back(cv, j, k):
    cv.floor(G)
    cv.rect(190, 452, 320, 470, FAR, radius=8)
    cv.line((206, 452), (190, 300), 26, FAR)
    cv.rect(230, 470, 248, G, STEEL_DARK, radius=4)
    cv.line((300, 470), (320, G), 12, STEEL_DARK)


def ext_front(cv, j, k):
    cv.circle(add(j.ankle_n, (12, 4)), 14, STEEL_DARK)


_ex = dict(hip=(262, 440), t=-10, arm_n=(20, 30), arm_f=(20, 30), ft_n=95, ft_f=95)
CADEIRA_EXTENSORA = dict(
    keys=[(dict(_ex, leg_n=(88, 8), leg_f=(88, 8)), 3, 13), (dict(_ex, leg_n=(84, 84), leg_f=(84, 84)), 3, 13)],
    back=ext_back, front=ext_front, hl=("quad",),
)


def flex_front(cv, j, k):
    cv.circle(add(j.ankle_n, (-12, 6)), 14, STEEL_DARK)
    cv.rect(j.knee_n[0] - 60, j.knee_n[1] - 36, j.knee_n[0] - 6, j.knee_n[1] - 18, FAR, radius=8)


CADEIRA_FLEXORA = dict(
    keys=[(dict(_ex, leg_n=(84, 84), leg_f=(84, 84)), 3, 13), (dict(_ex, leg_n=(88, -12), leg_f=(88, -12)), 3, 13)],
    back=ext_back, front=flex_front, hl=("ham",),
)


def mesa_back(cv, j, k):
    cv.floor(G)
    bench(140, 470, 470)(cv)
    cv.rect(430, 470, 446, 520, STEEL_DARK, radius=4)


def mesa_front(cv, j, k):
    cv.circle(add(j.ankle_n, (0, -14)), 13, STEEL_DARK)


_mf = dict(hip=(300, 452), t=90, arm_n=(30, 40), arm_f=(30, 40), head_tilt=8, ft_n=180, ft_f=180)
MESA_FLEXORA = dict(
    keys=[(dict(_mf, leg_n=(-90, -90), leg_f=(-90, -90)), 3, 13), (dict(_mf, leg_n=(-92, -196), leg_f=(-92, -196)), 3, 13)],
    back=mesa_back, front=mesa_front, hl=("ham",),
)

_gob = dict(arm_n=(15, 175), arm_f=(15, 175), arms_rel=True)
AGACHAMENTO_GOBLET = dict(
    keys=[(dict(ST, t=4, **STAND_LEGS, **_gob), 5, 15), (dict(ST, t=22, leg_n=(86, -40), leg_f=(86, -40), **_gob), 3, 14)],
    back=floor, front=db_vertical, hl=("quad", "glute"),
)

AGACHAMENTO_LIVRE = dict(
    keys=[(dict(ST, t=4, **STAND_LEGS, arm_n=(4, 4), arm_f=(4, 4)), 4, 14),
          (dict(ST, t=32, leg_n=(84, -38), leg_f=(84, -38), arm_n=(86, 86), arm_f=(86, 86)), 3, 14)],
    back=floor, front=None, hl=("quad", "glute"),
)

STEP_BOX = (360, 430, 500)


def step_back(cv, j, k):
    cv.floor(G)
    x0, top, x1 = STEP_BOX
    cv.rect(x0, top, x1, G, EQUIP_DARK, radius=8)
    cv.rect(x0 + 10, top + 10, x1 - 10, G - 2, EQUIP, radius=6)


_sa = dict(arm_n=(3, 3), arm_f=(-3, -3))
STEP_UP = dict(
    keys=[(dict(_sa, hip=(300, 356), t=8, leg_n=ik(405, 423), leg_f=ik(300, AY)), 3, 14),
          (dict(_sa, hip=(398, 236), t=4, leg_n=ik(405, 423), leg_f=ik(372, 330)), 3, 14)],
    back=step_back, front=db_front, hl=("quad", "glute"),
)

STIFF = dict(
    keys=[(dict(ST, t=0, leg_n=(4, -2), leg_f=(4, -2), arm_n=(0, 0), arm_f=(0, 0)), 3, 15),
          (dict(ST, t=78, leg_n=(18, -6), leg_f=(18, -6), arm_n=(0, 0), arm_f=(0, 0)), 3, 15)],
    back=plate_back(44), front=bar_stub, hl=("ham", "glute", "lowback"),
)


# ==================================================================== GLÚTEOS

def thrust_back(cv, j, k):
    cv.floor(G)
    bench(130, 250, 470)(cv)


def thrust_front(cv, j, k):
    cv.plate(add(j.hip, (4, -36)), 44)


_ht = dict(leg_n=ik(442, AY), leg_f=ik(448, AY), arm_n=ik(370, 420, -1), arm_f=ik(370, 420, -1))
ELEVACAO_PELVICA = dict(
    keys=[(dict(_ht, hip=(338, 520), t=-55), 3, 14), (dict(_ht, hip=(360, 450), t=-90), 3, 14)],
    back=thrust_back, front=thrust_front, hl=("glute", "ham"),
)

_pg = dict(leg_n=ik(422, AY), leg_f=ik(428, AY), arm_n=(80, 86), arm_f=(80, 86))
PONTE_GLUTEO = dict(
    keys=[(dict(_pg, hip=(316, 522), t=-86), 3, 13), (dict(_pg, hip=(316, 470), t=-111), 4, 13)],
    back=floor, front=None, hl=("glute", "ham"),
)

KB_PULLEY = (480, 520)


def kick_back(cv, j, k):
    cv.floor(G)
    cv.rect(470, 120, 500, G, STEEL_DARK, radius=6)
    cv.rect(436, 290, 470, 304, STEEL_DARK, radius=5)


def kick_front(cv, j, k):
    cv.circle(KB_PULLEY, 11, STEEL)
    cv.line(KB_PULLEY, j.ankle_n, 5, STEEL)
    cv.circle(j.ankle_n, 10, EQUIP_DARK)


_kb = dict(anchor=("ankle_f", (330, AY)), t=28, leg_f=(6, -2), arm_n=ik(445, 296, 1), arm_f=ik(445, 296, 1))
COICE_CABO = dict(
    keys=[(dict(_kb, leg_n=(8, -10)), 3, 12), (dict(_kb, leg_n=(-48, -30)), 3, 12)],
    back=kick_back, front=kick_front, hl=("glute", "ham"),
)


# ================================================================ PANTURRILHA

def step_edge(cv, j, k):
    cv.floor(G)
    cv.rect(300, 474, 440, G, EQUIP_DARK, radius=6)
    cv.rect(470, 200, 484, G, STEEL_DARK, radius=4)


_cr = dict(t=0, **STAND_LEGS, arm_n=ik(476, 330, 1), arm_f=(4, 4))
PANTURRILHA_PE = dict(
    keys=[(dict(_cr, anchor=("toe_n", (346, 470)), ft_n=112, ft_f=112), 3, 10),
          (dict(_cr, anchor=("toe_n", (346, 470)), ft_n=48, ft_f=48), 3, 10)],
    back=step_edge, front=None, hl=("calf",),
)


def calf_seat_back(cv, j, k):
    cv.floor(G)
    cv.rect(180, 452, 300, 470, FAR, radius=8)
    cv.rect(220, 470, 238, G, STEEL_DARK, radius=4)
    cv.rect(370, 530, 430, 546, STEEL_DARK, radius=4)


def calf_seat_front(cv, j, k):
    cv.rect(j.knee_n[0] - 40, j.knee_n[1] - 34, j.knee_n[0] + 10, j.knee_n[1] - 16, FAR, radius=8)


_cs = dict(hip=(262, 440), t=4, arm_n=(40, 70), arm_f=(40, 70))
PANTURRILHA_SENTADO = dict(
    keys=[(dict(_cs, leg_n=(90, 2), leg_f=(90, 2), ft_n=108, ft_f=108), 3, 10),
          (dict(_cs, leg_n=(82, 0), leg_f=(82, 0), ft_n=55, ft_f=55), 3, 10)],
    back=calf_seat_back, front=calf_seat_front, hl=("calf",),
)


# ======================================================================= CORE

_cr2 = dict(hip=(330, 522), leg_n=ik(420, AY), leg_f=ik(426, AY), arm_n=(20, 170), arm_f=(20, 170), arms_rel=True)
ABDOMINAL_CRUNCH = dict(
    keys=[(dict(_cr2, t=-88), 3, 11), (dict(_cr2, t=-58), 2, 11)],
    back=floor, front=None, hl=("abs",),
)

_sp = dict(arm_n=(0, 90), arm_f=(160, 200), ft_n=0, ft_f=0)
PRANCHA_LATERAL = dict(
    keys=[(dict(_sp, hip=(303, 496), t=75.9, leg_n=(-75.9, -75.9), leg_f=(-75.9, -75.9)), 6, 16),
          (dict(_sp, hip=(303, 516), t=66.4, leg_n=(-82, -82), leg_f=(-82, -82)), 3, 16)],
    back=floor, front=None, hl=("abs",),
)


def wheel_front(cv, j, k):
    c = add(j.hand_n, (0, 14))
    cv.circle(c, 24, STEEL_DARK)
    cv.circle(c, 14, STEEL)
    ang = -c[0] / 24
    cv.line(add(c, (math.cos(ang) * 22, math.sin(ang) * 22)), add(c, (-math.cos(ang) * 22, -math.sin(ang) * 22)), 4, STEEL_DARK)
    cv.circle(j.hand_n, 10, NEAR)


_rw = dict(anchor=("knee_n", (250, 538)), leg_f=None, ft_n=-100, ft_f=-100)
RODA_ABDOMINAL = dict(
    keys=[(dict(anchor=("knee_n", (250, 538)), t=60, leg_n=(-10, -90), leg_f=(-10, -90), ft_n=-100, ft_f=-100,
                arm_n=(25, 25), arm_f=(25, 25)), 3, 16),
          (dict(anchor=("knee_n", (250, 538)), t=84, leg_n=(-55, -90), leg_f=(-55, -90), ft_n=-100, ft_f=-100,
                arm_n=(75, 75), arm_f=(75, 75)), 2, 16)],
    back=floor, front=wheel_front, hl=("abs",),
)

_hl = dict(anchor=("hand_n", BAR), t=0, arm_n=(180, 180), arm_f=(180, 180))
ELEVACAO_PERNAS = dict(
    keys=[(dict(_hl, leg_n=(4, 0), leg_f=(2, -2)), 3, 14), (dict(_hl, t=-12, leg_n=(100, 96), leg_f=(98, 94)), 2, 14)],
    back=pullup_back, front=pullup_front, hl=("abs",),
)

_mc = dict(hip=(255, 440), t=75, ft_n=0, ft_f=0, arm_n=ik(380, AY + 2, 1), arm_f=ik(376, AY + 2, 1))
MOUNTAIN_CLIMBER = dict(
    keys=[(dict(_mc, leg_n=ik(305, 530), leg_f=ik(74, 512)), 1, 5), (dict(_mc, leg_n=ik(78, 512), leg_f=ik(305, 530)), 1, 5)],
    back=floor, front=None, hl=("abs", "quad"), duration=50,
)


# ===================================================================== CARDIO

def rope_front(cv, j, k):
    h = j.hand_n
    c = (j.hip[0], j.hip[1] - 20)
    ang = 2 * math.pi * k * 2
    tip = (c[0] + math.sin(ang) * 70, c[1] + math.cos(ang) * 225)
    pts = []
    for i in range(13):
        t = i / 12
        # Bézier quadrática mão → ponta → mão
        p0, p2 = h, add(j.hand_f, (-6, -3))
        ctrl = (2 * tip[0] - (p0[0] + p2[0]) / 2, 2 * tip[1] - (p0[1] + p2[1]) / 2)
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * ctrl[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * ctrl[1] + t * t * p2[1]
        pts.append((x, y))
    cv.d.line(pts, fill=EQUIP, width=5, joint="curve")
    cv.circle(h, 10, NEAR)


_jr = dict(hip=(300, 0), t=2, leg_n=(4, -6), leg_f=(2, -8), ft_n=55, ft_f=55, arm_n=(12, 50), arm_f=(10, 48))
PULAR_CORDA = dict(
    keys=[(dict(_jr, anchor=("ground", G)), 1, 4), (dict(_jr, anchor=("ground", G - 24)), 1, 4)] * 2,
    back=floor, front=rope_front, hl=("calf",), duration=55,
)


def kb_front(cv, j, k):
    c = add(j.hand_n, (0, 18))
    cv.circle(c, 24, STEEL_DARK)
    cv.circle(c, 16, STEEL)
    cv.line(add(j.hand_n, (-10, 4)), add(j.hand_n, (10, 4)), 6, STEEL_DARK)
    cv.circle(j.hand_n, 10, NEAR)


KETTLEBELL_SWING = dict(
    keys=[(dict(ST, t=62, leg_n=(32, -18), leg_f=(32, -18), arm_n=(-22, -28), arm_f=(-22, -28)), 1, 11),
          (dict(ST, t=-3, **STAND_LEGS, arm_n=(88, 90), arm_f=(88, 90)), 2, 11)],
    back=floor, front=kb_front, hl=("glute", "ham"),
)


SIDE2 = {
    "supino_reto": SUPINO_RETO,
    "supino_inclinado": SUPINO_INCLINADO,
    "remada_curvada": REMADA_CURVADA,
    "serrote": SERROTE,
    "terra": TERRA,
    "pulldown_reto": PULLDOWN_RETO,
    "hiperextensao": HIPEREXTENSAO,
    "desenvolvimento_halteres": DESENV_HALTERES,
    "elevacao_frontal": ELEVACAO_FRONTAL,
    "face_pull": FACE_PULL,
    "rosca_alternada": ROSCA_ALTERNADA,
    "rosca_martelo": ROSCA_MARTELO,
    "rosca_scott": ROSCA_SCOTT,
    "rosca_concentrada": ROSCA_CONCENTRADA,
    "triceps_testa": TRICEPS_TESTA,
    "triceps_frances": TRICEPS_FRANCES,
    "mergulho_banco": MERGULHO_BANCO,
    "cadeira_extensora": CADEIRA_EXTENSORA,
    "cadeira_flexora": CADEIRA_FLEXORA,
    "mesa_flexora": MESA_FLEXORA,
    "agachamento_goblet": AGACHAMENTO_GOBLET,
    "agachamento_livre": AGACHAMENTO_LIVRE,
    "step_up": STEP_UP,
    "stiff": STIFF,
    "elevacao_pelvica": ELEVACAO_PELVICA,
    "ponte_gluteo": PONTE_GLUTEO,
    "coice_cabo": COICE_CABO,
    "panturrilha_pe": PANTURRILHA_PE,
    "panturrilha_sentado": PANTURRILHA_SENTADO,
    "abdominal_crunch": ABDOMINAL_CRUNCH,
    "prancha_lateral": PRANCHA_LATERAL,
    "roda_abdominal": RODA_ABDOMINAL,
    "elevacao_pernas": ELEVACAO_PERNAS,
    "mountain_climber": MOUNTAIN_CLIMBER,
    "pular_corda": PULAR_CORDA,
    "kettlebell_swing": KETTLEBELL_SWING,
}
