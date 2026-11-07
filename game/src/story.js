// 1차 테스트 스토리: 프롤로그(D+0) ~ D+1 밤 · 꿈 #1
import {
  state, resetState, saveGame, loadGame, setClock, passTime, addStat,
  has, count, addItem, removeItem, canFit,
} from './state.js';
import { ITEMS } from './items.js';
import { TILE, wait } from './engine.js';
import { STAIR_FLOORS, stairLandingY } from './world.js';
import { clockText } from './state.js';

const C = (n) => n * TILE + TILE / 2;
const F = () => state.flags;

function npc(o) { return { kind: 'npc', r: 10, solid: true, visible: true, ...o, x: C(o.tx), y: C(o.ty) }; }
function thing(o) { return { kind: 'thing', visible: true, tw: 1, th: 1, ...o }; }
function kindness(text, w = 1) { state.warmth += w; state.kindness.push(text); }
function talkCount(id) { F()[`tc_${id}`] = (F()[`tc_${id}`] || 0) + 1; return F()[`tc_${id}`] - 1; }
function note(text) { state.notes = state.notes || []; if (!state.notes.includes(text)) state.notes.push(text); }

// ═════════════════════════ 편의점 야간 근무 (위장 오프닝) ═════════════════════════

const shiftTasks = () => ['task_fridge', 'task_ramen', 'task_waste'].filter((k) => F()[k]).length;
function shiftObjective(g) {
  const f = F();
  if (g.cust && g.cust.waiting) { g.objective('손님이 기다린다 · 계산대로', true); return; }
  const n = shiftTasks();
  g.objective(n >= 3 ? '할 일 끝 · 손님 기다리기' : `진열 정리·폐기 체크 ${n}/3`, true);
}

async function sayV(g, name, text, role) {
  g.voice.speak(text, role);
  await g.say(name, text, { mode: role === 'dj' ? 'radio' : '' });
  g.voice.stop();
}

const CUSTOMERS = [
  {
    time: [1, 20], name: '술 취한 회사원', color: '#3c3f52', goods: ['hetbahn', 'water500'], barks: ['(비틀) 저기요…', '계산이요오'],
    async after(g) {
      await g.say('술 취한 회사원', '즉석밥… 이거 전자레인지 돼요? 아, 되지. 되지.');
      await g.say('술 취한 회사원', '요즘 뉴스 보면 술이 안 깨요. 맨날 미사일 쏜대. 맨날.');
      await g.say('술 취한 회사원', '근데 맨날 쏘니까… 이제 아무도 안 무서워하잖아. 그게 무서운 거야, 그게.');
    },
  },
  {
    time: [2, 5], name: '택배기사', color: '#4f6a3a', goods: ['mixCoffee', 'mixCoffee', 'kimbap'], barks: ['형님 고생하십니다'],
    async after(g) {
      await g.say('택배기사', '형님 오늘도 야간이세요? 저도요. 우리 같은 사람들이 나라를 돌려요, 밤에.');
      await g.say('택배기사', '근데 오늘 고속도로에 군 차량이 엄청 많던데요. 줄줄이. 훈련인가 봐요.');
      await g.say('택배기사', '아 맞다. 303동 1104호, 형님 댁이죠? 택배 하나 있던데. 내일 아침에 문 앞에 둘게요.');
      note('303동 1104호 택배 — 내일 아침 도착 예정');
    },
  },
  {
    time: [2, 40], name: '고등학생 둘', color: '#2a3a5a', pair: '#5a3a3a', goods: ['cupRamen', 'cupRamen'], barks: ['야 빨리 골라', '나 불닭'],
    async after(g) {
      await g.say('고등학생', '야 학교 단톡에 전쟁 난다는 거 떴는데 ㅋㅋ');
      await g.say('고등학생 친구', '또 그거? 작년에도 그랬잖아. 수행평가나 걱정해.');
      await g.say('고등학생', '아저씨, 전쟁 나면 편의점은 문 열어요?');
      const c = await g.choose('', ['24시간이니까 열겠지.', '그땐 아저씨도 도망가야지.', '빨리 집에 가서 자라.']);
      if (c === 0) await g.say('고등학생', 'ㅋㅋㅋ 아저씨 레전드.');
      else if (c === 1) await g.say('고등학생 친구', '아 ㅋㅋ 같이 가요 그럼.');
      else await g.say('고등학생', '네에… 엄마 같아.');
    },
  },
  {
    time: [3, 15], name: '307동 할머니', color: '#6b5a72', hair: '#d8d4cc', goods: ['peach'], barks: ['…'],
    async after(g) {
      await g.say('307동 할머니', '잠이 안 와서. 늙으면 다 그래.');
      await g.say('307동 할머니', '이거, 황도. 아플 때 먹는 거야. 우리 엄마가 그랬어. 피난 가는 배에서도 이걸 줬는데.');
      const c = await g.choose('', ['어디 편찮으세요?', '조심히 들어가세요.']);
      if (c === 0) await g.say('307동 할머니', '아니. 그냥 오늘은… 옛날 생각이 나네.');
      await g.say('307동 할머니', '총각 이름이 뭐랬지?');
      await g.say('강도일', '도일이요. 강도일.');
      await g.say('307동 할머니', '도일이. 그래, 도일이.');
      F().metGrandma = true;
    },
  },
  {
    time: [3, 40], name: '경비원 박 씨', color: '#3f5066', hair: '#9a9a9a', goods: ['mixCoffee'], barks: ['총각, 커피 하나'],
    async after(g) {
      await g.say('경비원 박 씨', '총각, 오늘따라 조용하지? 이런 날이 꼭…');
      await g.say('경비원 박 씨', '아냐. 늙은이 말은 반만 들어.');
      await g.say('경비원 박 씨', '아까 307동 할머니 왔다 갔지? 그 양반 요즘 잠을 못 주무셔. 혼자 사시니까 내가 가끔 들여다봐.');
    },
  },
];

function spawnCustomer(g) {
  const f = F();
  const c = CUSTOMERS[f.custIdx];
  f.custIdx += 1;
  setClock(0, c.time[0], c.time[1]);
  g.sfx.chime();
  const e = npc({ id: 'cust', name: c.name, tx: 6, ty: 9, color: c.color, hair: c.hair, solid: true, barks: c.barks, def: c });
  g.scene.entities.push(e);
  g.cust = e;
  const followers = [];
  if (c.pair) {
    const e2 = npc({ id: 'cust2', name: c.name, tx: 6, ty: 9, color: c.pair, solid: false });
    g.scene.entities.push(e2);
    followers.push(e2);
    setTimeout(() => g.walk(e2, [[8, 9], [8, 8]], 70), 500);
  }
  e.followers = followers;
  g.walk(e, [[9, 9], [9, 8]], 70).then(() => { e.waiting = true; e.face = 0; e.barkReady = 0; shiftObjective(g); });
}

async function serveCustomer(g) {
  const e = g.cust;
  const c = e.def;
  e.waiting = false;
  await g.ui.pos(c.name, c.goods);
  await c.after(g);
  const out = () => g.walk(e, [[9, 9], [6, 9], [6, 10]], 80);
  e.followers.forEach((x) => g.walk(x, [[6, 9], [6, 10]], 80).then(() => { x.visible = false; }));
  out().then(() => {
    e.visible = false;
    g.sfx.chime();
    g.scene.entities = g.scene.entities.filter((x) => x !== e && !e.followers.includes(x));
    g.cust = null;
    F().lastCustLeft = F().shiftT;
    F().nextCustAt = F().shiftT + 14;
    shiftObjective(g);
  });
}

function shelf(id, title, onShift, after) {
  return async (g) => {
    const f = F();
    if (f.siren) { await g.narr('지금은 그럴 때가 아니다.'); return; }
    await onShift(g, f);
    if (after) await after(g);
    shiftObjective(g);
  };
}

const NEWS_FRAMES = [
  { img: 'news_01_studio', time: '04:09', tag: '뉴스', lines: [{ text: '한누리뉴스24입니다. 방금 들어온 속보를 전해 드립니다.' }] },
  { img: 'news_02_breaking', time: '04:09', lines: [{ text: '합동참모본부는 조금 전, 북한이 오전 4시 3분경 탄도미사일 여러 발을 발사했다고 밝혔습니다.' }] },
  { img: 'news_03_map', time: '04:10', zoom: true, lines: [{ text: '미사일은 수도권을 포함한 남쪽 방향으로 발사된 것으로 보이며, 군은 정확한 궤적을 분석하고 있습니다.' }] },
  { img: 'news_04_coast', fallback: 'news_03_map', time: '04:10', tag: '현장 연결', red: true, lines: [{ role: 'reporter', text: '네, 서해안입니다. 조금 전부터 바다 쪽에서 섬광이 여러 차례… 지금도 보입니다. 주민들이 밖으로 나와…' }] },
  { img: 'news_05_jets', fallback: 'news_02_breaking', time: '04:11', lines: [{ text: '정부는 국가안전보장회의를 긴급 소집했고, 전군에 최고 수준의 경계 태세가 발령됐습니다.' }] },
  { img: 'news_06_subway', fallback: 'news_02_breaking', time: '04:11', zoom: true, lines: [{ text: '수도권 전역에 공습경보가 발령됐습니다. 시민 여러분은 지금 즉시 가까운 지하 대피시설로 이동해 주십시오.' }] },
  { img: 'news_07_earpiece', fallback: 'news_02_breaking', time: '04:12', zoom: true, flick: true, lines: [{ text: '지금 막… 추가로 들어온 소식이…' }, { text: '…네? 네.', pause: 1500 }, { text: '시청자 여러분, 지금 바로—' }] },
  { img: null, noise: true, noiseMs: 1500, hold: 1500, time: '' },
];

