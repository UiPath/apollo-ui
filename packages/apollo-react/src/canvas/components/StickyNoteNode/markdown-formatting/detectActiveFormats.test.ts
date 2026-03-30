import { describe, expect, it } from 'vitest';
import { detectActiveFormats } from './detectActiveFormats';

describe('detectActiveFormats', () => {
  it('detects bold when cursor is inside ** markers', () => {
    const result = detectActiveFormats({
      value: 'hello **world** end',
      selectionStart: 10,
      selectionEnd: 10,
    });
    expect(result.bold).toBe(true);
    expect(result.italic).toBe(false);
  });

  it('detects italic when cursor is inside * markers', () => {
    const result = detectActiveFormats({
      value: 'hello *world* end',
      selectionStart: 9,
      selectionEnd: 9,
    });
    expect(result.italic).toBe(true);
    expect(result.bold).toBe(false);
  });

  it('detects both bold and italic inside *** markers', () => {
    const result = detectActiveFormats({
      value: 'hello ***world*** end',
      selectionStart: 11,
      selectionEnd: 11,
    });
    expect(result.bold).toBe(true);
    expect(result.italic).toBe(true);
  });

  it('detects bold and italic with separate nested markers', () => {
    const result = detectActiveFormats({
      value: 'hello **say *world* now** end',
      selectionStart: 15,
      selectionEnd: 15,
    });
    expect(result.bold).toBe(true);
    expect(result.italic).toBe(true);
  });

  it('detects strikethrough when cursor is inside ~~ markers', () => {
    const result = detectActiveFormats({
      value: 'hello ~~world~~ end',
      selectionStart: 10,
      selectionEnd: 10,
    });
    expect(result.strikethrough).toBe(true);
  });

  it('does not detect formatting across line boundaries', () => {
    expect(
      detectActiveFormats({ value: '**hello\nworld**', selectionStart: 10, selectionEnd: 10 }).bold
    ).toBe(false);
    expect(
      detectActiveFormats({ value: '*hello\nworld*', selectionStart: 9, selectionEnd: 9 }).italic
    ).toBe(false);
    expect(
      detectActiveFormats({ value: '~~hello\nworld~~', selectionStart: 10, selectionEnd: 10 })
        .strikethrough
    ).toBe(false);
  });

  it('detects bullet list on current line', () => {
    const result = detectActiveFormats({
      value: '- hello world',
      selectionStart: 5,
      selectionEnd: 5,
    });
    expect(result.bulletList).toBe(true);
    expect(result.numberedList).toBe(false);
  });

  it('detects numbered list on current line', () => {
    const result = detectActiveFormats({
      value: '1. hello world',
      selectionStart: 5,
      selectionEnd: 5,
    });
    expect(result.numberedList).toBe(true);
    expect(result.bulletList).toBe(false);
  });

  it('returns all false when no formatting', () => {
    const result = detectActiveFormats({ value: 'plain text', selectionStart: 5, selectionEnd: 5 });
    expect(result.bold).toBe(false);
    expect(result.italic).toBe(false);
    expect(result.strikethrough).toBe(false);
    expect(result.bulletList).toBe(false);
    expect(result.numberedList).toBe(false);
  });
});
