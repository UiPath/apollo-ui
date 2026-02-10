import type { Editor, Range } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { getFullMentionQuery } from './tiptap.utils';

const DOUBLE_SPACE = '  ';

function makeMockEditor(textAfterAt: string, parentEnd: number): Editor {
  return {
    state: {
      doc: {
        resolve: () => ({ end: () => parentEnd }),
        textBetween: () => textAfterAt,
      },
    },
  } as unknown as Editor;
}

describe('getFullMentionQuery', () => {
  it('returns the full mention text regardless of cursor position', () => {
    const editor = makeMockEditor('queue name', 20);
    const range: Range = { from: 5, to: 9 };

    const result = getFullMentionQuery(editor, range);

    expect(result.query).toBe('queue name');
    expect(result.fullRange).toEqual({ from: 5, to: 16 });
  });

  it('splits on the terminator and returns only the part before it', () => {
    const editor = makeMockEditor(`my queue${DOUBLE_SPACE}extra text`, 30);
    const range: Range = { from: 0, to: 5 };

    const result = getFullMentionQuery(editor, range);

    expect(result.query).toBe('my queue');
    expect(result.fullRange).toEqual({ from: 0, to: 9 });
  });

  it('returns empty query when text after @ starts with a space', () => {
    const editor = makeMockEditor(' current', 20);
    const range: Range = { from: 5, to: 6 };

    const result = getFullMentionQuery(editor, range);

    expect(result.query).toBe('');
    expect(result.fullRange).toBe(range);
  });

  it('returns empty query when cursor is at paragraph boundary', () => {
    const parentEnd = 10;
    const editor = makeMockEditor('', parentEnd);
    const range: Range = { from: parentEnd - 1, to: parentEnd };

    const result = getFullMentionQuery(editor, range);

    expect(result.query).toBe('');
    expect(result.fullRange).toBe(range);
  });
});
