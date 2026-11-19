import { cn } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  DecisionGraphCard,
  type DecisionGraphCardProps,
  DecisionGraphReference,
} from './DecisionGraphCard';
import {
  DecisionGraphMinimapSlot,
  type DecisionGraphMinimapSlotProps,
} from './DecisionGraphMinimapSlot';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionGraphMode } from './decisionGraphActionTypes';
import {
  childPositionsOf,
  type DecisionGraphPosition,
  decisionsOf,
  topPositionsOf,
  usersOf,
} from './decisionGraphPositions';
import {
  GRAPH_ADD_DECISION_CLASS,
  GRAPH_BRANCH_CLASS,
  GRAPH_COLUMN_CLASS,
  GRAPH_EMPTY_CLASS,
  GRAPH_FRAME_CLASS,
  GRAPH_MINIMAP_GAP_PX,
  GRAPH_NEST_CLASS,
  GRAPH_OUTPUT_HUE_CLASS,
  GRAPH_SCROLLER_CLASS,
  graphColumnInsetOf,
} from './decisionGraphStyles';
import type {
  DecisionGraphBodyContext,
  DecisionGraphCitations,
  DecisionGraphDecisionNode,
  DecisionGraphExpansion,
  DecisionGraphNode,
  DecisionGraphTarget,
} from './decisionGraphTypes';
import { revealIn } from './revealIn';
import { SENTENCE_MIN_RULE_HEIGHT_PX } from './sentenceRuleHeights';
import { useDecisionGraphActions } from './useDecisionGraphActions';
import { useDecisionGraphLabels } from './useDecisionGraphStrings';
import { useDecisionTextLabels } from './useDecisionTextStrings';
import { useTextAnnouncements } from './useTextAnnouncements';

const NO_CITATIONS: DecisionGraphCitations = { kind: 'none' };

/** An open decision's body: its table, shown as a `DecisionText` in the graph's scroll container with its links revealing decisions in the graph, or the host's own content for logic that is not a table. */
export type DecisionGraphBody<Op, Policy, Total, Type, TextRefusal> =
  | {
      kind: 'table';
      text: Omit<
        DecisionTextProps<Op, Policy, Total, Type, TextRefusal>,
        'scroll' | 'onOpenDecision'
      >;
    }
  | { kind: 'other'; content: React.ReactNode };

export interface DecisionGraphTextProps<Refusal, Logic, Op, Policy, Total, Type, TextRefusal> {
  /** The decisions in reading order, each with the decisions it requires as children; one already drawn is a reference. */
  nodes: readonly DecisionGraphNode[];
  /** Read only with the host's selected decision; `select` also tells the host what the view brought into view; `edit` adds the host's actions on the decisions, each shown in the cards' menus and keys only when listed; the host clears a selection whose rule or cell an edit removed, using `liveSelection`. */
  mode: DecisionGraphMode<Refusal, Logic>;
  /** The body of an open decision, its table in any `DecisionText` mode; `context.revealDecision` takes a link to another decision in other content in place. */
  renderBody: (
    decisionId: string,
    context: DecisionGraphBodyContext
  ) => DecisionGraphBody<Op, Policy, Total, Type, TextRefusal>;
  /** Where each decision was read from, on its heading and opened by the host; none when omitted. */
  citations?: DecisionGraphCitations;
  /** The view folded this decision, unmounting its body: close what the host had open in it, such as its editor. */
  onFold?: (decisionId: string) => void;
  /** The open decisions as the host keeps them; without it the view keeps them, all folded at first. */
  expansion?: DecisionGraphExpansion;
  /** Opens a decision on its own, from a double-click on its heading or Alt+Enter on its toggle; a reference opens the decision it repeats. */
  onOpenDecision?: (decisionId: string) => void;
  /** A table's rules as its body words them, which the minimap lists and searches by outputs and conditions; read only while it is open, and without it the minimap lists decisions alone. */
  rules?: DecisionGraphMinimapSlotProps['rules'];
  /** Container testid; derived ids: `-scroller`, `-empty`, `-decision-{id}`, `-toggle-{id}`, `-hit-policy-{id}`, `-rule-count-{id}`, `-mark-{id}`, `-body-{id}`, `-reference-{id}`, `-reference-link-{id}`, `-menu-{id}`, `-reference-menu-{id}`, `-name-{id}-input`, `-add-decision`, `-delete-dialog`, `-links-dialog`, `-note-dialog`, `-live`, `-minimap` (and its `-trigger`, `-content`, `-search`, `-list`, `-row-decision-{id}`, `-row-rule-{id}-{rowId}`, `-row-reference-{id}`, `-no-match`). */
  dataTestId: string;
}

