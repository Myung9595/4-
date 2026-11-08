// 게임 상태와 저장/불러오기, 인벤토리·시간 계산
import { ITEMS, CONTAINERS } from './items.js';
import { clamp } from './engine.js';

const SAVE_KEY = 'seoul-end.save.v1';

function freshState() {
  return {
    day: 0,
    min: 3 * 60 + 50, // D+0 03:50
    stats: { hunger: 70, thirst: 64, hp: 100, mental: 60, rad: 0 },
    inv: [], // { id, qty }
    charges: {}, // 개봉한 아이템의 남은 사용 횟수
    usedToday: {},
    bagSlots: 10,
    containers: JSON.parse(JSON.stringify(CONTAINERS)),
    flags: {},
    warmth: 0, // 숨겨진 수치: 온기
    kindness: [], // 결산 화면용 기록
    taken: [], // 골든타임에 챙긴 것
    battery: 64,
    flashPower: 0,
    alerts: [],
    chat: [],
    notes: [],
    unsent: [],
    objective: '',
    checkpoint: null,
    playSec: 0,
  };
}

export const state = freshState();

export function resetState() {
  const n = freshState();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, n);
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

export function saveGame(checkpoint) {
  state.checkpoint = checkpoint;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    resetState();
    Object.assign(state, data);
    return true;
  } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ }
}

// ── 인벤토리 ──
export function bagUsed() {
  return state.inv.reduce((s, e) => s + ITEMS[e.id].size * e.qty, 0);
}
export function canFit(id, n = 1) {
  return bagUsed() + ITEMS[id].size * n <= state.bagSlots;
}
export function count(id) {
  const e = state.inv.find((x) => x.id === id);
  return e ? e.qty : 0;
}
export const has = (id) => count(id) > 0;
export function addItem(id, n = 1) {
  const e = state.inv.find((x) => x.id === id);
  if (e) e.qty += n; else state.inv.push({ id, qty: n });
}
export function removeItem(id, n = 1) {
  const e = state.inv.find((x) => x.id === id);
  if (!e) return;
  e.qty -= n;
  if (e.qty <= 0) {
    state.inv = state.inv.filter((x) => x !== e);
    delete state.charges[id];
  }
}

// ── 시간 ──
export function clockText() {
  const m = Math.floor(state.min) % (24 * 60);
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `D+${state.day}  ${hh}:${mm}`;
}

// 시간 경과에 따른 게이지 감소. rate < 1 이면 잠자는 동안처럼 천천히 줄어든다
export function passTime(minutes, rate = 1) {
  state.min += minutes;
  while (state.min >= 24 * 60) { state.min -= 24 * 60; state.day += 1; state.usedToday = {}; }
  const s = state.stats;
  s.hunger = clamp(s.hunger - 0.022 * minutes * rate, 0, 100);
  s.thirst = clamp(s.thirst - 0.032 * minutes * rate, 0, 100);
  if (s.hunger <= 0) s.hp -= 0.05 * minutes;
  if (s.thirst <= 0) s.hp -= 0.09 * minutes;
  if (s.hunger > 35 && s.thirst > 35) s.hp += 0.03 * minutes;
  s.hp = clamp(s.hp, 0, 100);
}

export function setClock(day, hh, mm) {
  state.day = day;
  state.min = hh * 60 + mm;
}

export function addStat(key, v) {
  const max = 100;
  state.stats[key] = clamp(state.stats[key] + v, 0, max);
}