const GRAB = [
  ['flashlight', '계산대 밑. 정전 대비용이라고 사장님이 사 둔 것.'],
  ['battery', '손전등 옆 칸. 네 개들이.'],
  ['raincoat', '비 오는 날 제일 잘 팔리는 것.'],
  ['mask', '계산대 옆 매대 맨 아래 칸.'],
  ['medkit', '사장님이 직원용으로 두고 간 상비약.'],
  ['handwarmer', '11월이다. 지하는 춥다.'],
  ['powerbank', '휴대폰이 꺼지면 끝이다.'],
];

function chatScript(g, list) {
  list.forEach(([ms, who, text]) => setTimeout(() => { if (!F().flash) g.ui.chat(who, text); }, ms));
}

async function newsSequence(g) {
  const f = F();
  if (f.newsStarted) return;
  f.newsStarted = true;
  setClock(0, 4, 8);
  g.sfx.shop(false);
  await sayV(g, '라디오 · DJ', '네, 오늘 사연 보내 주신 분께는 커피 쿠폰 보내 드리고요. 다음 곡은…', 'dj');
  await sayV(g, '라디오 · DJ', '…아, 잠시만요.', 'dj');
  await sayV(g, '라디오 · DJ', '청취자 여러분, 잠시 방송을 중단하고… 긴급 뉴스를 전해 드리겠습니다.', 'dj');
  g.sfx.notify();
  g.ui.toast('한누리뉴스24 · 속보 생방송', 2400);
  await wait(900);
  await g.narr('휴대폰에 속보 알림이 떴다. 손가락이 먼저 눌렀다.');
  g.sfx.hum(false);
  await g.ui.news(NEWS_FRAMES, g.voice);
  setClock(0, 4, 12);
  await sirenScript(g);
}

async function sirenScript(g) {
  const f = F();
  f.siren = true;
  g.sfx.alert();
  g.shake(0.5, 2);
  await wait(900);
  const a1 = { title: '긴급재난문자', time: '04:12', body: '[가상] 공습경보 발령. 지금 즉시 가까운 지하 대피시설로 대피하십시오.' };
  state.alerts.push(a1);
  await g.ui.alertPopup(a1);
  // 정체가 드러난다: 생존 게이지가 나타난다
  document.body.classList.remove('shift');
  document.body.classList.add('reveal-stats');
  g.ui.updateHUD();
  g.sfx.alert();
  await wait(700);
  const a2 = { title: '긴급재난문자', time: '04:12', body: '[가상] 이것은 훈련이 아닙니다. 실제 상황입니다. 엘리베이터를 이용하지 마십시오.' };
  state.alerts.push(a2);
  await g.ui.alertPopup(a2);
  addStat('mental', -8);
  g.sfx.siren(true);
  chatScript(g, [
    [400, '303동 고양이집사', '이거 뭐예요??'],
    [1500, '301동 1203호', 'ㅋㅋ 훈련임 매년 함'],
    [2900, '302동 김○○', '훈련 아니래요 뉴스 보세요 뉴스'],
    [4300, '관리사무소', '[안내] 주민 여러분은 지하주차장 B2로 대피해 주십시오'],
    [5600, '301동 1203호', '엘베 멈췄어요 계단으로 가세요'],
  ]);
  await wait(1600);
  g.sfx.ring(2);
  g.ui.callScreen('문기철 사장님', '휴대전화 수신 중…');
  await wait(2200);
  g.ui.callScreen('문기철 사장님', '통화 중');
  await g.say('문 사장', '도일아! 봤지? 뉴스 봤지?');
  await g.say('문 사장', '셔터 내려. 아니… 아니다. 너 그냥 가. 가게 신경 쓰지 말고.');
  const c = await g.choose('', ['사장님은요?', '…알겠습니다.']);
  if (c === 0) await g.say('문 사장', '난 정왕동 집이야. 애 엄마 깨워야 돼. 필요한 거 챙겨서 가. 계산 같은 거 하지 말고!');
  else await g.say('문 사장', '필요한 거 챙겨서 가. 계산 같은 거 하지 말고. …도일아, 조심해라.');
  g.ui.hideCall();
  await g.narr('손이 먼저 움직였다. 5년 동안 매일 정리한 진열대였다. 어디에 뭐가 있는지 눈을 감고도 안다.');
  for (const [id, n] of GRAB) {
    if (!canFit(id)) break;
    addItem(id);
    if (id === 'flashlight') { f.gotFlash = true; state.flashPower = 100; }
    await g.ui.itemGet(id, { kicker: '챙겼다', note: n, ms: 1350 });
  }
  await g.ui.centerText(`가방이 꽉 찼다.<small>${state.bagSlots}칸 중 ${Math.min(state.bagSlots, state.inv.reduce((s, e) => s + ITEMS[e.id].size * e.qty, 0))}칸</small>`, 1800);
  g.ui.toast(document.body.classList.contains('touch') ? '손전등: 「손전등」 버튼' : '손전등: F 키', 3200);
  await leaveStore(g);
}

async function leaveStore(g) {
  const f = F();
  if (f.leftStore) return;
  f.leftStore = true;
  state.taken = state.inv.map((e) => `${ITEMS[e.id].name} ×${e.qty}`);
  await g.goto('street', { tx: 7, ty: 13, dir: -90 });
}

