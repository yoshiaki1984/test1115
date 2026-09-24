#!/usr/bin/env node
/**
 * サーバー不要のシングルHTML版（claude.ai Artifact 用）を組み立てる。
 *   npm run build:artifact -- [seed.pdf] [--title "タイトル"] [--id ID --pass パスワード] --admin-id 管理者ID --admin-pass 管理者パスワード [--out dist/fukubiki.html]
 * seed.pdf を渡すとその当選リストを埋め込む。省略時は未登録状態で出力。
 * --id / --pass を渡すと当選リストを AES-GCM で暗号化して埋め込み、ページはログイン必須になる。
 * --admin-id / --admin-pass（必須）は管理パネル用。ユーザー用ID/PASSを管理者鍵で暗号化した箱を埋め込む。
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

const id = opt('--id', ''), pass = opt('--pass', '');
const adminId = opt('--admin-id', ''), adminPass = opt('--admin-pass', '');
if ((id && !pass) || (!id && pass)) throw new Error('--id と --pass は両方指定してください');
if (!adminId || !adminPass) throw new Error('--admin-id と --admin-pass は必須です');
if (id && adminId === id && adminPass === pass) throw new Error('管理者用とユーザー用は別のID・パスワードにしてください');

async function encryptJson(obj, uid, upass) {
  const { subtle } = globalThis.crypto;
  const enc = new TextEncoder();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16)), iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const km = await subtle.importKey('raw', enc.encode(`${uid.trim()}\n${upass}`), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  const b64 = (b) => Buffer.from(b).toString('base64');
  return { salt: b64(salt), iv: b64(iv), cipher: b64(cipher) };
}
if (id) {
  const c = await encryptJson(draw.entries, id, pass);
  draw = { title: draw.title, updatedAt: draw.updatedAt, locked: true, count: draw.entries.length, ...c };
} else {
  draw = { ...draw, locked: false };
}
draw.admin = await encryptJson(id ? { userId: id, userPass: pass } : {}, adminId, adminPass);

const dir = path.join(__dirname, '..', 'artifact');
const tpl = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
if (/<\/script/i.test(app)) throw new Error('app.js に </script が含まれています（<\\/script> と書いてください）');
const json = JSON.stringify(draw).replace(/<\//g, '<\\/');
const html = tpl.replace('__DATA__', () => json).replace('__APP__', () => app);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out} を出力しました（${draw.locked ? draw.count : draw.entries.length}件, ${html.length} bytes${draw.locked ? ', ID/パスワード保護あり' : ''}）`);
