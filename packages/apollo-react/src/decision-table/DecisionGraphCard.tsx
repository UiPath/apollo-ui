import { cn, Input } from '@uipath/apollo-wind';
import { ChevronDown, ChevronRight, CornerDownRight, Ellipsis, Network } from 'lucide-react';
import type React from 'react';
import { useCallback, useId, useLayoutEffect, useRef } from 'react';
import { CitationButtons } from './CitationButton';
import {
  GRAPH_BODY_CLASS,
  GRAPH_CARD_CLASS,
  GRAPH_CARD_COLLAPSED_CLASS,
  GRAPH_CARD_TONE_CLASS,
  GRAPH_HEADER_CLASS,
  GRAPH_HIT_POLICY_CLASS,
  GRAPH_MARK_BUTTON_CLASS,
  GRAPH_MENU_BUTTON_CLASS,
  GRAPH_NAME_CLASS,
  GRAPH_REFERENCE_CHIP_CLASS,
  GRAPH_REFERENCE_CLASS,
  GRAPH_REVEAL_CLASS,
  GRAPH_RULE_COUNT_CLASS,
  GRAPH_TOGGLE_CLASS,
} from './decisionGraphStyles';
import type { DecisionGraphDecisionNode, DecisionGraphReferenceNode } from './decisionGraphTypes';
import { GridMenuButton, type GridMenuEntry } from './GridMenu';
import { isComposing } from './gridEvents';
import { MarkGlyph } from './MarkGlyph';
import { MarkTooltip } from './MarkTooltip';
import { isLineMark } from './sentenceMarks';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';
import type { DecisionGraphLabels } from './useDecisionGraphStrings';

/** The open rename field: the host's last refusal of it, worded, and what it proposes. */
export interface DecisionGraphRenameField {
  /** The name the field opened with. */
  from: string;
  draft: string;
  onDraft: (draft: string) => void;
  refusal: string | null;
  /** `byKey` when Enter committed it rather than focus leaving. */
  onCommit: (name: string, byKey: boolean) => void;
  /** `byKey` when Escape or Enter closed it rather than focus leaving. */
  onCancel: (byKey: boolean) => void;
}

/** A node's own menu and keys, built from the host's actions. */
export interface DecisionGraphNodeActions {
  menuLabel: string;
  entries: () => GridMenuEntry[];
  onKeyDown: (event: React.KeyboardEvent) => void;
  keyShortcuts: readonly string[];
}

/** A card's menu and keys, and its name field while renaming. */
export interface DecisionGraphCardActions extends DecisionGraphNodeActions {
  nameField: string;
  rename: DecisionGraphRenameField | null;
}

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
  /** The hit policy chip after the name of a table decision. */
  policy: React.ReactNode;
  labels: DecisionGraphLabels;
  onToggle: () => void;
  /** `byKey` when the mark was pressed from the keyboard rather than clicked. */
  onShowProblem: (byKey: boolean) => void;
  onOpen: (() => void) | undefined;
  actions: DecisionGraphCardActions | null;
  /** Where the decision was read from, or null. */
  citations: { citations: readonly SentenceCitation[]; onOpen: OpenCitation } | null;
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
  target instanceof Element && target.closest('button:not([data-graph-toggle]), input') !== null;

const keysOf = (
  onOpen: (() => void) | undefined,
  actions: DecisionGraphNodeActions | null
): string | undefined => {
  const keys = [...(onOpen ? [OPEN_KEYS] : []), ...(actions?.keyShortcuts ?? [])];
  return keys.length > 0 ? keys.join(' ') : undefined;
};

const onNodeKeyDown =
  (onOpen: (() => void) | undefined, actions: DecisionGraphNodeActions | null) =>
  (event: React.KeyboardEvent) => {
    if (onOpen) openOnKey(event, onOpen);
    if (!event.defaultPrevented) actions?.onKeyDown(event);
  };

/** The ⋯ button that opens a decision's menu. */
export const NodeMenu = ({
  actions,
  className,
  dataTestId,
}: {
  actions: Pick<DecisionGraphNodeActions, 'menuLabel' | 'entries'>;
  className: string;
  dataTestId: string;
}) => (
  <GridMenuButton
    label={actions.menuLabel}
    entries={actions.entries}
    className={className}
    dataTestId={dataTestId}
  >
    <Ellipsis aria-hidden className="size-4" />
  </GridMenuButton>
);

export const NameField = ({
  field,
  label,
  dataTestId,
}: {
  field: DecisionGraphRenameField;
  label: string;
  dataTestId: string;
}) => {
  const refusalId = useId();
  const settledRef = useRef(false);
  useLayoutEffect(() => {
    settledRef.current = false;
  });
  const commit = (byKey: boolean) => {
    const next = field.draft.trim();
    if (next === '' || next === field.from) field.onCancel(byKey);
    else field.onCommit(next, byKey);
  };
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <Input
        autoFocus
        value={field.draft}
        onChange={(event) => field.onDraft(event.target.value)}
        aria-label={label}
        aria-invalid={field.refusal !== null || undefined}
        aria-describedby={field.refusal === null ? undefined : refusalId}
        className="h-8"
        onFocus={(event) => {
          settledRef.current = false;
          if (field.draft === field.from) event.currentTarget.select();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (isComposing(event)) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            settledRef.current = true;
            commit(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            settledRef.current = true;
            field.onCancel(true);
          }
        }}
        onBlur={() => {
          if (settledRef.current) return;
          commit(false);
        }}
        data-testid={`${dataTestId}-input`}
      />
      {field.refusal !== null && (
        <span id={refusalId} role="alert" className="text-xs text-destructive">
          {field.refusal}
        </span>
      )}
    </span>
  );
};