const store = {
  map: 'store',
  timeRate: 0.12,
  tint: [10, 12, 16],
  visionR: 120,
  setup(s) {
    s.power = true;
    s.ambient = 0.06;
    s.entities.push(
      thing({
        id: 'fridge', tx: 1, ty: 1, tw: 10, label: '음료 냉장고 · 진열',
        onUse: shelf('fridge', '음료 냉장고', async (g, f) => {
          if (f.task_fridge) { await g.narr('냉장고는 정리했다. 물병들이 가지런하다.'); return; }
          await g.ui.restock('음료 냉장고 진열', 'water500', ['11.20', '12.02', '11.16', '12.24']);
          f.task_fridge = true;
          await g.narr('물 한 병은 내 몫. 사장님이 늘 그러라고 했다.');
          addItem('water500');
          await g.ui.itemGet('water500', { kicker: '획득', note: '근무 중에 마시는 물. 사장님이 준 것.' });
        }),
      }),
      thing({
        id: 'shelfA', tx: 2, ty: 3, tw: 5, label: '삼각김밥 · 폐기 체크',
        onUse: shelf('waste', '삼각김밥', async (g, f) => {
          if (f.task_waste) { await g.narr('폐기는 끝났다. 남은 건 06:00까지 팔 수 있다.'); return; }
          await g.ui.wasteCheck(clockText().replace(/^D\+\d+\s+/, ''));
          f.task_waste = true;
          await g.narr('폐기 셋 중 둘은 아침밥이다. 5년째 같은 아침.');
          addItem('kimbap', 2);
          await g.ui.itemGet('kimbap', { n: 2, kicker: '획득', note: '폐기 삼각김밥. 참치마요. 사장님은 못 본 척한다.' });
        }),
      }),
      thing({ id: 'shelfB', tx: 8, ty: 3, tw: 5, label: '생활용품 진열대', onUse: shelf('goods', '', async (g) => { await g.narr('건전지, 우비, 핫팩, 손전등. 평소엔 아무도 사지 않는 것들.'); }) }),
      thing({
        id: 'shelfC', tx: 2, ty: 5, tw: 5, label: '라면 진열대 · 진열',
        onUse: shelf('ramen', '라면', async (g, f) => {
          if (f.task_ramen) { await g.narr('컵라면 줄이 맞다. 아무도 보지 않는 줄이지만.'); return; }
          await g.ui.restock('라면 진열', 'cupRamen', ['12.30', '11.28', '12.05', '11.21']);
          f.task_ramen = true;
          await g.narr('컵라면 줄을 맞췄다. 아무도 보지 않는 줄이다. 그래도 맞춘다.');
        }),
      }),
      thing({ id: 'shelfD', tx: 8, ty: 5, tw: 5, label: '과자 진열대', onUse: shelf('snack', '', async (g) => { await g.narr('과자 봉지는 가볍다. 배는 안 찬다. 고등학생들은 늘 여기서 오래 고민한다.'); }) }),
      thing({
        id: 'counter', tx: 10, ty: 7, tw: 3, th: 2, label: '계산대',
        verb: '살펴보기',
        onUse: async (g) => {
          if (F().siren) return;
          if (g.cust && g.cust.waiting) { await serveCustomer(g); return; }
          const f = F();
          const n = (f.radioN = (f.radioN || 0) + 1);
          if (n === 1) {
            await sayV(g, '라디오 · DJ', '다음 사연입니다. 군대 간 아들에게 보내는 엄마의 편지예요. 우리 아들, 밥은 잘 먹고 있니…', 'dj');
            await g.narr('도일은 볼륨을 조금 줄였다. 휴대폰을 꺼내 볼까 하다가, 그만뒀다.');
          } else if (n === 2) {
            await sayV(g, '라디오 · DJ', '새벽 세 시를 넘어가고 있습니다. 지금 깨어 계신 분들, 다들 무슨 이유가 있으시겠죠.', 'dj');
          } else {
            await g.narr('라디오에서는 오래된 노래가 흘러나온다.');
          }
        },
      }),
      thing({ id: 'door', tx: 6, ty: 10, tw: 2, label: '출입문', onUse: async (g) => { await g.narr(F().siren ? '…' : '근무 중이다. 교대는 아침 8시.'); } }),
    );
    // 계산대 라벨은 손님이 기다릴 때 바뀐다
    const counter = s.entities.find((e) => e.id === 'counter');
    Object.defineProperty(counter, 'label', { get: () => (window.__game && window.__game.cust && window.__game.cust.waiting ? `계산하기 · ${window.__game.cust.name}` : '계산대 · 라디오') });
  },
  async onEnter(g) {
    const f = F();
    if (f.introDone) return;
    setClock(0, 1, 0);
    g.ui.showHUD(false);
    await g.ui.card([
      { text: '오늘25 배곧해오름점', cls: 'kicker' },
      '야간 근무 1,825일째.',
      '새벽 1시.',
      '오늘도 무사히, 아침 8시까지.',
    ], { gap: 1100 });
    f.introDone = true;
    f.custIdx = 0;
    f.shiftT = 0;
    f.nextCustAt = 12;
    g.ui.showHUD(true);
    g.sfx.hum(true);
    g.sfx.shop(true);
    await g.ui.fade(0, 1000);
    shiftObjective(g);
    if (document.body.classList.contains('touch')) g.ui.toast('화면 왼쪽을 끌어 이동 · 「행동」 버튼으로 살펴보기', 5000);
    else { g.ui.toast('이동 WASD·방향키 · 살펴보기 E', 5000); setTimeout(() => g.ui.toast('휴대폰 P · 가방 I · 소리 M', 5000), 900); }
  },
  update(g, dt, free) {
    const f = F();
    if (!f.introDone || f.newsStarted) return;
    f.shiftT += dt;
    if (!g.cust && f.custIdx < CUSTOMERS.length && f.shiftT > f.nextCustAt) spawnCustomer(g);
    if (free && !g.cust && f.custIdx >= CUSTOMERS.length && (shiftTasks() >= 3 || f.shiftT - f.lastCustLeft > 35)) g.run(newsSequence);
  },
};

// ═════════════════════════ 단지 앞 거리 ═════════════════════════

const SHADOW_TILES = new Set(['B', 'c', 'T', 'L', 'K', 'M']);

function streetLights(s) {
  s.lights = [];
  if (s.power) {
    for (const [x, y] of [[4, 13], [18, 13], [28, 13]]) s.lights.push({ x: C(x), y: C(y) - 8, r: 150, i: 0.9, color: '#f3d79a', noOcc: true });
    s.lights.push({ x: C(7) - 16, y: C(13), r: 170, i: 0.92, color: '#cfe8ff', glow: 0.12 });
    s.lights.push({ x: C(12), y: C(5) + 12, r: 70, i: 0.7, color: '#f3d79a' });
  } else {
    // 동북쪽 지평선의 불그스름한 빛
    s.lights.push({ x: 33 * TILE, y: -3 * TILE, r: 560, i: 0.3, color: '#e0742c', glow: 0.14, noOcc: true });
  }
}

function perchBirds(s) {
  const spots = [[4, 1], [6, 2], [8, 1], [16, 1], [19, 3], [21, 2], [26, 2], [28, 4], [10, 13], [22, 13], [13, 8], [30, 8]];
  spots.forEach(([x, y]) => s.particles.push({ type: 'bird', perched: true, x: x * TILE + Math.random() * 20, y: y * TILE + 10 + Math.random() * 10, vx: 0, vy: 0, life: 9999, fade: 0.6 }));
}

// 그림자 다각형: 타일 사각형과 남서쪽으로 L만큼 민 사각형의 볼록 껍질
function shadowHull(x, y, w, h, L) {
  return [[x, y], [x + w, y], [x + w, y + h], [x + w - L, y + h + L], [x - L, y + h + L], [x - L, y + L]];
}

async function flashScript(g) {
  const f = F();
  if (f.flash) return;
  f.flash = true;
  setClock(0, 4, 17);
  const s = g.scene;
  // 0. 휴대폰 화면들이 깜빡인다
  g.sfx.glitch();
  g.shake(0.3, 2);
  await wait(450);
  // 1. 새들이 날아오른다
  s.particles.forEach((q) => { if (q.type === 'bird') { q.perched = false; q.vx = -40 - Math.random() * 60; q.vy = 30 + Math.random() * 50; q.life = 4; } });
  g.sfx.flap();
  // 2. 동북쪽에서 빛이 오며 그림자가 남서쪽으로 늘어난다
  g.sfx.siren(false);
  g.sfx.silence(11000);
  s.fx = { white: 0, shadow: 0, t0: g.now };
  await wait(1500);
  // 3. 하얗게 타고, 진짜 제목이 떠오른다
  document.title = '서울 끝';
  g.sfx.tinnitus(8);
  const hold = g.ui.whiteTitle(4600);
  s.power = false;
  s.ambient = 0.9;
  s.fx = null;
  streetLights(s);
  s.particles = s.particles.filter((q) => q.type !== 'bird');
  s.entities.forEach((e) => { if (e.runner) e.visible = false; });
  g.refreshMap();
  addStat('mental', -10);
  await hold;
  await g.ui.whiteOut(3600);
  await wait(1200);
  await g.ui.centerText('소리가 나지 않았다.', 2200);
  // 4. 4분을 센다. 플레이어는 움직일 수 있다
  f.clockT0 = g.now;
  g.sfx.heartbeat(true);
  g.objective('단지 지하주차장(대피소)으로', true);
}

const WAVE_SEC = 14; // 04:17 → 04:21 을 이만큼으로 압축

async function shockwaveScript(g) {
  const f = F();
  if (f.rumble) return;
  f.rumble = true;
  g.ui.bigClock(null);
  g.sfx.heartbeat(false);
  setClock(0, 4, 21);
  const s = g.scene;
  const map = s.map;
  const W = map.rows[0].length * TILE;
  const targets = [];
  map.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const below = (map.rows[y + 1] || '')[x];
    if ((ch === 'B' && below !== 'B') || ch === 'w' || ch === 'K') targets.push({ x: x * TILE + 16, y: y * TILE + 26, kind: 'glass' });
    if (ch === 'c') targets.push({ x: x * TILE + 16, y: y * TILE + 16, kind: 'car' });
  }));
  s.wave = { t0: g.now, dur: 3.4, max: (W + map.rows.length * TILE) / Math.SQRT2, targets, hitPlayer: false };
  g.sfx.rumble();
  await wait(3800);
  s.wave = null;
  await g.ui.centerText('소리는 4분 뒤에 왔다.<small>80킬로미터를 건너오느라.</small>', 2800);
  await g.narr('동북쪽 하늘 아래가 멍처럼 붉었다. 그 방향에 서울이 있다. 도준이 있다.');
}

