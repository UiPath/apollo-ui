import type { PromptEditorToken } from '../types';

/** Check if two token arrays are deeply equal */
export const areTokensEqual = (a: PromptEditorToken[], b: PromptEditorToken[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((token, i) => token.type === b[i].type && token.value === b[i].value);
};
