import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type {
  HandleConfigurationSpecificPosition,
  HandleLabelVisibility,
} from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { cx } from '../../utils/CssUtil';
import { calculateGridAlignedHandlePositions } from '../../utils/handle-positioning';
import {
  getHandleActionPortal,
  getInwardHandleLayout,
  type InwardHandleLayout,
} from './ButtonHandleLayoutUtils';
import { pixelToPercent } from './ButtonHandleStyleUtils';
import { HandleButton, HandleHoverBridge } from './HandleButton';
import { HandleLabel } from './HandleLabel';
import { HandleNotch, type HandleType } from './HandleNotch';
import { useButtonHandleSizeAndPosition } from './useButtonHandleSizeAndPosition';

export interface HandleActionEvent {
  handleId: string;
  nodeId: string;
  handleType: HandleType;
  position: Position;
  originalEvent: React.MouseEvent;
}

/** Payload passed to `onMouseEnter` / `onMouseLeave` handlers on a button handle. */
export interface HandleMouseEvent {
  handleId: string;
  nodeId: string;
  handleType: HandleType;
  position: Position;
}

type ButtonHandleProps = {
  id: string;
  nodeId: string;
  type: 'source' | 'target';
  position: Position;
  // Defaults to `position`. Loop/container handles can render on one side while
  // React Flow anchors the edge on another side.
  connectionPosition?: Position;
  handleType: HandleType;
  label?: string;
  labelIcon?: React.ReactNode;
  labelBackgroundColor?: string;
  visible?: boolean;
  /** Whether the label is shown. Defaults to `visible` when omitted. */
  labelVisible?: boolean;
  /** When the label is shown. `hover` keeps the add button mounted so the label never reflows. */
  labelVisibility?: HandleLabelVisibility;
  showButton?: boolean;
  selected?: boolean;
  index?: number; // 0-based index of this handle on the edge
  total?: number; // Total number of handles on this edge
  onAction?: (event: HandleActionEvent) => void;
  onMouseEnter?: (event: HandleMouseEvent) => void;
  onMouseLeave?: (event: HandleMouseEvent) => void;
  showNotches?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  nodeWidth?: number;
  nodeHeight?: number;
  portalAction?: boolean;
  /** Explicit pixel position along the wall. Bypasses the slot distribution (e.g. a user-dragged handle). */
  offsetPx?: number;
  /** When set, the inward label pill becomes a drag grip and fires this on pointer down. */
  onLabelPointerDown?: (event: React.PointerEvent) => void;
};