async function parkTalk(g) {
  const f = F();
  if (f.parkTalked) return;
  if (!f.flash) await flashScript(g);
  if (!f.rumble) await shockwaveScript(g);
  setClock(0, 4, 25);
  const park = g.ent('park');
  park.face = Math.atan2(g.player.y - park.y, g.player.x - park.x);
  park.light.angle = park.face;
  await g.say('경비원 박 씨', '지하로! 지하 2층으로! 엘리베이터 타지 말고!');
  await g.say('경비원 박 씨', '…아, 도일이 총각이구먼.');
  await g.say('경비원 박 씨', '혹시 307동 할머니 못 봤어? 1502호. 아까 편의점 다녀가셨잖아. 아직 안 내려오셨어.');
  const c = await g.choose('', ['못 봤어요.', '같이 올라가 볼까요?']);
  if (c === 0) {
    await g.say('경비원 박 씨', '그래. 내가 금방 다녀올게. 총각은 얼른 내려가.');
  } else {
    await g.say('경비원 박 씨', '아니야, 아니야. 15층이야. 젊은 사람은 내려가서 사람들 좀 도와. 내가 금방 다녀와.');
    kindness('경비원 박 씨에게 같이 올라가겠다고 했다', 1);
    f.offeredPark = true;
  }
  await g.say('경비원 박 씨', '아, 일지. 일지는 쓰고 가야지.');
  f.parkTalked = true;
  f.rampOkAt = g.now + 2.2;
  g.objective('경사로를 따라 지하 2층으로');
  g.walk(park, [[22, 5], [13, 5]], 70).then(() => { park.face = Math.PI / 2; park.light.angle = Math.PI / 2; });
}

async function enterB2(g) {
  g.sfx.carAlarm(false);
  await g.narr('경사로 아래에서 사람들의 웅성거림이 올라왔다.');
  await g.goto('b2', { tx: 30, ty: 3, dir: 90 });
}

const street = {
  map: 'street',
  timeRate: 0,
  tint: [8, 10, 16],
  setup(s) {
    const f = F();
    s.power = !f.flash;
    s.ambient = s.power ? 0.72 : 0.9;
    s.labels = [
      { text: '301동', x: 6.5, y: 2.5, size: 13 },
      { text: '303동', x: 18.5, y: 2.5, size: 13 },
      { text: '해오름마을 3단지', x: 15, y: 7.55, size: 9, color: 'rgba(255,255,255,.55)' },
      { text: '경비실', x: 12, y: 6.0, size: 8, color: '#222' },
      { text: '지하주차장 · 대피소', x: 27, y: 3.45, size: 9, bg: 'rgba(0,0,0,.7)', color: '#e3b341' },
      { text: '305~310동 →', x: 29.3, y: 6.5, size: 8, color: 'rgba(255,255,255,.5)' },
      { text: '오늘25', x: 8, y: 15.3, size: 11, bg: '#2f8f83', color: '#fff' },
    ];
    streetLights(s);
    if (!f.flash) perchBirds(s);
    s.entities.push(
      npc({
        id: 'park', name: '경비원 박 씨', tx: 24, ty: 5, color: '#3f5066', hair: '#9a9a9a',
        light: { r: 210, i: 0.85, cone: true, angle: Math.PI, spread: 0.38, color: '#fff3d6', glow: 0.08 },
        visible: !f.parkTalked,
        onUse: parkTalk,
        enabled: () => !F().parkTalked,
        mark: () => !F().parkTalked && F().rumble,
      }),
      thing({ id: 'storeDoor', tx: 6, ty: 14, tw: 2, label: '편의점 출입문', onUse: async (g) => { await g.narr(F().flash ? '셔터 너머는 캄캄하다. 돌아갈 곳이 아니다.' : '다시 들어갈 시간은 없다.'); } }),
      thing({
        id: 'booth', tx: 11, ty: 6, tw: 2, th: 2, label: '경비실',
        onUse: async (g) => {
          if (F().parkTalked) await g.narr('경비실 안에서 손전등 불빛이 흔들린다. 박 씨가 무언가를 적고 있다.');
          else await g.narr('경비실은 비어 있다. 책상 위에 근무일지와 식은 믹스커피가 놓여 있다.');
        },
      }),
      thing({ id: 'ramp', tx: 25, ty: 4, tw: 4, th: 2, label: '지하주차장 경사로', onUse: async (g) => { if (F().parkTalked) await enterB2(g); else await parkTalk(g); } }),
    );
    if (!f.flash) {
      const runners = [
        { tx: 1, ty: 8, color: '#5b4b6b', path: [[13, 8], [14, 6], [24, 6], [27, 6]], sp: 130 },
        { tx: 30, ty: 8, color: '#6b5b3b', path: [[15, 8], [15, 6], [26, 6]], sp: 150 },
        { tx: 20, ty: 13, color: '#3b5b6b', path: [[15, 12], [15, 7], [23, 6], [28, 6]], sp: 120 },
      ];
      runners.forEach((r, i) => s.entities.push(npc({ id: `runner${i}`, runner: true, solid: false, tx: r.tx, ty: r.ty, color: r.color, run: r, light: { r: 40, i: 0.5, color: '#9cc3ff', glow: 0.1 } })));
    }
    s.triggers.push(
      { x: 0, y: 0, w: 32, h: 9, when: () => !F().flash, run: flashScript },
      { x: 20, y: 3, w: 5, h: 4, when: () => !F().parkTalked && F().rumble, run: parkTalk },
      { x: 23, y: 3, w: 7, h: 4, once: false, when: (g) => F().parkTalked && g.now > F().rampOkAt && !F().inB2Transit, run: async (g) => { F().inB2Transit = true; await enterB2(g); } },
    );
  },
  async onEnter(g) {
    const f = F();
    f.streetAt = g.now;
    f.inB2Transit = false;
    g.scene.entities.filter((e) => e.runner).forEach((e) => {
      setTimeout(() => g.walk(e, e.run.path, e.run.sp).then(() => { e.visible = false; }), Math.random() * 1500);
    });
    if (!f.streetIntro) {
      f.streetIntro = true;
      g.objective('단지 지하주차장(대피소)으로');
      chatScript(g, [[1800, '305동', '지금 내려가는 중이에요 애기 있어서 천천히'], [4200, '303동 고양이집사', '고양이 데리고 가도 되나요?']]);
      await g.narr('밖은 아직 밤이었다. 아파트 창문들이 하나둘 켜지고 있었다.');
    }
  },
  update(g, dt, free) {
    const f = F();
    const s = g.scene;
    if (!f.flash) { if (free && g.now - f.streetAt > 16) g.run(flashScript); return; }
    // 섬광 직전: 하얘지는 정도와 그림자 길이
    if (s.fx) { const t = (g.now - s.fx.t0) / 1.5; s.fx.white = Math.min(1, t) * 0.75; s.fx.shadow = Math.min(1, t) * 150; }
    // 4분 시계
    if (f.clockT0 && !f.rumble) {
      const e = Math.min(1, (g.now - f.clockT0) / WAVE_SEC);
      const sec = Math.floor(e * 240);
      const mm = 17 + Math.floor(sec / 60), ss = sec % 60;
      g.ui.bigClock(`04:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}<small>섬광 후 ${Math.floor(sec / 60)}분 ${ss}초</small>`);
      if (Math.floor(g.now * 4) !== f.lastTick) { f.lastTick = Math.floor(g.now * 4); g.sfx.tick(); }
      if (e >= 1 && free) g.run(shockwaveScript);
    }
    // 충격파가 지나가며 유리를 깨고 차 경보를 켠다
    if (s.wave) {
      const w = s.wave;
      const front = ((g.now - w.t0) / w.dur) * w.max;
      const W = s.map.rows[0].length * TILE;
      const sOf = (x, y) => (W - x + y) / Math.SQRT2;
      let glassN = 0;
      for (const t of w.targets) {
        if (t.done || sOf(t.x, t.y) > front) continue;
        t.done = true;
        if (t.kind === 'glass') {
          for (let i = 0; i < 6; i++) s.particles.push({ type: 'shard', x: t.x + (Math.random() - 0.5) * 20, y: t.y, vx: -60 - Math.random() * 120, vy: 40 + Math.random() * 120, size: 1.5 + Math.random() * 2, life: 1.6 + Math.random(), fade: 1 });
          if (glassN++ < 2) g.sfx.glass();
        } else if (!f.alarmOn) { f.alarmOn = true; g.sfx.carAlarm(true); }
      }
      if (!w.hitPlayer && sOf(g.player.x, g.player.y) <= front) { w.hitPlayer = true; g.shake(1.6, 14); g.sfx.thud(); for (let i = 0; i < 30; i++) s.particles.push({ type: 'dust', x: g.player.x + (Math.random() - 0.5) * 300, y: g.player.y + (Math.random() - 0.5) * 200, vx: -80 - Math.random() * 80, vy: 60 + Math.random() * 60, size: 2, life: 1.5, fade: 1 }); }
    }
  },
  drawUnder(ctx, g) {
    const s = g.scene;
    if (!s.fx || s.fx.shadow <= 0) return;
    const L = s.fx.shadow;
    ctx.fillStyle = 'rgba(12,12,22,0.55)';
    s.map.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!SHADOW_TILES.has(ch)) return;
      const pts = shadowHull(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6, L);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    }));
    const people = [g.player, ...s.entities.filter((e) => e.kind === 'npc' && e.visible !== false)];
    people.forEach((p) => {
      const pts = shadowHull(p.x - 7, p.y - 7, 14, 14, L * 0.8);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((q) => ctx.lineTo(q[0], q[1])); ctx.closePath(); ctx.fill();
    });
  },
  drawTop(ctx, g) {
    const s = g.scene;
    const W = s.map.rows[0].length * TILE, H = s.map.rows.length * TILE;
    if (s.fx && s.fx.white > 0) {
      ctx.fillStyle = `rgba(255,250,236,${s.fx.white})`;
      ctx.fillRect(-200, -200, W + 400, H + 400);
    }
    if (s.wave) {
      // 충격파의 앞면: 화면을 북동쪽에서 남서쪽으로 가로지르는 띠
      const w = s.wave;
      const front = ((g.now - w.t0) / w.dur) * w.max * Math.SQRT2;
      const x0 = -200, x1 = W + 200;
      ctx.strokeStyle = 'rgba(235,225,205,0.28)';
      ctx.lineWidth = 38;
      ctx.beginPath(); ctx.moveTo(x0, front - W + x0); ctx.lineTo(x1, front - W + x1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,245,225,0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x0, front - W + x0 - 14); ctx.lineTo(x1, front - W + x1 - 14); ctx.stroke();
    }
  },
};

