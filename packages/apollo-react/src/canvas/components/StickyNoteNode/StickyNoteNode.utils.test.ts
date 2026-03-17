import { describe, expect, it } from 'vitest';
import { preserveNewlines } from './StickyNoteNode.utils';

describe('preserveNewlines', () => {
  it('returns input unchanged when there are no newlines', () => {
    expect(preserveNewlines('hello world')).toBe('hello world');
  });

  it('returns input unchanged for single newline', () => {
    expect(preserveNewlines('hello\nworld')).toBe('hello\nworld');
  });

  it('returns input unchanged for double newline (standard paragraph break)', () => {
    expect(preserveNewlines('hello\n\nworld')).toBe('hello\n\nworld');
  });

  it('preserves triple newline as paragraph break + one &nbsp; line', () => {
    expect(preserveNewlines('hey\n\n\nhey')).toBe('hey\n\n&nbsp;\n\nhey');
  });

  it('preserves four newlines as paragraph break + two &nbsp; lines', () => {
    expect(preserveNewlines('hey\n\n\n\nhey')).toBe('hey\n\n&nbsp;\n\n&nbsp;\n\nhey');
  });

  it('handles multiple groups of excess newlines', () => {
    const input = 'a\n\n\nb\n\n\n\nc';
    const result = preserveNewlines(input);
    expect(result).toBe('a\n\n&nbsp;\n\nb\n\n&nbsp;\n\n&nbsp;\n\nc');
  });

  it('returns empty string unchanged', () => {
    expect(preserveNewlines('')).toBe('');
  });

  it('does not modify newlines inside code blocks', () => {
    const input = '```\nline1\n\n\n\nline2\n```';
    const result = preserveNewlines(input);
    // Code block content should not have &nbsp; inserted
    expect(result).not.toContain('&nbsp;');
    expect(result).toContain('line1\n\n\n\nline2');
  });

  it('preserves newlines outside code blocks but not inside', () => {
    const input = 'before\n\n\ncode:\n```\na\n\n\n\nb\n```\n\n\nafter';
    const result = preserveNewlines(input);
    // Outside code block: \n\n\n → \n\n&nbsp;\n\n
    // Inside code block: unchanged
    expect(result).toContain('before\n\n&nbsp;\n\ncode:');
    expect(result).toContain('```\na\n\n\n\nb\n```');
    expect(result).toContain('\n\n&nbsp;\n\nafter');
  });

  it('handles multiple code blocks', () => {
    const input = '```a```\n\n\n```b```';
    const result = preserveNewlines(input);
    expect(result).toContain('```a```');
    expect(result).toContain('```b```');
  });

  it('preserves header formatting', () => {
    expect(preserveNewlines('# Title\n\nContent')).toBe('# Title\n\nContent');
    expect(preserveNewlines('## Subtitle\n\nContent')).toBe('## Subtitle\n\nContent');
  });
});
