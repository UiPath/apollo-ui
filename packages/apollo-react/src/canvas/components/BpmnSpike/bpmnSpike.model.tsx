import type { Edge, Node, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, useContext } from 'react';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';
import type { Point } from '../Edges/shared/types';

/**
 * The shapes below mirror PO.Frontend's BPMN model on purpose: the xyflow `type` is the BPMN
 * `$type`, `data` is a flat bag, size lives on the node, handle ids encode the side, and an edge's
 * waypoints include both endpoints. The spike adapts apollo primitives to this, not the reverse.
 */
export type BpmnEventDefinition =
  | 'message'
  | 'timer'
  | 'error'
  | 'signal'
  | 'escalation'
  | 'compensation'
  | 'conditional'
  | 'link'
  | 'terminate';

export type BpmnLoop = 'loop' | 'parallel' | 'sequential';

export interface BpmnNodeData extends Record<string, unknown> {
  label?: string;
  eventDefinition?: BpmnEventDefinition;
  /** `cancelActivity === false` on a boundary event, `isInterrupting === false` on a start event. */
  nonInterrupting?: boolean;
  loopCharacteristics?: BpmnLoop;
  isExpanded?: boolean;
  triggeredByEvent?: boolean;
  isHorizontal?: boolean;
  backgroundColor?: string;
  executionStatus?: ElementStatusValues;
  validationStatus?: ValidationErrorSeverity;
  modification?: SuggestionType;
  breakpoint?: boolean;
  mocked?: boolean;
  connected?: boolean;
}

export type BpmnNode = Node<BpmnNodeData>;

export interface BpmnEdgeData extends Record<string, unknown> {
  label?: string;
  /** Source anchor, bends, target anchor: the list BPMN DI stores. */
  waypoints?: Point[];
  defaultFlow?: boolean;
  conditionExpression?: string;
  modification?: SuggestionType;
}

export type BpmnEdge = Edge<BpmnEdgeData>;

const HANDLE_ID_SEPARATOR = '____';

export const handleId = (nodeId: string, kind: 'source' | 'target', position: Position) =>
  [nodeId, kind, position].join(HANDLE_ID_SEPARATOR);

export const handleSide = (id?: string | null) =>
  id?.split(HANDLE_ID_SEPARATOR)[2] as Position | undefined;

/** What the host (Redux thunks in PO.Frontend, story state here) does when a primitive fires. */
export interface BpmnSpikeActions {
  addAfter: (nodeId: string, side: Position) => void;
  addBoundaryEvent: (nodeId: string) => void;
  changeElement: (nodeId: string) => void;
  toggleLoop: (nodeId: string) => void;
  toggleBreakpoint: (nodeId: string) => void;
  duplicate: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  rename: (nodeId: string, label: string) => void;
  insertOnEdge: (edgeId: string, position: Point) => void;
  deleteEdge: (edgeId: string) => void;
  setWaypoints: (edgeId: string, waypoints: Point[]) => void;
}

/** How the "+" on a handle appears: full size at once, or small until the handle is hovered. */
export type BpmnButtonReveal = 'always' | 'expand-on-hover';
const BpmnButtonRevealContext = createContext<BpmnButtonReveal>('expand-on-hover');
export const BpmnButtonRevealProvider = BpmnButtonRevealContext.Provider;
export const useBpmnButtonReveal = () => useContext(BpmnButtonRevealContext);

export type BpmnButtonShape = 'rounded' | 'circle';
const BpmnButtonShapeContext = createContext<BpmnButtonShape>('circle');
export const BpmnButtonShapeProvider = BpmnButtonShapeContext.Provider;
export const useBpmnButtonShape = () => useContext(BpmnButtonShapeContext);

const BpmnSpikeContext = createContext<BpmnSpikeActions | null>(null);

export const BpmnSpikeProvider = BpmnSpikeContext.Provider;

export function useBpmnSpikeActions(): BpmnSpikeActions {
  const actions = useContext(BpmnSpikeContext);
  if (!actions) throw new Error('useBpmnSpikeActions needs a BpmnSpikeProvider');
  return actions;
}
