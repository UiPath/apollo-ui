import { describe, expect, it } from 'vitest';
import { textToDocument } from './tiptap.utils';

describe('textToDocument', () => {
  it('returns empty content for empty string', () => {
    expect(textToDocument('')).toEqual({ type: 'doc', content: [] });
  });

  it('creates a single paragraph for a single line', () => {
    expect(textToDocument('hello')).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
    });
  });

  it('creates multiple paragraphs for newlines', () => {
    expect(textToDocument('line1\nline2')).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'line1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'line2' }] },
      ],
    });
  });

  it('creates empty paragraph for blank lines', () => {
    expect(textToDocument('a\n\nb')).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
      ],
    });
  });
});
