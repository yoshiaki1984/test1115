/* 福引 当選番号チェック - フロントエンド */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const el = {
    drawTitle: $('draw-title'), input: $('number'), clear: $('clear'), check: $('check'), notRegistered: $('not-registered'),
    statsCard: $('stats-card'), statTotal: $('stat-total'), statGrand: $('stat-grand'), statUpper: $('stat-upper'),
    history: $('history'), historyList: $('history-list'), soundToggle: $('sound-toggle'),
    stage: $('stage'), phase: $('stage-phase'), msg: $('stage-msg'), reel: $('reel'), scanner: $('scanner'), sub: $('stage-sub'),
    reachBanner: $('reach-banner'), result: $('result'), badge: $('result-badge'), title: $('result-title'), resultNumber: $('result-number'),
    prizeCard: $('prize-card'), prizeName: $('prize-name'), note: $('result-note'), nearMiss: $('near-miss'), again: $('again'), skip: $('skip'), fx: $('fx'),
  };

  const TIER_LABEL = { grand: '特賞', upper: '上位賞', regular: '当選' };
  const HISTORY_KEY = 'fukubiki.history';
  const SOUND_KEY = 'fukubiki.sound';

  let registered = false;
  let running = false;
  let skipRequested = false;

  async function loadStatus() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const st = await res.json();
      registered = !!st.registered;
      if (registered) {
        el.drawTitle.textContent = `${st.title}（全${st.total}本）`;
        el.statTotal.textContent = st.total;
        el.statGrand.textContent = st.tiers?.grand ?? 0;
        el.statUpper.textContent = st.tiers?.upper ?? 0;
        el.statsCard.hidden = false;
        el.notRegistered.hidden = true;
      } else {
        el.drawTitle.textContent = '当選番号 未登録';
        el.notRegistered.hidden = false;
      }
    } catch {
      el.drawTitle.textContent = 'サーバーに接続できません';
      el.notRegistered.textContent = 'サーバーに接続できません。通信環境をご確認ください。';
      el.notRegistered.hidden = false;
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
  async function startCheck() {
    if (running || el.check.disabled) return;
    const numberText = el.input.value;
    const number = Number.parseInt(numberText, 10);
    if (!Number.isInteger(number)) return;

    running = true;
    skipRequested = false;
    sound.unlock();
    el.input.blur();
    openStage();

    // API問い合わせと演出は並行。演出は最低限の長さを保証する
    const resultPromise = fetch(`/api/check/${number}`, { cache: 'no-store' })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || '通信エラー'); return j; });

    try {
      await playSuspense(numberText, resultPromise);
      const result = await resultPromise;
      showResult(result);
      pushHistory(result);
    } catch (err) {
      showError(err.message);
    } finally {
      running = false;
    }
  }

  function openStage() {
    el.stage.hidden = false;
    el.stage.className = 'stage';
    el.result.hidden = true;
    el.phase.hidden = false;
    el.reachBanner.hidden = true;
    el.scanner.hidden = true;
    el.skip.hidden = true;
    el.sub.textContent = '';
    el.nearMiss.hidden = true;
    document.body.style.overflow = 'hidden';
    fx.start();
    setTimeout(() => { if (running) el.skip.hidden = false; }, 1500);
  }

  function closeStage() {
    fx.stop();
    el.stage.hidden = true;
    el.stage.className = 'stage';
    document.body.style.overflow = '';
    el.input.value = '';
    onInput();
    el.input.focus();
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /** スキップ可能な待機 */
  async function wait(ms) {
    const step = 50;
    for (let t = 0; t < ms; t += step) {
      if (skipRequested) return false;
      await sleep(Math.min(step, ms - t));
    }
    return !skipRequested;
  }
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function setMsg(text) {
    el.msg.textContent = text;
    el.msg.classList.remove('pop');
    void el.msg.offsetWidth;
    el.msg.classList.add('pop');
  }

  /**
   * 焦らし演出。結果に応じて「リーチ」の強さを変える。
   * - 特賞: 必ず超激アツ（虹）演出＋長め
   * - 上位賞: 必ず激アツ
   * - 一般賞: 7割で激アツ
   * - 落選: 3割で「ガセ激アツ」（煽ってから落とす）
   */
  async function playSuspense(numberText, resultPromise) {
    // 結果は演出中に取得しておく（演出の分岐に使う）
    let result = null;
    resultPromise.then((r) => { result = r; }).catch(() => {});

    // Phase 1: リール回転 → 1桁ずつ確定
    setMsg('照合開始…');
    buildReel(numberText.length);
    sound.tickStart();
    if (!(await wait(700))) return;
    const digits = numberText.split('');
    for (let i = 0; i < digits.length; i++) {
      const dur = 420 + i * 160 + (i === digits.length - 1 ? 500 : 0);
      if (!(await wait(dur))) return;
      lockDigit(i, digits[i]);
      vibrate(20);
      sound.lock(i);
    }
    sound.tickStop();
    if (!(await wait(500))) return;

    // Phase 2: データベース照合（スキャナー）
    el.scanner.hidden = false;
    const scanMsgs = ['当選番号データベースと照合中…', '…', '……ん？', '反応あり……？'];
    for (const m of scanMsgs) {
      setMsg(m);
      if (!(await wait(rand(700, 1100)))) return;
    }

    // API結果を待つ（演出より遅い場合）
    while (result === null) {
      setMsg('サーバーに問い合わせ中…');
      if (!(await wait(300))) return;
      try { result = await Promise.race([resultPromise, sleep(1).then(() => null)]); } catch { return; }
    }
    if (result.error) return;

    // Phase 3: リーチ判定
    const tier = result.hit ? result.prizes[0].tier : null;
    let reach = 'none';
    if (tier === 'grand') reach = 'super';
    else if (tier === 'upper') reach = 'hot';
    else if (tier === 'regular') reach = Math.random() < 0.7 ? 'hot' : 'warm';
    else reach = Math.random() < 0.3 ? 'hot' : Math.random() < 0.5 ? 'warm' : 'none';

    el.scanner.hidden = true;
    if (reach === 'none') {
      setMsg('判定中……');
      el.sub.textContent = pick(['心の準備はいいですか？', '深呼吸して……', '結果は……']);
      sound.heartbeat(3);
      if (!(await wait(1800))) return;
    } else if (reach === 'warm') {
      setMsg('…おや？');
      el.sub.textContent = '何か引っかかりました……';
      sound.heartbeat(4);
      vibrate([40, 80, 40]);
      if (!(await wait(2000))) return;
    } else if (reach === 'hot') {
      setMsg('！！！');
      el.stage.classList.add('reach');
      el.reachBanner.hidden = false;
      el.reachBanner.querySelector('span').textContent = '激アツ!!';
      sound.siren(2.6);
      vibrate([60, 60, 60, 60, 120]);
      el.stage.classList.add('shake');
      if (!(await wait(2600))) return;
      el.reachBanner.hidden = true;
      el.stage.classList.remove('reach', 'shake');
      setMsg('運命の結果は……');
      el.sub.textContent = '';
      sound.heartbeat(3);
      if (!(await wait(1800))) return;
    } else if (reach === 'super') {
      setMsg('！？！？');
      el.stage.classList.add('reach');
      el.reachBanner.hidden = false;
      el.reachBanner.querySelector('span').textContent = '激アツ!!';
      sound.siren(2);
      vibrate([80, 60, 80, 60, 160]);
      if (!(await wait(2000))) return;
      el.stage.classList.remove('reach');
      el.stage.classList.add('super-reach', 'shake');
      el.reachBanner.querySelector('span').textContent = '超激アツ!!!';
      sound.siren(2.8, 1.5);
      fx.sparkle(60);
      if (!(await wait(2800))) return;
      el.reachBanner.hidden = true;
      el.stage.classList.remove('super-reach', 'shake');
      setMsg('これは……まさか……');
      sound.heartbeat(4);
      if (!(await wait(2400))) return;
    }
  }

  function buildReel(len) {
    el.reel.innerHTML = '';
    for (let i = 0; i < len; i++) {
      const d = document.createElement('div');
      d.className = 'reel-digit spinning';
      d.textContent = String(Math.floor(Math.random() * 10));
      el.reel.appendChild(d);
    }
    if (reelTimer) clearInterval(reelTimer);
    reelTimer = setInterval(() => {
      for (const d of el.reel.querySelectorAll('.reel-digit.spinning')) d.textContent = String(Math.floor(Math.random() * 10));
    }, 60);
  }
  let reelTimer = null;
  function lockDigit(i, digit) {
    const d = el.reel.children[i];
    if (!d) return;
    d.classList.remove('spinning');
    d.classList.add('locked');
    d.textContent = digit;
    if (!el.reel.querySelector('.spinning') && reelTimer) { clearInterval(reelTimer); reelTimer = null; }
  }
  function finishReel(numberText) {
    if (reelTimer) { clearInterval(reelTimer); reelTimer = null; }
    const digits = String(numberText).split('');
    if (el.reel.children.length !== digits.length) buildReel(digits.length);
    if (reelTimer) { clearInterval(reelTimer); reelTimer = null; }
    digits.forEach((dg, i) => lockDigit(i, dg));
  }

  // ---------------- 結果表示 ----------------
  function showResult(result) {
    finishReel(result.number);
    sound.stopAll();
    el.reachBanner.hidden = true;
    el.stage.classList.remove('reach', 'super-reach', 'shake');
    el.phase.hidden = true;
    el.skip.hidden = true;
    el.result.hidden = false;
    el.resultNumber.innerHTML = `番号 <strong>${escapeHtml(String(result.number))}</strong>`;

    if (result.hit) {
      const tier = result.prizes[0].tier;
      el.stage.classList.add('win');
      if (tier === 'grand') el.stage.classList.add('grand');
      el.badge.textContent = tier === 'regular' ? '🎉 WINNER 🎉' : `👑 ${TIER_LABEL[tier]} 👑`;
      el.title.textContent = tier === 'grand' ? '特賞当選！！' : '当選！！';
      el.prizeName.textContent = result.prizes.map((p) => p.prize).join(' ／ ');
      el.prizeCard.hidden = false;
      el.note.textContent = 'おめでとうございます！福引券は捨てずに、景品受け取り時にご提示ください。';
      el.nearMiss.hidden = true;
      vibrate(tier === 'grand' ? [100, 50, 100, 50, 300, 100, 500] : [80, 40, 80, 40, 200]);
      sound.fanfare(tier);
      fx.confetti(tier === 'grand' ? 3 : tier === 'upper' ? 2 : 1);
    } else {
      el.stage.classList.add('lose');
      el.badge.textContent = '残念…';
      el.title.textContent = '落選';
      el.prizeCard.hidden = true;
      el.note.textContent = pick(['今回はハズレでした。次のチャンスに期待！', 'おしい！運はきっと次に回ってきます。', 'ハズレ……でも、まだ諦めないで！']);
      if (result.near && result.near.length > 0) {
        const n = result.near[0];
        el.nearMiss.textContent = `惜しい！ 隣の番号「${n.number}」は ${n.prize} が当たっていました…`;
        el.nearMiss.hidden = false;
      } else {
        el.nearMiss.hidden = true;
      }
      vibrate([200]);
      sound.lose();
      fx.stop();
    }
  }

  function showError(message) {
    sound.stopAll();
    if (reelTimer) { clearInterval(reelTimer); reelTimer = null; }
    el.phase.hidden = true;
    el.result.hidden = false;
    el.stage.classList.remove('reach', 'super-reach', 'shake');
    el.stage.classList.add('lose');
    el.badge.textContent = 'エラー';
    el.title.textContent = '照合できません';
    el.resultNumber.textContent = '';
    el.prizeCard.hidden = true;
    el.nearMiss.hidden = true;
    el.note.textContent = message || '通信に失敗しました。もう一度お試しください。';
  }

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignore */ }
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------------- 履歴 ----------------
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }
  function pushHistory(result) {
    const list = loadHistory().filter((h) => h.number !== result.number);
    list.unshift({ number: result.number, hit: result.hit, prize: result.hit ? result.prizes.map((p) => p.prize).join(' / ') : '', tier: result.hit ? result.prizes[0].tier : null, at: Date.now() });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10))); } catch { /* ignore */ }
    renderHistory();
  }
  function renderHistory() {
    const list = loadHistory();
    el.history.hidden = list.length === 0;
    el.historyList.innerHTML = '';
    for (const h of list) {
      const li = document.createElement('li');
      li.className = 'history-item';
      const num = document.createElement('span'); num.className = 'history-num'; num.textContent = h.number;
      const tag = document.createElement('span'); tag.className = `history-tag ${h.hit ? 'win' : 'lose'}`; tag.textContent = h.hit ? TIER_LABEL[h.tier] || '当選' : '落選';
      const prize = document.createElement('span'); prize.className = 'history-prize'; prize.textContent = h.prize;
      li.append(num, tag, prize);
      li.addEventListener('click', () => { el.input.value = String(h.number); onInput(); });
      el.historyList.appendChild(li);
    }
  }

  // ---------------- 効果音（WebAudioで合成） ----------------
  const sound = {
    ctx: null, enabled: true, nodes: [], tickTimer: null,
    init() {
      try { this.enabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* ignore */ }
      this.render();
    },
    render() {
      el.soundToggle.textContent = this.enabled ? '🔊' : '🔇';
      el.soundToggle.setAttribute('aria-pressed', String(this.enabled));
    },
    toggle() {
      this.enabled = !this.enabled;
      try { localStorage.setItem(SOUND_KEY, this.enabled ? 'on' : 'off'); } catch { /* ignore */ }
      if (!this.enabled) this.stopAll();
      this.render();
      this.unlock();
    },
    unlock() {
      if (!this.enabled) return;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch { this.ctx = null; }
    },
    tone({ type = 'sine', freq = 440, freqEnd = null, dur = 0.2, gain = 0.2, at = 0 }) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime + at;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
      this.nodes.push(o);
      o.onended = () => { this.nodes = this.nodes.filter((n) => n !== o); };
    },
    tickStart() {
      this.tickStop();
      let period = 70;
      const loop = () => {
        this.tone({ type: 'square', freq: 1200, dur: 0.03, gain: 0.05 });
        period = Math.min(period + 1.5, 140);
        this.tickTimer = setTimeout(loop, period);
      };
      loop();
    },
    tickStop() { if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; } },
    lock(i) { this.tone({ type: 'triangle', freq: 660 + i * 110, dur: 0.15, gain: 0.25 }); },
    heartbeat(n) {
      for (let i = 0; i < n; i++) {
        this.tone({ type: 'sine', freq: 70, freqEnd: 45, dur: 0.18, gain: 0.5, at: i * 0.6 });
        this.tone({ type: 'sine', freq: 60, freqEnd: 40, dur: 0.15, gain: 0.35, at: i * 0.6 + 0.22 });
      }
    },
    siren(sec, pitch = 1) {
      const n = Math.floor(sec / 0.3);
      for (let i = 0; i < n; i++) {
        this.tone({ type: 'sawtooth', freq: 500 * pitch, freqEnd: 1000 * pitch, dur: 0.15, gain: 0.12, at: i * 0.3 });
        this.tone({ type: 'sawtooth', freq: 1000 * pitch, freqEnd: 500 * pitch, dur: 0.15, gain: 0.12, at: i * 0.3 + 0.15 });
      }
    },
    fanfare(tier) {
      const notes = tier === 'grand' ? [523, 659, 784, 1047, 784, 1047, 1319, 1568] : tier === 'upper' ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        this.tone({ type: 'triangle', freq: f, dur: 0.22, gain: 0.3, at: i * 0.13 });
        this.tone({ type: 'square', freq: f / 2, dur: 0.22, gain: 0.08, at: i * 0.13 });
      });
      const end = notes.length * 0.13;
      [523, 659, 784, 1047].forEach((f) => this.tone({ type: 'triangle', freq: f, dur: 1.2, gain: 0.18, at: end }));
    },
    lose() {
      this.tone({ type: 'sine', freq: 330, freqEnd: 250, dur: 0.35, gain: 0.3 });
      this.tone({ type: 'sine', freq: 250, freqEnd: 180, dur: 0.6, gain: 0.3, at: 0.35 });
    },
    stopAll() {
      this.tickStop();
      for (const n of this.nodes) { try { n.stop(); } catch { /* ignore */ } }
      this.nodes = [];
    },
  };

  // ---------------- パーティクル演出（canvas） ----------------
  const fx = {
    canvas: el.fx, ctx: el.fx.getContext('2d'), particles: [], raf: null, running: false,
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = this.canvas.clientWidth * dpr;
      this.canvas.height = this.canvas.clientHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    start() {
      this.resize();
      this.particles = [];
      if (!this.running) { this.running = true; this.loop(); }
    },
    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      this.particles = [];
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    },
    confetti(level) {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      const colors = level >= 3 ? ['#ff3b5c', '#f5c542', '#35e0a1', '#4fa3ff', '#ff6ec7', '#ffffff'] : ['#f5c542', '#ffe28a', '#ff8a3d', '#ffffff', '#ff6ec7'];
      const count = 80 * level + 60;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: w / 2 + rand(-40, 40), y: h * 0.45, vx: rand(-9, 9) * (0.6 + level * 0.3), vy: rand(-16, -5) * (0.7 + level * 0.25),
          g: 0.35, size: rand(5, 10), rot: rand(0, Math.PI * 2), vr: rand(-0.3, 0.3), color: pick(colors), life: rand(120, 220), shape: Math.random() < 0.5 ? 'rect' : 'circle',
        });
      }
      if (level >= 2) {
        const rain = () => {
          if (!this.running) return;
          for (let i = 0; i < 6 * level; i++) {
            this.particles.push({ x: rand(0, w), y: -10, vx: rand(-1, 1), vy: rand(2, 5), g: 0.05, size: rand(4, 9), rot: rand(0, 6), vr: rand(-0.2, 0.2), color: pick(colors), life: 260, shape: 'rect' });
          }
        };
        for (let k = 0; k < 6 * level; k++) setTimeout(rain, k * 350);
      }
    },
    sparkle(n) {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      for (let i = 0; i < n; i++) {
        this.particles.push({ x: rand(0, w), y: rand(0, h), vx: rand(-1, 1), vy: rand(-2, 0), g: 0, size: rand(2, 5), rot: 0, vr: 0, color: pick(['#ffe28a', '#ffffff', '#f5c542']), life: rand(30, 70), shape: 'circle' });
      }
    },
    loop() {
      if (!this.running) return;
      const c = this.ctx, w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      c.clearRect(0, 0, w, h);
      this.particles = this.particles.filter((p) => p.life > 0 && p.y < h + 20);
      for (const p of this.particles) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--; p.vx *= 0.99;
        c.save();
        c.translate(p.x, p.y); c.rotate(p.rot);
        c.globalAlpha = Math.min(1, p.life / 40);
        c.fillStyle = p.color;
        if (p.shape === 'rect') c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
      this.raf = requestAnimationFrame(() => this.loop());
    },
  };
  window.addEventListener('resize', () => { if (fx.running) fx.resize(); });

  // ---------------- 初期化 ----------------
  loadStatus();
  renderHistory();
  el.input.addEventListener('input', onInput);
  el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); startCheck(); } });
  el.clear.addEventListener('click', () => { el.input.value = ''; onInput(); el.input.focus(); });
  el.check.addEventListener('click', startCheck);
  el.again.addEventListener('click', closeStage);
  el.skip.addEventListener('click', () => { skipRequested = true; });
  el.soundToggle.addEventListener('click', () => sound.toggle());
  sound.init();
})();
