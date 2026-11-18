import { cn } from '@uipath/apollo-wind';
import { ChevronDown, ChevronRight, CornerDownRight, Network } from 'lucide-react';
import type React from 'react';
import type { DecisionGraphDecisionNode, DecisionGraphReferenceNode } from './decisionGraphTypes';
import {
  GRAPH_BODY_CLASS,
  GRAPH_CARD_CLASS,
  GRAPH_CARD_COLLAPSED_CLASS,
  GRAPH_CARD_TONE_CLASS,
  GRAPH_HEADER_CLASS,
  GRAPH_HIT_POLICY_CLASS,
  GRAPH_MARK_BUTTON_CLASS,
  GRAPH_NAME_CLASS,
  GRAPH_REFERENCE_CHIP_CLASS,
  GRAPH_REFERENCE_CLASS,
  GRAPH_RULE_COUNT_CLASS,
  GRAPH_TOGGLE_CLASS,
} from './decisionGraphStyles';
import { MarkGlyph } from './MarkGlyph';
import { isLineMark } from './sentenceMarks';
import type { DecisionGraphLabels } from './useDecisionGraphStrings';

export interface DecisionGraphCardProps {
  node: DecisionGraphDecisionNode;
  /** 0 for a decision nothing requires; sets its heading's level. */
  depth: number;
  open: boolean;
  /** The host's selection is in this decision. */
  active: boolean;
  /** The decisions that require it, read with its heading. */
  usedBy: readonly string[];
  bodyId: string;
  body: React.ReactNode;
  labels: DecisionGraphLabels;
  onToggle: () => void;
  /** `byKey` when the mark was pressed from the keyboard rather than clicked. */
  onShowProblem: (byKey: boolean) => void;
  onOpen: (() => void) | undefined;
  cardRef: (element: HTMLElement | null) => void;
  dataTestId: string;
}

const HEADINGS = ['h3', 'h4', 'h5', 'h6'] as const;

const OPEN_KEYS = 'Alt+Enter';

const openOnKey = (event: React.KeyboardEvent, open: () => void) => {
  if (event.key !== 'Enter' || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }
  event.preventDefault();
  open();
};

const isOtherAction = (target: EventTarget): boolean =>
  target instanceof Element && target.closest('button:not([data-graph-toggle])') !== null;

/** A decision as a card: a sticky heading that folds it, then the host's body for it while open. */
export const DecisionGraphCard: React.FC<DecisionGraphCardProps> = ({
  node,
  depth,
  open,
  active,
  usedBy,
  bodyId,
  body,
  labels,
  onToggle,
  onShowProblem,
  onOpen,
  cardRef,
  dataTestId,
}) => {
  const { logic } = node;
  const headingMark = node.mark?.mark;
  const mark = isLineMark(headingMark) ? headingMark : undefined;
  const Heading = HEADINGS[Math.min(depth, HEADINGS.length - 1)] ?? 'h6';
  return (
    <section
      ref={cardRef}
      aria-label={node.label}
      className={cn(
        GRAPH_CARD_CLASS,
        !open && GRAPH_CARD_COLLAPSED_CLASS,
        mark && GRAPH_CARD_TONE_CLASS[mark.tone]
      )}
      data-decision-id={node.id}
      data-open={open || undefined}
      data-active={active || undefined}
      data-testid={`${dataTestId}-decision-${node.id}`}
    >
      <Heading
        className={GRAPH_HEADER_CLASS}
        onDoubleClick={
          onOpen &&
          ((event) => {
            if (!isOtherAction(event.target)) onOpen();
          })
        }
      >
        <button
          type="button"
          className={GRAPH_TOGGLE_CLASS}
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={onToggle}
          onKeyDown={onOpen && ((event) => openOnKey(event, onOpen))}
          aria-keyshortcuts={onOpen && OPEN_KEYS}
          data-graph-toggle
          data-testid={`${dataTestId}-toggle-${node.id}`}
        >
          {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
          <span className={GRAPH_NAME_CLASS}>{node.label}</span>
        </button>
        {usedBy.length > 0 && <span className="sr-only">{labels.usedBy(usedBy.join(', '))}</span>}
        {logic.kind === 'table' && (
          <span
            className={GRAPH_HIT_POLICY_CLASS}
            data-testid={`${dataTestId}-hit-policy-${node.id}`}
          >
            {logic.hitPolicy}
          </span>
        )}
        <span
          className={cn(GRAPH_RULE_COUNT_CLASS, logic.kind !== 'table' && 'invisible')}
          data-testid={`${dataTestId}-rule-count-${node.id}`}
        >
          {logic.kind === 'table' && labels.ruleCount(logic.ruleCount)}
        </span>
        {mark && (
          <button
            type="button"
            className={GRAPH_MARK_BUTTON_CLASS}
            title={mark.title}
            aria-label={labels.showProblem(labels.markStatus(mark.tone, mark.title))}
            data-tone={mark.tone}
            onClick={(event) => onShowProblem(event.detail === 0)}
            data-testid={`${dataTestId}-mark-${node.id}`}
          >
            <MarkGlyph tone={mark.tone} className="size-3.5" />
          </button>
        )}
      </Heading>
      {open && (
        <div
          id={bodyId}
          className={GRAPH_BODY_CLASS}
          data-graph-body
          data-testid={`${dataTestId}-body-${node.id}`}
        >
          {body}
        </div>
      )}
    </section>
  );
};

export interface DecisionGraphReferenceProps {
  node: DecisionGraphReferenceNode;
  labels: DecisionGraphLabels;
  onReveal: () => void;
  onOpen: (() => void) | undefined;
  dataTestId: string;
}

const NAME_SLOT = '\u0000';

/** A decision shown in full elsewhere: a line whose link opens it there and brings it to the top. */
export const DecisionGraphReference: React.FC<DecisionGraphReferenceProps> = ({
  node,
  labels,
  onReveal,
  onOpen,
  dataTestId,
}) => {
  const [before = '', after = ''] = labels.seeAbove(NAME_SLOT).split(NAME_SLOT);
  return (
    <div
      className={GRAPH_REFERENCE_CLASS}
      onDoubleClick={onOpen}
      data-testid={`${dataTestId}-reference-${node.id}`}
    >
      <CornerDownRight aria-hidden className="size-3 shrink-0" />
      <span>
        {before}
        <button
          type="button"
          className={GRAPH_REFERENCE_CHIP_CLASS}
          onClick={onReveal}
          onKeyDown={onOpen && ((event) => openOnKey(event, onOpen))}
          aria-keyshortcuts={onOpen && OPEN_KEYS}
          data-testid={`${dataTestId}-reference-link-${node.id}`}
        >
          <Network aria-hidden className="size-3" />
          {node.label}
        </button>
        {after}
      </span>
    </div>
  );
};