const ButtonHandleBase = ({
  id,
  nodeId,
  type,
  position,
  connectionPosition = position,
  handleType,
  label,
  labelIcon,
  labelBackgroundColor,
  visible = true,
  labelVisible,
  labelVisibility,
  showButton = true,
  selected = false,
  index = 0,
  total = 1,
  onAction,
  onMouseEnter,
  onMouseLeave,
  showNotches = true,
  customPositionAndOffsets,
  nodeWidth,
  nodeHeight,
  portalAction = false,
  offsetPx,
  onLabelPointerDown,
}: ButtonHandleProps) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isVertical = position === Position.Top || position === Position.Bottom;

  const dispatchMouseEvent = useCallback(
    (
      eventName: 'handle:mouseenter' | 'handle:mouseleave',
      handler: ((event: HandleMouseEvent) => void) | undefined
    ) => {
      const payload: HandleMouseEvent = {
        handleId: id,
        nodeId,
        handleType,
        position: connectionPosition,
      };
      handler?.(payload);
      canvasEventBus.emit(eventName, payload);
    },
    [id, nodeId, handleType, connectionPosition]
  );

  const handleButtonMouseEnter = useCallback(
    () => dispatchMouseEvent('handle:mouseenter', onMouseEnter),
    [dispatchMouseEvent, onMouseEnter]
  );

  const handleButtonMouseLeave = useCallback(
    () => dispatchMouseEvent('handle:mouseleave', onMouseLeave),
    [dispatchMouseEvent, onMouseLeave]
  );

  // Calculate position along the edge for multiple handles
  // Use grid-aligned positions when node dimensions are available
  const positionPercent = useMemo(() => {
    // Determine which dimension to use based on handle position
    const relevantSize = isVertical ? nodeWidth : nodeHeight;

    // An explicit pixel offset (e.g. a user-dragged lifecycle handle) bypasses
    // the slot distribution entirely.
    if (offsetPx != null && relevantSize && relevantSize > 0) {
      return pixelToPercent(Math.min(Math.max(offsetPx, 0), relevantSize), relevantSize);
    }

    // If node size is available, use grid-aligned positioning
    if (relevantSize && relevantSize > 0) {
      const gridPositions = calculateGridAlignedHandlePositions(relevantSize, total);
      const pixelPosition = gridPositions[index] ?? relevantSize / 2;
      return pixelToPercent(pixelPosition, relevantSize);
    }

    // Fallback to percentage-based positioning
    return ((index + 1) / (total + 1)) * 100;
  }, [index, total, isVertical, nodeWidth, nodeHeight, offsetPx]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      const actionEvent: HandleActionEvent = {
        handleId: id,
        nodeId,
        handleType,
        position: connectionPosition,
        originalEvent: event,
      };

      // Call direct callback first for immediate response
      onAction?.(actionEvent);

      // Emit to event bus for global listeners
      canvasEventBus.emit('handle:action', {
        handleId: id,
        nodeId,
        handleType,
        position: connectionPosition,
        // timestamp: Date.now(), // Optional - uncomment if you need timing info
      });
    },
    [connectionPosition, id, nodeId, handleType, onAction]
  );

  const markAsHovered = useCallback(() => setIsHovered(true), []);
  const unmarkAsHovered = useCallback(() => setIsHovered(false), []);
  const showActionButton = !!onAction && type === 'source';

  // Label visibility defaults to the handle's own visibility (current behavior).
  const resolvedLabelVisible = labelVisible ?? visible;
  // When the label is hover-gated, keep the add button mounted (opacity-toggled)
  // so the flex stack never reflows and the label doesn't jump as the button appears.
  const keepButtonMounted = labelVisibility === 'hover';

  const {
    width: handleWidth,
    height: handleHeight,
    top,
    bottom,
    left,
    right,
    transform,
  } = useButtonHandleSizeAndPosition({
    position,
    positionPercent,
    numHandles: total,
    customPositionAndOffsets,
  });

  if (connectionPosition !== position) {
    const layout = getInwardHandleLayout(position, handleType);

    return (
      <div
        className={cx(
          'absolute flex overflow-visible',
          visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{
          top,
          bottom,
          left,
          right,
          transform: layout.rootTransform,
        }}
        onMouseEnter={markAsHovered}
        onMouseLeave={unmarkAsHovered}
        onMouseDown={unmarkAsHovered}
      >
        <InwardHandleContent
          handleType={handleType}
          isVertical={isVertical}
          selected={selected}
          hovered={isHovered}
          showNotch={showNotches}
          label={label}
          labelIcon={labelIcon}
          labelBackgroundColor={labelBackgroundColor}
          labelVisible={resolvedLabelVisible}
          layout={layout}
          onLabelPointerDown={onLabelPointerDown}
        />
        <Handle
          ref={handleRef}
          type={type}
          position={connectionPosition}
          id={id}
          onMouseEnter={markAsHovered}
          onMouseLeave={unmarkAsHovered}
          onMouseDown={unmarkAsHovered}
          className={cx(
            'absolute! z-20 flex! items-center! justify-center! overflow-visible! border-0! rounded-none! bg-transparent!',
            visible
              ? 'cursor-crosshair! pointer-events-auto! opacity-100'
              : 'cursor-default! pointer-events-none! opacity-0'
          )}
          style={layout.anchorStyle}
        />
        {showActionButton ? (
          <HandleButton
            visible={showButton}
            labelVisible={resolvedLabelVisible}
            keepButtonMounted={keepButtonMounted}
            position={connectionPosition}
            onAction={handleButtonClick}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            handleRef={handleRef}
          />
        ) : null}
      </div>
    );
  }

  const portal =
    showActionButton && portalAction && !customPositionAndOffsets
      ? getHandleActionPortal({
          nodeId,
          position,
          positionPercent,
          total,
          nodeWidth,
          nodeHeight,
        })
      : undefined;

  return (
    <Handle
      ref={handleRef}
      type={type}
      position={position}
      id={id}
      onMouseEnter={markAsHovered}
      onMouseLeave={unmarkAsHovered}
      onMouseDown={unmarkAsHovered}
      className={cx(
        'flex! items-center! justify-center! border-0! rounded-none! bg-transparent!',
        visible
          ? 'cursor-crosshair! pointer-events-auto! opacity-100'
          : 'cursor-default! pointer-events-none! opacity-0'
      )}
      style={{
        width: handleWidth,
        height: handleHeight,
        top,
        bottom,
        left,
        right,
        transform,
      }}
    >
      <HandleNotch
        handleType={handleType}
        isVertical={isVertical}
        selected={selected}
        hovered={isHovered}
        showNotch={showNotches}
      />
      {showActionButton ? (
        <HandleButton
          visible={showButton}
          labelVisible={resolvedLabelVisible}
          keepButtonMounted={keepButtonMounted}
          position={position}
          onAction={handleButtonClick}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          handleRef={handleRef}
          label={label}
          labelIcon={labelIcon}
          labelBackgroundColor={labelBackgroundColor}
          portal={portal}
        />
      ) : (
        label && (
          <HandleLabel
            position={position}
            backgroundColor={labelBackgroundColor}
            label={label}
            labelIcon={labelIcon}
            visible={resolvedLabelVisible}
          />
        )
      )}
    </Handle>
  );
};

