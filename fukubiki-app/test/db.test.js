import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';

const entries = [
  { number: 300, prize: '【特賞】車', tier: 'grand' },
  { number: 20, prize: 'PC', tier: 'upper' },
  { number: 1, prize: 'a', tier: 'regular' },
  { number: 5, prize: 'b', tier: 'regular' },
];

test('未登録状態の照合', () => {
  const repo = openDb(':memory:');
  assert.equal(repo.getStatus(), null);
  assert.deepEqual(repo.check(5), { registered: false, number: 5, hit: false, prizes: [], near: [] });
  repo.close();
});

test('登録・照合・ニアミス・置き換え・削除', () => {
  const repo = openDb(':memory:');
  const status = repo.replaceAll({ title: 'テスト', entries });
  assert.equal(status.total, 4);
  assert.deepEqual(status.tiers, { grand: 1, upper: 1, regular: 2 });

  const hit = repo.check(300);
  assert.equal(hit.hit, true);
  assert.equal(hit.prizes[0].prize, '【特賞】車');
  assert.equal(hit.prizes[0].tier, 'grand');

  const miss = repo.check(4);
  assert.equal(miss.hit, false);
  assert.deepEqual(miss.near.map((n) => n.number), [5]);
  assert.equal(repo.check(4, { nearRange: 0 }).near.length, 0);
  assert.equal(repo.check(6, { nearRange: 1 }).near[0].number, 5);

  repo.replaceAll({ title: '2回目', entries: [{ number: 7, prize: 'x' }] });
  assert.equal(repo.getStatus().total, 1);
  assert.equal(repo.check(300).hit, false);
  assert.equal(repo.listDraws().length, 2);

  assert.equal(repo.clearActive(), true);
  assert.equal(repo.getStatus(), null);
  repo.close();
});

test('不正なエントリは拒否', () => {
  const repo = openDb(':memory:');
  assert.throws(() => repo.replaceAll({ title: 't', entries: [] }), /1件もありません/);
  assert.throws(() => repo.replaceAll({ title: 't', entries: [{ number: 'x', prize: 'a' }] }), /当選番号が不正/);
  assert.throws(() => repo.replaceAll({ title: 't', entries: [{ number: 1, prize: '' }] }), /品名が空/);
  assert.equal(repo.getStatus(), null);
  repo.close();
});
