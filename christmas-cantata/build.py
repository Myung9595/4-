#!/usr/bin/env python3
"""Build the cantata medley: LilyPond source -> PDF score, MIDI, practice MIDIs, audio.

Usage:  python3 build.py            (check + write .ly + render everything)
        python3 build.py --check    (only run the bar/lyric/voice-leading checks)
"""
import os
import subprocess
import sys
from fractions import Fraction as F

import engine as E
from score_data import SECTIONS

# ---------------------------------------------------------------------------
ARRANGER = "[편곡자 이름]"   # <- 편곡자 이름을 여기에 넣고 다시 빌드하세요
YEAR = "2026"
TITLE_KO = "말씀이 육신이 되어"
TITLE_EN = "The Word Became Flesh"
OUT = "out"
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
# ---------------------------------------------------------------------------

VOICES = ["S", "A", "T", "B"]


def compile_all():
    music = {v: [] for v in VOICES}
    lyrics = {v: [] for v in VOICES}
    glob_parts = []
    piano_rh, piano_lh, piano_dyn = [], [], []
    warnings = []
    for si, sec in enumerate(SECTIONS):
        name = sec["name"]
        glens = E.global_bar_lengths(sec["glob"])
        glob_parts.append(sec["glob"])
        starts = [F(0)]
        for g in glens[:-1]:
            starts.append(starts[-1] + g)
        timelines = {}
        vbars = {}
        for v in VOICES:
            bars = E.split_bars(sec[v])
            vbars[v] = bars
            ly, syl, tl = E.compile_vocal(name, v, bars, glens)
            music[v].append(ly)
            lyrics[v].extend(syl)
            timelines[v] = tl
        warnings += E.analyse(name, timelines, starts, sec.get("quiet", ()))

        # piano
        cursor = 0
        for seg in sec["piano"]:
            kind = seg[0]
            if kind == "rest":
                n = seg[1]
                rb = []
                for k in range(cursor, cursor + n):
                    if si == 0 and k == 0:
                        rb.append("r" + E.frac_to_dur(glens[k]))
                    else:
                        rb.append("R" + E.frac_to_dur(glens[k]))
                piano_rh.append(" | ".join(rb))
                piano_lh.append(" | ".join(rb))
                piano_dyn.append(" ".join("s" + E.frac_to_dur(glens[k]) for k in range(cursor, cursor + n)))
                cursor += n
                continue
            if kind == "own":
                _, rh, lh, dy = seg
                n = len(E.split_bars(rh))
                for label, part in (("RH", rh), ("LH", lh)):
                    pb = E.split_bars(part)
                    if len(pb) != n:
                        raise E.DSLError("%s piano %s bar count" % (name, label))
                    prevdur = None
                    for k, b in enumerate(pb):
                        _, tot, prevdur = E.parse_bar(b, prevdur)
                        if tot != glens[cursor + k]:
                            raise E.DSLError("%s piano %s bar %d length %s != %s" % (name, label, cursor + k + 1, tot, glens[cursor + k]))
                piano_rh.append(rh)
                piano_lh.append(lh)
            elif kind in ("double", "double_rh"):
                n = seg[1]
                sl = slice(cursor, cursor + n)
                s = E.strip_for_piano(vbars["S"][sl])
                a = E.strip_for_piano(vbars["A"][sl])
                t = E.strip_for_piano(vbars["T"][sl])
                b = E.strip_for_piano(vbars["B"][sl])
                piano_rh.append("<< { %s } \\\\ { %s } >>" % (s, a))
                if kind == "double":
                    piano_lh.append("<< { %s } \\\\ { %s } >>" % (t, b))
                    dy = seg[2]
                else:
                    lh = seg[2]
                    pb = E.split_bars(lh)
                    if len(pb) != n:
                        raise E.DSLError("%s piano LH override bar count" % name)
                    piano_lh.append(lh)
                    dy = seg[3]
            else:
                raise E.DSLError("unknown piano segment " + kind)
            # dynamics length check (total only)
            want = sum(glens[cursor:cursor + n])
            items, tot, _ = E.parse_bar(dy, None)
            if tot != want:
                raise E.DSLError("%s piano dyn length %s != %s" % (name, tot, want))
            piano_dyn.append(dy)
            cursor += n
        if cursor != len(glens):
            raise E.DSLError("%s piano covers %d of %d bars" % (name, cursor, len(glens)))
    return music, lyrics, glob_parts, piano_rh, piano_lh, piano_dyn, warnings


