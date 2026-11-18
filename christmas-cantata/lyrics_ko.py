"""Korean singing translation (new translation by the arranger from the
public-domain English texts; NOT the 새찬송가 texts).

Each space-separated slot replaces one English syllable.  A slot with two
Hangul syllables (e.g. "한밤,") spreads them over that syllable's melisma.
"/" is only a phrase separator for readability.
"""


def slots(*parts):
    out = []
    for p in parts:
        out += [t for t in p.split() if t != "/"]
    return out


# ---------------------------------------------------------------- I
I_L1 = "주 오 소 서 임 마 누 엘,"
I_L2 = "묶 인 백 성 구 하 소 서."
I_L3 = "먼 땅 에 서 슬 피 우 니"
I_L4 = "주 님 오 실 그 날 까 지."
I_R = "기 뻐 하 라 임 마 누 엘, / 곧 오 시 리 이 스 라 엘."

# ---------------------------------------------------------------- II
II_S = ("작 은 마 을 베 들 레 헴 고 요 히 잠 든 밤, "
        "꿈 도 없 는 깊 은 잠 위 별 빛 이 흐 르 네. "
        "어 두 운 그 거 리 에 도 늘 빛 나 는 빛, "
        "모 든 세 대 꿈 과 눈 물 이 밤 네 게 있 네.")

# ---------------------------------------------------------------- III
III_B_LINE = "양 떼 를 지 키 며 누 운 들 판 에 그 춥 고 깊 은 겨 울 밤,"
III_A_LINE = "첫 노 엘 을 천 사 전 하 니 / 들 에 서 양 치 던 가 난 한 목 자 들,"
III_R = "노 엘, 노 엘, 노 엘, 노 엘, 나 셨 네 이 스 라 엘 왕."

# ---------------------------------------------------------------- IV
IV_V1 = "천 사 노 래 들 리 네, 들 판 위 에 울 리 네. 산 들 도 화 답 하 네, 기 쁜 노 래 메 아 리."
IV_G = "영 광 을 높 이 계 신 주 께."
IV_V3 = "베 들 레 헴 와 보 라, 천 사 찬 송 한 아 기. 엎 드 려 경 배 하 라, 나 신 왕 그 리 스 도."

# ---------------------------------------------------------------- V
V_V1 = ("고 요 한밤, 거 룩 한밤! 평 온 해, 빛 나 네. "
        "동 정 녀 어 머 니 품 안에 거 룩 한 아 기 참 온 유 해. "
        "하 늘 의 평 화 속에 평안 히 잠 드 소 서.")
V_V3 = ("고 요 한밤, 거 룩 한밤! 독 생 자, 참 사 랑. "
        "거 룩 한 얼 굴 에 빛 나는 구 원 의 새 벽 밝 아 오네. "
        "주 예 수 나 신 날, 주 예 수 나 신 날.")
OO4 = "Oo Oo Oo Oo"

# ---------------------------------------------------------------- VI
VI_V = "성 도 들 아 오 라, 기 쁨 과 승 리 로. 오 오 라 다 오 라 베 들 레 헴. 와 서 보 아 라, 나 신 천 사 의 왕."
VI_P = "오 와 서 경 배 하 세,"
VI_C = "주 예 수."

# ---------------------------------------------------------------- VII
VII_A = "기 뻐 하 라 주 오 셨 네, 새 왕 을 맞 으 라. 마 음 마 다 주 모 시 라,"
VII_H1 = "하 늘 과 땅 노 래해,"       # split on the melisma of "sing"
VII_H2 = "하 늘 과 땅 노래 해,"       # split on the 16ths of "nature"
VII_ECHO = "하 늘 땅 노 래 해,"       # tenor/bass echo (tied note, no split)
VII_V4A = "진 리 은 혜 로 다 스 려, 열 방 이 깨 닫 네. 주 님 의 의 로 운 영 광,"
VII_LOVE = "놀 라 운 그 사 랑,"
VII_AMEN = "아 멘."

KO = {
    "I": {
        "S": slots(I_L3, I_L4, I_R),
        "A": slots(I_L3, I_L4, I_R),
        "T": slots(I_L1, I_L2, "Mm", I_R),
        "B": slots(I_L1, I_L2, "Mm", I_R),
    },
    "II": {
        "S": slots(II_S),
        "A": slots(OO4), "T": slots(OO4), "B": slots(OO4),
    },
    "III": {
        "S": slots(III_B_LINE, III_R),
        "A": slots(III_B_LINE, III_R),
        "T": slots(III_A_LINE, "Oo", III_R),
        "B": slots(III_A_LINE, "Oo", III_R),
    },
    "IV": {
        "S": slots(IV_V1, IV_G, IV_G, IV_V3, IV_G, IV_G),
        "A": slots(IV_V1, IV_G, IV_G, IV_V3, IV_G, IV_G),
        "T": slots(IV_G, IV_G, IV_V3, IV_G, IV_G),
        "B": slots(IV_G, IV_G, IV_V3, IV_G, IV_G),
    },
    "V": {
        "S": slots(V_V1, V_V3),
        "A": slots(OO4, V_V3), "T": slots(OO4, V_V3), "B": slots(OO4, V_V3),
    },
    "VI": {
        "S": slots(VI_V, VI_P, VI_C),
        "A": slots(VI_V, VI_P, VI_P, VI_C),
        "T": slots(VI_V, VI_P, VI_P, VI_P, VI_C),
        "B": slots(VI_V, VI_P, VI_P, VI_P, VI_C),
    },
    "VII": {
        "S": slots(VII_A, VII_H1, VII_H2, VII_H1, VII_H1, VII_V4A, VII_LOVE, VII_LOVE, VII_LOVE, VII_LOVE, VII_AMEN),
        "A": slots(VII_A, VII_H1, VII_H2, VII_H1, VII_H1, VII_V4A, VII_LOVE, VII_LOVE, VII_LOVE, VII_LOVE, VII_AMEN),
        "T": slots(VII_A, VII_H1, VII_ECHO, VII_H1, VII_V4A, VII_LOVE, VII_LOVE, VII_LOVE, VII_LOVE, VII_AMEN),
        "B": slots(VII_A, VII_H1, VII_ECHO, VII_H1, VII_V4A, VII_LOVE, VII_LOVE, VII_LOVE, VII_LOVE, VII_AMEN),
    },
}
