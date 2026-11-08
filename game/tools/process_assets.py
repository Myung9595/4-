"""제미나이 원본 이미지를 게임용 에셋으로 만든다.

사용법 (레포 루트에서):
    python3 game/tools/process_assets.py

입력
    game/assets/raw/items/sheet_XX.jpeg   3x3 아이템 시트 (마젠타 배경)
    game/assets/raw/news/news_XX_*.jpeg   뉴스 컷신 (16:9)
출력
    game/assets/items/<아이템ID>.png      배경을 지운 48x48 아이콘
    game/assets/news/<이름>.png           워터마크를 지우고 줄인 컷신
    game/assets/manifest.json            아이템 ID ↔ 이름 ↔ 파일
    game/assets/items/_preview.png        전체 아이콘 미리보기

아이템 이름과 순서는 docs/서울끝/03_아이템_장비_조합_리스트.md 의 16절(시트 편성)을 따른다.
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs' / '서울끝' / '03_아이템_장비_조합_리스트.md'
RAW_ITEMS = ROOT / 'game' / 'assets' / 'raw' / 'items'
RAW_NEWS = ROOT / 'game' / 'assets' / 'raw' / 'news'
OUT_ITEMS = ROOT / 'game' / 'assets' / 'items'
OUT_NEWS = ROOT / 'game' / 'assets' / 'news'

ICON = 48          # 아이콘 캔버스 크기
PIXEL = 8          # 제미나이 시트에서 픽셀 한 칸의 크기 (1024px 기준)
OUTLINE = (26, 26, 30)


# ───────── 문서에서 시트 편성 읽기 ─────────
def read_sheets():
    s = DOC.read_text(encoding='utf-8')
    items = {}
    for line in s.split('## 14. 장비 칸')[0].splitlines():
        m = re.match(r'^\| (★?[a-zA-Z][A-Za-z0-9]*) \|', line)
        if not m or m.group(1) == 'ID':
            continue
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        items[cols[1]] = cols[0].lstrip('★')

    def find(name):
        if name in items:
            return name, items[name]
        for k, v in items.items():
            if k.startswith(name) or name.startswith(k):
                return k, v
        for k, v in items.items():
            if all(t in k for t in name.split()):
                return k, v
        raise SystemExit(f'문서에서 아이템을 찾지 못함: {name}')

    sheets = {}
    for line in s.split('## 16.')[1].splitlines():
        m = re.match(r'^\| \*{0,2}(sheet_\d+)\*{0,2} ?★? \| (.+?) \| (.+?) \|$', line)
        if m:
            sheets[m.group(1)] = (m.group(2), [find(n.strip()) for n in m.group(3).split(',')])
    return sheets


# ───────── 아이템 시트 ─────────
def background_mask(a):
    """마젠타 배경(JPEG 잡음 포함)과 제미나이 워터마크(분홍 별)를 배경으로 본다."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dist = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
    bg = dist < 105
    h, w = bg.shape
    # 워터마크: 오른쪽 아래, 마젠타가 옅어진 분홍빛 (흰색 아이템은 G가 높아서 제외됨)
    y0, x0 = int(h * 0.78), int(w * 0.78)
    sub = a[y0:, x0:]
    pink = (sub[..., 0] > 205) & (sub[..., 2] > 205) & (sub[..., 1] > 80) & (sub[..., 1] < 222) & (sub[..., 0] - sub[..., 1] > 22)
    bg[y0:, x0:] |= pink
    return bg