export const ButtonHandle = memo(ButtonHandleBase);

function InwardHandleContent({
  handleType,
  isVertical,
  selected,
  hovered,
  showNotch,
  label,
  labelIcon,
  labelBackgroundColor,
  labelVisible = true,
  layout,
  onLabelPointerDown,
}: {
  handleType: HandleType;
  isVertical: boolean;
  selected: boolean;
  hovered: boolean;
  showNotch?: boolean;
  label?: string;
  labelIcon?: React.ReactNode;
  labelBackgroundColor?: string;
  labelVisible?: boolean;
  layout: InwardHandleLayout;
  onLabelPointerDown?: (event: React.PointerEvent) => void;
}) {
  const isDraggableGrip = !!onLabelPointerDown;
  const labelElement = label ? (
    <div
      aria-hidden={labelVisible ? undefined : true}
      className={cx(
        'flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5',
        'text-xs font-medium leading-4 text-foreground-muted transition-opacity duration-250',
        labelVisible ? 'opacity-100' : 'opacity-0',
        // The pill doubles as the drag grip for movable handles. nodrag/nopan
        // keep React Flow from starting a node drag or canvas pan underneath.
        isDraggableGrip && labelVisible
          ? 'nodrag nopan pointer-events-auto cursor-grab select-none active:cursor-grabbing'
          : 'pointer-events-none'
      )}
      style={labelBackgroundColor ? { backgroundColor: labelBackgroundColor } : undefined}
      onPointerDown={isDraggableGrip && labelVisible ? onLabelPointerDown : undefined}
    >
      {labelIcon}
      <span>{label}</span>
    </div>
  ) : null;
  const notchElement = (
    <span className="relative z-10 flex shrink-0" style={layout.notchStyle}>
      <HandleNotch
        handleType={handleType}
        isVertical={isVertical}
        selected={selected}
        hovered={hovered}
        showNotch={showNotch}
      />
    </span>
  );

  return (
    <div className={cx('flex items-center', layout.contentDirectionClassName)}>
      {labelElement}
      {notchElement}
    </div>
  );
}

export interface ButtonHandleConfig {
  /** Is of type string but `ButtonHandleId` should be used for reserved ids */
  id: string;
  type: 'source' | 'target';
  handleType: HandleType;
  label?: string;
  labelIcon?: React.ReactNode;
  showButton?: boolean;
  labelBackgroundColor?: string;
  /** When the handle's label is shown. Defaults to `always`. */
  labelVisibility?: HandleLabelVisibility;
  /** Config-level visibility — controls whether the handle is rendered at all. */
  visible?: boolean;
  /** Runtime visibility — controls opacity (e.g. connected handles stay visible). */
  showHandle?: boolean;
  onAction?: (event: HandleActionEvent) => void;
  onMouseEnter?: (event: HandleMouseEvent) => void;
  onMouseLeave?: (event: HandleMouseEvent) => void;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  /** Explicit pixel position along the wall. Bypasses the slot distribution. */
  offsetPx?: number;
  /** When set, the inward label pill becomes a drag grip and fires this on pointer down. */
  onLabelPointerDown?: (event: React.PointerEvent) => void;
}

