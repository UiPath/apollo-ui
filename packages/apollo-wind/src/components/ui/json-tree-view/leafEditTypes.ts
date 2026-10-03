import type { JsonSchema, JsonTreeNodeType, JsonValue } from './JsonTree.types';

export type LeafEditType = 'string' | 'number' | 'integer' | 'auto';

/** Whether an edit type commits a number (integer is a stricter number). */
export function isNumericEdit(editType: LeafEditType): boolean {
  return editType === 'number' || editType === 'integer';
}

/**
 * The type a leaf edit should commit as. A schema declaring exactly one
 * non-null scalar type wins (`integer` stays distinct so fractional input is
 * rejected); otherwise the current value's type; `auto` (JSON-scalar parsing
 * with string fallback) when neither pins it down.
 */
export function resolveLeafEditType(
  type: JsonTreeNodeType,
  schema: JsonSchema | undefined
): LeafEditType {
  const declared = schema?.type === undefined ? [] : [schema.type].flat();
  const scalars = declared.filter((t) => t === 'string' || t === 'number' || t === 'integer');
  if (scalars.length === 1) {
    const only = scalars[0];
    return only === 'string' ? 'string' : only === 'integer' ? 'integer' : 'number';
  }
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  return 'auto';
}

export function parseLeafValue(raw: string, editType: LeafEditType): JsonValue | undefined {
  if (editType === 'string') return raw;
  if (isNumericEdit(editType)) {
    if (raw.trim() === '') return undefined;
    const parsed = Number(raw);
    // Reject Infinity/NaN (JSON.stringify would turn them into null) and
    // fractional values for an integer schema, so the committed value always
    // round-trips through JSON and matches its declared type.
    if (!Number.isFinite(parsed)) return undefined;
    if (editType === 'integer' && !Number.isInteger(parsed)) return undefined;
    return parsed;
  }
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    return raw;
  }
}
