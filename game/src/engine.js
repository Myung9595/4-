// 엔진 공용 유틸: 상수, 입력, 사운드(WebAudio 합성)

export const TILE = 32;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 타일 좌표 기반의 결정적 난수 (맵 장식이 매번 같게 그려지도록)
export function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

// ───────────────────────── 입력 ─────────────────────────
export class Input {
  constructor() {
    this.keys = new Set();
    this.touchVec = { x: 0, y: 0 };
    this.onPress = null; // (key) => boolean(consumed)
    // 한글 입력 상태에서도 동작하도록 글자 키는 물리 키 코드(e.code)로 읽는다
    const keyOf = (e) => (e.code && e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : (e.key.length === 1 ? e.key.toLowerCase() : e.key));
    window.addEventListener('keydown', (e) => {
      const k = keyOf(e);
      if (!e.repeat && this.onPress) {
        const consumed = this.onPress(k, e);
        if (consumed) e.preventDefault();
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'BUTTON' && tag !== 'INPUT') e.preventDefault();
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(keyOf(e));
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  axis() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has('a') || k.has('ArrowLeft')) x -= 1;
    if (k.has('d') || k.has('ArrowRight')) x += 1;
    if (k.has('w') || k.has('ArrowUp')) y -= 1;
    if (k.has('s') || k.has('ArrowDown')) y += 1;
    x += this.touchVec.x;
    y += this.touchVec.y;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  running() {
    return this.keys.has('Shift');
  }
}

// ───────────────────────── 사운드 (전부 합성) ─────────────────────────
export class Sfx {
  constructor() {
    this.ac = null;
    this.muted = false;
    this.loops = {};
  }

  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ac.destination);
    // 잔향 대용: 짧은 피드백 딜레이
    this.bus = this.ac.createGain();
    this.bus.connect(this.master);
    const len = this.ac.sampleRate * 4;
    this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.brownBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const b = this.brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      b[i] = last * 3.5;
    }
  }

  get ok() { return !!this.ac; }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ac.currentTime, 0.05);
  }

  tone(freq, dur, { type = 'sine', vol = 0.1, attack = 0.005, slide = null, delay = 0 } = {}) {
    if (!this.ok) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator();
    const g = this.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur, { vol = 0.1, freq = 800, q = 0.7, type = 'lowpass', brown = false, attack = 0.005, delay = 0 } = {}) {
    if (!this.ok) return;
    const t = this.ac.currentTime + delay;
    const src = this.ac.createBufferSource();
    src.buffer = brown ? this.brownBuf : this.noiseBuf;
    src.loop = true;
    const f = this.ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 2);
    src.stop(t + dur + 0.05);
  }

  step() { this.noise(0.07, { vol: 0.05, freq: 380 + Math.random() * 120 }); }
  blip() { this.tone(540 + Math.random() * 40, 0.025, { vol: 0.018, type: 'triangle' }); }
  pickup() { this.tone(660, 0.08, { vol: 0.06 }); this.tone(990, 0.12, { vol: 0.05, delay: 0.07 }); }
  deny() { this.tone(220, 0.12, { vol: 0.06, type: 'square' }); }
  ui() { this.tone(820, 0.04, { vol: 0.03, type: 'triangle' }); }
  notify() { this.tone(1046, 0.09, { vol: 0.05 }); this.tone(1318, 0.14, { vol: 0.05, delay: 0.1 }); }
  fail() { this.tone(392, 0.12, { vol: 0.05 }); this.tone(330, 0.2, { vol: 0.05, delay: 0.12 }); }

  // 재난문자 경보음 (특유의 거친 고음 반복)
  alert() {
    if (!this.ok) return;
    for (let i = 0; i < 6; i++) {
      this.tone(1850, 0.22, { type: 'square', vol: 0.06, delay: i * 0.32 });
      this.tone(925, 0.22, { type: 'sawtooth', vol: 0.04, delay: i * 0.32 });
    }
  }

  ring(times = 3) {
    for (let i = 0; i < times; i++) {
      this.tone(784, 0.18, { vol: 0.05, delay: i * 1.1 });
      this.tone(988, 0.18, { vol: 0.05, delay: i * 1.1 + 0.2 });
      this.tone(784, 0.18, { vol: 0.05, delay: i * 1.1 + 0.4 });
    }
  }

  // 낮게 오래 굴러오는 폭발음
  rumble() {
    if (!this.ok) return;
    this.noise(7.5, { vol: 0.9, freq: 70, brown: true, attack: 0.6 });
    this.noise(5, { vol: 0.35, freq: 160, brown: true, attack: 0.2, delay: 0.3 });
    this.tone(38, 6, { vol: 0.25, attack: 0.8, slide: 28 });
  }

  startLoop(name, build) {
    if (!this.ok || this.loops[name]) return;
    const out = this.ac.createGain();
    out.gain.value = 0;
    out.connect(this.bus);
    const nodes = build(this.ac, out);
    out.gain.setTargetAtTime(1, this.ac.currentTime, 0.4);
    this.loops[name] = { out, nodes };
  }

  stopLoop(name, fade = 0.4) {
    const l = this.loops[name];
    if (!l) return;
    const t = this.ac.currentTime;
    l.out.gain.cancelScheduledValues(t);
    l.out.gain.setTargetAtTime(0, t, fade);
    setTimeout(() => { l.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* noop */ } }); l.out.disconnect(); }, fade * 6000 + 200);
    delete this.loops[name];
  }

  stopAll(fade = 0.05) { Object.keys(this.loops).forEach((k) => this.stopLoop(k, fade)); }

  siren(on) {
    if (!on) return this.stopLoop('siren', 1.2);
    this.startLoop('siren', (ac, out) => {
      const g = ac.createGain(); g.gain.value = 0.07;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 560;
      const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 563;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.12;
      const lg = ac.createGain(); lg.gain.value = 230;
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(f); o2.connect(f); f.connect(g).connect(out);
      [o1, o2, lfo].forEach((n) => n.start());
      return [o1, o2, lfo];
    });
  }

  carAlarm(on) {
    if (!on) return this.stopLoop('car', 0.8);
    this.startLoop('car', (ac, out) => {
      const g = ac.createGain(); g.gain.value = 0.025;
      const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 820;
      const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 2.2;
      const lg = ac.createGain(); lg.gain.value = 160;
      lfo.connect(lg).connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
      o.connect(f).connect(g).connect(out);
      o.start(); lfo.start();
      return [o, lfo];
    });
  }

  hum(on) {
    if (!on) return this.stopLoop('hum', 0.3);
    this.startLoop('hum', (ac, out) => {
      const g = ac.createGain(); g.gain.value = 0.012;
      const o1 = ac.createOscillator(); o1.frequency.value = 120;
      const o2 = ac.createOscillator(); o2.frequency.value = 240; o2.type = 'triangle';
      o1.connect(g); o2.connect(g); g.connect(out);
      o1.start(); o2.start();
      return [o1, o2];
    });
  }

  murmur(on) {
    if (!on) return this.stopLoop('murmur', 0.8);
    this.startLoop('murmur', (ac, out) => {
      const src = ac.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.4;
      const g = ac.createGain(); g.gain.value = 0.05;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.31;
      const lg = ac.createGain(); lg.gain.value = 0.025;
      lfo.connect(lg).connect(g.gain);
      src.connect(f).connect(g).connect(out);
      src.start(); lfo.start();
      return [src, lfo];
    });
  }

  wind(on) {
    if (!on) return this.stopLoop('wind', 1);
    this.startLoop('wind', (ac, out) => {
      const src = ac.createBufferSource(); src.buffer = this.brownBuf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
      const g = ac.createGain(); g.gain.value = 0.18;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ac.createGain(); lg.gain.value = 0.1;
      lfo.connect(lg).connect(g.gain);
      src.connect(f).connect(g).connect(out);
      src.start(); lfo.start();
      return [src, lfo];
    });
  }

  dream(on) {
    if (!on) return this.stopLoop('dream', 1.5);
    this.startLoop('dream', (ac, out) => {
      const g = ac.createGain(); g.gain.value = 0.03;
      const notes = [220, 277.18, 329.63];
      const os = notes.map((n, i) => {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = n;
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
        const lg = ac.createGain(); lg.gain.value = 1.5;
        lfo.connect(lg).connect(o.frequency);
        o.connect(g); o.start(); lfo.start();
        return [o, lfo];
      }).flat();
      g.connect(out);
      return os;
    });
  }

  // 모든 소리를 순간 끊었다가 되돌림 (섬광 연출)
  silence(ms) {
    if (!this.ok) return;
    const t = this.ac.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(0, t);
    this.bus.gain.setTargetAtTime(1, t + ms / 1000, 0.6);
  }
  // ── 1차 개편 추가 효과음 ──
  chime() { this.tone(1318, 0.25, { vol: 0.05 }); this.tone(988, 0.4, { vol: 0.05, delay: 0.18 }); }
  beep() { this.tone(2093, 0.07, { vol: 0.05, type: 'square' }); }
  coin() { this.tone(1567, 0.06, { vol: 0.04 }); this.tone(2093, 0.1, { vol: 0.04, delay: 0.06 }); }
  tick() { this.tone(3000, 0.015, { vol: 0.03, type: 'square' }); }
  success() { this.tone(784, 0.08, { vol: 0.05 }); this.tone(1175, 0.14, { vol: 0.05, delay: 0.08 }); }
  glitch() {
    for (let i = 0; i < 6; i++) this.tone(200 + Math.random() * 1800, 0.04, { type: 'square', vol: 0.03, delay: i * 0.05 });
    this.noise(0.3, { vol: 0.08, freq: 3000, type: 'highpass' });
  }
  flap() { for (let i = 0; i < 14; i++) this.noise(0.05, { vol: 0.04, freq: 900 + Math.random() * 600, type: 'bandpass', q: 2, delay: i * 0.045 + Math.random() * 0.03 }); }
  glass(delay = 0) {
    this.noise(0.18, { vol: 0.09, freq: 4200, type: 'highpass', delay });
    for (let i = 0; i < 4; i++) this.tone(2400 + Math.random() * 2600, 0.12, { vol: 0.02, type: 'triangle', delay: delay + 0.02 + i * 0.03 });
  }
  thud() { this.noise(0.6, { vol: 0.7, freq: 90, brown: true }); this.tone(48, 0.5, { vol: 0.3, slide: 30 }); }
  // 이명: 다른 소리가 모두 끊긴 뒤에도 들리도록 master에 직접 연결
  tinnitus(sec = 7) {
    if (!this.ok) return;
    const t = this.ac.currentTime;
    const o = this.ac.createOscillator(); o.frequency.value = 6200;
    const o2 = this.ac.createOscillator(); o2.frequency.value = 6213;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
    o.connect(g); o2.connect(g); g.connect(this.master);
    o.start(t); o2.start(t); o.stop(t + sec + 0.1); o2.stop(t + sec + 0.1);
  }
  heartbeat(on) {
    if (!on) { clearInterval(this.hbTimer); this.hbTimer = null; return; }
    if (this.hbTimer) return;
    const beat = () => { this.noise(0.12, { vol: 0.35, freq: 70, brown: true }); this.noise(0.1, { vol: 0.22, freq: 70, brown: true, delay: 0.22 }); };
    beat();
    this.hbTimer = setInterval(beat, 820);
  }
  shop(on) { // 편의점의 잔잔한 배경음 (근무 파트)
    if (!on) return this.stopLoop('shop', 0.6);
    this.startLoop('shop', (ac, out) => {
      const g = ac.createGain(); g.gain.value = 0.018;
      const notes = [523.25, 659.25, 783.99, 659.25];
      const os = notes.map((n, i) => {
        const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = n / 2;
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.13 + i * 0.07;
        const lg = ac.createGain(); lg.gain.value = 0.5;
        const og = ac.createGain(); og.gain.value = 0.5;
        lfo.connect(lg).connect(og.gain); o.connect(og).connect(g);
        o.start(); lfo.start();
        return [o, lfo];
      }).flat();
      g.connect(out);
      return os;
    });
  }
}