const ButtonHandlesBase = ({
  nodeId,
  handles,
  position,
  connectionPosition = position,
  selected = false,
  hovered = false,
  visible = true,
  showAddButton = true,
  showNotches = true,
  customPositionAndOffsets,
  shouldShowAddButtonFn = ({ showAddButton, selected, hovered }) =>
    showAddButton && (selected || hovered),
  nodeWidth,
  nodeHeight,
  portalActions = false,
  slotCount,
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  connectionPosition?: Position;
  selected?: boolean;
  hovered?: boolean;
  visible?: boolean;
  showAddButton?: boolean;
  showNotches?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  nodeWidth?: number;
  nodeHeight?: number;
  /** Render source handle affordances (button and label) in the node overlay layer. */
  portalActions?: boolean;

  /**
   * Lay the group out as if it had this many handle slots (>= the visible
   * handle count; ignored otherwise). Handles fill slots from the first, so a
   * group with fewer handles can align with a fuller group on the opposite wall.
   */
  slotCount?: number;

  /**
   * Allows for consumers to control the predicate for showing the add button from the props that's passed in
   *
   * Defaults to:
   * ```ts
   * ({ showAddButton, selected, hovered }) => showAddButton && (selected || hovered)
   * ```
   */
  shouldShowAddButtonFn?: ({
    showAddButton,
    selected,
    hovered,
  }: {
    showAddButton: boolean;
    selected: boolean;
    hovered: boolean;
  }) => boolean;
}) => {
  const finalSelected = shouldShowAddButtonFn({ showAddButton, selected, hovered });

  // Only render handles whose config marks them as visible.
  // Handles with visible: false are excluded from the DOM entirely —
  // group-level visibility (hover/selection state) is handled via opacity.
  const visibleHandles = handles.filter((h) => h.visible ?? true);

  const layoutSlotCount =
    slotCount && slotCount >= visibleHandles.length ? slotCount : visibleHandles.length;

  // Show the hover bridge when any source handle in this group has an onAction callback.
  const hasSourceButtons = visibleHandles.some((h) => h.type === 'source' && h.onAction);

  return (
    <>
      <HandleHoverBridge
        position={connectionPosition}
        visible={hasSourceButtons && finalSelected}
      />
      {visibleHandles.map((handle, index) => {
        const handleVisible = handle.showHandle ?? visible;
        // Hover-gated labels follow the node's hover/selection state; others
        // track the handle's own visibility (current always-on behavior).
        const labelVisible =
          handleVisible && (handle.labelVisibility !== 'hover' || selected || hovered);

        return (
          <ButtonHandle
            key={handle.id}
            id={handle.id}
            nodeId={nodeId}
            type={handle.type}
            position={position}
            connectionPosition={connectionPosition}
            handleType={handle.handleType}
            label={handle.label}
            labelIcon={handle.labelIcon}
            labelBackgroundColor={handle.labelBackgroundColor}
            labelVisibility={handle.labelVisibility}
            index={index}
            total={layoutSlotCount}
            selected={selected}
            visible={handleVisible}
            labelVisible={labelVisible}
            showButton={finalSelected && handleVisible && handle.showButton}
            onAction={handle.onAction}
            onMouseEnter={handle.onMouseEnter}
            onMouseLeave={handle.onMouseLeave}
            showNotches={showNotches}
            customPositionAndOffsets={customPositionAndOffsets}
            nodeWidth={nodeWidth}
            nodeHeight={nodeHeight}
            portalAction={portalActions && handle.type === 'source'}
            offsetPx={handle.offsetPx}
            onLabelPointerDown={handle.onLabelPointerDown}
          />
        );
      })}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
