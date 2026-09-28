import { describe, expect, it } from 'vitest';
import { continueListOnEnter, toggleBulletList, toggleNumberedList } from './listFormatting';

describe('toggleBulletList', () => {
  it('adds bullet prefix to a line', () => {
    const result = toggleBulletList({
      value: 'eggs\nmilk\nbread',
      selectionStart: 5,
      selectionEnd: 5,
    });
    expect(result.value).toBe('eggs\n- milk\nbread');
    expect(result.selectionStart).toBe(7);
  });

  it('removes bullet prefix when already present', () => {
    const result = toggleBulletList({
      value: 'eggs\n- milk\nbread',
      selectionStart: 7,
      selectionEnd: 7,
    });
    expect(result.value).toBe('eggs\nmilk\nbread');
    expect(result.selectionStart).toBe(5);
  });

  it('adds bullet prefix to multiple selected lines', () => {
    const result = toggleBulletList({
      value: 'eggs\nmilk\nbread',
      selectionStart: 5,
      selectionEnd: 14,
    });
    expect(result.value).toBe('eggs\n- milk\n- bread');
  });

  it('removes bullet prefix from all lines when all have it', () => {
    const result = toggleBulletList({
      value: '- eggs\n- milk\n- bread',
      selectionStart: 0,
      selectionEnd: 20,
    });
    expect(result.value).toBe('eggs\nmilk\nbread');
  });

  it('switches from numbered list to bullet list', () => {
    const result = toggleBulletList({
      value: '1. eggs\n2. milk',
      selectionStart: 0,
      selectionEnd: 14,
    });
    expect(result.value).toBe('- eggs\n- milk');
  });

  it('does not treat * as a bullet prefix', () => {
    const result = toggleBulletList({ value: '* milk', selectionStart: 2, selectionEnd: 2 });
    expect(result.value).toBe('- * milk');
  });
});

describe('toggleNumberedList', () => {
  it('adds numbered prefix to a line', () => {
    const result = toggleNumberedList({
      value: 'eggs\nmilk\nbread',
      selectionStart: 5,
      selectionEnd: 5,
    });
    expect(result.value).toBe('eggs\n1. milk\nbread');
    expect(result.selectionStart).toBe(8);
  });

  it('removes numbered prefix when already present', () => {
    const result = toggleNumberedList({
      value: 'eggs\n1. milk\nbread',
      selectionStart: 8,
      selectionEnd: 8,
    });
    expect(result.value).toBe('eggs\nmilk\nbread');
    expect(result.selectionStart).toBe(5);
  });

  it('adds auto-incrementing numbers to multiple lines', () => {
    const result = toggleNumberedList({
      value: 'eggs\nmilk\nbread',
      selectionStart: 0,
      selectionEnd: 14,
    });
    expect(result.value).toBe('1. eggs\n2. milk\n3. bread');
  });

  it('removes numbered prefix from all lines when all have it', () => {
    const result = toggleNumberedList({
      value: '1. eggs\n2. milk\n3. bread',
      selectionStart: 0,
      selectionEnd: 23,
    });
    expect(result.value).toBe('eggs\nmilk\nbread');
  });

  it('switches from bullet list to numbered list', () => {
    const result = toggleNumberedList({
      value: '- eggs\n- milk',
      selectionStart: 0,
      selectionEnd: 12,
    });
    expect(result.value).toBe('1. eggs\n2. milk');
  });
});

describe('continueListOnEnter', () => {
  it('returns null when not on a list line', () => {
    expect(
      continueListOnEnter({ value: 'hello world', selectionStart: 5, selectionEnd: 5 })
    ).toBeNull();
  });

  it('returns null when there is a selection', () => {
    expect(
      continueListOnEnter({ value: '- hello', selectionStart: 2, selectionEnd: 5 })
    ).toBeNull();
  });

  it('continues bullet list with new item', () => {
    const result = continueListOnEnter({ value: '- hello', selectionStart: 7, selectionEnd: 7 })!;
    expect(result.value).toBe('- hello\n- ');
    expect(result.selectionStart).toBe(10);
  });

  it('splits bullet list line at cursor', () => {
    const result = continueListOnEnter({
      value: '- hello world',
      selectionStart: 7,
      selectionEnd: 7,
    })!;
    expect(result.value).toBe('- hello\n-  world');
    expect(result.selectionStart).toBe(10);
  });

  it('exits bullet list on empty item', () => {
    const result = continueListOnEnter({
      value: '- hello\n- ',
      selectionStart: 10,
      selectionEnd: 10,
    })!;
    expect(result.value).toBe('- hello\n');
    expect(result.selectionStart).toBe(8);
  });

  it('continues numbered list with next number', () => {
    const result = continueListOnEnter({ value: '1. hello', selectionStart: 8, selectionEnd: 8 })!;
    expect(result.value).toBe('1. hello\n2. ');
    expect(result.selectionStart).toBe(12);
  });

  it('auto-increments from higher numbers', () => {
    const result = continueListOnEnter({
      value: '1. first\n2. second',
      selectionStart: 18,
      selectionEnd: 18,
    })!;
    expect(result.value).toBe('1. first\n2. second\n3. ');
    expect(result.selectionStart).toBe(22);
  });

  it('exits numbered list on empty item', () => {
    const result = continueListOnEnter({
      value: '1. hello\n2. ',
      selectionStart: 12,
      selectionEnd: 12,
    })!;
    expect(result.value).toBe('1. hello\n');
    expect(result.selectionStart).toBe(9);
  });

  it('preserves indentation', () => {
    const bullet = continueListOnEnter({ value: '  - hello', selectionStart: 9, selectionEnd: 9 })!;
    expect(bullet.value).toBe('  - hello\n  - ');

    const numbered = continueListOnEnter({
      value: '  1. hello',
      selectionStart: 10,
      selectionEnd: 10,
    })!;
    expect(numbered.value).toBe('  1. hello\n  2. ');
  });
});