PREAMBLE = r'''
\version "2.24.0"
\language "english"

#(set-global-staff-size 16.5)

\paper {
  #(set-paper-size "a4")
  top-margin = 12\mm
  bottom-margin = 12\mm
  left-margin = 14\mm
  right-margin = 12\mm
  ragged-bottom = ##f
  ragged-last-bottom = ##t
  property-defaults.fonts.serif = "C059, Nanum Myeongjo"
  property-defaults.fonts.sans = "Nimbus Sans, NanumGothic"
  system-system-spacing.basic-distance = #14
  system-system-spacing.padding = #3
  score-markup-spacing.padding = #4
  markup-system-spacing.padding = #4
  oddFooterMarkup = \markup \fill-line {
    \fontsize #-2 \concat { "© @YEAR@ @ARR@ · All Rights Reserved" }
    \fontsize #-2 \concat { "말씀이 육신이 되어 — " \fromproperty #'page:page-number-string }
  }
  evenFooterMarkup = \oddFooterMarkup
  oddHeaderMarkup = \markup ""
  evenHeaderMarkup = \markup ""
}

% ---------- tempo marks (Italian + Korean)
tempoI = \tempo \markup { "Lento misterioso" \normal-text \fontsize #-1 "(느리고 신비롭게)" } 4 = 56
tempoNarr = \tempo \markup { "Narration" \normal-text \fontsize #-1 "(낭독)" }
tempoII = \tempo \markup { "Andante tranquillo" \normal-text \fontsize #-1 "(조용히 걷는 빠르기로)" } 4 = 72
tempoIII = \tempo \markup { "Andante pastorale" \normal-text \fontsize #-1 "(목가적으로)" } 4 = 100
tempoIV = \tempo \markup { "Allegro giocoso" \normal-text \fontsize #-1 "(빠르고 즐겁게)" } 2 = 76
tempoTransV = \tempo \markup { "Poco meno mosso" \normal-text \fontsize #-1 "(조금 느리게)" } 2 = 60
tempoV = \tempo \markup { "Adagio, dolce" \normal-text \fontsize #-1 "(느리게, 부드럽게)" } 4. = 46
tempoVb = \tempo \markup { "Più lento" \normal-text \fontsize #-1 "(더 느리게)" } 4. = 40
tempoTransVI = \tempo \markup { "Crescendo e accelerando poco a poco" \normal-text \fontsize #-1 "(조금씩 세게, 조금씩 빠르게)" } 4 = 66
tempoVI = \tempo \markup { "Maestoso" \normal-text \fontsize #-1 "(장엄하게)" } 4 = 88
tempoVII = \tempo \markup { "Allegro con brio" \normal-text \fontsize #-1 "(빠르고 생기 있게)" } 4 = 112
tempoVIIb = \tempo \markup { "Grandioso" \normal-text \fontsize #-1 "(웅장하게)" } 4 = 104
tempoCoda = \tempo \markup { "Maestoso, allargando" \normal-text \fontsize #-1 "(장엄하게, 점점 느리고 폭넓게)" } 4 = 56

% ---------- section titles
sec = #(define-music-function (roman ko en hymn) (string? string? string? string?)
  #{ \sectionLabel \markup \override #'(box-padding . 0.7) \box \line {
       \bold #roman \bold #ko \normal-text \italic #en \normal-text \fontsize #-1 #(string-append "(" hymn ")") } #})
secI = \sec "I." "기다림" "O Come, O Come, Emmanuel" "곧 오소서 임마누엘"
secII = \sec "II." "약속의 마을" "O Little Town of Bethlehem" "오 베들레헴 작은 골"
secIII = \sec "III." "들판의 목자" "The First Noel" "저 들 밖에 한밤중에"
secIV = \sec "IV." "천사의 선포" "Angels We Have Heard on High" "천사들의 노래가"
secV = \sec "V." "구유" "Silent Night" "고요한 밤 거룩한 밤"
secVI = \sec "VI." "경배" "O Come, All Ye Faithful" "참 반가운 신도여"
secVII = \sec "VII." "선포" "Joy to the World" "기쁘다 구주 오셨네"

% ---------- expressions (Italian + Korean)
expr = #(define-music-function (it ko) (string? string?)
  #{ _\markup { \italic #it \fontsize #-2 #(string-append "(" ko ")") } #})
dolce = \expr "dolce" "부드럽게"
misterioso = \expr "misterioso" "신비롭게"
leggiero = \expr "leggiero" "가볍게"
marcK = \expr "marcato" "또렷하게"
maestK = \expr "maestoso" "장엄하게"
conBrioK = \expr "con brio" "생기 있게"
morendo = \expr "morendo" "사라지듯이"
ritK = ^\markup { \italic "rit." \fontsize #-2 "(점점 느리게)" }
allargK = ^\markup { \italic "allargando" \fontsize #-2 "(점점 느리고 폭넓게)" }
echoK = ^\markup { \italic "come un'eco" \fontsize #-2 "(메아리처럼)" }

lab = #(define-music-function (txt) (string?) #{ ^\markup \fontsize #-1.5 \bold #txt #})
womenUnis = \lab "S·A unis. (여성 제창)"
menUnis = \lab "T·B unis. (남성 제창)"
menUnisAcap = ^\markup \fontsize #-1.5 \bold \column { "a cappella (무반주)" "T·B unis. (남성 제창)" }
humMm = \lab "hum (입을 다물고 허밍)"
ooVowel = \lab "\"Oo\" (입술을 둥글게)"
tuttiK = \lab "Tutti (전체)"
tuttiAcap = \lab "Tutti, a cappella (전체, 무반주)"
soloK = \lab "Solo (독창 — 또는 소수 Soli)"
descantK = \lab "Descant (데스캔트)"
melodyK = \lab "Melody (주선율)"
altoMelody = \lab "Melody (주선율)"
altoMelodyCong = ^\markup \fontsize #-1.5 \bold \column { "Melody (주선율)" "회중 함께 (with Congregation)" }
menMelody = \lab "Melody 8vb (주선율, 한 옥타브 아래)"
womenOnly = \lab "Women (여성부)"
womenLead = \lab "Women (여성부)"
menLead = \lab "Men (남성부)"
congStand = ^\markup \fontsize #-1 \bold \override #'(box-padding . 0.5) \box "회중 일어서서 함께 (Congregation stands)"
narr = #(define-music-function (ref) (string?)
  #{ ^\markup \fontsize #-1 \override #'(font-name . "Nanum Myeongjo") \override #'(box-padding . 0.8) \box \column {
       \line { "낭독 Narration:" #ref }
       "낭독이 끝날 때까지 화음을 유지 (hold until the reading ends)" } #})
narrOne = \narr "이사야 9:6 (Isaiah 9:6)"
narrTwo = \narr "누가복음 2:10–11 (Luke 2:10–11)"
'''

