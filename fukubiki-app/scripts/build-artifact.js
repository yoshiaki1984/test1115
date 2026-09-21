#!/usr/bin/env node
/**
 * サーバー不要のシングルHTML版（claude.ai Artifact 用）を組み立てる。
 *   npm run build:artifact -- [seed.pdf] [--title "タイトル"] [--out dist/fukubiki.html]
 * seed.pdf を渡すとその当選リストを埋め込む。省略時は未登録状態で出力。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWinnersPdf } from '../src/pdfParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pdf = args.find((a) => !a.startsWith('--'));
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const out = opt('--out', path.join(__dirname, '..', 'dist', 'fukubiki.html'));

let draw = { title: '', updatedAt: new Date().toISOString(), entries: [] };
if (pdf) {
  const { entries, warnings } = await parseWinnersPdf(fs.readFileSync(pdf));
  for (const w of warnings) console.warn('警告:', w);
  draw = { title: opt('--title', `${new Date().getFullYear()}年 当選発表`), updatedAt: new Date().toISOString(), entries: entries.map((e) => ({ number: e.number, prize: e.prize, tier: e.tier })) };
}

const dir = path.join(__dirname, '..', 'artifact');
const tpl = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
if (/<\/script/i.test(app)) throw new Error('app.js に </script が含まれています（<\\/script> と書いてください）');
const json = JSON.stringify(draw).replace(/<\//g, '<\\/');
const html = tpl.replace('__DATA__', () => json).replace('__APP__', () => app);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out} を出力しました（${draw.entries.length}件, ${html.length} bytes）`);
