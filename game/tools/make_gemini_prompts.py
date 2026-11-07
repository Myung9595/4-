"""아이템 문서(03)에서 제미나이 프롬프트(05 md + 복사 페이지)를 만든다. 레포 루트에서: python3 game/tools/make_gemini_prompts.py"""
import re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs' / '서울끝'
DOC = DOCS / '03_아이템_장비_조합_리스트.md'
s = open(DOC, encoding='utf-8').read()
items = {}
for line in s.split('## 14. 장비 칸')[0].splitlines():
    m = re.match(r'^\| (★?[a-zA-Z][A-Za-z0-9]*) \|', line)
    if not m or m.group(1) == 'ID': continue
    cols = [c.strip() for c in line.strip().strip('|').split('|')]
    items[cols[1]] = (cols[0].lstrip('★'), cols[-1])

def find(name):
    if name in items: return name, items[name]
    for k, v in items.items():
        if k.startswith(name) or name.startswith(k): return k, v
    toks = name.split()
    for k, v in items.items():
        if all(t in k for t in toks): return k, v
    raise SystemExit(f'NOT FOUND: {name}')

sheets = []
for line in s.split('## 16.')[1].splitlines():
    m = re.match(r'^\| \*{0,2}(sheet_\d+)\*{0,2} ?(★?) \| (.+?) \| (.+?) \|$', line)
    if not m: continue
    names = [n.strip() for n in m.group(4).split(',')]
    assert len(names) == 9, (m.group(1), len(names))
    sheets.append((m.group(1), m.group(2) == '★', m.group(3), [find(n) for n in names]))

HEAD = """Pixel art item icon sheet for a Korean post-apocalyptic survival game. Square image.
A 3x3 grid of 9 separate item icons, evenly spaced, each icon centered in its own square cell.
Style: 32x32 pixel art upscaled with hard nearest-neighbor edges, no anti-aliasing, no blur.
Limited muted palette: concrete grays, desaturated olive green, dusty navy, warm beige,
with rust orange (#D9772B) and civil-defense yellow (#E3B341) as the only bright accents.
View: slight 3/4 top-down angle, same angle and same scale for every icon.
Lighting: soft light from the top-left, one darker shade on the bottom-right of each object.
Every object has a 1-pixel dark outline (#1A1A1E).
Background: solid flat pure magenta (#FF00FF) everywhere, no gradient, no floor, no shadow on the background, no grid lines.
No text, no letters, no numbers, no logos, no brand names anywhere.
Items, left to right, top to bottom:"""

NEWS_HEAD = """Pixel art cutscene frame for a Korean survival game. Wide 16:9 image.
320x180 pixel resolution upscaled with hard nearest-neighbor edges, no anti-aliasing.
Muted palette with deep navy, concrete gray, and warning red-orange accents. Slight CRT scanline feel.
Fictional TV news broadcast. No real broadcaster, no logos.
Leave the bottom 20 percent of the frame as an empty dark band for subtitles.
No text, no letters, no numbers anywhere in the image.
Scene:"""
NEWS = [
 ('news_01_studio', '평온한 심야 뉴스 스튜디오', 'a calm late-night news studio, a female anchor in a navy suit at a desk facing the camera, blue screens behind her'),
 ('news_02_breaking', '속보 종이를 받아 든 앵커', 'the same news anchor in a navy suit holding a sheet of paper handed from off-screen, her expression tense, a red alert glow on the screens behind her'),
 ('news_03_map', '한반도 지도와 붉은 궤적', 'a stylized dark map graphic of the Korean peninsula seen from above, several glowing red arcs launching from the north toward the south, faint grid lines'),
 ('news_04_coast', '서해 바다의 함정과 섬광', 'night sea off the west coast of Korea, silhouettes of navy ships, distant orange flashes on the horizon, dark clouds'),
 ('news_05_jets', '야간 이륙하는 전투기', 'fighter jets taking off from a runway at night, afterburner glow, airbase lights in rows'),
 ('news_06_subway', '지하철역으로 몰리는 시민들', 'crowds of civilians in pajamas and winter coats hurrying down subway station stairs at night, green emergency exit signs glowing'),
 ('news_07_earpiece', '이어폰을 누르며 멈춘 앵커', 'the same news anchor in a navy suit pressing a finger to her earpiece, mouth half open, frozen mid-sentence, studio lights flickering'),
 ('news_08_nosignal', '신호 끊김 (선택)', 'a broken TV signal screen, distorted color bars and static noise, dark edges, glitch lines'),
]

