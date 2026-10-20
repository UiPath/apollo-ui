import type { Edge, Node, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { EdgeLabelRenderer, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { Fragment, memo, useCallback, useMemo, useRef } from 'react';
import { useSafeLingui } from '../../../i18n';
import { SEQ_HANDLE_LEFT_OFFSET } from '../../constants';
import { SequentialBranchHeader } from './edges/SequentialBranchHeader';
import type {
  SequentialConnectorData,
  SequentialInsertAnchor,
} from './edges/SequentialConnectorEdge.types';
import { SequentialInsertButton } from './edges/SequentialInsertButton';
import type { SequentialInsertArgs } from './edges/sequentialInsert';

/** Anchors a merge-back's ⊕ near an endpoint; its midpoint can land on an unrelated row. */
const MERGE_BACK_INSERT_OFFSET_PX = 20;

type Translate = ReturnType<typeof useSafeLingui>['_'];

/**
 * Accessible name for a connector's ⊕, named by the step it acts relative to, since N
 * buttons all called "Insert step" are indistinguishable to a screen-reader user.
 */
export function resolveInsertStepLabel(
  translate: Translate,
  anchor: SequentialInsertAnchor | undefined
): string {
  if (anchor?.kind === 'branch') {
    return translate({
      id: 'sequential-canvas.insert-step.branch',
      message: 'Insert step into {branchLabel} of step {stepNumber}',
      values: { branchLabel: anchor.branchLabel, stepNumber: anchor.stepNumber },
    });
  }
  if (anchor?.kind === 'before') {
    return translate({
      id: 'sequential-canvas.insert-step.before',
      message: 'Insert step before step {stepNumber}',
      values: { stepNumber: anchor.stepNumber },
    });
  }
  if (anchor?.kind === 'after') {
    return translate({
      id: 'sequential-canvas.insert-step.after',
      message: 'Insert step after step {stepNumber}',
      values: { stepNumber: anchor.stepNumber },
    });
  }
  return translate({ id: 'sequential-canvas.insert-step', message: 'Insert step' });
}

export interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Absolute bar rectangles from the derived node array (positions are layout-owned). Hidden
 * rows (inside a collapsed step) get none, so their connectors carry no ⊕ or header, just as
 * xyflow hides the edges themselves.
 */
export function buildBarGeometry(
  nodes: readonly Node[],
  fallback: { width: number; height: number }
): Map<string, BarGeometry> {
  const geometry = new Map<string, BarGeometry>();
  for (const node of nodes) {
    if (node.hidden) continue;
    geometry.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: node.width ?? node.measured?.width ?? fallback.width,
      height: node.height ?? node.measured?.height ?? fallback.height,
    });
  }
  return geometry;
}

export interface SequentialInsertItem {
  edgeId: string;
  button?: { x: number; y: number; label: string };
  header?: { x: number; targetTopY: number; label: string; selected: boolean };
  insert?: SequentialInsertArgs;
}

const midpoint = (a: XYPosition, b: XYPosition): XYPosition => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/**
 * One item per connector that needs a ⊕ or a branch header. Handle points are derived
 * from the bar rectangles and the fixed handle offset: bars are not draggable, so this
 * equals what xyflow measures from the invisible handles.
 */
