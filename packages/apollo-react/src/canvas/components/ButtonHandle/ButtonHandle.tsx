import { Handle, type HandleProps, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  HandleConfigurationSpecificPosition,
  HandleLabelVisibility,
} from '../../schema/node-definition/handle';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { cx } from '../../utils/CssUtil';
import { calculateGridAlignedHandlePositions } from '../../utils/handle-positioning';
import {
  getHandleActionPortal,
  getHandleHitRegionClipPath,
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

/**
 * Props forwarded to the underlying xyflow `Handle`, including `data-*` attributes. `className`
 * and `style` are applied after apollo's own; mouse handlers run after apollo's.
 */
export type ButtonHandleHandleProps = Omit<HandleProps, 'id' | 'type' | 'position' | 'children'> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

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
  isLocked?: boolean;
  selected?: boolean;
  /** Fills the notch as hover does, for a handle a connection is about to end on. */
  highlighted?: boolean;
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
  addButtonTitle?: string;
  /** Accessible name of the add button, in place of the built-in English one. */
  addButtonAriaLabel?: string;
  /** `data-testid` for the add button. */
  addButtonTestId?: string;
  /** Appended to the add button's own classes. */
  addButtonClassName?: string;
  /** With `expand-on-hover`: moves the "+" this many px further out from the node. */
  buttonOutset?: number;
  /** Scales the "+" and its label, growing away from the node. Defaults to 1. */
  buttonScale?: number;
  /**
   * `expand-on-hover` makes the "+" the handle itself: a small button against the node in place
   * of the notch, growing outward to full size while the pointer is over it or the node is
   * selected. Defaults to `always` (notch plus a full-size button beyond it).
   */
  buttonReveal?: 'always' | 'expand-on-hover';
  /** With `expand-on-hover`: `circle` centres the small button on the node's edge like a notch. */
  buttonShape?: 'rounded' | 'circle';
  /**
   * `node` makes the xyflow handle fill the node's box, so edges anchor on the node's border
   * instead of 12px outside it. The notch, "+" and label are then portalled into the handle's
   * parent, so `hitRegion`'s clip cannot hide them, and a shown notch starts a connection like
   * the handle itself. Supports one handle per side; ignores a `connectionPosition` that differs
   * from `position`.
   * Defaults to `edge` (a box straddling the node's edge).
   */
  anchor?: 'edge' | 'node';
  /**
   * With `anchor="node"`, the part of the node that belongs to this handle. `strip` is a band
   * along this side, for starting connections without covering the node's body. `quadrant` is the
   * triangular quarter of the node nearest this side, so a connection dropped anywhere on the node
   * lands on the nearest side. Defaults to `strip`.
   */
  hitRegion?: 'strip' | 'quadrant';
  /**
   * With `anchor="node"`, where the notch, "+" and label are portalled instead of the handle's
   * parent: an element the size of the node, for a host that draws them in a layer above the
   * nodes. `null` holds them back until the element exists.
   */
  visualsContainer?: HTMLElement | null;
  /**
   * Forwarded to the xyflow `Handle`: `isConnectable`, `isConnectableStart`, `isConnectableEnd`,
   * `onPointerDown`, `className`, `style`, `data-*` and the like. Use its `onMouseEnter` /
   * `onMouseLeave` for hover on the handle element itself; the top-level `onMouseEnter` /
   * `onMouseLeave` only cover the "+" button.
   */
  handleProps?: ButtonHandleHandleProps;
};

const stopPropagation = (event: React.SyntheticEvent) => event.stopPropagation();

const NODE_ANCHOR_STYLE = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  transform: 'none',
} as const;

