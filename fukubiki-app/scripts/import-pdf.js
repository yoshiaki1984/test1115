#!/usr/bin/env node
/**
 * CLIからPDFを取り込む:  npm run import -- samples/2025_tousen.pdf --title "2026年 当選発表"
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseWinnersPdf } from '../src/pdfParser.js';
import { openDb } from '../src/db.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const titleIdx = args.indexOf('--title');
const title = titleIdx >= 0 ? args[titleIdx + 1] : `${new Date().getFullYear()}年 当選発表`;
const dryRun = args.includes('--dry-run');

if (!file) {
  console.error('使い方: npm run import -- <pdfファイル> [--title "タイトル"] [--dry-run]');
  process.exit(1);
}

const { entries, warnings, pageCount } = await parseWinnersPdf(fs.readFileSync(file));
console.log(`${pageCount}ページ / ${entries.length}件を読み取りました`);
for (const w of warnings) console.warn('  警告:', w);
const tiers = {};
for (const e of entries) tiers[e.tier] = (tiers[e.tier] ?? 0) + 1;
console.log('内訳:', tiers);
for (const e of entries.slice(0, 5)) console.log(`  ${e.number}\t${e.tier}\t${e.prize}`);
console.log('  ...');

if (dryRun) process.exit(0);

const repo = openDb(process.env.DB_PATH ?? './data/fukubiki.sqlite');
const status = repo.replaceAll({ title, sourceFilename: path.basename(file), entries });
repo.close();
console.log(`登録しました: ${status.title} (${status.total}件)`);
