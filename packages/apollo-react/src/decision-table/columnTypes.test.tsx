import { Braces } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  type ColumnTypeOption,
  columnTypeChoicesOf,
  columnTypeIndexOf,
  glyphOf,
} from './columnTypes';

type Kind = 'text' | 'count' | 'other';

const TYPES: readonly ColumnTypeOption<Kind>[] = [
  { type: 'text', label: 'Text', icon: <span>T</span>, example: '"a", "b"' },
  { type: 'count', label: 'Count', icon: <span>#</span>, example: '1, 2' },
];

describe('columnTypeChoicesOf', () => {
  it("offers the host's types by place, each example as the allowed values' placeholder", () => {
    expect(
      columnTypeChoicesOf(TYPES, { allowedValuesExample: (example) => `e.g. ${example}` }).map(
        ({ id, label, allowedValuesPlaceholder }) => [id, label, allowedValuesPlaceholder]
      )
    ).toEqual([
      ['0', 'Text', 'e.g. "a", "b"'],
      ['1', 'Count', 'e.g. 1, 2'],
    ]);
  });
});

describe('columnTypeIndexOf', () => {
  it("finds a type's place, or -1 for one the host does not offer", () => {
    expect(columnTypeIndexOf(TYPES, 'count')).toBe(1);
    expect(columnTypeIndexOf(TYPES, 'other')).toBe(-1);
  });
});

describe('glyphOf', () => {
  it("shows the host's glyph for its type, else any value's", () => {
    expect(glyphOf(TYPES, 'count')).toEqual(<span>#</span>);
    expect(glyphOf(TYPES, 'other')).toEqual(<Braces />);
  });
});