const ButtonHandleBase = ({
  id,
  nodeId,
  type,
  position,
  connectionPosition: requestedConnectionPosition = position,
  handleType,
  label,
  labelIcon,
  labelBackgroundColor,
  visible = true,
  labelVisible,
  labelVisibility,
  showButton = true,
  isLocked = false,
  selected = false,
  highlighted = false,
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
  addButtonTitle,
  addButtonAriaLabel,
  addButtonTestId,
  addButtonClassName,
  buttonOutset,
  buttonScale,
  buttonReveal = 'always',
  buttonShape = 'rounded',
  anchor = 'edge',
  hitRegion = 'strip',
  visualsContainer: hostVisualsContainer,
  handleProps,
}: ButtonHandleProps) => {
  // A node-anchored handle always connects on its own side, as documented.
  const connectionPosition = anchor === 'node' ? position : requestedConnectionPosition;
  const handleRef = useRef<HTMLDivElement>(null);
  // Where node-anchored visuals are portalled: beside the handle, out of reach of its clip.
  const [handleParent, setVisualsContainer] = useState<HTMLElement | null>(null);
  const visualsContainer = hostVisualsContainer === undefined ? handleParent : hostVisualsContainer;
  const setHandleElement = useCallback(
    (element: HTMLDivElement | null) => {
      handleRef.current = element;
      if (anchor === 'node' && element) setVisualsContainer(element.parentElement);
    },
    [anchor]
  );
  const {
    className: hostClassName,
    style: hostStyle,
    onMouseEnter: hostMouseEnter,
    onMouseLeave: hostMouseLeave,
    onMouseDown: hostMouseDown,
    ...hostHandleProps
  } = handleProps ?? {};
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

  // Separate from `isHovered`, which mousedown clears: collapsing the button mid-click would
  // move it out from under the pointer.
  const [isPointerOver, setIsPointerOver] = useState(false);
  const markAsHovered = useCallback(() => {
    setIsHovered(true);
    setIsPointerOver(true);
  }, []);
  const unmarkAsHovered = useCallback(() => {
    setIsHovered(false);
    setIsPointerOver(false);
  }, []);
  const clearHoverOnMouseDown = useCallback(() => setIsHovered(false), []);
  // Apollo's own hover tracking first, then the host's handler.
  const onHandleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      markAsHovered();
      hostMouseEnter?.(event);
    },
    [markAsHovered, hostMouseEnter]
  );
  const onHandleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      unmarkAsHovered();
      hostMouseLeave?.(event);
    },
    [unmarkAsHovered, hostMouseLeave]
  );
  const onHandleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      clearHoverOnMouseDown();
      hostMouseDown?.(event);
    },
    [clearHoverOnMouseDown, hostMouseDown]
  );
  const onInwardHandleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      unmarkAsHovered();
      hostMouseDown?.(event);
    },
    [unmarkAsHovered, hostMouseDown]
  );
  const buttonIsHandle = buttonReveal === 'expand-on-hover';
  const compactButton = buttonIsHandle ? !(isPointerOver || selected) : undefined;
  const showActionButton = !!onAction && type === 'source';

  // Label visibility defaults to the handle's own visibility (current behavior).
  const resolvedLabelVisible = labelVisible ?? visible;
  // When the label is hover-gated, keep the add button mounted (opacity-toggled)
  // so the flex stack never reflows and the label doesn't jump as the button appears.
  const keepButtonMounted = labelVisibility === 'hover' && !isLocked;

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
          hovered={isHovered || highlighted}
          showNotch={showNotches}
          label={label}
          labelIcon={labelIcon}
          labelBackgroundColor={labelBackgroundColor}
          labelVisible={resolvedLabelVisible}
          layout={layout}
        />
        <Handle
          {...hostHandleProps}
          ref={setHandleElement}
          type={type}
          position={connectionPosition}
          id={id}
          onMouseEnter={onHandleMouseEnter}
          onMouseLeave={onHandleMouseLeave}
          onMouseDown={onInwardHandleMouseDown}
          className={cx(
            'absolute! z-20 flex! items-center! justify-center! overflow-visible! border-0! rounded-none! bg-transparent!',
            visible
              ? 'cursor-crosshair! pointer-events-auto! opacity-100'
              : 'cursor-default! pointer-events-none! opacity-0',
            hostClassName
          )}
          style={{ ...layout.anchorStyle, ...hostStyle }}
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
            title={addButtonTitle}
            ariaLabel={addButtonAriaLabel}
            testId={addButtonTestId}
            buttonClassName={addButtonClassName}
            outset={buttonOutset}
            scale={buttonScale}
            label={label}
            renderLabel={false}
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

  // The button stands in for the notch. Also hidden while the handle is, or the notch would fade
  // out visibly as the handle appears.
  const notchShown =
    showNotches && !(buttonIsHandle && showActionButton && (showButton || !visible));
  const notch = (
    <HandleNotch
      handleType={handleType}
      isVertical={isVertical}
      selected={selected}
      hovered={isHovered || highlighted}
      showNotch={notchShown}
    />
  );
  const actionOrLabel = (
    <>
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
          title={addButtonTitle}
          ariaLabel={addButtonAriaLabel}
          testId={addButtonTestId}
          buttonClassName={addButtonClassName}
          outset={buttonOutset}
          scale={buttonScale}
          label={label}
          labelIcon={labelIcon}
          labelBackgroundColor={labelBackgroundColor}
          portal={portal}
          compact={compactButton}
          shape={buttonShape}
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
    </>
  );

  if (anchor === 'node') {
    const notchGrabbable = notchShown && visible;

    return (
      <Handle
        {...hostHandleProps}
        ref={setHandleElement}
        type={type}
        position={position}
        id={id}
        onMouseEnter={onHandleMouseEnter}
        onMouseLeave={onHandleMouseLeave}
        onMouseDown={onHandleMouseDown}
        className={cx(
          'border-0! rounded-none! bg-transparent!',
          !visible && 'pointer-events-none!',
          hostClassName
        )}
        style={{
          ...NODE_ANCHOR_STYLE,
          clipPath: getHandleHitRegionClipPath(position, hitRegion),
          ...hostStyle,
        }}
      >
        {/* A React child, so events still reach the handle's handlers, but not a DOM one. */}
        {visualsContainer &&
          createPortal(
            // The box an edge-anchored handle would occupy, so the visuals land where they do there.
            <div
              data-handle-visuals={id}
              className={cx(
                'absolute z-20 flex items-center justify-center pointer-events-none',
                visible ? 'opacity-100' : 'opacity-0'
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
              {/* xyflow reads the handle type off the pressed element, so the notch carries it. */}
              <div
                data-handle-grab-zone={notchGrabbable ? '' : undefined}
                data-handleid={id}
                data-handlepos={position}
                data-nodeid={nodeId}
                className={cx(
                  'flex size-4 shrink-0 items-center justify-center',
                  notchGrabbable && [type, 'nodrag nopan pointer-events-auto cursor-crosshair']
                )}
              >
                {notch}
              </div>
              {/* Keeps a press on the "+" from reading as a press on the handle. */}
              <span
                className="contents"
                onPointerDown={stopPropagation}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  clearHoverOnMouseDown();
                }}
              >
                {actionOrLabel}
              </span>
            </div>,
            visualsContainer
          )}
      </Handle>
    );
  }

  return (
    <Handle
      {...hostHandleProps}
      ref={setHandleElement}
      type={type}
      position={position}
      id={id}
      onMouseEnter={onHandleMouseEnter}
      onMouseLeave={onHandleMouseLeave}
      onMouseDown={onHandleMouseDown}
      className={cx(
        'flex! items-center! justify-center! border-0! rounded-none! bg-transparent!',
        visible ? 'opacity-100' : 'pointer-events-none! opacity-0',
        hostClassName
      )}
      style={{
        width: handleWidth,
        height: handleHeight,
        top,
        bottom,
        left,
        right,
        transform,
        ...hostStyle,
      }}
    >
      {notch}
      {actionOrLabel}
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
}) {
  const labelElement = label ? (
    <div
      aria-hidden={labelVisible ? undefined : true}
      className={cx(
        'pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5',
        'text-xs font-medium leading-4 text-foreground-muted transition-opacity duration-250',
        labelVisible ? 'opacity-100' : 'opacity-0'
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
  isLocked = false,
  showNotches = true,
  customPositionAndOffsets,
  shouldShowAddButtonFn = ({ showAddButton, selected, hovered }) =>
    showAddButton && (selected || hovered),
  nodeWidth,
  nodeHeight,
  portalActions = false,
  addButtonTitle,
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  connectionPosition?: Position;
  selected?: boolean;
  hovered?: boolean;
  visible?: boolean;
  showAddButton?: boolean;
  isLocked?: boolean;
  showNotches?: boolean;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
  nodeWidth?: number;
  nodeHeight?: number;
  /** Render source handle affordances (button and label) in the node overlay layer. */
  portalActions?: boolean;
  /** Native tooltip for the source handles' add buttons. */
  addButtonTitle?: string;

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

  // Show the hover bridge when any source handle in this group can show an add button.
  const hasSourceButtons = visibleHandles.some(
    (h) => h.type === 'source' && h.onAction && h.showButton !== false
  );

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
            total={visibleHandles.length}
            selected={selected}
            visible={handleVisible}
            labelVisible={labelVisible}
            showButton={finalSelected && handleVisible && handle.showButton}
            isLocked={isLocked || handle.showButton === false}
            onAction={handle.onAction}
            onMouseEnter={handle.onMouseEnter}
            onMouseLeave={handle.onMouseLeave}
            showNotches={showNotches}
            customPositionAndOffsets={customPositionAndOffsets}
            nodeWidth={nodeWidth}
            nodeHeight={nodeHeight}
            portalAction={portalActions && handle.type === 'source'}
            addButtonTitle={addButtonTitle}
          />
        );
      })}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
