// 맵 데이터와 타일 렌더링
import { TILE, hash2 } from './engine.js';

// ───────────── 맵 정의 ─────────────
// 각 글자가 타일 하나. 범례는 아래 PAINT 참고

const STORE = [
  '################',
  '#FFFFFFFFFF....#',
  '#..............#',
  '#.SSSSS.SSSSS..#',
  '#..............#',
  '#.SSSSS.SSSSS..#',
  '#..............#',
  '#.........CCC.##',
  '#.........C....#',
  '#..............#',
  'wwwwwwDDwwwwwwww',
];

const STREET = [
  'ffffffffffffffffffffffffffffffff',
  'fggBBBBBBBgggggBBBBBBBgggggggggf',
  'fggBBBBBBBgggggBBBBBBBggTggggggf',
  'fggBBBBBBBgggggBBBBBBBgggggggggf',
  'fgggggg,ggggggggggg,gggggRRRRggf',
  'f,,,,,,,,,,,,,,,,,,,,,,,,RRRRggf',
  'f,ggTggggggKK,,,,,gggggg,,,,,,,f',
  'fffffffffffKK,,,,fffffffffffffff',
  ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
  'aaaaaaaaaaaazzzzaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaazzzzaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaazzzzaaaaaaaaaaaaaaaa',
  'aaacaaaaaaaazzzzaaaaaaaacaaaaaaa',
  ',,,,L,,,,,,,,,,,,,L,,,,,,,,,L,,,',
  'MMMMwwDDwwMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
];

function buildB2() {
  const W = 34, H = 15;
  const g = [];
  for (let y = 0; y < H; y++) {
    const r = [];
    for (let x = 0; x < W; x++) {
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      r.push(edge ? '#' : '.');
    }
    g.push(r);
  }
  // 주차된 차들
  for (const y of [1, 5, 9, 13]) {
    for (let x = 1; x <= 25; x += 2) {
      if ((y === 5 || y === 9) && (x === 9 || x === 17)) continue; // 통로
      g[y][x] = 'c';
    }
  }
  // 기둥
  for (const y of [3, 7, 11]) for (const x of [3, 11, 19, 27]) g[y][x] = 'P';
  // 지상으로 가는 경사로
  for (let x = 29; x <= 31; x++) g[1][x] = 'R';
  // 303동 계단실 문
  g[7][0] = 'E';
  // 잠자리 매트 (047번 칸)
  g[11][29] = 'm';
  g[12][29] = 'm';
  return g.map((r) => r.join(''));
}

// 계단실: 위가 11층, 아래가 지하 2층
export const STAIR_FLOORS = ['11F', '10F', '9F', '8F', '7F', '6F', '5F', '4F', '3F', '2F', '1F', 'B1', 'B2'];
function buildStair() {
  const rows = ['#######'];
  STAIR_FLOORS.forEach((f, i) => {
    rows.push(i === STAIR_FLOORS.length - 1 ? 'E.....#' : 'd.....#');
    if (i < STAIR_FLOORS.length - 1) {
      rows.push('#sssss#', '#sssss#', '#sssss#');
    }
  });
  rows.push('#######');
  return rows;
}
export const stairLandingY = (i) => 1 + i * 4;

const HOME = [
  '##################',
  '#n...e#o...n#vvvv#',
  '#.....#.....#____#',
  '#.....#.....#____#',
  '##.####.#####____#',
  '#...............s#',
  '#F..........rr..s#',
  '#k..........rr..s#',
  '#k.....tt.......s#',
  '#kk..............#',
  '####dd############',
];

const DREAM = [
  '######################',
  '#xxxxxxxxxxxxxxxxxxxx#',
  '#....................#',
  '#....................#',
  '#....................#',
  '#xxxxxxxxxxxxxxxxxxxx#',
  '######################',
];

export const MAPS = {
  store: { rows: STORE, floor: 'store' },
  street: { rows: STREET, floor: 'grass' },
  b2: { rows: buildB2(), floor: 'concrete' },
  stair: { rows: buildStair(), floor: 'concrete' },
  home: { rows: HOME, floor: 'wood' },
  dream: { rows: DREAM, floor: 'dream' },
};

// 걸을 수 없는 타일
const SOLID = new Set(['#', 'F', 'S', 'C', 'w', 'f', 'B', 'K', 'M', 'D', 'c', 'L', 'T', 'P', 'R', 'E', 'd', 'n', 'e', 'o', 'v', 'k', 's', 't', 'x']);
// 's'는 계단실에선 계단(통행 가능), 집에선 소파(통행 불가)
export function solidAt(map, tx, ty) {
  const row = map.rows[ty];
  if (!row) return true;
  const ch = row[tx];
  if (ch === undefined) return true;
  if (map === MAPS.stair && ch === 's') return false;
  return SOLID.has(ch);
}

