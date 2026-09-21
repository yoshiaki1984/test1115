import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseWinnersPdf, assignTiers } from '../src/pdfParser.js';

const SAMPLE = new URL('../samples/2025_tousen.pdf', import.meta.url);

test('昨年のPDFから421件を読み取れる', async () => {
  const { entries, warnings, pageCount } = await parseWinnersPdf(fs.readFileSync(SAMPLE));
  assert.equal(pageCount, 13);
  assert.equal(entries.length, 421);
  assert.deepEqual(warnings, []);
  const numbers = entries.map((e) => e.number);
  assert.equal(new Set(numbers).size, numbers.length, '番号が重複していない');
});

test('特賞・上位賞・一般賞のランク付け', async () => {
  const { entries } = await parseWinnersPdf(fs.readFileSync(SAMPLE));
  const byNumber = new Map(entries.map((e) => [e.number, e]));
  assert.equal(byNumber.get(2204).tier, 'grand');
  assert.match(byNumber.get(2204).prize, /クラウン/);
  assert.equal(byNumber.get(3225).tier, 'grand');
  assert.equal(byNumber.get(1565).tier, 'upper');
  assert.equal(byNumber.get(2628).tier, 'upper');
  assert.equal(byNumber.get(2).tier, 'regular');
  assert.equal(byNumber.get(3990).tier, 'regular');
  const tiers = entries.reduce((m, e) => ((m[e.tier] = (m[e.tier] ?? 0) + 1), m), {});
  assert.deepEqual(tiers, { grand: 2, upper: 17, regular: 402 });
});

test('2行にまたがる品名と隣接行の品名を正しく対応付ける', async () => {
  const { entries } = await parseWinnersPdf(fs.readFileSync(SAMPLE));
  const byNumber = new Map(entries.map((e) => [e.number, e]));
  assert.equal(byNumber.get(924).prize, '東京ステーションホテル「パレスサイドスーペリアツイン」宿泊ご招待券 1室2名 （朝食付き）');
  assert.equal(byNumber.get(2990).prize, 'ヤーマン：RF美顔器 フォトプラス プレステージ SP プルシアンブルー');
  assert.equal(byNumber.get(3876).prize, 'ヤーマン：RF美顔器 フォトプラス プレステージ SP プルシアンブルー');
  assert.equal(byNumber.get(2628).prize, 'ハイブリッド式空気清浄機 CL-HB 924');
  assert.equal(byNumber.get(716).prize, '富士ビューホテル 平日ご宿泊招待券 1室2名様（部屋のみの利用）');
});

test('assignTiers: 全て昇順なら全部一般賞', () => {
  const r = assignTiers([{ number: 1, prize: 'a' }, { number: 5, prize: 'b' }, { number: 9, prize: 'c' }]);
  assert.deepEqual(r.map((e) => e.tier), ['regular', 'regular', 'regular']);
});

test('assignTiers: 先頭の順不同ブロックは上位賞、【特賞】は特賞', () => {
  const r = assignTiers([{ number: 300, prize: '【特賞】車' }, { number: 20, prize: 'PC' }, { number: 1, prize: 'a' }, { number: 5, prize: 'b' }]);
  assert.deepEqual(r.map((e) => e.tier), ['grand', 'upper', 'regular', 'regular']);
});
