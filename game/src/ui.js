// DOM 기반 UI: HUD, 대화, 선택지, 가방·선반·휴대폰, 연출 레이어
import { ITEMS, iconOf, POS_GOODS } from './items.js';
import { itemSrc, newsSrc } from './assets.js';
import { state, bagUsed, clockText, canFit, addItem, removeItem, count } from './state.js';
import { wait } from './engine.js';

const $ = (s) => document.querySelector(s);
export const icoHTML = (id, cls = '') => {
  const src = itemSrc(iconOf(id));
  const nm = (ITEMS[id] && ITEMS[id].name) || id;
  return src ? `<img class="ico ${cls}" src="${src}" alt="">` : `<span class="ico ph ${cls}" aria-hidden="true">${nm.slice(0, 1)}</span>`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor(game) {
    this.g = game;
    this.dlg = $('#dialog');
    this.dlgName = this.dlg.querySelector('.dlg-name');
    this.dlgText = this.dlg.querySelector('.dlg-text');
    this.dlgChoices = this.dlg.querySelector('.dlg-choices');
    this.dlgMore = this.dlg.querySelector('.dlg-more');
    this.modal = $('#modal');
    this.popup = $('#popup');
    this.typing = false;
    this.dlgResolve = null;
    this.choiceResolve = null;
    this.choiceIdx = 0;
    this.modalKind = null;
    this.phoneTab = 'msg';
    this.popupResolve = null;
    this.cardResolve = null;
    this.dlg.addEventListener('click', () => this.advance());
    this.popup.addEventListener('click', () => this.closePopup());
    $('#card').addEventListener('click', () => this.cardClick && this.cardClick());
    this.buildStats();
  }

  get dialogOpen() { return !this.dlg.hidden; }
  get modalOpen() { return !this.modal.hidden; }
  // 전화 화면은 키 입력을 막지 않는다 (재난문자 팝업만 막는다)
  get popupOpen() { return !this.popup.hidden && !!this.popupResolve; }
  get cardOpen() { return !$('#card').hidden; }
  get blocking() { return this.dialogOpen || this.modalOpen || this.popupOpen || this.cardOpen || this.itemOpen || this.newsOpen; }

  // ── 키 입력 라우팅. true를 돌려주면 게임이 키를 쓰지 않는다 ──
  handleKey(k) {
    if (this.newsOpen) { if (['Enter', ' ', 'e'].includes(k) && this.newsSkip) this.newsSkip(); return true; }
    if (this.itemOpen) { if (['Enter', ' ', 'e', 'Escape'].includes(k) && this.itemClose) this.itemClose(); return true; }
    if (this.cardOpen) { if (['Enter', ' ', 'e'].includes(k) && this.cardClick) this.cardClick(); return true; }
    if (this.popupOpen) { if (['Enter', ' ', 'e', 'Escape'].includes(k)) this.closePopup(); return true; }
    if (this.dialogOpen) {
      if (this.choiceResolve) {
        const btns = [...this.dlgChoices.children];
        if (k === 'ArrowUp' || k === 'w') { this.choiceIdx = (this.choiceIdx + btns.length - 1) % btns.length; this.markChoice(); }
        else if (k === 'ArrowDown' || k === 's') { this.choiceIdx = (this.choiceIdx + 1) % btns.length; this.markChoice(); }
        else if (/^[1-9]$/.test(k) && btns[+k - 1]) btns[+k - 1].click();
        else if (['Enter', ' ', 'e'].includes(k)) btns[this.choiceIdx] && btns[this.choiceIdx].click();
        return true;
      }
      if (['Enter', ' ', 'e'].includes(k)) this.advance();
      return true;
    }
    if (this.modalOpen) {
      if (this.modalKind === 'mg') return k !== 'Enter' && k !== 'Tab';
      if (k === 'Escape' || (k === 'p' && this.modalKind === 'phone') || ((k === 'i' || k === 'b') && this.modalKind === 'bag') || (k === 'e' && this.modalKind === 'shelf')) { this.closeModal(); return true; }
      return k !== 'Tab' && k !== 'Enter';
    }
    return false;
  }

  // ── HUD ──
  showHUD(on) { $('#hud').hidden = !on; }

  buildStats() {
    const defs = [['hunger', '허기'], ['thirst', '갈증'], ['hp', '체력'], ['mental', '멘탈'], ['rad', '피폭']];
    $('#stats').innerHTML = defs.map(([k, n]) => `<span>${n}</span><div class="bar ${k === 'rad' ? 'rad' : ''}" id="bar-${k}"><i></i></div>`).join('');
  }

  updateHUD() {
    $('#clock').textContent = document.body.classList.contains('shift') ? clockText().replace(/^D\+\d+\s+/, '') + '  ·  퇴근 08:00' : clockText();
    $('#objective').textContent = state.objective || '';
    for (const k of ['hunger', 'thirst', 'hp', 'mental', 'rad']) {
      const el = document.getElementById(`bar-${k}`);
      if (!el) continue;
      const v = state.stats[k];
      el.firstChild.style.width = `${v}%`;
      el.classList.toggle('low', k !== 'rad' && v < 25);
    }
    const b = $('#battery');
    b.textContent = `휴대폰 ${Math.ceil(state.battery)}%`;
    b.classList.toggle('low', state.battery < 15);
    const li = $('#light-ind');
    const g = this.g;
    if (g.lightMode) {
      li.hidden = false;
      li.textContent = g.lightMode === 'flash' ? `손전등 ${Math.ceil(state.flashPower)}%` : '휴대폰 불빛';
    } else li.hidden = true;
    $('#vignette').classList.toggle('heavy', state.stats.mental < 25);
  }

  setPrompt(html) {
    const p = $('#prompt');
    if (!html) { p.hidden = true; return; }
    const key = document.body.classList.contains('touch') ? '행동' : 'E';
    p.innerHTML = `<kbd>${key}</kbd>${html}`;
    p.hidden = false;
  }

  toast(text, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 700); }, ms);
  }

  // ── 대화 ──
  say(name, text, { mode = '' } = {}) {
    return new Promise((resolve) => {
      this.dlg.hidden = false;
      this.dlg.className = mode;
      this.dlgName.textContent = name || '';
      this.dlgChoices.innerHTML = '';
      this.dlgMore.style.visibility = 'hidden';
      this.dlgText.textContent = '';
      this.full = text;
      this.typing = true;
      this.dlgResolve = resolve;
      let i = 0;
      const step = () => {
        if (!this.typing) return;
        i += 1;
        this.dlgText.textContent = this.full.slice(0, i);
        if (i % 2 === 0 && this.full[i - 1] !== ' ') this.g.sfx.blip();
        if (i >= this.full.length) { this.typing = false; this.dlgMore.style.visibility = 'visible'; return; }
        const ch = this.full[i - 1];
        this.typeTimer = setTimeout(step, '.…,?!'.includes(ch) ? 140 : 24);
      };
      step();
    });
  }

  advance() {
    if (this.choiceResolve) return;
    if (this.typing) {
      this.typing = false;
      clearTimeout(this.typeTimer);
      this.dlgText.textContent = this.full;
      this.dlgMore.style.visibility = 'visible';
      return;
    }
    if (this.dlgResolve) {
      const r = this.dlgResolve;
      this.dlgResolve = null;
      this.dlg.hidden = true;
      r();
    }
  }

  // options: 문자열 또는 { text, tag, disabled }
  choose(prompt, options, { name = '', mode = '' } = {}) {
    return new Promise((resolve) => {
      this.dlg.hidden = false;
      this.dlg.className = mode;
      this.dlgName.textContent = name;
      this.dlgText.textContent = prompt || '';
      this.dlgMore.style.visibility = 'hidden';
      this.typing = false;
      this.dlgChoices.innerHTML = '';
      this.choiceIdx = 0;
      options.forEach((o, i) => {
        const opt = typeof o === 'string' ? { text: o } : o;
        const b = document.createElement('button');
        b.className = 'choice';
        b.innerHTML = `<span class="num">${i + 1}</span>${esc(opt.text)}${opt.tag ? `<span class="tag">${esc(opt.tag)}</span>` : ''}`;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.g.sfx.ui();
          const r = this.choiceResolve;
          this.choiceResolve = null;
          this.dlg.hidden = true;
          this.dlgChoices.innerHTML = '';
          r(i);
        });
        this.dlgChoices.appendChild(b);
      });
      this.choiceResolve = resolve;
      this.markChoice();
    });
  }

  markChoice() {
    [...this.dlgChoices.children].forEach((b, i) => b.classList.toggle('sel', i === this.choiceIdx));
  }

  // ── 연출 ──
  async centerText(html, ms = 2600, big = false) {
    const el = $('#center-text');
    el.innerHTML = html;
    el.classList.toggle('big', big);
    el.style.opacity = 0;
    el.hidden = false;
    await wait(30);
    el.style.opacity = 1;
    await wait(ms);
    el.style.opacity = 0;
    await wait(800);
    el.hidden = true;
  }

  fade(to, ms = 900) {
    const f = $('#fade');
    f.style.transition = `opacity ${ms}ms`;
    f.style.opacity = to;
    return wait(ms);
  }

  flash(holdMs = 1200, fadeMs = 3500) {
    const f = $('#flash');
    f.style.transition = 'none';
    f.style.opacity = 1;
    setTimeout(() => { f.style.transition = `opacity ${fadeMs}ms ease-out`; f.style.opacity = 0; }, holdMs);
    return wait(holdMs + fadeMs * 0.5);
  }

  // 검은 화면에 문장을 한 줄씩. lines: 문자열 또는 { text, cls }
  card(lines, { gap = 1100, hint = '계속하려면 누르세요' } = {}) {
    return new Promise(async (resolve) => {
      const c = $('#card');
      c.innerHTML = '';
      c.hidden = false;
      const els = lines.map((l) => {
        const o = typeof l === 'string' ? { text: l } : l;
        const d = document.createElement('div');
        d.className = `line ${o.cls || ''}`;
        d.textContent = o.text;
        c.appendChild(d);
        return d;
      });
      const h = document.createElement('div');
      h.className = 'hint';
      h.textContent = hint;
      c.appendChild(h);
      let skip = false;
      this.cardClick = () => { skip = true; };
      for (const e of els) {
        e.classList.add('on');
        const t0 = Date.now();
        while (!skip && Date.now() - t0 < gap) await wait(50);
      }
      els.forEach((e) => e.classList.add('on'));
      h.classList.add('on');
      await wait(250);
      this.cardClick = () => { this.cardClick = null; c.hidden = true; resolve(); };
    });
  }

  // 임의의 HTML 카드 (결산 화면 등)
  htmlCard(html) {
    const c = $('#card');
    c.innerHTML = html;
    c.hidden = false;
    this.cardClick = null;
    return c;
  }

  hideCard() { $('#card').hidden = true; this.cardClick = null; }

  timer(sec) {
    const t = $('#timer');
    if (sec === null) { t.hidden = true; return; }
    t.hidden = false;
    const s = Math.max(0, Math.ceil(sec));
    t.innerHTML = `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}<small>골든타임</small>`;
    t.classList.toggle('urgent', s <= 15);
  }

  // ── 재난문자 팝업 / 전화 ──
  alertPopup(a) {
    return new Promise((resolve) => {
      this.popup.innerHTML = `<div class="alert-pop" role="alertdialog">
        <div class="ap-head"><span>${esc(a.title)}</span><span>${esc(a.time)}</span></div>
        <div class="ap-body">${esc(a.body)}</div>
        <div class="ap-mark">「서울 끝」 게임 속 가상 재난문자입니다 · 누르면 닫힘</div></div>`;
      this.popup.hidden = false;
      this.popupResolve = resolve;
    });
  }

  closePopup() {
    if (!this.popupResolve) return;
    const r = this.popupResolve;
    this.popupResolve = null;
    this.popup.hidden = true;
    r();
  }

  callScreen(name, status) {
    this.popup.innerHTML = `<div class="call-pop"><div class="who">${esc(name)}</div><div class="st">${esc(status)}</div>${status.includes('수신') ? '<div class="ring"></div>' : ''}</div>`;
    this.popup.hidden = false;
    this.popupResolve = null;
  }

  hideCall() { this.popup.hidden = true; }

  // ── 모달 ──
  closeModal() {
    if (!this.modalOpen) return;
    this.modal.hidden = true;
    this.modal.innerHTML = '';
    const k = this.modalKind;
    this.modalKind = null;
    if (this.onModalClose) { const f = this.onModalClose; this.onModalClose = null; f(k); }
  }

  capHTML() {
    const used = bagUsed();
    return `<span class="cap ${used >= state.bagSlots ? 'full' : ''}">가방 <b>${used}</b> / ${state.bagSlots}칸</span>`;
  }

  openBag() {
    this.modalKind = 'bag';
    this.modal.hidden = false;
    this.selItem = this.selItem && count(this.selItem) ? this.selItem : (state.inv[0] && state.inv[0].id);
    this.renderBag();
  }

  renderBag() {
    const items = state.inv.map((e) => {
      const it = ITEMS[e.id];
      const ch = state.charges[e.id] !== undefined ? ` · 개봉 ${state.charges[e.id]}/${it.charges}` : '';
      return `<div class="row ${this.selItem === e.id ? 'sel' : ''}" data-id="${e.id}" style="cursor:pointer">${icoHTML(e.id)}
        <div class="nm">${esc(it.name)} ×${e.qty}<small>${esc(it.kind)}${ch}</small></div><span class="sz">${it.size}칸</span></div>`;
    }).join('') || '<div class="empty">가방이 비어 있다.</div>';
    const sel = this.selItem && ITEMS[this.selItem];
    const usable = sel && (sel.use || ['flashlight', 'battery', 'powerbank', 'rice'].includes(sel.special));
    const detail = sel ? `${icoHTML(this.selItem, 'lg')}<div class="col-title">${esc(sel.name)}</div>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#d9d5cb">${esc(sel.desc)}</p>
      <div style="display:flex;gap:8px">
        ${usable ? '<button class="btn primary" data-act="use">사용</button>' : ''}
        <button class="btn" data-act="drop">버리기</button>
      </div>` : '<div class="empty">아이템을 고르면 설명이 보인다.</div>';
    this.modal.innerHTML = `<div class="panel" role="dialog" aria-label="가방">
      <div class="panel-head"><h2>가방</h2>${this.capHTML()}<button class="panel-close">닫기</button></div>
      <div class="panel-body"><div class="cols"><div>${items}</div><div>${detail}</div></div></div></div>`;
    this.modal.querySelector('.panel-close').onclick = () => this.closeModal();
    this.modal.querySelectorAll('.row[data-id]').forEach((r) => { r.onclick = () => { this.selItem = r.dataset.id; this.g.sfx.ui(); this.renderBag(); }; });
    const u = this.modal.querySelector('[data-act=use]');
    if (u) u.onclick = () => { this.g.useItem(this.selItem); if (!count(this.selItem)) this.selItem = state.inv[0] && state.inv[0].id; if (this.modalOpen) this.renderBag(); };
    const d = this.modal.querySelector('[data-act=drop]');
    if (d) d.onclick = () => { removeItem(this.selItem, 1); this.toast(`${ITEMS[this.selItem].name}을(를) 버렸다.`); if (!count(this.selItem)) this.selItem = state.inv[0] && state.inv[0].id; this.renderBag(); };
  }

  // 선반/서랍: 왼쪽은 컨테이너, 오른쪽은 가방
  openShelf(cid, title, onTake) {
    this.modalKind = 'shelf';
    this.modal.hidden = false;
    this.shelf = { cid, title, onTake };
    this.renderShelf();
  }

  renderShelf() {
    const { cid, title } = this.shelf;
    const box = state.containers[cid];
    const left = Object.entries(box).filter(([, q]) => q > 0).map(([id, q]) => {
      const it = ITEMS[id];
      const fit = canFit(id);
      return `<div class="row">${icoHTML(id)}<div class="nm">${esc(it.name)} ×${q}<small>${esc(it.desc)}</small></div><span class="sz">${it.size}칸</span>
        <button class="btn primary" data-take="${id}" ${fit ? '' : 'disabled'}>${fit ? '담기' : '칸 부족'}</button></div>`;
    }).join('') || '<div class="empty">더 챙길 것이 없다.</div>';
    const right = state.inv.map((e) => {
      const it = ITEMS[e.id];
      return `<div class="row">${icoHTML(e.id)}<div class="nm">${esc(it.name)} ×${e.qty}</div><span class="sz">${it.size}칸</span><button class="btn" data-put="${e.id}">내려놓기</button></div>`;
    }).join('') || '<div class="empty">가방이 비어 있다.</div>';
    this.modal.innerHTML = `<div class="panel" role="dialog" aria-label="${esc(title)}">
      <div class="panel-head"><h2>${esc(title)}</h2>${this.capHTML()}<button class="panel-close">닫기</button></div>
      <div class="panel-body"><div class="cols"><div><div class="col-title">여기 있는 것</div>${left}</div><div><div class="col-title">가방</div>${right}</div></div></div></div>`;
    this.modal.querySelector('.panel-close').onclick = () => this.closeModal();
    this.modal.querySelectorAll('[data-take]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.take;
        if (!canFit(id)) { this.g.sfx.deny(); return; }
        box[id] -= 1;
        addItem(id, 1);
        this.g.sfx.pickup();
        if (this.shelf.onTake) this.shelf.onTake(id);
        this.renderShelf();
      };
    });
    this.modal.querySelectorAll('[data-put]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.put;
        removeItem(id, 1);
        box[id] = (box[id] || 0) + 1;
        if (this.shelf.onPut) this.shelf.onPut(id);
        this.g.sfx.ui();
        this.renderShelf();
      };
    });
  }

  // ── 휴대폰 ──
  openPhone(tab) {
    if (state.battery <= 0) { this.toast('배터리가 다 됐다. 화면이 켜지지 않는다.'); this.g.sfx.deny(); return; }
    this.modalKind = 'phone';
    this.modal.hidden = false;
    if (tab) this.phoneTab = tab;
    this.renderPhone();
  }

  renderPhone() {
    if (this.modalKind !== 'phone') return;
    const sig = state.flags.flash ? '<span class="nosig">서비스 안됨</span>' : 'LTE ▂▄▆';
    const tabs = [['msg', '메시지'], ['chat', '단톡방'], ['alert', '재난문자'], ['memo', '메모']];
    let body = '';
    let foot = '';
    if (this.phoneTab === 'msg') {
      body = `<div class="thread-h">도준<small>동생</small></div>
        <div class="day-sep">5개월 전</div>
        <div class="msg them">형 나 훈련소 끝남</div>
        <div class="msg them">자대 서울쪽이래</div>
        <div class="msg me">ㅇㅇ 잘됐네</div>
        <div class="msg-meta right">읽음</div>
        <div class="day-sep">4개월 전</div>
        <div class="msg me">밥은 먹냐</div>
        <div class="msg-meta right">읽음</div>
        ${state.unsent.map((u) => `<div class="day-sep">${esc(u.when)}</div><div class="msg me fail">${esc(u.text)}</div><div class="msg-meta right"><span class="err">! 전송 실패</span></div>`).join('')}`;
      const can = state.flags.canText && !state.flags[`texted_d${state.day}`];
      foot = state.flags.canText ? `<button class="btn ${can ? 'primary' : ''}" data-act="write" ${can ? '' : 'disabled'}>${can ? '도준에게 문자 쓰기' : '오늘은 더 쓸 말이 없다'}</button>` : '';
    } else if (this.phoneTab === 'chat') {
      body = `<div class="thread-h">해오름마을 3단지 입주민<small>${state.chat.length ? `메시지 ${state.chat.length}개` : ''}</small></div>` + (state.chat.length ? state.chat.map((c) => `<div class="msg-meta">${esc(c.who)} · ${esc(c.time)}</div><div class="msg them">${esc(c.text)}</div>`).join('') : '<div class="empty">조용하다. 밤에는 늘 조용하다.</div>');
    } else if (this.phoneTab === 'alert') {
      body = state.alerts.length ? state.alerts.slice().reverse().map((a) => `<div class="alert-card"><h4><span>${esc(a.title)}</span><span>${esc(a.time)}</span></h4><p>${esc(a.body)}</p><div class="game-mark">게임 속 가상 재난문자</div></div>`).join('') : '<div class="empty">받은 재난문자가 없다.</div>';
    } else {
      const memos = [];
      if (state.objective) memos.push(`<div class="memo">지금 할 일: ${esc(state.objective)}</div>`);
      (state.notes || []).slice().reverse().forEach((n) => memos.push(`<div class="memo">${esc(n)}</div>`));
      body = memos.join('') || '<div class="empty">메모가 없다.</div>';
    }
    this.modal.innerHTML = `<div class="phone" role="dialog" aria-label="휴대폰">
      <div class="ph-status"><span>${clockText().replace(/^D\+\d+\s+/, '')}</span><span>${sig} · ${Math.ceil(state.battery)}%</span></div>
      <div class="ph-tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${this.phoneTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="ph-body">${body}</div>
      <div class="ph-foot">${foot}<button class="btn" data-act="close">닫기</button></div></div>`;
    this.modal.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { this.phoneTab = b.dataset.tab; this.g.sfx.ui(); this.renderPhone(); }; });
    this.modal.querySelector('[data-act=close]').onclick = () => this.closeModal();
    const w = this.modal.querySelector('[data-act=write]');
    if (w) w.onclick = () => this.writeText();
    const pb = this.modal.querySelector('.ph-body');
    if (this.phoneTab === 'msg' || this.phoneTab === 'chat') pb.scrollTop = pb.scrollHeight;
  }

  async writeText() {
    const opts = ['어디야. 형이 갈게', '괜찮지? 연락 좀 해', '미안하다. 그때 그 말'];
    const body = this.modal.querySelector('.ph-foot');
    body.innerHTML = opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o)}</button>`).join('');
    body.style.flexDirection = 'column';
    body.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => {
        const text = opts[+b.dataset.i];
        state.unsent.push({ when: clockText(), text });
        state.flags[`texted_d${state.day}`] = true;
        this.g.sfx.fail();
        this.renderPhone();
        this.toast('전송 실패. 「보내지 못한 문자함」에 저장됐다.');
      };
    });
  }


  // ── 아이템 획득 카드 ── (누르거나 시간이 지나면 닫힌다)
  itemGet(id, { n = 1, kicker = '획득', note = '', ms = 1700 } = {}) {
    return new Promise((resolve) => {
      const it = ITEMS[id];
      const el = $('#itemcard');
      el.innerHTML = `<div class="ic" role="status">
        <div class="ic-k">${esc(kicker)}</div>${icoHTML(id, 'lg')}
        <h3>${esc(it.name)}${n > 1 ? ` ×${n}` : ''}</h3>
        <p>${esc(note || it.desc)}</p>
        <div class="ic-cap">가방 ${bagUsed()} / ${state.bagSlots}칸 · ${it.size}칸 차지</div></div>`;
      el.hidden = false;
      this.g.sfx.pickup();
      let done = false;
      const close = () => { if (done) return; done = true; el.hidden = true; el.onclick = null; this.itemClose = null; resolve(); };
      el.onclick = close;
      this.itemClose = close;
      setTimeout(close, ms);
    });
  }
  get itemOpen() { return !$('#itemcard').hidden; }

  // ── 단톡방 ──
  chat(who, text, time) {
    state.chat.push({ who, text, time: time || clockText().replace(/^D\+\d+\s+/, '') });
    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = `<span class="who"><span class="room">입주민 톡</span> · ${esc(who)}</span>${esc(text)}`;
    const box = $('#chat');
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    this.g.sfx.tone(1568, 0.05, { vol: 0.03 });
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 800); }, 5200);
  }

  // ── 큰 시계 ──
  bigClock(html) {
    const el = $('#bigclock');
    if (html === null) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = html;
  }

  // ── 섬광과 진짜 제목 ──
  whiteTitle(holdMs) {
    const f = $('#flash');
    f.style.transition = 'none';
    f.style.opacity = 1;
    setTimeout(() => f.classList.add('titled'), 900);
    return wait(holdMs);
  }
  whiteOut(ms = 3500) {
    const f = $('#flash');
    f.classList.remove('titled');
    f.style.transition = `opacity ${ms}ms ease-out`;
    f.style.opacity = 0;
    return wait(ms * 0.6);
  }

  // ── 뉴스 생방송 ──
  // frames: [{ img, fallback, zoom, red, flick, noise, time, ticker, lines: [{ who, text, role, key }] }]
  news(frames, voice) {
    return new Promise(async (resolve) => {
      const box = $('#news');
      const img = box.querySelector('.tv-img');
      const sub = box.querySelector('.tv-sub');
      const tag = box.querySelector('.tv-tag');
      const tm = box.querySelector('.tv-time');
      const noise = box.querySelector('.tv-noise');
      box.querySelector('.tv-ticker span').textContent = '정부, 국가안전보장회의 긴급 소집 · 수도권 전역 공습경보 발령 · 시민들은 가까운 지하 대피시설로 이동 · 엘리베이터 이용 자제 · 한누리뉴스24 특보 계속';
      box.hidden = false;
      let skip = null;
      box.onclick = () => { if (skip) skip(); };
      this.newsSkip = () => { if (skip) skip(); };
      let noiseT = null;
      const drawNoise = () => {
        const c = noise.getContext('2d');
        const d = c.createImageData(160, 90);
        for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
        c.putImageData(d, 0, 0);
        if (Math.random() < 0.4) { c.fillStyle = ['#c33', '#3c3', '#33c', '#cc3'][Math.floor(Math.random() * 4)]; c.fillRect(0, Math.random() * 90, 160, 4); }
      };
      for (const fr of frames) {
        const src = newsSrc(fr.img) || (fr.fallback && newsSrc(fr.fallback));
        img.style.visibility = src ? 'visible' : 'hidden';
        if (src) img.src = src;
        img.classList.remove('zoom', 'redtint', 'flick');
        void img.offsetWidth;
        if (fr.zoom) requestAnimationFrame(() => img.classList.add('zoom'));
        if (fr.red) img.classList.add('redtint');
        if (fr.flick) img.classList.add('flick');
        tag.textContent = fr.tag || '속보';
        tm.textContent = fr.time || '';
        if (fr.noise) { noise.classList.add('on'); noiseT = setInterval(drawNoise, 60); this.g.sfx.noise(fr.noiseMs / 1000 || 1.2, { vol: 0.12, freq: 3000, type: 'highpass' }); }
        for (const ln of fr.lines || []) {
          sub.textContent = ln.text;
          await new Promise((r) => { skip = () => { voice.stop(); r(); }; voice.speak(ln.text, ln.role || 'anchor', ln.key).then(r); });
          skip = null;
          if (ln.pause) await wait(ln.pause);
        }
        if (fr.hold) await new Promise((r) => { skip = r; setTimeout(r, fr.hold); });
        if (noiseT) { clearInterval(noiseT); noiseT = null; noise.classList.remove('on'); }
      }
      voice.stop();
      box.hidden = true;
      box.onclick = null;
      this.newsSkip = null;
      resolve();
    });
  }
  get newsOpen() { return !$('#news').hidden; }

  // ── 근무 미니게임 1: 폐기 체크 ──
  // 유통기한이 지난 삼각김밥을 모두 고르면 끝난다. 결과: 폐기 개수
  wasteCheck(nowLabel) {
    return new Promise((resolve) => {
      const list = [
        { d: '11.13 00:00', exp: true }, { d: '11.14 06:00', exp: false }, { d: '11.13 00:00', exp: true },
        { d: '11.14 06:00', exp: false }, { d: '11.12 24:00', exp: true }, { d: '11.14 06:00', exp: false },
      ];
      const sel = new Set();
      this.modalKind = 'mg';
      this.modal.hidden = false;
      const render = (msg = '') => {
        this.modal.innerHTML = `<div class="panel mg" role="dialog" aria-label="폐기 체크">
          <div class="panel-head"><h2>폐기 체크</h2><span class="cap">지금 ${esc(nowLabel)}</span></div>
          <div class="panel-body">
            <p class="mg-hint">유통기한이 <b>지난</b> 삼각김밥을 모두 고르세요. ${msg ? `<br><b style="color:#ff8a6a">${esc(msg)}</b>` : ''}</p>
            <div class="mg-grid">${list.map((x, i) => `<button class="mg-card ${sel.has(i) ? 'on' : ''}" data-i="${i}" type="button">${icoHTML('kimbap')}<span class="d ${sel.has(i) ? 'exp' : ''}">~${esc(x.d)}</span></button>`).join('')}</div>
            <div class="mg-foot"><button class="btn primary" data-act="ok" type="button">폐기 바구니에 넣기</button></div>
          </div></div>`;
        this.modal.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { const i = +b.dataset.i; if (sel.has(i)) sel.delete(i); else sel.add(i); this.g.sfx.ui(); render(); }; });
        this.modal.querySelector('[data-act=ok]').onclick = () => {
          const wrong = [...sel].some((i) => !list[i].exp);
          const missed = list.some((x, i) => x.exp && !sel.has(i));
          if (wrong) { this.g.sfx.deny(); render('아직 팔 수 있는 게 섞여 있다. 사장님이 알면 혼난다.'); return; }
          if (missed) { this.g.sfx.deny(); render('지난 게 하나 더 남아 있다.'); return; }
          this.g.sfx.success();
          this.modal.hidden = true; this.modal.innerHTML = ''; this.modalKind = null;
          resolve(sel.size);
        };
      };
      render();
    });
  }

  // ── 근무 미니게임 2: 진열 (선입선출) ──
  // 유통기한이 빠른 것부터 차례로 누른다
  restock(title, id, dates) {
    return new Promise((resolve) => {
      const order = dates.map((d, i) => ({ d, i })).sort((a, b) => a.d.localeCompare(b.d)).map((x) => x.i);
      let step = 0;
      this.modalKind = 'mg';
      this.modal.hidden = false;
      const render = (bad = -1) => {
        this.modal.innerHTML = `<div class="panel mg" role="dialog" aria-label="${esc(title)}">
          <div class="panel-head"><h2>${esc(title)}</h2><span class="cap">${step} / ${dates.length}</span></div>
          <div class="panel-body">
            <p class="mg-hint">선입선출. 유통기한이 <b>빠른 것부터</b> 차례로 앞줄에 놓으세요.</p>
            <div class="mg-grid">${dates.map((d, i) => { const k = order.indexOf(i); const done = k < step; return `<button class="mg-card ${done ? 'done' : ''} ${bad === i ? 'shake' : ''}" data-i="${i}" type="button">${done ? `<span class="ord">${k + 1}</span>` : ''}${icoHTML(id)}<span class="d">~${esc(d.replace(/^(\d+)\.(\d+)$/, '$1월 $2일'))}</span></button>`; }).join('')}</div>
          </div></div>`;
        this.modal.querySelectorAll('[data-i]').forEach((b) => {
          b.onclick = () => {
            const i = +b.dataset.i;
            if (i === order[step]) {
              step += 1; this.g.sfx.ui();
              if (step >= dates.length) { this.g.sfx.success(); this.modal.hidden = true; this.modal.innerHTML = ''; this.modalKind = null; resolve(); return; }
              render();
            } else { this.g.sfx.deny(); render(i); }
          };
        });
      };
      render();
    });
  }

  // ── 근무 미니게임 3: 계산 ──
  pos(who, goods) {
    return new Promise((resolve) => {
      const scanned = new Set();
      this.modalKind = 'mg';
      this.modal.hidden = false;
      const total = goods.reduce((s, id) => s + (POS_GOODS[id] || 1000), 0);
      const render = () => {
        const all = scanned.size === goods.length;
        this.modal.innerHTML = `<div class="panel mg" role="dialog" aria-label="계산대">
          <div class="panel-head"><h2>계산대</h2><span class="cap">손님 · ${esc(who)}</span></div>
          <div class="panel-body">
            <p class="mg-hint">${all ? '합계를 확인하고 결제하세요.' : '물건을 눌러 바코드를 찍으세요.'}</p>
            <div class="mg-grid">${goods.map((id, i) => `<button class="mg-card ${scanned.has(i) ? 'done' : ''}" data-i="${i}" type="button">${icoHTML(id)}<span class="d">${esc(ITEMS[id] ? ITEMS[id].name : id)}</span></button>`).join('')}</div>
            <div class="mg-foot" style="align-items:center;justify-content:space-between"><span class="pos-total">${all ? `₩${total.toLocaleString('ko-KR')}` : '₩—'}</span>
            <button class="btn primary" data-act="pay" type="button" ${all ? '' : 'disabled'}>결제</button></div>
          </div></div>`;
        this.modal.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { scanned.add(+b.dataset.i); this.g.sfx.beep(); render(); }; });
        this.modal.querySelector('[data-act=pay]').onclick = () => { this.g.sfx.coin(); this.modal.hidden = true; this.modal.innerHTML = ''; this.modalKind = null; resolve(total); };
      };
      render();
    });
  }

  // ── 타이틀 ──
  title(canContinue) {
    return new Promise((resolve) => {
      const t = $('#title');
      t.hidden = false;
      const c = $('#btn-continue');
      c.hidden = !canContinue;
      $('#btn-new').onclick = () => { t.hidden = true; resolve('new'); };
      c.onclick = () => { t.hidden = true; resolve('continue'); };
    });
  }
}