const NO_EXPANDED: ReadonlySet<string> = new Set();

/** Brought into view and told to the host, or opened and flashed where it stands. */
type RevealMode = { kind: 'navigate'; focus: boolean; flash: boolean } | { kind: 'inPlace' };

type PendingReveal = DecisionGraphTarget & { mode: RevealMode };

const markTargetOf = ({ id, mark }: DecisionGraphDecisionNode): DecisionGraphTarget =>
  mark?.kind === 'rule'
    ? { kind: 'rule', decisionId: id, rowId: mark.rowId }
    : { kind: 'decision', decisionId: id };

const citationOf = (
  citations: DecisionGraphCitations,
  decisionId: string
): DecisionGraphCardProps['citations'] => {
  const cited = citations.kind === 'cited' ? (citations.decisions.get(decisionId) ?? []) : [];
  return citations.kind === 'cited' && cited.length > 0
    ? { citations: cited, onOpen: citations.onOpenCitation }
    : null;
};

const focuses = (mode: RevealMode): boolean => mode.kind === 'navigate' && mode.focus;

const flashes = (mode: RevealMode): boolean => mode.kind === 'inPlace' || mode.flash;

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const flash = (element: HTMLElement) => {
  if (prefersReducedMotion()) return;
  element.animate?.(
    [
      { boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary) 40%, transparent)' },
      { boxShadow: '0 0 0 0 transparent' },
    ],
    { duration: 1400, easing: 'ease-out' }
  );
};

const NEAR_MARGIN = '100% 0px';

/** `current` with each crossing card's decision added while it is near the scrollport and dropped once it is not; the same set when none changed. */
const nearAfter = (
  current: ReadonlySet<string>,
  entries: readonly IntersectionObserverEntry[]
): ReadonlySet<string> => {
  let next: Set<string> | undefined;
  for (const { target, isIntersecting } of entries) {
    const decisionId = target instanceof HTMLElement ? target.dataset.decisionId : undefined;
    if (decisionId === undefined || (next ?? current).has(decisionId) === isIntersecting) continue;
    next ??= new Set(current);
    if (isIntersecting) next.add(decisionId);
    else next.delete(decisionId);
  }
  return next ?? current;
};

/** The height of a card's mounted body, or null while it shows a placeholder. */
const bodyHeightOf = (card: HTMLElement): number | null => {
  const body = card.querySelector<HTMLElement>(':scope > [data-graph-body]');
  if (!body || body.querySelector(':scope > [data-graph-placeholder]')) return null;
  return body.offsetHeight || null;
};

