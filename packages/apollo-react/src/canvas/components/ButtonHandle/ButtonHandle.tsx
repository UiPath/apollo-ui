import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { HandleConfigurationSpecificPosition } from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { cx } from '../../utils/CssUtil';
import { calculateGridAlignedHandlePositions, pixelToPercent } from './ButtonHandleStyleUtils';
import { HandleButton, HandleHoverBridge } from './HandleButton';
import { HandleLabel } from './HandleLabel';
import { HandleNotch } from './HandleNotch';
import { useButtonHandleSizeAndPosition } from './useButtonHandleSizeAndPosition';

export interface HandleActionEvent {
  handleId: string;
  nodeId: string;
  handleType: 'artifact' | 'input' | 'output';
  position: Position;
  originalEvent: React.MouseEvent;
}

type ButtonHandleProps = {
  id: string;
  nodeId: string;
  type: 'source' | 'target';
  position: Position;
  handleType: 'artifact' | 'input' | 'output';
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
};

const ButtonHandleBase = ({
  id,
  nodeId,
  type,
  position,
  handleType,
  label,
  labelIcon,
  labelBackgroundColor = 'var(--canvas-background-secondary)',
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
        position,
        originalEvent: event,
      };

      // Call direct callback first for immediate response
      onAction?.(actionEvent);

      // Emit to event bus for global listeners
      canvasEventBus.emit('handle:action', {
        handleId: id,
        nodeId,
        handleType,
        position,
        // timestamp: Date.now(), // Optional - uncomment if you need timing info
      });
    },
    [id, nodeId, handleType, position, onAction]
  );

  const markAsHovered = useCallback(() => setIsHovered(true), []);
  const unmarkAsHovered = useCallback(() => setIsHovered(false), []);

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
      {onAction && type === 'source' ? (
        <HandleButton
          visible={showButton}
          labelVisible={visible}
          position={position}
          onAction={handleButtonClick}
          handleRef={handleRef}
          label={label}
          labelIcon={labelIcon}
          labelBackgroundColor={labelBackgroundColor}
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

export interface ButtonHandleConfig {
  /** Is of type string but `ButtonHandleId` should be used for reserved ids */
  id: string;
  type: 'source' | 'target';
  handleType: 'artifact' | 'input' | 'output';
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
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  selected?: boolean;
  hovered?: boolean;
  visible?: boolean;
  showAddButton?: boolean;
  showNotches?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  nodeWidth?: number;
  nodeHeight?: number;

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

  // Show the hover bridge when any source handle in this group has an onAction callback
  const hasSourceButtons = visibleHandles.some((h) => h.type === 'source' && h.onAction);

  return (
    <>
      <HandleHoverBridge position={position} visible={hasSourceButtons && finalSelected} />
      {visibleHandles.map((handle, index) => (
        <ButtonHandle
          key={handle.id}
          id={handle.id}
          nodeId={nodeId}
          type={handle.type}
          position={position}
          handleType={handle.handleType}
          label={handle.label}
          labelIcon={handle.labelIcon}
          labelBackgroundColor={handle.labelBackgroundColor}
          index={index}
          total={visibleHandles.length}
          selected={selected}
          visible={handle.showHandle ?? visible}
          showButton={finalSelected && (handle.showHandle ?? visible) && handle.showButton}
          onAction={handle.onAction}
          showNotches={showNotches}
          customPositionAndOffsets={customPositionAndOffsets}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
        />
      ))}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
