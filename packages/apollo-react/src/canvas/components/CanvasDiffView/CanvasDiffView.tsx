import {
  Button,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ToggleGroup,
  ToggleGroupItem,
} from '@uipath/apollo-wind';
import { Code2, Columns2, Rows2, Workflow } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import type {
  CanvasDiffViewOrientation,
  CanvasDiffViewProps,
  ChangeKind,
  DiffHighlight,
  DiffModel,
  DiffPaneContext,
  DiffSide,
  DiffSummary,
  DiffViewport,
} from './CanvasDiffView.types';

// Same tokens as the canvas suggestion borders: add = success, delete = error, update = warning.
const KIND_DOT_CLASS: Record<ChangeKind, string> = {
  added: 'bg-success',
  removed: 'bg-error',
  changed: 'bg-warning',
};

const noopViewportChange = () => {};

function viewportsEqual(a: DiffViewport | undefined, b: DiffViewport): boolean {
  return !!a && a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

/** Keeps the changes a side can show: removed only before, added only after, changed on both. */
function highlightForSide(highlight: DiffHighlight, side: DiffSide): DiffHighlight {
  const hidden: ChangeKind = side === 'before' ? 'added' : 'removed';
  const keep = (kinds: Map<string, ChangeKind>) =>
    new Map([...kinds].filter(([, kind]) => kind !== hidden));
  return { nodeKind: keep(highlight.nodeKind), edgeKind: keep(highlight.edgeKind) };
}

interface SummaryItem {
  key: keyof DiffSummary;
  kind: ChangeKind;
  label: string;
}

/** The non-zero counts of a summary as localized labels, e.g. "2 nodes added". */
function useSummaryItems(summary: DiffSummary): SummaryItem[] {
  const { _ } = useSafeLingui();
  return useMemo(() => {
    const items: SummaryItem[] = [
      {
        key: 'addedNodes',
        kind: 'added',
        label: _({
          id: 'canvas.diff_view.added_nodes',
          message: '{count, plural, one {# node added} other {# nodes added}}',
          values: { count: summary.addedNodes },
        }),
      },
      {
        key: 'removedNodes',
        kind: 'removed',
        label: _({
          id: 'canvas.diff_view.removed_nodes',
          message: '{count, plural, one {# node removed} other {# nodes removed}}',
          values: { count: summary.removedNodes },
        }),
      },
      {
        key: 'changedNodes',
        kind: 'changed',
        label: _({
          id: 'canvas.diff_view.changed_nodes',
          message: '{count, plural, one {# node changed} other {# nodes changed}}',
          values: { count: summary.changedNodes },
        }),
      },
      {
        key: 'addedEdges',
        kind: 'added',
        label: _({
          id: 'canvas.diff_view.added_edges',
          message: '{count, plural, one {# connection added} other {# connections added}}',
          values: { count: summary.addedEdges },
        }),
      },
      {
        key: 'removedEdges',
        kind: 'removed',
        label: _({
          id: 'canvas.diff_view.removed_edges',
          message: '{count, plural, one {# connection removed} other {# connections removed}}',
          values: { count: summary.removedEdges },
        }),
      },
      {
        key: 'changedEdges',
        kind: 'changed',
        label: _({
          id: 'canvas.diff_view.changed_edges',
          message: '{count, plural, one {# connection changed} other {# connections changed}}',
          values: { count: summary.changedEdges },
        }),
      },
    ];
    return items.filter((item) => summary[item.key] > 0);
  }, [_, summary]);
}

function formatList(items: string[], locale: string): string {
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

interface SummaryRowProps {
  /** List name for screen readers; also shown before the counts when `showLabel` is set. */
  label: string;
  showLabel?: boolean;
  summary: DiffSummary;
  phaseId?: string;
}

/** One row of change counts: the whole diff, or one phase of it. */
function SummaryRow({ label, showLabel, summary, phaseId }: SummaryRowProps) {
  const { _ } = useSafeLingui();
  const items = useSummaryItems(summary);
  return (
    <div data-change-phase={phaseId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {showLabel && <span className="font-medium text-foreground">{label}</span>}
      <ul aria-label={label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {items.length === 0 ? (
          <li>{_({ id: 'canvas.diff_view.no_changes', message: 'No changes' })}</li>
        ) : (
          items.map((item) => (
            <li
              key={item.key}
              data-change-kind={item.kind}
              className="inline-flex items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className={cn('inline-block size-2 rounded-full', KIND_DOT_CLASS[item.kind])}
              />
              {item.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

interface DiffPaneProps<Node, Edge> {
  ctx: DiffPaneContext<Node, Edge>;
  label: string;
  renderPane: CanvasDiffViewProps<Node, Edge>['renderPane'];
  panelSlot: CanvasDiffViewProps<Node, Edge>['panelSlot'];
}

function DiffPane<Node, Edge>({ ctx, label, renderPane, panelSlot }: DiffPaneProps<Node, Edge>) {
  const panel = panelSlot?.(ctx);
  return (
    <section
      aria-label={label}
      data-diff-side={ctx.side}
      className="relative flex h-full min-h-0 w-full"
    >
      <div className="relative h-full min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-2 z-10 rounded bg-surface-raised px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
          {label}
        </span>
        {renderPane(ctx)}
      </div>
      {panel != null && panel !== false && (
        <div className="h-full shrink-0 overflow-auto border-l border-border-subtle">{panel}</div>
      )}
    </section>
  );
}

/**
 * Selection and shared viewport for one review. Both reset when `model` changes, and the
 * returned `reviewKey` changes too so the panes remount and fit the new graphs.
 */
function useReviewState<Node, Edge>(model: DiffModel<Node, Edge>) {
  const [review, setReview] = useState({ model, key: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [viewport, setViewport] = useState<DiffViewport | undefined>();

  if (review.model !== model) {
    setReview({ model, key: review.key + 1 });
    setSelectedNodeId(undefined);
    setViewport(undefined);
  }

  const onViewportChange = useCallback((next: DiffViewport) => {
    setViewport((prev) => (viewportsEqual(prev, next) ? prev : next));
  }, []);

  return { reviewKey: review.key, selectedNodeId, setSelectedNodeId, viewport, onViewportChange };
}

/**
 * Before/after review of a graph change. The host supplies the model and renders each pane
 * through `renderPane`; the view owns the layout, header, change summary, shared selection
 * and shared viewport.
 */
export function CanvasDiffView<Node, Edge>({
  model,
  renderPane,
  panelSlot,
  codeView,
  headerActions,
  title,
  headingLevel = 2,
  onKeep,
  onRevert,
  keepLabel,
  revertLabel,
  showBefore = true,
  orientation: orientationProp,
  onOrientationChange,
  selection,
  syncViewport = true,
  className,
}: CanvasDiffViewProps<Node, Edge>) {
  const { _, locale } = useSafeLingui();

  const [internalOrientation, setInternalOrientation] =
    useState<CanvasDiffViewOrientation>('vertical');
  const orientation = orientationProp ?? internalOrientation;
  const toggleOrientation = useCallback(() => {
    const next = orientation === 'vertical' ? 'horizontal' : 'vertical';
    if (orientationProp === undefined) setInternalOrientation(next);
    onOrientationChange?.(next);
  }, [orientation, orientationProp, onOrientationChange]);

  const review = useReviewState(model);
  const selectedNodeId = selection ? selection.selectedNodeId : review.selectedNodeId;
  const onSelectNode = selection?.onChange ?? review.setSelectedNodeId;
  const viewport = syncViewport ? review.viewport : undefined;
  const onViewportChange = syncViewport ? review.onViewportChange : noopViewportChange;

  const [view, setView] = useState<'visual' | 'code'>('visual');
  const showCode = codeView !== undefined && view === 'code';

  const overallItems = useSummaryItems(model.summary);
  const announcement =
    overallItems.length > 0
      ? formatList(
          overallItems.map((item) => item.label),
          locale
        )
      : _({ id: 'canvas.diff_view.no_changes', message: 'No changes' });

  // Side projections depend on the model only, so panning and selecting keep their identities.
  const projections = useMemo(() => {
    const project = (side: DiffSide) => ({
      highlight: highlightForSide(model.highlight, side),
      changePhases: model.changePhases?.map((phase) => ({
        ...phase,
        highlight: highlightForSide(phase.highlight, side),
      })),
    });
    return { before: project('before'), after: project('after') };
  }, [model]);

  // The after pane fits and leads the shared viewport, unless it is empty and before is not.
  const fitLeader: DiffSide =
    model.after.nodes.length === 0 && model.before.nodes.length > 0 ? 'before' : 'after';

  const buildContext = useCallback(
    (side: DiffSide): DiffPaneContext<Node, Edge> => ({
      side,
      nodes: model[side].nodes,
      edges: model[side].edges,
      data: model[side].data,
      highlight: projections[side].highlight,
      changePhases: projections[side].changePhases,
      selectedNodeId,
      onSelectNode,
      viewport,
      onViewportChange,
      fitViewOnMount: viewport === undefined && (side === fitLeader || !syncViewport),
    }),
    [
      model,
      projections,
      selectedNodeId,
      onSelectNode,
      viewport,
      onViewportChange,
      syncViewport,
      fitLeader,
    ]
  );
  const beforeContext = useMemo(() => buildContext('before'), [buildContext]);
  const afterContext = useMemo(() => buildContext('after'), [buildContext]);

  const beforeLabel = _({ id: 'canvas.diff_view.before_label', message: 'Before' });
  const afterLabel = _({ id: 'canvas.diff_view.after_label', message: 'After' });
  const summaryLabel = _({ id: 'canvas.diff_view.summary_label', message: 'Change summary' });
  const orientationLabel =
    orientation === 'vertical'
      ? _({ id: 'canvas.diff_view.show_side_by_side', message: 'Show side by side' })
      : _({ id: 'canvas.diff_view.show_stacked', message: 'Show stacked' });
  const visualViewLabel = _({ id: 'canvas.diff_view.visual_view', message: 'Visual diff' });
  const codeViewLabel = _({ id: 'canvas.diff_view.code_view', message: 'Code diff' });
  const Heading = `h${headingLevel}` as const;

  let body: ReactNode;
  if (showCode) {
    body = codeView;
  } else if (!showBefore) {
    body = (
      <DiffPane
        key={review.reviewKey}
        ctx={afterContext}
        label={afterLabel}
        renderPane={renderPane}
        panelSlot={panelSlot}
      />
    );
  } else {
    body = (
      <ResizablePanelGroup key={review.reviewKey} orientation={orientation}>
        <ResizablePanel id="canvas-diff-before" defaultSize="50%" minSize="20%">
          <DiffPane
            ctx={beforeContext}
            label={beforeLabel}
            renderPane={renderPane}
            panelSlot={panelSlot}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="canvas-diff-after" defaultSize="50%" minSize="20%">
          <DiffPane
            ctx={afterContext}
            label={afterLabel}
            renderPane={renderPane}
            panelSlot={panelSlot}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <div
      data-testid="canvas-diff-view"
      data-orientation={orientation}
      className={cn('flex h-full w-full flex-col bg-surface text-foreground', className)}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <Heading className="shrink-0 text-sm font-semibold">
            {title ?? _({ id: 'canvas.diff_view.title', message: 'Proposed changes' })}
          </Heading>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
            {model.changePhases && model.changePhases.length > 0 ? (
              model.changePhases.map((phase) => (
                <SummaryRow
                  key={phase.id}
                  phaseId={phase.id}
                  label={phase.label}
                  showLabel
                  summary={phase.summary}
                />
              ))
            ) : (
              <SummaryRow label={summaryLabel} summary={model.summary} />
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {codeView !== undefined && (
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={view}
              onValueChange={(next) => next && setView(next as 'visual' | 'code')}
              aria-label={_({ id: 'canvas.diff_view.view_toggle', message: 'Diff view' })}
            >
              <ToggleGroupItem value="visual" aria-label={visualViewLabel} title={visualViewLabel}>
                <Workflow className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="code" aria-label={codeViewLabel} title={codeViewLabel}>
                <Code2 className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {showBefore && !showCode && (
            <Button
              variant="ghost"
              size="xs"
              icon
              onClick={toggleOrientation}
              aria-label={orientationLabel}
              title={orientationLabel}
            >
              {orientation === 'vertical' ? <Columns2 /> : <Rows2 />}
            </Button>
          )}
          {headerActions}
          {onRevert && (
            <Button variant="outline" size="xs" onClick={onRevert}>
              {revertLabel ?? _({ id: 'canvas.diff_view.revert', message: 'Revert' })}
            </Button>
          )}
          {onKeep && (
            <Button size="xs" onClick={onKeep}>
              {keepLabel ?? _({ id: 'canvas.diff_view.keep', message: 'Keep' })}
            </Button>
          )}
        </div>
      </header>
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
      <div className="relative min-h-0 flex-1">{body}</div>
    </div>
  );
}
