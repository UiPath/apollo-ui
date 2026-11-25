import {
  EdgeLabelRenderer,
  useReactFlow,
  useStoreApi,
  ViewportPortal,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useInlineLabelEditing } from '../BaseNode/useInlineLabelEditing';
import { CanvasTooltip } from '../CanvasTooltip';
import type { Point } from '../Edges/shared/types';
import { useBpmnStrings } from './bpmn.model';

/** `origin` is the label centre shown when the drag began, which can be ahead of the host's. */
type Drag = { start: Point; origin: Point; moved: boolean };
/** Where the label was dropped, kept until the host moves the label point. */
type Dropped = { from: Point; at: Point };

// A pill over the flow it names: translucent so the path reads through it, with a quiet
// border that the selection tints.
const LABEL_CLASS =
  'react-flow__edge-label nodrag nopan absolute top-0 left-0 max-w-48 overflow-hidden text-ellipsis ' +
  'whitespace-nowrap pointer-events-auto cursor-pointer px-2.5 py-0.5 rounded-md text-xs font-medium ' +
  'border backdrop-blur-sm transition-colors ' +
  'bg-[color-mix(in_srgb,var(--canvas-background,var(--color-background))_80%,transparent)]';
const LABEL_SET_CLASS =
  'text-(--canvas-foreground) border-(--canvas-border-de-emp) shadow-[0_1px_2px_0_rgba(0,0,0,0.06)]';
// Nothing to read yet, so it recedes: dashed, muted, no shadow.
const LABEL_UNSET_CLASS =
  'text-(--canvas-foreground-de-emp) border-dashed border-(--canvas-border) italic font-normal';
const LABEL_SELECTED_CLASS = 'border-(--canvas-primary)';
const LABEL_DIMMED_CLASS = 'pointer-events-none opacity-30';

// Screen pixels a press must travel before it drags the label.
const DRAG_THRESHOLD_PX = 3;

/** xyflow listens on the focused edge for Escape to deselect it. */
const focusEdge = (flow: HTMLElement | null, edgeId: string) =>
  flow
    ?.querySelector<SVGElement>(`.react-flow__edge[data-id="${CSS.escape(edgeId)}"]`)
    ?.focus({ preventScroll: true });

/**
 * apollo's `EdgeLabel` restyled as a pill, with what a BPMN host can opt into: inline renaming
 * on double-click, a placeholder for a flow with no label, and dragging the label off the path.
 */
