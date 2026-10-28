// 릭 데이터 검증: node guitar-lick-dictionary/tools/validate.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const m = /<script id="lick-data" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
if (!m) { console.error('lick-data 블록을 찾지 못했습니다.'); process.exit(1); }
const DATA = JSON.parse(m[1]);

const NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const OPEN = { 1:64, 2:59, 3:55, 4:50, 5:45, 6:40 };
const pcOf = n => { const r = /^([A-G])([#b]?)/.exec(n); let p = PC[r[1]]; if (r[2] === '#') p++; if (r[2] === 'b') p--; return (p + 12) % 12; };
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

let errors = 0, warns = 0;
const err = (id, msg) => { errors++; console.log(`  ✗ ${id}: ${msg}`); };
const warn = (id, msg) => { warns++; console.log(`  △ ${id}: ${msg}`); };
const ids = new Set();

for (const l of DATA.licks) {
  const id = l.id;
  if (ids.has(id)) err(id, '중복 id'); ids.add(id);
  const fam = DATA.families[l.family];
  if (!fam) { err(id, `알 수 없는 계열 ${l.family}`); continue; }
  for (const s of l.slots) if (!DATA.slots.includes(s)) err(id, `알 수 없는 자리 ${s}`);
  if (![1,2,3].includes(l.level)) err(id, '레벨은 1~3');
  if (!['4/4','6/8'].includes(l.meter)) err(id, '박자는 4/4 또는 6/8');
  const keyPc = pcOf(l.homeKey);
  const barLen = l.meter === '6/8' ? 6 : 8;
  const notes = [...l.notes].sort((a, b) => a.t - b.t || a.s - b.s);

  // 1. 스케일 소속
  for (const n of notes) {
    if (n.s < 1 || n.s > 6) err(id, `줄 번호 오류 s=${n.s}`);
    if (n.f < 0 || n.f > 20) err(id, `프렛 범위 오류 f=${n.f}`);
    if (!(n.d > 0)) err(id, `길이 오류 t=${n.t}`);
    const midi = OPEN[n.s] + n.f;
    const rel = (midi - keyPc + 120) % 12;
    if (!fam.scale.includes(rel)) err(id, `t=${n.t} ${n.s}번줄 ${n.f}프렛(${NOTE[midi % 12]})이 ${l.homeKey} ${fam.name}에 없음`);
    if (n.tech === 'b') {
      if (![1,2].includes(n.bend)) err(id, `벤딩 폭(bend) 누락 t=${n.t}`);
      const tgt = (midi + n.bend - keyPc + 120) % 12;
      if (!fam.scale.includes(tgt)) err(id, `벤딩 도착음이 스케일 밖 t=${n.t}`);
    }
  }
  // 2. 이동형/고정형
  if (l.movable && notes.some(n => n.f === 0)) err(id, '이동형인데 개방현 사용');
  if (!l.movable && !l.fixedReason) err(id, '고정 키 릭에 fixedReason 없음');
  // 3. 같은 줄 겹침 + 테크닉 연결
  for (const n of notes) {
    const prev = notes.filter(p => p.s === n.s && p.t < n.t).sort((a, b) => b.t - a.t)[0];
    if (prev && prev.t + prev.d > n.t) err(id, `${n.s}번줄 t=${prev.t} 음이 t=${n.t} 음과 겹침`);
    if (['h','p','sl'].includes(n.tech)) {
      if (!prev) { err(id, `t=${n.t} ${n.tech}: 같은 줄 앞 음 없음`); continue; }
      if (prev.t + prev.d !== n.t) err(id, `t=${n.t} ${n.tech}: 앞 음과 이어지지 않음(레가토 끊김)`);
      if (n.tech === 'h' && !(n.f > prev.f)) err(id, `t=${n.t} 해머온은 더 높은 프렛이어야 함`);
      if (n.tech === 'p' && !(n.f < prev.f)) err(id, `t=${n.t} 풀오프는 더 낮은 프렛이어야 함`);
      if ((n.tech === 'h' || n.tech === 'p') && Math.abs(n.f - prev.f) > 4) warn(id, `t=${n.t} 레가토 간격이 4프렛 초과`);
      if (n.tech === 'sl' && n.f === prev.f) err(id, `t=${n.t} 슬라이드인데 같은 프렛`);
    }
  }
  // 4. 동시음 손 범위
  const times = [...new Set(notes.map(n => n.t))];
  for (const t of times) {
    const fr = notes.filter(n => n.t === t && n.f > 0).map(n => n.f);
    if (fr.length > 1 && Math.max(...fr) - Math.min(...fr) > 4) err(id, `t=${t} 동시음 스트레치 4프렛 초과`);
  }
  // 5. 코드
  if (!l.chords.length || l.chords[0].t !== 0) err(id, '코드는 t=0부터 시작해야 함');
  for (let i = 1; i < l.chords.length; i++) if (l.chords[i].t <= l.chords[i - 1].t) err(id, '코드 시간 순서 오류');
  const end = Math.max(...notes.map(n => n.t + n.d));
  if (end % barLen !== 0) warn(id, `마지막 음이 마디 끝(${end}/${barLen})에 맞지 않음`);
  // 6. 이조 가능 여부
  if (l.movable) {
    for (const k of DATA.keys) {
      const d = (pcOf(k) - keyPc + 12) % 12;
      const fr = notes.map(n => n.f);
      const ok = [d, d - 12].some(s => Math.min(...fr) + s >= 1 && Math.max(...fr) + s <= 20);
      if (!ok) err(id, `${k} 키로 이조 불가(프렛 범위)`);
    }
  }
  // 7. 코드톤 비율(정보)
  let ct = 0;
  for (const n of notes) {
    const c = [...l.chords].reverse().find(c => c.t <= n.t);
    if (chordPcs(c.n).has((OPEN[n.s] + n.f) % 12)) ct++;
  }
  console.log(`✓ ${id} ${l.name} — 음 ${notes.length}개, 코드톤 ${Math.round(ct / notes.length * 100)}%`);
}
console.log(`\n릭 ${DATA.licks.length}개 · 오류 ${errors} · 경고 ${warns}`);
process.exit(errors ? 1 : 0);
