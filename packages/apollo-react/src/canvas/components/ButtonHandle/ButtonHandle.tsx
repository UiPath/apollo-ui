import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { forwardRef, memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { HandleConfigurationSpecificPosition } from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { cx } from '../../utils/CssUtil';
import {
  calculateGridAlignedHandlePositions,
  getInwardHandleSize,
  getInwardHandleTransform,
  getInwardNotchLayout,
  INWARD_LABEL_POSITION,
  pixelToPercent,
} from './ButtonHandleStyleUtils';
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

type InwardLabelLayoutOptions = {
  hasInwardLabel: boolean;
  isVertical: boolean;
  position: Position;
  handleType: 'artifact' | 'input' | 'output';
  handleWidth: string;
  handleHeight: string;
  transform: string;
};

type ButtonHandleProps = {
  id: string;
  nodeId: string;
  type: 'source' | 'target';
  position: Position;
  // Defaults to `position`. Loop/container handles can render on one side while
  // React Flow anchors the edge on another — set this to decouple the two.
  connectionPosition?: Position;
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
  const hasInwardLabel = Boolean(label && connectionPosition !== position);
  const { inwardLabelRef, rootWidth, rootHeight, rootTransform } = useInwardLabelLayout({
    hasInwardLabel,
    isVertical,
    position,
    handleType,
    handleWidth,
    handleHeight,
    transform,
  });

  return (
    <Handle
      ref={handleRef}
      type={type}
      position={connectionPosition}
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
        width: rootWidth,
        height: rootHeight,
        top,
        bottom,
        left,
        right,
        transform: rootTransform,
      }}
    >
      {hasInwardLabel ? (
        <>
          <div className={cx('flex h-full w-full items-center', getInwardNotchLayout(position))}>
            <HandleNotch
              handleType={handleType}
              isVertical={isVertical}
              selected={selected}
              hovered={isHovered}
              showNotch={showNotches}
            />
          </div>
          <InwardHandleLabel
            ref={inwardLabelRef}
            connectionPosition={connectionPosition}
            label={label!}
            labelIcon={labelIcon}
            backgroundColor={labelBackgroundColor}
          />
          {onAction && type === 'source' && showButton ? (
            <HandleButton
              visible={showButton}
              labelVisible={visible}
              position={position}
              onAction={handleButtonClick}
              handleRef={handleRef}
            />
          ) : null}
        </>
      ) : (
        <>
          <HandleNotch
            handleType={handleType}
            isVertical={isVertical}
            selected={selected}
            hovered={isHovered}
            showNotch={showNotches}
          />
          {onAction && type === 'source' && showButton ? (
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
        </>
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
      <HandleHoverBridge position={position} visible={hasSourceButtons && finalSelected} />
      {visibleHandles.map((handle, index) => (
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

function useInwardLabelLayout({
  hasInwardLabel,
  isVertical,
  position,
  handleType,
  handleWidth,
  handleHeight,
  transform,
}: InwardLabelLayoutOptions) {
  // Inward loop labels sit flush to the inner wall, so we measure the pill size
  // on the relevant axis and shift the React Flow handle inward by that amount.
  const inwardLabelRef = useRef<HTMLDivElement>(null);
  const [inwardLabelInset, setInwardLabelInset] = useState(0);

  useLayoutEffect(() => {
    if (!hasInwardLabel) {
      setInwardLabelInset((current) => (current === 0 ? current : 0));
      return;
    }

    const rect = inwardLabelRef.current?.getBoundingClientRect();
    const nextInset = isVertical ? (rect?.height ?? 0) : (rect?.width ?? 0);
    setInwardLabelInset((current) => (current === nextInset ? current : nextInset));
  }, [hasInwardLabel, isVertical]);

  const inwardHandleSize = getInwardHandleSize(handleType);

  return {
    inwardLabelRef,
    rootWidth: hasInwardLabel && !isVertical ? inwardHandleSize : handleWidth,
    rootHeight: hasInwardLabel && isVertical ? inwardHandleSize : handleHeight,
    rootTransform: hasInwardLabel
      ? getInwardHandleTransform(position, inwardLabelInset)
      : transform,
  };
}

const InwardHandleLabel = forwardRef<HTMLDivElement, InwardHandleLabelProps>(
  function InwardHandleLabel(
    { connectionPosition, label, labelIcon, backgroundColor }: InwardHandleLabelProps,
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cx(
          'pointer-events-none absolute flex h-6 items-center whitespace-nowrap rounded-full border border-border-subtle px-2.5',
          INWARD_LABEL_POSITION[connectionPosition]
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <Row align="center" gap={3}>
          {labelIcon}
          <span className="text-xs font-medium text-foreground">{label}</span>
        </Row>
      </div>
    );
  }
);

type InwardHandleLabelProps = {
  connectionPosition: Position;
  label: string;
  labelIcon?: React.ReactNode;
  backgroundColor?: string;
};
