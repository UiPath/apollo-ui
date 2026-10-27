import {
  type ClipboardPayload,
  fromClipboardHtml,
  parseTsv,
  toClipboardHtml,
  toTsv,
} from './clipboardCodec';

describe('clipboard codec', () => {
  it('round-trips a plain block', () => {
    const matrix = [
      ['>= 700', '"gold"'],
      ['< 700', '"silver"'],
    ];
    expect(parseTsv(toTsv(matrix))).toEqual(matrix);
  });

  it('quotes cells carrying tabs, newlines and quotes the way Excel reads them', () => {
    const matrix = [['contains\ttab', 'multi\nline', 'she said "hi"']];
    const tsv = toTsv(matrix);
    expect(tsv).toBe('"contains\ttab"\t"multi\nline"\t"she said ""hi"""');
    expect(parseTsv(tsv)).toEqual(matrix);
  });

  it('normalizes CRLF and lone CR to LF', () => {
    expect(parseTsv('a\tb\r\nc\td\re\tf')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('swallows the single trailing newline Excel appends, but keeps interior empty rows', () => {
    expect(parseTsv('a\nb\n')).toEqual([['a'], ['b']]);
    expect(parseTsv('a\n\nb')).toEqual([['a'], [''], ['b']]);
  });

  it('keeps empty cells at row edges', () => {
    expect(parseTsv('\ta\t')).toEqual([['', 'a', '']]);
  });

  it('carries the matrix through the marked html flavor', () => {
    const payload: ClipboardPayload = { matrix: [['-', '"x"']] };
    expect(fromClipboardHtml(toClipboardHtml(payload))).toEqual(payload);
  });

  // Guards the encoding, not a feature: adding a clause payload (MST-13501) should be an edit to
  // ClipboardPayload and to the shape check, never to the codec. `columns` is a stand-in — it is
  // untyped and unvalidated today, so nothing may read it off a payload yet.
  it('round-trips undeclared keys, so a future clause payload needs no codec change', () => {
    const payload = { matrix: [['a']], columns: [{ typeRef: 'number' }] };
    expect(fromClipboardHtml(toClipboardHtml(payload))).toEqual(payload);
  });

  it('escapes markup-bearing cells in the html flavor', () => {
    const payload = { matrix: [['<b>&"</b>']] };
    const html = toClipboardHtml(payload);
    expect(fromClipboardHtml(html)).toEqual(payload);
    expect(html).not.toContain('<b>');
  });

  it('treats foreign html — a Sheets paste, a web page — as not ours', () => {
    expect(fromClipboardHtml('<table><tr><td>external</td></tr></table>')).toBeNull();
    expect(fromClipboardHtml('')).toBeNull();
  });

  it('rejects a marked payload whose shape is wrong — the marker is public, so it is untrusted', () => {
    const marked = (raw: string) => `<table data-uipath-brv2-payload='${raw}'></table>`;

    expect(fromClipboardHtml(marked('not json at all'))).toBeNull();
    expect(fromClipboardHtml(marked(JSON.stringify({ matrix: 'nope' })))).toBeNull();
    expect(fromClipboardHtml(marked(JSON.stringify({ matrix: [['ok'], 'not a row'] })))).toBeNull();
    // Cells must be strings: a number would reach the paste planner and be written as a cell.
    expect(fromClipboardHtml(marked(JSON.stringify({ matrix: [[1, 2]] })))).toBeNull();
    expect(fromClipboardHtml(marked(JSON.stringify({ notMatrix: [] })))).toBeNull();
  });
});
