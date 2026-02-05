import { FontVariantToken } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApTypography } from '@uipath/apollo-react/material';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useMemo, useState } from 'react';
import type { HandleConfigurationSpecificPosition } from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import {
  StyledAddButton,
  StyledHandle,
  StyledLabel,
  StyledLine,
  StyledNotch,
  StyledWrapper,
} from './ButtonHandle.styles';
import { calculateGridAlignedHandlePositions, pixelToPercent } from './ButtonHandleStyleUtils';

export interface HandleActionEvent {
  handleId: string;
  nodeId: string;
  handleType: 'artifact' | 'input' | 'output';
  position: Position;
  originalEvent: React.MouseEvent;
}

type AddButtonProps = {
  onAction: (event: React.MouseEvent) => void;
};

const AddButton = memo(({ onAction }: AddButtonProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction(e);
    },
    [onAction]
  );

  return (
    <AnimatePresence>
      <StyledAddButton
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleClick}
      >
        <ApIcon name="add" size="14px" />
      </StyledAddButton>
    </AnimatePresence>
  );
});

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
  color?: string;
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
  labelBackgroundColor = 'var(--uix-canvas-background-secondary)',
  visible = true,
  showButton = true,
  color = 'var(--uix-canvas-border)',
  selected = false,
  index = 0,
  total = 1,
  onAction,
  showNotches = true,
  customPositionAndOffsets,
  nodeWidth,
  nodeHeight,
}: ButtonHandleProps) => {
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

  return (
    <StyledHandle
      type={type}
      position={position}
      id={id}
      isConnectable={handleType !== 'artifact'}
      $positionPercent={positionPercent}
      $total={total}
      $visible={visible}
      $customPositionAndOffsets={customPositionAndOffsets}
      onMouseEnter={markAsHovered}
      onMouseLeave={unmarkAsHovered}
      onMouseDown={unmarkAsHovered}
    >
      {label && (
        <StyledLabel $position={position} $backgroundColor={labelBackgroundColor}>
          <Row align="center" gap={4}>
            {labelIcon}
            <ApTypography
              color="var(--uix-canvas-foreground-de-emp)"
              variant={FontVariantToken.fontSizeSBold}
            >
              {label}
            </ApTypography>
          </Row>
        </StyledLabel>
      )}
      {showButton && onAction && type === 'source' && (
        <StyledWrapper $position={position}>
          <StyledLine
            $isVertical={isVertical}
            $selected={selected}
            $size={label ? '60px' : '16px'}
          />
          <div className="nodrag nopan" style={{ pointerEvents: 'auto' }}>
            <AddButton onAction={handleButtonClick} />
          </div>
        </StyledWrapper>
      )}
      <StyledNotch
        $notchColor={color}
        $handleType={handleType}
        $visible={visible}
        $isVertical={isVertical}
        $selected={selected}
        $hovered={isHovered}
        $showNotch={showNotches}
      />
    </StyledHandle>
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
  color?: string;
  labelBackgroundColor?: string;
  visible?: boolean;
  onAction?: (event: HandleActionEvent) => void;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
}

const ButtonHandlesBase = ({
  nodeId,
  handles,
  position,
  selected = false,
  visible = true,
  showAddButton = true,
  showNotches = true,
  customPositionAndOffsets,
  shouldShowAddButtonFn = ({ showAddButton, selected }) => showAddButton && selected,
  nodeWidth,
  nodeHeight,
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  selected?: boolean;
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
   * ({ showAddButton, selected }) => showAddButton && selected
   * ```
   */
  shouldShowAddButtonFn?: ({
    showAddButton,
    selected,
  }: {
    showAddButton: boolean;
    selected: boolean;
  }) => boolean;
}) => {
  const finalSelected = shouldShowAddButtonFn({ showAddButton, selected });

  // Filter to only visible handles for spacing calculations
  const visibleHandles = handles.filter((h) => visible && (h.visible ?? true));
  const total = visibleHandles.length;

  return (
    <>
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
          total={total}
          selected={selected}
          showButton={finalSelected && visible && handle.showButton}
          color={handle.color}
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