export function computeSequentialInsertItems(
  edges: readonly Edge[],
  geometry: ReadonlyMap<string, BarGeometry>,
  options: { isDesignMode: boolean; translate: Translate }
): SequentialInsertItem[] {
  const items: SequentialInsertItem[] = [];
  for (const edge of edges) {
    const data = edge.data as SequentialConnectorData | undefined;
    if (!data?.kind) continue;
    const label = typeof data.label === 'string' && data.label.length > 0 ? data.label : undefined;
    const slot = options.isDesignMode ? data.slot : undefined;
    const isBranchEntry = data.kind === 'branch-entry';
    if (!slot && !(isBranchEntry && label)) continue;

    const source = geometry.get(edge.source);
    const target = geometry.get(edge.target);
    if (!source || !target) continue;

    const sourcePoint = { x: source.x + SEQ_HANDLE_LEFT_OFFSET, y: source.y + source.height };
    const targetPoint = isBranchEntry
      ? { x: target.x, y: target.y + target.height / 2 }
      : { x: target.x + SEQ_HANDLE_LEFT_OFFSET, y: target.y };

    const item: SequentialInsertItem = { edgeId: edge.id };
    if (isBranchEntry && label) {
      item.header = { x: target.x, targetTopY: target.y, label, selected: !!edge.selected };
    }
    if (slot) {
      const waypoints = data.waypoints ?? [];
      const wp0 = waypoints[0];
      const wp1 = waypoints[1];
      const point =
        isBranchEntry && wp0 && wp1
          ? { x: (wp0.x + wp1.x) / 2, y: wp0.y }
          : data.kind === 'merge-back'
            ? waypoints.length === 0
              ? { x: targetPoint.x, y: targetPoint.y - MERGE_BACK_INSERT_OFFSET_PX }
              : { x: sourcePoint.x, y: sourcePoint.y + MERGE_BACK_INSERT_OFFSET_PX }
            : midpoint(sourcePoint, targetPoint);
      item.button = {
        x: point.x,
        y: point.y,
        label: resolveInsertStepLabel(options.translate, data.insertAnchor),
      };
      item.insert = {
        slot,
        source: edge.source,
        sourceHandleId: edge.sourceHandle,
        target: edge.target,
        targetHandleId: edge.targetHandle,
        sourcePosition: Position.Bottom,
        position: midpoint(sourcePoint, targetPoint),
        connectorEdgeId: edge.id,
      };
    }
    items.push(item);
  }
  return items;
}

export interface SequentialInsertLayerProps {
  /** The rendered sequential edges (derived connectors, plus any preview edges). */
  edges: readonly Edge[];
  /** The rendered sequential nodes; positions are absolute and layout-owned. */
  nodes: readonly Node[];
  barWidth: number;
  barHeight: number;
  isDesignMode: boolean;
  startInsert: (args: SequentialInsertArgs) => void;
}

/**
 * Every connector's ⊕ and branch header in ONE `EdgeLabelRenderer`. xyflow's portal runs a
 * store selector per instance on every store update, so one layer costs one selector per
 * frame instead of two per connector.
 */
export const SequentialInsertLayer = memo(function SequentialInsertLayer({
  edges,
  nodes,
  barWidth,
  barHeight,
  isDesignMode,
  startInsert,
}: SequentialInsertLayerProps) {
  const { _ } = useSafeLingui();
  const geometry = useMemo(
    () => buildBarGeometry(nodes, { width: barWidth, height: barHeight }),
    [nodes, barWidth, barHeight]
  );
  const items = useMemo(
    () => computeSequentialInsertItems(edges, geometry, { isDesignMode, translate: _ }),
    [edges, geometry, isDesignMode, _]
  );
  // Looked up at click time so one stable callback serves every memoized button.
  const insertById = useRef(new Map<string, SequentialInsertArgs>());
  insertById.current = new Map(
    items.flatMap((item) => (item.insert ? [[item.edgeId, item.insert] as const] : []))
  );
  const onInsert = useCallback(
    (edgeId: string) => {
      const args = insertById.current.get(edgeId);
      if (args) startInsert(args);
    },
    [startInsert]
  );

  if (items.length === 0) return null;

  return (
    <EdgeLabelRenderer>
      {items.map((item) => (
        <Fragment key={item.edgeId}>
          {item.header && (
            <SequentialBranchHeader
              x={item.header.x}
              targetTopY={item.header.targetTopY}
              label={item.header.label}
              selected={item.header.selected}
            />
          )}
          {item.button && (
            <SequentialInsertButton
              edgeId={item.edgeId}
              x={item.button.x}
              y={item.button.y}
              label={item.button.label}
              onInsert={onInsert}
            />
          )}
        </Fragment>
      ))}
    </EdgeLabelRenderer>
  );
});