FRONT = r'''
\markup \column {
  \vspace #1
  \fill-line { \fontsize #9 \bold "@TKO@" }
  \vspace #0.6
  \fill-line { \fontsize #3 \italic "@TEN@" }
  \vspace #0.4
  \fill-line { \fontsize #1.5 "A Christmas Cantata Medley · 성탄 칸타타 메들리" }
  \fill-line { \fontsize #0.5 "혼성 4부 합창(SATB)과 피아노 · 낭독 2회 포함 약 9–10분" }
  \vspace #1
  \fill-line { \fontsize #2 \bold "Arranged by @ARR@ (편곡)" }
  \vspace #2
  \fill-line { \fontsize #2 \bold "작품 구성 (Structure)" }
  \vspace #0.6
  \override #'(baseline-skip . 3.2) \fontsize #-0.5 \column {
    \line { \bold "I. 기다림" "— O Come, O Come, Emmanuel (곧 오소서 임마누엘) · e단조→E장조 · Lento misterioso · 무반주 · pp→mf→pp" }
    \line { \hspace #3 \italic "낭독 1 — 이사야 9:6" }
    \line { \bold "II. 약속의 마을" "— O Little Town of Bethlehem (오 베들레헴 작은 골) · G장조 · Andante tranquillo · p→mf→pp" }
    \line { \bold "III. 들판의 목자" "— The First Noel (저 들 밖에 한밤중에) · D장조 3/4 · Andante pastorale · mp→f" }
    \line { \hspace #3 \italic "낭독 2 — 누가복음 2:10–11" }
    \line { \bold "IV. 천사의 선포" "— Angels We Have Heard on High (천사들의 노래가) · F장조 · Allegro giocoso · mf→fff" }
    \line { \bold "V. 구유" "— Silent Night (고요한 밤 거룩한 밤) · B♭장조 6/8 · Adagio dolce · p→ppp" }
    \line { \bold "VI. 경배" "— O Come, All Ye Faithful (참 반가운 신도여) · C장조 · Maestoso · f→fff" }
    \line { \bold "VII. 선포" "— Joy to the World (기쁘다 구주 오셨네) · D장조→E♭장조 · Allegro con brio · f→fff · Amen" }
  }
  \vspace #1.2
  \fill-line { \fontsize #2 \bold "편곡 의도 (Arranger's Note)" }
  \vspace #0.4
  \override #'(line-width . 120) \override #'(font-name . "Nanum Myeongjo") \fontsize #-0.5 \column {
    \wordwrap-string "일곱 곡의 성탄 찬송을 '기다림 → 약속 → 목자 → 천사 → 구유 → 경배 → 선포'의 이야기 순서로 엮었습니다. 조성은 e단조에서 시작해 장조로 밝아지고, V. '고요한 밤'(B♭장조)에서 가장 낮고 고요하게 가라앉은 뒤 C장조 → D장조 → E♭장조로 쉬지 않고 올라갑니다. 감정의 정점은 두 번 옵니다. 하나는 반주가 사라지는 '고요한 밤' 3절이고, 다른 하나는 반음 올라가 회중과 함께 부르는 '기쁘다 구주 오셨네' 마지막 절입니다."
  }
}
\pageBreak
\markup \column {
  \fill-line { \fontsize #2 \bold "지휘자 노트 (Performance Notes)" }
  \vspace #0.6
  \override #'(line-width . 120) \override #'(font-name . "Nanum Myeongjo") \override #'(baseline-skip . 3.0) \fontsize #-0.8 \column {
    \wordwrap-string "1. 시작음 E는 지휘자가 조용히 허밍으로 제시합니다. I은 처음부터 끝까지 무반주이며, 남성 제창(T·B unis.)은 모음 [o]를 통일하고 숨표 뒤에도 같은 음색을 유지합니다. 마지막 화음은 E장조(피카르디 3도) — 테너의 G#을 밝게."
    \vspace #0.4
    \wordwrap-string "2. II의 'Oo'는 입술을 둥글게 하고, 소프라노 선율보다 한 단계 여리게 깔아 줍니다. 'everlasting light'에서만 mf로 열었다가 바로 닫습니다."
    \vspace #0.4
    \wordwrap-string "3. III은 목자의 들판입니다. 피아노는 D–A 지속음을 두 마디씩 페달로 이어 백파이프 같은 울림을 만듭니다. 1절 전반은 남성, 후반은 여성이 부르고, 후렴 'Noel'에서 처음으로 4성부가 모두 모입니다. 'Born is the King'은 marcato로 또렷하게."
    \vspace #0.4
    \wordwrap-string "4. IV의 Gloria 멜리스마는 'Glo-' 모음 [ɔ]를 유지한 채 8분음표마다 강박에만 가볍게 무게를 둡니다. 두 번째 후렴에서는 테너가 주선율을, 소프라노가 높은 데스캔트를 맡습니다(데스캔트는 소수 정예도 충분합니다)."
    \vspace #0.4
    \wordwrap-string "5. V의 1절은 소프라노 독창(또는 소수)이 자유롭게 노래하고, 3절은 무반주 4성부입니다. 반주가 빠지는 순간이 메들리 전체의 고요한 정점입니다. 마지막 'birth'는 morendo로 사라지게 하고, 2–3초 정적 뒤에 VI로 넘어갑니다."
    \vspace #0.4
    \wordwrap-string "6. VI 후렴은 순차적으로 쌓입니다. 'O come, let us adore Him'을 남성(mf) → 알토와 남성(f) → 전체(ff) 순서로 부르고, 'Christ the Lord'는 fff, allargando로 넓게 마무리합니다."
    \vspace #0.4
    \wordwrap-string "7. VII 1절에서 테너·베이스는 'And heav'n and nature sing'을 한 마디 늦게 메아리처럼 따라갑니다. 반음 상승(D→E♭) 두 마디 동안 회중을 일으켜 세워 함께 부르도록 안내합니다. 이때 알토와 테너는 주선율, 베이스는 화성, 소프라노는 데스캔트를 부릅니다. 알토 주선율의 최고음 E♭5가 버거우면 일부 알토는 테너와 같은 옥타브로 부르고, 베이스 divisi의 낮은 E♭은 가능한 인원만 부릅니다. 마지막 'A-men'은 fff로 길게."
  }
  \vspace #1
  \fill-line { \fontsize #2 \bold "용어 해설 (Glossary)" }
  \vspace #0.4
  \override #'(baseline-skip . 2.8) \fontsize #-1 \fill-line {
    \column {
      \line { \bold "ppp" "매우 매우 여리게" }
      \line { \bold "pp" "매우 여리게" }
      \line { \bold "p" "여리게" }
      \line { \bold "mp" "조금 여리게" }
      \line { \bold "mf" "조금 세게" }
      \line { \bold "f" "세게" }
      \line { \bold "ff" "매우 세게" }
      \line { \bold "fff" "매우 매우 세게" }
      \line { \bold "cresc. ( < )" "점점 세게" }
      \line { \bold "dim. ( > )" "점점 여리게" }
      \line { \bold "fermata" "늘임표" }
    }
    \column {
      \line { \bold "Lento misterioso" "느리고 신비롭게" }
      \line { \bold "Andante tranquillo" "조용히 걷는 빠르기로" }
      \line { \bold "Andante pastorale" "목가적으로" }
      \line { \bold "Allegro giocoso" "빠르고 즐겁게" }
      \line { \bold "Adagio, dolce" "느리게, 부드럽게" }
      \line { \bold "Più lento" "더 느리게" }
      \line { \bold "Maestoso" "장엄하게" }
      \line { \bold "Allegro con brio" "빠르고 생기 있게" }
      \line { \bold "Grandioso" "웅장하게" }
      \line { \bold "rit. / allargando" "점점 느리게 / 점점 느리고 폭넓게" }
    }
    \column {
      \line { \bold "dolce" "부드럽게" }
      \line { \bold "leggiero" "가볍게" }
      \line { \bold "marcato" "또렷하게" }
      \line { \bold "morendo" "사라지듯이" }
      \line { \bold "con brio" "생기 있게" }
      \line { \bold "come un'eco" "메아리처럼" }
      \line { \bold "a cappella" "무반주" }
      \line { \bold "unis." "제창(같은 선율)" }
      \line { \bold "Descant" "선율 위의 대선율" }
      \line { \bold "Solo / Tutti" "독창 / 전체" }
      \line { \bold "hum / Oo" "허밍 / 둥근 모음" }
    }
  }
  \vspace #1
  \fill-line { \fontsize #2 \bold "낭독 본문 (Narration)" }
  \vspace #0.4
  \override #'(line-width . 120) \override #'(font-name . "Nanum Myeongjo") \fontsize #-1 \column {
    \wordwrap-string "낭독 1 — 이사야 9:6 (I과 II 사이). 낭독 2 — 누가복음 2:10–11 (III과 IV 사이). 한국어 낭독은 교회에서 사용하는 성경 역본으로 해 주십시오. 피아노는 낭독이 끝날 때까지 늘임표 화음을 페달로 유지합니다. 아래는 퍼블릭 도메인 영어 본문(KJV)입니다."
    \vspace #0.3
    \italic \wordwrap-string "Isaiah 9:6 — For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace."
    \vspace #0.3
    \italic \wordwrap-string "Luke 2:10–11 — And the angel said unto them, Fear not: for, behold, I bring you good tidings of great joy, which shall be to all people. For unto you is born this day in the city of David a Saviour, which is Christ the Lord."
  }
  \vspace #1
  \fill-line { \fontsize #2 \bold "가사와 저작권 (Texts & Copyright)" }
  \vspace #0.4
  \override #'(line-width . 120) \override #'(font-name . "Nanum Myeongjo") \fontsize #-1 \column {
    \wordwrap-string "선율과 영어 가사는 모두 퍼블릭 도메인입니다 (VENI EMMANUEL · ST. LOUIS · THE FIRST NOWELL · GLORIA · STILLE NACHT · ADESTE FIDELES · ANTIOCH). 새찬송가 한국어 가사는 별도의 저작권이 있을 수 있어 이 악보에는 넣지 않았습니다. 한국어로 부르려면 사용 허락을 확인한 뒤 음절에 맞춰 붙이십시오. 이 편곡(화성, 성부 진행, 구성, 연결부, 데스캔트)의 저작권은 편곡자에게 있습니다."
    \vspace #0.3
    \bold "© @YEAR@ @ARR@. All Rights Reserved."
  }
}
\pageBreak
'''


