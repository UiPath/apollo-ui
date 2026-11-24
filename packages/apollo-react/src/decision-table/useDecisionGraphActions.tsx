import type React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NEAREST } from './constants';
import type { DecisionGraphCardActions, DecisionGraphNodeActions } from './DecisionGraphCard';
import { DecisionGraphDeleteDialog, DecisionGraphLinksDialog } from './DecisionGraphDialogs';
import type {
  DecisionGraphActionKind,
  DecisionGraphActionLabels,
  DecisionGraphLinkKind,
  DecisionGraphMode,
  DecisionGraphPlace,
} from './decisionGraphActionTypes';
import {
  actionOf,
  DELETE_KEY,
  type DecisionGraphFocus,
  type DecisionGraphMenuHandlers,
  decisionEntriesOf,
  focusOf,
  hasDecisionEntries,
  hasReferenceEntries,
  MOVE_KEYS,
  movesOf,
  RENAME_KEY,
  referenceEntriesOf,
} from './decisionGraphMenuEntries';
import {
  type DecisionGraphPosition,
  decisionIdOf,
  decisionsOf,
  inputIdsOf,
  usersOf,
} from './decisionGraphPositions';
import type {
  DecisionGraphDecisionNode,
  DecisionGraphNode,
  DecisionGraphReferenceNode,
} from './decisionGraphTypes';
import { hasLostFocus } from './gridEvents';

/** The one surface open for a decision, with the host's last refusal of it, worded. */
type Surface =
  | { kind: 'none' }
  | {
      kind: 'rename';
      decisionId: string;
      from: string;
      draft: string;
      refusal: { name: string; text: string } | null;
    }
  | {
      kind: 'delete';
      decisionId: string;
      neighbour: DecisionGraphFocus | null;
      refusal: string | null;
    }
  | {
      kind: 'links';
      links: DecisionGraphLinkKind;
      decisionId: string;
      refusal: string | null;
    };

const NONE: Surface = { kind: 'none' };

/** The action an open surface proposes through. */
const kindOf = (surface: Exclude<Surface, { kind: 'none' }>): DecisionGraphActionKind => {
  return surface.kind === 'links' ? surface.links : surface.kind;
};

export interface DecisionGraphActionsParams<Refusal, Logic> {
  mode: DecisionGraphMode<Refusal, Logic>;
  nodes: readonly DecisionGraphNode[];
  labels: DecisionGraphActionLabels;
  openOf: (decisionId: string) => (() => void) | undefined;
  /** The mounted card of a decision. */
  cardOf: (decisionId: string) => HTMLElement | undefined;
  /** The graph's scroll container, which holds every card and reference. */
  scroller: HTMLElement | null;
  announce: (text: string) => void;
  dataTestId: string;
}

export interface DecisionGraphActions {
  cardOf: (
    node: DecisionGraphDecisionNode,
    position: DecisionGraphPosition
  ) => DecisionGraphCardActions | null;
  referenceOf: (
    node: DecisionGraphReferenceNode,
    position: DecisionGraphPosition
  ) => DecisionGraphNodeActions | null;
  /** Adds a decision after the top-level ones, when the host adds decisions. */
  addTop: (() => void) | null;
  dialogs: React.ReactNode;
  /** Focus and input within anything the graph renders, its portals included: focus the graph held when its element went away comes back to it, scrolled into view after a key. */
  focusWithin: Pick<
    React.DOMAttributes<HTMLElement>,
    'onFocus' | 'onBlur' | 'onKeyDownCapture' | 'onPointerDownCapture'
  >;
}

const MOVE_KEY_OF: Readonly<Record<string, keyof typeof MOVE_KEYS>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowRight: 'under',
  ArrowLeft: 'out',
};

export const onlyModifiers = (event: React.KeyboardEvent, alt: boolean, shift: boolean): boolean =>
  event.altKey === alt && event.shiftKey === shift && !event.ctrlKey && !event.metaKey;