// ═════════════════════════ 지하 2층 대피소 ═════════════════════════

const EXTRAS = [
  { tx: 4, ty: 6, name: '402호 아주머니', color: '#7a5a5a', lines: ['우리 아들은 강남에서 일해요. 전화가 안 돼요.', '…괜찮겠죠? 강남은 멀잖아요. 거기서는.'] },
  { tx: 8, ty: 7, name: '고등학생', color: '#2a3a5a', lines: ['이거 진짜예요? 와이파이도 안 되고 아무것도 안 돼요.', '친구들 단톡방 마지막 메시지가 “ㅋㅋ 훈련임”이에요.'] },
  { tx: 21, ty: 3, name: '노인', color: '#5a5a4a', hair: '#cfcfcf', lines: ['…또 시작이구먼.', '내 평생 이걸 두 번 볼 줄은 몰랐어.'] },
  { tx: 23, ty: 11, name: '배달 기사', color: '#3a6a4a', lines: ['오토바이 위에서 문자 받았어요. 콜은 다 취소됐고.', '배달 가방에 치킨이 두 마리 있었는데, 다 식어서 여기 사람들이랑 나눠 먹었어요.'] },
  { tx: 28, ty: 8, name: '부부', color: '#6a4a3a', lines: ['(속삭이며 다투고 있다) …그러니까 내가 이사 오지 말자고 했잖아.', '(아내가 남편의 손을 꽉 잡고 있다. 다툼은 끝난 것 같다.)'] },
  { tx: 12, ty: 11, name: '어린아이', color: '#c45a4a', small: true, lines: ['아저씨 편의점 아저씨죠? 초코우유 있어요?', '엄마가 여기서 자면 캠핑이래요.'] },
  { tx: 19, ty: 12, name: '회사원', color: '#3a3a44', lines: ['서울 가는 첫차 타려고 일찍 일어났거든요. 이게 다행인 건지.', '회사 단톡방에 “오늘 재택”이라고 올라왔어요. 웃기죠.'] },
  { tx: 26, ty: 4, name: '청년', color: '#4a4a6a', lines: ['형, 데이터 돼요? 저 아예 안 돼요.', '기지국에 전기가 없으면 끝이래요. 배터리로 몇 시간 버티고.'] },
];

async function choiTalk(g) {
  const f = F();
  if (!f.registered) {
    await g.say('동대표 최정민', '몇 동 몇 호세요?');
    await g.say('강도일', '303동 1104호요. 강도일.');
    await g.say('동대표 최정민', '가족은요? 혼자세요?');
    const c = await g.choose('', ['혼자요.', '동생이 하나 있는데… 군대에 있어요.']);
    if (c === 1) {
      await g.say('동대표 최정민', '…그래요. 다들 누구 하나씩은 밖에 있죠.');
      await g.say('동대표 최정민', '저도 처가가 의정부예요. 연락이 안 돼요.');
    } else {
      await g.say('동대표 최정민', '그래요.');
    }
    await g.say('동대표 최정민', '047번 칸이 비었어요. 저쪽 끝. 오늘은 거기서 쉬세요.');
    await g.say('동대표 최정민', '물은… 아껴 드세요. 얼마나 있게 될지 아무도 몰라요.');
    f.registered = true;
    g.objective('둘러보고 047번 칸에서 쉬기');
    if (!f.textTip) { f.textTip = true; g.ui.toast('휴대폰(P)에서 도준에게 문자를 쓸 수 있다.', 4200); }
    return;
  }
  if (state.day === 1 && f.oldmanAsked && !f.oldmanTold) {
    await g.say('강도일', '7층 704호에 노부부가 계세요. 할머니 무릎이 안 좋아서 못 내려오신대요. 물이 필요하대요.');
    await g.say('동대표 최정민', '……');
    await g.say('동대표 최정민', '알겠어요. 내일 아침에 청년들 올려 보낼게요. 704호.');
    await g.say('동대표 최정민', '…말해 줘서 고마워요. 위에 누가 남아 있는지 다 몰라요, 저도.');
    f.oldmanTold = true;
    kindness('7층 노부부의 사정을 동대표에게 전했다', 1);
    return;
  }
  const lines = state.day === 0
    ? ['다들 일단 쉬세요. 아침에 라디오 들어 보고 다시 얘기합시다.', '…괜찮아요. 여기 있으면 살아요.']
    : ['밖에는 나가지 마세요. 지하로 연결된 동은 다녀와도 됩니다.', '물 배급은 내일부터 정리할 거예요. 공평하게.'];
  await g.say('동대표 최정민', lines[talkCount('choi') % lines.length]);
}

async function razTalk(g) {
  const f = F();
  if (!f.razMet) {
    f.razMet = true;
    await g.narr('작업복 차림의 남자가 벽에 기대 혼자 앉아 있다. 아무도 그에게 말을 걸지 않는다.');
    await g.say('라즈', '…아, 안녕하세요.');
    await g.say('라즈', '저 여기 사는 사람 아니에요. 공장 끝나고 버스 타고 가다가, 기사님이 다 내리라고 해서.');
    await g.say('라즈', '라즈예요. 네팔에서 왔어요. 시화공단.');
  }
  if (!f.razShared) {
    const foods = state.inv.filter((e) => ITEMS[e.id].kind === '식량' && !['rice', 'stew', 'chocopie'].includes(e.id));
    const opts = foods.map((e) => `${ITEMS[e.id].name}을(를) 나눈다`);
    opts.push(foods.length ? '아무것도 주지 않는다' : '(줄 수 있는 먹을 게 없다)');
    const c = await g.choose('라즈는 오늘 아무것도 먹지 못한 것 같다.', opts);
    if (c < foods.length) {
      const id = foods[c].id;
      removeItem(id);
      f.razShared = true;
      f.razSharedDay = state.day;
      kindness(`라즈에게 ${ITEMS[id].name}을(를) 나눴다`, 2);
      await g.say('라즈', '고맙습니다. 형, 이거… 저 내일 갚아요. 진짜로.');
    } else {
      await g.say('라즈', '괜찮아요. 저 원래 많이 안 먹어요.');
      await g.narr('그의 배에서 작게 소리가 났다. 둘 다 못 들은 척했다.');
    }
    return;
  }
  if (state.day > f.razSharedDay && !f.razPaid) {
    f.razPaid = true;
    await g.say('라즈', '형! 형, 이거요.');
    await g.narr('라즈가 작업복 주머니에서 초코파이 두 개를 꺼냈다. 조금 찌그러져 있다.');
    await g.say('라즈', '공장에서 간식으로 받은 거예요. 어제 거 갚는 거예요. 진짜로 갚는다고 했잖아요.');
    if (canFit('chocopie')) { addItem('chocopie'); g.ui.toast('초코파이 두 개를 받았다.'); }
    else { await g.narr('가방에 자리가 없어서, 둘은 그 자리에서 하나씩 나눠 먹었다.'); addStat('hunger', 6); }
    await g.say('라즈', '형 이름 뭐예요? 어제 안 물어봤어요.');
    await g.say('강도일', '도일. 강도일.');
    await g.say('라즈', '도일 형. 좋아요.');
    addStat('mental', 6);
    return;
  }
  const lines = [
    '여기 사람들, 저 보면 좀… 괜찮아요. 이해해요.',
    '네팔에 동생 있어요. 열여섯 살. 전화가 안 돼요. 여기도, 거기도.',
    '도일 형 동생은 어디 있어요? …서울? 그럼 가까워요. 저보다는.',
  ];
  await g.say('라즈', lines[talkCount('raz') % lines.length]);
}

