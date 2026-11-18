import { useMemo } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import type { DecisionGraphActionLabels } from './decisionGraphActionTypes';
import type { DecisionGraphMinimapLabels } from './DecisionGraphMinimap';
import type { MarkBadgeLabels } from './MarkBadge';
import { useDecisionTextLabels } from './useDecisionTextStrings';

/** The graph view's own strings, built in from the `decision-table` catalog. */
export interface DecisionGraphLabels
  extends DecisionGraphMinimapLabels,
    MarkBadgeLabels,
    DecisionGraphActionLabels {
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

/** The graph view's strings in the active locale. */
export const useDecisionGraphLabels = (): DecisionGraphLabels => {
  const { _ } = useSafeLingui();
  const { markStatus } = useDecisionTextLabels();
  return useMemo(
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
      decisionActions: (name) =>
        _({
          id: 'decision-graph.decision_actions',
          message: '{name} actions',
          values: { name },
        }),
      openDecision: _({ id: 'decision-graph.open_decision', message: 'Open decision' }),
      rename: _({ id: 'decision-graph.rename', message: 'Rename' }),
      nameField: (name) =>
        _({ id: 'decision-graph.name_field', message: 'Name of {name}', values: { name } }),
      addNote: _({ id: 'decision-graph.add_note', message: 'Add note' }),
      changeLogicTo: (logic) =>
        _({
          id: 'decision-graph.change_logic_to',
          message: 'Change logic to {logic}',
          values: { logic },
        }),
      addDecision: _({ id: 'decision-graph.add_decision', message: 'Add decision' }),
      addDecisionBefore: _({
        id: 'decision-graph.add_decision_before',
        message: 'Add decision before',
      }),
      addDecisionAfter: _({
        id: 'decision-graph.add_decision_after',
        message: 'Add decision after',
      }),
      addRequiredInput: _({
        id: 'decision-graph.add_required_input',
        message: 'Add required input',
      }),
      chooseInputs: _({ id: 'decision-graph.choose_inputs', message: 'Choose inputs' }),
      chooseUsers: _({ id: 'decision-graph.choose_users', message: 'Choose users' }),
      stopUsingIn: (name) =>
        _({
          id: 'decision-graph.stop_using_in',
          message: 'Stop using in {name}',
          values: { name },
        }),
      moveUp: _({ id: 'decision-graph.move_up', message: 'Move up' }),
      moveDown: _({ id: 'decision-graph.move_down', message: 'Move down' }),
      moveUnder: (name) =>
        _({ id: 'decision-graph.move_under', message: 'Move under {name}', values: { name } }),
      moveOutOf: (name) =>
        _({ id: 'decision-graph.move_out_of', message: 'Move out of {name}', values: { name } }),
      delete: _({ id: 'decision-graph.delete', message: 'Delete' }),
      deleteTitle: (name) =>
        _({ id: 'decision-graph.delete_title', message: 'Delete {name}?', values: { name } }),
      deleteUsedBy: _({
        id: 'decision-graph.delete_used_by',
        message: 'These decisions use it:',
      }),
      deleteUnused: _({ id: 'decision-graph.delete_unused', message: 'No decision uses it.' }),
      cancel: _({ id: 'decision-graph.cancel', message: 'Cancel' }),
      save: _({ id: 'decision-graph.save', message: 'Save' }),
      inputsTitle: (name) =>
        _({ id: 'decision-graph.inputs_title', message: 'Inputs of {name}', values: { name } }),
      usersTitle: (name) =>
        _({
          id: 'decision-graph.users_title',
          message: 'Decisions that use {name}',
          values: { name },
        }),
      noOtherDecisions: _({
        id: 'decision-graph.no_other_decisions',
        message: 'No other decisions',
      }),
      noteTitle: (name) =>
        _({ id: 'decision-graph.note_title', message: 'Note on {name}', values: { name } }),
    }),
    [_, markStatus]
  );
};
