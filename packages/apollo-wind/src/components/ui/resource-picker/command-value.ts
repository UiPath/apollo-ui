/**
 * cmdk trims every item value, so two distinct consumer ids such as `a` and
 * ` a ` would meet as one, and an id with outer whitespace would no longer
 * match itself when read back from the DOM. Every value the picker hands
 * cmdk is therefore encoded losslessly, as a JSON string literal, whose
 * quotes keep any whitespace inside them, and decoded wherever a cmdk or DOM
 * value is matched against an id.
 */
export const toCommandValue = (value: string) => JSON.stringify(value);

/** The id a cmdk value encodes. `''` for no value, or one the picker did not encode. */
export const fromCommandValue = (value: string | null | undefined): string => {
  if (!value) return '';
  try {
    const decoded: unknown = JSON.parse(value);
    return typeof decoded === 'string' ? decoded : '';
  } catch {
    return '';
  }
};