/** Each decision's rule count by id. */
const ruleCountsOf = (nodes: readonly DecisionGraphNode[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  const visit = (node: DecisionGraphNode) => {
    if (node.kind !== 'decision') return;
    if (node.logic.kind === 'table') counts.set(node.id, node.logic.ruleCount);
    for (const child of node.children) visit(child);
  };
  for (const node of nodes) visit(node);
  return counts;
};

/** A body's height per rule, averaged over the bodies measured. */
const perRuleHeightOf = (
  heights: ReadonlyMap<string, number>,
  ruleCounts: ReadonlyMap<string, number>
): number => {
  let height = 0;
  let rules = 0;
  for (const [decisionId, measured] of heights) {
    const count = ruleCounts.get(decisionId) ?? 0;
    if (count === 0) continue;
    height += measured;
    rules += count;
  }
  return rules === 0 ? SENTENCE_MIN_RULE_HEIGHT_PX : height / rules;
};

/** A decision graph as text: one folding card per decision in the order given, the decisions it requires nested under it. */
export const DecisionGraphText = <Refusal, Logic, Op, Policy, Total, Type, TextRefusal>({
  nodes,
  mode,
  renderBody,
  citations = NO_CITATIONS,
  expansion,
  onFold,
  onOpenDecision,
  rules,
  dataTestId,
}: DecisionGraphTextProps<
  Refusal,
  Logic,
  Op,
  Policy,
  Total,
  Type,
  TextRefusal
>): React.ReactElement => {
  const labels = useDecisionGraphLabels();
  const { selected } = mode;
  const { announce, region } = useTextAnnouncements(useDecisionTextLabels(), dataTestId);
  const idPrefix = useId();
  const [ownExpanded, setOwnExpanded] = useState(NO_EXPANDED);
  const expanded = expansion?.expanded ?? ownExpanded;
  const users = useMemo(() => usersOf(nodes), [nodes]);
  const drawn = useMemo(() => new Set(decisionsOf(nodes).map(({ id }) => id)), [nodes]);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [launcherEnd, setLauncherEnd] = useState(0);
  const cardsRef = useRef(new Map<string, HTMLElement>());
  const [pending, setPending] = useState<PendingReveal | null>(null);
  const [near, setNear] = useState<ReadonlySet<string> | null>(() =>
    typeof IntersectionObserver === 'undefined' ? null : NO_EXPANDED
  );
  const [revealed, setRevealed] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const heightsRef = useRef(new Map<string, number>());
  const observersRef = useRef<{
    near: IntersectionObserver;
    size: ResizeObserver | null;
  } | null>(null);
  const ruleCounts = useMemo(() => ruleCountsOf(nodes), [nodes]);

  const setExpanded = (next: ReadonlySet<string>) => {
    if (expansion) expansion.onChange(next);
    else setOwnExpanded(next);
  };
  const toggle = (decisionId: string) => {
    const next = new Set(expanded);
    const folds = next.delete(decisionId);
    if (!folds) next.add(decisionId);
    setExpanded(next);
    if (folds) onFold?.(decisionId);
  };
  const reveal = (target: PendingReveal) => {
    if (!expanded.has(target.decisionId)) setExpanded(new Set([...expanded, target.decisionId]));
    setPending(target);
    setRevealed(target.decisionId);
    if (target.mode.kind === 'navigate' && mode.kind !== 'read') {
      mode.onReveal(
        target.kind === 'rule'
          ? { kind: 'rule', decisionId: target.decisionId, rowId: target.rowId }
          : { kind: 'decision', decisionId: target.decisionId }
      );
    }
  };
  const bodyContext: DecisionGraphBodyContext = {
    revealDecision: (decisionId, byKey) => {
      if (!drawn.has(decisionId)) {
        onOpenDecision?.(decisionId);
        return;
      }
      reveal({
        kind: 'decision',
        decisionId,
        mode: { kind: 'navigate', focus: byKey, flash: true },
      });
    },
  };
  const openOf = (decisionId: string) => onOpenDecision && (() => onOpenDecision(decisionId));
  const actions = useDecisionGraphActions({
    mode,
    nodes,
    labels,
    openOf,
    cardOf: (decisionId) => cardsRef.current.get(decisionId),
    scroller,
    announce,
    dataTestId,
  });

  const cardRefsRef = useRef(new Map<string, (element: HTMLElement | null) => void>());
  const cardRef = useCallback((decisionId: string) => {
    const cached = cardRefsRef.current.get(decisionId);
    if (cached) return cached;
    const attach = (element: HTMLElement | null) => {
      const observers = observersRef.current;
      const previous = cardsRef.current.get(decisionId);
      if (previous && previous !== element) {
        observers?.near.unobserve(previous);
        observers?.size?.unobserve(previous);
      }
      if (!element) {
        cardsRef.current.delete(decisionId);
        return;
      }
      cardsRef.current.set(decisionId, element);
      observers?.near.observe(element);
      observers?.size?.observe(element);
    };
    cardRefsRef.current.set(decisionId, attach);
    return attach;
  }, []);

  useLayoutEffect(() => {
    if (!scroller || typeof IntersectionObserver === 'undefined') return;
    const remember = (card: Element) => {
      if (!(card instanceof HTMLElement)) return;
      const decisionId = card.dataset.decisionId;
      const height = bodyHeightOf(card);
      if (decisionId !== undefined && height !== null) heightsRef.current.set(decisionId, height);
    };
    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const { target } of entries) remember(target);
        setNear((current) => nearAfter(current ?? NO_EXPANDED, entries));
      },
      { root: scroller, rootMargin: NEAR_MARGIN }
    );
    const sizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            for (const { target } of entries) remember(target);
          });
    observersRef.current = { near: nearObserver, size: sizeObserver };
    for (const card of cardsRef.current.values()) {
      nearObserver.observe(card);
      sizeObserver?.observe(card);
    }
    return () => {
      nearObserver.disconnect();
      sizeObserver?.disconnect();
      observersRef.current = null;
    };
  }, [scroller]);

  const perRuleHeight = perRuleHeightOf(heightsRef.current, ruleCounts);
  const bodyOf = (decisionId: string, scrollContainer: HTMLElement): React.ReactNode => {
    const mounted =
      near === null ||
      near.has(decisionId) ||
      decisionId === selected ||
      decisionId === revealed ||
      decisionId === focused;
    if (mounted) {
      const body = renderBody(decisionId, bodyContext);
      return body.kind === 'table' ? (
        <DecisionText
          {...body.text}
          scroll={{ container: scrollContainer }}
          onOpenDecision={bodyContext.revealDecision}
        />
      ) : (
        body.content
      );
    }
    const height =
      heightsRef.current.get(decisionId) ??
      Math.max(1, ruleCounts.get(decisionId) ?? 1) * perRuleHeight;
    return <div aria-hidden data-graph-placeholder style={{ height }} />;
  };
  const onFocus = (event: React.FocusEvent<HTMLElement>) => {
    const card = event.target instanceof Element ? event.target.closest('[data-graph-card]') : null;
    const decisionId = card instanceof HTMLElement ? card.dataset.decisionId : undefined;
    if (decisionId !== undefined) setFocused(decisionId);
  };

  useLayoutEffect(() => {
    if (!pending) return;
    const apply = (): boolean => {
      const card = cardsRef.current.get(pending.decisionId);
      if (!scroller || !card) return false;
      if (pending.kind === 'decision') {
        const heading = card.querySelector<HTMLElement>('[data-graph-toggle]');
        if (pending.mode.kind === 'navigate') {
          revealIn(scroller, { vertical: card, horizontal: heading ?? card, block: 'start' });
        }
        if (focuses(pending.mode)) heading?.focus({ preventScroll: true });
        if (flashes(pending.mode)) flash(card);
        return true;
      }
      const rule = card.querySelector<HTMLElement>(
        `li[data-row-id="${CSS.escape(pending.rowId)}"]`
      );
      if (!rule) return false;
      if (pending.mode.kind === 'navigate') {
        revealIn(scroller, { vertical: rule, horizontal: rule, block: 'center' });
      }
      if (focuses(pending.mode)) {
        if (!rule.hasAttribute('tabindex')) rule.tabIndex = -1;
        rule.focus({ preventScroll: true });
      }
      if (flashes(pending.mode)) flash(rule);
      return true;
    };
    if (apply()) {
      setPending(null);
      return;
    }
    const frame = requestAnimationFrame(() => {
      const card = cardsRef.current.get(pending.decisionId);
      if (!apply() && flashes(pending.mode) && card) flash(card);
      setPending(null);
    });
    return () => cancelAnimationFrame(frame);
  });

  const branch = (
    node: DecisionGraphNode,
    depth: number,
    position: DecisionGraphPosition
  ): React.ReactNode => {
    if (node.kind === 'reference') {
      return (
        <DecisionGraphReference
          node={node}
          labels={labels}
          actions={actions.referenceOf(node, position)}
          onReveal={() =>
            reveal({
              kind: 'decision',
              decisionId: node.targetId,
              mode: { kind: 'navigate', focus: false, flash: false },
            })
          }
          onOpen={openOf(node.targetId)}
          dataTestId={dataTestId}
        />
      );
    }
    const open = expanded.has(node.id);
    return (
      <>
        <DecisionGraphCard
          node={node}
          depth={depth}
          open={open}
          active={selected === node.id}
          usedBy={(users.get(node.id) ?? []).map((user) => user.label)}
          bodyId={`${idPrefix}-${encodeURIComponent(node.id)}`}
          body={open && scroller ? bodyOf(node.id, scroller) : null}
          labels={labels}
          onToggle={() => toggle(node.id)}
          onShowProblem={(byKey) =>
            reveal({
              ...markTargetOf(node),
              mode: byKey ? { kind: 'navigate', focus: true, flash: true } : { kind: 'inPlace' },
            })
          }
          onOpen={openOf(node.id)}
          actions={actions.cardOf(node, position)}
          citations={citationOf(citations, node.id)}
          cardRef={cardRef(node.id)}
          dataTestId={dataTestId}
        />
        {node.children.length > 0 && (
          <div className={GRAPH_NEST_CLASS} data-graph-nest-of={node.id}>
            {childPositionsOf(node, position).map((childPosition) => {
              const child = node.children[childPosition.index];
              return (
                child && (
                  <div key={child.id} className={GRAPH_BRANCH_CLASS}>
                    {branch(child, depth + 1, childPosition)}
                  </div>
                )
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(GRAPH_FRAME_CLASS, GRAPH_OUTPUT_HUE_CLASS)}
      data-testid={dataTestId}
      {...actions.focusWithin}
    >
      {nodes.length > 0 && (
        <DecisionGraphMinimapSlot
          nodes={nodes}
          rules={rules}
          selected={selected}
          onPick={(target) =>
            reveal({ ...target, mode: { kind: 'navigate', focus: true, flash: true } })
          }
          onLauncherEnd={setLauncherEnd}
          labels={labels}
          dataTestId={`${dataTestId}-minimap`}
        />
      )}
      <section
        ref={setScroller}
        aria-label={labels.graph}
        className={GRAPH_SCROLLER_CLASS}
        style={{ scrollPaddingInlineStart: launcherEnd + GRAPH_MINIMAP_GAP_PX }}
        data-testid={`${dataTestId}-scroller`}
      >
        {nodes.length === 0 && (
          <p className={GRAPH_EMPTY_CLASS} data-testid={`${dataTestId}-empty`}>
            {labels.empty}
          </p>
        )}
        {(nodes.length > 0 || actions.addTop) && (
          <div
            className={GRAPH_COLUMN_CLASS}
            style={{ paddingLeft: graphColumnInsetOf(launcherEnd) }}
            onFocus={onFocus}
          >
            {topPositionsOf(nodes).map((position) => {
              const node = nodes[position.index];
              return node && <div key={node.id}>{branch(node, 0, position)}</div>;
            })}
            {actions.addTop && (
              <button
                type="button"
                className={GRAPH_ADD_DECISION_CLASS}
                onClick={actions.addTop}
                data-graph-add
                data-testid={`${dataTestId}-add-decision`}
              >
                <Plus aria-hidden />
                {labels.addDecision}
              </button>
            )}
          </div>
        )}
      </section>
      {actions.dialogs}
      {region}
    </div>
  );
};
