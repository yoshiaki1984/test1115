/**
 * Express アプリ本体（server.js から起動。テストからも利用）
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { parseWinnersPdf } from './pdfParser.js';
import { parseWinnersText } from './textImport.js';
import { ValidationError } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_NUMBER = 999999;

/**
 * @param {{repo: import('./db.js').WinnersRepository, adminPassword: string, nearRange?: number}} opts
 */
export function createApp({ repo, adminPassword, nearRange = 1 }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });

  // ---------- 公開API ----------
  app.get('/api/status', (req, res) => {
    const status = repo.getStatus();
    res.json({ registered: !!status, ...(status ?? {}) });
  });

  app.get('/api/check/:number', (req, res) => {
    const number = parseNumberParam(req.params.number);
    if (number === null) return res.status(400).json({ error: '番号は0以上の整数で入力してください' });
    const result = repo.check(number, { nearRange });
    res.json(result);
  });

  // ---------- 管理API ----------
  const admin = express.Router();
  admin.use((req, res, next) => {
    const token = req.get('x-admin-token') ?? '';
    if (!safeEqual(token, adminPassword)) {
      return res.status(401).json({ error: '管理パスワードが違います' });
    }
    next();
  });

  admin.post('/login', (req, res) => res.json({ ok: true }));

  admin.get('/winners', (req, res) => {
    res.json({ status: repo.getStatus(), winners: repo.listWinners() });
  });

  admin.get('/draws', (req, res) => res.json({ draws: repo.listDraws() }));

  const pdfBody = express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '30mb' });

  // PDFを解析するだけ（登録はしない）
  admin.post('/import/preview', pdfBody, async (req, res, next) => {
    try {
      const parsed = await parsePdfBody(req);
      res.json(summarize(parsed));
    } catch (err) {
      next(err);
    }
  });

  // PDFを解析して登録（既存リストを置き換え）
  admin.post('/import', pdfBody, async (req, res, next) => {
    try {
      const parsed = await parsePdfBody(req);
      const title = String(req.query.title ?? '').trim() || defaultTitle();
      const status = repo.replaceAll({ title, sourceFilename: String(req.query.filename ?? '') || null, entries: parsed.entries });
      res.json({ ...summarize(parsed), status });
    } catch (err) {
      next(err);
    }
  });

  // テキスト（CSV等）から登録
  admin.post('/import/text', express.json({ limit: '5mb' }), (req, res, next) => {
    try {
      const parsed = parseWinnersText(req.body?.text);
      if (req.body?.previewOnly) return res.json(summarize(parsed));
      const title = String(req.body?.title ?? '').trim() || defaultTitle();
      const status = repo.replaceAll({ title, sourceFilename: 'text', entries: parsed.entries });
      res.json({ ...summarize(parsed), status });
    } catch (err) {
      next(err);
    }
  });

  admin.delete('/draw', (req, res) => {
    const deleted = repo.clearActive();
    res.json({ ok: true, deleted });
  });

  app.use('/api/admin', admin);

  // ---------- 静的ファイル ----------
  app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status ?? (err instanceof ValidationError ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message ?? 'server error' });
  });

  return app;
}

async function parsePdfBody(req) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ValidationError('PDFファイルの本文が空です（Content-Type: application/pdf で送信してください）');
  }
  if (req.body.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new ValidationError('PDFファイルではありません');
  }
  let parsed;
  try {
    parsed = await parseWinnersPdf(req.body);
  } catch (err) {
    throw new ValidationError(`PDFの解析に失敗しました: ${err.message}`);
  }
  if (parsed.entries.length === 0) {
    throw new ValidationError('PDFから当選番号を1件も読み取れませんでした。レイアウトが昨年と同じか確認してください');
  }
  return parsed;
}

function summarize(parsed) {
  const tiers = {};
  for (const e of parsed.entries) tiers[e.tier] = (tiers[e.tier] ?? 0) + 1;
  const seen = new Map();
  for (const e of parsed.entries) seen.set(e.number, (seen.get(e.number) ?? 0) + 1);
  const duplicates = [...seen.entries()].filter(([, c]) => c > 1).map(([n]) => n);
  return {
    count: parsed.entries.length,
    pageCount: parsed.pageCount ?? null,
    tiers,
    duplicates,
    warnings: parsed.warnings,
    entries: parsed.entries,
  };
}

function defaultTitle() {
  return `${new Date().getFullYear()}年 当選発表`;
}

function parseNumberParam(raw) {
  const s = String(raw ?? '')
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim();
  if (!/^\d{1,7}$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  return n > MAX_NUMBER ? null : n;
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
