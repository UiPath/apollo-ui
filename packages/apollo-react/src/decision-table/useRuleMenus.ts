import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DecisionTextEdit } from './DecisionText';
import type { GridContextMenuProps, GridContextMenuState, GridMenuEntry } from './GridMenu';
import type { OpenRuleMenu } from './RuleList';
import { clickedAction, type RuleAction, type RuleMenuKind } from './sentenceTargets';
import type { SentenceRule } from './sentenceTypes';

export interface RuleMenusParams {
  edit: DecisionTextEdit | undefined;
  rules: readonly SentenceRule[];
  /** The selected row, whose change while a menu is open moves focus to the new selection. */
  selectedRowId: string | undefined;
  /** Focuses the selected stop, where focus goes when the menu's button is gone with its rule, scrolling it into view when `scroll`. */
  refocus: (scroll: boolean) => void;
}

/** The one open card menu: which, for which rule, the button it hangs from, and where it opens. */
interface RuleMenuState extends GridContextMenuState, OpenRuleMenu {
  trigger: HTMLElement;
  /** The row selected when the menu opened. */
  openedOnRowId: string | undefined;
}

/** Where focus returns once a menu closes; `scroll` is false once the rules scrolled or the window resized the menu away. */
type FocusReturn = Pick<RuleMenuState, 'trigger' | 'openedOnRowId'> & { scroll: boolean };

export interface RuleMenus extends Pick<GridContextMenuProps, 'label' | 'entries' | 'onClose'> {
  state: RuleMenuState | null;
  /** Opens the menu of a clicked card button, and returns whether it did. */
  onClick: (event: React.MouseEvent<HTMLElement>) => boolean;
  /** Opens the menu a card action names, from where its button is now, unless the host has no entries for it, and returns whether it did. */
  openFor: (action: RuleAction) => boolean;
  /** Whether the host has entries for a rule's menu, so its button opens one. */
  offers: (menu: RuleMenuKind, rowId: string) => boolean;
}

const menuLabel = (
  edit: DecisionTextEdit | undefined,
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

/** Whether `node` is `ancestor` or inside it, crossing shadow roots to their hosts. */
const holds = (ancestor: Node, node: Node): boolean => {
  for (let at: Node | null = node; at; at = at instanceof ShadowRoot ? at.host : at.parentNode) {
    if (at === ancestor) return true;
  }
  return false;
};

/** The shadow roots holding `node`, innermost first, then its document: where a scroll of anything holding it reaches. */
const scrollRootsOf = (node: Node): Node[] => {
  const roots: Node[] = [];
  for (let root = node.getRootNode(); ; root = root.host.getRootNode()) {
    if (!(root instanceof ShadowRoot)) return [...roots, root];
    roots.push(root);
  }
};

/** The view's one menu slot for `GridContextMenu`, opened from a card's buttons, as the grid has one menu at a time; closed when anything holding its button scrolls or the window resizes. */
export const useRuleMenus = ({
  edit,
  rules,
  selectedRowId,
  refocus,
}: RuleMenusParams): RuleMenus => {
  const [state, setState] = useState<RuleMenuState | null>(null);
  const restoreFocusRef = useRef<FocusReturn | null>(null);
  const position = state ? rules.findIndex((rule) => rule.rowId === state.rowId) + 1 : 0;
  const open = edit && position > 0 ? state : null;
  const close = (scroll: boolean) => {
    restoreFocusRef.current = state && { ...state, scroll };
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
    if (restore.trigger.isConnected && restore.openedOnRowId === selectedRowId) {
      restore.trigger.focus({ preventScroll: true });
    } else {
      refocus(restore.scroll);
    }
  });

  useEffect(() => {
    if (!state) return;
    const close = () => {
      restoreFocusRef.current = { ...state, scroll: false };
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

  const entries = (): GridMenuEntry[] => {
    if (!edit || !open) return [];
    return open.menu === 'rule' ? edit.ruleEntries(open.rowId) : edit.conditionEntries(open.rowId);
  };

  const onClose = () => close(true);

  const offers = (menu: RuleMenuKind, rowId: string): boolean =>
    edit !== undefined &&
    (menu === 'rule' ? edit.ruleEntries(rowId) : edit.conditionEntries(rowId)).length > 0;

  const openFor = (action: RuleAction | null): boolean => {
    if (action?.action !== 'conditions' && action?.action !== 'rule') return false;
    if (!offers(action.action, action.rowId)) return false;
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
    openFor,
    offers,
  };
};
