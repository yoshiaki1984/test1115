/**
 * 当選番号発表PDFのパーサー
 *
 * 想定レイアウト（昨年の発表PDFと同じ）:
 *   - 各ページに「当選番号」「品名」の2列の表
 *   - 番号列は左端（x < NUMBER_COL_MAX_X）、品名列はその右
 *   - セル内で番号は上下中央、品名は上寄せで配置されるため、
 *     品名の行は「自分と同じか少し下にある最初の番号」に属する
 *   - 品名が長い場合は2行に折り返され、2行目には番号が無い
 *   - 先頭に特賞・上位賞ブロック（番号順不同）、その後に一般賞ブロック（番号昇順）
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const NUMBER_COL_MAX_X = 72; // これより左に始まるテキストは「当選番号」列
const SAME_LINE_TOLERANCE = 2.5; // 同一行とみなすY座標差（pt）
const NAME_ABOVE_NUMBER_EPS = 6; // 品名行が番号より少し下にあっても同じセルとみなす許容量（pt）
const MAX_CELL_DISTANCE = 30; // 品名行と番号のY距離がこれを超えたら別セル（行ピッチ約20pt）
const FRAGMENT_GAP_AS_SPACE = 2.5; // 断片間の隙間がこれ以上なら空白とみなす（pt）
const HEADER_WORDS = ['当選番号', '品名'];

export const TIER = {
  GRAND: 'grand', // 【特賞】
  UPPER: 'upper', // 先頭の上位賞ブロック
  REGULAR: 'regular', // 一般賞
};

/**
 * PDFのバイナリから当選エントリの配列を返す。
 * @param {Uint8Array|ArrayBuffer|Buffer} data
 * @returns {Promise<{entries: Array<{number:number, prize:string, tier:string, page:number, sortOrder:number}>, warnings: string[], pageCount: number}>}
 */
export async function parseWinnersPdf(data) {
  const bytes = new Uint8Array(data);
  const doc = await getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const entries = [];
  const warnings = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageEntries = extractPageEntries(content.items, viewport.height, p, warnings);
    entries.push(...pageEntries);
    page.cleanup();
  }
  await doc.destroy();

  return { entries: assignTiers(entries), warnings, pageCount: doc.numPages };
}

/**
 * 1ページ分のテキスト断片から {number, prize} の配列を組み立てる。
 */
export function extractPageEntries(items, pageHeight, pageNo, warnings = []) {
  const frags = items
    .filter((it) => it.str && it.str.trim() !== '')
    .map((it) => ({
      x: it.transform[4],
      y: pageHeight - it.transform[5], // 上からの距離に変換
      width: it.width ?? 0,
      text: it.str,
    }));

  const numbers = mergeLines(frags.filter((f) => f.x < NUMBER_COL_MAX_X))
    .map((l) => ({ y: l.y, number: parseNumber(l.text), names: [] }))
    .filter((n) => n.number !== null)
    .sort((a, b) => a.y - b.y);

  const nameLines = mergeLines(frags.filter((f) => f.x >= NUMBER_COL_MAX_X)).filter((l) => !isHeader(l.text));

  let lastOwner = null;
  for (const line of nameLines) {
    // 自分と同じ高さ、または少し下にある最初の番号 = 同じセル
    let owner = numbers.find((n) => n.y >= line.y - NAME_ABOVE_NUMBER_EPS && n.y - line.y <= MAX_CELL_DISTANCE);
    if (!owner) {
      // 念のためのフォールバック: 最も近い番号
      let best = null;
      for (const n of numbers) {
        const d = Math.abs(n.y - line.y);
        if (d <= MAX_CELL_DISTANCE && (best === null || d < best.d)) best = { n, d };
      }
      owner = best?.n ?? lastOwner;
    }
    if (!owner) {
      warnings.push(`p${pageNo}: 番号に対応付けできない品名を無視しました: "${line.text}"`);
      continue;
    }
    owner.names.push(line);
    lastOwner = owner;
  }

  const result = [];
  for (const n of numbers) {
    const prize = n.names
      .sort((a, b) => a.y - b.y)
      .map((l) => l.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (prize === '') {
      warnings.push(`p${pageNo}: 番号 ${n.number} に品名がありません`);
    }
    result.push({ number: n.number, prize, page: pageNo });
  }
  return result;
}

/** 同じ高さの断片を1行に結合する（x順に連結） */
function mergeLines(frags) {
  const sorted = [...frags].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const f of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - f.y) <= SAME_LINE_TOLERANCE) {
      last.parts.push(f);
    } else {
      lines.push({ y: f.y, parts: [f] });
    }
  }
  return lines.map((l) => {
    const parts = l.parts.sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd = null;
    for (const p of parts) {
      // 断片同士に水平方向の隙間があれば（全角スペース等が落ちている）空白を補う
      if (prevEnd !== null && p.x - prevEnd > FRAGMENT_GAP_AS_SPACE) text += ' ';
      text += p.text;
      prevEnd = p.x + p.width;
    }
    return { y: l.y, text: text.replace(/\s+/g, ' ').trim() };
  });
}

function isHeader(text) {
  const t = text.replace(/\s/g, '');
  return t !== '' && HEADER_WORDS.some((w) => t === w || t === w.replace('名', '') || t === '名');
}

function parseNumber(text) {
  const normalized = text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, '');
  if (normalized === '' || !/^\s*[\d０-９\s,]+\s*$/.test(text)) return null;
  return Number.parseInt(normalized, 10);
}

/**
 * 賞のランクを付与する。
 * - 品名に【特賞】を含む → grand
 * - 末尾から連続して番号が昇順に並ぶ区間 → regular（一般賞）
 * - それより前 → upper（上位賞）
 */
export function assignTiers(entries) {
  let regularStart = entries.length - 1;
  while (regularStart > 0 && entries[regularStart - 1].number < entries[regularStart].number) {
    regularStart--;
  }
  return entries.map((e, i) => {
    let tier = i >= regularStart ? TIER.REGULAR : TIER.UPPER;
    if (/【\s*特賞\s*】/.test(e.prize)) tier = TIER.GRAND;
    return { ...e, tier, sortOrder: i };
  });
}
