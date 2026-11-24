import type { DecisionTableProps } from './DecisionTable';
import type { GridMenuEntry } from './GridMenu';
import { hasStop } from './sentenceParts';
import type { SentenceBand, SentenceRule, SentenceValueId } from './sentenceTypes';

/** The card menus' strings. */
export interface RuleMenuLabels {
  /** A rule's delete entry, e.g. "Delete rule 2". */
  deleteRule: (position: number) => string;
  insertRuleAbove: string;
  insertRuleBelow: string;
  duplicateRule: string;
  clearRule: string;
  moveRuleUp: string;
  moveRuleDown: string;
  /** The add-condition menu's last entry, e.g. "Add input". */
  addInput: string;
}

/** The host's actions the card menus offer; each one omitted leaves its entries out. */
export interface RuleMenuActions {
  /** The columns the add-condition menu offers, in its order, skipping those the rule holds and those the bands do not list. */
  inputIds?: readonly string[];
  /** Add input in the add-condition menu; return the new input's column id to open the rule's condition on it. */
  onAddInput?: (rowId: string) => string | void;
  /** Insert rule above and below, at the index the new rule takes. */
  onInsertRule?: (index: number) => void;
  onDuplicateRule?: (rowId: string) => void;
  onClearRule?: (rowId: string) => void;
  /** Move up and down, from the rule's index to its neighbour's. */
  onMoveRule?: DecisionTableProps['onRowMove'];
  /** The rule menu's last entry, as the grid row's delete button; the host selects what follows. */
  onDeleteRule: (rowId: string) => void;
}

const DIVIDER: GridMenuEntry = { divider: true };

const joined = (groups: readonly GridMenuEntry[][]): GridMenuEntry[] =>
  groups
    .filter((group) => group.length > 0)
    .flatMap((group, index) => (index === 0 ? group : [DIVIDER, ...group]));

/** A rule's own menu: insert, duplicate and clear, then move, then delete. */
export const ruleEntriesOf = (
  actions: RuleMenuActions,
  labels: RuleMenuLabels,
  rules: readonly SentenceRule[],
  rowId: string
): GridMenuEntry[] => {
  const index = rules.findIndex((rule) => rule.rowId === rowId);
  if (index < 0) return [];
  const { onInsertRule, onDuplicateRule, onClearRule, onMoveRule, onDeleteRule } = actions;
  return joined([
    [
      ...(onInsertRule
        ? [
            { label: labels.insertRuleAbove, onClick: () => onInsertRule(index) },
            { label: labels.insertRuleBelow, onClick: () => onInsertRule(index + 1) },
          ]
        : []),
      ...(onDuplicateRule
        ? [{ label: labels.duplicateRule, onClick: () => onDuplicateRule(rowId) }]
        : []),
      ...(onClearRule ? [{ label: labels.clearRule, onClick: () => onClearRule(rowId) }] : []),
    ],
    onMoveRule
      ? [
          {
            label: labels.moveRuleUp,
            disabled: index === 0,
            onClick: () => onMoveRule(index, index - 1),
          },
          {
            label: labels.moveRuleDown,
            disabled: index === rules.length - 1,
            onClick: () => onMoveRule(index, index + 1),
          },
        ]
      : [],
    [
      {
        label: labels.deleteRule(index + 1),
        destructive: true,
        onClick: () => onDeleteRule(rowId),
      },
    ],
  ]);
};

/** A rule's add-condition menu: the inputs it has no condition on, then Add input; each opens the rule's new condition. */
export const conditionEntriesOf = (
  actions: RuleMenuActions,
  labels: RuleMenuLabels,
  rule: SentenceRule | undefined,
  bands: readonly SentenceBand[],
  startEdit: (value: SentenceValueId) => void
): GridMenuEntry[] => {
  if (!rule) return [];
  const { rowId } = rule;
  const columns = bands.flatMap((band) => band.columns);
  const unused = [...new Set(actions.inputIds)].flatMap((columnId): GridMenuEntry[] => {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (!column || hasStop(rule, columnId)) return [];
    return [
      {
        label: column.name,
        icon: column.icon,
        focusesOwnSurface: true,
        onClick: () => startEdit({ rowId, columnId, index: 0 }),
      },
    ];
  });
  const { onAddInput } = actions;
  const addInput = () => {
    const columnId = onAddInput?.(rowId);
    if (typeof columnId === 'string') startEdit({ rowId, columnId, index: 0 });
  };
  return joined([
    unused,
    onAddInput ? [{ label: labels.addInput, focusesOwnSurface: true, onClick: addInput }] : [],
  ]);
};
