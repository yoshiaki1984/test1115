(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const ROOT_HTML = $('app-root').innerHTML; // 公開用テンプレート（操作前の素の状態を保持）
  const el = {
    drawTitle: $('draw-title'), input: $('number'), clear: $('clear'), check: $('check'), notReg: $('not-registered'),
    stats: $('stats'), stTotal: $('st-total'), stGrand: $('st-grand'), stUpper: $('st-upper'),
    history: $('history'), historyList: $('history-list'), soundToggle: $('sound-toggle'),
    stage: $('stage'), phase: $('phase'), msg: $('msg'), reel: $('reel'), scan: $('scan'), sub: $('sub'), banner: $('banner'),
    result: $('result'), badge: $('badge'), rtitle: $('rtitle'), rnum: $('rnum'), prize: $('prize'), prizeName: $('prize-name'),
    note: $('note'), near: $('near'), again: $('again'), skip: $('skip'), fx: $('fx'),
    admin: $('admin'), adminOpen: $('admin-open'), admTitle: $('adm-title'), admFile: $('adm-file'), admFileLabel: $('adm-file-label'),
    admText: $('adm-text'), admParseText: $('adm-parse-text'), admMsg: $('adm-msg'), admPreview: $('adm-preview'), admEnv: $('adm-env'),
    admPublish: $('adm-publish'), admClear: $('adm-clear'), admClose: $('adm-close'),
  };
  const TIER_LABEL = { grand: '特賞', upper: '上位賞', regular: '当選' };
  const HISTORY_KEY = 'fukubiki.history';
  const SOUND_KEY = 'fukubiki.sound';
  const NEAR_RANGE = 1;

  // ---------------- データ ----------------
  let draw = { title: '', entries: [] };
  try { draw = JSON.parse($('winners-data').textContent || '{}'); } catch { draw = { title: '', entries: [] }; }
  if (!Array.isArray(draw.entries)) draw.entries = [];
  const byNumber = new Map();
  for (const e of draw.entries) { if (!byNumber.has(e.number)) byNumber.set(e.number, []); byNumber.get(e.number).push(e); }
  const registered = draw.entries.length > 0;

  function lookup(number) {
    const prizes = byNumber.get(number) || [];
    const near = [];
    if (prizes.length === 0) {
      for (let d = 1; d <= NEAR_RANGE; d++) {
        for (const n of [number - d, number + d]) for (const e of byNumber.get(n) || []) near.push(e);
      }
    }
    return { number, hit: prizes.length > 0, prizes, near };
  }

  function renderStatus() {
    if (registered) {
      const t = {}; for (const e of draw.entries) t[e.tier] = (t[e.tier] || 0) + 1;
      el.drawTitle.textContent = `${draw.title || '当選発表'}（全${draw.entries.length}本）`;
      el.stTotal.textContent = draw.entries.length; el.stGrand.textContent = t.grand || 0; el.stUpper.textContent = t.upper || 0;
      el.stats.hidden = false; el.notReg.hidden = true;
    } else {
      el.drawTitle.textContent = '当選番号 未登録';
      el.notReg.hidden = false; el.stats.hidden = true;
    }
    onInput();
  }
  function onInput() {
    const v = el.input.value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\D/g, '').slice(0, 6);
    if (v !== el.input.value) el.input.value = v;
    el.clear.hidden = v === '';
    el.check.disabled = !(registered && v.length > 0);
  }

  // ---------------- 照合＆演出 ----------------
  let running = false, skipRequested = false, reelTimer = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function wait(ms) { for (let t = 0; t < ms; t += 50) { if (skipRequested) return false; await sleep(Math.min(50, ms - t)); } return !skipRequested; }
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function setMsg(t) { el.msg.textContent = t; el.msg.classList.remove('pop'); void el.msg.offsetWidth; el.msg.classList.add('pop'); }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch { /* ignore */ } }

  async function startCheck() {
    if (running || el.check.disabled) return;
    const numberText = el.input.value;
    const number = parseInt(numberText, 10);
    if (!Number.isInteger(number)) return;
    running = true; skipRequested = false;
    sound.unlock(); el.input.blur();
    openStage();
    const result = lookup(number);
    try { await playSuspense(numberText, result); showResult(result); pushHistory(result); }
    finally { running = false; }
  }
  function openStage() {
    el.stage.hidden = false; el.stage.className = 'stage';
    el.result.hidden = true; el.phase.hidden = false; el.banner.hidden = true; el.scan.hidden = true; el.skip.hidden = true;
    el.sub.textContent = ''; el.near.hidden = true;
    document.body.style.overflow = 'hidden';
    fx.start();
    setTimeout(() => { if (running) el.skip.hidden = false; }, 1500);
  }
  function closeStage() {
    fx.stop(); el.stage.hidden = true; el.stage.className = 'stage';
    document.body.style.overflow = ''; el.input.value = ''; onInput(); el.input.focus();
  }
  async function playSuspense(numberText, result) {
    setMsg('照合開始…'); buildReel(numberText.length); sound.tickStart();
    if (!(await wait(700))) return;
    const digits = numberText.split('');
    for (let i = 0; i < digits.length; i++) {
      if (!(await wait(420 + i * 160 + (i === digits.length - 1 ? 500 : 0)))) return;
      lockDigit(i, digits[i]); vibrate(20); sound.lock(i);
    }
    sound.tickStop();
    if (!(await wait(500))) return;
    el.scan.hidden = false;
    for (const m of ['当選番号データベースと照合中…', '…', '……ん？', '反応あり……？']) { setMsg(m); if (!(await wait(rand(700, 1100)))) return; }
    const tier = result.hit ? result.prizes[0].tier : null;
    let reach;
    if (tier === 'grand') reach = 'super';
    else if (tier === 'upper') reach = 'hot';
    else if (tier === 'regular') reach = Math.random() < 0.7 ? 'hot' : 'warm';
    else reach = Math.random() < 0.3 ? 'hot' : Math.random() < 0.5 ? 'warm' : 'none';
    el.scan.hidden = true;
    if (reach === 'none') {
      setMsg('判定中……'); el.sub.textContent = pick(['心の準備はいいですか？', '深呼吸して……', '結果は……']); sound.heartbeat(3);
      if (!(await wait(1800))) return;
    } else if (reach === 'warm') {
      setMsg('…おや？'); el.sub.textContent = '何か引っかかりました……'; sound.heartbeat(4); vibrate([40, 80, 40]);
      if (!(await wait(2000))) return;
    } else if (reach === 'hot') {
      setMsg('！！！'); el.stage.classList.add('reach', 'shake'); el.banner.hidden = false; el.banner.firstElementChild.textContent = '激アツ!!';
      sound.siren(2.6); vibrate([60, 60, 60, 60, 120]);
      if (!(await wait(2600))) return;
      el.banner.hidden = true; el.stage.classList.remove('reach', 'shake');
      setMsg('運命の結果は……'); el.sub.textContent = ''; sound.heartbeat(3);
      if (!(await wait(1800))) return;
    } else {
      setMsg('！？！？'); el.stage.classList.add('reach'); el.banner.hidden = false; el.banner.firstElementChild.textContent = '激アツ!!';
      sound.siren(2); vibrate([80, 60, 80, 60, 160]);
      if (!(await wait(2000))) return;
      el.stage.classList.remove('reach'); el.stage.classList.add('super', 'shake'); el.banner.firstElementChild.textContent = '超激アツ!!!';
      sound.siren(2.8, 1.5); fx.sparkle(60);
      if (!(await wait(2800))) return;
      el.banner.hidden = true; el.stage.classList.remove('super', 'shake');
      setMsg('これは……まさか……'); sound.heartbeat(4);
      if (!(await wait(2400))) return;
    }
  }
  function buildReel(len) {
    el.reel.innerHTML = '';
    for (let i = 0; i < len; i++) { const d = document.createElement('div'); d.className = 'd spin'; d.textContent = String(Math.floor(Math.random() * 10)); el.reel.appendChild(d); }
    if (reelTimer) clearInterval(reelTimer);
    reelTimer = setInterval(() => { for (const d of el.reel.querySelectorAll('.d.spin')) d.textContent = String(Math.floor(Math.random() * 10)); }, 60);
  }
  function lockDigit(i, digit) {
    const d = el.reel.children[i]; if (!d) return;
    d.classList.remove('spin'); d.classList.add('lock'); d.textContent = digit;
    if (!el.reel.querySelector('.spin') && reelTimer) { clearInterval(reelTimer); reelTimer = null; }
  }
  function showResult(result) {
    if (reelTimer) { clearInterval(reelTimer); reelTimer = null; }
    sound.stopAll();
    el.banner.hidden = true; el.stage.classList.remove('reach', 'super', 'shake');
    el.phase.hidden = true; el.skip.hidden = true; el.result.hidden = false;
    el.rnum.innerHTML = `番号 <b>${result.number}</b>`;
    if (result.hit) {
      const tier = result.prizes[0].tier;
      el.stage.classList.add('win'); if (tier === 'grand') el.stage.classList.add('grand');
      el.badge.textContent = tier === 'regular' ? '🎉 WINNER 🎉' : `👑 ${TIER_LABEL[tier]} 👑`;
      el.rtitle.textContent = tier === 'grand' ? '特賞当選！！' : '当選！！';
      el.prizeName.textContent = result.prizes.map((p) => p.prize).join(' ／ ');
      el.prize.hidden = false;
      el.note.textContent = 'おめでとうございます！福引券は捨てずに、景品受け取り時にご提示ください。';
      el.near.hidden = true;
      vibrate(tier === 'grand' ? [100, 50, 100, 50, 300, 100, 500] : [80, 40, 80, 40, 200]);
      sound.fanfare(tier); fx.confetti(tier === 'grand' ? 3 : tier === 'upper' ? 2 : 1);
    } else {
      el.stage.classList.add('lose');
      el.badge.textContent = '残念…'; el.rtitle.textContent = '落選'; el.prize.hidden = true;
      el.note.textContent = pick(['今回はハズレでした。次のチャンスに期待！', 'おしい！運はきっと次に回ってきます。', 'ハズレ……でも、まだ諦めないで！']);
      if (result.near.length > 0) { const n = result.near[0]; el.near.textContent = `惜しい！ 隣の番号「${n.number}」は ${n.prize} が当たっていました…`; el.near.hidden = false; }
      else el.near.hidden = true;
      vibrate([200]); sound.lose(); fx.stop();
    }
  }

  // ---------------- 履歴（この端末のみ） ----------------
  function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
  function pushHistory(r) {
    const list = loadHistory().filter((h) => h.number !== r.number);
    list.unshift({ number: r.number, hit: r.hit, prize: r.hit ? r.prizes.map((p) => p.prize).join(' / ') : '', tier: r.hit ? r.prizes[0].tier : null });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10))); } catch { /* ignore */ }
    renderHistory();
  }
  function renderHistory() {
    const list = loadHistory();
    el.history.hidden = list.length === 0; el.historyList.innerHTML = '';
    for (const h of list) {
      const li = document.createElement('li');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = h.number;
      const t = document.createElement('span'); t.className = `tag ${h.hit ? 'win' : 'lose'}`; t.textContent = h.hit ? TIER_LABEL[h.tier] || '当選' : '落選';
      const p = document.createElement('span'); p.className = 'p'; p.textContent = h.prize;
      li.append(n, t, p); li.addEventListener('click', () => { el.input.value = String(h.number); onInput(); });
      el.historyList.appendChild(li);
    }
  }

  // ---------------- 効果音 ----------------
  const sound = {
    ctx: null, enabled: true, nodes: [], tickTimer: null,
    init() { try { this.enabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* ignore */ } this.render(); },
    render() { el.soundToggle.textContent = this.enabled ? '🔊' : '🔇'; el.soundToggle.setAttribute('aria-pressed', String(this.enabled)); },
    toggle() { this.enabled = !this.enabled; try { localStorage.setItem(SOUND_KEY, this.enabled ? 'on' : 'off'); } catch { /* ignore */ } if (!this.enabled) this.stopAll(); this.render(); this.unlock(); },
    unlock() { if (!this.enabled) return; try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch { this.ctx = null; } },
    tone({ type = 'sine', freq = 440, freqEnd = null, dur = 0.2, gain = 0.2, at = 0 }) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
      this.nodes.push(o); o.onended = () => { this.nodes = this.nodes.filter((n) => n !== o); };
    },
    tickStart() { this.tickStop(); let period = 70; const loop = () => { this.tone({ type: 'square', freq: 1200, dur: 0.03, gain: 0.05 }); period = Math.min(period + 1.5, 140); this.tickTimer = setTimeout(loop, period); }; loop(); },
    tickStop() { if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; } },
    lock(i) { this.tone({ type: 'triangle', freq: 660 + i * 110, dur: 0.15, gain: 0.25 }); },
    heartbeat(n) { for (let i = 0; i < n; i++) { this.tone({ freq: 70, freqEnd: 45, dur: 0.18, gain: 0.5, at: i * 0.6 }); this.tone({ freq: 60, freqEnd: 40, dur: 0.15, gain: 0.35, at: i * 0.6 + 0.22 }); } },
    siren(sec, pitch = 1) { const n = Math.floor(sec / 0.3); for (let i = 0; i < n; i++) { this.tone({ type: 'sawtooth', freq: 500 * pitch, freqEnd: 1000 * pitch, dur: 0.15, gain: 0.12, at: i * 0.3 }); this.tone({ type: 'sawtooth', freq: 1000 * pitch, freqEnd: 500 * pitch, dur: 0.15, gain: 0.12, at: i * 0.3 + 0.15 }); } },
    fanfare(tier) {
      const notes = tier === 'grand' ? [523, 659, 784, 1047, 784, 1047, 1319, 1568] : tier === 'upper' ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
      notes.forEach((f, i) => { this.tone({ type: 'triangle', freq: f, dur: 0.22, gain: 0.3, at: i * 0.13 }); this.tone({ type: 'square', freq: f / 2, dur: 0.22, gain: 0.08, at: i * 0.13 }); });
      const end = notes.length * 0.13; [523, 659, 784, 1047].forEach((f) => this.tone({ type: 'triangle', freq: f, dur: 1.2, gain: 0.18, at: end }));
    },
    lose() { this.tone({ freq: 330, freqEnd: 250, dur: 0.35, gain: 0.3 }); this.tone({ freq: 250, freqEnd: 180, dur: 0.6, gain: 0.3, at: 0.35 }); },
    stopAll() { this.tickStop(); for (const n of this.nodes) { try { n.stop(); } catch { /* ignore */ } } this.nodes = []; },
  };

  // ---------------- 紙吹雪 ----------------
  const fx = {
    canvas: el.fx, ctx: el.fx.getContext('2d'), particles: [], raf: null, running: false,
    resize() { const dpr = Math.min(window.devicePixelRatio || 1, 2); this.canvas.width = this.canvas.clientWidth * dpr; this.canvas.height = this.canvas.clientHeight * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
    start() { this.resize(); this.particles = []; if (!this.running) { this.running = true; this.loop(); } },
    stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; this.particles = []; this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight); },
    confetti(level) {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      const colors = level >= 3 ? ['#ff3b5c', '#f5c542', '#35e0a1', '#4fa3ff', '#ff6ec7', '#ffffff'] : ['#f5c542', '#ffe28a', '#ff8a3d', '#ffffff', '#ff6ec7'];
      for (let i = 0; i < 80 * level + 60; i++) this.particles.push({ x: w / 2 + rand(-40, 40), y: h * 0.45, vx: rand(-9, 9) * (0.6 + level * 0.3), vy: rand(-16, -5) * (0.7 + level * 0.25), g: 0.35, size: rand(5, 10), rot: rand(0, 6.28), vr: rand(-0.3, 0.3), color: pick(colors), life: rand(120, 220), shape: Math.random() < 0.5 ? 'rect' : 'circle' });
      if (level >= 2) {
        const rain = () => { if (!this.running) return; for (let i = 0; i < 6 * level; i++) this.particles.push({ x: rand(0, w), y: -10, vx: rand(-1, 1), vy: rand(2, 5), g: 0.05, size: rand(4, 9), rot: rand(0, 6), vr: rand(-0.2, 0.2), color: pick(colors), life: 260, shape: 'rect' }); };
        for (let k = 0; k < 6 * level; k++) setTimeout(rain, k * 350);
      }
    },
    sparkle(n) { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; for (let i = 0; i < n; i++) this.particles.push({ x: rand(0, w), y: rand(0, h), vx: rand(-1, 1), vy: rand(-2, 0), g: 0, size: rand(2, 5), rot: 0, vr: 0, color: pick(['#ffe28a', '#ffffff', '#f5c542']), life: rand(30, 70), shape: 'circle' }); },
    loop() {
      if (!this.running) return;
      const c = this.ctx, w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      c.clearRect(0, 0, w, h);
      this.particles = this.particles.filter((p) => p.life > 0 && p.y < h + 20);
      for (const p of this.particles) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--; p.vx *= 0.99;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, p.life / 40); c.fillStyle = p.color;
        if (p.shape === 'rect') c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, 6.28); c.fill(); }
        c.restore();
      }
      this.raf = requestAnimationFrame(() => this.loop());
    },
  };

  // ---------------- PDF解析（昨年の発表PDFと同じ2列表レイアウト） ----------------
  const NUMBER_COL_MAX_X = 72, SAME_LINE = 2.5, ABOVE_EPS = 6, MAX_CELL = 30, GAP_SPACE = 2.5;
  async function parseWinnersPdf(arrayBuffer) {
    if (!window.pdfjsLib) throw new Error('PDF読み取りライブラリを読み込めませんでした。通信環境を確認して再読み込みしてください。');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer), isEvalSupported: false }).promise;
    const entries = [], warnings = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const h = page.getViewport({ scale: 1 }).height;
      entries.push(...extractPage(content.items, h, p, warnings));
    }
    return { entries: assignTiers(entries), warnings, pageCount: doc.numPages };
  }
  function mergeLines(frags) {
    const sorted = [...frags].sort((a, b) => a.y - b.y || a.x - b.x); const lines = [];
    for (const f of sorted) { const last = lines[lines.length - 1]; if (last && Math.abs(last.y - f.y) <= SAME_LINE) last.parts.push(f); else lines.push({ y: f.y, parts: [f] }); }
    return lines.map((l) => { let text = '', prevEnd = null; for (const p of l.parts.sort((a, b) => a.x - b.x)) { if (prevEnd !== null && p.x - prevEnd > GAP_SPACE) text += ' '; text += p.text; prevEnd = p.x + p.width; } return { y: l.y, text: text.replace(/\s+/g, ' ').trim() }; });
  }
  function parseNumber(text) { const n = text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[^\d]/g, ''); if (n === '' || !/^\s*[\d０-９\s,]+\s*$/.test(text)) return null; return parseInt(n, 10); }
  function extractPage(items, pageHeight, pageNo, warnings) {
    const frags = items.filter((it) => it.str && it.str.trim() !== '').map((it) => ({ x: it.transform[4], y: pageHeight - it.transform[5], width: it.width || 0, text: it.str }));
    const numbers = mergeLines(frags.filter((f) => f.x < NUMBER_COL_MAX_X)).map((l) => ({ y: l.y, number: parseNumber(l.text), names: [] })).filter((n) => n.number !== null).sort((a, b) => a.y - b.y);
    const names = mergeLines(frags.filter((f) => f.x >= NUMBER_COL_MAX_X)).filter((l) => { const t = l.text.replace(/\s/g, ''); return t !== '' && t !== '当選番号' && t !== '品名' && t !== '品' && t !== '名'; });
    let lastOwner = null;
    for (const line of names) {
      let owner = numbers.find((n) => n.y >= line.y - ABOVE_EPS && n.y - line.y <= MAX_CELL);
      if (!owner) { let best = null; for (const n of numbers) { const d = Math.abs(n.y - line.y); if (d <= MAX_CELL && (!best || d < best.d)) best = { n, d }; } owner = best ? best.n : lastOwner; }
      if (!owner) { warnings.push(`p${pageNo}: 番号に対応付けできない品名を無視: "${line.text}"`); continue; }
      owner.names.push(line); lastOwner = owner;
    }
    const out = [];
    for (const n of numbers) { const prize = n.names.sort((a, b) => a.y - b.y).map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim(); if (prize === '') warnings.push(`p${pageNo}: 番号 ${n.number} に品名がありません`); else out.push({ number: n.number, prize }); }
    return out;
  }
  function assignTiers(entries) {
    let start = entries.length - 1;
    while (start > 0 && entries[start - 1].number < entries[start].number) start--;
    return entries.map((e, i) => { let tier = i >= start ? 'regular' : 'upper'; if (/【\s*特賞\s*】/.test(e.prize)) tier = 'grand'; return { number: e.number, prize: e.prize, tier }; });
  }
  function parseWinnersText(text) {
    const entries = [], warnings = [];
    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim(); if (!line || line.startsWith('#')) return;
      const m = line.match(/^([０-９\d]+)\s*[,\t、]?\s*(.+)$/);
      if (!m) { warnings.push(`${i + 1}行目を無視: "${line}"`); return; }
      entries.push({ number: parseInt(m[1].replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)), 10), prize: m[2].replace(/^["']|["']$/g, '').trim() });
    });
    return { entries: assignTiers(entries), warnings, pageCount: null };
  }

  // ---------------- 管理（このページを再公開する） ----------------
  let artifactApi = null, pending = null;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function admMsg(text, kind) { el.admMsg.innerHTML = text ? `<div class="amsg ${kind}">${esc(text)}</div>` : ''; }
  function renderPreview(r) {
    const t = {}; for (const e of r.entries) t[e.tier] = (t[e.tier] || 0) + 1;
    const seen = new Map(); for (const e of r.entries) seen.set(e.number, (seen.get(e.number) || 0) + 1);
    const dups = [...seen].filter(([, c]) => c > 1).map(([n]) => n);
    const warn = [...r.warnings]; if (dups.length) warn.unshift(`重複している番号: ${dups.join(', ')}`);
    const rows = r.entries.slice(0, 40).map((e) => `<tr><td>${e.number}<span class="tier ${e.tier}">${TIER_LABEL[e.tier] === '当選' ? '一般' : TIER_LABEL[e.tier]}</span></td><td>${esc(e.prize)}</td></tr>`).join('');
    el.admPreview.innerHTML = `${warn.length ? `<div class="amsg warn">${warn.map(esc).join('<br>')}</div>` : ''}<p style="font-size:13px;color:var(--muted);margin:12px 0 0">読み取り ${r.entries.length} 件${r.pageCount ? `（${r.pageCount}ページ）` : ''}: 特賞 ${t.grand || 0} / 上位賞 ${t.upper || 0} / 一般 ${t.regular || 0}</p><div class="pv"><table><tbody>${rows}</tbody></table></div>${r.entries.length > 40 ? `<p style="font-size:12px;color:var(--muted)">…他 ${r.entries.length - 40} 件</p>` : ''}`;
  }
  function buildPageHtml(newDraw) {
    const json = JSON.stringify(newDraw).replace(/<\//g, '<\\/');
    const css = $('app-css').textContent;
    const app = $('app').textContent;
    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<title>福引ドキドキ照合</title>
<meta name="theme-color" content="#12081f">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style id="app-css">${css}</style>
</head>
<body>
<div class="glow" aria-hidden="true"></div>
<div id="app-root">${ROOT_HTML}</div>
<script id="winners-data" type="application/json">${json}<\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
<script id="app">${app}<\/script>
</body>
</html>
`;
  }
  async function publishDraw(newDraw, doneText) {
    if (!artifactApi) { admMsg('この画面からは公開できません。claude.ai で開いた自分のページからお試しください。', 'err'); return; }
    el.admPublish.disabled = true; el.admClear.disabled = true;
    admMsg('公開しています…', 'ok');
    try {
      try { sessionStorage.setItem('fukubiki.published', doneText); } catch { /* ignore */ }
      await artifactApi.publish(buildPageHtml(newDraw));
      admMsg(doneText, 'ok');
    } catch (err) {
      const code = err && err.code;
      if (code === 'conflict') admMsg('他の人が先に更新しました。最新のページに切り替わります。', 'warn');
      else if (code === 'not_writer' || code === 'not_granted') admMsg('このページの編集権限がありません（閲覧専用）。作成者のアカウントで開いてください。', 'err');
      else if (code === 'too_large') admMsg('データが大きすぎて公開できません。', 'err');
      else admMsg(`公開に失敗しました: ${(err && err.message) || code || '不明なエラー'}`, 'err');
      el.admPublish.disabled = !pending; el.admClear.disabled = false;
    }
  }
  function setPending(r, defaultTitle) {
    pending = r; renderPreview(r);
    if (!el.admTitle.value.trim() && defaultTitle) el.admTitle.value = defaultTitle;
    el.admPublish.disabled = r.entries.length === 0 || !artifactApi;
    admMsg(r.entries.length ? `${r.entries.length} 件を読み取りました。内容を確認して「この内容で公開する」を押してください。` : '当選番号を1件も読み取れませんでした。レイアウトが昨年と同じか確認するか、テキストから登録してください。', r.entries.length ? 'ok' : 'err');
  }
  function initAdmin() {
    el.adminOpen.addEventListener('click', () => { el.admin.hidden = !el.admin.hidden; if (!el.admin.hidden) el.admin.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el.admClose.addEventListener('click', () => { el.admin.hidden = true; });
    el.admFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      el.admFileLabel.textContent = `📄 ${file.name} (${Math.round(file.size / 1024)} KB)`;
      admMsg('PDFを解析しています…', 'ok'); el.admPreview.innerHTML = ''; pending = null; el.admPublish.disabled = true;
      try { const r = await parseWinnersPdf(await file.arrayBuffer()); setPending(r, `${new Date().getFullYear()}年 当選発表`); }
      catch (err) { admMsg(`PDFを読み取れませんでした: ${err.message}`, 'err'); }
    });
    el.admParseText.addEventListener('click', () => { setPending(parseWinnersText(el.admText.value), `${new Date().getFullYear()}年 当選発表`); });
    el.admPublish.addEventListener('click', () => {
      if (!pending || !pending.entries.length) return;
      if (!confirm(`現在の当選リストを ${pending.entries.length} 件の新しい内容で置き換えて公開します。よろしいですか？`)) return;
      publishDraw({ title: el.admTitle.value.trim() || `${new Date().getFullYear()}年 当選発表`, updatedAt: new Date().toISOString(), entries: pending.entries }, `公開しました（${pending.entries.length}件）。ページが更新されます。`);
    });
    el.admClear.addEventListener('click', () => {
      if (!confirm('登録されている当選番号を消して「未登録」状態で公開します。よろしいですか？')) return;
      publishDraw({ title: '', updatedAt: new Date().toISOString(), entries: [] }, '登録を消して公開しました。');
    });
    try { const m = sessionStorage.getItem('fukubiki.published'); if (m) { sessionStorage.removeItem('fukubiki.published'); el.admin.hidden = false; admMsg(m, 'ok'); } } catch { /* ignore */ }
    const use = window.claude && typeof window.claude.use === 'function' ? window.claude.use('artifact') : Promise.resolve(null);
    use.then((api) => {
      artifactApi = api;
      el.admEnv.hidden = !!api;
      el.admPublish.disabled = !api || !pending || !pending.entries.length;
    }).catch(() => { artifactApi = null; el.admEnv.hidden = false; });
  }

  // ---------------- 初期化 ----------------
  renderStatus(); renderHistory(); sound.init(); initAdmin();
  el.input.addEventListener('input', onInput);
  el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); startCheck(); } });
  el.clear.addEventListener('click', () => { el.input.value = ''; onInput(); el.input.focus(); });
  el.check.addEventListener('click', startCheck);
  el.again.addEventListener('click', closeStage);
  el.skip.addEventListener('click', () => { skipRequested = true; });
  el.soundToggle.addEventListener('click', () => sound.toggle());
  window.addEventListener('resize', () => { if (fx.running) fx.resize(); });
})();