// ───────────── 렌더링 ─────────────
const C = {
  wall: '#34373c', wallTop: '#4a4e55',
  storeFloor: '#d8d5cb', storeFloor2: '#cfccc2',
  concrete: '#5c5f62', concrete2: '#56595c',
  wood: '#866b4f', wood2: '#7c6248',
  grass: '#3d4838', grass2: '#38432f',
  side: '#8a8780', side2: '#7f7c75',
  asphalt: '#2c2e32', yellow: '#d9b23a', white: '#d8d8d2',
  orange: '#d9772b',
};

function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

function floorTile(ctx, map, x, y, px, py) {
  const n = hash2(x, y);
  switch (map.floor) {
    case 'store':
      rect(ctx, px, py, TILE, TILE, (x + y) % 2 ? C.storeFloor : C.storeFloor2);
      break;
    case 'wood':
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? C.wood : C.wood2);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.fillRect(px, py + 15, TILE, 1);
      ctx.fillRect(px, py + 31, TILE, 1);
      break;
    case 'dream':
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? '#e9e6df' : '#e2dfd7');
      break;
    case 'grass':
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? C.grass : C.grass2);
      ctx.fillStyle = 'rgba(120,140,100,.25)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px + hash2(x, y, i) * 30, py + hash2(x, y, i + 9) * 30, 2, 3);
      break;
    default:
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? C.concrete : C.concrete2);
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      if (n > 0.8) ctx.fillRect(px + n * 10, py + 12, 12, 7);
  }
}