async function momTalk(g) {
  const f = F();
  if (f.babyWarm) { await g.say('아기 엄마', '덕분에 잘 자요. 이 작은 게 따뜻한 걸 알아요.'); return; }
  if (!f.babyAsked) {
    f.babyAsked = true;
    await g.say('아기 엄마', '쉿… 이제 막 잠들었어요.');
    await g.say('아기 엄마', '…혹시 핫팩이나 담요 같은 거 있으세요? 바닥이 너무 차가워서요. 아무것도 못 챙겼어요.');
  }
  const opts = [];
  const ids = [];
  if (has('handwarmer')) { opts.push('핫팩을 건넨다'); ids.push('handwarmer'); }
  if (has('blanket')) { opts.push('담요를 건넨다'); ids.push('blanket'); }
  if (!opts.length) { await g.narr('줄 수 있는 게 없다. 아기 엄마는 아기를 자기 패딩 안으로 더 깊이 넣었다.'); return; }
  opts.push('미안하다고 말한다');
  const c = await g.choose('아기 엄마가 도일을 올려다본다.', opts);
  if (c < ids.length) {
    removeItem(ids[c]);
    f.babyWarm = true;
    kindness(`아기 엄마에게 ${ITEMS[ids[c]].name}을(를) 건넸다`, 2);
    await g.say('아기 엄마', '…고맙습니다. 정말요.');
    await g.narr('잠든 아기가 엄마의 손가락을 꼭 쥐었다.');
    addStat('mental', 4);
  } else {
    await g.say('아기 엄마', '아니에요. 다들 그렇죠, 뭐.');
  }
}

async function radioUse(g) {
  if (state.day === 0) {
    await g.say('라디오', '…현재 수도권 전역에 공습경보가 발령 중입니다. 경기 북부 지역에서 대규모 폭발이 관측되었다는 보고가 들어오고 있습니다. 시민 여러분은 지하 대피시설에서…', { mode: 'radio' });
    await g.say('라디오 아저씨', '배터리 아껴야 돼서 뉴스만 틀어. 노래는 나중에.');
  } else {
    await g.say('라디오', '…최소 이틀간 실내에 머물러 주십시오. 수돗물은 당분간 끓여서 드시고, 외부에 노출된 음식은 드시지 마십시오. 반복합니다…', { mode: 'radio' });
    await g.say('라디오 아저씨', '서울 얘기는 하나도 안 해. 그게 더 무서워.');
  }
}

async function sleepUse(g) {
  const f = F();
  if (!f.registered) { await g.narr('먼저 동대표에게 이름을 적자. 저 사람이 자리를 정하고 있다.'); return; }
  if (state.day === 0) {
    const c = await g.choose('047번 칸. 차가운 바닥에 누군가 돗자리를 깔아 두었다. 잘까?', ['눕는다', '아직 아니다']);
    if (c) return;
    await sleepD0(g);
  } else {
    const q = f.homeVisited ? '하루가 끝났다. 잘까?' : '아직 집에 다녀오지 않았다. 그래도 잘까?';
    const c = await g.choose(q, ['눕는다', '아직 아니다']);
    if (c) return;
    await sleepD1(g);
  }
}

async function sleepD0(g) {
  await g.ui.fade(1, 1500);
  g.sfx.murmur(false);
  g.lightMode = null;
  await g.ui.card(['잠들지 못했다.', '누군가 밤새 라디오 주파수를 돌렸다.', '지지직거리는 소리 사이로, 가끔 사람 목소리가 지나갔다.'], { gap: 1400 });
  passTime((24 * 60 + 7 * 60 + 10) - state.min, 0.45);
  setClock(1, 7, 10);
  addStat('mental', 4 + (has('blanket') ? 6 : 0));
  state.usedToday = {};
  saveGame('d1');
  await g.goto('b2', { tx: 29, ty: 10, dir: 90 }, { noFadeOut: true });
}

async function d1Morning(g) {
  const f = F();
  f.d1Morning = true;
  g.ui.toast('저장됨 · 마지막으로 잠든 날', 3000);
  await g.ui.centerText('D+1', 1600, true);
  await g.say('라디오', '…정부 발표를 다시 전해 드립니다. 어제 새벽 4시 17분경, 북한이 발사한 탄도미사일이 경기 북부와 강원도 사이 산간 지역 상공에서 폭발했습니다. 핵폭발로 확인되었습니다.', { mode: 'radio' });
  await g.say('라디오', '서울 등 수도권 대도시의 직접 피해는 아직 확인되지 않았습니다. 다만 발전 시설과 송전망이 광범위하게 손상되어, 전력 복구에는 상당한 시간이 걸릴 것으로 보입니다.', { mode: 'radio' });
  await g.say('라디오', '낙진의 위험이 가장 큰 것은 처음 48시간입니다. 수도권 서부 주민께서는 최소 이틀간 실내에 머물러 주십시오.', { mode: 'radio' });
  await g.narr('지하 2층이 잠깐 조용해졌다. 그리고 어디선가 누군가 울기 시작했다.');
  addStat('mental', -6);
  await g.say('동대표 최정민', '들으셨죠. 이틀은 밖에 못 나갑니다. 대신 지하로 연결된 동은 다녀오셔도 돼요.');
  await g.say('동대표 최정민', '집에서 물이랑 이불, 먹을 거 가져오세요. 엘리베이터 없습니다. 계단이에요.');
  g.objective('303동 계단으로 집(1104호)에 다녀오기');
}

async function d1Evening(g) {
  const f = F();
  f.d1Evening = true;
  if (state.min < 19 * 60) { passTime(19 * 60 - state.min, 0.8); setClock(1, 19, 0); }
  await g.narr('지하에서는 시간이 흐르지 않는 것 같았다. 휴대폰 시계만이 저녁이라고 했다.');
  g.objective('047번 칸에서 잠들기');
}

async function sleepD1(g) {
  await g.ui.fade(1, 1600);
  g.sfx.murmur(false);
  g.lightMode = null;
  passTime(Math.max(0, 23 * 60 - state.min), 0.5);
  addStat('mental', 3 + (has('blanket') ? 6 : 0));
  await g.goto('dream', { tx: 2, ty: 3, dir: 0 }, { noFadeOut: true });
}

const b2 = {
  map: 'b2',
  timeRate: 1,
  tint: [4, 5, 8],
  setup(s) {
    const f = F();
    s.ambient = 0.95;
    s.labels = [
      { text: 'B2', x: 2, y: 1.5, size: 16, color: 'rgba(227,179,65,.85)' },
      { text: '303동 계단실 ←', x: 2.8, y: 6.35, size: 8, color: 'rgba(255,255,255,.6)' },
      { text: '047', x: 30.4, y: 11.5, size: 9, color: 'rgba(255,255,255,.7)' },
      { text: '지상 출입 금지', x: 30, y: 2.4, size: 8, color: 'rgba(255,120,90,.8)' },
    ];
    s.lights = [
      { x: C(0) + 14, y: C(7) - 20, r: 70, i: 0.55, color: '#3ddc84', glow: 0.22 }, // 비상구 표시등
      { x: C(30), y: C(1) + 10, r: 70, i: 0.5, color: '#3ddc84', glow: 0.2 },
      { x: C(13), y: C(9), r: 95, i: 0.75, color: '#ffd38a', glow: 0.18 }, // 라디오 차 실내등
    ];
    s.entities.push(
      npc({
        id: 'choi', name: '동대표 최정민', tx: 16, ty: 7, color: '#2f4f7f',
        light: { r: 200, i: 0.86, color: '#ffcf7a', flicker: 0.04, glow: 0.14 },
        onUse: choiTalk,
        mark: () => !F().registered || (state.day === 1 && F().oldmanAsked && !F().oldmanTold),
      }),
      npc({
        id: 'raz', name: '라즈', tx: 32, ty: 12, sit: true, color: '#5d6a7a', skin: '#a77a56',
        onUse: razTalk,
        mark: () => F().razShared && state.day > F().razSharedDay && !F().razPaid,
      }),
      npc({ id: 'mom', name: '아기 엄마', tx: 6, ty: 3, sit: true, color: '#8a4f62', light: { r: 70, i: 0.6, color: '#9cc3ff' }, onUse: momTalk }),
      thing({ id: 'radio', tx: 13, ty: 9, label: '라디오가 켜진 차', onUse: radioUse }),
      thing({ id: 'mat', tx: 29, ty: 11, th: 2, label: '047번 칸 (잠자리)', verb: '눕기', onUse: sleepUse }),
      thing({
        id: 'stairDoor', tx: 0, ty: 7, label: '303동 계단실 철문',
        onUse: async (g) => {
          if (state.day === 0) { await g.narr('303동 계단실로 이어지는 철문. 오늘 밤은 너무 늦었다.'); return; }
          await g.goto('stair', { tx: 2, ty: stairLandingY(STAIR_FLOORS.length - 1), dir: 0 });
        },
      }),
      thing({
        id: 'rampUp', tx: 29, ty: 1, tw: 3, label: '지상으로 가는 경사로',
        onUse: async (g) => {
          await g.narr(state.day === 0 ? '경사로 위에서 차 경보음이 아직도 울린다.' : '경사로 입구를 누군가 박스와 테이프로 막아 두었다. “외출 금지 — 낙진”');
        },
      }),
    );
    EXTRAS.forEach((x, i) => {
      s.entities.push(npc({
        id: `x${i}`, name: x.name, tx: x.tx, ty: x.ty, sit: true, color: x.color, hair: x.hair, small: x.small,
        light: i % 2 === 0 ? { r: 46, i: 0.55, color: '#9cc3ff', glow: 0.12 } : null,
        barks: x.lines,
        onUse: async (g) => { await g.say(x.name, x.lines[talkCount(`x${i}`) % x.lines.length]); },
      }));
    });
    if (f.d1Morning) s.ambient = 0.94;
  },
  async onEnter(g) {
    const f = F();
    g.sfx.murmur(true);
    if (!f.b2Arrived) {
      f.b2Arrived = true;
      f.canText = true;
      setClock(0, 4, 34);
      await wait(500);
      await g.say('동대표 최정민', '동별로 모여 앉아 주세요! 301동은 첫 번째 기둥, 303동은 두 번째 기둥 쪽!');
      await g.say('동대표 최정민', '엘리베이터는 멈췄습니다. 계단으로만 다니세요! 다치신 분 계시면 손 들어 주세요!');
      g.objective('동대표 최정민에게 이름 적기');
    } else if (state.day === 1 && !f.d1Morning) {
      await d1Morning(g);
    } else if (f.homeVisited && !f.d1Evening) {
      await d1Evening(g);
    }
  },
};

