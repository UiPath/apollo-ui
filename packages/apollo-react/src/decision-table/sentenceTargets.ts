import type { SentenceCellId, SentenceSelection, SentenceValueId } from './sentenceTypes';

/** A value chip under the pointer and the cell it stands for. */
export interface HoveredToken {
  chip: Element;
  cell: SentenceCellId;
}

/** The value token at `target`, as the cell it stands for. */
export const valueTokenAt = (target: EventTarget | null): HoveredToken | null => {
  const chip =
    target instanceof Element ? target.closest<HTMLElement>('[data-kind="value"]') : null;
  const rowId = chip?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
  const columnId = chip?.dataset.columnId;
  return chip && rowId && columnId ? { chip, cell: { rowId, columnId } } : null;
};

/** What a click on `target` selects: the cell of a value token or of a `+N more` count, else the rule of its row. */
export const clickedSelection = (target: EventTarget | null): SentenceSelection | null => {
  const element = target instanceof Element ? target : null;
  const rowId = element?.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId;
  const columnId =
    valueTokenAt(target)?.cell.columnId ??
    element?.closest<HTMLElement>('[data-more-values]')?.dataset.columnId;
  if (rowId === undefined) return null;
  return columnId === undefined ? { rowId } : { rowId, columnId };
};

/** The value a click on `target` hit: its cell and its place among the cell's values. */
export const clickedValue = (target: EventTarget | null): SentenceValueId | null => {
  const chip = target instanceof Element ? target.closest<HTMLElement>('[data-value-index]') : null;
  const hit = valueTokenAt(chip);
  const index = Number(chip?.dataset.valueIndex);
  return hit && Number.isInteger(index) ? { ...hit.cell, index } : null;
};

/** The mounted card of a row. */
export const cardOf = (container: HTMLElement, rowId: string): HTMLElement | undefined =>
  [...container.querySelectorAll<HTMLElement>('li[data-row-id]')].find(
    (card) => card.dataset.rowId === rowId
  );

/** A card's stop of a cell: its first value chip, else its input when the card shows no value for it. */
export const cellOf = (card: HTMLElement, columnId: string): HTMLElement | undefined => {
  const ofCell = (kind: string) =>
    [...card.querySelectorAll<HTMLElement>(`[data-kind="${kind}"]`)].find(
      (token) => token.dataset.columnId === columnId
    );
  return ofCell('value') ?? ofCell('input');
};

/** A card's chip of one value of a cell. */
export const valueChipOf = (card: HTMLElement, value: SentenceValueId): HTMLElement | undefined =>
  [...card.querySelectorAll<HTMLElement>('[data-value-index]')].find(
    (token) =>
      token.dataset.columnId === value.columnId && token.dataset.valueIndex === String(value.index)
  );

/** A condition's remove action: the cell it clears. */
interface RuleClearAction {
  action: 'clear';
  cell: SentenceCellId;
}

/** A card action that opens a menu, and the button it hangs from. */
interface RuleMenuAction {
  action: 'conditions' | 'rule';
  rowId: string;
  trigger: HTMLElement;
}

/** Which of a card's menus: its add-condition or its rule actions. */
export type RuleMenuKind = RuleMenuAction['action'];

/** A card's delete action: the rule it removes. */
interface RuleDeleteAction {
  action: 'delete';
  rowId: string;
}

/** A card's own action, as its `data-rule-action` button names it. */
export type RuleAction = RuleClearAction | RuleMenuAction | RuleDeleteAction;

/** The card action a click on `target` hit. */
export const clickedAction = (target: EventTarget | null): RuleAction | null => {
  const button =
    target instanceof Element ? target.closest<HTMLElement>('[data-rule-action]') : null;
  const rowId = button?.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId;
  const columnId = button?.dataset.columnId;
  if (!button || !rowId) return null;
  if (button.dataset.ruleAction === 'clear') {
    return columnId ? { action: 'clear', cell: { rowId, columnId } } : null;
  }
  const action = button.dataset.ruleAction;
  if (action === 'delete') return { action, rowId };
  return action === 'conditions' || action === 'rule' ? { action, rowId, trigger: button } : null;
};

/** The decision a click on `target` opens: its linked input's. */
export const clickedDecision = (target: EventTarget | null): string | undefined =>
  target instanceof Element
    ? target.closest<HTMLElement>('[data-rule-action="decision"]')?.dataset.decisionId
    : undefined;

/** The decision a cell stop opens: the one its input links to in the same card. */
export const stopDecisionOf = (target: EventTarget | null): string | undefined => {
  const stop = target instanceof Element ? target.closest<HTMLElement>('[data-kind]') : null;
  const card = stop?.closest<HTMLElement>('li[data-row-id]');
  const links = card?.querySelectorAll<HTMLElement>('[data-rule-action="decision"]') ?? [];
  return [...links].find((link) => link.dataset.columnId === stop?.dataset.columnId)?.dataset
    .decisionId;
};

/** A card's add-condition button. */
export const addConditionOf = (card: HTMLElement): HTMLElement | null =>
  card.querySelector<HTMLElement>('[data-rule-action="conditions"]');
