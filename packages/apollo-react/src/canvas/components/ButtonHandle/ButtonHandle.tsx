import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { HandleConfigurationSpecificPosition } from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { cx } from '../../utils/CssUtil';
import {
  getHandleActionPortal,
  getInwardHandleLayout,
  type InwardHandleLayout,
} from './ButtonHandleLayoutUtils';
import { calculateGridAlignedHandlePositions, pixelToPercent } from './ButtonHandleStyleUtils';
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
  showButton?: boolean;
  selected?: boolean;
  index?: number; // 0-based index of this handle on the edge
  total?: number; // Total number of handles on this edge
  onAction?: (event: HandleActionEvent) => void;
  showNotches?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  nodeWidth?: number;
  nodeHeight?: number;
  portalAction?: boolean;
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
  showButton = true,
  selected = false,
  index = 0,
  total = 1,
  onAction,
  showNotches = true,
  customPositionAndOffsets,
  nodeWidth,
  nodeHeight,
  portalAction = false,
}: ButtonHandleProps) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isVertical = position === Position.Top || position === Position.Bottom;

  // Calculate position along the edge for multiple handles
  // Use grid-aligned positions when node dimensions are available
  const positionPercent = useMemo(() => {
    // Determine which dimension to use based on handle position
    const relevantSize = isVertical ? nodeWidth : nodeHeight;

    // If node size is available, use grid-aligned positioning
    if (relevantSize && relevantSize > 0) {
      const gridPositions = calculateGridAlignedHandlePositions(relevantSize, total);
      const pixelPosition = gridPositions[index] ?? relevantSize / 2;
      return pixelToPercent(pixelPosition, relevantSize);
    }

    // Fallback to percentage-based positioning
    return ((index + 1) / (total + 1)) * 100;
  }, [index, total, isVertical, nodeWidth, nodeHeight]);

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
          layout={layout}
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
            labelVisible={visible}
            position={connectionPosition}
            onAction={handleButtonClick}
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
          labelVisible={visible}
          position={position}
          onAction={handleButtonClick}
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
  layout,
}: {
  handleType: HandleType;
  isVertical: boolean;
  selected: boolean;
  hovered: boolean;
  showNotch?: boolean;
  label?: string;
  labelIcon?: React.ReactNode;
  labelBackgroundColor?: string;
  layout: InwardHandleLayout;
}) {
  const labelElement = label ? (
    <div
      className={cx(
        'pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5',
        'text-xs font-medium leading-4 text-foreground-muted'
      )}
      style={labelBackgroundColor ? { backgroundColor: labelBackgroundColor } : undefined}
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
  /** Config-level visibility — controls whether the handle is rendered at all. */
  visible?: boolean;
  /** Runtime visibility — controls opacity (e.g. connected handles stay visible). */
  showHandle?: boolean;
  onAction?: (event: HandleActionEvent) => void;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
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
            index={index}
            total={visibleHandles.length}
            selected={selected}
            visible={handleVisible}
            showButton={finalSelected && handleVisible && handle.showButton}
            onAction={handle.onAction}
            showNotches={showNotches}
            customPositionAndOffsets={customPositionAndOffsets}
            nodeWidth={nodeWidth}
            nodeHeight={nodeHeight}
            portalAction={portalActions && handle.type === 'source'}
          />
        );
      })}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