// ═════════════════════════ 303동 계단실 ═════════════════════════

const DOOR_TEXT = {
  '10F': '10층. 문 너머에서 개가 짖는다. 아무도 대답하지 않는다.',
  '9F': '9층. 복도 끝 집 현관에 아이 장화가 나란히 놓여 있다.',
  '8F': '8층. 누군가 방화문에 매직으로 적어 놓았다. “803호 지하에 있음”',
  '6F': '6층. 고요하다.',
  '5F': '5층. 문틈으로 찬바람이 새어 나온다. 어느 집 창문이 깨진 모양이다.',
  '4F': '4층. 고요하다.',
  '3F': '3층. 문 너머에서 라디오 소리가 작게 들린다.',
  '2F': '2층. 고요하다.',
  '1F': '1층 로비. 유리문 너머로 회색빛 아침이 보인다. 나가면 안 된다.',
  'B1': '지하 1층. 기계실 냄새.',
};

async function oldmanScene(g) {
  const f = F();
  f.oldmanMet = true;
  await g.narr('7층 방화문이 반쯤 열려 있다. 안쪽 복도에서 누군가 부른다.');
  await g.say('7층 할아버지', '거기 누구요? 관리실이요?');
  await g.say('강도일', '아뇨, 11층 사람이에요. 집에 물건 가지러 가요.');
  await g.say('7층 할아버지', '우리 집사람이 무릎이 안 좋아서 계단을 못 내려가. 나 혼자 내려갈 수도 없고.');
  await g.say('7층 할아버지', '…혹시 밑에 내려가면, 대표한테 704호에 물 좀 남는 거 있나 물어봐 줘요. 부탁해요.');
  const water = ['water500', 'water2l'].find((id) => has(id));
  const opts = ['내려가서 전해 드릴게요.'];
  if (water) opts.push(`${ITEMS[water].name}을(를) 드린다`);
  opts.push('…지금은 어렵습니다.');
  const c = await g.choose('', opts);
  const pick = opts[c];
  if (pick.startsWith('내려가서')) {
    f.oldmanAsked = true;
    note('704호 노부부 — 물이 필요하다. 동대표에게 전하기');
    await g.say('7층 할아버지', '고마워요. 젊은 사람.');
  } else if (water && pick.includes(ITEMS[water].name)) {
    removeItem(water);
    f.oldmanAsked = true;
    kindness(`7층 노부부에게 ${ITEMS[water].name}을(를) 드렸다`, 2);
    note('704호 노부부 — 동대표에게 사정 전하기');
    await g.say('7층 할아버지', '…이걸 그냥 줘요? 아이고. 아이고, 고마워요.');
    await g.narr('문틈으로 주름진 손이 나와 물병을 받아 갔다. 손이 오래 떨렸다.');
  } else {
    await g.say('7층 할아버지', '그래요. 다들 그렇지 뭐.');
    await g.narr('방화문이 천천히 닫혔다.');
  }
}

const stair = {
  map: 'stair',
  timeRate: 1,
  tint: [3, 4, 6],
  visionR: 96,
  setup(s) {
    s.ambient = 0.965;
    s.labels = STAIR_FLOORS.map((fl, i) => ({ text: fl, x: 1.55, y: stairLandingY(i) + 0.05, size: 10, color: 'rgba(227,179,65,.75)', align: 'left' }));
    s.lights = [];
    [12, 9, 6, 2].forEach((i) => s.lights.push({ x: C(5), y: C(stairLandingY(i)) - 10, r: 58, i: 0.5, color: '#3ddc84', glow: 0.2 }));
    STAIR_FLOORS.forEach((fl, i) => {
      const y = stairLandingY(i);
      let onUse;
      if (i === 0) onUse = async (g) => { await g.goto('home', { tx: 4, ty: 9, dir: -90 }); };
      else if (i === STAIR_FLOORS.length - 1) onUse = async (g) => { await g.goto('b2', { tx: 1, ty: 8, dir: 0 }); };
      else if (fl === '7F') onUse = async (g) => { if (!F().oldmanMet && state.day === 1) await oldmanScene(g); else await g.narr('7층. 704호 쪽에서 작은 기침 소리가 난다.'); };
      else onUse = async (g) => { await g.narr(DOOR_TEXT[fl] || `${fl}. 고요하다.`); };
      s.entities.push(thing({
        id: `door${i}`, tx: 0, ty: y, label: i === 0 ? '11층 · 집으로' : i === STAIR_FLOORS.length - 1 ? 'B2 · 대피소로' : `${fl} 방화문`,
        onUse,
      }));
    });
    s.triggers.push({ x: 1, y: stairLandingY(4), w: 5, h: 1, when: () => !F().oldmanMet && state.day === 1, run: oldmanScene });
  },
  async onEnter(g) {
    const f = F();
    g.sfx.murmur(false);
    g.stairLevel = Math.round((g.player.y / TILE - 1) / 4);
    if (!f.stairIntro) {
      f.stairIntro = true;
      await g.narr('계단실은 완전히 캄캄했다. 그래도 눈이 금방 익었다. 5년 동안 밤에만 산 눈이다.');
      if (!g.lightMode) g.ui.toast('F: 손전등 · 손전등이 없으면 휴대폰 불빛', 3800);
    }
  },
  update(g) {
    const lv = Math.round((g.player.y / TILE - 1) / 4);
    if (lv !== g.stairLevel) {
      if (lv < g.stairLevel) { addStat('thirst', -0.9); addStat('hunger', -0.4); }
      g.stairLevel = lv;
      const fl = STAIR_FLOORS[Math.max(0, Math.min(STAIR_FLOORS.length - 1, lv))];
      g.objective(F().homeVisited ? `대피소(B2)로 내려가기 · 지금 ${fl}` : `11층 집으로 올라가기 · 지금 ${fl}`, true);
    }
  },
};

// ═════════════════════════ 1104호 (집) ═════════════════════════

