// 게임 루프: 씬 관리, 이동·충돌, 상호작용, 렌더링·조명
import { TILE, Input, Sfx, Voice, clamp, lerp, wait } from './engine.js';
import { loadAssets } from './assets.js';
import { MAPS, renderMap, solidAt } from './world.js';
import { UI } from './ui.js';
import { state, passTime, addStat, has, removeItem, hasSave } from './state.js';
import { ITEMS } from './items.js';
import { SCENES, startNewGame, continueGame, dieScript, letterScript } from './story.js';

const PLAYER_R = 9;

class Game {
  constructor() {
    this.cv = document.getElementById('view');
    this.ctx = this.cv.getContext('2d');
    this.lc = document.createElement('canvas');
    this.lctx = this.lc.getContext('2d');
    this.sfx = new Sfx();
    this.voice = new Voice(this.sfx);
    this.adapt = 1;
    try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (e) { /* noop */ }
    this.input = new Input();
    this.ui = new UI(this);
    this.player = { x: 0, y: 0, dir: Math.PI / 2, moving: false, stepT: 0, walkT: 0, visible: true };
    this.scene = null;
    this.busy = 0;
    this.cam = { x: 0, y: 0 };
    this.shakeT = 0;
    this.shakeMag = 0;
    this.lightMode = null;
    this.timerEnd = null;
    this.timerCb = null;
    this.now = performance.now() / 1000;
    this.hudT = 0;
    this.nearest = null;
    this.dying = false;
    this.input.onPress = (k, e) => this.onKey(k, e);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.setupTouch();
    document.getElementById('btn-mute').onclick = () => this.toggleMute();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ───────── 화면 크기 ─────────
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    const w = window.innerWidth, h = window.innerHeight;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    // 조명은 절반 해상도로 그리고 늘려서 그린다: 가장자리가 자연스럽게 번지고 빠르다
    this.lc.width = Math.max(1, Math.round(this.cv.width / 2));
    this.lc.height = Math.max(1, Math.round(this.cv.height / 2));
    const zoom = clamp(Math.min(w, h) / (10.5 * TILE), 1, 2.4);
    this.ws = zoom * dpr; // 캔버스 픽셀 / 월드 픽셀
  }

  // ───────── 입력 ─────────
  onKey(k) {
    this.sfx.init();
    if (k === 'm') { this.toggleMute(); return true; }
    if (this.ui.handleKey(k)) return true;
    if (!this.scene || this.busy) return false;
    if (k === 'e' || k === ' ' || k === 'Enter') { this.interact(); return true; }
    if (k === 'f') { this.toggleLight(); return true; }
    if (k === 'p') { this.ui.openPhone(); return true; }
    if (k === 'i' || k === 'b') { this.ui.openBag(); return true; }
    return false;
  }

  toggleMute() {
    this.sfx.setMuted(!this.sfx.muted);
    const b = document.getElementById('btn-mute');
    b.classList.toggle('off', this.sfx.muted);
  }

