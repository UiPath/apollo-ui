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

/** Key-order-insensitive JSON, so a copy parsed again compares equal to what was written. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : inner
  );
}

const contentKey = (rules: readonly FieldRule[] | undefined, flag: boolean | undefined) =>
  canonicalJson([rules ?? null, flag ?? null]);

/**
 * Connects a RulesEditor to a field's stored `FieldRule`s. The editor keeps its own rules, so a
 * host that writes on every change keeps blank rows and focus, and the stored rules are read again
 * only when their content changes from outside. A host may pass a new array on every render, such
 * as one parsed again from its schema: an array with the content last read or written, in any key
 * order, is not news.
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
    key: contentKey(stored.rules, flag),
    rules: readStoredRules(stored, options),
  }));
  // Every array this hook wrote, with the flag written beside it. A host may pass one back late,
  // or after a newer edit, so any of them is an echo, never new rules to read.
  const [written] = React.useState(() => new WeakMap<readonly FieldRule[], boolean | undefined>());
  // The content last written, for a host that passes back a copy rather than the array itself.
  const lastWritten = React.useRef<string | undefined>(undefined);
  // The rules last stored as applying always, by id.
  const always = React.useRef<Set<string> | null>(null);
  always.current ??= alwaysApplying(state.rules);

  // New stored rules from outside, such as an undo or another editor: read them again. Adjusting
  // state while rendering, so the editor never shows a frame of the old rules.
  let current = state;
  if (stored.rules !== state.source || flag !== state.flag) {
    const echo =
      stored.rules !== undefined && written.has(stored.rules) && written.get(stored.rules) === flag;
    const key = contentKey(stored.rules, flag);
    // A copy of what was last read is no news, and setting state for it would set it again on
    // every render of a host that passes a new copy each time.
    if (echo || key !== state.key) {
      // Its own write coming back, or a copy of it, says what the editor shows already.
      const own = echo || key === lastWritten.current;
      const rules = own ? state.rules : readStoredRules(stored, options);
      if (!own) always.current = alwaysApplying(rules);
      current = { source: stored.rules, flag, key, rules };
      setState(current);
    }
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
      lastWritten.current = contentKey(result.rules, owned ? nextRequired : undefined);
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
