/**
 * What rules, conditions and data sources read for a value in a mode other than `literal`: set,
 * but equal to nothing, whatever shape the codec stores it in. Apart from `value-modes.ts` so the
 * rules engine can recognize it without importing the codec layer.
 */
export const VALUE_MODE_OPAQUE: Readonly<object> = Object.freeze({
  [Symbol.toStringTag]: 'ValueModeOpaque',
});

export function isValueModeOpaque(value: unknown): boolean {
  return value === VALUE_MODE_OPAQUE;
}
