const { chromium } = require('playwright');
// 사용법: game 폴더에서 python3 -m http.server 8765 를 켠 뒤
//   node game/tools/playthrough_test.cjs <스크린샷 폴더>
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('http://127.0.0.1:8765/dist/index.html');
  await p.waitForTimeout(800);
  const shot = async (n) => { await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };
  const st = () => p.evaluate(() => { const g = window.__game, u = g.ui; return { dlg: u.dialogOpen, choices: document.querySelectorAll('.dlg-choices .choice').length, popup: u.popupOpen, card: u.cardOpen && !!u.cardClick, item: u.itemOpen, news: u.newsOpen, mg: u.modalKind === 'mg', busy: g.busy, scene: g.scene && g.scene.id, obj: window.__state.objective, text: document.querySelector('.dlg-text').textContent.slice(0, 40) }; });
  const pump = async (max = 80, pick = () => '1') => {
    for (let i = 0; i < max; i++) {
      const s = await st();
      if (s.news) await p.click('#news');
      else if (s.item) await p.click('#itemcard');
      else if (s.choices) await p.keyboard.press(pick(s));
      else if (s.dlg) { await p.keyboard.press('Enter'); await p.waitForTimeout(50); await p.keyboard.press('Enter'); }
      else if (s.popup) await p.keyboard.press('Enter');
      else if (s.card) await p.click('#card');
      else if (s.mg) return s;
      else if (!s.busy) return s;
      await p.waitForTimeout(220);
    }
    return st();
  };
  const tp = async (x, y) => { await p.evaluate(([x, y]) => { const g = window.__game; g.player.x = x * 32 + 16; g.player.y = y * 32 + 16; }, [x, y]); await p.waitForTimeout(150); };
  const use = async () => { await p.keyboard.press('e'); await p.waitForTimeout(350); };
  const clickSeq = async (sel) => { for (const s of sel) { await p.click(s); await p.waitForTimeout(120); } };

  await shot('a00_title');
  await p.click('#btn-new'); await p.waitForTimeout(1500);
  console.log(await pump());
  await shot('a01_shift');
  await tp(4, 2); await use(); await p.waitForTimeout(300); await shot('a02_restock');
  await clickSeq(['[data-i="2"]', '[data-i="0"]', '[data-i="1"]', '[data-i="3"]']);
  console.log(await pump());
  await tp(4, 4); await use(); await p.waitForTimeout(300); await shot('a03_waste');
  await clickSeq(['[data-i="0"]', '[data-i="2"]', '[data-i="4"]', '[data-act="ok"]']);
  await p.waitForTimeout(500); await pump(4); await p.waitForTimeout(200); await shot('a04_itemcard');
  console.log(await pump());
  await tp(4, 6); await use(); await p.waitForTimeout(300);
  await clickSeq(['[data-i="3"]', '[data-i="1"]', '[data-i="2"]', '[data-i="0"]']);
  console.log(await pump());
  await tp(11, 8); await use(); await p.keyboard.press('2'); console.log('stash', JSON.stringify(await pump(20))); await shot('b_stash_seen');
  for (let k = 0; k < 5; k++) {
    await p.evaluate(() => { const f = window.__state.flags; f.nextCustAt = Math.min(f.nextCustAt, f.shiftT + 0.5); });
    for (let t = 0; t < 80; t++) { const w = await p.evaluate(() => !!(window.__game.cust && window.__game.cust.waiting)); if (w) break; await p.waitForTimeout(200); }
    if (k === 0) { await tp(11, 9); await p.waitForTimeout(500); await shot('a05_customer'); }
    await tp(11, 8); await p.waitForTimeout(200);
    console.log('pre', k, JSON.stringify(await p.evaluate(() => { const g = window.__game; return { near: g.nearest && g.nearest.id, busy: g.busy, block: g.ui.blocking, mk: g.ui.modalKind, cust: g.cust && g.cust.name, waiting: g.cust && g.cust.waiting, px: g.player.x, py: g.player.y }; })));
    await use(); await p.waitForTimeout(300);
    if (k === 0) await shot('b_grandpa');
    await pump(60, () => '2');
    if (k === 3) await shot('a06_pos');
    const n = await p.$$eval('.mg-card', (x) => x.length);
    for (let i = 0; i < n; i++) await p.click(`[data-i="${i}"]`);
    if (!n) { await shot('dbg_' + k); console.log('NO POS', JSON.stringify(await st())); break; }
    await p.click('[data-act="pay"]');
    if (k === 2) { for (let t = 0; t < 30; t++) { const s = await st(); if (s.text.includes('일롱 머스크')) { await shot('b_minjae'); break; } if (s.dlg) await p.keyboard.press('Enter'); await p.waitForTimeout(250); } }
    console.log('cust', k, JSON.stringify(await pump(60, () => '1')));
    for (let t = 0; t < 40; t++) { const c = await p.evaluate(() => !!window.__game.cust); if (!c) break; await p.waitForTimeout(200); }
  }
  for (let t = 0; t < 80; t++) { const s = await st(); if (s.dlg || s.news) break; await p.waitForTimeout(200); }
  for (let t = 0; t < 30; t++) { const s = await st(); if (s.news) break; if (s.dlg) await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
  await p.waitForTimeout(800); await shot('a07_news1');
  await p.click('#news'); await p.waitForTimeout(600); await p.click('#news'); await p.waitForTimeout(900); await shot('a08_news3');
  console.log(JSON.stringify(await pump(220)));
  await shot('a09_street');
  await tp(14, 9); await tp(14, 8);
  await p.waitForTimeout(1300); await shot('a10_shadows');
  await p.waitForTimeout(2300); await shot('a11_title_white');
  await p.waitForTimeout(9000); console.log(JSON.stringify(await pump(20)));
  await shot('a12_clock');
  await p.waitForTimeout(14500); await shot('a13_wave');
  await p.waitForTimeout(900); await shot('a14_wave2');
  console.log(JSON.stringify(await pump(40)));
  await tp(20, 5); await p.waitForTimeout(500);
  console.log(JSON.stringify(await pump(40, () => '2')));
  await tp(24, 5); await p.waitForTimeout(3000); console.log(JSON.stringify(await pump(40)));
  await p.waitForTimeout(1500); console.log(JSON.stringify(await pump(40)));
  await shot('b_b2_arrival');
  await tp(16, 6); await use(); console.log(JSON.stringify(await pump(40, () => '2')));
  await tp(31, 11); await use(); console.log(JSON.stringify(await pump(40, () => '1')));
  await tp(6, 4); await use(); console.log(JSON.stringify(await pump(40, () => '1')));
  await tp(5, 7); await p.waitForTimeout(700); await shot('a15_b2_bubble');
  await p.keyboard.press('i'); await p.waitForTimeout(300); await shot('a16_bag'); await p.keyboard.press('Escape');
  await tp(30, 11); await use(); console.log(JSON.stringify(await pump(60, () => '1')));
  await p.waitForTimeout(2500); console.log(JSON.stringify(await pump(60)));
  await tp(1, 7); await use(); await p.waitForTimeout(1500); console.log(JSON.stringify(await pump(20)));
  await tp(3, 44); await p.keyboard.press('f'); await p.waitForTimeout(800); await shot('a17_stair_light');
  await tp(3, 18); await p.waitForTimeout(400); console.log(JSON.stringify(await pump(30)));
  await tp(1, 1); await use(); await p.waitForTimeout(1500); console.log(JSON.stringify(await pump(20)));
  await tp(11, 2); await use(); console.log(JSON.stringify(await pump(20))); await p.waitForTimeout(300); await shot('a18_drawer');
  console.log('ERRORS', JSON.stringify(errs, null, 1));
  await b.close();
})();
