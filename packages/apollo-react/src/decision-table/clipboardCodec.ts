/**
 * Cell-block ⇄ clipboard text, in the convention Excel and Google Sheets both read and write:
 * tabs between columns, newlines between rows, and a cell containing a tab, newline or quote
 * wrapped in double quotes with inner quotes doubled. Pure functions — the grid owns the events.
 */

/**
 * The `<table>` attribute our own copies carry in the text/html clipboard flavor, holding the JSON
 * payload below. "brv2" is Business Rules v2 — the name is a namespace, not a version to bump:
 * a paste is ours only if this exact string is present, so anything else on the clipboard (Excel,
 * Sheets, another app's table) falls through to the plain-text TSV path.
 */
const CLIPBOARD_PAYLOAD_ATTRIBUTE = 'data-uipath-brv2-payload';

const needsQuoting = (cell: string): boolean =>
  cell.includes('\t') || cell.includes('\n') || cell.includes('\r') || cell.includes('"');

const quoteCell = (cell: string): string =>
  needsQuoting(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;

export const toTsv = (matrix: string[][]): string =>
  matrix.map((row) => row.map(quoteCell).join('\t')).join('\n');

/**
 * Parses TSV with quoted-cell support (embedded tabs, newlines, doubled quotes) — a small state
 * machine rather than a split, because a quoted cell may contain both separators. CRLF and lone
 * CR normalize to LF; one trailing newline (Excel always appends it) does not produce a phantom
 * empty row, but genuinely empty rows inside the block survive.
 */
export const parseTsv = (text: string): string[][] => {
  // Not stripping line breaks — collapsing the three encodings of one into LF, so the state machine
  // has a single row terminator to match. Windows Excel writes CRLF, older Mac apps write lone CR.
  const normalized = text.replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (quoted) {
      if (char === '"') {
        if (normalized[index + 1] === '"') {
          cell += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      cell += char;
      index += 1;
      continue;
    }
    if (char === '"' && cell === '') {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === '\t') {
      row.push(cell);
      cell = '';
      index += 1;
      continue;
    }
    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      index += 1;
      continue;
    }
    cell += char;
    index += 1;
  }
  // The tail: content since the last newline, unless the text ended exactly on one.
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

/**
 * A copied block. Only cell text is *typed* today: MST-13501 puts pasting column *definitions*
 * (typeRef, allowed values) out of scope, so the marked html flavor exists to carry the block's
 * shape into Excel/Sheets and to identify our own content on the way back — the typed-clause
 * payload lands with the code that would consume it, not before.
 *
 * The codec itself is `JSON.stringify`/`JSON.parse` over the whole payload, so unknown keys
 * survive a round trip untouched and unvalidated. That is deliberate — adding a clause field
 * later is an edit to this interface and to the shape check in `fromClipboardHtml`, not to the
 * encoding — but it means a field is only trustworthy once `fromClipboardHtml` checks it. Read
 * nothing off a payload beyond what is declared here.
 */
export interface ClipboardPayload {
  matrix: string[][];
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The text/html flavor: a real `<table>` (so pasting into Excel/Sheets/Word keeps the shape) with
 * the typed payload JSON in a marked attribute — the pattern Sheets itself uses. External
 * consumers ignore the attribute; our paste sniffs it and falls back to plain text without it.
 */
export const toClipboardHtml = (payload: ClipboardPayload): string => {
  const body = payload.matrix
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table ${CLIPBOARD_PAYLOAD_ATTRIBUTE}="${escapeHtml(JSON.stringify(payload))}"><tbody>${body}</tbody></table>`;
};

/** The typed payload out of a text/html clipboard flavor, or null for anything not ours. */
export const fromClipboardHtml = (html: string): ClipboardPayload | null => {
  if (!html.includes(CLIPBOARD_PAYLOAD_ATTRIBUTE)) {
    return null;
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const carrier = parsed.querySelector(`[${CLIPBOARD_PAYLOAD_ATTRIBUTE}]`);
  const raw = carrier?.getAttribute(CLIPBOARD_PAYLOAD_ATTRIBUTE);
  if (!raw) {
    return null;
  }
  try {
    const payload = JSON.parse(raw) as ClipboardPayload;
    // Shape-checked to the cell, not just the outer array: the marker attribute is public, so any
    // page the user copied from can emit one carrying arbitrary JSON, and a malformed matrix would
    // reach the paste planner as `undefined` rows/cells.
    if (
      !Array.isArray(payload.matrix) ||
      !payload.matrix.every(
        (row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string')
      )
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};