export const BpmnEdgeLabel = memo(function BpmnEdgeLabel({
  edgeId,
  x,
  y,
  text = '',
  borderColor,
  selected,
  zIndex,
  dimmed,
  onRename,
  onMove,
}: {
  edgeId: string;
  x: number;
  y: number;
  text?: string;
  /** Overrides the muted and selected border, for a flow whose status colours it. */
  borderColor?: string;
  selected?: boolean;
  /**
   * For a canvas that stacks nodes and edges together. The label then leaves xyflow's label
   * layer, whose own z-index would cap it below a lifted flow, and takes this one.
   */
  zIndex?: number;
  /** Fades the label and takes it off the pointer. */
  dimmed?: boolean;
  onRename?: (edgeId: string, label: string) => void;
  /** Called on drag end with the label's centre in flow coordinates. */
  onMove?: (edgeId: string, position: Point) => void;
}) {
  const strings = useBpmnStrings();
  const { screenToFlowPosition } = useReactFlow();
  const store = useStoreApi();

  const onChange = useCallback(
    (values: { label: string }) => onRename?.(edgeId, values.label),
    [edgeId, onRename]
  );
  // Blur ends the edit, so deselecting the flow does not have to.
  const edit = useInlineLabelEditing({ label: text, subLabel: '', selected: true, onChange });
  // The hook reads focus leaving for nowhere as a move to its sub-label input, which is not
  // mounted here. Name the document so the blur commits.
  const { handleBlur } = edit;
  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) =>
      handleBlur(
        event.relatedTarget
          ? event
          : { ...event, relatedTarget: event.currentTarget.ownerDocument.body }
      ),
    [handleBlur]
  );

  // An edit that ends with focus nowhere hands it back to the flow, so Escape still deselects.
  const wasEditing = useRef(false);
  useEffect(() => {
    const ended = wasEditing.current && !edit.isEditing;
    wasEditing.current = edit.isEditing;
    if (!ended || !selected) return;
    const { domNode } = store.getState();
    const active = domNode?.ownerDocument.activeElement;
    if (!active || active === domNode?.ownerDocument.body) focusEdge(domNode, edgeId);
  }, [edit.isEditing, selected, store, edgeId]);

  const drag = useRef<Drag | null>(null);
  const [dropped, setDropped] = useState<Dropped | null>(null);
  // The host moved the label, so the drop is spent: coming back to that point (an undo) must
  // not revive it.
  if (dropped && (dropped.from.x !== x || dropped.from.y !== y)) setDropped(null);
  const at = dropped?.at ?? { x, y };
  const draggable = !!onMove && !!selected && !edit.isEditing;
  const unset = !text && !edit.isEditing;

  const positionFor = (event: React.PointerEvent, { start, origin }: Drag): Point => {
    const from = screenToFlowPosition(start, { snapToGrid: false });
    const to = screenToFlowPosition({ x: event.clientX, y: event.clientY }, { snapToGrid: false });
    return { x: origin.x + to.x - from.x, y: origin.y + to.y - from.y };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.button !== 0) return;
    drag.current = { start: { x: event.clientX, y: event.clientY }, origin: at, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    // A click's jitter is not a move, or it would pin the label off the path's midpoint.
    if (
      !drag.current.moved &&
      Math.hypot(event.clientX - drag.current.start.x, event.clientY - drag.current.start.y) <
        DRAG_THRESHOLD_PX
    )
      return;
    drag.current.moved = true;
    setDropped({ from: { x, y }, at: positionFor(event, drag.current) });
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const ended = drag.current;
    drag.current = null;
    if (!ended?.moved) return;
    const position = positionFor(event, ended);
    setDropped({ from: { x, y }, at: position });
    onMove?.(edgeId, position);
  };

  const Layer = zIndex === undefined ? EdgeLabelRenderer : ViewportPortal;
  return (
    <Layer>
      <CanvasTooltip
        content={edit.isEditing ? undefined : text}
        smartTooltip
        delay
        disableHoverableContent
      >
        <div
          data-bpmn-edge-label={edgeId}
          data-id={edgeId}
          data-placeholder={unset || undefined}
          data-dimmed={dimmed || undefined}
          className={cn(
            LABEL_CLASS,
            unset ? LABEL_UNSET_CLASS : LABEL_SET_CLASS,
            selected && LABEL_SELECTED_CLASS,
            // Move while it can be dragged, else the pointer of a click that selects. The text
            // cursor belongs to the textarea alone.
            draggable && 'cursor-move',
            edit.isEditing && 'cursor-default',
            dimmed && LABEL_DIMMED_CLASS
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${at.x}px, ${at.y}px)`,
            // A status colour still shows; the default is the muted border, primary when selected.
            borderColor,
            zIndex,
          }}
          // The label sits outside the edge's own element, so a click selects the flow here. It
          // also takes focus to the edge, where xyflow listens for Escape to deselect.
          onClick={() => {
            // A click in the editor places the caret; taking focus to the edge would commit.
            if (edit.isEditing) return;
            const { elementsSelectable, addSelectedEdges, domNode } = store.getState();
            if (!elementsSelectable) return;
            if (!selected) addSelectedEdges([edgeId]);
            focusEdge(domNode, edgeId);
          }}
          // While editing, a double-click selects a word instead of restarting from the stored text.
          onDoubleClick={
            onRename && !edit.isEditing ? edit.handleDoubleClick(edit.labelInputRef) : undefined
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setDropped(null);
          }}
        >
          {edit.isEditing ? (
            <textarea
              ref={edit.labelInputRef}
              value={edit.localLabel}
              rows={1}
              aria-label={strings.editLabel}
              onChange={(event) => edit.setLocalLabel(event.target.value)}
              onKeyDown={edit.handleKeyDown}
              onBlur={onBlur}
              // A host's edge menu stays closed during an edit; the browser's own still opens.
              onContextMenu={(event) => event.stopPropagation()}
              className="nowheel field-sizing-content block max-w-full min-w-8 resize-none border-none bg-transparent p-0 font-[inherit] text-inherit outline-none"
            />
          ) : (
            text || strings.edgeLabelPlaceholder
          )}
        </div>
      </CanvasTooltip>
    </Layer>
  );
});