  setupTouch() {
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (!isTouch) return;
    document.body.classList.add('touch');
    const zone = document.getElementById('stick-zone');
    const base = document.getElementById('stick-base');
    const knob = document.getElementById('stick-knob');
    let id = null, ox = 0, oy = 0;
    zone.addEventListener('pointerdown', (e) => {
      this.sfx.init();
      if (this.ui.blocking) { if (this.ui.dialogOpen) this.ui.advance(); return; }
      id = e.pointerId; ox = e.clientX; oy = e.clientY;
      base.style.display = 'block';
      base.style.left = `${ox - 55}px`;
      base.style.top = `${oy - 55 - zone.getBoundingClientRect().top}px`;
      zone.setPointerCapture(id);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const len = Math.hypot(dx, dy), max = 42;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.touchVec = { x: dx / max, y: dy / max };
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      base.style.display = 'none';
      knob.style.transform = '';
      this.input.touchVec = { x: 0, y: 0 };
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    document.querySelectorAll('#touch-btns [data-act]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.sfx.init();
        const map = { use: 'e', phone: 'p', bag: 'i', light: 'f' };
        this.onKey(map[b.dataset.act]);
      });
    });
  }

  showTouch(on) {
    if (document.body.classList.contains('touch')) document.getElementById('touch').hidden = !on;
  }

  // ───────── 스크립트 도우미 ─────────
  async run(fn, ...args) {
    this.busy++;
    try { await fn(this, ...args); } catch (e) { console.error(e); } finally { this.busy--; }
  }
  say(name, text, opts) { return this.ui.say(name, text, opts); }
  narr(text) { return this.ui.say('', text, { mode: 'narr' }); }
  choose(prompt, opts, o) { return this.ui.choose(prompt, opts, o); }
  objective(text, quiet = false) {
    if (state.objective === text) return;
    state.objective = text;
    this.ui.updateHUD();
    if (text && !quiet) this.ui.toast(`목표 · ${text}`, 3200);
  }
  ent(id) { return this.scene.entities.find((e) => e.id === id); }
  shake(sec, mag) { this.shakeT = sec; this.shakeMag = mag; }
  refreshMap() { this.scene.mapCanvas = renderMap(this.scene); }
  startTimer(sec, cb) { this.timerEnd = this.now + sec; this.timerCb = cb; }
  stopTimer() { this.timerEnd = null; this.timerCb = null; this.ui.timer(null); }

  walk(ent, path, speed = 80) {
    return new Promise((resolve) => {
      ent.path = path.map(([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }));
      ent.pathSpeed = speed;
      ent.pathDone = resolve;
    });
  }

  // ───────── 씬 전환 ─────────
  async goto(id, spawn = {}, opts = {}) {
    this.busy++;
    try {
      this.ui.setPrompt(null);
      this.ui.closeModal();
      if (!opts.noFadeOut) await this.ui.fade(1, 450);
      const def = SCENES[id];
      const scene = {
        id, def, map: MAPS[def.map || id], power: false, ambient: 0.9, tint: def.tint || [6, 8, 12],
        labels: [], entities: [], triggers: [], lights: [], particles: [],
      };
      def.setup(scene, this);
      scene.mapCanvas = renderMap(scene);
      this.scene = scene;
      state.scene = id;
      this.adapt = scene.ambient > 0.8 ? 0.25 : 1;
      const p = this.player;
      p.x = (spawn.tx ?? 1) * TILE + TILE / 2;
      p.y = (spawn.ty ?? 1) * TILE + TILE / 2;
      if (spawn.dir !== undefined) p.dir = (spawn.dir * Math.PI) / 180;
      this.updateCamera(true);
      this.ui.updateHUD();
      if (!opts.noFadeIn) this.ui.fade(0, 700);
      if (def.onEnter) await def.onEnter(this);
    } catch (e) {
      console.error(e);
    } finally {
      this.busy--;
    }
  }

  // ───────── 아이템·빛 ─────────
  useItem(id) {
    const it = ITEMS[id];
    if (!it || !has(id)) return;
    const toast = (t) => this.ui.toast(t);
    if (it.special === 'flashlight') {
      if (state.flashPower <= 0) {
        if (has('battery')) { removeItem('battery'); state.flashPower = 100; toast('손전등에 건전지를 넣었다.'); }
        else { toast('건전지가 없다.'); return; }
      }
      if (this.lightMode !== 'flash') this.toggleLight();
      return;
    }
    if (it.special === 'battery') {
      if (!has('flashlight')) { toast('넣을 손전등이 없다.'); return; }
      removeItem('battery'); state.flashPower = 100; this.sfx.ui(); toast('손전등 건전지를 갈았다.');
      return;
    }
    if (it.special === 'powerbank') {
      removeItem('powerbank'); state.battery = Math.min(100, state.battery + 45); this.sfx.notify(); toast('휴대폰을 충전했다.');
      return;
    }
    if (it.special === 'rice') { toast('익힐 방법이 없다. 지금은.'); return; }
    if (!it.use) { toast(it.desc); return; }
    if (it.once && state.usedToday[id]) { toast('지금은 더 들여다봐도 나아지지 않는다.'); return; }
    Object.entries(it.use).forEach(([k, v]) => addStat(k, v));
    if (it.once) state.usedToday[id] = true;
    else if (it.charges) {
      if (state.charges[id] === undefined) state.charges[id] = it.charges;
      state.charges[id] -= 1;
      if (state.charges[id] <= 0) { delete state.charges[id]; removeItem(id); }
    } else removeItem(id);
    this.sfx.pickup();
    if (it.special === 'letter') { this.ui.closeModal(); this.run(letterScript); this.ui.updateHUD(); return; }
    toast(it.useText || `${it.name}을(를) 썼다.`);
    this.ui.updateHUD();
  }

  toggleLight() {
    if (this.lightMode) { this.lightMode = null; this.adapt = Math.min(this.adapt, 0.3); this.sfx.ui(); this.ui.updateHUD(); return; }
    if (has('flashlight')) {
      if (state.flashPower <= 0 && has('battery')) { removeItem('battery'); state.flashPower = 100; this.ui.toast('건전지를 갈아 끼웠다.'); }
      if (state.flashPower > 0) { this.lightMode = 'flash'; this.sfx.ui(); this.ui.updateHUD(); return; }
    }
    if (state.battery > 3) {
      this.lightMode = 'phone';
      this.sfx.ui();
      if (!state.flags.phoneLightTip) { state.flags.phoneLightTip = true; this.ui.toast('휴대폰 불빛을 켰다. 배터리가 닳는다.'); }
      this.ui.updateHUD();
      return;
    }
    this.sfx.deny();
    this.ui.toast('켤 수 있는 불빛이 없다.');
  }

  // ───────── 상호작용 ─────────
  distTo(e) {
    const p = this.player;
    if (e.kind === 'npc') return Math.hypot(e.x - p.x, e.y - p.y) - e.r;
    const x0 = e.tx * TILE, y0 = e.ty * TILE, x1 = x0 + e.tw * TILE, y1 = y0 + e.th * TILE;
    const cx = clamp(p.x, x0, x1), cy = clamp(p.y, y0, y1);
    return Math.hypot(cx - p.x, cy - p.y);
  }

  findNearest() {
    let best = null, bd = 1e9;
    for (const e of this.scene.entities) {
      if (!e.onUse || e.visible === false || (e.enabled && !e.enabled())) continue;
      const d = this.distTo(e);
      const reach = e.reach || (e.kind === 'npc' ? 30 : 22);
      if (d < reach && d < bd) { bd = d; best = e; }
    }
    return best;
  }

  interact() {
    const e = this.nearest;
    if (!e) return;
    if (e.kind === 'npc') {
      // 말을 걸면 서로 마주 본다
      e.face = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      this.player.dir = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    }
    this.run(e.onUse);
  }

  // ───────── 갱신 ─────────
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    this.now = t / 1000;
    try { this.update(dt); this.render(); } catch (e) { console.error(e); }
    requestAnimationFrame((tt) => this.frame(tt));
  }

  collides(x, y) {
    const m = this.scene.map;
    const r = PLAYER_R;
    const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
    for (const [px, py] of pts) {
      if (solidAt(m, Math.floor(px / TILE), Math.floor(py / TILE))) return true;
    }
    for (const e of this.scene.entities) {
      if (e.kind === 'npc' && e.solid && e.visible !== false && Math.hypot(e.x - x, e.y - y) < e.r + r - 2) return true;
    }
    return false;
  }

  update(dt) {
    if (!this.scene) return;
    const s = this.scene;
    const p = this.player;
    const free = !this.busy && !this.ui.blocking;
    document.body.classList.toggle('in-ui', this.ui.dialogOpen || this.ui.modalOpen);
    state.playSec += dt;

    // 시간 흐름
    const rate = s.def.timeRate ?? 1;
    if (free && rate > 0) passTime(dt * rate);

    // 휴대폰·빛 배터리
    if (this.ui.modalKind === 'phone') {
      state.battery = Math.max(0, state.battery - dt * 0.15);
      if (state.battery <= 0) { this.ui.closeModal(); this.ui.toast('배터리가 다 됐다.'); }
    }
    if (this.lightMode === 'flash') {
      state.flashPower = Math.max(0, state.flashPower - dt * 0.33);
      if (state.flashPower <= 0) { this.lightMode = null; this.ui.toast('손전등이 꺼졌다. 건전지가 필요하다.'); }
    } else if (this.lightMode === 'phone') {
      state.battery = Math.max(0, state.battery - dt * 0.12);
      if (state.battery <= 3) { this.lightMode = null; this.ui.toast('휴대폰 배터리를 아껴야 한다.'); }
    }

    // 골든타임
    if (this.timerEnd !== null) {
      const left = this.timerEnd - this.now;
      this.ui.timer(left);
      if (left <= 0) {
        const cb = this.timerCb;
        this.stopTimer();
        if (cb) this.run(cb, true);
      }
    }

    // 이동
    p.moving = false;
    if (free) {
      const a = this.input.axis();
      if (a.x || a.y) {
        const run = this.input.running();
        const sp = (run ? 168 : 108) * dt;
        const nx = p.x + a.x * sp;
        if (!this.collides(nx, p.y)) p.x = nx;
        const ny = p.y + a.y * sp;
        if (!this.collides(p.x, ny)) p.y = ny;
        const target = Math.atan2(a.y, a.x);
        let diff = target - p.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.dir += diff * Math.min(1, dt * 14);
        p.moving = true;
        p.walkT += dt * (run ? 13 : 9);
        p.stepT -= dt;
        if (p.stepT <= 0) { this.sfx.step(); p.stepT = run ? 0.26 : 0.38; }
        if (run && s.def.timeRate) addStat('thirst', -dt * 0.15);
      }
    }

    // NPC 경로 이동
    for (const e of s.entities) {
      if (!e.path || !e.path.length) continue;
      const tgt = e.path[0];
      const dx = tgt.x - e.x, dy = tgt.y - e.y;
      const d = Math.hypot(dx, dy);
      const sp = e.pathSpeed * dt;
      e.face = Math.atan2(dy, dx);
      if (e.light && e.light.cone) e.light.angle = e.face;
      if (d <= sp) {
        e.x = tgt.x; e.y = tgt.y; e.path.shift();
        if (!e.path.length) { e.path = null; if (e.pathDone) { const f = e.pathDone; e.pathDone = null; f(); } }
      } else { e.x += (dx / d) * sp; e.y += (dy / d) * sp; }
      e.walkT = (e.walkT || 0) + dt * 9;
    }

    // 상호작용 대상
    this.nearest = free ? this.findNearest() : null;
    if (this.nearest) {
      const e = this.nearest;
      const verb = e.verb || (e.kind === 'npc' ? '대화' : '살펴보기');
      this.ui.setPrompt(`${verb} · ${e.label || e.name}`);
    } else this.ui.setPrompt(null);

    // 트리거
    if (free) {
      for (const t of s.triggers) {
        if (t.fired && t.once !== false) continue;
        const x0 = t.x * TILE, y0 = t.y * TILE;
        const inside = p.x >= x0 && p.x <= x0 + t.w * TILE && p.y >= y0 && p.y <= y0 + t.h * TILE;
        if (inside && (!t.when || t.when(this))) { t.fired = true; this.run(t.run); break; }
      }
    }

    // 암순응: 어둠에 들어가면 몇 초에 걸쳐 눈이 익는다
    this.adapt = Math.min(1, this.adapt + dt / 7);

    // 입자
    for (const q of s.particles) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.type === 'shard') { q.vx *= 0.93; q.vy *= 0.93; }
      if (q.type === 'bird') { q.vx *= 1.01; q.vy *= 1.01; q.flap = (q.flap || 0) + dt * 18; }
    }
    s.particles = s.particles.filter((q) => q.life > 0);

    // 머리 위 말풍선: 가까이 지나가면 혼잣말을 한다
    if (free) {
      for (const e of s.entities) {
        if (!e.barks || e.visible === false || e.barkUntil > this.now || (e.barkReady || 0) > this.now) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < 96) {
          e.barkText = e.barks[(e.barkN = ((e.barkN ?? -1) + 1)) % e.barks.length];
          e.barkUntil = this.now + 3.8;
          e.barkReady = this.now + 22;
        }
      }
    }

    if (s.def.update) s.def.update(this, dt, free);

    // 쓰러짐
    if (state.stats.hp <= 0 && !this.dying && s.id !== 'dream') { this.dying = true; this.run(dieScript); }

    this.hudT -= dt;
    if (this.hudT <= 0) { this.ui.updateHUD(); this.hudT = 0.25; }
    if (this.shakeT > 0) this.shakeT -= dt;
    this.updateCamera(false, dt);
  }

  updateCamera(snap, dt = 0) {
    const s = this.scene;
    const vw = this.cv.width / this.ws, vh = this.cv.height / this.ws;
    const mw = s.map.rows[0].length * TILE, mh = s.map.rows.length * TILE;
    let tx = this.player.x - vw / 2, ty = this.player.y - vh / 2;
    tx = mw <= vw ? (mw - vw) / 2 : clamp(tx, 0, mw - vw);
    ty = mh <= vh ? (mh - vh) / 2 : clamp(ty, 0, mh - vh);
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    const k = Math.min(1, dt * 7);
    this.cam.x = lerp(this.cam.x, tx, k);
    this.cam.y = lerp(this.cam.y, ty, k);
  }

  // ───────── 렌더링 ─────────
  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    const s = this.scene;
    if (!s) return;
    const ws = this.ws;
    let cx = this.cam.x, cy = this.cam.y;
    if (this.shakeT > 0) {
      const m = this.shakeMag * Math.min(1, this.shakeT);
      cx += (Math.random() - 0.5) * m;
      cy += (Math.random() - 0.5) * m;
    }
    const W = s.map.rows[0].length * TILE, H = s.map.rows.length * TILE;
    ctx.setTransform(ws, 0, 0, ws, -cx * ws, -cy * ws);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(s.mapCanvas, 0, 0, W, H);

    // 상호작용 가능한 사물 강조
    const n = this.nearest;
    if (n && n.kind === 'thing') {
      ctx.strokeStyle = `rgba(227,179,65,${0.45 + Math.sin(this.now * 5) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(n.tx * TILE + 1, n.ty * TILE + 1, n.tw * TILE - 2, n.th * TILE - 2);
    }

    if (s.def.drawUnder) s.def.drawUnder(ctx, this);

    // 사람들 (y 정렬)
    const people = s.entities.filter((e) => e.kind === 'npc' && e.visible !== false);
    const list = [...people.map((e) => ({ e, y: e.y })), { e: null, y: this.player.y }].sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.e) this.drawPerson(ctx, it.e, false);
      else if (this.player.visible) this.drawPerson(ctx, this.player, true);
    }
    this.drawParticles(ctx, false);
    if (s.def.drawOver) s.def.drawOver(ctx, this);

    this.renderLighting(cx, cy);

    // 조명 위에 그리는 것: 유리 반짝임, 퀘스트 표시, 말풍선
    ctx.setTransform(ws, 0, 0, ws, -cx * ws, -cy * ws);
    this.drawParticles(ctx, true);
    if (s.def.drawTop) s.def.drawTop(ctx, this);
    for (const e of people) {
      if (e.mark && e.mark()) {
        const y = e.y - 26 + Math.sin(this.now * 3) * 2;
        ctx.fillStyle = '#e3b341';
        ctx.beginPath();
        ctx.moveTo(e.x, y - 5); ctx.lineTo(e.x + 4, y); ctx.lineTo(e.x, y + 5); ctx.lineTo(e.x - 4, y);
        ctx.fill();
      }
      if (e.barkUntil > this.now && e.barkText && !this.ui.dialogOpen) this.drawBubble(ctx, e.x, e.y - 22, e.barkText, Math.min(1, (e.barkUntil - this.now) * 2));
    }
  }

  drawParticles(ctx, top) {
    for (const q of this.scene.particles) {
      const a = Math.min(1, q.life / (q.fade || 0.6));
      if (q.type === 'bird' && !top) {
        const w = Math.sin(q.flap || 0) * 3;
        ctx.strokeStyle = `rgba(30,30,34,${a})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(q.x - 5, q.y - w); ctx.lineTo(q.x, q.y); ctx.lineTo(q.x + 5, q.y - w); ctx.stroke();
      } else if (q.type === 'shard') {
        ctx.fillStyle = top ? `rgba(220,240,255,${a * 0.55})` : `rgba(150,180,200,${a})`;
        ctx.fillRect(q.x, q.y, q.size, q.size);
      } else if (q.type === 'dust' && !top) {
        ctx.fillStyle = `rgba(190,185,170,${a * 0.5})`;
        ctx.fillRect(q.x, q.y, q.size, q.size);
      }
    }
  }

  drawBubble(ctx, x, y, text, alpha) {
    const fs = 12.5 / (this.ws / this.dpr); // 화면에서 12.5px 정도
    ctx.font = `500 ${fs}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
    const maxW = fs * 13;
    const lines = [];
    let cur = '';
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch;
    }
    if (cur) lines.push(cur);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + fs * 1.2;
    const h = lines.length * fs * 1.35 + fs * 0.8;
    const bx = x - w / 2, by = y - h;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(18,20,24,.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, w, h, fs * 0.5); else ctx.rect(bx, by, w, h);
    ctx.moveTo(x - fs * 0.4, by + h); ctx.lineTo(x, by + h + fs * 0.5); ctx.lineTo(x + fs * 0.4, by + h);
    ctx.fill();
    ctx.fillStyle = '#ece8df';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, x, by + fs * 0.45 + i * fs * 1.35));
    ctx.globalAlpha = 1;
  }

  drawPerson(ctx, e, isPlayer) {
    const r = isPlayer ? 10 : (e.small ? 7.5 : e.r || 10);
    const dir = isPlayer ? e.dir : (e.face ?? Math.PI / 2);
    const bob = (isPlayer ? e.moving : !!e.path) ? Math.sin(e.walkT || 0) * 1.4 : 0;
    const x = e.x, y = e.y + bob * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(x, e.y + r * 0.7, r * 1.05, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    if (e.sit) {
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.ellipse(x, y + 3, r * 1.15, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = isPlayer ? '#28313b' : e.color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (isPlayer) { // 편의점 조끼
        ctx.fillStyle = '#2f8f83';
        ctx.beginPath(); ctx.arc(x, y, r - 2.5, dir + 0.9, dir + Math.PI * 2 - 0.9); ctx.fill();
      }
    }
    const hx = x + Math.cos(dir) * 2.5, hy = y - (e.sit ? 3 : 4) + Math.sin(dir) * 2;
    ctx.fillStyle = e.skin || '#d8b796';
    ctx.beginPath(); ctx.arc(hx, hy, r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.hair || '#1f1c1a';
    ctx.beginPath(); ctx.arc(hx - Math.cos(dir) * 1.6, hy - Math.sin(dir) * 1.6, r * 0.58, 0, Math.PI * 2); ctx.fill();
  }

  collectLights() {
    const s = this.scene, p = this.player;
    const out = [...s.lights];
    for (const e of s.entities) {
      if (e.light && e.visible !== false) out.push({ ...e.light, dyn: true, x: e.x ?? (e.tx + e.tw / 2) * TILE, y: e.y ?? (e.ty + e.th / 2) * TILE });
    }
    // 도일의 "야간 알바" 시야: 어둠에 눈이 익을수록 넓어진다
    const ad = this.adapt;
    out.push({ x: p.x, y: p.y, r: (s.def.visionR || 92) * (0.62 + 0.38 * ad), i: 0.46 + 0.3 * ad, dyn: true });
    if (this.lightMode === 'flash') {
      const f = Math.min(1, state.flashPower / 25 + 0.35);
      // 부드러운 가장자리: 넓고 옅은 원뿔 위에 좁고 밝은 원뿔
      out.push({ x: p.x, y: p.y, r: 250, i: 0.34 * f, cone: true, angle: p.dir, spread: 0.7, dyn: true });
      out.push({ x: p.x, y: p.y, r: 290, i: 0.9 * f, cone: true, angle: p.dir, spread: 0.4, color: '#fff3d6', glow: 0.09, dyn: true });
      out.push({ x: p.x + Math.cos(p.dir) * 10, y: p.y + Math.sin(p.dir) * 10, r: 50, i: 0.55 * f, dyn: true });
    } else if (this.lightMode === 'phone') {
      out.push({ x: p.x, y: p.y, r: 150, i: 0.82, color: '#cfe1ff', glow: 0.08, dyn: true });
    }
    return out;
  }

  // 빛을 막는 타일 (벽, 건물, 기둥, 철문). 진열대나 차는 낮아서 빛이 넘어간다
  blocksLight(tx, ty) {
    const row = this.scene.map.rows[ty];
    if (!row) return true;
    const ch = row[tx];
    return ch === undefined || LIGHT_BLOCK.has(ch);
  }

  castRay(x, y, dx, dy, r) {
    const step = 6;
    for (let d = step; d < r; d += step) {
      if (this.blocksLight(Math.floor((x + dx * d) / TILE), Math.floor((y + dy * d) / TILE))) return d + 6; // 벽면까지는 비춘다
    }
    return r;
  }

  // 벽에 가려진 부분을 뺀 빛의 모양 (다각형)
  lightPoly(l) {
    if (l.noOcc || this.blocksLight(Math.floor(l.x / TILE), Math.floor(l.y / TILE))) return null;
    if (!l.dyn && l._poly && l._px === l.x && l._py === l.y) return l._poly;
    const rays = l.cone ? 40 : 90;
    const a0 = l.cone ? l.angle - l.spread : 0;
    const a1 = l.cone ? l.angle + l.spread : Math.PI * 2;
    const pts = l.cone ? [l.x, l.y] : [];
    for (let i = 0; i <= rays; i++) {
      const a = a0 + ((a1 - a0) * i) / rays;
      const dx = Math.cos(a), dy = Math.sin(a);
      const d = this.castRay(l.x, l.y, dx, dy, l.r);
      pts.push(l.x + dx * d, l.y + dy * d);
    }
    if (!l.dyn) { l._poly = pts; l._px = l.x; l._py = l.y; }
    return pts;
  }

  pathLight(C, l, poly) {
    C.beginPath();
    if (poly) {
      C.moveTo(poly[0], poly[1]);
      for (let i = 2; i < poly.length; i += 2) C.lineTo(poly[i], poly[i + 1]);
      C.closePath();
    } else if (l.cone) {
      C.moveTo(l.x, l.y);
      C.arc(l.x, l.y, l.r, l.angle - l.spread, l.angle + l.spread);
      C.closePath();
    } else C.arc(l.x, l.y, l.r, 0, Math.PI * 2);
  }

  renderLighting(cx, cy) {
    const s = this.scene;
    if (s.ambient <= 0.01) return;
    const L = this.lctx;
    const lws = this.ws * (this.lc.width / this.cv.width);
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalCompositeOperation = 'source-over';
    L.clearRect(0, 0, this.lc.width, this.lc.height);
    const [r, g, b] = s.tint;
    L.fillStyle = `rgba(${r},${g},${b},${s.ambient})`;
    L.fillRect(0, 0, this.lc.width, this.lc.height);
    L.globalCompositeOperation = 'destination-out';
    L.setTransform(lws, 0, 0, lws, -cx * lws, -cy * lws);
    const lights = this.collectLights();
    const polys = lights.map((l) => this.lightPoly(l));
    lights.forEach((l, k) => {
      let i = l.i;
      if (l.flicker) i *= 1 - Math.random() * l.flicker;
      const grd = L.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      grd.addColorStop(0, `rgba(0,0,0,${i})`);
      grd.addColorStop(0.4, `rgba(0,0,0,${i * 0.7})`);
      grd.addColorStop(0.75, `rgba(0,0,0,${i * 0.25})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      L.fillStyle = grd;
      this.pathLight(L, l, polys[k]);
      L.fill();
    });
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.lc, 0, 0, this.cv.width, this.cv.height);
    // 색이 있는 빛은 살짝 물들인다
    ctx.globalCompositeOperation = 'lighter';
    const ws = this.ws;
    ctx.setTransform(ws, 0, 0, ws, -cx * ws, -cy * ws);
    lights.forEach((l, k) => {
      if (!l.color) return;
      const a = l.glow ?? 0.16;
      const grd = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      grd.addColorStop(0, hexA(l.color, a));
      grd.addColorStop(1, hexA(l.color, 0));
      ctx.fillStyle = grd;
      this.pathLight(ctx, l, polys[k]);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }
}

const LIGHT_BLOCK = new Set(['#', 'B', 'M', 'K', 'P', 'E', 'd']);

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ───────── 시작 ─────────
async function boot() {
  const game = new Game();
  window.__game = game; // 디버그용
  window.__state = (await import('./state.js')).state;
  try { await Promise.race([document.fonts.ready, wait(2500)]); } catch (e) { /* noop */ }
  await loadAssets();
  const choice = await game.ui.title(hasSave());
  game.sfx.init();
  game.showTouch(true);
  if (choice === 'continue') await continueGame(game);
  else await startNewGame(game);
}

boot();
