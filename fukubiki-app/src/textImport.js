/**
 * PDF以外の手入力（CSV / タブ区切り / 「番号 品名」のテキスト貼り付け）からの取り込み
 * 1行 = 1エントリ。区切りはカンマ・タブ・連続スペースのいずれか。
 */
import { assignTiers } from './pdfParser.js';

export function parseWinnersText(text) {
  const entries = [];
  const warnings = [];
  const lines = String(text ?? '').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || /^#/.test(line)) return;
    const m = line.match(/^([０-９\d]+)\s*[,\t、]?\s*(.+)$/);
    if (!m) {
      warnings.push(`${i + 1}行目を無視しました: "${line}"`);
      return;
    }
    const number = Number.parseInt(m[1].replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)), 10);
    const prize = m[2].replace(/^["']|["']$/g, '').trim();
    if (/^(当選番号|番号)/.test(m[1]) || prize === '') {
      warnings.push(`${i + 1}行目を無視しました: "${line}"`);
      return;
    }
    entries.push({ number, prize, page: null });
  });
  return { entries: assignTiers(entries), warnings };
}