def sheet_prompt(items9):
    return HEAD + '\n' + '\n'.join(f'{i+1}. {d}' for i, (_, (_, d)) in enumerate(items9))

# ── Markdown ──
md = ['# 제미나이 프롬프트 모음', '',
      '> 그대로 복사해서 제미나이에 붙여 넣으면 된다. 아이템 문서(03)에서 자동으로 조립했다.', '',
      '## 사용 방법', '',
      '1. 프롬프트 하나를 통째로 복사해서 제미나이에 붙여 넣는다.',
      '2. 결과가 9칸이 아니거나 스타일이 어긋나면 **같은 프롬프트로 다시 생성**한다.',
      '3. 마음에 드는 결과를 파일명대로 저장해서 `game/assets/raw/`에 올린다.',
      '4. 시트 01~07(★)부터 만든다.', '',
      '## 아이템 시트', '']
for sid, star, theme, its in sheets:
    md += [f'### {sid}{" ★" if star else ""} · {theme}', '',
           '파일명: `' + sid + '.png`', '',
           '칸 순서: ' + ' / '.join(f'{i+1} {k}' for i, (k, _) in enumerate(its)), '',
           '```', sheet_prompt(its), '```', '']
md += ['## 뉴스 컷신', '']
for fid, ko, desc in NEWS:
    md += [f'### {fid} · {ko}', '', '파일명: `' + fid + '.png`', '', '```', NEWS_HEAD + ' ' + desc, '```', '']
open(DOCS / '05_제미나이_프롬프트.md', 'w', encoding='utf-8').write('\n'.join(md))

# ── HTML (copy page) ──
cards = []
def card(cid, title, sub, chips, prompt, star=False):
    chips_html = ''.join(f'<li><b>{i+1}</b>{html.escape(c)}</li>' for i, c in enumerate(chips))
    return f'''<article class="card{' star' if star else ''}" id="{cid}">
  <header><div><h2>{html.escape(title)}</h2><p class="file">{html.escape(sub)}</p></div>
  <button class="copy" data-target="p-{cid}" type="button">복사</button></header>
  {'<ol class="chips">'+chips_html+'</ol>' if chips else ''}
  <pre id="p-{cid}" tabindex="0">{html.escape(prompt)}</pre>
</article>'''
for sid, star, theme, its in sheets:
    cards.append(card(sid, f'{sid.replace("sheet_", "시트 ")} · {theme}', f'{sid}.png', [k for k, _ in its], sheet_prompt(its), star))
news_cards = [card(fid, f"뉴스 {fid.split('_')[1]} · {ko}", f'{fid}.png', [], NEWS_HEAD + ' ' + d) for fid, ko, d in NEWS]
tpl = open(Path(__file__).with_name('gemini_prompts_template.html'), encoding='utf-8').read()
nav = ''.join(f'<a href="#{sid}" class="{"star" if star else ""}">{sid.replace("sheet_", "시트 ")}</a>' for sid, star, _, _ in sheets) + ''.join(f'<a href="#{fid}">뉴스 {fid.split("_")[1]}</a>' for fid, _, _ in NEWS)
out = tpl.replace('{{NAV}}', nav).replace('{{SHEETS}}', '\n'.join(cards)).replace('{{NEWS}}', '\n'.join(news_cards))
open(DOCS / '05_제미나이_프롬프트_복사페이지.html', 'w', encoding='utf-8').write(out)
print(len(sheets), 'sheets', len(NEWS), 'news')