/** What takes focus once a decision is deleted: the next sibling, else the previous one, else its user. */
const neighbourOf = (position: DecisionGraphPosition): DecisionGraphFocus | null => {
  const next = position.siblings[position.index + 1] ?? position.siblings[position.index - 1];
  if (next) return focusOf(next);
  return position.kind === 'under' ? { kind: 'decision', decisionId: position.parent.id } : null;
};

/** The graph's menus, keys and dialogs on the host's actions: the view proposes each change, the host makes or refuses it. */
export const useDecisionGraphActions = <Refusal, Logic>({
  mode,
  nodes,
  labels,
  openOf,
  cardOf,
  scroller,
  announce,
  dataTestId,
}: DecisionGraphActionsParams<Refusal, Logic>): DecisionGraphActions => {
  const [surface, setSurface] = useState<Surface>(NONE);
  const [, setRuns] = useState(0);
  const focusRef = useRef<DecisionGraphFocus | null>(null);
  const holdsFocusRef = useRef(false);
  const byKeyRef = useRef(false);
  const bodyRef = useRef<Element | null>(null);
  const lastDecisionRef = useRef<string | null>(null);
  const deletedRef = useRef<{ decisionId: string; neighbour: DecisionGraphFocus | null } | null>(
    null
  );
  const decisions = useMemo(() => decisionsOf(nodes), [nodes]);
  const users = useMemo(() => usersOf(nodes), [nodes]);
  const edit = mode.kind === 'edit' ? mode.edit : null;

  const toggleOf = (decisionId: string): HTMLElement | null =>
    cardOf(decisionId)?.querySelector<HTMLElement>('[data-graph-toggle]') ?? null;
  const elementOf = (focus: DecisionGraphFocus): HTMLElement | null =>
    focus.kind === 'decision'
      ? toggleOf(focus.decisionId)
      : (scroller?.querySelector<HTMLElement>(
          `[data-graph-reference-link="${CSS.escape(focus.referenceId)}"]`
        ) ?? toggleOf(focus.decisionId));
  const land = (element: HTMLElement) => {
    element.focus({ preventScroll: true });
    if (byKeyRef.current) element.scrollIntoView?.(NEAREST);
  };
  const focusOn = (focus: DecisionGraphFocus | null): boolean => {
    const element = focus && elementOf(focus);
    if (element) land(element);
    return element !== null;
  };
  const focusFallback = () => {
    const add = scroller?.querySelector<HTMLElement>('[data-graph-add]');
    if (add) {
      land(add);
      return;
    }
    if (!scroller) return;
    if (!scroller.hasAttribute('tabindex')) scroller.tabIndex = -1;
    scroller.focus({ preventScroll: true });
  };

  const recover = (fromBody: boolean) => {
    if (fromBody !== (bodyRef.current?.isConnected ?? false)) return;
    if (!holdsFocusRef.current || scroller === null || !hasLostFocus(scroller)) return;
    const lost = lastDecisionRef.current;
    const deleted = deletedRef.current;
    const neighbour = lost !== null && deleted?.decisionId === lost ? deleted.neighbour : null;
    const decision: DecisionGraphFocus | null =
      lost === null ? null : { kind: 'decision', decisionId: lost };
    if (!focusOn(decision) && !focusOn(neighbour)) focusFallback();
  };

  useLayoutEffect(() => {
    recover(false);
    const focus = focusRef.current;
    if (focus === null) return;
    focusRef.current = null;
    focusOn(focus);
  });
  useEffect(() => recover(true));

  const focusWithin: DecisionGraphActions['focusWithin'] = {
    onFocus: (event) => {
      holdsFocusRef.current = true;
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>('[data-graph-card]');
      const nest = target?.closest<HTMLElement>('[data-graph-nest-of]');
      bodyRef.current = target?.closest('[data-graph-body]') ?? null;
      lastDecisionRef.current =
        card?.dataset.decisionId ??
        nest?.dataset.graphNestOf ??
        (surface.kind === 'none' ? null : surface.decisionId);
    },
    onBlur: () => {
      holdsFocusRef.current = false;
    },
    onKeyDownCapture: () => {
      byKeyRef.current = true;
    },
    onPointerDownCapture: () => {
      byKeyRef.current = false;
    },
  };

  const open = decisions.find(
    (decision) => surface.kind !== 'none' && decision.id === surface.decisionId
  );
  if (surface.kind !== 'none' && (!edit || !open || !actionOf(edit.actions, kindOf(surface)))) {
    setSurface(NONE);
  }

  if (!edit) {
    return {
      cardOf: () => null,
      referenceOf: () => null,
      addTop: null,
      dialogs: null,
      focusWithin,
    };
  }
  const { actions, wordRefusal } = edit;

  const tried = (refusal: Refusal | void): string | null =>
    refusal === undefined ? null : wordRefusal(refusal);

  const run = (call: () => Refusal | void, focus: DecisionGraphFocus | null) => {
    const refusal = tried(call());
    focusRef.current = focus;
    setRuns((runs) => runs + 1);
    if (refusal !== null) announce(refusal);
  };

  const closeFocusTo =
    (decisionId: string) =>
    (event: Event): void => {
      event.preventDefault();
      focusOn({ kind: 'decision', decisionId });
    };

  const handlersOf = (
    node: DecisionGraphNode,
    position: DecisionGraphPosition
  ): DecisionGraphMenuHandlers<Refusal, Logic> => {
    const decisionId = decisionIdOf(node);
    return {
      run,
      open: openOf(decisionId),
      startRename: () =>
        setSurface({
          kind: 'rename',
          decisionId,
          from: node.label,
          draft: node.label,
          refusal: null,
        }),
      confirmDelete: () =>
        setSurface({ kind: 'delete', decisionId, neighbour: neighbourOf(position), refusal: null }),
      chooseLinks: (links) => setSurface({ kind: 'links', links, decisionId, refusal: null }),
      changeLogic: actionOf(actions, 'changeLogic'),
    };
  };

  const keysOf = (node: DecisionGraphNode, position: DecisionGraphPosition) => {
    const move = actionOf(actions, 'move');
    const moves = movesOf(node, position);
    const handlers = handlersOf(node, position);
    const isCard = node.kind === 'decision';
    const shortcuts = [
      ...(isCard && actionOf(actions, 'rename') ? [RENAME_KEY] : []),
      ...(isCard && actionOf(actions, 'delete') ? [DELETE_KEY] : []),
      ...(move ? [MOVE_KEYS.up, MOVE_KEYS.down] : []),
      ...(move && isCard ? [MOVE_KEYS.under, MOVE_KEYS.out] : []),
    ];
    const onKeyDown = (event: React.KeyboardEvent) => {
      if (isCard && event.key === RENAME_KEY && onlyModifiers(event, false, false)) {
        if (!actionOf(actions, 'rename')) return;
        event.preventDefault();
        handlers.startRename();
        return;
      }
      if (isCard && event.key === DELETE_KEY && onlyModifiers(event, false, false)) {
        if (!actionOf(actions, 'delete')) return;
        event.preventDefault();
        handlers.confirmDelete();
        return;
      }
      const key = MOVE_KEY_OF[event.key];
      if (!move || !key || !onlyModifiers(event, true, true)) return;
      if (!isCard && (key === 'under' || key === 'out')) return;
      event.preventDefault();
      const proposed = moves[key];
      if (proposed) run(() => move.onMove(proposed), focusOf(node));
    };
    return { shortcuts, onKeyDown, handlers };
  };

  const cardActionsOf = (
    node: DecisionGraphDecisionNode,
    position: DecisionGraphPosition
  ): DecisionGraphCardActions | null => {
    const { shortcuts, onKeyDown, handlers } = keysOf(node, position);
    const entries = () => decisionEntriesOf(actions, labels, node, position, handlers);
    if (!hasDecisionEntries(actions, node, position, handlers.open)) return null;
    const rename = actionOf(actions, 'rename');
    return {
      menuLabel: labels.decisionActions(node.label),
      entries,
      onKeyDown,
      keyShortcuts: shortcuts,
      nameField: labels.nameField(node.label),
      rename:
        rename && surface.kind === 'rename' && surface.decisionId === node.id
          ? {
              from: surface.from,
              draft: surface.draft,
              onDraft: (draft) => setSurface({ ...surface, draft }),
              refusal: surface.refusal?.text ?? null,
              onCommit: (name, byKey) => {
                if (!byKey && surface.refusal?.name === name) {
                  setSurface(NONE);
                  return;
                }
                const refusal = tried(rename.onRename(node.id, name));
                if (refusal !== null && byKey) {
                  setSurface({ ...surface, draft: name, refusal: { name, text: refusal } });
                  return;
                }
                if (refusal !== null) announce(refusal);
                setSurface(NONE);
                if (byKey) focusRef.current = focusOf(node);
              },
              onCancel: (byKey) => {
                setSurface(NONE);
                if (byKey) focusRef.current = focusOf(node);
              },
            }
          : null,
    };
  };

  const referenceActionsOf = (
    node: DecisionGraphReferenceNode,
    position: DecisionGraphPosition
  ): DecisionGraphNodeActions | null => {
    const { shortcuts, onKeyDown, handlers } = keysOf(node, position);
    const entries = () => referenceEntriesOf(actions, labels, node, position, handlers);
    if (!hasReferenceEntries(actions, node, position, handlers.open)) return null;
    return {
      menuLabel: labels.decisionActions(node.label),
      entries,
      onKeyDown,
      keyShortcuts: shortcuts,
    };
  };

  const add = actionOf(actions, 'add');
  const addTop = add
    ? () => {
        const place: DecisionGraphPlace = { kind: 'top', index: nodes.length };
        run(() => add.onAdd(place), null);
      }
    : null;

  const dialogOf = (): React.ReactNode => {
    if (surface.kind === 'none' || surface.kind === 'rename' || !open) return null;
    const { decisionId } = surface;
    const close = () => setSurface(NONE);
    const base = {
      labels,
      refusal: surface.refusal,
      onClose: close,
      onCloseAutoFocus: closeFocusTo(decisionId),
    };
    const refuse = (refusal: string) => setSurface({ ...surface, refusal });
    if (surface.kind === 'delete') {
      const remove = actionOf(actions, 'delete');
      return (
        <DecisionGraphDeleteDialog
          {...base}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (focusOn({ kind: 'decision', decisionId }) || focusOn(surface.neighbour)) return;
            focusFallback();
          }}
          name={open.label}
          users={{ kind: 'known', usedBy: users.get(decisionId) ?? [] }}
          onConfirm={() => {
            if (!remove) return;
            const refusal = tried(remove.onDelete(decisionId));
            if (refusal === null) deletedRef.current = { decisionId, neighbour: surface.neighbour };
            if (refusal === null) close();
            else refuse(refusal);
          }}
          dataTestId={`${dataTestId}-delete-dialog`}
        />
      );
    }
    const inputs = surface.links === 'chooseInputs';
    const linked = inputs ? inputIdsOf(open) : (users.get(decisionId) ?? []).map((user) => user.id);
    return (
      <DecisionGraphLinksDialog
        {...base}
        title={inputs ? labels.inputsTitle(open.label) : labels.usersTitle(open.label)}
        options={decisions.filter((decision) => decision.id !== decisionId)}
        linked={linked}
        onSave={(ids) => {
          if (ids.length === linked.length && ids.every((id, index) => id === linked[index])) {
            close();
            return;
          }
          const chooseInputs = actionOf(actions, 'chooseInputs');
          const chooseUsers = actionOf(actions, 'chooseUsers');
          const refusal = inputs
            ? chooseInputs && tried(chooseInputs.onChooseInputs(decisionId, ids))
            : chooseUsers && tried(chooseUsers.onChooseUsers(decisionId, ids));
          if (typeof refusal === 'string') refuse(refusal);
          else close();
        }}
        dataTestId={`${dataTestId}-links-dialog`}
      />
    );
  };

  return {
    cardOf: cardActionsOf,
    referenceOf: referenceActionsOf,
    addTop,
    dialogs: dialogOf(),
    focusWithin,
  };
};
