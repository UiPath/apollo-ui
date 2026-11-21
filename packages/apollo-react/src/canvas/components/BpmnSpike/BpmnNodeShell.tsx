import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { cx } from '../../utils/CssUtil';
import { resolveNodeHandleAffordances, selectIsConnecting } from '../../utils/NodeUtils';
import { useBaseCanvasMode, useSelectionState } from '../BaseCanvas';
import { BaseContainer } from '../BaseNode/BaseNodeContainer';
import type { NodeOutlinePath } from '../BaseNode/BaseNodeOutline';
import { useInlineLabelEditing } from '../BaseNode/useInlineLabelEditing';
import { ButtonHandle, type HandleActionEvent } from '../ButtonHandle';
import { HandleHoverBridge } from '../ButtonHandle/HandleButton';
import { ResizeControls } from '../ContainerNode/ContainerNodeParts';
import { NodeToolbar } from '../Toolbar/NodeToolbar';
import type { ToolbarAction } from '../Toolbar/shared/toolbar.types';
import {
  type BpmnNodeData,
  handleId,
  useBpmnButtonReveal,
  useBpmnButtonShape,
  useBpmnSpikeActions,
} from './bpmnSpike.model';

const SIDES = [Position.Left, Position.Right, Position.Top, Position.Bottom];
// BPMN offers "+" on every side but the incoming one.
const DEFAULT_ADD_SIDES = [Position.Top, Position.Right, Position.Bottom];
const NO_SIDES: Position[] = [];
// The toolbar rests 12px off the node; the expanded top "+" reaches 20px (circle) or 30px
// (rounded) out, and the always-on button needs apollo's own unlabeled-button offset.
const TOOLBAR_OFFSET = { circle: 12, rounded: 26, always: 'button-only' } as const;
const noop = () => {};

export interface BpmnNodeShellProps {
  id: string;
  data: BpmnNodeData;
  selected?: boolean;
  dragging?: boolean;
  width: number;
  height: number;
  /** `false` renders `children` as the whole node, for elements with no card (pool, group). */
  frame?: boolean;
  shape?: 'circle' | 'square';
  radius?: string;
  outlinePath?: NodeOutlinePath;
  borderStyle?: 'solid' | 'dashed';
  isStacked?: boolean;
  connectable?: boolean;
  /** Sides whose source handle carries the "+" add button. */
  addSides?: Position[];
  toolbar?: ToolbarAction[];
  resizable?: boolean;
  /** Rendered beside the card instead of inside it: external labels, breakpoints. */
  outside?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * What every BPMN renderer shares, composed from apollo primitives: `BaseContainer` for the card
 * and its rest/hover/selected/status states, `ButtonHandle` for handles and the "+",
 * `resolveNodeHandleAffordances` for when they show, and `NodeToolbar` for actions.
 *
 * Nothing here reads a manifest or writes the xyflow store.
 */
export const BpmnNodeShell = memo(function BpmnNodeShell({
  id,
  data,
  selected = false,
  dragging = false,
  width,
  height,
  frame = true,
  shape = 'square',
  radius = '12px',
  outlinePath,
  borderStyle,
  isStacked,
  connectable = true,
  addSides = DEFAULT_ADD_SIDES,
  toolbar,
  resizable,
  outside,
  children,
}: BpmnNodeShellProps) {
  const [hovered, setHovered] = useState(false);
  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();
  const canEdit = useBaseCanvasMode().mode === 'design';
  const { addAfter } = useBpmnSpikeActions();
  const buttonReveal = useBpmnButtonReveal();
  const buttonShape = useBpmnButtonShape();

  const { shouldShowHandles, isAddButtonVisible } = resolveNodeHandleAffordances({
    isConnecting,
    selected,
    hovered,
    dragging,
    canEdit,
    multipleNodesSelected,
  });

  const onAdd = useCallback(
    (event: HandleActionEvent) => addAfter(event.nodeId, event.position),
    [addAfter]
  );

  const style = useMemo(
    () =>
      ({
        width,
        height,
        '--node-w': `${width}px`,
        '--node-h': `${height}px`,
        '--node-radius': radius,
      }) as React.CSSProperties,
    [width, height, radius]
  );

  const toolbarConfig = useMemo(
    () =>
      toolbar ? { actions: toolbar, position: 'top' as const, align: 'center' as const } : null,
    [toolbar]
  );

  const sidesWithAdd = canEdit ? addSides : NO_SIDES;

  return (
    <div
      className="relative"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {frame ? (
        <BaseContainer
          shape={shape}
          isSelected={selected}
          isHovered={hovered}
          isStacked={isStacked}
          interactionState={
            dragging ? 'drag' : selected ? 'selected' : hovered ? 'hover' : 'default'
          }
          executionStatus={data.executionStatus}
          validationStatus={data.validationStatus}
          suggestionType={data.modification}
          background={data.backgroundColor}
          outlinePath={outlinePath}
          borderStyle={borderStyle}
        >
          {children}
        </BaseContainer>
      ) : (
        children
      )}
      {outside}
      {data.breakpoint && (
        <span
          role="img"
          aria-label="Breakpoint"
          className="absolute -top-1.5 -left-1.5 z-10 size-2.5 rounded-full bg-error"
        />
      )}
      {toolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={toolbarConfig}
          expanded={selected || hovered}
          hidden={dragging || multipleNodesSelected}
          // Sits 8px above the expanded "+" on the top handle.
          offsetToolbar={
            isAddButtonVisible && sidesWithAdd.includes(Position.Top)
              ? TOOLBAR_OFFSET[buttonReveal === 'always' ? 'always' : buttonShape]
              : false
          }
        />
      )}
      {resizable && selected && canEdit && (
        <ResizeControls onResize={noop} onResizeStart={noop} onResizeEnd={noop} />
      )}
      {/* Keeps hover alive across the gap between the node and its "+" / toolbar. */}
      {connectable &&
        sidesWithAdd.map((side) => (
          <HandleHoverBridge key={`bridge-${side}`} position={side} visible={isAddButtonVisible} />
        ))}
      {connectable &&
        SIDES.map((side) => (
          <ButtonHandle
            key={`target-${side}`}
            id={handleId(id, 'target', side)}
            nodeId={id}
            type="target"
            position={side}
            handleType="input"
            visible={false}
            showNotches={false}
          />
        ))}
      {connectable &&
        SIDES.map((side) => (
          <ButtonHandle
            key={`source-${side}`}
            id={handleId(id, 'source', side)}
            nodeId={id}
            type="source"
            position={side}
            handleType="output"
            visible={shouldShowHandles}
            showButton={isAddButtonVisible && sidesWithAdd.includes(side)}
            selected={selected}
            hitArea="outer"
            buttonReveal={buttonReveal}
            buttonShape={buttonShape}
            onAction={sidesWithAdd.includes(side) ? onAdd : undefined}
          />
        ))}
    </div>
  );
});

