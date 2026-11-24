import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ViewEdit } from './decisionTextTypes';
import type { GridContextMenuProps, GridContextMenuState, GridMenuEntry } from './GridMenu';
import { focusStays } from './gridEvents';
import type { OpenRuleMenu } from './RuleList';
import { renderedParentOf, scrollRootsOf } from './renderedTree';
import { conditionEntriesOf, ruleEntriesOf } from './ruleMenuEntries';
import { clickedAction, type RuleAction } from './sentenceTargets';
import type { SentenceBand, SentenceRule } from './sentenceTypes';

export interface RuleMenusParams {
  edit: ViewEdit | undefined;
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
  /** The selected row, whose change while a menu is open moves focus to the new selection. */
  selectedRowId: string | undefined;
  /** Focuses the selected stop, where focus goes when the menu's button is gone with its rule, scrolling it into view when `scroll`. */
  refocus: (scroll: boolean) => void;
  /** Deletes a rule as its menu's delete entry, which then leaves focus to the delete. */
  deleteRule: (rowId: string) => void;
  container: () => HTMLElement | null;
}

/** The one open card menu: which, for which rule, the button it hangs from, and where it opens. */
interface RuleMenuState extends GridContextMenuState, OpenRuleMenu {
  trigger: HTMLElement;
  /** The row selected when the menu opened. */
  openedOnRowId: string | undefined;
}

/** Where focus returns once a menu closes; `scroll` is false once the rules scrolled or the window resized the menu away. */
type FocusReturn = Pick<RuleMenuState, 'trigger' | 'openedOnRowId' | 'rowId'> & {
  scroll: boolean;
  /** Closed by deleting its rule, whose own refocus wins once the rule is gone. */
  deleted: boolean;
};

export interface RuleMenus extends Pick<GridContextMenuProps, 'label' | 'entries' | 'onClose'> {
  state: RuleMenuState | null;
  /** Opens the menu of a clicked card button, and returns whether it did. */
  onClick: (event: React.MouseEvent<HTMLElement>) => boolean;
}

const menuLabel = (
  edit: ViewEdit | undefined,
  state: RuleMenuState | null,
  position: number
): string => {
  if (!edit || !state) return '';
  return state.menu === 'rule'
    ? edit.labels.ruleActions(position)
    : edit.labels.addCondition(position);
};

/** Where a menu opens: below the left edge of its button. */
const anchorOf = (trigger: HTMLElement): GridContextMenuState['anchor'] => {
  const { left, bottom } = trigger.getBoundingClientRect();
  return { x: left, y: bottom };
};

/** A menu's new anchor once its mounted button moved, else null. */
const movedAnchor = ({ trigger, anchor }: RuleMenuState): GridContextMenuState['anchor'] | null => {
  const moved = anchorOf(trigger);
  return moved.x === anchor.x && moved.y === anchor.y ? null : moved;
};

/** Whether `node` is `ancestor` or rendered inside it, through slots and shadow roots. */
const holds = (ancestor: Node, node: Node): boolean => {
  for (let at: Node | null = node; at; at = renderedParentOf(at)) {
    if (at === ancestor) return true;
  }
  return false;
};

/** The view's one menu slot for `GridContextMenu`, opened from a card's buttons, as the grid has one menu at a time; closed when anything holding its button scrolls or the window resizes. */
export const useRuleMenus = ({
  edit,
  rules,
  bands,
  selectedRowId,
  refocus,
  deleteRule,
  container,
}: RuleMenusParams): RuleMenus => {
  const [state, setState] = useState<RuleMenuState | null>(null);
  const restoreFocusRef = useRef<FocusReturn | null>(null);
  const deletedRef = useRef(false);
  const position = state ? rules.findIndex((rule) => rule.rowId === state.rowId) + 1 : 0;
  const open = edit && position > 0 ? state : null;
  const close = (scroll: boolean) => {
    restoreFocusRef.current = state && { ...state, scroll, deleted: deletedRef.current };
    deletedRef.current = false;
    setState(null);
  };

  useLayoutEffect(() => {
    if (state && (!open || !state.trigger.isConnected)) {
      close(false);
      return;
    }
    const anchor = state && movedAnchor(state);
    if (state && anchor) {
      setState({ ...state, anchor });
      return;
    }
    const restore = restoreFocusRef.current;
    if (!restore || state) return;
    restoreFocusRef.current = null;
    if (restore.deleted) {
      if (!restore.trigger.isConnected || !focusStays(container(), null)) return;
      if (restore.rowId === selectedRowId) refocus(false);
      else restore.trigger.focus({ preventScroll: true });
      return;
    }
    if (restore.trigger.isConnected && restore.openedOnRowId === selectedRowId) {
      restore.trigger.focus({ preventScroll: true });
    } else {
      refocus(restore.scroll);
    }
  });

  useEffect(() => {
    if (!state) return;
    const close = () => {
      restoreFocusRef.current = { ...state, scroll: false, deleted: false };
      setState(null);
    };
    const closeOnScroll = (event: Event) => {
      if (event.target instanceof Node && holds(event.target, state.trigger)) close();
    };
    const roots = scrollRootsOf(state.trigger);
    for (const root of roots) {
      root.addEventListener('scroll', closeOnScroll, { capture: true, passive: true });
    }
    window.addEventListener('resize', close);
    return () => {
      for (const root of roots)
        root.removeEventListener('scroll', closeOnScroll, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, [state]);

  const entriesOf = (menu: OpenRuleMenu['menu'], rowId: string): GridMenuEntry[] => {
    if (!edit) return [];
    if (menu === 'rule') {
      const onDeleteRule = (deleted: string) => {
        deletedRef.current = true;
        deleteRule(deleted);
      };
      return ruleEntriesOf({ ...edit, onDeleteRule }, edit.labels, rules, rowId);
    }
    const rule = rules.find((candidate) => candidate.rowId === rowId);
    return conditionEntriesOf(edit, edit.labels, rule, bands, edit.onStartEdit);
  };

  const entries = (): GridMenuEntry[] => (open ? entriesOf(open.menu, open.rowId) : []);

  const onClose = () => close(true);

  const openFor = (action: RuleAction | null): boolean => {
    if (!edit || (action?.action !== 'conditions' && action?.action !== 'rule')) return false;
    if (entriesOf(action.action, action.rowId).length === 0) return false;
    setState({
      menu: action.action,
      rowId: action.rowId,
      trigger: action.trigger,
      openedOnRowId: selectedRowId,
      anchor: anchorOf(action.trigger),
    });
    return true;
  };

  const onClick = (event: React.MouseEvent<HTMLElement>): boolean =>
    openFor(clickedAction(event.target));

  return {
    state: open,
    label: menuLabel(edit, open, position),
    entries,
    onClose,
    onClick,
  };
};