const home = {
  map: 'home',
  timeRate: 1,
  tint: [24, 28, 36],
  setup(s) {
    s.ambient = 0.6;
    s.lights = [13, 14, 15, 16].map((x) => ({ x: C(x), y: C(1) + 8, r: 165, i: 0.8, color: '#dfe6ee', glow: 0.06 }));
    s.lights.push({ x: C(3), y: C(1), r: 110, i: 0.55, color: '#dfe6ee', glow: 0.04 }, { x: C(9), y: C(1), r: 110, i: 0.55, color: '#dfe6ee', glow: 0.04 });
    s.entities.push(
      thing({
        id: 'desk', tx: 5, ty: 1, label: '도준의 책상',
        onUse: async (g) => {
          if (!F().deskSeen) {
            F().deskSeen = true;
            await g.narr('책상 위가 입대하던 날 그대로다. 다 쓴 볼펜, 충전기, 사진 한 장, 이어폰.');
          }
          g.ui.openShelf('home_desk', '도준의 책상', null);
        },
      }),
      thing({ id: 'jbed', tx: 1, ty: 1, label: '도준의 침대', onUse: async (g) => { await g.narr('이불이 반듯하게 개어져 있다. 입대하던 날 아침, 도준이 갰다.'); await g.narr('도일은 그 뒤로 이 방 문을 거의 열지 않았다.'); } }),
      thing({ id: 'closet', tx: 7, ty: 1, label: '옷장', onUse: async (g) => g.ui.openShelf('home_closet', '옷장', null) }),
      thing({ id: 'dbed', tx: 11, ty: 1, label: '도일의 침대 · 서랍', onUse: async (g) => { if (!F().drawerSeen) { F().drawerSeen = true; await g.narr('낮에 자고 밤에 일하는 사람의 이불은 늘 흐트러져 있다. 침대 옆 서랍에 접힌 편지가 있다.'); } g.ui.openShelf('home_drawer', '침대 옆 서랍', null); } }),
      thing({
        id: 'window', tx: 13, ty: 1, tw: 4, label: '베란다 창',
        onUse: async (g) => {
          const f = F();
          if (!f.viewed) {
            f.viewed = true;
            await g.narr('베란다 너머로 바다가 보인다. 바다 건너 송도의 빌딩들은 불이 모두 꺼져 있다.');
            await g.narr('고개를 돌려 동북쪽을 봤다. 버섯구름은 이미 흩어졌다. 대신 하늘 한쪽이 멍처럼 누렇게 번져 있다.');
            await g.narr('그 방향에 서울이 있다. 도준이 있다.');
            addStat('mental', -4);
          } else await g.narr('하늘 한쪽의 멍은 그대로다.');
        },
      }),
      thing({
        id: 'fridge', tx: 1, ty: 6, label: '냉장고',
        onUse: async (g) => {
          const f = F();
          if (!f.fridgeNote) {
            f.fridgeNote = true;
            await g.narr('냉장고 문에 노란 포스트잇이 붙어 있다. 넉 달 된 글씨.');
            await g.say('도준의 쪽지', '형 김치찌개 냉동실에 소분해놨어. 데워먹어. 라면만 먹지 말고.', { mode: 'narr' });
            await g.narr('냉동실이 녹고 있다. 오늘 안에 먹어야 한다.');
            note('냉장고 쪽지 — “라면만 먹지 말고.” 도준');
          }
          g.ui.openShelf('home_fridge', '냉장고', null);
        },
      }),
      thing({ id: 'kitchen', tx: 1, ty: 7, th: 3, label: '주방 찬장', onUse: async (g) => g.ui.openShelf('home_kitchen', '주방 찬장', null) }),
      thing({ id: 'sofa', tx: 16, ty: 5, th: 4, label: '소파', onUse: async (g) => { await g.narr('소파 위에 도준이 두고 간 후드티가 걸려 있다. 도일은 그걸 치우지 않았다.'); } }),
      thing({
        id: 'front', tx: 4, ty: 10, tw: 2, label: '현관문',
        onUse: async (g) => {
          const c = await g.choose('대피소로 돌아갈까?', ['돌아간다', '조금 더 챙긴다']);
          if (c) return;
          g.objective('대피소(B2)로 내려가기');
          await g.goto('stair', { tx: 2, ty: stairLandingY(0), dir: 90 });
        },
      }),
    );
  },
  async onEnter(g) {
    const f = F();
    if (!f.homeVisited) {
      f.homeVisited = true;
      await g.narr('11층. 숨이 찼다. 현관문을 여는 손이 떨렸다. …아니, 그냥 추워서였다.');
      g.objective('집에서 필요한 것 챙기기 (물·이불·먹을 것)');
    }
  },
};

// ═════════════════════════ 꿈 #1 ═════════════════════════

async function boyTalk(g) {
  const f = F();
  if (f.dreamDone) return;
  f.dreamDone = true;
  await g.narr('장례식장 복도. 열세 살 도준이 검은 양복 소매를 만지작거리고 있다. 소매가 손등을 다 덮는다. 빌린 옷이다.');
  await g.say('도준', '형.');
  await g.say('도준', '우리 이제 어떡해?');
  await g.choose('', ['형이 있잖아.']);
  await g.say('강도일', '형이 있잖아.');
  await wait(400);
  await g.ui.fade(1, 2200);
  g.sfx.dream(false);
  await g.ui.card([
    '도일은 그 말을 8년째 지키고 있다.',
    '그 말이 그를 여기까지 데려왔고,',
    '그 말이 그를 여기에 묶어 두었다.',
  ], { gap: 1800 });
  await endSummary(g);
}

const dream = {
  map: 'dream',
  timeRate: 0,
  tint: [238, 235, 228],
  visionR: 120,
  setup(s) {
    s.ambient = 0.8;
    s.entities.push(npc({ id: 'boy', name: '도준 (13세)', tx: 19, ty: 3, color: '#151517', small: true, face: Math.PI, onUse: boyTalk }));
    s.triggers.push({ x: 16, y: 1, w: 5, h: 5, run: boyTalk });
  },
  async onEnter(g) {
    g.ui.showHUD(false);
    g.sfx.dream(true);
    await g.narr('국화 냄새.');
  },
};

// ═════════════════════════ 결산 / 시작 / 쓰러짐 ═════════════════════════

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function endSummary(g) {
  g.ui.showHUD(false);
  g.showTouch(false);
  const mins = Math.max(1, Math.round(state.playSec / 60));
  const taken = state.taken.length ? `<ul>${state.taken.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p>아무것도 챙기지 못했다.</p>';
  const kind = state.kindness.length ? `<ul>${state.kindness.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p>아무에게도 아무것도 건네지 않았다. 그럴 수 있다. 아직은.</p>';
  const unsent = state.unsent.length ? `<ul>${state.unsent.map((u) => `<li>“${esc(u.text)}” <span style="color:var(--danger);font-size:12px">— 전송 실패</span></li>`).join('')}</ul>` : '<p>도준에게는 아무 말도 쓰지 않았다.</p>';
  const c = g.ui.htmlCard(`<div class="summary">
    <div class="k">1장 「배곧」 · 1차 테스트</div>
    <h2>여기까지입니다</h2>
    <div class="sec"><h3>편의점에서 챙긴 것</h3>${taken}</div>
    <div class="sec"><h3>도일이 건넨 것</h3>${kind}</div>
    <div class="sec"><h3>보내지 못한 문자함</h3>${unsent}</div>
    <div class="sec"><h3>플레이 시간</h3><p>약 ${mins}분</p></div>
    <div class="next">D+3. 단지 밖으로 처음 나가는 날.<br>경비실 책상 위에 박 씨의 근무일지가 펼쳐져 있다. 마지막 줄은 04:31.<br>「올라가 봐야 함.」</div>
    <div class="btns"><button class="btn primary" id="btn-restart">처음부터 다시</button></div>
  </div>`);
  c.querySelector('#btn-restart').onclick = () => { g.ui.hideCard(); startNewGame(g); };
}

export async function startNewGame(g) {
  resetState();
  document.body.classList.add('shift');
  document.title = '오늘25 야간 근무';
  g.cust = null;
  g.lightMode = null;
  g.stopTimer();
  g.sfx.stopAll();
  g.dying = false;
  g.ui.showHUD(false);
  g.showTouch(true);
  await g.ui.fade(1, 10);
  await g.goto('store', { tx: 12, ty: 8, dir: 180 }, { noFadeOut: true, noFadeIn: true });
}

export async function continueGame(g) {
  if (!loadGame()) return startNewGame(g);
  document.body.classList.remove('shift');
  document.title = '서울 끝';
  g.lightMode = null;
  g.dying = false;
  g.sfx.stopAll();
  g.ui.showHUD(true);
  g.showTouch(true);
  await g.goto('b2', { tx: 29, ty: 10, dir: 90 }, { noFadeOut: true });
}

export async function dieScript(g) {
  g.lightMode = null;
  g.stopTimer();
  g.sfx.stopAll(0.5);
  await g.ui.fade(1, 1500);
  await g.ui.card(['도일이 쓰러졌다.', '목이 너무 말랐고, 너무 배가 고팠다.', { text: '마지막으로 잠든 날로 돌아갑니다.', cls: 'kicker' }], { gap: 1300 });
  g.dying = false;
  if (loadGame()) await continueGame(g);
  else await startNewGame(g);
}

export async function letterScript(g) {
  const lines = [
    '형. 여기 밥은 생각보다 괜찮아. 형이 끓인 라면보다는 별로지만.',
    '조교가 무섭다. 근데 형네 사장님보다는 덜 무서움.',
    '나 없다고 라면만 먹지 마. 진짜로.',
    '그리고 그날 말한 거. 그거 진심 아니었어.',
    '…반은 진심이었고.',
    '휴가 나가면 얘기하자. — 도준',
  ];
  for (const l of lines) await g.say('도준의 편지', l, { mode: 'narr' });
  if (!F().letterRead) { F().letterRead = true; await g.narr('도일은 편지를 다시 접었다. 처음 받았을 때는 끝까지 읽지 못했었다.'); }
}

export const SCENES = { store, street, b2, stair, home, dream };
