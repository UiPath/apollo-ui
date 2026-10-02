import { NodeResizeControl, type Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, type ReactNode, useMemo } from 'react';
import type { ContainerResizeMinimums } from '../../utils/container';
import { CanvasIcon } from '../../utils/icon-registry';
import type { HandleActionEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';
import { CanvasTooltip } from '../CanvasTooltip';
import {
  BODY_FRAME_CLASSES,
  DEFAULT_RESIZE_MINIMUMS,
  RESIZE_CONTROL_STYLE,
  RESIZE_CONTROLS,
} from './ContainerNode.constants';
import type { ContainerHandleGroup } from './ContainerNode.helpers';
import type { ContainerBodyFrame, ContainerEmptyStateContext } from './ContainerNode.types';

export function EmptyStateRender({
  render,
  ...ctx
}: ContainerEmptyStateContext & { render: (ctx: ContainerEmptyStateContext) => ReactNode }) {
  return <>{render(ctx)}</>;
}

export function EmptyState({
  label,
  onAddFirstChild,
}: {
  label: string;
  onAddFirstChild: () => void;
}) {
  return (
    <CanvasTooltip content={label} placement="top">
      <button
        type="button"
        onClick={onAddFirstChild}
        aria-label={label}
        className={cn(
          'nodrag nopan',
          'pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl',
          'border border-border bg-surface-overlay text-foreground',
          'shadow-(--canvas-node-shadow-lifted)',
          'transition-colors',
          'hover:bg-surface-hover hover:border-brand'
        )}
      >
        <CanvasIcon icon="plus" size={14} />
      </button>
    </CanvasTooltip>
  );
}

export const BodyFrame = memo(function BodyFrame({
  testId,
  frame,
  radiusClassName,
  isEmpty,
  isLoading,
}: {
  testId: string;
  frame: ContainerBodyFrame;
  radiusClassName: string;
  isEmpty?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div
      data-testid={testId}
      data-empty={isEmpty ? 'true' : 'false'}
      data-body-frame={frame}
      className={cn(
        'relative m-2.5 flex flex-1 bg-transparent',
        radiusClassName,
        BODY_FRAME_CLASSES[frame],
        // Oversized spread on purpose: the parent rounded-[19px] clip layer (not this value)
        // defines the matte's outer edge. Shrinking it back reintroduces the corner gaps.
        'shadow-[0_0_0_200px_var(--surface-overlay)]',
        'pointer-events-none'
      )}
    >
      {isLoading ? (
        <div className="m-6 h-14 w-full animate-pulse rounded-[18px] bg-(--canvas-background-overlay)" />
      ) : null}
    </div>
  );
});

export const ResizeControls = memo(function ResizeControls({
  minimums = DEFAULT_RESIZE_MINIMUMS,
  onResize,
  onResizeStart,
  onResizeEnd,
}: {
  minimums?: ContainerResizeMinimums;
  onResize: (_event: unknown, params: { width: number; height: number }) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
}) {
  return (
    <>
      {RESIZE_CONTROLS.map(({ position, widthSide, heightSide, cursor }) => (
        <NodeResizeControl
          key={position}
          style={RESIZE_CONTROL_STYLE}
          position={position}
          minWidth={minimums[widthSide]}
          minHeight={minimums[heightSide]}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        >
          <div
            className="absolute bottom-0 right-0 h-5 w-5 pointer-events-auto"
            style={{ cursor }}
          />
        </NodeResizeControl>
      ))}
    </>
  );
});

export const ResizeCornerIndicators = memo(function ResizeCornerIndicators({
  testIdPrefix,
  visible,
}: {
  testIdPrefix: string;
  visible: boolean;
}) {
  return (
    <>
      {RESIZE_CONTROLS.map(({ position, indicatorClassName }) => (
        <div
          key={position}
          aria-hidden
          data-testid={`${testIdPrefix}-resize-corner-indicator-${position}`}
          className={cn(
            'pointer-events-none absolute h-2 w-2 rounded-full bg-brand transition-opacity',
            indicatorClassName,
            visible ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
    </>
  );
});

type SharedHandleGroupProps = {
  nodeId: string;
  selected: boolean;
  hovered: boolean;
  shouldShowHandles: boolean;
  showAddButton: boolean;
  isLocked: boolean;
  showNotches: boolean;
  nodeWidth: number;
  nodeHeight: number;
  connectedHandleIds: ReadonlySet<string>;
  onHandleAction: (event: HandleActionEvent) => void;
};

type HandleGroupsProps = SharedHandleGroupProps & {
  groups: ContainerHandleGroup[];
};

export function HandleGroups({ groups, ...handleGroupProps }: HandleGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, groupIndex) => (
        <HandleGroup
          key={`${group.boundary}:${group.position}:${groupIndex}`}
          {...handleGroupProps}
          group={group}
        />
      ))}
    </>
  );
}

type HandleGroupProps = SharedHandleGroupProps & {
  group: ContainerHandleGroup;
};

function HandleGroup({
  nodeId,
  group,
  selected,
  hovered,
  shouldShowHandles,
  showAddButton,
  isLocked,
  showNotches,
  nodeWidth,
  nodeHeight,
  connectedHandleIds,
  onHandleAction,
}: HandleGroupProps) {
  const groupVisible = shouldShowHandles && (group.visible ?? true);
  const position = group.position as Position;
  const enhancedHandles = useMemo(
    () =>
      group.handles.map((handle) => {
        const showHandle = connectedHandleIds.has(handle.id) || groupVisible;

        if (group.boundary === 'inner') {
          return {
            ...handle,
            showHandle,
            showButton: false,
            onAction: undefined,
          };
        }

        return {
          ...handle,
          showHandle,
          showButton: handle.showButton,
          onAction: handle.onAction ?? onHandleAction,
        };
      }),
    [group.boundary, group.handles, connectedHandleIds, groupVisible, onHandleAction]
  );

  return (
    <ButtonHandles
      nodeId={nodeId}
      handles={enhancedHandles}
      position={position}
      connectionPosition={group.connectionPosition}
      selected={selected}
      hovered={hovered}
      showAddButton={showAddButton}
      isLocked={isLocked}
      showNotches={showNotches}
      customPositionAndOffsets={group.customPositionAndOffsets}
      nodeWidth={nodeWidth}
      nodeHeight={nodeHeight}
      portalActions={group.boundary === 'outer'}
    />
  );
}
