import type { DecisionGraphTarget } from './decisionGraphTypes';

/** Where a decision sits: among the top-level decisions, or among one decision's required inputs, at an index of that list. */
export type DecisionGraphPlace =
  | { kind: 'top'; index: number }
  | { kind: 'under'; parentId: string; index: number };

/** A decision taken from one place to another; `to.index` is where it ends up in its new list. */
export interface DecisionGraphMove {
  decisionId: string;
  from: DecisionGraphPlace;
  to: DecisionGraphPlace;
}

/** A kind of logic the host can switch a decision to, worded by the host. */
export interface DecisionGraphLogicOption<Logic> {
  logic: Logic;
  label: string;
}

/** One action the host offers on the decisions; each returns a refusal when the host declines it. */
export type DecisionGraphAction<Refusal, Logic> =
  | { kind: 'rename'; onRename: (decisionId: string, name: string) => Refusal | void }
  | { kind: 'delete'; onDelete: (decisionId: string) => Refusal | void }
  | { kind: 'add'; onAdd: (place: DecisionGraphPlace) => Refusal | void }
  | {
      kind: 'chooseInputs';
      onChooseInputs: (decisionId: string, inputIds: readonly string[]) => Refusal | void;
    }
  | {
      kind: 'chooseUsers';
      onChooseUsers: (decisionId: string, userIds: readonly string[]) => Refusal | void;
    }
  | { kind: 'stopUsing'; onStopUsing: (decisionId: string, userId: string) => Refusal | void }
  | { kind: 'move'; onMove: (move: DecisionGraphMove) => Refusal | void }
  | {
      kind: 'changeLogic';
      logicOptions: (decisionId: string) => readonly DecisionGraphLogicOption<Logic>[];
      onChangeLogic: (decisionId: string, logic: Logic) => Refusal | void;
    };

export type DecisionGraphActionKind = DecisionGraphAction<unknown, unknown>['kind'];

export type DecisionGraphLinkKind = Extract<
  DecisionGraphActionKind,
  'chooseInputs' | 'chooseUsers'
>;

/** The actions the host offers, each shown only when listed, and the words of its refusals. */
export interface DecisionGraphEdit<Refusal, Logic> {
  actions: readonly DecisionGraphAction<Refusal, Logic>[];
  wordRefusal: (refusal: Refusal) => string;
}

/** Read the graph, follow what the view reveals, or also act on its decisions through the host. */
export type DecisionGraphMode<Refusal, Logic> =
  | { kind: 'read'; selected: string | null }
  | { kind: 'select'; selected: string | null; onReveal: (target: DecisionGraphTarget) => void }
  | {
      kind: 'edit';
      selected: string | null;
      onReveal: (target: DecisionGraphTarget) => void;
      edit: DecisionGraphEdit<Refusal, Logic>;
    };

/** The strings of the decisions' menus and dialogs. */
export interface DecisionGraphActionLabels {
  /** A card's menu, e.g. "Risk actions". */
  decisionActions: (name: string) => string;
  openDecision: string;
  rename: string;
  /** The rename field's name, e.g. "Name of Risk". */
  nameField: (name: string) => string;
  /** A logic switch, e.g. "Change logic to Literal expression". */
  changeLogicTo: (logic: string) => string;
  addDecision: string;
  addDecisionBefore: string;
  addDecisionAfter: string;
  addRequiredInput: string;
  chooseInputs: string;
  usedByMenu: string;
  /** e.g. "Stop using in Eligibility". */
  stopUsingIn: (name: string) => string;
  moveUp: string;
  moveDown: string;
  /** e.g. "Move under Net income". */
  moveUnder: (name: string) => string;
  /** e.g. "Move out of Eligibility". */
  moveOutOf: (name: string) => string;
  makeTopLevel: string;
  deleteDecision: string;
  delete: string;
  /** The delete dialog's title, e.g. "Delete Risk?". */
  deleteTitle: (name: string) => string;
  /** Above the decisions that use it in the delete dialog. */
  deleteUsedBy: string;
  deleteUnused: string;
  cancel: string;
  save: string;
  /** The inputs dialog's title, e.g. "Inputs of Risk". */
  inputsTitle: (name: string) => string;
  /** The users dialog's title, e.g. "Decisions that use Risk". */
  usersTitle: (name: string) => string;
  noOtherDecisions: string;
}