def slice_sheet(path):
    img = Image.open(path).convert('RGB')
    if img.size != (1024, 1024):
        img = img.resize((1024, 1024), Image.LANCZOS)
    a = np.asarray(img).astype(np.int32)
    fg = ~background_mask(a)
    fg = ndimage.binary_opening(fg, iterations=2)
    groups, n = ndimage.label(ndimage.binary_dilation(fg, iterations=6))
    cell = 1024 / 3
    cells = {i: np.zeros_like(fg) for i in range(9)}
    for lab in range(1, n + 1):
        part = (groups == lab) & fg
        area = part.sum()
        if area < 150:
            continue
        cy, cx = ndimage.center_of_mass(part)
        idx = int(min(2, cy // cell)) * 3 + int(min(2, cx // cell))
        cells[idx] |= part
    out = []
    for i in range(9):
        m = cells[i]
        if not m.any():
            out.append(None)
            continue
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = a[y0:y1, x0:x1].copy()
        alpha = m[y0:y1, x0:x1]
        rgb[~alpha] = OUTLINE  # 축소할 때 분홍 테두리가 번지지 않게
        out.append(to_icon(rgb.astype(np.uint8), alpha))
    return out


def to_icon(rgb, alpha):
    h, w = alpha.shape
    scale = PIXEL
    if max(h, w) / scale > ICON - 4:
        scale = max(h, w) / (ICON - 4)
    nw, nh = max(1, round(w / scale)), max(1, round(h / scale))
    small = Image.fromarray(rgb).resize((nw, nh), Image.BOX)
    a_small = Image.fromarray((alpha * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)
    small = small.quantize(colors=28, method=Image.Quantize.MEDIANCUT).convert('RGB')
    a = (np.asarray(a_small) >= 128).astype(np.uint8) * 255
    canvas = Image.new('RGBA', (ICON, ICON), (0, 0, 0, 0))
    tile = small.convert('RGBA')
    tile.putalpha(Image.fromarray(a))
    canvas.paste(tile, ((ICON - nw) // 2, (ICON - nh) // 2), tile)
    return canvas


# ───────── 뉴스 컷신 ─────────
def clean_news(path):
    img = Image.open(path).convert('RGB')
    a = np.asarray(img).astype(np.int32)
    h, w, _ = a.shape
    # 워터마크: 오른쪽 아래의 작고 밝은 별. 주변 띠 색으로 덮는다
    y0, x0 = int(h * 0.72), int(w * 0.80)
    sub = a[y0:, x0:]
    luma = sub.mean(axis=2)
    base = np.median(luma)
    star = luma > base + 45
    star = ndimage.binary_dilation(star, iterations=4)
    if star.any():
        fill = np.median(sub[~star].reshape(-1, 3), axis=0)
        sub[star] = fill
        a[y0:, x0:] = sub
    out = Image.fromarray(a.astype(np.uint8))
    return out.resize((w // 4, h // 4), Image.BOX)


def preview(icons):
    cols = 9
    cellw, cellh = ICON * 3 + 8, ICON * 3 + 22
    rows = (len(icons) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cellw, rows * cellh), (18, 19, 22))
    d = ImageDraw.Draw(sheet)
    for i, (iid, im) in enumerate(icons):
        x, y = (i % cols) * cellw, (i // cols) * cellh
        big = im.resize((ICON * 3, ICON * 3), Image.NEAREST)
        sheet.paste(big, (x + 4, y + 2), big)
        d.text((x + 6, y + ICON * 3 + 5), iid, fill=(200, 196, 186))
    return sheet


def main():
    sheets = read_sheets()
    OUT_ITEMS.mkdir(parents=True, exist_ok=True)
    OUT_NEWS.mkdir(parents=True, exist_ok=True)
    manifest = {'items': {}, 'news': {}}
    icons = []
    missing = []
    for sid in sorted(sheets):
        theme, names = sheets[sid]
        src = next(iter(sorted(RAW_ITEMS.glob(f'{sid}.*'))), None)
        if not src:
            missing.append(sid)
            continue
        parts = slice_sheet(src)
        for i, ((name, iid), icon) in enumerate(zip(names, parts)):
            if icon is None:
                print(f'  ! {sid} {i + 1}번 칸이 비어 있음: {name}')
                continue
            icon.save(OUT_ITEMS / f'{iid}.png')
            manifest['items'][iid] = {'name': name, 'file': f'items/{iid}.png', 'sheet': sid, 'cell': i + 1}
            icons.append((iid, icon))
        print(f'{sid} ({theme}): {sum(p is not None for p in parts)}/9')
    for src in sorted(RAW_NEWS.glob('news_*.*')):
        out = clean_news(src)
        out.save(OUT_NEWS / f'{src.stem}.png')
        manifest['news'][src.stem] = {'file': f'news/{src.stem}.png', 'size': list(out.size)}
        print(f'{src.stem}: {out.size}')
    (ROOT / 'game' / 'assets' / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    preview(icons).save(OUT_ITEMS / '_preview.png')
    if missing:
        print('아직 없는 시트:', ', '.join(missing))
    print(f'아이콘 {len(icons)}개, 뉴스 {len(manifest["news"])}장')


if __name__ == '__main__':
    main()