def staff_block(v, music, lyr, midi=False, practice=None):
    names = {"S": ("Soprano", "S.", "sop", "treble"), "A": ("Alto", "A.", "alt", "treble"),
             "T": ("Tenor", "T.", "ten", "treble_8"), "B": ("Bass", "B.", "bas", "bass")}
    full, short, vid, clef = names[v]
    pan = {"S": -0.5, "A": -0.2, "T": 0.2, "B": 0.5}[v]
    instr = "choir aahs"
    vol = ""
    if practice is not None:
        if practice == v:
            instr = "acoustic grand"
            vol = "midiMinimumVolume = #0.85 midiMaximumVolume = #1.0"
        else:
            vol = "midiMinimumVolume = #0.15 midiMaximumVolume = #0.35"
    with_ = '\\with { instrumentName = "%s" shortInstrumentName = "%s" midiInstrument = "%s" midiPanPosition = #%s %s }' % (full, short, instr, pan, vol)
    s = '\\new Staff = "%s" %s << \\clef "%s" \\global \\new Voice = "%s" { \\dynamicUp %s } >>\n' % (v, with_, clef, vid, music)
    if not midi:
        s += '\\new Lyrics \\lyricsto "%s" { %s }\n' % (vid, lyr)
    return s


def piano_block(rh, lh, dyn, midi=False, practice=None):
    vol = ""
    if practice is not None:
        vol = "midiMinimumVolume = #0.2 midiMaximumVolume = #0.35"
    if midi:
        return ('\\new PianoStaff << \\new Staff \\with { midiInstrument = "acoustic grand" %s } << \\global { %s } { %s } >>\n'
                '\\new Staff \\with { midiInstrument = "acoustic grand" %s } << \\global { %s } { %s } >> >>\n') % (vol, rh, dyn, vol, lh, dyn)
    return ('\\new PianoStaff \\with { instrumentName = "Piano" shortInstrumentName = "Pno." } <<\n'
            '\\new Staff = "RH" \\with { \\override VerticalAxisGroup.remove-first = ##t } << \\global { %s } >>\n'
            '\\new Dynamics { %s }\n'
            '\\new Staff = "LH" \\with { \\override VerticalAxisGroup.remove-first = ##t } << \\global \\clef bass { %s } >>\n'
            '>>\n') % (rh, dyn, lh)


