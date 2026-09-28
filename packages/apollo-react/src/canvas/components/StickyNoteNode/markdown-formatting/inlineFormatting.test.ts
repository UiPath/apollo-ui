import { describe, expect, it } from 'vitest';
import { toggleBold, toggleItalic, toggleStrikethrough } from './inlineFormatting';

// All three formats share toggleInlineWrap. Tests use toggleBold as the representative
// unless a test covers behavior unique to a specific marker.

describe('inline formatting (via toggleBold)', () => {
  it('wraps selected text', () => {
    const result = toggleBold({ value: 'hello world end', selectionStart: 6, selectionEnd: 11 });
    expect(result.value).toBe('hello **world** end');
    expect(result.selectionStart).toBe(8);
    expect(result.selectionEnd).toBe(13);
  });

  it('unwraps already-wrapped selected text', () => {
    const result = toggleBold({
      value: 'hello **world** end',
      selectionStart: 8,
      selectionEnd: 13,
    });
    expect(result.value).toBe('hello world end');
  });

  it('inserts empty markers on a plain line with no selection', () => {
    const result = toggleBold({ value: 'hello end', selectionStart: 6, selectionEnd: 6 });
    expect(result.value).toBe('hello ****end');
    expect(result.selectionStart).toBe(8);
  });

  it('removes markers when cursor is inside formatted region', () => {
    const result = toggleBold({
      value: 'hello **world** end',
      selectionStart: 10,
      selectionEnd: 10,
    });
    expect(result.value).toBe('hello world end');
  });

  it('wraps list line content with no selection', () => {
    const result = toggleBold({ value: '1. hello', selectionStart: 5, selectionEnd: 5 });
    expect(result.value).toBe('1. **hello**');
  });

  it('removes markers on a list line', () => {
    const result = toggleBold({ value: '1. **hello**', selectionStart: 7, selectionEnd: 7 });
    expect(result.value).toBe('1. hello');
  });

  it('wraps and unwraps each list line individually', () => {
    const wrapped = toggleBold({
      value: '1. hello\n2. world',
      selectionStart: 0,
      selectionEnd: 17,
    });
    expect(wrapped.value).toBe('1. **hello**\n2. **world**');

    const unwrapped = toggleBold({
      value: '1. **hello**\n2. **world**',
      selectionStart: 0,
      selectionEnd: 25,
    });
    expect(unwrapped.value).toBe('1. hello\n2. world');
  });
});

describe('italic / bold boundary', () => {
  it('does not unwrap bold markers when toggling italic', () => {
    const result = toggleItalic({ value: '**world**', selectionStart: 2, selectionEnd: 7 });
    expect(result.value).toBe('***world***');
  });

  it('unwraps italic from bold+italic list lines (***)', () => {
    const result = toggleItalic({
      value: '1. ***hello***\n2. ***world***',
      selectionStart: 0,
      selectionEnd: 29,
    });
    expect(result.value).toBe('1. **hello**\n2. **world**');
  });

  it('wraps italic onto bold-only list lines', () => {
    const result = toggleItalic({
      value: '1. **hello**\n2. **world**',
      selectionStart: 0,
      selectionEnd: 25,
    });
    expect(result.value).toBe('1. ***hello***\n2. ***world***');
  });
});

describe('strikethrough uses ~~ marker', () => {
  it('wraps and unwraps with ~~', () => {
    const wrapped = toggleStrikethrough({
      value: 'hello world end',
      selectionStart: 6,
      selectionEnd: 11,
    });
    expect(wrapped.value).toBe('hello ~~world~~ end');

    const unwrapped = toggleStrikethrough({
      value: 'hello ~~world~~ end',
      selectionStart: 8,
      selectionEnd: 13,
    });
    expect(unwrapped.value).toBe('hello world end');
  });
});
