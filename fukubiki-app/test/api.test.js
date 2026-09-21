import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

const SAMPLE = new URL('../samples/2025_tousen.pdf', import.meta.url);
const PASSWORD = 'secret';
let server;
let base;
const auth = { 'x-admin-token': PASSWORD };

before(async () => {
  const app = createApp({ repo: openDb(':memory:'), adminPassword: PASSWORD, nearRange: 1 });
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('未登録時の status と check', async () => {
  const st = await (await fetch(`${base}/api/status`)).json();
  assert.equal(st.registered, false);
  const c = await (await fetch(`${base}/api/check/2204`)).json();
  assert.equal(c.registered, false);
});

test('管理APIは認証が必要', async () => {
  const r = await fetch(`${base}/api/admin/winners`);
  assert.equal(r.status, 401);
  const r2 = await fetch(`${base}/api/admin/winners`, { headers: { 'x-admin-token': 'wrong' } });
  assert.equal(r2.status, 401);
});

test('PDFのプレビュー・登録・照合', async () => {
  const pdf = fs.readFileSync(SAMPLE);
  const pv = await fetch(`${base}/api/admin/import/preview`, { method: 'POST', headers: { ...auth, 'content-type': 'application/pdf' }, body: pdf });
  assert.equal(pv.status, 200);
  assert.equal((await pv.json()).count, 421);
  assert.equal((await (await fetch(`${base}/api/status`)).json()).registered, false, 'プレビューでは登録されない');

  const im = await fetch(`${base}/api/admin/import?title=2026年&filename=x.pdf`, { method: 'POST', headers: { ...auth, 'content-type': 'application/pdf' }, body: pdf });
  assert.equal(im.status, 200);
  const imJson = await im.json();
  assert.equal(imJson.status.total, 421);
  assert.equal(imJson.status.title, '2026年');

  const st = await (await fetch(`${base}/api/status`)).json();
  assert.equal(st.registered, true);
  assert.equal(st.total, 421);

  const hit = await (await fetch(`${base}/api/check/2204`)).json();
  assert.equal(hit.hit, true);
  assert.equal(hit.prizes[0].tier, 'grand');
  const fw = await (await fetch(`${base}/api/check/２２０４`)).json();
  assert.equal(fw.hit, true, '全角数字も受け付ける');
  const miss = await (await fetch(`${base}/api/check/3`)).json();
  assert.equal(miss.hit, false);
  assert.equal(miss.near[0].number, 2);
  assert.equal((await fetch(`${base}/api/check/abc`)).status, 400);
});

test('不正なPDFは400', async () => {
  const r = await fetch(`${base}/api/admin/import`, { method: 'POST', headers: { ...auth, 'content-type': 'application/pdf' }, body: Buffer.from('hello') });
  assert.equal(r.status, 400);
});

test('テキスト取り込みと削除', async () => {
  const r = await fetch(`${base}/api/admin/import/text`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ text: '100,【特賞】車\n1 傘\n2\tタオル\n', title: 'テキスト' }) });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.count, 3);
  assert.deepEqual(j.tiers, { grand: 1, regular: 2 });
  const hit = await (await fetch(`${base}/api/check/2`)).json();
  assert.equal(hit.prizes[0].prize, 'タオル');

  const d = await fetch(`${base}/api/admin/draw`, { method: 'DELETE', headers: auth });
  assert.equal((await d.json()).deleted, true);
  assert.equal((await (await fetch(`${base}/api/status`)).json()).registered, false);
});