LAYOUT = r'''
\layout {
  indent = 18\mm
  short-indent = 8\mm
  \context { \Staff \RemoveEmptyStaves }
  \context { \Score
    \override BarNumber.break-visibility = ##(#f #f #t)
    rehearsalMarkFormatter = #format-mark-box-alphabet
    \override RehearsalMark.font-size = #2
    \override RehearsalMark.outside-staff-horizontal-padding = #2
    \override RehearsalMark.outside-staff-priority = #2000
    \override MetronomeMark.outside-staff-horizontal-padding = #1.5
    \override SectionLabel.font-size = #1
    \override MetronomeMark.font-size = #0.5
  }
  \context { \Lyrics \override LyricText.font-size = #-0.6 }
  \context { \Dynamics \override VerticalAxisGroup.remove-empty = ##t \override VerticalAxisGroup.remove-first = ##t }
}
'''

MIDI = r'''
\midi {
  \context { \Voice \remove "Dynamic_performer" }
  \context { \Staff \consists "Dynamic_performer" }
}
'''


def make_ly(music, lyrics, globs, prh, plh, pdyn, kind="score", practice=None):
    glob = "global = { %s }\n" % " | ".join(globs)
    mus = {v: " | ".join(music[v]) for v in VOICES}
    lyr = {v: E.lyric_string(lyrics[v]) for v in VOICES}
    rh, lh, dy = " | ".join(prh), " | ".join(plh), " ".join(pdyn)
    pre = PREAMBLE.replace("@YEAR@", YEAR).replace("@ARR@", ARRANGER)
    out = [pre, glob]
    if kind == "score":
        out.append('\\header { title = ##f tagline = ##f }\n')
        out.append(FRONT.replace("@YEAR@", YEAR).replace("@ARR@", ARRANGER)
                   .replace("@TKO@", TITLE_KO).replace("@TEN@", TITLE_EN))
        out.append('\\score {\n \\header { piece = \\markup \\column { \\fill-line { \\fontsize #4 \\bold "%s" } '
                   '\\fill-line { \\italic "%s — A Christmas Cantata Medley" } '
                   '\\fill-line { "" \\right-column { "Arr. %s" "© %s" } } \\vspace #1 } }\n' % (TITLE_KO, TITLE_EN, ARRANGER, YEAR))
        out.append("<<\n\\new ChoirStaff <<\n")
        for v in VOICES:
            out.append(staff_block(v, mus[v], lyr[v]))
        out.append(">>\n")
        out.append(piano_block(rh, lh, dy))
        out.append(">>\n" + LAYOUT + "}\n")
    else:
        out.append("\\score {\n<<\n")
        for v in VOICES:
            out.append(staff_block(v, mus[v], lyr[v], midi=True, practice=practice))
        out.append(piano_block(rh, lh, dy, midi=True, practice=practice))
        out.append(">>\n" + MIDI + "}\n")
    return "".join(out)


def run(cmd, **kw):
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True, **kw)


def main():
    music, lyrics, globs, prh, plh, pdyn, warnings = compile_all()
    print("checks: bars and lyrics OK")
    print("voice-leading notes (%d):" % len(warnings))
    for w in warnings:
        print("  ", w)
    if "--check" in sys.argv:
        return
    os.makedirs(OUT, exist_ok=True)
    base = "Christmas_Cantata_Medley"
    files = {
        base + ".ly": make_ly(music, lyrics, globs, prh, plh, pdyn, "score"),
        base + "_midi.ly": make_ly(music, lyrics, globs, prh, plh, pdyn, "midi"),
    }
    for v, nm in zip(VOICES, ["Soprano", "Alto", "Tenor", "Bass"]):
        files["%s_practice_%s.ly" % (base, nm)] = make_ly(music, lyrics, globs, prh, plh, pdyn, "midi", practice=v)
    for fn, txt in files.items():
        with open(os.path.join(OUT, fn), "w") as f:
            f.write(txt)
    if "--ly-only" in sys.argv:
        return
    for fn in files:
        run(["lilypond", "-dno-point-and-click", "-o", OUT, os.path.join(OUT, fn)])


if __name__ == "__main__":
    main()