const LABEL_PLACEMENT = {
  inside: 'flex w-full flex-1 items-center justify-center px-2 text-center',
  below:
    'absolute top-full left-1/2 z-10 mt-1 flex w-28 -translate-x-1/2 justify-center text-center',
  top: 'absolute inset-x-8 top-2 flex justify-center text-center',
  'top-left': 'absolute top-1.5 left-3 text-left',
  annotation: 'flex h-full w-full items-center pl-3 text-left',
  header: 'flex h-full w-full items-center justify-center [writing-mode:vertical-rl] rotate-180',
} as const;

/**
 * BPMN label built on apollo's `useInlineLabelEditing`. `NodeLabel` itself only lays out as
 * "beside the icon" or "below at 150% of the node's width", neither of which fits a 100x80 task
 * or a 36px event, so the hook is the reusable part.
 */
export const BpmnLabel = memo(function BpmnLabel({
  nodeId,
  label = '',
  placement,
  selected,
  dragging,
}: {
  nodeId: string;
  label?: string;
  placement: keyof typeof LABEL_PLACEMENT;
  selected?: boolean;
  dragging?: boolean;
}) {
  const { rename } = useBpmnSpikeActions();
  const readonly = useBaseCanvasMode().mode !== 'design';
  const onChange = useCallback(
    (values: { label: string }) => rename(nodeId, values.label),
    [nodeId, rename]
  );
  const edit = useInlineLabelEditing({
    label,
    subLabel: '',
    selected,
    dragging,
    readonly,
    onChange,
  });

  return (
    <div data-node-part="label" className={LABEL_PLACEMENT[placement]}>
      {edit.isEditing ? (
        <textarea
          ref={edit.labelInputRef}
          value={edit.localLabel}
          rows={1}
          aria-label="Edit label"
          onChange={(event) => edit.setLocalLabel(event.target.value)}
          onKeyDown={edit.handleKeyDown}
          onBlur={edit.handleBlur}
          className="nodrag nowheel field-sizing-content max-w-full resize-none rounded-sm border-none bg-transparent px-1 font-[inherit] text-xs leading-4 font-semibold text-foreground outline-1 outline-dashed outline-border-de-emp"
        />
      ) : (
        <div
          onDoubleClick={readonly ? undefined : edit.handleDoubleClick(edit.labelInputRef)}
          className={cx(
            'text-xs leading-4 font-semibold text-foreground',
            placement === 'header' ? 'whitespace-nowrap' : 'line-clamp-3 wrap-break-word'
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
});
