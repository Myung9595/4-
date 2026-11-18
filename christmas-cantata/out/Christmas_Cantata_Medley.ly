
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
    \fontsize #-2 \concat { "© 2026 [편곡자 이름] · All Rights Reserved" }
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
global = { \time 4/4 \key e \minor \partial 4 \tempoI \secI s4 | s1 | s1 | \time 3/4 s2. | \time 4/4 s1 | s1 | \time 3/4 s2. | \time 4/4 s1 | \time 3/4 s2. | s2. | \time 4/4 s1 | s1 | s1 | \mark \default s1 | s1 | \time 3/4 s2. | \time 4/4 s1 | s1 | s1 | s1 | \tempoNarr s1 | \key g \major \time 4/4 \tempoII \secII s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \key d \major \time 3/4 \tempoIII \secIII s2. | s2. | s2. | s2. | \mark \default s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | \mark \default s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | \mark \default s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | \time 4/4 \key d \major \tempoNarr s1 | \key f \major \time 2/2 \tempoIV \secIV s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \time 2/2 \tempoTransV s1 | s1 | \key bf \major \time 6/8 \tempoV \secV s2. | s2. | \mark \default s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | \mark \default \tempoVb s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | s2. | \key c \major \time 4/4 \tempoTransVI s1 | s1 | \tempoVI \secVI s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \mark \default s1 | s1 | s1 | s1 | s1 | s1 | s1 | s1 | \key d \major \time 2/4 \tempoVII \secVII s2 | s2 | s2 | s2 | \mark \default s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | \key ef \major s2 | s2 | \mark \default \tempoVIIb s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | s2 | \time 4/4 \tempoCoda s1 | s1 | s1 }
\header { title = ##f tagline = ##f }

\markup \column {
  \vspace #1
  \fill-line { \fontsize #9 \bold "말씀이 육신이 되어" }
  \vspace #0.6
  \fill-line { \fontsize #3 \italic "The Word Became Flesh" }
  \vspace #0.4
  \fill-line { \fontsize #1.5 "A Christmas Cantata Medley · 성탄 칸타타 메들리" }
  \fill-line { \fontsize #0.5 "혼성 4부 합창(SATB)과 피아노 · 낭독 2회 포함 약 9–10분" }
  \vspace #1
  \fill-line { \fontsize #2 \bold "Arranged by [편곡자 이름] (편곡)" }
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
    \wordwrap-string "2. II의 'Oo'는 입술을 둥글게 하고, 소프라노 선율보다 한 단계 여리게 깔아 줍니다. '늘 빛나는 빛'(everlasting light)에서만 mf로 열었다가 바로 닫습니다."
    \vspace #0.4
    \wordwrap-string "3. III은 목자의 들판입니다. 피아노는 D–A 지속음을 두 마디씩 페달로 이어 백파이프 같은 울림을 만듭니다. 1절 전반은 남성, 후반은 여성이 부르고, 후렴 '노엘'(Noel)에서 처음으로 4성부가 모두 모입니다. '나셨네'(Born is the King)는 marcato로 또렷하게."
    \vspace #0.4
    \wordwrap-string "4. IV의 '영광을'(Gloria) 멜리스마는 '영-' 모음 [ʌ]를 유지한 채 8분음표마다 강박에만 가볍게 무게를 둡니다. 두 번째 후렴에서는 테너가 주선율을, 소프라노가 높은 데스캔트를 맡습니다(데스캔트는 소수 정예도 충분합니다)."
    \vspace #0.4
    \wordwrap-string "5. V의 1절은 소프라노 독창(또는 소수)이 자유롭게 노래하고, 3절은 무반주 4성부입니다. 반주가 빠지는 순간이 메들리 전체의 고요한 정점입니다. 마지막 '날'(birth)은 morendo로 사라지게 하고, 2–3초 정적 뒤에 VI로 넘어갑니다."
    \vspace #0.4
    \wordwrap-string "6. VI 후렴은 순차적으로 쌓입니다. '오 와서 경배하세'(O come, let us adore Him)를 남성(mf) → 알토와 남성(f) → 전체(ff) 순서로 부르고, '주 예수'(Christ the Lord)는 fff, allargando로 넓게 마무리합니다."
    \vspace #0.4
    \wordwrap-string "7. VII 1절에서 테너·베이스는 '하늘 땅 노래해'(And heav'n and nature sing)를 한 마디 늦게 메아리처럼 따라갑니다. 반음 상승(D→E♭) 두 마디 동안 회중을 일으켜 세워 함께 부르도록 안내합니다. 이때 알토와 테너는 주선율, 베이스는 화성, 소프라노는 데스캔트를 부릅니다. 알토 주선율의 최고음 E♭5가 버거우면 일부 알토는 테너와 같은 옥타브로 부르고, 베이스 divisi의 낮은 E♭은 가능한 인원만 부릅니다. 마지막 '아멘'은 fff로 길게."
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
    \wordwrap-string "한국어 가사는 퍼블릭 도메인인 영어 원가사(VENI EMMANUEL · ST. LOUIS · THE FIRST NOWELL · GLORIA · STILLE NACHT · ADESTE FIDELES · ANTIOCH)를 바탕으로 편곡자가 새로 번역해 한 음에 한 글자씩 맞춘 것입니다. 새찬송가 가사는 별도의 저작권이 있을 수 있어 사용하지 않았습니다. 영어 원가사판 악보는 별도 파일(_English.pdf)로 제공합니다. 이 편곡(화성, 성부 진행, 구성, 연결부, 데스캔트)과 한국어 번역 가사의 저작권은 편곡자에게 있습니다."
    \vspace #0.3
    \bold "© 2026 [편곡자 이름]. All Rights Reserved."
  }
}
\pageBreak
\score {
 \header { piece = \markup \column { \fill-line { \fontsize #4 \bold "말씀이 육신이 되어" } \fill-line { \italic "The Word Became Flesh — A Christmas Cantata Medley" } \fill-line { "" \right-column { "Arr. [편곡자 이름]" "© 2026" } } \vspace #1 } }
<<
\new ChoirStaff <<
\new Staff = "S" \with { instrumentName = "Soprano" shortInstrumentName = "S." midiInstrument = "choir aahs" midiPanPosition = #-0.5  } << \clef "treble" \global \new Voice = "sop" { \dynamicUp r4 | R1 | R1 | R2. | R1 | R1 | r2 a'4\p\dolce\womenUnis | a'4 e'4 e'4 fs'4 | g'4( fs'4) e'4 | d'2 g'4 | a'4 b'4 b'4 b'4 | a'4( c''4 b'4) a'4 | g'2 r2 | d''4\mp\<\tuttiK d''2 b'4 | b'2\mf b'4 a'4(\> | c''4 b'4) a'4 | g'2.\p a'4 | b'4\mp\< g'4 e'4 g'4\! | a'4(\> fs'4 e'4) d'4 | e'1\pp\fermata | R1 | R1 | r2. b'4\mp\dolce\melodyK | b'4 b'4 as'4 b'4 | d''4 c''4 e'4 a'4 | g'4 fs'8( g'8) a'4 d'4 | b'2. b'4 | b'4 b'4 e''4 d''4 | d''4 c''4 e'4 a'4 | g'4 fs'8( g'8) b'4 a'4 | g'2. b'4\< | b'4 b'4 a'4 g'4 | fs'2 fs'4 fs'4 | e'4\mf fs'4-- g'4-- a'4-- | b'2.\> b'4\p | b'4 b'4 as'4 b'4 | d''4 c''4 e'4 e''4 | d''4\ritK g'4 b'4. a'8 | g'2.\pp r4 | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | r2 fs'8\mp\dolce\womenLead e'8 | d'4. e'8 fs'8( g'8) | a'2 b'8 cs''8 | d''4 cs''4 b'4 | a'2 b'8 cs''8 | d''4 cs''4 b'4 | a'4( b'4 cs''4) | d''4( a'4 g'4 | fs'2) fs'8(\mf\tuttiK e'8) | d'4.\f e'8( fs'8 g'8) | a'2 d''8( cs''8) | b'2 b'4 | a'2. | d''4\marcK cs''4 b'4 | a'4 b'4 cs''4 | d''4\allargK a'4( g'4 | fs'2.\fermata) | R1 | R1 | R1 | a'4\mf\leggiero\womenOnly a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 | a'4 a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 | c''2(\f\<\tuttiK d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4.\!) c'8 c'2 | f'4 g'4 a'4 bf'4 | a'2 g'4 r4 | c''2(\< d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4.\!) c'8 c'2 | f'4 g'4 a'4 bf'4 | a'2( g'2) | f'1 | a'4\f\marcK a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 | a'4\< a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4\ff g'4 a'4 c''4 | a'4. g'8 f'2 | f''2.(\ff\descantK c''4 | bf'2 g'4 c''4 | c''2 d''2 | bf'4.) c''8 g'2 | f'4 g'4 a'4 bf'4 | a'2 g'4 r4 | c''2(\melodyK d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4.) c'8 c'2 | f'4\allargK\< g'4 a'4 bf'4 | a'2( g'2) | f'1\fff\fermata | R1 | R1 | R2. | R2. | f'8.\p\soloK g'16 f'8 d'4. | f'8. g'16 f'8 d'4. | c''4 c''8 a'4. | bf'4 bf'8 f'4. | g'4 g'8 bf'8. a'16 g'8 | f'8. g'16 f'8 d'4. | g'4 g'8 bf'8. a'16 g'8 | f'8. g'16 f'8 d'4. | c''4\< c''8 ef''8. c''16 a'8 | bf'4.\> d''4. | bf'8\p f'8 d'8 f'8. ef'16 c'8 | bf2. | R2. | f'8.\pp\tuttiAcap g'16 f'8 d'4. | f'8. g'16 f'8 d'4. | c''4 c''8 a'4. | bf'4 bf'8 f'4. | g'4 g'8 bf'8. a'16 g'8 | f'8. g'16 f'8 d'4. | g'4 g'8 bf'8. a'16 g'8 | f'8. g'16 f'8 d'4. | c''4\< c''8 ef''8. c''16 a'8 | bf'4.(\> d''4.) | bf'8(\pp f'8) d'8 f'8. ef'16 c'8 | d'2.\ppp\morendo\fermata | R1 | R1 | r2. c''4\f\maestK | c''2 g'4 c''4 | d''2 g'2 | e''4 d''4 e''4 f''4 | e''2 d''4 c''4 | c''2 b'4 a'4 | b'4( c''4) d''4 e''4 | b'2( a'4.) g'8 | g'1 | g''2\ff f''4 e''4 | f''2 e''2 | d''4 e''4 c''4 d''4 | b'4.( a'8) g'4 r4 | R1 | R1 | R1 | r2. e''4\ff\tuttiK | f''4 e''4 d''4 c''4 | b'2 c''4( f''4) | e''2(\allargK d''4.) c''8 | c''2.\fff\fermata r4 | R2 | R2 | R2 | R2 | d''4\f\conBrioK cs''8. b'16 | a'4. g'8 | fs'4 e'4 | d'4. a'8 | b'4. b'8 | cs''4. cs''8 | d''4. d''8 | d''8 cs''8 b'8 a'8 | a'8. g'16 fs'8 d''8 | d''8 cs''8 b'8 a'8 | a'8. g'16( fs'8) fs'8\mf | fs'8 fs'8 fs'8 fs'16 g'16 | a'4. g'16( fs'16) | e'8\< e'8 e'8 e'16( fs'16) | g'4. fs'16( e'16) | d'8\ff d''4 b'8 | a'8. g'16 fs'8 g'8( | fs'4 e'4 | d'2) | R2 | R2 | g''4\ff\descantK f''8. af''16 | ef''4. f''8 | ef''4 d''4 | ef''4. g''8 | af''4. af''8 | f''4. af''8 | g''4. g''8 | g''8 f''8 ef''8 d''8 | ef''8. d''16 ef''8 g''8 | g''8 f''8 ef''8 d''8 | ef''8.( d''16 ef''8) ef''8 | ef''8 ef''8 ef''8 ef''16( f''16) | g''4. f''16( ef''16) | d''8 d''8 d''8 d''16( ef''16) | f''4.( ef''16 d''16) | g''8 g''4 ef''8 | g''8. f''16 ef''8( f''8 | g''4 af''4 | g''2) | af''1\ff\< | g''1~\fff | g''1\fermata } >>
\new Lyrics \with { \override LyricText.font-name = "Nanum Myeongjo" } \lyricsto "sop" { "먼" "땅" "에" "서" "슬" "피" __ "우" "니" "주" "님" "오" "실" "그" "날" __ "까" "지." "기" "뻐" "하" "라" "임" "마" __ "누" "엘," "곧" "오" "시" "리" "이" "스" __ "라" "엘." "작" "은" "마" "을" "베" "들" "레" "헴" "고" "요" "히" __ "잠" "든" "밤," "꿈" "도" "없" "는" "깊" "은" "잠" "위" "별" "빛" "이" __ "흐" "르" "네." "어" "두" "운" "그" "거" "리" "에" "도" "늘" "빛" "나" "는" "빛," "모" "든" "세" "대" "꿈" "과" "눈" "물" "이" "밤" "네" "게" "있" "네." "양" "떼" "를" "지" "키" __ "며" "누" "운" "들" "판" "에" "그" "춥" "고" "깊" "은" "겨" "울" __ "밤," __ "노" __ "엘," "노" __ "엘," "노" __ "엘," "노" "엘," "나" "셨" "네" "이" "스" "라" "엘" "왕." __ "천" "사" "노" "래" "들" "리" "네," "들" "판" "위" "에" "울" "리" "네." "산" "들" "도" "화" "답" "하" "네," "기" "쁜" "노" "래" "메" "아" "리." "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "베" "들" "레" "헴" "와" "보" "라," "천" "사" "찬" "송" "한" "아" "기." "엎" "드" "려" "경" "배" "하" "라," "나" "신" "왕" "그" "리" "스" "도." "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "고" "요" "한" "밤," "거" "룩" "한" "밤!" "평" "온" "해," "빛" "나" "네." "동" "정" "녀" "어" "머" "니" "품" "안" "에" "거" "룩" "한" "아" "기" "참" "온" "유" "해." "하" "늘" "의" "평" "화" "속" "에" "평" "안" "히" "잠" "드" "소" "서." "고" "요" "한" "밤," "거" "룩" "한" "밤!" "독" "생" "자," "참" "사" "랑." "거" "룩" "한" "얼" "굴" "에" "빛" "나" "는" "구" "원" "의" "새" "벽" "밝" "아" "오" "네." "주" "예" "수" "나" "신" "날," __ "주" __ "예" "수" "나" "신" "날." "성" "도" "들" "아" "오" "라," "기" "쁨" "과" "승" "리" "로." "오" "오" "라" "다" "오" __ "라" "베" "들" __ "레" "헴." "와" "서" "보" "아" "라," "나" "신" "천" "사" "의" __ "왕." "오" "와" "서" "경" "배" "하" "세," __ "주" __ "예" "수." "기" "뻐" "하" "라" "주" "오" "셨" "네," "새" "왕" "을" "맞" "으" "라." "마" "음" "마" "다" "주" "모" "시" "라," "하" "늘" "과" "땅" "노" "래" "해," __ "하" "늘" "과" "땅" "노" "래" "해," "하" __ "늘" "과" "땅" "노" __ "래" "해," __ "하" "늘" "과" "땅" "노" "래" "해," __ "진" "리" "은" "혜" "로" "다" "스" "려," "열" "방" "이" "깨" "닫" "네." "주" "님" "의" "의" "로" "운" "영" "광," "놀" "라" "운" "그" "사" "랑," __ "놀" "라" "운" "그" "사" __ "랑," "놀" __ "라" "운" "그" "사" __ "랑," __ "놀" "라" "운" "그" "사" "랑," __ "아" "멘." }
\new Staff = "A" \with { instrumentName = "Alto" shortInstrumentName = "A." midiInstrument = "choir aahs" midiPanPosition = #-0.2  } << \clef "treble" \global \new Voice = "alt" { \dynamicUp r4 | R1 | R1 | R2. | R1 | R1 | r2 a'4\p\womenUnis | a'4 e'4 e'4 fs'4 | g'4( fs'4) e'4 | d'2 g'4 | a'4 b'4 b'4 b'4 | a'4( c''4 b'4) a'4 | g'2 r2 | g'4\mp\< a'2 g'4 | fs'2\mf g'4 e'4(\> | e'4 g'4) fs'4 | d'2.\p d'4 | d'4\mp\< e'4 c'4 e'4\! | e'4(\> c'4 b4) b4 | b1\pp\fermata | R1 | R1 | r2. d'4(\p\ooVowel | d'2 cs'4 d'4 | f'4 e'4 c'4 e'4 | d'1~) | d'2. d'4( | d'4 g'4 gs'2 | a'4 e'4 c'4 e'4 | d'2 fs'2 | g'2.) g'4(\< | g'2 fs'4 e'4 | ds'1 | e'4\mf fs'4 g'4 e'4 | fs'2.\>) g'4(\p | d'2 cs'4 d'4 | e'2 c'4 e'8 fs'8 | g'4 cs'4 d'4. c'8 | b2.\pp) r4 | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | r2 d'8\mp cs'8 | d'4. cs'8 d'8( e'8) | fs'2 g'8 a'8 | b'4 a'4 g'4 | d'2 g'8 a'8 | b'4 fs'4 g'4 | d'4( g'4 a'4) | b4( d'4 cs'4 | d'2) d'8(\mf cs'8) | a4.\f cs'8( d'8 b8) | fs'2 g'8( e'8) | e'2 d'4 | cs'2. | a'4 a'4 fs'4 | e'4 d'4 e'4 | d'4 d'4( cs'4 | d'2.\fermata) | R1 | R1 | R1 | f'4\mf f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 | f'4 f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 | f'4(\f\< a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4.\!) c'8 c'2 | c'4 e'4 f'4 g'4 | f'2 e'4 r4 | f'4(\< a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4.\!) c'8 c'2 | c'4 e'4 f'4 f'4 | f'2( e'2) | c'1 | f'4\f f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 | f'4\< f'4 e'4 e'4 | g'4 g'4 f'2 | f'4\ff e'4 f'4 f'4 | f'4 e'4 f'2 | f'4(\ff a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4.) c'8 c'2 | c'4 e'4 f'4 g'4 | f'2 e'4 r4 | f'4( a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4.) c'8 c'2 | c'4\< e'4 f'4 f'4 | f'2( e'2) | c'1\fff\fermata | R1 | R1 | R2. | R2. | R2. | R2. | R2. | R2. | ef'2.(\pp\ooVowel | d'2.) | ef'2.( | d'2.) | ef'2.( | d'4. f'4.) | d'4.( ef'4. | d'2.) | R2. | d'8.\pp ef'16 d'8 bf4. | d'8. ef'16 d'8 bf4. | ef'4 ef'8 ef'4. | d'4 d'8 d'4. | ef'4 ef'8 g'8. f'16 ef'8 | d'8. ef'16 d'8 bf4. | ef'4 ef'8 g'8. f'16 ef'8 | d'8. ef'16 d'8 bf4. | ef'4\< ef'8 g'8. ef'16 ef'8 | d'4.(\> f'4.) | d'4\pp bf8 d'8. c'16 a8 | bf2.\ppp\fermata | R1 | R1 | r2. g'4\f | g'2 g'4 e'4 | g'2 g'2 | g'4 g'4 g'4 a'4 | g'2 g'4 e'4 | e'4( fs'4) g'4 fs'4 | g'2 g'4 g'4 | g'2( fs'4.) g'8 | g'1 | g'2\ff a'8( b'8) c''4 | a'4( b'4) c''2 | g'4 g'4 a'4 a'4 | g'2 g'4 r4 | R1 | r2. e'4\f\altoMelody | e'4 d'4 e'4 f'4 | e'2 d'4 g'4\ff | f'4 g'4 g'4 a'4 | g'2 g'4( a'4) | g'2( f'4.) e'8 | e'2.\fermata r4 | R2 | R2 | R2 | R2 | fs'4\f e'8. g'16 | d'4. e'8 | d'4 cs'4 | d'4. fs'8 | g'4. g'8 | e'4. g'8 | fs'4. fs'8 | fs'8 e'8 d'8 cs'8 | d'8. cs'16 d'8 fs'8 | fs'8 e'8 d'8 cs'8 | d'8. cs'16( d'8) d'8\mf | d'8 d'8 d'8 d'16 e'16 | fs'4. e'16( d'16) | cs'8\< cs'8 cs'8 cs'16( d'16) | e'4. d'16( cs'16) | d'8\ff a'4 g'8 | fs'8. e'16 d'8 e'8( | d'4 cs'4 | d'2) | R2 | R2 | ef''4\ff\altoMelodyCong d''8. c''16 | bf'4. af'8 | g'4 f'4 | ef'4. bf'8 | c''4. c''8 | d''4. d''8 | ef''4. ef''8 | ef''8 d''8 c''8 bf'8 | bf'8. af'16 g'8 ef''8 | ef''8 d''8 c''8 bf'8 | bf'8.( af'16 g'8) g'8 | g'8 g'8 g'8 g'16( af'16) | bf'4. af'16( g'16) | f'8 f'8 f'8 f'16( g'16) | af'4.( g'16 f'16) | ef'8 ef''4 c''8 | bf'8. af'16 g'8( af'8 | g'4 f'4 | ef'2) | c''1\ff\< | bf'1~\fff | bf'1\fermata } >>
\new Lyrics \with { \override LyricText.font-name = "Nanum Myeongjo" } \lyricsto "alt" { "먼" "땅" "에" "서" "슬" "피" __ "우" "니" "주" "님" "오" "실" "그" "날" __ "까" "지." "기" "뻐" "하" "라" "임" "마" __ "누" "엘," "곧" "오" "시" "리" "이" "스" __ "라" "엘." "Oo" __ "Oo" __ "Oo" __ "Oo" __ "양" "떼" "를" "지" "키" __ "며" "누" "운" "들" "판" "에" "그" "춥" "고" "깊" "은" "겨" "울" __ "밤," __ "노" __ "엘," "노" __ "엘," "노" __ "엘," "노" "엘," "나" "셨" "네" "이" "스" "라" "엘" "왕." __ "천" "사" "노" "래" "들" "리" "네," "들" "판" "위" "에" "울" "리" "네." "산" "들" "도" "화" "답" "하" "네," "기" "쁜" "노" "래" "메" "아" "리." "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "베" "들" "레" "헴" "와" "보" "라," "천" "사" "찬" "송" "한" "아" "기." "엎" "드" "려" "경" "배" "하" "라," "나" "신" "왕" "그" "리" "스" "도." "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "Oo" __ "Oo" __ "Oo" __ "Oo" __ "고" "요" "한" "밤," "거" "룩" "한" "밤!" "독" "생" "자," "참" "사" "랑." "거" "룩" "한" "얼" "굴" "에" "빛" "나" "는" "구" "원" "의" "새" "벽" "밝" "아" "오" "네." "주" "예" "수" "나" "신" "날," __ "주" "예" "수" "나" "신" "날." "성" "도" "들" "아" "오" "라," "기" "쁨" "과" "승" "리" "로." "오" "오" __ "라" "다" "오" "라" "베" "들" __ "레" "헴." "와" "서" __ "보" "아" __ "라," "나" "신" "천" "사" "의" "왕." "오" "와" "서" "경" "배" "하" "세," "오" "와" "서" "경" "배" "하" "세," __ "주" __ "예" "수." "기" "뻐" "하" "라" "주" "오" "셨" "네," "새" "왕" "을" "맞" "으" "라." "마" "음" "마" "다" "주" "모" "시" "라," "하" "늘" "과" "땅" "노" "래" "해," __ "하" "늘" "과" "땅" "노" "래" "해," "하" __ "늘" "과" "땅" "노" __ "래" "해," __ "하" "늘" "과" "땅" "노" "래" "해," __ "진" "리" "은" "혜" "로" "다" "스" "려," "열" "방" "이" "깨" "닫" "네." "주" "님" "의" "의" "로" "운" "영" "광," "놀" "라" "운" "그" "사" "랑," __ "놀" "라" "운" "그" "사" __ "랑," "놀" __ "라" "운" "그" "사" __ "랑," __ "놀" "라" "운" "그" "사" "랑," __ "아" "멘." }
\new Staff = "T" \with { instrumentName = "Tenor" shortInstrumentName = "T." midiInstrument = "choir aahs" midiPanPosition = #0.2  } << \clef "treble_8" \global \new Voice = "ten" { \dynamicUp e4\pp\misterioso\menUnisAcap | g4 b4 b4 b4 | a4( c'4 b4) a4 | g2 a4 | b4 g4 e4 g4 | a4( fs4 e4) d4 | e2 r4 | c'2(\pp\humMm b2~ | b2. | a2 b4 | c'2 d'2 | e'2 d'2 | d'2) r2 | b4\mp\< a2 b4 | d'2\mf e'4 c'4(\> | a4 b4) c'4 | b2.\p fs4 | g4\mp\< b4 a4 b4\! | a4(\> a4 g4) fs4 | gs1\pp\fermata | R1 | R1 | r2. g4(\p | g1 | gs4 a2 c'4 | b4 a8 b8 c'2 | b2.) g4( | g4 b2 e'4 | e'2 a4 c'4 | b4 as8 b8 d'4 c'4 | b2.) d'4(\< | d'4 b4 c'4 cs'4 | ds'1 | e4\mf fs4 g4 e'4 | ds'2.\>) d'4(\p | d'4 b4 g2 | gs4 a2 c'4 | b4 a8 g8 g4. fs8 | g2.\pp) r4 | R2. | R2. | R2. | r2 fs8\mf\menLead e8 | d4. e8 fs8 g8 | a2 b8( cs'8) | d'4 cs'4 b4 | a2 b8 cs'8 | d'4 cs'4 b4 | a4 b4 cs'4 | d'4( a4 g4 | fs2) r4 | a2.(~\pp\ooVowel | a2.~ | a2.~ | a2.~ | a2.~ | a2. | d4 fs4 e4 | d2) a8(\mf a8) | fs4.\f a8( a8 g8) | d'2 b8( a8) | g2 e4 | a2. | a4 a4 d'4 | a4 d'4 a4 | fs4 fs4( e4 | <d a>2.\fermata) | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | a2(\f\< d'2~ | d'2 c'2~ | c'2 bf2 | g4\!) f4 e2 | f4 c'4 c'4 d'4 | c'2 c'4 r4 | a2(\< d'2~ | d'2 c'2~ | c'2 bf2 | g4\!) f4 e2 | f4 c'4 c'4 d'4 | c'2.( bf4) | a1 | c'4\f c'4 c'4 c'4 | d'4 c'4 c'2 | c'4 c'4 c'4 c'4 | c'4. bf8 a2 | c'4\< c'4 c'4 c'4 | d'4 c'4 c'2 | c'4\ff c'4 c'4 c'4 | c'4. bf8 a2 | c'2(\ff\melodyK d'8 c'8 bf8 a8 | bf2 c'8 bf8 a8 g8 | a2 bf8 a8 g8 f8 | g4.) c'8 c'2 | f4 c'4 c'4 d'4 | c'2 c'4 r4 | a2( d'2~ | d'2 c'2~ | c'2 bf2 | g4) f4 e2 | f4\< c'4 c'4 d'4 | c'2.( bf4) | a1\fff\fermata | R1 | R1 | R2. | R2. | R2. | R2. | R2. | R2. | bf2.~\pp | bf2. | bf2.( | bf2.) | c'2.( | bf2.) | bf4.( a4. | f2.) | R2. | bf8.\pp bf16 bf8 f4. | bf8. bf16 bf8 f4. | a4 a8 c'4. | bf4 bf8 bf4. | bf4 bf8 bf8. c'16 bf8 | bf8. bf16 bf8 f4. | bf4 bf8 bf8. c'16 bf8 | bf8. bf16 bf8 f4. | a4\< a8 c'8. c'16 c'8 | bf2.\> | bf4\pp f8 bf8. a16 ef8 | d2.\ppp\fermata | R1 | R1 | r2. e'4\f | e'2 c'4 c'4 | b2 d'2 | c'4 d'4 c'4 c'4 | c'2 b4 c'4 | c'2 d'4 d'4 | g4( e4) b4 a4 | d'2( c'4.) b8 | b1 | e'2\ff f'4 g'4 | f'2 g'2 | g'4 c'4 e'4 f'4 | d'4.( c'8) b4 c'4\mf\menUnis | c'4 b4 c'4 d'4 | c'2 g4 c'4\f | c'4 d'4 c'4 a4 | c'2 b4 c'4\ff | c'4 c'4 d'4 e'4 | d'2 c'2 | c'2( b4.) c'8 | g2.\fermata r4 | R2 | R2 | R2 | R2 | a4\f a8. b16 | fs4. g8 | a4 g4 | fs4. d'8 | d'4. d'8 | cs'4. cs'8 | a4. a8 | a8 a8 fs8 fs8 | fs8. e16 fs8 a8 | a8 a8 fs8 fs8 | fs8. e16( fs8) r8 | r4 r8 a8\mf\echoK | a8 a8 a8 a8 | cs'2~\< | cs'2 | fs8\ff a4 b8 | d'8. d'16 a8 a8( | a4 g4 | fs2) | R2 | R2 | ef'4\ff\menMelody d'8. c'16 | bf4. af8 | g4 f4 | ef4. bf8 | c'4. c'8 | d'4. d'8 | ef'4. ef'8 | ef'8 d'8 c'8 bf8 | bf8. af16 g8 ef'8 | ef'8 d'8 c'8 bf8 | bf8.( af16 g8) g8 | g8 g8 g8 g16( af16) | bf4. af16( g16) | f8 f8 f8 f16( g16) | af4.( g16 f16) | ef8 ef'4 c'8 | bf8. af16 g8( af8 | g4 f4 | ef2) | ef'1\ff\< | ef'1~\fff | ef'1\fermata } >>
\new Lyrics \with { \override LyricText.font-name = "Nanum Myeongjo" } \lyricsto "ten" { "주" "오" "소" "서" "임" "마" __ "누" "엘," "묶" "인" "백" "성" "구" "하" __ "소" "서." "Mm" __ "기" "뻐" "하" "라" "임" "마" __ "누" "엘," "곧" "오" "시" "리" "이" "스" __ "라" "엘." "Oo" __ "Oo" __ "Oo" __ "Oo" __ "첫" "노" "엘" "을" "천" "사" "전" "하" __ "니" "들" "에" "서" "양" "치" "던" "가" "난" "한" "목" "자" "들," __ "Oo" __ "노" __ "엘," "노" __ "엘," "노" __ "엘," "노" "엘," "나" "셨" "네" "이" "스" "라" "엘" "왕." __ "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "베" "들" "레" "헴" "와" "보" "라," "천" "사" "찬" "송" "한" "아" "기." "엎" "드" "려" "경" "배" "하" "라," "나" "신" "왕" "그" "리" "스" "도." "영" __ "광" "을" "높" "이" "계" "신" "주" "께." "영" __ "광" "을" "높" "이" "계" "신" "주" __ "께." "Oo" "Oo" __ "Oo" __ "Oo" __ "고" "요" "한" "밤," "거" "룩" "한" "밤!" "독" "생" "자," "참" "사" "랑." "거" "룩" "한" "얼" "굴" "에" "빛" "나" "는" "구" "원" "의" "새" "벽" "밝" "아" "오" "네." "주" "예" "수" "나" "신" "날," "주" "예" "수" "나" "신" "날." "성" "도" "들" "아" "오" "라," "기" "쁨" "과" "승" "리" "로." "오" "오" "라" "다" "오" __ "라" "베" "들" __ "레" "헴." "와" "서" "보" "아" "라," "나" "신" "천" "사" "의" __ "왕." "오" "와" "서" "경" "배" "하" "세," "오" "와" "서" "경" "배" "하" "세," "오" "와" "서" "경" "배" "하" "세," "주" __ "예" "수." "기" "뻐" "하" "라" "주" "오" "셨" "네," "새" "왕" "을" "맞" "으" "라." "마" "음" "마" "다" "주" "모" "시" "라," "하" "늘" "과" "땅" "노" "래" "해," __ "하" "늘" "땅" "노" "래" "해," "하" "늘" "과" "땅" "노" "래" "해," __ "진" "리" "은" "혜" "로" "다" "스" "려," "열" "방" "이" "깨" "닫" "네." "주" "님" "의" "의" "로" "운" "영" "광," "놀" "라" "운" "그" "사" "랑," __ "놀" "라" "운" "그" "사" __ "랑," "놀" __ "라" "운" "그" "사" __ "랑," __ "놀" "라" "운" "그" "사" "랑," __ "아" "멘." }
\new Staff = "B" \with { instrumentName = "Bass" shortInstrumentName = "B." midiInstrument = "choir aahs" midiPanPosition = #0.5  } << \clef "bass" \global \new Voice = "bas" { \dynamicUp e4\pp\menUnis | g4 b4 b4 b4 | a4( c'4 b4) a4 | g2 a4 | b4 g4 e4 g4 | a4( fs4 e4) d4 | e2 r4 | a,2(\pp e2~ | e2. | b,2 g,4 | c2 b,2 | c2 d2 | g,2) r2 | g4\mp\< fs2 e4 | b,2\mf e4 a,4(\> | a,4 g,4) d4 | g,2.\p d4 | g,4\mp\< e4 a,4 g,4\! | c4(\> a,4 b,4) b,4 | e,1\pp\fermata | R1 | R1 | r2. g4(\p | g1 | c1 | d1 | g,2.) g4( | g4 f4 e2 | a2 a,2 | d1 | g2.) g4(\< | g2 a4 as4 | b2. b,4 | e4\mf fs4 g4 c'4 | b2.\>) g4(\p | g1 | c1 | d4 e4 d4. d8 | g,2.\pp) r4 | R2. | R2. | R2. | r2 d8\mp cs8 | d4. cs8 d8 e8 | fs2 g8( a8) | b4 a4 g4 | d2 g8 a8 | b4 fs4 g4 | d4 g4 a4 | b,4( a,4 a,4 | d2) r4 | d2.(~\pp | d2.~ | d2.~ | d2.~ | d2.~ | d2. | b,4 a,4 a,4 | d2) d8(\mf a,8) | d4.\f a,8( d8 e8) | fs2 e8( a,8) | e2 gs,4 | a,2. | fs4 e4 d4 | cs4 b,4 a,4 | b,4 a,4( a,4 | d2.\fermata) | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | R1 | f2(\f\< d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4\!) d4 c4( bf,4) | a,4 c4 f4 bf,4 | c2 c4 r4 | f2(\< d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4\!) d4 c4( bf,4) | a,4 c4 f4 bf,4 | c1 | f1 | f4\f f4 a4 a4 | g4 c4 f2 | f4 c4 f4 a4 | c'4 c4 f2 | f4\< f4 a4 a4 | d4 e4 f2 | f4\ff c4 f4 a,8( bf,8) | c4 c4 f2 | f2(\ff d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4) d4 c4( bf,4) | a,4 c4 f4 bf,4 | c2 c4 r4 | f2( d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4) d4 c4( bf,4) | a,4\< c4 f4 bf,4 | c1 | f1\fff\fermata | R1 | R1 | R2. | R2. | R2. | R2. | R2. | R2. | ef2.(\pp | bf,2.) | c2.( | f2.) | f2.( | bf,4. g,4.) | f,2.( | bf,2.) | R2. | bf,8.\pp bf,16 bf,8 bf,4. | bf,8. bf,16 bf,8 bf,4. | f4 f8 f4. | bf,4 bf,8 bf,4. | ef4 ef8 ef8. ef16 ef8 | bf,8. bf,16 bf,8 bf,4. | c4 c8 g8. g16 ef8 | f8. f16 f8 bf,4. | f4\< f8 f8. f16 f8 | bf,4.(\> g,4.) | g,8(\pp bf,8) bf,8 f,8. f,16 f,8 | bf,2.\ppp\fermata | R1 | R1 | r2. c4\f | c2 e4 c4 | g2 b2 | c'4 b4 c'4 f4 | g2 g4 a4 | a2 g4 d4 | d4( c4) b,4 c4 | d2( d4.) g8 | g1 | e2\ff d4 c4 | d2 c2 | b,4 c4 a,4 f,4 | g,2 g,4 c4\mf\menUnis | c4 b,4 c4 d4 | c2 g,4 c4\f | c4 b,4 a,4 d4 | g,2 g,4 e4\ff | d4 c4 b,4 a,4 | b,2 e4( f4) | g2( g,4.) c8 | c2.\fermata r4 | R2 | R2 | R2 | R2 | d4\f a,8. g,16 | fs,4. e,8 | fs,4 a,4 | d4. d8 | g4. g8 | a4. a,8 | d4. d8 | d8 a,8 b,8 fs,8 | d8. a,16 d8 d8 | d8 a,8 b,8 fs,8 | d8. a,16( d8) r8 | r4 r8 d8\mf | fs8 fs8 fs8 fs8 | a,2~\< | a,2 | d8\ff fs4 g8 | a,8. a,16 a,8 a,8( | a,4 a,4 | d2) | R2 | R2 | ef4\ff bf,8. af,16 | g,4. f,8 | g,4 bf,4 | ef4. ef8 | af4. af8 | bf4. bf,8 | ef4. ef8 | ef8 bf,8 c8 g,8 | ef8. bf,16 ef8 ef8 | ef8 bf,8 c8 g,8 | ef8.( bf,16 ef8) ef8 | ef8 ef8 ef8 ef8 | ef4. ef8 | bf,8 bf,8 bf,8 bf,8 | bf,2 | ef8 g4 af8 | bf,8. bf,16 bf,8( bf,8 | bf,4 bf,4 | ef2) | <af, af>1\ff\< | <ef, ef>1~\fff | <ef, ef>1\fermata } >>
\new Lyrics \with { \override LyricText.font-name = "Nanum Myeongjo" } \lyricsto "bas" { "주" "오" "소" "서" "임" "마" __ "누" "엘," "묶" "인" "백" "성" "구" "하" __ "소" "서." "Mm" __ "기" "뻐" "하" "라" "임" "마" __ "누" "엘," "곧" "오" "시" "리" "이" "스" __ "라" "엘." "Oo" __ "Oo" __ "Oo" __ "Oo" __ "첫" "노" "엘" "을" "천" "사" "전" "하" __ "니" "들" "에" "서" "양" "치" "던" "가" "난" "한" "목" "자" "들," __ "Oo" __ "노" __ "엘," "노" __ "엘," "노" __ "엘," "노" "엘," "나" "셨" "네" "이" "스" "라" "엘" "왕." __ "영" __ "광" "을" __ "높" "이" "계" "신" "주" "께." "영" __ "광" "을" __ "높" "이" "계" "신" "주" "께." "베" "들" "레" "헴" "와" "보" "라," "천" "사" "찬" "송" "한" "아" "기." "엎" "드" "려" "경" "배" "하" "라," "나" "신" "왕" "그" __ "리" "스" "도." "영" __ "광" "을" __ "높" "이" "계" "신" "주" "께." "영" __ "광" "을" __ "높" "이" "계" "신" "주" "께." "Oo" __ "Oo" __ "Oo" __ "Oo" __ "고" "요" "한" "밤," "거" "룩" "한" "밤!" "독" "생" "자," "참" "사" "랑." "거" "룩" "한" "얼" "굴" "에" "빛" "나" "는" "구" "원" "의" "새" "벽" "밝" "아" "오" "네." "주" "예" "수" "나" "신" "날," __ "주" __ "예" "수" "나" "신" "날." "성" "도" "들" "아" "오" "라," "기" "쁨" "과" "승" "리" "로." "오" "오" "라" "다" "오" __ "라" "베" "들" __ "레" "헴." "와" "서" "보" "아" "라," "나" "신" "천" "사" "의" "왕." "오" "와" "서" "경" "배" "하" "세," "오" "와" "서" "경" "배" "하" "세," "오" "와" "서" "경" "배" "하" "세," __ "주" __ "예" "수." "기" "뻐" "하" "라" "주" "오" "셨" "네," "새" "왕" "을" "맞" "으" "라." "마" "음" "마" "다" "주" "모" "시" "라," "하" "늘" "과" "땅" "노" "래" "해," __ "하" "늘" "땅" "노" "래" "해," "하" "늘" "과" "땅" "노" "래" "해," __ "진" "리" "은" "혜" "로" "다" "스" "려," "열" "방" "이" "깨" "닫" "네." "주" "님" "의" "의" "로" "운" "영" "광," "놀" "라" "운" "그" "사" "랑," __ "놀" "라" "운" "그" "사" "랑," "놀" "라" "운" "그" "사" "랑," "놀" "라" "운" "그" "사" "랑," __ "아" "멘." }
>>
\new PianoStaff \with { instrumentName = "Piano" shortInstrumentName = "Pno." } <<
\new Staff = "RH" \with { \override VerticalAxisGroup.remove-first = ##t } << \global { r4 | R1 | R1 | R2. | R1 | R1 | R2. | R1 | R2. | R2. | R1 | R1 | R1 | R1 | R1 | R2. | R1 | R1 | R1 | R1 | <e' gs' b' e''>1\fermata^\narrOne | <e' g' c''>2 <fs' a' d''>2 | <d' g' b'>1 | << { b'4 b'4 as'4 b'4 | d''4 c''4 e'4 a'4 | g'4 fs'8 g'8 a'4 d'4 | b'2. b'4 | b'4 b'4 e''4 d''4 | d''4 c''4 e'4 a'4 | g'4 fs'8 g'8 b'4 a'4 | g'2. b'4 | b'4 b'4 a'4 g'4 | fs'2 fs'4 fs'4 | e'4 fs'4 g'4 a'4 | b'2. b'4 | b'4 b'4 as'4 b'4 | d''4 c''4 e'4 e''4 | d''4 g'4 b'4. a'8 | g'2. r4 } \\ { d'2 cs'4 d'4 | f'4 e'4 c'4 e'4 | d'1~ | d'2. d'4 | d'4 g'4 gs'2 | a'4 e'4 c'4 e'4 | d'2 fs'2 | g'2. g'4 | g'2 fs'4 e'4 | ds'1 | e'4 fs'4 g'4 e'4 | fs'2. g'4 | d'2 cs'4 d'4 | e'2 c'4 e'8 fs'8 | g'4 cs'4 d'4. c'8 | b2. r4 } >> | r4 <fs' a' d''>4-. <fs' a' d''>4-. | r4 <e' g' cs''>4-. <e' g' cs''>4-. | r4 <fs' a' d''>4-. <fs' a' d''>4-. | r4 <e' g' a' cs''>4-. r4 | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | << { d'4. e'8 fs'8 g'8 | a'2 d''8 cs''8 | b'2 b'4 | a'2. | d''4 cs''4 b'4 | a'4 b'4 cs''4 | d''4 a'4 g'4 | fs'2. } \\ { a4. cs'8 d'8 b8 | fs'2 g'8 e'8 | e'2 d'4 | cs'2. | a'4 a'4 fs'4 | e'4 d'4 e'4 | d'4 d'4 cs'4 | d'2. } >> | <d' fs' a' d''>1\fermata^\narrTwo | <bf' d'' f''>4-. <bf' d'' f''>4-. <bf' d'' f''>4-. <bf' d'' f''>4-. | <g' c'' e''>4-. <g' bf' e''>4-. <g' bf' c'' e''>2 | << { a'4 a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 | a'4 a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 } \\ { f'4 f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 | f'4 f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 } >> | << { c''2 d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4. c'8 c'2 | f'4 g'4 a'4 bf'4 | a'2 g'4 r4 | c''2 d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4. c'8 c'2 | f'4 g'4 a'4 bf'4 | a'2 g'2 | f'1 } \\ { f'4 a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4. c'8 c'2 | c'4 e'4 f'4 g'4 | f'2 e'4 r4 | f'4 a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4. c'8 c'2 | c'4 e'4 f'4 f'4 | f'2 e'2 | c'1 } >> | << { a'4 a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 | a'4 a'4 a'4 c''4 | c''4. bf'8 a'2 | a'4 g'4 a'4 c''4 | a'4. g'8 f'2 } \\ { f'4 f'4 e'4 e'4 | g'4 e'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 | f'4 f'4 e'4 e'4 | g'4 g'4 f'2 | f'4 e'4 f'4 f'4 | f'4 e'4 f'2 } >> | << { f''2. c''4 | bf'2 g'4 c''4 | c''2 d''2 | bf'4. c''8 g'2 | f'4 g'4 a'4 bf'4 | a'2 g'4 r4 | c''2 d''8 c''8 bf'8 a'8 | bf'2 c''8 bf'8 a'8 g'8 | a'2 bf'8 a'8 g'8 f'8 | g'4. c'8 c'2 | f'4 g'4 a'4 bf'4 | a'2 g'2 | f'1 } \\ { f'4 a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4. c'8 c'2 | c'4 e'4 f'4 g'4 | f'2 e'4 r4 | f'4 a'8 g'8 f'2~ | f'4 g'8 f'8 e'2~ | e'4 f'8 e'8 d'2 | c'4. c'8 c'2 | c'4 e'4 f'4 f'4 | f'2 e'2 | c'1 } >> | <d' f' a'>2 <d' f' bf'>2 | <e' g' bf'>2 <ef' a' c''>2\ritK | <d' f'>4. <d' f'>4. | <d' f'>4. <d' f'>4. | <d' f'>4. <d' f'>4. | <d' f'>4. <d' f'>4. | <c' ef' a'>4. <c' ef' a'>4. | <d' f'>4. <d' f'>4. | <ef' g' bf'>4. <ef' g' bf'>4. | <d' f'>4. <d' f'>4. | <ef' g' bf'>4. <ef' g' bf'>4. | <d' f' bf'>4. <d' f' bf'>4. | <c' ef' a'>4. <c' ef' a'>4. | <d' f' bf'>4. <d' f' bf'>4. | <d' f' bf'>4. <c' ef' a'>4. | <d' f'>4. <d' f'>4. | <d' f' bf'>2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | <d' f' bf'>2 <d' g' bf'>2 | <c' f' a'>2 <c' f' af'>2 | <d' f' g' b'>2. <e' g' c''>4 | << { c''2 g'4 c''4 | d''2 g'2 | e''4 d''4 e''4 f''4 | e''2 d''4 c''4 | c''2 b'4 a'4 | b'4 c''4 d''4 e''4 | b'2 a'4. g'8 | g'1 | g''2 f''4 e''4 | f''2 e''2 | d''4 e''4 c''4 d''4 | b'4. a'8 g'4 r4 | R1 | R1 | R1 | r2. e''4 | f''4 e''4 d''4 c''4 | b'2 c''4 f''4 | e''2 d''4. c''8 | c''2. r4 } \\ { g'2 g'4 e'4 | g'2 g'2 | g'4 g'4 g'4 a'4 | g'2 g'4 e'4 | e'4 fs'4 g'4 fs'4 | g'2 g'4 g'4 | g'2 fs'4. g'8 | g'1 | g'2 a'8 b'8 c''4 | a'4 b'4 c''2 | g'4 g'4 a'4 a'4 | g'2 g'4 r4 | R1 | r2. e'4 | e'4 d'4 e'4 f'4 | e'2 d'4 g'4 | f'4 g'4 g'4 a'4 | g'2 g'4 a'4 | g'2 f'4. e'8 | e'2. r4 } >> | <a' cs'' e'' a''>4 r8 <a' cs'' e'' a''>8 | <d'' d'''>8 <cs'' cs'''>8 <b' b''>8 <a' a''>8 | <g' g''>8 <fs' fs''>8 <e' e''>8 <d' d''>8 | <a' d'' fs''>4 <a' cs'' e'' g''>4 | << { d''4 cs''8. b'16 | a'4. g'8 | fs'4 e'4 | d'4. a'8 | b'4. b'8 | cs''4. cs''8 | d''4. d''8 | d''8 cs''8 b'8 a'8 | a'8. g'16 fs'8 d''8 | d''8 cs''8 b'8 a'8 | a'8. g'16 fs'8 fs'8 | fs'8 fs'8 fs'8 fs'16 g'16 | a'4. g'16 fs'16 | e'8 e'8 e'8 e'16 fs'16 | g'4. fs'16 e'16 | d'8 d''4 b'8 | a'8. g'16 fs'8 g'8 | fs'4 e'4 | d'2 } \\ { fs'4 e'8. g'16 | d'4. e'8 | d'4 cs'4 | d'4. fs'8 | g'4. g'8 | e'4. g'8 | fs'4. fs'8 | fs'8 e'8 d'8 cs'8 | d'8. cs'16 d'8 fs'8 | fs'8 e'8 d'8 cs'8 | d'8. cs'16 d'8 d'8 | d'8 d'8 d'8 d'16 e'16 | fs'4. e'16 d'16 | cs'8 cs'8 cs'8 cs'16 d'16 | e'4. d'16 cs'16 | d'8 a'4 g'8 | fs'8. e'16 d'8 e'8 | d'4 cs'4 | d'2 } >> | <af' bf' d'' f''>4^\congStand <af' bf' d'' f''>4 | <af' bf' d'' f''>2 | << { g''4 f''8. af''16 | ef''4. f''8 | ef''4 d''4 | ef''4. g''8 | af''4. af''8 | f''4. af''8 | g''4. g''8 | g''8 f''8 ef''8 d''8 | ef''8. d''16 ef''8 g''8 | g''8 f''8 ef''8 d''8 | ef''8. d''16 ef''8 ef''8 | ef''8 ef''8 ef''8 ef''16 f''16 | g''4. f''16 ef''16 | d''8 d''8 d''8 d''16 ef''16 | f''4. ef''16 d''16 | g''8 g''4 ef''8 | g''8. f''16 ef''8 f''8 | g''4 af''4 | g''2 } \\ { ef''4 d''8. c''16 | bf'4. af'8 | g'4 f'4 | ef'4. bf'8 | c''4. c''8 | d''4. d''8 | ef''4. ef''8 | ef''8 d''8 c''8 bf'8 | bf'8. af'16 g'8 ef''8 | ef''8 d''8 c''8 bf'8 | bf'8. af'16 g'8 g'8 | g'8 g'8 g'8 g'16 af'16 | bf'4. af'16 g'16 | f'8 f'8 f'8 f'16 g'16 | af'4. g'16 f'16 | ef'8 ef''4 c''8 | bf'8. af'16 g'8 af'8 | g'4 f'4 | ef'2 } >> | <af' c'' ef'' af''>1 | <g' bf' ef'' g''>1~ | <g' bf' ef'' g''>1\fermata } >>
\new Dynamics { s4 s1 s1 s2. s1 s1 s2. s1 s2. s2. s1 s1 s1 s1 s1 s2. s1 s1 s1 s1 s1\pp s1\p s1 s1\p s1*7 s1\< s1 s1\mf s1\> s1\p s1*2 s1\pp s2.\p s2.*3 s2.\pp s2.*15 s2.\f s2.*7 s1\pp s1\f s1 s1\mf s1*7 s1\f s1*12 s1\f s1*5 s1\ff s1 s1\ff s1*10 s1\< s1\fff s1\mf\> s2 s2\p s2.\pp s2.*5 s2.\p s2.*3 s2.\< s2. s2.\> s2.\pp s2. s2. s2. s2. s2. s2. s2. s2. s2. s2. s2. s2. s2. s1\mp\< s1 s2. s4\f s1\f s1*7 s1\ff s1*3 s1\mf s1 s1\f s1 s1\ff s1 s1\fff s1 s2\f s2 s2\< s4 s4\ff s2\f s2*10 s2\mf s2*3 s2\ff s2*3 s2\< s2\ff s2\ff s2*18 s1\ff\< s1\fff s1 }
\new Staff = "LH" \with { \override VerticalAxisGroup.remove-first = ##t } << \global \clef bass { r4 | R1 | R1 | R2. | R1 | R1 | R2. | R1 | R2. | R2. | R1 | R1 | R1 | R1 | R1 | R2. | R1 | R1 | R1 | R1 | <e, b,>1\fermata | <c, c>2 <d, d>2 | <g, d>1 | << { g1 | gs4 a2 c'4 | b4 a8 b8 c'2 | b2. g4 | g4 b2 e'4 | e'2 a4 c'4 | b4 as8 b8 d'4 c'4 | b2. d'4 | d'4 b4 c'4 cs'4 | ds'1 | e4 fs4 g4 e'4 | ds'2. d'4 | d'4 b4 g2 | gs4 a2 c'4 | b4 a8 g8 g4. fs8 | g2. r4 } \\ { g1 | c1 | d1 | g,2. g4 | g4 f4 e2 | a2 a,2 | d1 | g2. g4 | g2 a4 as4 | b2. b,4 | e4 fs4 g4 c'4 | b2. g4 | g1 | c1 | d4 e4 d4. d8 | g,2. r4 } >> | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | <d, a,>2.~ | <d, a,>2. | << { fs4. a8 a8 g8 | d'2 b8 a8 | g2 e4 | a2. | a4 a4 d'4 | a4 d'4 a4 | fs4 fs4 e4 | <d a>2. } \\ { d4. a,8 d8 e8 | fs2 e8 a,8 | e2 gs,4 | a,2. | fs4 e4 d4 | cs4 b,4 a,4 | b,4 a,4 a,4 | d2. } >> | <d, a,>1\fermata | <bf, f>2 <bf, f>2 | <c, c>2 <c, c>2 | f,4 f,4 a,4 a,4 | g,4 c,4 f,2 | f,4 c,4 f,4 a,4 | c4 c,4 f,2 | f,4 f,4 a,4 a,4 | d,4 e,4 f,2 | f,4 c,4 f,4 a,,8 bf,,8 | c,4 c,4 f,2 | << { a2 d'2~ | d'2 c'2~ | c'2 bf2 | g4 f4 e2 | f4 c'4 c'4 d'4 | c'2 c'4 r4 | a2 d'2~ | d'2 c'2~ | c'2 bf2 | g4 f4 e2 | f4 c'4 c'4 d'4 | c'2. bf4 | a1 } \\ { f2 d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4 d4 c4 bf,4 | a,4 c4 f4 bf,4 | c2 c4 r4 | f2 d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4 d4 c4 bf,4 | a,4 c4 f4 bf,4 | c1 | f1 } >> | << { c'4 c'4 c'4 c'4 | d'4 c'4 c'2 | c'4 c'4 c'4 c'4 | c'4. bf8 a2 | c'4 c'4 c'4 c'4 | d'4 c'4 c'2 | c'4 c'4 c'4 c'4 | c'4. bf8 a2 } \\ { f4 f4 a4 a4 | g4 c4 f2 | f4 c4 f4 a4 | c'4 c4 f2 | f4 f4 a4 a4 | d4 e4 f2 | f4 c4 f4 a,8 bf,8 | c4 c4 f2 } >> | << { c'2 d'8 c'8 bf8 a8 | bf2 c'8 bf8 a8 g8 | a2 bf8 a8 g8 f8 | g4. c'8 c'2 | f4 c'4 c'4 d'4 | c'2 c'4 r4 | a2 d'2~ | d'2 c'2~ | c'2 bf2 | g4 f4 e2 | f4 c'4 c'4 d'4 | c'2. bf4 | a1 } \\ { f2 d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4 d4 c4 bf,4 | a,4 c4 f4 bf,4 | c2 c4 r4 | f2 d4 f4 | g2 c4 e4 | f2 bf,4 d4 | e4 d4 c4 bf,4 | a,4 c4 f4 bf,4 | c1 | f1 } >> | <d, a,>2 <g, d>2 | <c, c>2 <f, c>2 | bf,8 f8 bf8 d'8 bf8 f8 | bf,8 f8 bf8 d'8 bf8 f8 | bf,8 f8 bf8 d'8 bf8 f8 | bf,8 f8 bf8 d'8 bf8 f8 | f,8 c8 ef8 a8 ef8 c8 | bf,8 f8 bf8 d'8 bf8 f8 | ef,8 bf,8 ef8 g8 ef8 bf,8 | bf,8 f8 bf8 d'8 bf8 f8 | c8 g8 bf8 ef'8 bf8 g8 | f,8 bf,8 d8 f8 d8 bf,8 | f,8 c8 ef8 a8 ef8 c8 | bf,8 f8 d'8 g,8 d8 f8 | f,8 bf,8 d8 f,8 c8 ef8 | bf,8 f8 bf8 d'8 bf8 f8 | bf,8 f8 bf8 d'4. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | R2. | <bf, f>2 <g, d>2 | <a, f>2 <af, f>2 | <g, d>2. <c g>4 | << { e'2 c'4 c'4 | b2 d'2 | c'4 d'4 c'4 c'4 | c'2 b4 c'4 | c'2 d'4 d'4 | g4 e4 b4 a4 | d'2 c'4. b8 | b1 | e'2 f'4 g'4 | f'2 g'2 | g'4 c'4 e'4 f'4 | d'4. c'8 b4 c'4 | c'4 b4 c'4 d'4 | c'2 g4 c'4 | c'4 d'4 c'4 a4 | c'2 b4 c'4 | c'4 c'4 d'4 e'4 | d'2 c'2 | c'2 b4. c'8 | g2. r4 } \\ { c2 e4 c4 | g2 b2 | c'4 b4 c'4 f4 | g2 g4 a4 | a2 g4 d4 | d4 c4 b,4 c4 | d2 d4. g8 | g1 | e2 d4 c4 | d2 c2 | b,4 c4 a,4 f,4 | g,2 g,4 c4 | c4 b,4 c4 d4 | c2 g,4 c4 | c4 b,4 a,4 d4 | g,2 g,4 e4 | d4 c4 b,4 a,4 | b,2 e4 f4 | g2 g,4. c8 | c2. r4 } >> | <a,, a,>4 r8 <a,, a,>8 | <d, d>4 <fs, fs>4 | <g, g>4 <a, a>4 | <d, d>4 <a,, a,>4 | << { a4 a8. b16 | fs4. g8 | a4 g4 | fs4. d'8 | d'4. d'8 | cs'4. cs'8 | a4. a8 | a8 a8 fs8 fs8 | fs8. e16 fs8 a8 | a8 a8 fs8 fs8 | fs8. e16 fs8 r8 | r4 r8 a8 | a8 a8 a8 a8 | cs'2~ | cs'2 | fs8 a4 b8 | d'8. d'16 a8 a8 | a4 g4 | fs2 } \\ { d4 a,8. g,16 | fs,4. e,8 | fs,4 a,4 | d4. d8 | g4. g8 | a4. a,8 | d4. d8 | d8 a,8 b,8 fs,8 | d8. a,16 d8 d8 | d8 a,8 b,8 fs,8 | d8. a,16 d8 r8 | r4 r8 d8 | fs8 fs8 fs8 fs8 | a,2~ | a,2 | d8 fs4 g8 | a,8. a,16 a,8 a,8 | a,4 a,4 | d2 } >> | <bf,, bf,>4 <bf,, bf,>4 | <bf,, bf,>2 | << { ef'4 d'8. c'16 | bf4. af8 | g4 f4 | ef4. bf8 | c'4. c'8 | d'4. d'8 | ef'4. ef'8 | ef'8 d'8 c'8 bf8 | bf8. af16 g8 ef'8 | ef'8 d'8 c'8 bf8 | bf8. af16 g8 g8 | g8 g8 g8 g16 af16 | bf4. af16 g16 | f8 f8 f8 f16 g16 | af4. g16 f16 | ef8 ef'4 c'8 | bf8. af16 g8 af8 | g4 f4 | ef2 } \\ { ef4 bf,8. af,16 | g,4. f,8 | g,4 bf,4 | ef4. ef8 | af4. af8 | bf4. bf,8 | ef4. ef8 | ef8 bf,8 c8 g,8 | ef8. bf,16 ef8 ef8 | ef8 bf,8 c8 g,8 | ef8. bf,16 ef8 ef8 | ef8 ef8 ef8 ef8 | ef4. ef8 | bf,8 bf,8 bf,8 bf,8 | bf,2 | ef8 g4 af8 | bf,8. bf,16 bf,8 bf,8 | bf,4 bf,4 | ef2 } >> | <af,, af,>1 | <ef,, ef,>1~ | <ef,, ef,>1\fermata } >>
>>
>>

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
  \context { \Lyrics \override LyricText.font-size = #0.4 \override LyricSpace.minimum-distance = #0.9 }
  \context { \Dynamics \override VerticalAxisGroup.remove-empty = ##t \override VerticalAxisGroup.remove-first = ##t }
}
}
