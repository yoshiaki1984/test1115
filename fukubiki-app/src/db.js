/**
 * SQLite（Node.js組み込み node:sqlite）による当選番号DB
 *
 * draws   : 取り込んだ当選発表（年度）ごとの1レコード。最新のものが有効（is_active=1）
 * winners : 当選番号と賞品。draw_id で draws に紐づく
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openDb(dbPath = ':memory:') {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source_filename TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      is_active INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      prize TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'regular',
      sort_order INTEGER NOT NULL,
      page INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_winners_draw_number ON winners(draw_id, number);
  `);
  return new WinnersRepository(db);
}

export class WinnersRepository {
  /** @param {DatabaseSync} db */
  constructor(db) {
    this.db = db;
    this.stmts = {
      activeDraw: db.prepare(`SELECT id, title, source_filename, created_at FROM draws WHERE is_active = 1 ORDER BY id DESC LIMIT 1`),
      countByTier: db.prepare(`SELECT tier, COUNT(*) AS c FROM winners WHERE draw_id = ? GROUP BY tier`),
      minMax: db.prepare(`SELECT MIN(number) AS minN, MAX(number) AS maxN, COUNT(*) AS total FROM winners WHERE draw_id = ?`),
      byNumber: db.prepare(`SELECT number, prize, tier, sort_order, page FROM winners WHERE draw_id = ? AND number = ? ORDER BY sort_order`),
      near: db.prepare(`SELECT number, prize, tier FROM winners WHERE draw_id = ? AND number BETWEEN ? AND ? AND number <> ? ORDER BY ABS(number - ?), sort_order`),
      listAll: db.prepare(`SELECT number, prize, tier, sort_order, page FROM winners WHERE draw_id = ? ORDER BY sort_order`),
      insertDraw: db.prepare(`INSERT INTO draws (title, source_filename, is_active) VALUES (?, ?, 1)`),
      deactivateAll: db.prepare(`UPDATE draws SET is_active = 0`),
      insertWinner: db.prepare(`INSERT INTO winners (draw_id, number, prize, tier, sort_order, page) VALUES (?, ?, ?, ?, ?, ?)`),
      deleteDraw: db.prepare(`DELETE FROM draws WHERE id = ?`),
      listDraws: db.prepare(`SELECT d.id, d.title, d.source_filename, d.created_at, d.is_active, (SELECT COUNT(*) FROM winners w WHERE w.draw_id = d.id) AS count FROM draws d ORDER BY d.id DESC`),
    };
  }

  /** 現在有効な当選発表の概要。未登録なら null */
  getStatus() {
    const draw = this.stmts.activeDraw.get();
    if (!draw) return null;
    const tiers = {};
    for (const r of this.stmts.countByTier.all(draw.id)) tiers[r.tier] = r.c;
    const mm = this.stmts.minMax.get(draw.id);
    return {
      drawId: draw.id,
      title: draw.title,
      sourceFilename: draw.source_filename,
      createdAt: draw.created_at,
      total: mm.total,
      minNumber: mm.minN,
      maxNumber: mm.maxN,
      tiers,
    };
  }

  /**
   * 番号を照合する。
   * @returns {{registered:boolean, number:number, hit:boolean, prizes:Array, near:Array}}
   */
  check(number, { nearRange = 1 } = {}) {
    const draw = this.stmts.activeDraw.get();
    if (!draw) return { registered: false, number, hit: false, prizes: [], near: [] };
    const prizes = this.stmts.byNumber.all(draw.id, number).map(rowToEntry);
    const near = nearRange > 0
      ? this.stmts.near.all(draw.id, number - nearRange, number + nearRange, number, number).map(rowToEntry)
      : [];
    return { registered: true, number, hit: prizes.length > 0, prizes, near };
  }

  listWinners() {
    const draw = this.stmts.activeDraw.get();
    if (!draw) return [];
    return this.stmts.listAll.all(draw.id).map(rowToEntry);
  }

  listDraws() {
    return this.stmts.listDraws.all().map((d) => ({ ...d, is_active: !!d.is_active }));
  }

  /**
   * 当選リストを丸ごと置き換える（新しい draw を作成して有効化。古い draw は履歴として残す）。
   * @param {{title:string, sourceFilename?:string, entries:Array<{number:number, prize:string, tier?:string, sortOrder?:number, page?:number}>}} p
   */
  replaceAll({ title, sourceFilename = null, entries }) {
    validateEntries(entries);
    this.db.exec('BEGIN');
    try {
      this.stmts.deactivateAll.run();
      const { lastInsertRowid } = this.stmts.insertDraw.run(title, sourceFilename);
      const drawId = Number(lastInsertRowid);
      entries.forEach((e, i) => {
        this.stmts.insertWinner.run(drawId, e.number, e.prize, e.tier ?? 'regular', e.sortOrder ?? i, e.page ?? null);
      });
      this.db.exec('COMMIT');
      return this.getStatus();
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /** 有効な当選発表を削除する（未登録状態に戻す） */
  clearActive() {
    const draw = this.stmts.activeDraw.get();
    if (!draw) return false;
    this.stmts.deleteDraw.run(draw.id);
    return true;
  }

  close() {
    this.db.close();
  }
}

function rowToEntry(r) {
  return { number: r.number, prize: r.prize, tier: r.tier, sortOrder: r.sort_order, page: r.page };
}

export function validateEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ValidationError('当選エントリが1件もありません');
  }
  entries.forEach((e, i) => {
    if (!Number.isInteger(e.number) || e.number < 0) throw new ValidationError(`${i + 1}件目: 当選番号が不正です (${e.number})`);
    if (typeof e.prize !== 'string' || e.prize.trim() === '') throw new ValidationError(`${i + 1}件目: 品名が空です (番号 ${e.number})`);
    if (e.tier !== undefined && !['grand', 'upper', 'regular'].includes(e.tier)) throw new ValidationError(`${i + 1}件目: tier が不正です (${e.tier})`);
  });
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}
