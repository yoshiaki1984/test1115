(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = 'fukubiki.adminToken';
  const TIER_LABEL = { grand: '特賞', upper: '上位賞', regular: '一般' };
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let selectedFile = null;
  let winners = [];

  const api = async (path, opts = {}) => {
    const headers = Object.assign({ 'x-admin-token': token }, opts.headers || {});
    const res = await fetch(path, Object.assign({}, opts, { headers, cache: 'no-store' }));
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error(json.error || '認証エラー'); }
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };
  const setMsg = (id, text, kind) => { $(id).innerHTML = text ? `<div class="msg ${kind}">${escapeHtml(text)}</div>` : ''; };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    token = $('password').value;
    try {
      await api('/api/admin/login', { method: 'POST' });
      sessionStorage.setItem(TOKEN_KEY, token);
      showDashboard();
    } catch (err) {
      setMsg('login-msg', err.message, 'err');
    }
  });
  function logout() {
    token = '';
    sessionStorage.removeItem(TOKEN_KEY);
    $('dashboard').hidden = true;
    $('login-card').hidden = false;
  }
  async function showDashboard() {
    $('login-card').hidden = true;
    $('dashboard').hidden = false;
    await refresh();
  }
  if (token) api('/api/admin/login', { method: 'POST' }).then(showDashboard).catch(() => {});

  async function refresh() {
    try {
      const { status, winners: list } = await api('/api/admin/winners');
      winners = list;
      $('status-box').innerHTML = status
        ? `<p class="status-line"><strong>${escapeHtml(status.title)}</strong></p>
           <p class="status-line">登録件数: <strong>${status.total}</strong> 件（特賞 ${status.tiers.grand ?? 0} / 上位賞 ${status.tiers.upper ?? 0} / 一般 ${status.tiers.regular ?? 0}）</p>
           <p class="status-line">番号範囲: ${status.minNumber} 〜 ${status.maxNumber}</p>
           <p class="status-line">登録日時: ${new Date(status.createdAt).toLocaleString('ja-JP')}${status.sourceFilename ? ` / 元ファイル: ${escapeHtml(status.sourceFilename)}` : ''}</p>`
        : '<p class="status-line">当選番号はまだ登録されていません。</p>';
      $('delete-btn').disabled = !status;
      renderWinners();
    } catch (err) {
      setMsg('import-msg', err.message, 'err');
    }
  }
  $('refresh-btn').addEventListener('click', refresh);
  $('delete-btn').addEventListener('click', async () => {
    if (!confirm('登録されている当選番号を削除します。アプリ側は「未登録」表示になります。よろしいですか？')) return;
    try { await api('/api/admin/draw', { method: 'DELETE' }); setMsg('import-msg', '削除しました', 'ok'); await refresh(); }
    catch (err) { setMsg('import-msg', err.message, 'err'); }
  });

  $('pdf-file').addEventListener('change', (e) => {
    selectedFile = e.target.files[0] || null;
    $('file-label').textContent = selectedFile ? `📄 ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : '📄 PDFファイルを選択';
    $('preview-btn').disabled = $('import-btn').disabled = !selectedFile;
    $('preview-box').innerHTML = '';
    setMsg('import-msg', '', '');
  });

  async function sendPdf(path) {
    const q = new URLSearchParams({ title: $('title').value.trim(), filename: selectedFile.name });
    return api(`${path}?${q}`, { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: selectedFile });
  }
  $('preview-btn').addEventListener('click', async () => {
    setBusy(true);
    try {
      const r = await sendPdf('/api/admin/import/preview');
      renderPreview(r, 'preview-box');
      setMsg('import-msg', `${r.pageCount}ページから ${r.count} 件を読み取りました（登録はまだされていません）`, 'ok');
    } catch (err) { setMsg('import-msg', err.message, 'err'); }
    finally { setBusy(false); }
  });
  $('import-btn').addEventListener('click', async () => {
    if (!confirm('現在の当選リストをこのPDFの内容で置き換えます。よろしいですか？')) return;
    setBusy(true);
    try {
      const r = await sendPdf('/api/admin/import');
      renderPreview(r, 'preview-box');
      setMsg('import-msg', `登録しました: ${r.status.title} / ${r.count} 件`, 'ok');
      await refresh();
    } catch (err) { setMsg('import-msg', err.message, 'err'); }
    finally { setBusy(false); }
  });
  function setBusy(b) {
    for (const id of ['preview-btn', 'import-btn']) $(id).disabled = b || !selectedFile;
  }

  function renderPreview(r, boxId) {
    const warn = [];
    if (r.duplicates.length) warn.push(`重複している番号: ${r.duplicates.join(', ')}`);
    if (r.warnings.length) warn.push(...r.warnings);
    const rows = r.entries.slice(0, 40).map((e) => `<tr><td class="num">${e.number}<span class="tier ${e.tier}">${TIER_LABEL[e.tier]}</span></td><td>${escapeHtml(e.prize)}</td></tr>`).join('');
    $(boxId).innerHTML = `
      ${warn.length ? `<div class="msg warn">${warn.map(escapeHtml).join('<br>')}</div>` : ''}
      <p class="status-line">内訳: 特賞 ${r.tiers.grand ?? 0} / 上位賞 ${r.tiers.upper ?? 0} / 一般 ${r.tiers.regular ?? 0}</p>
      <div class="table-wrap"><table><thead><tr><th>番号</th><th>品名</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${r.entries.length > 40 ? `<p class="status-line">…他 ${r.entries.length - 40} 件</p>` : ''}`;
  }

  async function sendText(previewOnly) {
    return api('/api/admin/import/text', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: $('text-input').value, title: $('title').value.trim(), previewOnly }),
    });
  }
  $('text-preview-btn').addEventListener('click', async () => {
    try { const r = await sendText(true); renderPreview(r, 'text-msg'); }
    catch (err) { setMsg('text-msg', err.message, 'err'); }
  });
  $('text-import-btn').addEventListener('click', async () => {
    if (!confirm('現在の当選リストをテキストの内容で置き換えます。よろしいですか？')) return;
    try { const r = await sendText(false); renderPreview(r, 'text-msg'); $('text-msg').insertAdjacentHTML('afterbegin', `<div class="msg ok">登録しました: ${r.count} 件</div>`); await refresh(); }
    catch (err) { setMsg('text-msg', err.message, 'err'); }
  });

  $('filter').addEventListener('input', renderWinners);
  function renderWinners() {
    const q = $('filter').value.trim().toLowerCase();
    const list = q ? winners.filter((w) => String(w.number).includes(q) || w.prize.toLowerCase().includes(q)) : winners;
    $('winners-body').innerHTML = list.slice(0, 500).map((w) => `<tr><td class="num">${w.number}<span class="tier ${w.tier}">${TIER_LABEL[w.tier]}</span></td><td>${escapeHtml(w.prize)}</td></tr>`).join('');
    $('winners-count').textContent = `${list.length} 件${list.length > 500 ? '（先頭500件を表示）' : ''}`;
  }
})();
