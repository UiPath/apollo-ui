import type { PromptEditorAutoCompleteOption, PromptEditorTokenType } from '../types';

/**
 * Helpers for the prompt editor's `$`-trigger flow that survived after the bespoke segment-aware
 * drill-in menu was replaced by `<VariablePickerAutocompleteMenu>`. The picker itself owns search,
 * keyboard nav, and visual rendering — these helpers cover the parts of the trigger flow that live
 * in `AutocompletePlugin`: free-form Enter commit (when the typed `$prefix.path` doesn't match any
 * scope entry) and the dismissal sentinel that suppresses re-opening on cursor returns.
 */

/** Leading-namespace → token type, for free-form paths with no matching option to inherit from. */
const NAMESPACE_TOKEN_TYPE: Record<string, Exclude<PromptEditorTokenType, 'text'>> = {
  state: 'state',
  resource: 'resource',
};

/**
 * Infer the token type for a typed-but-unmatched path by walking up parent prefixes in the option set.
 * Mirrors `findVariableForPath`'s ancestor-fallback shape so a free-form chip inherits the closest
 * known parent's type. With no matching ancestor, falls back to the leading namespace (`state.*` →
 * `state`, `resource.*` → `resource`) so those chips get the right node type even before a matching
 * option exists; everything else (`vars.*`, `metadata.*`, `agent.*`) defaults to `'input'`.
 */
export const inferTokenTypeFromPath = (
  path: string,
  options: PromptEditorAutoCompleteOption[]
): Exclude<PromptEditorTokenType, 'text'> => {
  for (const opt of options) {
    if (opt.value === path) return opt.type;
  }
  const segments = path.split('.');
  while (segments.length > 1) {
    segments.pop();
    const prefix = segments.join('.');
    for (const opt of options) {
      if (opt.value === prefix) return opt.type;
    }
  }
  return NAMESPACE_TOKEN_TYPE[path.split('.')[0]] ?? 'input';
};

/**
 * Recognised free-form path syntax for committing typed-but-unmatched paths as chips. Covers the
 * namespaces apollo-wind's public token types/options use — `vars`/`metadata`/`agent` plus `state`
 * and `resource` (the `state.*` / `resource.*` examples in the stories), so free-form state/resource
 * paths can be committed the same as input/output ones.
 */
export const VARIABLE_PATH_REGEX =
  /^(?:vars|metadata|agent|state|resource)\.[a-zA-Z_][a-zA-Z0-9_.]*$/;

/** Identifier for the `$` position the picker was last dismissed for. */
export interface TriggerKey {
  triggerIndex: number;
  nodeKey: string;
}

/**
 * Decide whether the autocomplete should suppress reopening. After the user dismisses the picker
 * (Escape, click-outside), we remember the dismissed `$` position and don't reopen for it on a
 * cursor-only return — gives the user a window to Backspace the `$` without the picker grabbing
 * focus again. Once the editor's text changes (any new typing), the dismissal sentinel is cleared
 * and the next valid trigger opens the picker fresh.
 */
export function shouldSuppressOpenForDismissed(
  trigger: TriggerKey,
  dismissed: TriggerKey | null
): boolean {
  if (!dismissed) return false;
  return dismissed.nodeKey === trigger.nodeKey && dismissed.triggerIndex === trigger.triggerIndex;
}