function paintTile(ctx, map, ch, x, y, scene) {
  const px = x * TILE, py = y * TILE;
  const n = hash2(x, y, 3);
  const up = (map.rows[y - 1] || '')[x];
  switch (ch) {
    case '#':
      rect(ctx, px, py, TILE, TILE, C.wall);
      if (up !== '#') rect(ctx, px, py, TILE, 6, C.wallTop);
      break;
    case 'F': // 음료 냉장고
      rect(ctx, px, py, TILE, TILE, '#9fb0bb');
      rect(ctx, px + 2, py + 4, TILE - 4, TILE - 6, '#26313a');
      for (let i = 0; i < 3; i++) {
        const cols = ['#4aa3d9', '#e05c4a', '#e8d36a', '#7ac46a', '#f0f0f0'];
        for (let j = 0; j < 4; j++) rect(ctx, px + 4 + j * 7, py + 7 + i * 8, 5, 6, cols[Math.floor(hash2(x, y, i * 4 + j) * cols.length)]);
      }
      break;
    case 'S': { // 진열대
      rect(ctx, px, py + 2, TILE, TILE - 4, '#7d838b');
      rect(ctx, px, py + 14, TILE, 4, '#5d6268');
      const cols = ['#e05c4a', '#e8a33a', '#f0e6c8', '#4aa3d9', '#7ac46a', '#c94f8a'];
      for (let i = 0; i < 4; i++) {
        rect(ctx, px + 2 + i * 7, py + 4, 6, 9, cols[Math.floor(hash2(x, y, i) * cols.length)]);
        rect(ctx, px + 2 + i * 7, py + 19, 6, 9, cols[Math.floor(hash2(x, y, i + 7) * cols.length)]);
      }
      break;
    }
    case 'C': // 계산대
      rect(ctx, px, py, TILE, TILE, '#6b5c4c');
      rect(ctx, px, py, TILE, 5, '#85725e');
      break;
    case 'w': // 유리창
      rect(ctx, px, py, TILE, TILE, '#2f3a44');
      rect(ctx, px, py + 10, TILE, 10, scene.power ? '#9dc1d6' : '#3b4a57');
      rect(ctx, px + TILE - 2, py + 10, 2, 10, '#2f3a44');
      break;
    case 'D': // 출입문
      rect(ctx, px, py, TILE, TILE, '#2f3a44');
      rect(ctx, px + 2, py + 6, TILE - 4, 20, scene.power ? '#c4dce8' : '#45596a');
      break;
    case 'f': // 울타리
      floorTile(ctx, MAPS.street, x, y, px, py);
      rect(ctx, px, py + 13, TILE, 4, '#26282b');
      rect(ctx, px + 2, py + 8, 4, 16, '#1d1f22');
      rect(ctx, px + 18, py + 8, 4, 16, '#1d1f22');
      break;
    case 'g':
      floorTile(ctx, MAPS.street, x, y, px, py);
      break;
    case ',': // 보도블록
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? C.side : C.side2);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.fillRect(px, py, TILE, 1); ctx.fillRect(px, py, 1, TILE);
      ctx.fillRect(px + 16, py, 1, TILE); ctx.fillRect(px, py + 16, TILE, 1);
      break;
    case 'a': // 아스팔트
      rect(ctx, px, py, TILE, TILE, C.asphalt);
      if (y === 10) { rect(ctx, px, py + TILE - 3, TILE, 2, C.yellow); }
      if (y === 11) { rect(ctx, px, py + 1, TILE, 2, C.yellow); }
      if (n > 0.85) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(px + 4, py + 9, 10, 6); }
      break;
    case 'z': // 횡단보도
      rect(ctx, px, py, TILE, TILE, C.asphalt);
      rect(ctx, px + 4, py + 2, 24, 12, C.white);
      rect(ctx, px + 4, py + 18, 24, 12, C.white);
      break;
    case 'c': { // 자동차
      const isRoad = map === MAPS.street;
      floorTile(ctx, map, x, y, px, py);
      if (isRoad) rect(ctx, px, py, TILE, TILE, C.asphalt);
      const palette = ['#8b2f2a', '#c9c9c4', '#2d3a4f', '#55595e', '#e0e0dc', '#3a4a3a'];
      const body = palette[Math.floor(hash2(x, y, 11) * palette.length)];
      if (!isRoad) {
        ctx.fillStyle = 'rgba(230,230,220,.55)';
        ctx.fillRect(px - 1, py, 2, TILE); ctx.fillRect(px + TILE - 1, py, 2, TILE);
      }
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(px + 5, py + 3, 24, 29);
      rect(ctx, px + 4, py + 1, 24, 30, body);
      rect(ctx, px + 7, py + 6, 18, 6, '#1c2630');
      rect(ctx, px + 7, py + 21, 18, 5, '#1c2630');
      break;
    }
    case 'B': { // 아파트 동 (위에서 본 옥상)
      rect(ctx, px, py, TILE, TILE, '#585d64');
      const lit = scene.power && hash2(x, y, 21) > 0.55;
      rect(ctx, px + 6, py + 8, 7, 7, lit ? '#e8c46a' : '#3c424a');
      rect(ctx, px + 19, py + 8, 7, 7, scene.power && hash2(x, y, 22) > 0.6 ? '#e8c46a' : '#3c424a');
      rect(ctx, px + 6, py + 20, 7, 7, scene.power && hash2(x, y, 23) > 0.7 ? '#e8c46a' : '#3c424a');
      rect(ctx, px + 19, py + 20, 7, 7, scene.power && hash2(x, y, 24) > 0.5 ? '#e8c46a' : '#3c424a');
      if ((map.rows[y + 1] || '')[x] !== 'B') rect(ctx, px, py + TILE - 4, TILE, 4, '#3e4248');
      break;
    }
    case 'K': // 경비실
      rect(ctx, px, py, TILE, TILE, '#a49a86');
      rect(ctx, px + 4, py + 6, TILE - 8, 10, scene.power ? '#e3cf8f' : '#4b4f55');
      break;
    case 'R': // 지하주차장 경사로
      rect(ctx, px, py, TILE, TILE, '#404347');
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 10); ctx.lineTo(px + 16, py + 20); ctx.lineTo(px + 26, py + 10);
      ctx.lineTo(px + 26, py + 15); ctx.lineTo(px + 16, py + 25); ctx.lineTo(px + 6, py + 15);
      ctx.fill();
      break;
    case 'L': // 가로등
      rect(ctx, px, py, TILE, TILE, n > 0.5 ? C.side : C.side2);
      rect(ctx, px + 13, py + 4, 6, 24, '#2b2d30');
      rect(ctx, px + 10, py + 2, 12, 6, scene.power ? '#f3dd9a' : '#3a3d42');
      break;
    case 'T': // 나무
      if (map === MAPS.street) floorTile(ctx, MAPS.street, x, y, px, py);
      ctx.fillStyle = '#1f2a1d'; ctx.beginPath(); ctx.arc(px + 16, py + 17, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b3a27'; ctx.beginPath(); ctx.arc(px + 13, py + 13, 9, 0, 7); ctx.fill();
      break;
    case 'M': { // 상가 건물
      rect(ctx, px, py, TILE, TILE, '#4c4844');
      if (y === 14) rect(ctx, px, py, TILE, 6, '#5d5852');
      break;
    }
    case 'P': // 기둥
      rect(ctx, px, py, TILE, TILE, '#77797b');
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#1d1d1d' : C.yellow;
        ctx.fillRect(px + i * 8, py + 24, 8, 8);
      }
      break;
    case 'E': case 'd': // 철문
      rect(ctx, px, py, TILE, TILE, C.wall);
      rect(ctx, px + 4, py + 2, TILE - 8, TILE - 4, '#6f7a74');
      rect(ctx, px + TILE - 12, py + 15, 4, 4, '#cfcfcf');
      break;
    case 'm': // 매트
      floorTile(ctx, map, x, y, px, py);
      rect(ctx, px + 2, py + 2, TILE - 4, TILE - 4, '#5b6e86');
      rect(ctx, px + 2, py + 2, TILE - 4, 3, '#71869f');
      break;
    case 's': // 계단(계단실) / 소파(집)
      if (map === MAPS.stair) {
        rect(ctx, px, py, TILE, TILE, '#66696c');
        rect(ctx, px, py + (y % 2 ? 0 : 16), TILE, 2, '#45484b');
        rect(ctx, px, py + (y % 2 ? 16 : 0), TILE, 1, '#7b7e81');
      } else {
        floorTile(ctx, map, x, y, px, py);
        rect(ctx, px + 4, py, TILE - 4, TILE, '#4b5563');
        rect(ctx, px + 4, py, 8, TILE, '#3c4552');
      }
      break;
    case '_': // 베란다 바닥
      rect(ctx, px, py, TILE, TILE, (x + y) % 2 ? '#b9b4a8' : '#b1ac9f');
      break;
    case 'v': // 베란다 창
      rect(ctx, px, py, TILE, TILE, '#2f3a44');
      rect(ctx, px + 1, py + 8, TILE - 2, 16, '#a7b4bd');
      break;
    case 'n': // 침대
      floorTile(ctx, map, x, y, px, py);
      rect(ctx, px + 1, py + 1, TILE - 2, TILE - 2, '#c9c2b4');
      rect(ctx, px + 4, py + 3, TILE - 8, 8, '#efeae0');
      rect(ctx, px + 1, py + 14, TILE - 2, 17, '#7f8fa6');
      break;
    case 'e': // 책상
      floorTile(ctx, map, x, y, px, py);
      rect(ctx, px + 2, py + 2, TILE - 4, TILE - 8, '#9b7b58');
      rect(ctx, px + 8, py + 6, 10, 8, '#e9e3d6');
      break;
    case 'o': // 옷장
      rect(ctx, px, py, TILE, TILE, '#a58a68');
      rect(ctx, px + 15, py + 4, 2, TILE - 8, '#6e5a43');
      break;
    case 'k': // 주방 조리대
      rect(ctx, px, py, TILE, TILE, '#bdb8ae');
      rect(ctx, px + 3, py + 3, TILE - 6, TILE - 6, '#d4d0c7');
      break;
    case 't': // 식탁
      floorTile(ctx, map, x, y, px, py);
      rect(ctx, px + 1, py + 4, TILE - 2, TILE - 8, '#a4825e');
      break;
    case 'r': // 러그
      floorTile(ctx, map, x, y, px, py);
      ctx.fillStyle = 'rgba(120,60,50,.45)';
      ctx.fillRect(px, py, TILE, TILE);
      break;
    case 'x': // 국화
      floorTile(ctx, map, x, y, px, py);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#f7f5ee';
        ctx.beginPath(); ctx.arc(px + 7 + i * 9, py + 12 + (i % 2) * 8, 5, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8d9a0';
        ctx.beginPath(); ctx.arc(px + 7 + i * 9, py + 12 + (i % 2) * 8, 1.6, 0, 7); ctx.fill();
      }
      break;
    default:
      floorTile(ctx, map, x, y, px, py);
  }
}

function label(ctx, text, x, y, { size = 12, color = 'rgba(255,255,255,.75)', bg = null, align = 'center', bold = true } = {}) {
  ctx.font = `${bold ? 700 : 500} ${size}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (bg) {
    const w = ctx.measureText(text).width + 10;
    const lx = align === 'center' ? x - w / 2 : x - 5;
    ctx.fillStyle = bg;
    ctx.fillRect(lx, y - size * 0.75, w, size * 1.5);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// 맵 전체를 오프스크린 캔버스에 미리 그린다 (2배 해상도)
export function renderMap(scene) {
  const map = scene.map;
  const H = map.rows.length, W = map.rows[0].length;
  const cv = document.createElement('canvas');
  const SC = 2;
  cv.width = W * TILE * SC;
  cv.height = H * TILE * SC;
  const ctx = cv.getContext('2d');
  ctx.scale(SC, SC);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      paintTile(ctx, map, map.rows[y][x], x, y, scene);
    }
  }
  (scene.labels || []).forEach((l) => label(ctx, l.text, l.x * TILE, l.y * TILE, l));
  return cv;
}
