# 말씀이 육신이 되어 — 성탄 칸타타 메들리

*The Word Became Flesh — A Christmas Cantata Medley* · 혼성 4부 합창(SATB)과 피아노 · 낭독 2회 포함 약 9–10분

## 결과물 (`out/`)

| 파일 | 내용 |
|---|---|
| `Christmas_Cantata_Medley.pdf` | 지휘자용 총보 15쪽 (표지·구성표, 지휘자 노트, 용어 해설, 낭독 본문 포함) |
| `Christmas_Cantata_Medley_midi.midi` | 전체 MIDI. S·A·T·B·피아노 트랙이 분리되어 있어 큐베이스나 로직에서 바로 열 수 있음 |
| `Christmas_Cantata_Medley_midi.mp3` | MIDI로 렌더링한 전체 미리듣기 음원 |
| `Christmas_Cantata_Medley_practice_*.midi / .mp3` | 파트 연습용 음원. 해당 파트는 피아노 음색으로 크게, 나머지는 작게 재생 |
| `*.ly` | LilyPond 소스 |

## 구성

| # | 장면 | 곡 | 조성 | 빠르기 |
|---|---|---|---|---|
| I | 기다림 | O Come, O Come, Emmanuel (곧 오소서 임마누엘) | e단조 → E장조 | Lento misterioso |
| – | 낭독 1 | 이사야 9:6 | | |
| II | 약속의 마을 | O Little Town of Bethlehem (오 베들레헴 작은 골) | G장조 | Andante tranquillo |
| III | 들판의 목자 | The First Noel (저 들 밖에 한밤중에) | D장조 | Andante pastorale |
| – | 낭독 2 | 누가복음 2:10–11 | | |
| IV | 천사의 선포 | Angels We Have Heard on High (천사들의 노래가) | F장조 | Allegro giocoso |
| V | 구유 | Silent Night (고요한 밤 거룩한 밤) | B♭장조 | Adagio, dolce |
| VI | 경배 | O Come, All Ye Faithful (참 반가운 신도여) | C장조 | Maestoso |
| VII | 선포 | Joy to the World (기쁘다 구주 오셨네) | D장조 → E♭장조 | Allegro con brio |

## 다시 빌드하기

```bash
# build.py 맨 위의 ARRANGER 값을 편곡자 이름으로 바꾼 뒤
python3 build.py            # 성부·마디·가사 검사 → PDF, MIDI 생성
python3 build.py --check    # 검사만 실행
```

필요한 것: LilyPond 2.24, 나눔 폰트(fonts-nanum). 음원을 만들려면 FluidSynth와 FluidR3_GM 사운드폰트도 필요합니다.

선율과 영어 가사는 퍼블릭 도메인입니다. 편곡(화성, 성부 진행, 구성, 연결부, 데스캔트)의 저작권은 편곡자에게 있습니다.
