import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DecisionGraphCard, DecisionGraphReference } from './DecisionGraphCard';
import {
  GRAPH_BRANCH_CLASS,
  GRAPH_COLUMN_CLASS,
  GRAPH_EMPTY_CLASS,
  GRAPH_FRAME_CLASS,
  GRAPH_NEST_CLASS,
  GRAPH_OUTPUT_HUE_CLASS,
  GRAPH_SCROLLER_CLASS,
} from './decisionGraphStyles';
import type {
  DecisionGraphDecisionNode,
  DecisionGraphNode,
  DecisionGraphTarget,
} from './decisionGraphTypes';
import { type DecisionGraphLabels, useDecisionGraphLabels } from './useDecisionGraphStrings';
import { contentTopIn, type DecisionTextScroll } from './useRuleWindow';

export interface DecisionGraphTextProps {
  /** The decisions in reading order, each with the decisions it requires as children; one already drawn is a reference. */
  nodes: readonly DecisionGraphNode[];
  /** The body of an open decision: its `DecisionText` given `scroll`, the graph's own scroll container, or whatever stands for logic that is not a table. */
  renderBody: (decisionId: string, scroll: Exclude<DecisionTextScroll, 'self'>) => React.ReactNode;
  /** The view folded this decision, unmounting its body: close what the host had open in it, such as its editor. */
  onFold?: (decisionId: string) => void;
  /** The open decisions; without it the view keeps them, all folded at first. */
  expanded?: ReadonlySet<string>;
  onExpandedChange?: (expanded: ReadonlySet<string>) => void;
  /** The decision the host's selection is in. */
  selected?: string | null;
  /** The view brought a decision or one of its rules into view; a host that selects the rule there has it focused. */
  onReveal?: (target: DecisionGraphTarget) => void;
  /** Strings in place of the built-in ones, any subset. */
  labels?: Partial<DecisionGraphLabels>;
  /** Container testid; derived ids: `-scroller`, `-empty`, `-decision-{id}`, `-toggle-{id}`, `-hit-policy-{id}`, `-rule-count-{id}`, `-mark-{id}`, `-body-{id}`, `-reference-{id}`, `-reference-link-{id}`. */
  dataTestId: string;
}

const NO_EXPANDED: ReadonlySet<string> = new Set();

interface PendingReveal extends DecisionGraphTarget {
  /** Moves focus to what is revealed. */
  focus: boolean;
  flash: boolean;
}

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

const scrollTo = (scroller: HTMLElement, top: number) =>
  scroller.scrollTo?.({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

/** Each decision's users by id: the decisions it sits under, in full or as a reference. */
const usersOf = (nodes: readonly DecisionGraphNode[]): ReadonlyMap<string, string[]> => {
  const users = new Map<string, string[]>();
  const visit = (node: DecisionGraphNode, parent: DecisionGraphDecisionNode | null) => {
    const id = node.kind === 'decision' ? node.id : node.targetId;
    if (parent) users.set(id, [...(users.get(id) ?? []), parent.label]);
    if (node.kind === 'decision') for (const child of node.children) visit(child, node);
  };
  for (const node of nodes) visit(node, null);
  return users;
};

/** A decision graph read as text: one folding card per decision in the order given, the decisions it requires nested under it. */
export const DecisionGraphText: React.FC<DecisionGraphTextProps> = ({
  nodes,
  renderBody,
  expanded: hostExpanded,
  onExpandedChange,
  onFold,
  selected = null,
  onReveal,
  labels: hostLabels,
  dataTestId,
}) => {
  const labels = useDecisionGraphLabels(hostLabels);
  const idPrefix = useId();
  const [ownExpanded, setOwnExpanded] = useState(NO_EXPANDED);
  const expanded = hostExpanded ?? ownExpanded;
  const users = useMemo(() => usersOf(nodes), [nodes]);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const cardsRef = useRef(new Map<string, HTMLElement>());
  const [pending, setPending] = useState<PendingReveal | null>(null);

  const setExpanded = (next: ReadonlySet<string>) => {
    if (hostExpanded === undefined) setOwnExpanded(next);
    onExpandedChange?.(next);
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
    onReveal?.({ decisionId: target.decisionId, rowId: target.rowId });
  };

  const cardRef = useCallback(
    (decisionId: string) => (element: HTMLElement | null) => {
      if (element) cardsRef.current.set(decisionId, element);
      else cardsRef.current.delete(decisionId);
    },
    []
  );

  useLayoutEffect(() => {
    if (!pending) return;
    const apply = (): boolean => {
      const card = cardsRef.current.get(pending.decisionId);
      if (!scroller || !card) return false;
      if (pending.rowId === undefined) {
        scrollTo(scroller, contentTopIn(card, scroller));
        if (pending.focus) {
          card.querySelector<HTMLElement>('[data-graph-toggle]')?.focus({ preventScroll: true });
        }
        if (pending.flash) flash(card);
        return true;
      }
      const rule = card.querySelector<HTMLElement>(
        `li[data-row-id="${CSS.escape(pending.rowId)}"]`
      );
      if (!rule) return false;
      scrollTo(
        scroller,
        contentTopIn(rule, scroller) - (scroller.clientHeight - rule.offsetHeight) / 2
      );
      if (pending.focus) rule.focus({ preventScroll: true });
      if (pending.flash) flash(rule);
      return true;
    };
    if (apply()) {
      setPending(null);
      return;
    }
    const frame = requestAnimationFrame(() => {
      apply();
      setPending(null);
    });
    return () => cancelAnimationFrame(frame);
  });

  const branch = (node: DecisionGraphNode, depth: number): React.ReactNode => {
    if (node.kind === 'reference') {
      return (
        <DecisionGraphReference
          node={node}
          labels={labels}
          onReveal={() => reveal({ decisionId: node.targetId, focus: false, flash: false })}
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
          usedBy={users.get(node.id) ?? []}
          bodyId={`${idPrefix}-${encodeURIComponent(node.id)}`}
          body={open && scroller ? renderBody(node.id, { container: scroller }) : null}
          labels={labels}
          onToggle={() => toggle(node.id)}
          onShowProblem={() =>
            reveal({ decisionId: node.id, rowId: node.markRowId, focus: true, flash: true })
          }
          cardRef={cardRef(node.id)}
          dataTestId={dataTestId}
        />
        {node.children.length > 0 && (
          <div className={GRAPH_NEST_CLASS}>
            {node.children.map((child) => (
              <div key={child.id} className={GRAPH_BRANCH_CLASS}>
                {branch(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className={cn(GRAPH_FRAME_CLASS, GRAPH_OUTPUT_HUE_CLASS)} data-testid={dataTestId}>
      <section
        ref={setScroller}
        aria-label={labels.graph}
        className={GRAPH_SCROLLER_CLASS}
        data-testid={`${dataTestId}-scroller`}
      >
        {nodes.length === 0 ? (
          <p className={GRAPH_EMPTY_CLASS} data-testid={`${dataTestId}-empty`}>
            {labels.empty}
          </p>
        ) : (
          <div className={GRAPH_COLUMN_CLASS}>
            {nodes.map((node) => (
              <div key={node.id}>{branch(node, 0)}</div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
