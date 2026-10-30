import * as React from 'react';
import type { Rule } from '@/components/ui/rules-editor';
import { type FieldRulesOptions, fromFieldRules, toFieldRules } from './field-rules';
import type { FieldRule } from './form-schema';

/**
 * Connects a RulesEditor to stored `FieldRule`s. The editor keeps its own rules, so a host that
 * writes on every change keeps blank rows and focus, and the stored rules are read again only
 * when they change from outside. Pass back the array `onChange` gave you to keep that state.
 *
 * Pass `options` with a stable identity: a new object re-reads nothing, but writes use the latest.
 */
export function useFieldRules(
  fieldRules: readonly FieldRule[] | undefined,
  onChange: (next: FieldRule[]) => void,
  options: FieldRulesOptions
) {
  const [state, setState] = React.useState(() => ({
    source: fieldRules,
    rules: fromFieldRules(fieldRules ?? [], options),
  }));

  // New stored rules from outside, such as an undo or another editor: read them again. Adjusting
  // state while rendering, so the editor never shows a frame of the old rules.
  let current = state;
  if (fieldRules !== state.source) {
    current = { source: fieldRules, rules: fromFieldRules(fieldRules ?? [], options) };
    setState(current);
  }

  const latest = React.useRef({ onChange, options });
  latest.current = { onChange, options };
  const change = React.useCallback((next: Rule[]) => {
    const written = toFieldRules(next, latest.current.options);
    // The written array becomes the source, so its echo back is not read again.
    setState({ source: written, rules: next });
    latest.current.onChange(written);
  }, []);

  return { value: current.rules, onChange: change };
}
