import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
  memo,
} from 'react';
import {
  Handle,
  Position,
  useStore,
  useNodeId,
  useUpdateNodeInternals,
  type HandleProps,
  type ReactFlowState,
  type Node,
  type Edge,
} from '@xyflow/react';
import { AnimatePresence } from 'motion/react';
import { FontVariantToken } from '@uipath/apollo-core';
import { Row } from '@uipath/uix/core';
import { ApIcon, ApTypography } from '@uipath/portal-shell-react';
import {
  StyledAddButton,
  StyledLabel,
  StyledLine,
  StyledNotch,
  StyledWrapper,
} from './ButtonHandle.styles';
import { useButtonHandleSizeAndPosition } from './useButtonHandleSizeAndPosition';
import { calculateGridAlignedHandlePositions, pixelToPercent } from './ButtonHandleStyleUtils';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import type { HandleActionEvent } from './ButtonHandle';

// ============================================================================
// Types
// ============================================================================

type Side = 'top' | 'right' | 'bottom' | 'left';

export interface SmartHandleProps extends Omit<HandleProps, 'position'> {
  /** Initial/default position if no connections exist */
  defaultPosition?: Position;
  /** Handle visual type - affects shape */
  handleType?: 'input' | 'output' | 'artifact';
  /** Custom styles */
  style?: React.CSSProperties;
  /** Additional class name */
  className?: string;
  /** Node width - required for multi-handle grid alignment on top/bottom edges */
  nodeWidth?: number;
  /** Node height - required for multi-handle grid alignment on left/right edges */
  nodeHeight?: number;
  /** Label to display on the handle */
  label?: string;
  /** Icon to display alongside the label */
  labelIcon?: React.ReactNode;
  /** Background color for the label */
  labelBackgroundColor?: string;
  /** Whether to show the add button (for source handles) */
  showButton?: boolean;
  /** Whether the node is selected */
  selected?: boolean;
  /** Color for the notch */
  color?: string;
  /** Whether to show notches */
  showNotches?: boolean;
  /** Callback when handle action is triggered */
  onAction?: (event: HandleActionEvent) => void;
  /**
   * Whether the handle visual elements (notch, label, button) are visible.
   * The handle is always registered for position calculations regardless of this value.
   * @default true
   */
  visible?: boolean;
  /**
   * Explicit order for this handle from the original configuration.
   * Used to maintain consistent ordering when handles fall back to default positions.
   * Lower numbers appear first (leftmost for horizontal, topmost for vertical).
   */
  configOrder?: number;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface ConnectionInfo {
  connectedNodeId: string;
  isSource: boolean;
}

interface HandleRegistration {
  handleId: string | null | undefined;
  handleType: 'source' | 'target';
  computedPosition: Position;
  /** Order from configuration - used to maintain consistent handle ordering */
  configOrder: number;
}

interface SmartHandleContextValue {
  registerHandle: (nodeId: string | null, registration: HandleRegistration) => void;
  unregisterHandle: (
    nodeId: string | null,
    handleId: string | null | undefined,
    handleType: 'source' | 'target'
  ) => void;
  getRegistrations: () => Map<string, HandleRegistration[]>;
  /** Version counter that increments when registrations change - use in dependency arrays */
  version: number;
}

// ============================================================================
// Constants
// ============================================================================

const SIDE_TO_POSITION: Record<Side, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const NEXT_SIDE_CLOCKWISE: Record<Side, Side> = {
  top: 'right',
  right: 'bottom',
  bottom: 'left',
  left: 'top',
};

// ============================================================================
// Add Button Component
// ============================================================================

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

AddButton.displayName = 'AddButton';

// ============================================================================
// Smart Handle Context (for coordinating multiple handles on same side)
// ============================================================================

const SmartHandleContext = createContext<SmartHandleContextValue | null>(null);

/**
 * Provider that tracks all SmartHandles registered within a node.
 * Place this inside your custom node component to enable multi-handle coordination.
 *
 * Note: nodeWidth and nodeHeight props are accepted for API consistency with SmartHandle,
 * but individual SmartHandle components receive dimensions directly as props.
 * These provider-level props are reserved for potential future use.
 */
export function SmartHandleProvider({
  children,
  nodeWidth: _nodeWidth,
  nodeHeight: _nodeHeight,
}: {
  children: React.ReactNode;
  nodeWidth?: number;
  nodeHeight?: number;
}) {
  // Use ref for storage to avoid re-render cascades
  const registrationsRef = useRef<Map<string, HandleRegistration[]>>(new Map());
  // Version counter to signal when registrations have changed
  const [version, setVersion] = useState(0);

  const registerHandle = useCallback((nodeId: string | null, registration: HandleRegistration) => {
    if (!nodeId) return;
    const current = registrationsRef.current.get(nodeId) ?? [];
    // Check if already registered (by handleId + handleType)
    const existingIndex = current.findIndex(
      (r) => r.handleId === registration.handleId && r.handleType === registration.handleType
    );
    const existing = existingIndex >= 0 ? current[existingIndex] : undefined;
    if (existing) {
      // Only update if position or configOrder changed
      if (
        existing.computedPosition === registration.computedPosition &&
        existing.configOrder === registration.configOrder
      ) {
        return; // No change needed
      }
      current[existingIndex] = registration;
    } else {
      current.push(registration);
      registrationsRef.current.set(nodeId, current);
    }
    // Increment version to trigger re-renders
    setVersion((v) => v + 1);
  }, []);

  const unregisterHandle = useCallback(
    (
      nodeId: string | null,
      handleId: string | null | undefined,
      handleType: 'source' | 'target'
    ) => {
      if (!nodeId) return;
      const current = registrationsRef.current.get(nodeId) ?? [];
      const filtered = current.filter(
        (r) => !(r.handleId === handleId && r.handleType === handleType)
      );
      if (filtered.length === current.length) {
        return; // No change needed
      }
      registrationsRef.current.set(nodeId, filtered);
      // Increment version to trigger re-renders
      setVersion((v) => v + 1);
    },
    []
  );

  const getRegistrations = useCallback(() => registrationsRef.current, []);

  const contextValue = useMemo(
    () => ({
      registerHandle,
      unregisterHandle,
      getRegistrations,
      version,
    }),
    [registerHandle, unregisterHandle, getRegistrations, version]
  );

  return <SmartHandleContext.Provider value={contextValue}>{children}</SmartHandleContext.Provider>;
}

function useSmartHandleContext() {
  return useContext(SmartHandleContext);
}

/**
 * Calculate the index and total count for a handle on a given side.
 * Handles are sorted by configOrder to maintain original configuration order.
 */
function getHandleIndexOnSide(
  registrations: Map<string, HandleRegistration[]>,
  nodeId: string | null,
  handleId: string | null | undefined,
  handleType: 'source' | 'target',
  position: Position
): { index: number; total: number } {
  if (!nodeId) return { index: 0, total: 1 };
  const nodeRegistrations = registrations.get(nodeId) ?? [];
  // Filter to handles on the same side
  const handlesOnSide = nodeRegistrations.filter((r) => r.computedPosition === position);
  // Sort by configOrder to maintain original order from handleConfigurations
  const sorted = [...handlesOnSide].sort((a, b) => a.configOrder - b.configOrder);
  const index = sorted.findIndex((r) => r.handleId === handleId && r.handleType === handleType);
  return { index: index >= 0 ? index : 0, total: sorted.length };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the bounds of a node including its center point.
 * Prefers measured dimensions, then explicit dimensions, then defaults.
 * Uses || instead of ?? to also handle explicit 0 values (invalid for node dimensions).
 */
function getNodeBounds(node: Node): NodeBounds {
  const width = node.measured?.width || node.width || 150;
  const height = node.measured?.height || node.height || 40;
  const x = node.position.x;
  const y = node.position.y;

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

/**
 * Calculate the optimal side for a handle based on the relative position
 * of the connected node. Uses angle-based calculation with aspect ratio
 * awareness for better results on non-square nodes.
 *
 * Both source and target handles point toward the connected node.
 * This means when A connects to B:
 * - A's source handle faces B (e.g., right side if B is to the right)
 * - B's target handle faces A (e.g., left side if A is to the left)
 */
function calculateOptimalSide(currentBounds: NodeBounds, connectedBounds: NodeBounds): Side {
  const dx = connectedBounds.centerX - currentBounds.centerX;
  const dy = connectedBounds.centerY - currentBounds.centerY;

  // Use aspect ratio of the node to create better thresholds
  const aspectRatio = currentBounds.width / currentBounds.height;

  // Calculate angle in radians
  const angle = Math.atan2(dy, dx);

  // Convert to degrees for easier reasoning
  const degrees = angle * (180 / Math.PI);

  // Adjust thresholds based on aspect ratio
  // For wider nodes, prefer left/right; for taller nodes, prefer top/bottom
  const threshold = Math.atan(1 / aspectRatio) * (180 / Math.PI);

  if (degrees >= -threshold && degrees < threshold) {
    return 'right';
  } else if (degrees >= threshold && degrees < 180 - threshold) {
    return 'bottom';
  } else if (degrees >= 180 - threshold || degrees < -(180 - threshold)) {
    return 'left';
  } else {
    return 'top';
  }
}

/**
 * Find all connections for a specific handle
 */
function findHandleConnections(
  edges: Edge[],
  nodeId: string,
  handleId: string | null | undefined,
  handleType: 'source' | 'target'
): ConnectionInfo[] {
  const connections: ConnectionInfo[] = [];

  for (const edge of edges) {
    if (handleType === 'source') {
      if (edge.source === nodeId) {
        const handleMatches = handleId ? edge.sourceHandle === handleId : !edge.sourceHandle;

        if (handleMatches) {
          connections.push({
            connectedNodeId: edge.target,
            isSource: true,
          });
        }
      }
    } else {
      if (edge.target === nodeId) {
        const handleMatches = handleId ? edge.targetHandle === handleId : !edge.targetHandle;

        if (handleMatches) {
          connections.push({
            connectedNodeId: edge.source,
            isSource: false,
          });
        }
      }
    }
  }

  return connections;
}

// ============================================================================
// Store Selectors (stable references to prevent unnecessary re-renders)
// ============================================================================

const selectNodes = (state: ReactFlowState) => state.nodes;
const selectEdges = (state: ReactFlowState) => state.edges;

// ============================================================================
// Custom Hook for Smart Position Calculation
// ============================================================================

/**
 * Find the optimal side for all handles of a specific type on a node
 */
function findOptimalSidesForHandleType(
  edges: Edge[],
  nodeId: string,
  handleType: 'source' | 'target',
  currentBounds: NodeBounds,
  nodeMap: Map<string, Node>
): Map<string | null | undefined, Side> {
  const handleSides = new Map<string | null | undefined, Side>();

  // Find all edges for this node and handle type
  const relevantEdges = edges.filter((edge) =>
    handleType === 'source' ? edge.source === nodeId : edge.target === nodeId
  );

  for (const edge of relevantEdges) {
    const handleId = handleType === 'source' ? edge.sourceHandle : edge.targetHandle;
    const connectedNodeId = handleType === 'source' ? edge.target : edge.source;
    const connectedNode = nodeMap.get(connectedNodeId);

    if (connectedNode) {
      const connectedBounds = getNodeBounds(connectedNode);
      const optimalSide = calculateOptimalSide(currentBounds, connectedBounds);
      handleSides.set(handleId, optimalSide);
    }
  }

  return handleSides;
}

function useSmartPosition(
  nodeId: string | null,
  handleId: string | null | undefined,
  handleType: 'source' | 'target',
  defaultPosition: Position,
  hasSourceHandles: boolean
): Position {
  const nodes = useStore(selectNodes);
  const edges = useStore(selectEdges);

  return useMemo(() => {
    if (!nodeId) return defaultPosition;

    // Build node lookup map
    const nodeMap = new Map<string, Node>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const currentNode = nodeMap.get(nodeId);
    if (!currentNode) return defaultPosition;

    // Find connections for this handle
    const connections = findHandleConnections(edges, nodeId, handleId, handleType);

    if (connections.length === 0) {
      return defaultPosition;
    }

    const currentBounds = getNodeBounds(currentNode);

    // Calculate optimal side for this handle
    let optimalSide: Side;

    if (connections.length === 1) {
      const firstConnection = connections[0];
      if (!firstConnection) return defaultPosition;
      const connectedNode = nodeMap.get(firstConnection.connectedNodeId);
      if (!connectedNode) return defaultPosition;

      const connectedBounds = getNodeBounds(connectedNode);
      optimalSide = calculateOptimalSide(currentBounds, connectedBounds);
    } else {
      // Multiple connections: use average position of all connected nodes
      let totalX = 0;
      let totalY = 0;
      let count = 0;

      for (const conn of connections) {
        const connectedNode = nodeMap.get(conn.connectedNodeId);
        if (connectedNode) {
          const bounds = getNodeBounds(connectedNode);
          totalX += bounds.centerX;
          totalY += bounds.centerY;
          count++;
        }
      }

      if (count === 0) return defaultPosition;

      const avgBounds: NodeBounds = {
        x: totalX / count,
        y: totalY / count,
        width: 0,
        height: 0,
        centerX: totalX / count,
        centerY: totalY / count,
      };

      optimalSide = calculateOptimalSide(currentBounds, avgBounds);
    }

    // Conflict resolution strategy (only applies when node has both source and target handles):
    // - LEFT side is reserved for TARGET handles only
    // - RIGHT side is reserved for SOURCE handles only
    // - TOP and BOTTOM can be used by either
    //
    // This ensures source and target handles on the same node never overlap,
    // regardless of where connected nodes are positioned.

    if (handleType === 'source' && optimalSide === 'left') {
      // Source handles cannot use 'left' (reserved for targets)
      // Rotate clockwise: left → top
      optimalSide = 'top';
    } else if (handleType === 'target' && optimalSide === 'right' && hasSourceHandles) {
      // Target handles cannot use 'right' (reserved for sources) - but only if the node has source handles
      // Rotate clockwise: right → bottom
      optimalSide = 'bottom';
    }

    // Additionally, target handles should avoid sides that connected source handles are using
    // Only apply this logic if the node actually has source handles
    if (handleType === 'target' && hasSourceHandles) {
      const sourceSides = findOptimalSidesForHandleType(
        edges,
        nodeId,
        'source',
        currentBounds,
        nodeMap
      );

      // Apply the same reservation rule to source positions
      const adjustedSourceSides = new Set<Side>();
      for (const side of sourceSides.values()) {
        // Source handles on 'left' would have been adjusted to 'top'
        adjustedSourceSides.add(side === 'left' ? 'top' : side);
      }

      // Also reserve 'right' for potentially unconnected source handles
      adjustedSourceSides.add('right');

      if (adjustedSourceSides.has(optimalSide)) {
        // Rotate clockwise to find a free side (but never 'right')
        let newSide = NEXT_SIDE_CLOCKWISE[optimalSide];
        let attempts = 0;
        while ((adjustedSourceSides.has(newSide) || newSide === 'right') && attempts < 3) {
          newSide = NEXT_SIDE_CLOCKWISE[newSide];
          attempts++;
        }
        optimalSide = newSide;
      }
    }

    return SIDE_TO_POSITION[optimalSide];
  }, [nodeId, nodes, edges, handleId, handleType, defaultPosition, hasSourceHandles]);
}

// ============================================================================
// Smart Handle Component
// ============================================================================

/**
 * SmartHandle - A handle that automatically repositions to optimize edge paths
 *
 * Features:
 * - Calculates optimal position based on connected node locations
 * - Updates in real-time during node dragging
 * - Properly synchronizes with React Flow's edge rendering via useUpdateNodeInternals
 * - Falls back to default position when no connections exist
 * - Aspect-ratio aware positioning for non-square nodes
 *
 * @example
 * ```tsx
 * <SmartHandle
 *   type="source"
 *   id="output"
 *   defaultPosition={Position.Right}
 * />
 *
 * <SmartHandle
 *   type="target"
 *   id="input"
 *   defaultPosition={Position.Left}
 * />
 * ```
 */
export function SmartHandle({
  type,
  id,
  defaultPosition = type === 'source' ? Position.Right : Position.Left,
  handleType = type === 'source' ? 'output' : 'input',
  style,
  className,
  nodeWidth,
  nodeHeight,
  label,
  labelIcon,
  labelBackgroundColor = 'var(--uix-canvas-background-secondary)',
  showButton = false,
  selected = false,
  color = 'var(--uix-canvas-border)',
  showNotches = true,
  onAction,
  visible = true,
  configOrder,
  ...rest
}: SmartHandleProps) {
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();
  const [isHovered, setIsHovered] = useState(false);
  const smartHandleContext = useSmartHandleContext();

  // Track previous position to avoid unnecessary updates
  const prevPositionRef = useRef<Position | null>(null);

  // Get version from context to trigger recalculation when registrations change
  const contextVersion = smartHandleContext?.version ?? 0;

  // Check if this node has any source handles registered
  const hasSourceHandles = useMemo(() => {
    if (!nodeId || !smartHandleContext) return false;
    const registrations = smartHandleContext.getRegistrations();
    const nodeRegistrations = registrations.get(nodeId) ?? [];
    return nodeRegistrations.some((r) => r.handleType === 'source');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextVersion is included because smartHandleContext.version may change without the context object reference changing
  }, [nodeId, smartHandleContext, contextVersion]);

  // Calculate optimal position
  const computedPosition = useSmartPosition(nodeId, id, type, defaultPosition, hasSourceHandles);

  // Determine if handle is on a vertical edge (top/bottom)
  const isVertical = computedPosition === Position.Top || computedPosition === Position.Bottom;

  // Get stable callback references from context
  const registerHandle = smartHandleContext?.registerHandle;
  const unregisterHandle = smartHandleContext?.unregisterHandle;

  // Register this handle with the context (if available) for multi-handle coordination
  useEffect(() => {
    if (!nodeId || !registerHandle || !unregisterHandle) return;

    registerHandle(nodeId, {
      handleId: id,
      handleType: type,
      computedPosition,
      configOrder: configOrder ?? 0,
    });

    return () => {
      unregisterHandle(nodeId, id, type);
    };
  }, [nodeId, id, type, computedPosition, registerHandle, unregisterHandle, configOrder]);

  // CRITICAL: Update node internals when handle position changes
  // This forces React Flow to recalculate edge paths so they connect correctly
  useEffect(() => {
    if (!nodeId) return;

    // Only update if position actually changed
    if (prevPositionRef.current !== computedPosition) {
      prevPositionRef.current = computedPosition;

      // Use requestAnimationFrame to ensure the DOM has updated
      // before telling React Flow to recalculate
      requestAnimationFrame(() => {
        updateNodeInternals(nodeId);
      });
    }
  }, [nodeId, computedPosition, updateNodeInternals]);

  // Calculate position percent for multi-handle support
  const { index, total } = useMemo(() => {
    if (!nodeId || !smartHandleContext) {
      return { index: 0, total: 1 };
    }
    const registrations = smartHandleContext.getRegistrations();
    return getHandleIndexOnSide(registrations, nodeId, id, type, computedPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextVersion triggers recalc when registrations change
  }, [nodeId, id, type, computedPosition, contextVersion]);

  const positionPercent = useMemo(() => {
    if (total <= 1) {
      return 50; // Single handle, center it
    }

    // Get the relevant dimension based on position
    const relevantSize = isVertical ? nodeWidth : nodeHeight;

    if (relevantSize && relevantSize > 0) {
      // Use grid-aligned positioning like ButtonHandle
      const gridPositions = calculateGridAlignedHandlePositions(relevantSize, total);
      const pixelPosition = gridPositions[index] ?? relevantSize / 2;
      return pixelToPercent(pixelPosition, relevantSize);
    }

    // Fallback to percentage-based positioning
    return ((index + 1) / (total + 1)) * 100;
  }, [index, total, isVertical, nodeWidth, nodeHeight]);

  // Use the same positioning logic as ButtonHandle for proper edge connection points
  const { width, height, top, bottom, left, right, transform } = useButtonHandleSizeAndPosition({
    position: computedPosition,
    positionPercent,
    numHandles: total,
  });

  // Handle button click for add action
  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      if (!nodeId) return;

      const actionEvent: HandleActionEvent = {
        handleId: id ?? '',
        nodeId,
        handleType,
        position: computedPosition,
        originalEvent: event,
      };

      // Call direct callback first for immediate response
      onAction?.(actionEvent);

      // Emit to event bus for global listeners
      canvasEventBus.emit('handle:action', {
        handleId: id ?? '',
        nodeId,
        handleType,
        position: computedPosition,
      });
    },
    [id, nodeId, handleType, computedPosition, onAction]
  );

  return (
    <Handle
      type={type}
      position={computedPosition}
      id={id}
      className={className}
      isConnectable={visible && handleType !== 'artifact'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        top,
        bottom,
        left,
        right,
        transform,
        borderWidth: 0,
        borderRadius: 0,
        backgroundColor: 'transparent',
        cursor: visible ? 'crosshair' : 'default',
        pointerEvents: visible ? 'auto' : 'none',
        ...style,
      }}
      {...rest}
    >
      {/* Only render visual elements when visible */}
      {visible && (
        <>
          {label && (
            <StyledLabel $position={computedPosition} $backgroundColor={labelBackgroundColor}>
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
            <StyledWrapper $position={computedPosition}>
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
            $visible={true}
            $isVertical={isVertical}
            $selected={selected}
            $hovered={isHovered}
            $showNotch={showNotches}
          />
        </>
      )}
    </Handle>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Pre-configured smart source handle (output style)
 */
export function SmartSourceHandle(props: Omit<SmartHandleProps, 'type'>) {
  return <SmartHandle type="source" handleType="output" {...props} />;
}

/**
 * Pre-configured smart target handle (input style)
 */
export function SmartTargetHandle(props: Omit<SmartHandleProps, 'type'>) {
  return <SmartHandle type="target" handleType="input" {...props} />;
}
