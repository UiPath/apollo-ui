import * as React from 'react';
import { findRuleIssues, type Rule } from '@/components/ui/rules-editor';
import {
  alwaysApplying,
  type FieldRulesOptions,
  flagOutcome,
  readStoredRules,
  type StoredFieldRules,
  settleAlways,
  writeStoredRules,
} from './field-rules';
import type { FieldRule } from './form-schema';
import {
  RULES_ENGINE_OPERATORS,
  rulesEngineDialect,
  rulesEngineVocabulary,
} from './rules-engine-dialect';

/**
 * Connects a RulesEditor to a field's stored `FieldRule`s. The editor keeps its own rules, so a
 * host that writes on every change keeps blank rows and focus, and the stored rules are read again
 * only when they change from outside. Pass back the arrays `onChange` gives you, at once or later,
 * to keep that state.
 *
 * With `options.requiredOutcome`, the field's own `required` flag reads as a rule of that outcome
 * with no conditions, and `onChange` writes that rule back as the flag, in the same call as the
 * rules.
 *
 * A rule that applied always goes on being stored that way once it is given a condition, until one
 * of its conditions is finished: a required field stays required while its first condition is
 * filled in.
 *
 * `issues` lists what needs attention in the editor's rules, unfinished ones included, as
 * `findRuleIssues` finds it with `rulesEngineDialect`: such as to flag the field elsewhere.
 *
 * Pass `options` with a stable identity: a new object re-reads nothing, but writes use the latest.
 */
export function useFieldRules(
  stored: StoredFieldRules,
  onChange: (next: { rules: FieldRule[]; required: boolean }) => void,
  options: FieldRulesOptions
) {
  // The flag is read only with a `requiredOutcome` it can stand for, so otherwise its changes are
  // not news.
  const flag = flagOutcome(options) ? !!stored.required : undefined;
  const [state, setState] = React.useState(() => ({
    source: stored.rules,
    flag,
    rules: readStoredRules(stored, options),
  }));
  // Every array this hook wrote, with the flag written beside it. A host may pass one back late,
  // or after a newer edit, so any of them is an echo, never new rules to read.
  const [written] = React.useState(() => new WeakMap<readonly FieldRule[], boolean | undefined>());
  // The rules last stored as applying always, by id.
  const always = React.useRef<Set<string> | null>(null);
  always.current ??= alwaysApplying(state.rules);

  // New stored rules from outside, such as an undo or another editor: read them again. Adjusting
  // state while rendering, so the editor never shows a frame of the old rules.
  let current = state;
  if (stored.rules !== state.source || flag !== state.flag) {
    const echo =
      stored.rules !== undefined && written.has(stored.rules) && written.get(stored.rules) === flag;
    const rules = echo ? state.rules : readStoredRules(stored, options);
    if (!echo) always.current = alwaysApplying(rules);
    current = { source: stored.rules, flag, rules };
    setState(current);
  }

  const latest = React.useRef({ onChange, options, required: !!stored.required });
  latest.current = { onChange, options, required: !!stored.required };
  const change = React.useCallback(
    (next: Rule[]) => {
      const { onChange, options, required } = latest.current;
      const settled = settleAlways(next, options, always.current ?? new Set());
      always.current = alwaysApplying(settled);
      const result = writeStoredRules(settled, options);
      // Unless the flag stands for `requiredOutcome`, it is not this hook's: it goes back as it came.
      const owned = flagOutcome(options) !== undefined;
      const nextRequired = owned ? result.required : required;
      written.set(result.rules, owned ? nextRequired : undefined);
      setState((previous) => ({ ...previous, rules: next }));
      onChange({ rules: result.rules, required: nextRequired });
    },
    [written]
  );

  const issues = React.useMemo(
    () =>
      findRuleIssues(
        current.rules,
        {
          outcomes: options.outcomes,
          fields: options.fields,
          operators: options.operators ?? RULES_ENGINE_OPERATORS,
          valueModes: rulesEngineVocabulary.valueModes,
        },
        rulesEngineDialect
      ),
    [current.rules, options.outcomes, options.fields, options.operators]
  );

  return { value: current.rules, onChange: change, issues };
}
