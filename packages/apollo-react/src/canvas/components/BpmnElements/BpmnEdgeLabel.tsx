import {
  EdgeLabelRenderer,
  useReactFlow,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useRef, useState } from 'react';
import { useInlineLabelEditing } from '../BaseNode/useInlineLabelEditing';
import { EDGE_LABEL_BASE_CLASS } from '../Edges/shared/primitives/EdgeLabel';
import type { Point } from '../Edges/shared/types';
import { useBpmnStrings } from './bpmn.model';

/** `origin` is the label centre shown when the drag began, which can be ahead of the host's. */
type Drag = { start: Point; origin: Point; moved: boolean };
/** Where the label was dropped, kept until the host moves the label point. */
type Dropped = { from: Point; at: Point };

/**
 * apollo's `EdgeLabel` with what a BPMN host can opt into: inline renaming on double-click, a
 * placeholder for a flow with no label, and dragging the label off the path.
 */
export const BpmnEdgeLabel = memo(function BpmnEdgeLabel({
  edgeId,
  x,
  y,
  text = '',
  borderColor,
  selected,
  zIndex,
  onRename,
  onMove,
  onMouseEnter,
  onMouseLeave,
}: {
  edgeId: string;
  x: number;
  y: number;
  text?: string;
  borderColor: string;
  selected?: boolean;
  /** Lifts the label over nodes in a canvas that stacks nodes and edges together. */
  zIndex?: number;
  onRename?: (edgeId: string, label: string) => void;
  /** Called on drag end with the label's centre in flow coordinates. */
  onMove?: (edgeId: string, position: Point) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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

  const drag = useRef<Drag | null>(null);
  const [dropped, setDropped] = useState<Dropped | null>(null);
  // The host moved the label, so the drop is spent: coming back to that point (an undo) must
  // not revive it.
  if (dropped && (dropped.from.x !== x || dropped.from.y !== y)) setDropped(null);
  const at = dropped?.at ?? { x, y };
  const draggable = !!onMove && !!selected && !edit.isEditing;

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

  return (
    <EdgeLabelRenderer>
      <div
        data-bpmn-edge-label={edgeId}
        data-id={edgeId}
        className={EDGE_LABEL_BASE_CLASS}
        style={{
          transform: `translate(-50%, -50%) translate(${at.x}px, ${at.y}px)`,
          borderColor,
          zIndex,
          cursor: draggable ? 'move' : undefined,
          color: text || edit.isEditing ? undefined : 'var(--foreground-muted)',
        }}
        // The label sits outside the edge's own element, so a click selects the flow here.
        onClick={() => {
          const { elementsSelectable, addSelectedEdges } = store.getState();
          if (elementsSelectable && !selected) addSelectedEdges([edgeId]);
        }}
        onDoubleClick={onRename ? edit.handleDoubleClick(edit.labelInputRef) : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setDropped(null);
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
    </EdgeLabelRenderer>
  );
});
