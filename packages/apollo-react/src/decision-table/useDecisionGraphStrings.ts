import { useMemo } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import type { MarkBadgeLabels } from './MarkBadge';
import { useDecisionTextLabels, withLabelOverrides } from './useDecisionTextStrings';

/** The graph view's own strings, built in from the `decision-table` catalog. */
export interface DecisionGraphLabels extends MarkBadgeLabels {
  /** The view's name, e.g. "Decisions". */
  graph: string;
  empty: string;
  ruleCount: (count: number) => string;
  /** A reference's line, e.g. "See Credit score above"; its name is drawn as the link. */
  seeAbove: (name: string) => string;
  usedBy: (names: string) => string;
  /** A heading mark's action, e.g. "Error: Overlapping rules. Show it". */
  showProblem: (status: string) => string;
}

/** The graph view's strings in the active locale, with the host's in place of any it gives. */
export const useDecisionGraphLabels = (
  overrides: Partial<DecisionGraphLabels> | undefined
): DecisionGraphLabels => {
  const { _ } = useSafeLingui();
  const { markStatus } = useDecisionTextLabels(undefined);
  const defaults = useMemo(
    (): DecisionGraphLabels => ({
      graph: _({ id: 'decision-graph.graph', message: 'Decisions' }),
      empty: _({ id: 'decision-graph.empty', message: 'No decisions yet' }),
      ruleCount: (count) =>
        _({
          id: 'decision-graph.rule_count',
          message: '{count, plural, one {# rule} other {# rules}}',
          values: { count },
        }),
      seeAbove: (name) =>
        _({ id: 'decision-graph.see_above', message: 'See {name} above', values: { name } }),
      usedBy: (names) =>
        _({ id: 'decision-graph.used_by', message: 'Used by {names}', values: { names } }),
      showProblem: (status) =>
        _({
          id: 'decision-graph.show_problem',
          message: '{status}. Show it',
          values: { status },
        }),
      markStatus,
    }),
    [_, markStatus]
  );
  return useMemo(() => withLabelOverrides(defaults, overrides), [defaults, overrides]);
};
