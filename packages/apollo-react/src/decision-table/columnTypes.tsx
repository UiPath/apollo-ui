import { Braces } from 'lucide-react';
import type React from 'react';
import type { PopoverSelectOption } from './PopoverSelect';

/** A column type the host offers: its id, its words, its glyph, and an example of its allowed values. */
export interface ColumnTypeOption<Type> {
  type: Type;
  label: string;
  icon: React.ReactNode;
  example: string;
}

/** The words of a column type's allowed values. */
export interface ColumnTypeLabels {
  /** The allowed values' placeholder from a type's example, e.g. "e.g. 1, 2". */
  allowedValuesExample: (example: string) => string;
}

/** A type the column popover's select offers, by its place among the host's, with its allowed values' placeholder. */
export interface ColumnTypeChoice extends PopoverSelectOption {
  allowedValuesPlaceholder: string;
}

/** The host's types as the popover's select offers them. */
export const columnTypeChoicesOf = <Type,>(
  types: readonly ColumnTypeOption<Type>[],
  labels: ColumnTypeLabels
): ColumnTypeChoice[] =>
  types.map(({ label, icon, example }, index) => ({
    id: String(index),
    label,
    icon,
    allowedValuesPlaceholder: labels.allowedValuesExample(example),
  }));

/** The place of a type among the host's, or -1 when it offers none such. */
export const columnTypeIndexOf = <Type,>(
  types: readonly ColumnTypeOption<Type>[],
  type: Type
): number => types.findIndex((option) => option.type === type);

/** A column type's glyph from the host's types, else any value's. */
export const glyphOf = <Type,>(
  types: readonly ColumnTypeOption<Type>[],
  type: Type
): React.ReactNode => types.find((option) => option.type === type)?.icon ?? <Braces />;
