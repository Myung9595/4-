// 릭 데이터 검증: node guitar-lick-dictionary/tools/validate.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'licks.js'), 'utf8');
const json = src.replace(/^\s*window\.LICK_DATA\s*=\s*/, '').replace(/;\s*$/, '');
const DATA = JSON.parse(json);

const NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const OPEN = { 1:64, 2:59, 3:55, 4:50, 5:45, 6:40 };
const TECHS = ['h','p','sl','b','sw','si'];
const pcOf = n => { const r = /^([A-G])([#b]?)/.exec(n); let p = PC[r[1]]; if (r[2] === '#') p++; if (r[2] === 'b') p--; return (p + 12) % 12; };
const isMinor = k => /m$/.test(k);
function chordPcs(name) {
  const [main, bass] = name.split('/');
  const r = pcOf(main), q = main.replace(/^[A-G][#b]?/, '');
  let iv = [0,4,7];
  if (/^m(?!aj)/.test(q)) iv = [0,3,7];
  if (/sus4/.test(q)) iv = [0,5,7];
  if (/sus2/.test(q)) iv = [0,2,7];
  if (/maj7/.test(q)) iv.push(11); else if (/7/.test(q)) iv.push(10);
  if (/add9|9/.test(q)) iv.push(2);
  if (/6/.test(q)) iv.push(9);
  const s = new Set(iv.map(i => (r + i) % 12)); if (bass) s.add(pcOf(bass));
  return s;
}
// 이조: 메이저 키 기준 이동량과 실제 프렛 이동량
function shiftFor(l, key) {
  const root = pcOf(l.homeKey);
  const ref = isMinor(l.homeKey) ? (root + 3) % 12 : root;
  const d = (pcOf(key) - ref + 12) % 12;
  return pickShift(l.notes, d);
}
// 개방현 없는 자리를 우선, 안 되면 개방현을 허용(단 슬라이드가 걸린 음은 개방현 불가)
function pickShift(notes, d) {
  const fr = notes.map(n => n.f);
  const slideFrets = notes.filter(n => n.tech === 'sl' || n.tech === 'si').map(n => n.f);
  notes.forEach(n => { if (n.tech === 'sl') { const p = notes.filter(m => m.s === n.s && m.t < n.t).sort((a, b) => b.t - a.t)[0]; if (p) slideFrets.push(p.f); } });
  const ok = s => Math.min(...fr) + s >= 0 && Math.max(...fr) + s <= 20 && slideFrets.every(f => f + s >= 1);
  const opts = [d, d - 12].filter(ok);
  opts.sort((a, b) => ((Math.min(...fr) + a >= 1 ? 0 : 1) - (Math.min(...fr) + b >= 1 ? 0 : 1)) || Math.abs(a) - Math.abs(b));
  return opts.length ? opts[0] : null;
}

let errors = 0, warns = 0;
const err = (id, msg) => { errors++; console.log(`  ✗ ${id}: ${msg}`); };
const warn = (id, msg) => { warns++; console.log(`  △ ${id}: ${msg}`); };
const ids = new Set();
const stats = { level:{}, family:{}, slot:{}, key:{} };

for (const l of DATA.licks) {
  const id = l.id;
  if (ids.has(id)) err(id, '중복 id'); ids.add(id);
  const fam = DATA.families[l.family];
  if (!fam) { err(id, `알 수 없는 계열 ${l.family}`); continue; }
  for (const s of l.slots) if (!DATA.slots.includes(s)) err(id, `알 수 없는 자리 ${s}`);
  if (![1,2,3].includes(l.level)) err(id, '레벨은 1~3');
  if (!['4/4','6/8'].includes(l.meter)) err(id, '박자는 4/4 또는 6/8');
  if ((l.family === 'D') !== isMinor(l.homeKey)) err(id, '마이너 펜타 계열은 마이너 키(예: Em)여야 하고, 그 반대도 마찬가지');
  for (const k of ['why','how','mistakes','vars']) if (!l[k] || !l[k].length) err(id, `${k} 비어 있음`);
  const keyPc = pcOf(l.homeKey);
  const barLen = l.meter === '6/8' ? 6 : 8;
  const notes = [...l.notes].sort((a, b) => a.t - b.t || a.s - b.s);

  // 1. 스케일 소속
  for (const n of notes) {
    if (n.s < 1 || n.s > 6) err(id, `줄 번호 오류 s=${n.s}`);
    if (n.f < 0 || n.f > 20) err(id, `프렛 범위 오류 f=${n.f}`);
    if (!(n.d > 0)) err(id, `길이 오류 t=${n.t}`);
    if (n.tech && !TECHS.includes(n.tech)) err(id, `알 수 없는 테크닉 ${n.tech}`);
    if ((n.t * 2) % 1 || (n.d * 2) % 1) err(id, `t=${n.t} 16분음표보다 잘게 나눈 리듬`);
    const midi = OPEN[n.s] + n.f;
    const rel = (midi - keyPc + 120) % 12;
    if (!fam.scale.includes(rel)) err(id, `t=${n.t} ${n.s}번줄 ${n.f}프렛(${NOTE[midi % 12]})이 ${l.homeKey} ${fam.name}에 없음`);
    if (n.tech === 'b') {
      if (![1,2].includes(n.bend)) err(id, `벤딩 폭(bend) 누락 t=${n.t}`);
      const tgt = (midi + n.bend - keyPc + 120) % 12;
      if (!fam.scale.includes(tgt)) err(id, `벤딩 도착음이 스케일 밖 t=${n.t}`);
    }
    if (n.tech === 'si' && n.f < 2) err(id, `t=${n.t} 슬라이드 인은 2프렛 이상에서만`);
  }
  // 2. 이동형/고정형
  if (l.movable && notes.some(n => n.f === 0)) err(id, '이동형인데 개방현 사용');
  if (!l.movable && !l.fixedReason) err(id, '고정 키 릭에 fixedReason 없음');
  if (!l.movable && !notes.some(n => n.f === 0)) warn(id, '개방현이 없는데 고정 키');
  // 3. 같은 줄 겹침 + 테크닉 연결
  for (const n of notes) {
    const prev = notes.filter(p => p.s === n.s && p.t < n.t).sort((a, b) => b.t - a.t)[0];
    if (prev && prev.t + prev.d > n.t + 1e-9) err(id, `${n.s}번줄 t=${prev.t} 음이 t=${n.t} 음과 겹침`);
    if (['h','p','sl'].includes(n.tech)) {
      if (!prev) { err(id, `t=${n.t} ${n.tech}: 같은 줄 앞 음 없음`); continue; }
      if (Math.abs(prev.t + prev.d - n.t) > 1e-9) err(id, `t=${n.t} ${n.tech}: 앞 음과 이어지지 않음(레가토 끊김)`);
      if (n.tech === 'h' && !(n.f > prev.f)) err(id, `t=${n.t} 해머온은 더 높은 프렛이어야 함`);
      if (n.tech === 'p' && !(n.f < prev.f)) err(id, `t=${n.t} 풀오프는 더 낮은 프렛이어야 함`);
      if ((n.tech === 'h' || n.tech === 'p') && Math.abs(n.f - prev.f) > 3) warn(id, `t=${n.t} 레가토 간격이 3프렛 초과`);
      if (n.tech === 'sl' && n.f === prev.f) err(id, `t=${n.t} 슬라이드인데 같은 프렛`);
    }
  }
  // 4. 동시음 손 범위
  for (const t of [...new Set(notes.map(n => n.t))]) {
    const fr = notes.filter(n => n.t === t && n.f > 0).map(n => n.f);
    if (fr.length > 1 && Math.max(...fr) - Math.min(...fr) > 4) err(id, `t=${t} 동시음 스트레치 4프렛 초과`);
  }
  // 5. 코드
  if (!l.chords.length || l.chords[0].t !== 0) err(id, '코드는 t=0부터 시작해야 함');
  for (let i = 1; i < l.chords.length; i++) if (l.chords[i].t <= l.chords[i - 1].t) err(id, '코드 시간 순서 오류');
  const end = Math.max(...notes.map(n => n.t + n.d));
  if (end % barLen !== 0) warn(id, `마지막 음이 마디 끝(${end}/${barLen})에 맞지 않음`);
  // 6. 이조 가능 여부 + 설명 속 프렛 토큰 범위
  const text = [l.why, ...l.how, ...l.mistakes, ...l.vars].join(' ');
  const tokens = [...text.matchAll(/\{([nfc]):([^}]+)\}/g)];
  for (const [, kind, v] of tokens) {
    if (kind === 'n' && !/^[A-G][#b]?$/.test(v)) err(id, `음 토큰 오류 {n:${v}}`);
    if (kind === 'c' && !/^[A-G]/.test(v)) err(id, `코드 토큰 오류 {c:${v}}`);
    if (kind === 'f' && !/^\d+$/.test(v)) err(id, `프렛 토큰 오류 {f:${v}}`);
  }
  if (!l.movable && tokens.length) warn(id, '고정 키 릭은 토큰이 필요 없음');
  if (l.movable) {
    for (const k of DATA.keys) {
      const s = shiftFor(l, k);
      if (s === null) { err(id, `${k} 키로 이조 불가(프렛 범위)`); continue; }
      for (const [, kind, v] of tokens) if (kind === 'f' && (+v + s < 0 || +v + s > 22)) warn(id, `${k} 키에서 설명 속 프렛 ${v}→${+v + s}가 범위 밖`);
    }
    const loose = text.replace(/\{f:\d+\}/g, '').match(/(?<![+~\d] ?)\d+프렛(?!\s*(위|아래|간격|차이))/g);
    if (loose) warn(id, `토큰 없이 쓴 프렛 번호(이조 시 틀림): ${loose.join(', ')}`);
  }
  // 7. 코드톤 비율(정보)
  let ct = 0;
  for (const n of notes) {
    const c = [...l.chords].reverse().find(c => c.t <= n.t);
    if (chordPcs(c.n).has((OPEN[n.s] + n.f) % 12)) ct++;
  }
  stats.level[l.level] = (stats.level[l.level] || 0) + 1;
  stats.family[l.family] = (stats.family[l.family] || 0) + 1;
  stats.key[l.homeKey + (l.movable ? '' : '(고정)')] = (stats.key[l.homeKey + (l.movable ? '' : '(고정)')] || 0) + 1;
  for (const s of l.slots) stats.slot[s] = (stats.slot[s] || 0) + 1;
  console.log(`✓ ${id} ${l.name} — 음 ${notes.length}개, 코드톤 ${Math.round(ct / notes.length * 100)}%`);
}
console.log('\n분포', JSON.stringify(stats));
console.log(`릭 ${DATA.licks.length}개 · 오류 ${errors} · 경고 ${warns}`);
process.exit(errors ? 1 : 0);
