import { describe, expect, it } from 'vitest';
import type { PromptEditorToken } from '../types';
import { clipboardStringToTokens, tokensToClipboardString } from './serialization';

describe('clipboard serialization', () => {
  describe('tokensToClipboardString', () => {
    it('writes text tokens verbatim and wraps variable tokens in {{ }}', () => {
      const tokens: PromptEditorToken[] = [
        { type: 'text', value: 'Hi ' },
        { type: 'input', value: 'vars.firstName' },
        { type: 'text', value: ', see ' },
        { type: 'output', value: 'vars.summary' },
      ];
      expect(tokensToClipboardString(tokens)).toBe(
        'Hi {{ vars.firstName }}, see {{ vars.summary }}'
      );
    });

    it('returns an empty string for no tokens', () => {
      expect(tokensToClipboardString([])).toBe('');
    });
  });

  describe('clipboardStringToTokens', () => {
    it('parses plain text into a single text token', () => {
      expect(clipboardStringToTokens('just text')).toEqual([{ type: 'text', value: 'just text' }]);
    });

    it('parses a {{ }} segment into a variable token (trimmed)', () => {
      expect(clipboardStringToTokens('{{ vars.firstName }}')).toEqual([
        { type: 'input', value: 'vars.firstName' },
      ]);
    });

    it('splits mixed text and variable segments', () => {
      expect(clipboardStringToTokens('Hi {{ vars.x }}!')).toEqual([
        { type: 'text', value: 'Hi ' },
        { type: 'input', value: 'vars.x' },
        { type: 'text', value: '!' },
      ]);
    });

    it('keeps an empty {{}} as literal text rather than an empty token', () => {
      // leading text is flushed before the brace is handled, so the literal `{{}}` is kept as text
      // and emitted as its own (unmerged) text token
      expect(clipboardStringToTokens('a {{}} b')).toEqual([
        { type: 'text', value: 'a ' },
        { type: 'text', value: '{{}} b' },
      ]);
    });

    it('keeps an unclosed {{ as literal text', () => {
      expect(clipboardStringToTokens('a {{ vars.x')).toEqual([
        { type: 'text', value: 'a ' },
        { type: 'text', value: '{{ vars.x' },
      ]);
    });
  });

  describe('round-trip', () => {
    it('preserves text and variable values (non-text types normalize to input on paste)', () => {
      const original: PromptEditorToken[] = [
        { type: 'text', value: 'Greet ' },
        { type: 'output', value: 'vars.summary' },
      ];
      const reparsed = clipboardStringToTokens(tokensToClipboardString(original));
      expect(reparsed).toEqual([
        { type: 'text', value: 'Greet ' },
        // pasted variables default to 'input' — value + text round-trip, type does not
        { type: 'input', value: 'vars.summary' },
      ]);
    });
  });
});
