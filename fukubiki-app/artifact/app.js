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
    note: $('note'), near: $('near'), soundHint: $('sound-hint'), again: $('again'), skip: $('skip'), fx: $('fx'),
    admin: $('admin'), adminOpen: $('admin-open'), admTitle: $('adm-title'), admFile: $('adm-file'), admFileLabel: $('adm-file-label'),
    admText: $('adm-text'), admParseText: $('adm-parse-text'), admMsg: $('adm-msg'), admPreview: $('adm-preview'), admEnv: $('adm-env'),
    admPublish: $('adm-publish'), admClear: $('adm-clear'), admClose: $('adm-close'),
  };
  const TIER_LABEL = { grand: '特賞', upper: '上位賞', regular: '当選' };
  const HISTORY_KEY = 'fukubiki.history';
  const SOUND_KEY = 'fukubiki.sound';
  const NEAR_RANGE = 1;
  const SILENT_WAV = 'data:audio/wav;base64,UklGRsQPAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAPAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

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
    fx.stop(); sound.stopMedia(); el.stage.hidden = true; el.stage.className = 'stage';
    document.body.style.overflow = ''; el.input.value = ''; onInput(); el.input.focus();
  }
  async function playSuspense(numberText, result) {
    setMsg('照合開始…'); buildReel(numberText.length); sound.spinStart();
    if (!(await wait(700))) return;
    const digits = numberText.split('');
    for (let i = 0; i < digits.length; i++) {
      if (!(await wait(420 + i * 160 + (i === digits.length - 1 ? 500 : 0)))) return;
      lockDigit(i, digits[i]); vibrate(20); sound.lock(i);
    }
    sound.cut();
    if (!(await wait(500))) return;
    el.scan.hidden = false; sound.scan();
    for (const m of ['当選番号データベースと照合中…', '…', '……ん？', '反応あり……？']) { setMsg(m); if (!(await wait(rand(700, 1100)))) return; }
    const tier = result.hit ? result.prizes[0].tier : null;
    let reach;
    if (tier === 'grand') reach = 'super';
    else if (tier === 'upper') reach = 'hot';
    else if (tier === 'regular') reach = Math.random() < 0.7 ? 'hot' : 'warm';
    else reach = Math.random() < 0.3 ? 'hot' : Math.random() < 0.5 ? 'warm' : 'none';
    el.scan.hidden = true;
    if (reach === 'none') {
      setMsg('判定中……'); el.sub.textContent = pick(['心の準備はいいですか？', '深呼吸して……', '結果は……']); sound.tension(1.8, false);
      if (!(await wait(1800))) return;
    } else if (reach === 'warm') {
      setMsg('…おや？'); el.sub.textContent = '何か引っかかりました……'; sound.tension(2.0, true); vibrate([40, 80, 40]);
      if (!(await wait(2000))) return;
    } else if (reach === 'hot') {
      setMsg('！！！'); el.stage.classList.add('reach', 'shake'); el.banner.hidden = false; el.banner.firstElementChild.textContent = '激アツ!!';
      sound.hot(2.6, 1); vibrate([60, 60, 60, 60, 120]);
      if (!(await wait(2600))) return;
      el.banner.hidden = true; el.stage.classList.remove('reach', 'shake');
      setMsg('運命の結果は……'); el.sub.textContent = ''; sound.tension(1.8, true);
      if (!(await wait(1800))) return;
    } else {
      setMsg('！？！？'); el.stage.classList.add('reach'); el.banner.hidden = false; el.banner.firstElementChild.textContent = '激アツ!!';
      sound.hot(2, 1); vibrate([80, 60, 80, 60, 160]);
      if (!(await wait(2000))) return;
      el.stage.classList.remove('reach'); el.stage.classList.add('super', 'shake'); el.banner.firstElementChild.textContent = '超激アツ!!!';
      sound.hot(2.8, 2); fx.sparkle(60);
      if (!(await wait(2800))) return;
      el.banner.hidden = true; el.stage.classList.remove('super', 'shake');
      setMsg('これは……まさか……'); sound.tension(2.4, true);
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

  // ---------------- 効果音（Web Audio 合成・パチスロ風） ----------------
  const sound = {
    ctx: null, master: null, comp: null, reverb: null, delay: null, noiseBuf: null, media: null,
    enabled: true, nodes: [], timers: [],
    init() { try { this.enabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* ignore */ } this.render(); },
    render() { el.soundToggle.textContent = this.enabled ? '🔊' : '🔇'; el.soundToggle.setAttribute('aria-pressed', String(this.enabled)); },
    toggle() { this.enabled = !this.enabled; try { localStorage.setItem(SOUND_KEY, this.enabled ? 'on' : 'off'); } catch { /* ignore */ } if (!this.enabled) this.stopAll(); this.render(); this.unlock(); if (this.enabled) this.coin(0, 1); },
    unlock() {
      if (!this.enabled) return;
      try {
        if (!this.ctx) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.ctx = ctx;
          this.comp = ctx.createDynamicsCompressor();
          this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 8; this.comp.attack.value = 0.003; this.comp.release.value = 0.2;
          this.master = ctx.createGain(); this.master.gain.value = 1.0;
          this.master.connect(this.comp); this.comp.connect(ctx.destination);
          // リバーブ（減衰ノイズのインパルス）
          const len = Math.floor(ctx.sampleRate * 1.8); const ir = ctx.createBuffer(2, len, ctx.sampleRate);
          for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
          this.reverb = ctx.createConvolver(); this.reverb.buffer = ir;
          const rg = ctx.createGain(); rg.gain.value = 0.35; this.reverb.connect(rg); rg.connect(this.master);
          // ディレイ（エコー）
          this.delay = ctx.createDelay(1); this.delay.delayTime.value = 0.18;
          const fb = ctx.createGain(); fb.gain.value = 0.35; const dg = ctx.createGain(); dg.gain.value = 0.3;
          this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(dg); dg.connect(this.master);
          // ノイズ
          const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = nb.getChannelData(0);
          for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
          this.noiseBuf = nb;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch { this.ctx = null; }
      // iPhoneのサイレントスイッチ対策: 無音のメディアを再生して「再生」カテゴリに切り替える
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ignore */ }
      try {
        if (!this.media) { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); a.loop = true; a.src = SILENT_WAV; this.media = a; }
        const p = this.media.play(); if (p && p.catch) p.catch(() => {});
      } catch { /* ignore */ }
      setTimeout(() => { el.soundHint.hidden = !(this.enabled && (!this.ctx || this.ctx.state !== 'running')); }, 600);
    },
    get now() { return this.ctx ? this.ctx.currentTime : 0; },
    track(n) { this.nodes.push(n); n.onended = () => { const i = this.nodes.indexOf(n); if (i >= 0) this.nodes.splice(i, 1); }; return n; },
    out(g, { reverb = 0, delay = 0 } = {}) {
      g.connect(this.master);
      if (reverb > 0) { const s = this.ctx.createGain(); s.gain.value = reverb; g.connect(s); s.connect(this.reverb); }
      if (delay > 0) { const s = this.ctx.createGain(); s.gain.value = delay; g.connect(s); s.connect(this.delay); }
    },
    /** 基本オシレータ音。at は現在時刻からの秒。 */
    tone({ type = 'sine', freq = 440, freqEnd = null, dur = 0.2, gain = 0.2, at = 0, attack = 0.01, detune = 0, reverb = 0, delay = 0, lp = 0, vib = 0 }) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.now + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.detune.value = detune; o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      if (vib > 0) { const l = this.ctx.createOscillator(), lg = this.ctx.createGain(); l.frequency.value = 6; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.1); this.track(l); }
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let last = o;
      if (lp > 0) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t0); f.frequency.exponentialRampToValueAtTime(Math.max(200, lp / 6), t0 + dur); f.Q.value = 4; o.connect(f); last = f; }
      last.connect(g); this.out(g, { reverb, delay });
      o.start(t0); o.stop(t0 + dur + 0.05); this.track(o);
    },
    /** ノイズ音（スネア・シンバル・ライザー等） */
    noise({ dur = 0.2, gain = 0.2, at = 0, hp = 1000, hpEnd = null, bp = 0, reverb = 0, attack = 0.005 }) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.now + at, s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = bp ? 'bandpass' : 'highpass'; f.frequency.setValueAtTime(bp || hp, t0); f.Q.value = bp ? 1.2 : 0.7;
      if (hpEnd) f.frequency.exponentialRampToValueAtTime(hpEnd, t0 + dur);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); this.out(g, { reverb });
      s.start(t0); s.stop(t0 + dur + 0.05); this.track(s);
    },
    kick(at, gain = 0.9) { this.tone({ freq: 160, freqEnd: 42, dur: 0.22, gain, at, attack: 0.002 }); this.noise({ dur: 0.03, gain: 0.25, at, hp: 3000 }); },
    snare(at, gain = 0.5) { this.noise({ dur: 0.14, gain, at, hp: 1500, reverb: 0.4 }); this.tone({ type: 'triangle', freq: 220, freqEnd: 120, dur: 0.1, gain: gain * 0.6, at }); },
    hat(at, gain = 0.18, dur = 0.04) { this.noise({ dur, gain, at, hp: 7000 }); },
    crash(at, gain = 0.6) { this.noise({ dur: 1.6, gain, at, hp: 4000, hpEnd: 2500, reverb: 0.8, attack: 0.002 }); this.noise({ dur: 0.6, gain: gain * 0.6, at, bp: 6000 }); },
    coin(at, n = 1) { for (let i = 0; i < n; i++) { const f = 1568 + Math.random() * 600; this.tone({ type: 'square', freq: f, dur: 0.08, gain: 0.12, at: at + i * 0.07 }); this.tone({ type: 'square', freq: f * 1.5, dur: 0.3, gain: 0.12, at: at + i * 0.07 + 0.06, reverb: 0.3 }); } },
    stab(at, base = 523, gain = 0.5) { // 「ジャキーン」金属的スタブ
      for (const r of [1, 1.5, 2, 3]) { this.tone({ type: 'sawtooth', freq: base * r, dur: 0.5, gain: gain * 0.25, at, detune: 8, lp: 6000, reverb: 0.7, delay: 0.5 }); this.tone({ type: 'square', freq: base * r, dur: 0.5, gain: gain * 0.15, at, detune: -8, lp: 5000 }); }
      this.noise({ dur: 0.25, gain: gain * 0.5, at, hp: 5000, reverb: 0.6 });
    },
    brass(freq, dur, at, gain = 0.5) { // ブラス風（ノコギリ波×3をデチューン＋ローパス）
      for (const d of [-10, 0, 10]) this.tone({ type: 'sawtooth', freq, dur, gain: gain / 3, at, detune: d, attack: 0.03, lp: 4500, reverb: 0.5 });
      this.tone({ type: 'square', freq: freq / 2, dur, gain: gain * 0.25, at, attack: 0.03, lp: 1200 });
    },
    /** テンポ付きビート。秒数分をまとめてスケジュール。 */
    beat({ bpm, sec, at = 0, kick = true, hats = true, snare = false, bass = 0, accel = 0 }) {
      let t = at, i = 0;
      while (t < at + sec) {
        const spb = 60 / (bpm + accel * (t - at));
        if (kick && i % 2 === 0) this.kick(t, 0.8);
        if (snare && i % 4 === 2) this.snare(t, 0.4);
        if (hats) this.hat(t, i % 2 ? 0.12 : 0.2);
        if (bass && i % 2 === 0) this.tone({ type: 'sawtooth', freq: bass, dur: spb * 0.9, gain: 0.35, at: t, lp: 700 });
        t += spb / 2; i++;
      }
    },
    // ---- フェーズ別 ----
    spinStart() { // リール回転: ビート + 加速するカチカチ
      this.cut();
      this.beat({ bpm: 128, sec: 6, kick: true, hats: true, bass: 55, accel: 4 });
      let t = 0, period = 0.055;
      while (t < 6) { this.tone({ type: 'square', freq: 1400 + Math.random() * 400, dur: 0.03, gain: 0.14, at: t }); t += period; period = Math.min(period + 0.0009, 0.13); }
      this.noise({ dur: 6, gain: 0.05, at: 0, hp: 400, hpEnd: 6000 });
    },
    lock(i) { // 桁確定「ガチン！」
      this.kick(0, 1); this.noise({ dur: 0.12, gain: 0.5, at: 0, hp: 2500, reverb: 0.5 });
      this.tone({ type: 'triangle', freq: 880 + i * 220, dur: 0.35, gain: 0.5, at: 0, reverb: 0.5 });
      this.tone({ type: 'square', freq: 1760 + i * 440, dur: 0.18, gain: 0.2, at: 0.02, delay: 0.4 });
    },
    scan() { // データベース照合: 速いビート + レーザー + ピピッ
      this.cut();
      this.beat({ bpm: 150, sec: 6, kick: true, hats: true, snare: true, bass: 62 });
      for (let t = 0; t < 6; t += 0.8) { this.tone({ type: 'sawtooth', freq: 300, freqEnd: 3000, dur: 0.35, gain: 0.18, at: t, delay: 0.6, lp: 8000 }); this.tone({ type: 'square', freq: 2200, dur: 0.05, gain: 0.15, at: t + 0.4 }); this.tone({ type: 'square', freq: 2600, dur: 0.05, gain: 0.15, at: t + 0.5 }); }
    },
    tension(sec, strong) { // 判定中: 心音 + 上昇ドローン + 末尾でスネアロール
      this.cut();
      for (let t = 0; t < sec; t += 0.62) { this.tone({ freq: 75, freqEnd: 42, dur: 0.2, gain: 0.9, at: t, attack: 0.003 }); this.tone({ freq: 65, freqEnd: 38, dur: 0.16, gain: 0.6, at: t + 0.24, attack: 0.003 }); }
      this.tone({ type: 'sawtooth', freq: 110, freqEnd: strong ? 330 : 220, dur: sec, gain: 0.22, at: 0, lp: 1500, attack: 0.5 });
      if (strong) this.tone({ type: 'sine', freq: 1200, freqEnd: 2400, dur: sec, gain: 0.08, at: 0, vib: 30 });
      this.drumroll(sec - 1.2, 1.2);
    },
    hot(sec, level) { // 激アツ: サイレン + ピピピピ + 4つ打ち + ライザー
      this.cut();
      const pitch = level === 2 ? 1.5 : 1;
      this.beat({ bpm: level === 2 ? 175 : 160, sec, kick: true, hats: true, snare: true, bass: level === 2 ? 82 : 65 });
      for (let t = 0; t < sec; t += 0.36) { this.tone({ type: 'sawtooth', freq: 520 * pitch, freqEnd: 1040 * pitch, dur: 0.18, gain: 0.2, at: t, lp: 6000 }); this.tone({ type: 'sawtooth', freq: 1040 * pitch, freqEnd: 520 * pitch, dur: 0.18, gain: 0.2, at: t + 0.18, lp: 6000 }); }
      for (let t = 0; t < sec; t += 0.09) this.tone({ type: 'square', freq: (t % 0.36 < 0.18 ? 3100 : 2600) * pitch, dur: 0.045, gain: 0.13, at: t });
      this.noise({ dur: sec, gain: 0.18, at: 0, hp: 300, hpEnd: 9000, attack: sec * 0.7 });
      this.stab(0, 523 * pitch, 0.7); this.stab(sec * 0.5, 659 * pitch, 0.7);
      if (level === 2) { // 超激アツ: アルペジオ + ベースドロップ + クラッシュ
        const arp = [523, 659, 784, 1047, 1319, 1568, 2093, 2637];
        for (let t = 0, i = 0; t < sec; t += 0.075, i++) this.tone({ type: 'square', freq: arp[i % arp.length] * (1 + Math.floor(i / arp.length) % 2), dur: 0.09, gain: 0.14, at: t, delay: 0.4 });
        for (let t = 0; t < sec; t += 1.2) { this.tone({ freq: 220, freqEnd: 28, dur: 0.8, gain: 1, at: t, attack: 0.005 }); this.crash(t, 0.5); }
      }
    },
    drumroll(at, sec) { // スネアロール（加速・クレッシェンド）
      let t = 0, step = 0.07, k = 0;
      while (t < sec) { this.snare(at + t, 0.15 + 0.5 * (t / sec)); t += step; step = Math.max(0.03, step - 0.0025); k++; }
      this.noise({ dur: sec, gain: 0.25, at, hp: 800, hpEnd: 8000, attack: sec * 0.9 });
    },
    fanfare(tier) { // 当選ファンファーレ
      this.cut();
      this.crash(0, 0.8); this.kick(0, 1);
      const short = 0.16, long = 0.6;
      const seq = tier === 'grand'
        ? [[784, short], [784, short], [784, short], [1047, long], [988, short], [1047, short], [1175, long], [1047, short], [1175, short], [1319, long], [1568, 1.4]]
        : tier === 'upper'
          ? [[784, short], [784, short], [784, short], [1047, long], [988, short], [1047, short], [1319, 1.1]]
          : [[784, short], [784, short], [784, short], [1047, 0.9]];
      let t = 0.05;
      for (const [f, d] of seq) { this.brass(f, d, t, 0.6); this.brass(f / 2, d, t, 0.3); this.hat(t, 0.15); t += d + 0.03; }
      // 最後にコードを鳴らす
      const end = t;
      for (const f of [523, 659, 784, 1047]) { this.brass(f, tier === 'grand' ? 2.6 : 1.8, end, 0.45); }
      this.crash(end, 0.7); this.kick(end, 1);
      // コインの雨
      this.coin(0.2, tier === 'grand' ? 40 : tier === 'upper' ? 22 : 12);
      if (tier === 'grand') {
        for (let k = 0; k < 6; k++) { this.crash(end + 0.8 + k * 0.5, 0.35); this.coin(end + 1 + k * 0.5, 6); }
        this.beat({ bpm: 140, sec: 4, at: end, kick: true, hats: true, snare: true, bass: 65 });
        const arp = [1047, 1319, 1568, 2093];
        for (let i = 0; i < 32; i++) this.tone({ type: 'triangle', freq: arp[i % 4], dur: 0.12, gain: 0.2, at: end + i * 0.11, delay: 0.5 });
      } else if (tier === 'upper') {
        this.beat({ bpm: 140, sec: 2, at: end, kick: true, hats: true, snare: true });
      }
    },
    lose() { // 落選: トロンボーンの「ワウワウワウワァ〜」 + ずっこけ
      this.cut();
      const seq = [[440, 0.45], [415, 0.45], [392, 0.45], [370, 1.4]];
      let t = 0;
      for (const [f, d] of seq) { this.tone({ type: 'sawtooth', freq: f, freqEnd: f * 0.97, dur: d, gain: 0.45, at: t, lp: 1800, vib: 6, attack: 0.05, reverb: 0.4 }); this.tone({ type: 'sawtooth', freq: f / 2, dur: d, gain: 0.2, at: t, lp: 900, attack: 0.05 }); t += d + 0.08; }
      this.tone({ type: 'sine', freq: 300, freqEnd: 60, dur: 0.6, gain: 0.5, at: t + 0.1 });
      this.noise({ dur: 0.08, gain: 0.3, at: t + 0.1, hp: 2000 });
    },
    /** 予約済みの音をすべて止める（ctx は残す） */
    cut() {
      for (const t of this.timers) clearTimeout(t); this.timers = [];
      const now = this.now;
      for (const n of this.nodes) { try { n.onended = null; n.stop(now); } catch { /* ignore */ } }
      this.nodes = [];
    },
    stopAll() { this.cut(); },
    stopMedia() { try { if (this.media) this.media.pause(); } catch { /* ignore */ } },
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