/** A decision as a card: a sticky heading that folds it, then the host's body for it while open. */
export const DecisionGraphCard: React.FC<DecisionGraphCardProps> = ({
  node,
  depth,
  open,
  active,
  usedBy,
  bodyId,
  body,
  policy,
  labels,
  onToggle,
  onShowProblem,
  onOpen,
  actions,
  citations,
  cardRef,
  dataTestId,
}) => {
  const { logic } = node;
  const rename = actions?.rename ?? null;
  const headingMark = node.mark?.mark;
  const mark = isLineMark(headingMark) ? headingMark : undefined;
  const Heading = HEADINGS[Math.min(depth, HEADINGS.length - 1)] ?? 'h6';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingContainer = useCallback(() => headingRef.current, []);
  const cardContainer = useCallback(() => headingRef.current?.parentElement ?? null, []);
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
      data-graph-card
      data-open={open || undefined}
      data-active={active || undefined}
      data-testid={`${dataTestId}-decision-${node.id}`}
    >
      <Heading
        ref={headingRef}
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
          aria-label={rename ? node.label : undefined}
          onClick={onToggle}
          onKeyDown={onNodeKeyDown(onOpen, actions)}
          aria-keyshortcuts={keysOf(onOpen, actions)}
          data-graph-toggle
          data-testid={`${dataTestId}-toggle-${node.id}`}
        >
          {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
          {!rename && <span className={GRAPH_NAME_CLASS}>{node.label}</span>}
        </button>
        {actions && rename && (
          <NameField
            field={rename}
            label={actions.nameField}
            dataTestId={`${dataTestId}-name-${node.id}`}
          />
        )}
        {logic.kind === 'table' && (
          <span
            className={GRAPH_HIT_POLICY_CLASS}
            data-testid={`${dataTestId}-hit-policy-${node.id}`}
          >
            {policy}
          </span>
        )}
        {usedBy.length > 0 && <span className="sr-only">{labels.usedBy(usedBy.join(', '))}</span>}
        <span
          className={cn(GRAPH_RULE_COUNT_CLASS, logic.kind !== 'table' && 'invisible')}
          data-testid={`${dataTestId}-rule-count-${node.id}`}
        >
          {logic.kind === 'table' && labels.ruleCount(logic.ruleCount)}
        </span>
        {citations && (
          <CitationButtons
            citations={citations.citations}
            owner={{ kind: 'decision', name: node.label }}
            onOpen={citations.onOpen}
            selected={active}
            tabIndex={0}
            className={cn(
              'shrink-0',
              !active && GRAPH_REVEAL_CLASS,
              '[@media(hover:none)]:opacity-100'
            )}
            labels={labels}
            dataTestId={`${dataTestId}-citation-${node.id}`}
          />
        )}
        {actions && (
          <NodeMenu
            actions={actions}
            className={GRAPH_MENU_BUTTON_CLASS}
            dataTestId={`${dataTestId}-menu-${node.id}`}
          />
        )}
        {mark && (
          <button
            type="button"
            className={GRAPH_MARK_BUTTON_CLASS}
            data-mark-title={mark.title}
            data-mark-focus
            aria-label={labels.showProblem(labels.markStatus(mark.tone, mark.title))}
            data-tone={mark.tone}
            onClick={(event) => onShowProblem(event.detail === 0)}
            data-testid={`${dataTestId}-mark-${node.id}`}
          >
            <MarkGlyph tone={mark.tone} className="size-3.5" />
          </button>
        )}
        {mark && (
          <MarkTooltip
            container={headingContainer}
            portalContainer={cardContainer}
            dataTestId={`${dataTestId}-${node.id}`}
          />
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
  actions: DecisionGraphNodeActions | null;
  dataTestId: string;
}

const NAME_SLOT = '\u0000';

/** A decision shown in full elsewhere: a line whose link opens it there and brings it to the top. */
export const DecisionGraphReference: React.FC<DecisionGraphReferenceProps> = ({
  node,
  labels,
  onReveal,
  onOpen,
  actions,
  dataTestId,
}) => {
  const [before = '', after = ''] = labels.seeAbove(NAME_SLOT).split(NAME_SLOT);
  return (
    <div
      className={GRAPH_REFERENCE_CLASS}
      onDoubleClick={
        onOpen &&
        ((event) => {
          if (!(event.target instanceof Element && event.target.closest('[data-graph-menu]')))
            onOpen();
        })
      }
      data-testid={`${dataTestId}-reference-${node.id}`}
    >
      <CornerDownRight aria-hidden className="size-3 shrink-0" />
      <span>
        {before}
        <button
          type="button"
          className={GRAPH_REFERENCE_CHIP_CLASS}
          onClick={onReveal}
          onKeyDown={onNodeKeyDown(onOpen, actions)}
          aria-keyshortcuts={keysOf(onOpen, actions)}
          data-graph-reference-link={node.id}
          data-testid={`${dataTestId}-reference-link-${node.id}`}
        >
          <Network aria-hidden className="size-3" />
          {node.label}
        </button>
        {after}
      </span>
      {actions && (
        <span className="ms-auto" data-graph-menu>
          <NodeMenu
            actions={actions}
            className={GRAPH_MENU_BUTTON_CLASS}
            dataTestId={`${dataTestId}-reference-menu-${node.id}`}
          />
        </span>
      )}
    </div>
  );
};
