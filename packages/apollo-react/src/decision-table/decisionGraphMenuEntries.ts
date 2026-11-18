import type {
  DecisionGraphAction,
  DecisionGraphActionKind,
  DecisionGraphActionLabels,
  DecisionGraphLinkKind,
  DecisionGraphMove,
  DecisionGraphPlace,
} from './decisionGraphActionTypes';
import {
  type DecisionGraphPosition,
  decisionIdOf,
  moveDownOf,
  moveOutOf,
  moveUnderPreviousOf,
  moveUpOf,
  placeOf,
  previousDecisionOf,
} from './decisionGraphPositions';
import type { DecisionGraphNode } from './decisionGraphTypes';
import type { GridMenuEntry } from './GridMenu';

/** The listed action of a kind, if the host offers it. */
export const actionOf = <Refusal, Logic, Kind extends DecisionGraphActionKind>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  kind: Kind
): Extract<DecisionGraphAction<Refusal, Logic>, { kind: Kind }> | undefined =>
  actions.find(
    (action): action is Extract<DecisionGraphAction<Refusal, Logic>, { kind: Kind }> =>
      action.kind === kind
  );

/** The heading or reference link that takes focus after an action. */
export type DecisionGraphFocus =
  | { kind: 'decision'; decisionId: string }
  | { kind: 'reference'; referenceId: string; decisionId: string };

export const focusOf = (node: DecisionGraphNode): DecisionGraphFocus =>
  node.kind === 'decision'
    ? { kind: 'decision', decisionId: node.id }
    : { kind: 'reference', referenceId: node.id, decisionId: node.targetId };

/** What the view does for a picked entry: the host's call, or one of its own surfaces. */
export interface DecisionGraphMenuHandlers<Refusal, Logic> {
  run: (call: () => Refusal | void, focus: DecisionGraphFocus | null) => void;
  open: (() => void) | undefined;
  startRename: () => void;
  confirmDelete: () => void;
  chooseLinks: (kind: DecisionGraphLinkKind) => void;
  writeNote: () => void;
  changeLogic: Extract<DecisionGraphAction<Refusal, Logic>, { kind: 'changeLogic' }> | undefined;
}

const DIVIDER: GridMenuEntry = { divider: true };

const joined = (groups: readonly GridMenuEntry[][]): GridMenuEntry[] =>
  groups
    .filter((group) => group.length > 0)
    .flatMap((group, index) => (index === 0 ? group : [DIVIDER, ...group]));

export const MOVE_KEYS = {
  up: 'Alt+Shift+ArrowUp',
  down: 'Alt+Shift+ArrowDown',
  under: 'Alt+Shift+ArrowRight',
  out: 'Alt+Shift+ArrowLeft',
} as const;

const MOVE_SHORTCUTS = {
  up: 'Alt+Shift+↑',
  down: 'Alt+Shift+↓',
  under: 'Alt+Shift+→',
  out: 'Alt+Shift+←',
} as const;

export const RENAME_KEY = 'F2';

export const DELETE_KEY = 'Delete';

/** A node's moves in menu order, each null where it cannot go. */
export const movesOf = (node: DecisionGraphNode, position: DecisionGraphPosition) => ({
  up: moveUpOf(node, position),
  down: moveDownOf(node, position),
  under: moveUnderPreviousOf(node, position),
  out: moveOutOf(node, position),
});

const moveEntriesOf = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  labels: DecisionGraphActionLabels,
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  handlers: DecisionGraphMenuHandlers<Refusal, Logic>,
  nested: boolean
): GridMenuEntry[] => {
  const action = actionOf(actions, 'move');
  if (!action) return [];
  const moves = movesOf(node, position);
  const entry = (label: string, move: DecisionGraphMove | null, shortcut: string) => ({
    label,
    shortcut,
    disabled: move === null,
    focusesOwnSurface: true,
    onClick: () => {
      if (move) handlers.run(() => action.onMove(move), focusOf(node));
    },
  });
  const previous = previousDecisionOf(node, position);
  return [
    entry(labels.moveUp, moves.up, MOVE_SHORTCUTS.up),
    entry(labels.moveDown, moves.down, MOVE_SHORTCUTS.down),
    ...(nested && previous
      ? [entry(labels.moveUnder(previous.label), moves.under, MOVE_SHORTCUTS.under)]
      : []),
    ...(nested && position.kind === 'under'
      ? [entry(labels.moveOutOf(position.parent.label), moves.out, MOVE_SHORTCUTS.out)]
      : []),
  ];
};

const stopUsingEntriesOf = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  labels: DecisionGraphActionLabels,
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  handlers: DecisionGraphMenuHandlers<Refusal, Logic>
): GridMenuEntry[] => {
  const action = actionOf(actions, 'stopUsing');
  if (!action || position.kind !== 'under') return [];
  const { parent } = position;
  return [
    {
      label: labels.stopUsingIn(parent.label),
      focusesOwnSurface: true,
      onClick: () =>
        handlers.run(() => action.onStopUsing(decisionIdOf(node), parent.id), {
          kind: 'decision',
          decisionId: parent.id,
        }),
    },
  ];
};

