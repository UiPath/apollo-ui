import { useMemo } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import type { DecisionGraphMinimapLabels } from './DecisionGraphMinimap';
import type { MarkBadgeLabels } from './MarkBadge';
import { useDecisionTextLabels, withLabelOverrides } from './useDecisionTextStrings';

/** The graph view's own strings, built in from the `decision-table` catalog. */
export interface DecisionGraphLabels extends DecisionGraphMinimapLabels, MarkBadgeLabels {
  /** The view's name, e.g. "Decisions". */
  graph: string;
  empty: string;
  ruleCount: (count: number) => string;
  /** A reference's line, e.g. "See Credit score above"; its name is drawn as the link. */
  seeAbove: (name: string) => string;
  usedBy: (names: string) => string;
  /** A heading mark's action, e.g. "Error: Overlapping rules. Show it". */
  showProblem: (status: string) => string;
  minimapDecision: (name: string, count: number) => string;
  minimapReference: (name: string) => string;
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
      minimap: _({ id: 'decision-graph.minimap', message: 'Browse rules' }),
      minimapSearch: _({
        id: 'decision-graph.minimap_search',
        message: 'Search rules and decisions',
      }),
      minimapClearSearch: _({ id: 'decision-graph.minimap_clear', message: 'Clear search' }),
      minimapNoMatch: (query) =>
        _({
          id: 'decision-graph.minimap_no_match',
          message: 'No match for “{query}”.',
          values: { query },
        }),
      minimapResults: (count) =>
        _({
          id: 'decision-graph.minimap_results',
          message: '{count, plural, one {# result} other {# results}}',
          values: { count },
        }),
      minimapDecision: (name, count) =>
        _({
          id: 'decision-graph.minimap_decision',
          message: '{name}, {count, plural, one {# rule} other {# rules}}',
          values: { name, count },
        }),
      minimapReference: (name) =>
        _({
          id: 'decision-graph.minimap_reference',
          message: '{name}, listed in full elsewhere in this map',
          values: { name },
        }),
    }),
    [_, markStatus]
  );
  return useMemo(() => withLabelOverrides(defaults, overrides), [defaults, overrides]);
};
