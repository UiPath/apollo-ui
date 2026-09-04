import { describe, expect, it } from 'vitest';
import type { PromptEditorToken } from '../types';
import { normalizeRichTextTokens } from './rich-serialization';

const text = (value: string): PromptEditorToken => ({ type: 'text', value });
const pill = (value: string): PromptEditorToken => ({ type: 'input', value });

describe('rich-serialization', () => {
  /**
   * GUARDRAIL: canonical persisted values must survive the rich editor untouched — a rewrite here
   * means every open/save cycle would dirty stored connector values. Do not relax; fix the
   * transformer set instead.
   */
  describe('untouched round-trip (canonical forms)', () => {
    it.each<[string, PromptEditorToken[]]>([
      ['plain text', [text('hello world')]],
      ['bold', [text('a **bold** word')]],
      ['italic', [text('an *italic* word')]],
      ['strikethrough', [text('a ~~struck~~ word')]],
      ['bulleted list', [text('- one\n- two')]],
      ['numbered list', [text('1. one\n2. two')]],
      ['single newline', [text('a\nb')]],
      ['blank line', [text('a\n\nb')]],
      ['literal asterisk math', [text('2 * 3 = 6')]],
      ['snake_case literal', [text('use my_var_name here')]],
      ['literal heading marker', [text('# not a heading')]],
      ['literal backticks', [text('run `ls -la` maybe')]],
      ['pill mid-text', [text('Hi '), pill('vars.firstName'), text(', welcome')]],
      ['pill only', [pill('vars.firstName')]],
      ['pill in a list item', [text('- greet '), pill('vars.firstName')]],
      ['formatted around pill', [text('**Hello** '), pill('vars.firstName'), text(' *there*')]],
      ['multi-paragraph with formatting', [text('**Intro**\n\n- a\n- b\n\nOutro *end*')]],
    ])('%s', (_name, tokens) => {
      expect(normalizeRichTextTokens(tokens)).toEqual(tokens);
    });

    it('is idempotent for every corpus entry after one normalization pass', () => {
      const messy: PromptEditorToken[] = [
        text('_legacy em_ and * spaced list\nplus __legacy bold__'),
      ];
      const once = normalizeRichTextTokens(messy);
      expect(normalizeRichTextTokens(once)).toEqual(once);
    });
  });

  describe('documented normalizations (non-canonical input rewrites once, then stays stable)', () => {
    it('normalizes underscore emphasis to star forms', () => {
      expect(normalizeRichTextTokens([text('_em_ and __strong__')])).toEqual([
        text('*em* and **strong**'),
      ]);
    });

    it('keeps * list markers literal (0.42 imports only - bullets) — round-trip safe', () => {
      expect(normalizeRichTextTokens([text('* one\n* two')])).toEqual([text('* one\n* two')]);
    });
  });

  describe('pill handling', () => {
    it('keeps pill token types and values verbatim, including markdown characters in paths', () => {
      const tokens: PromptEditorToken[] = [
        text('a '),
        { type: 'output', value: 'vars.items[0].snake_name' },
        text(' b '),
        { type: 'state', value: 'state.a*b' },
      ];
      expect(normalizeRichTextTokens(tokens)).toEqual(tokens);
    });

    it('strips literal sentinel characters from incoming text so the side table cannot be corrupted', () => {
      const result = normalizeRichTextTokens([text('a\uE0000\uE001b')]);
      expect(result).toEqual([text('a0b')]);
    });

    it('merges adjacent text output into single tokens', () => {
      const result = normalizeRichTextTokens([text('a'), text('b '), pill('vars.x')]);
      expect(result).toEqual([text('ab '), pill('vars.x')]);
    });
  });
});