const addEntriesOf = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  labels: DecisionGraphActionLabels,
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  handlers: DecisionGraphMenuHandlers<Refusal, Logic>
): GridMenuEntry[] => {
  const action = actionOf(actions, 'add');
  if (!action || node.kind !== 'decision') return [];
  const add = (label: string, place: DecisionGraphPlace) => ({
    label,
    onClick: () => handlers.run(() => action.onAdd(place), focusOf(node)),
  });
  return [
    add(labels.addDecisionBefore, placeOf(position)),
    add(labels.addDecisionAfter, placeOf(position, position.index + 1)),
    add(labels.addRequiredInput, {
      kind: 'under',
      parentId: node.id,
      index: node.children.length,
    }),
  ];
};

const CARD_KINDS: readonly DecisionGraphActionKind[] = [
  'rename',
  'addNote',
  'add',
  'chooseInputs',
  'chooseUsers',
  'delete',
];

const canMove = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  nested: boolean
): boolean => {
  if (!actionOf(actions, 'move')) return false;
  const { up, down, under, out } = movesOf(node, position);
  return [up, down, ...(nested ? [under, out] : [])].some((move) => move !== null);
};

const offersStopUsing = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  position: DecisionGraphPosition
): boolean => position.kind === 'under' && actionOf(actions, 'stopUsing') !== undefined;

/** Whether a card has a menu, without building it. */
export const hasDecisionEntries = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  open: (() => void) | undefined
): boolean =>
  open !== undefined ||
  offersStopUsing(actions, position) ||
  actions.some((action) => CARD_KINDS.includes(action.kind)) ||
  canMove(actions, node, position, true) ||
  (actionOf(actions, 'changeLogic')?.logicOptions(decisionIdOf(node)).length ?? 0) > 0;

/** Whether a reference has a menu, without building it. */
export const hasReferenceEntries = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  open: (() => void) | undefined
): boolean =>
  open !== undefined ||
  offersStopUsing(actions, position) ||
  canMove(actions, node, position, false);

/** A decision card's menu: open, rename, note and logic; then add; then links; then moves; then delete. */
export const decisionEntriesOf = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  labels: DecisionGraphActionLabels,
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  handlers: DecisionGraphMenuHandlers<Refusal, Logic>
): GridMenuEntry[] => {
  const decisionId = decisionIdOf(node);
  const { changeLogic } = handlers;
  const has = (kind: DecisionGraphActionKind) => actionOf(actions, kind) !== undefined;
  return joined([
    [
      ...(handlers.open ? [{ label: labels.openDecision, onClick: handlers.open }] : []),
      ...(has('rename')
        ? [
            {
              label: labels.rename,
              shortcut: RENAME_KEY,
              focusesOwnSurface: true,
              onClick: handlers.startRename,
            },
          ]
        : []),
      ...(has('addNote') ? [{ label: labels.addNote, onClick: handlers.writeNote }] : []),
      ...(changeLogic
        ? changeLogic.logicOptions(decisionId).map((option) => ({
            label: labels.changeLogicTo(option.label),
            onClick: () =>
              handlers.run(
                () => changeLogic.onChangeLogic(decisionId, option.logic),
                focusOf(node)
              ),
          }))
        : []),
    ],
    addEntriesOf(actions, labels, node, position, handlers),
    [
      ...(has('chooseInputs')
        ? [{ label: labels.chooseInputs, onClick: () => handlers.chooseLinks('chooseInputs') }]
        : []),
      ...(has('chooseUsers')
        ? [{ label: labels.chooseUsers, onClick: () => handlers.chooseLinks('chooseUsers') }]
        : []),
      ...stopUsingEntriesOf(actions, labels, node, position, handlers),
    ],
    moveEntriesOf(actions, labels, node, position, handlers, true),
    has('delete')
      ? [
          {
            label: labels.delete,
            shortcut: DELETE_KEY,
            destructive: true,
            onClick: handlers.confirmDelete,
          },
        ]
      : [],
  ]);
};

/** A reference's menu: open, then moves among its siblings, then stop using. */
export const referenceEntriesOf = <Refusal, Logic>(
  actions: readonly DecisionGraphAction<Refusal, Logic>[],
  labels: DecisionGraphActionLabels,
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  handlers: DecisionGraphMenuHandlers<Refusal, Logic>
): GridMenuEntry[] =>
  joined([
    handlers.open ? [{ label: labels.openDecision, onClick: handlers.open }] : [],
    moveEntriesOf(actions, labels, node, position, handlers, false),
    stopUsingEntriesOf(actions, labels, node, position, handlers),
  ]);