// ───────────────────────── 음성 (임시 더빙: 브라우저 음성) ─────────────────────────
// 녹음 파일이 생기면 VOICE_FILES 에 경로를 넣으면 그 파일을 재생한다.
export const VOICE_FILES = {};
export class Voice {
  constructor(sfx) { this.sfx = sfx; this.current = null; }
  pick(role) {
    const ss = window.speechSynthesis;
    if (!ss) return null;
    const ko = ss.getVoices().filter((v) => /ko/i.test(v.lang));
    if (!ko.length) return null;
    const fem = ko.find((v) => /yuna|sunhi|heami|female|여/i.test(v.name));
    const male = ko.find((v) => /injoon|minsu|male|남/i.test(v.name));
    if (role === 'anchor') return fem || ko[0];
    if (role === 'dj' || role === 'reporter') return male || ko[0];
    return ko[0];
  }
  // 대사를 읽는다. 다 읽거나 skip()하면 끝난다. 음성이 없으면 글자 수만큼 기다린다.
  speak(text, role = 'anchor', key = null) {
    this.stop();
    const fallbackMs = Math.max(1600, text.length * 95);
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(this.t); this.current = null; resolve(); };
      this.current = finish;
      const muted = this.sfx.muted;
      if (key && VOICE_FILES[key] && !muted) {
        const a = new Audio(VOICE_FILES[key]);
        this.audio = a;
        a.onended = finish; a.onerror = () => { this.t = setTimeout(finish, fallbackMs); };
        a.play().catch(() => { this.t = setTimeout(finish, fallbackMs); });
        this.t = setTimeout(finish, fallbackMs * 2.5);
        return;
      }
      const ss = window.speechSynthesis;
      const v = !muted && ss && this.pick(role);
      if (!v) { this.t = setTimeout(finish, fallbackMs); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = v.lang;
      u.rate = role === 'dj' ? 0.95 : role === 'reporter' ? 1.12 : 1.05;
      u.pitch = role === 'dj' ? 0.85 : role === 'reporter' ? 0.95 : 1.05;
      u.volume = 0.9;
      u.onend = finish; u.onerror = finish;
      ss.speak(u);
      this.t = setTimeout(finish, fallbackMs * 2.5);
    });
  }
  stop() {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
    if (this.audio) { try { this.audio.pause(); } catch (e) { /* noop */ } this.audio = null; }
    if (this.current) { const f = this.current; this.current = null; f(); }
  }
}

