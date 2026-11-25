import type { Edge, Node, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';
import type { Point } from '../Edges/shared/types';

/**
 * The shapes below mirror PO.Frontend's BPMN model on purpose: the xyflow `type` is the BPMN
 * `$type`, `data` is a flat bag, size lives on the node, handle ids encode the side, and an edge's
 * waypoints include both endpoints. These renderers adapt apollo primitives to this, not the reverse.
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
  /** Shown on an activity in place of the built-in task glyph, for kinds only the host knows. */
  icon?: ReactNode;
  eventDefinition?: BpmnEventDefinition;
  /** `cancelActivity === false` on a boundary event, `isInterrupting === false` on a start event. */
  nonInterrupting?: boolean;
  loopCharacteristics?: BpmnLoop;
  isExpanded?: boolean;
  triggeredByEvent?: boolean;
  /** `false` turns a pool or lane vertical: header band along the top, lanes side by side. */
  isHorizontal?: boolean;
  /** Participant multiplicity marker on a pool. */
  multiplicity?: boolean;
  /** A black-box pool: no header band, the label centred in the pool. */
  isEmpty?: boolean;
  /** Position of a lane among its siblings; every lane after the first draws a divider. */
  laneIndex?: number;
  /** A node is being dragged over this expanded sub-process, pool or lane. */
  dropTarget?: boolean;
  /** Side of an event, gateway or data node its label sits on. Defaults to `bottom`. */
  labelPlacement?: 'bottom' | 'top' | 'left' | 'right';
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
  /** Centre of the label in flow coordinates, as BPMN DI stores it. Defaults to the path's midpoint. */
  labelPosition?: Point;
  /**
   * Source dock, bends, target dock: the list BPMN DI stores. With two or more points the flow is
   * drawn through exactly these, wherever on the nodes the docks sit.
   */
  waypoints?: Point[];
  /** Arrowheads on an association: at the target (`one`) or at both ends. Defaults to `none`. */
  associationDirection?: 'none' | 'one' | 'both';
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

/**
 * What the host (Redux thunks in PO.Frontend, story state here) does when a primitive fires.
 * Leaving out an optional action leaves out its control.
 */
/** The node toolbar's buttons, as named in `hoverToolbarAction` and their `toolbar-item-` test ids. */
export type BpmnToolbarActionId =
  | 'delete'
  | 'change-element'
  | 'iteration'
  | 'boundary-event'
  | 'bpmn:TextAnnotation'
  | 'breakpoint'
  | 'duplicate';

export interface BpmnActions {
  addAfter: (nodeId: string, side: Position) => void;
  addBoundaryEvent?: (nodeId: string) => void;
  /** Attach a new text annotation to the element. */
  addAnnotation?: (nodeId: string) => void;
  changeElement?: (nodeId: string) => void;
  toggleLoop?: (nodeId: string) => void;
  toggleBreakpoint?: (nodeId: string) => void;
  duplicate?: (nodeId: string) => void;
  deleteNode?: (nodeId: string) => void;
  /**
   * The pointer or keyboard focus entered or left a toolbar button, for a host that previews
   * the action (say, outlining what Delete would remove). Always ends on `false`.
   */
  hoverToolbarAction?: (nodeId: string, action: BpmnToolbarActionId, hovered: boolean) => void;
  /**
   * A resize control was dragged. The controls only render when this is given; xyflow reports
   * the new position and size through `onNodesChange` as well.
   */
  resize?: (nodeId: string, size: { width: number; height: number }) => void;
  rename: (nodeId: string, label: string) => void;
  /**
   * With it, double-clicking a flow's label edits it inline, and a selected flow with no label
   * shows a placeholder to start from.
   */
  renameEdge?: (edgeId: string, label: string) => void;
  /**
   * With it, a selected flow's label can be dragged. Called on drag end with the label's centre
   * in flow coordinates, for the host to pass back as `data.labelPosition`.
   */
  moveEdgeLabel?: (edgeId: string, position: Point) => void;
  /** Drill into a collapsed sub-process. */
  view?: (nodeId: string) => void;
  insertOnEdge?: (edgeId: string, position: Point) => void;
  deleteEdge: (edgeId: string) => void;
  /** The whole polyline, docks included, whenever an edit or a node drag changes the route. */
  setWaypoints: (edgeId: string, waypoints: Point[]) => void;
  /**
   * Pointer down on a source handle or its notch. The host tells a click from a drag and runs
   * its own click-to-connect; xyflow still starts a drag connection by itself.
   */
  startConnection?: (nodeId: string, side: Position, event: React.PointerEvent) => void;
  /**
   * Mouse down on the grab handle at either end of a selected flow. The handles only render
   * when this is given; the host runs the reconnect.
   */
  startReconnect?: (edgeId: string, end: 'source' | 'target', event: React.MouseEvent) => void;
}

/** Every user-facing string in the family, for a host to translate. */
export interface BpmnStrings {
  delete: string;
  changeElement: string;
  iteration: string;
  addBoundaryEvent: string;
  addAnnotation: string;
  toggleBreakpoint: string;
  duplicate: string;
  addElement: string;
  view: string;
  editLabel: string;
  breakpoint: string;
  annotationPlaceholder: string;
  edgeLabelPlaceholder: string;
}

export const DEFAULT_BPMN_STRINGS: BpmnStrings = {
  delete: 'Delete',
  changeElement: 'Change element',
  iteration: 'Iteration',
  addBoundaryEvent: 'Add boundary event',
  addAnnotation: 'Add text annotation',
  toggleBreakpoint: 'Toggle breakpoint',
  duplicate: 'Duplicate',
  addElement: 'Add element',
  view: 'View',
  editLabel: 'Edit label',
  breakpoint: 'Breakpoint',
  annotationPlaceholder: 'Add text',
  edgeLabelPlaceholder: 'Add label',
};

const BpmnStringsContext = createContext<BpmnStrings>(DEFAULT_BPMN_STRINGS);

/** Overrides any of the family's strings; the rest stay English. */
export function BpmnStringsProvider({
  strings,
  children,
}: {
  strings?: Partial<BpmnStrings>;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ ...DEFAULT_BPMN_STRINGS, ...strings }), [strings]);
  return <BpmnStringsContext.Provider value={value}>{children}</BpmnStringsContext.Provider>;
}

export const useBpmnStrings = () => useContext(BpmnStringsContext);

/** How the "+" on a handle appears: full size at once, or small until the handle is hovered. */
export type BpmnButtonReveal = 'always' | 'expand-on-hover';
const BpmnButtonRevealContext = createContext<BpmnButtonReveal>('expand-on-hover');
export const BpmnButtonRevealProvider = BpmnButtonRevealContext.Provider;
export const useBpmnButtonReveal = () => useContext(BpmnButtonRevealContext);

export type BpmnButtonShape = 'rounded' | 'circle';
const BpmnButtonShapeContext = createContext<BpmnButtonShape>('circle');
export const BpmnButtonShapeProvider = BpmnButtonShapeContext.Provider;
export const useBpmnButtonShape = () => useContext(BpmnButtonShapeContext);

/** How a node's toolbar and "+" buttons look and sit. Every field is off unless given. */
export interface BpmnControls {
  /**
   * Keeps a selected node's toolbar and "+" buttons from shrinking as the canvas zooms out:
   * they scale by the inverse of the zoom, up to this factor.
   */
  maxZoomScale?: number;
  /** Outlines the "+" buttons of a selected node in the primary colour. */
  selectedButtonOutline?: boolean;
  /** Moves the expanding "+" this many px further out from the node. */
  buttonOutset?: number;
}
const NO_CONTROLS: BpmnControls = {};
const BpmnControlsContext = createContext<BpmnControls>(NO_CONTROLS);
export const BpmnControlsProvider = BpmnControlsContext.Provider;
export const useBpmnControls = () => useContext(BpmnControlsContext);

/**
 * For a host that gives every node and edge its own z-index, so a flow or a neighbour can paint
 * over a node's own parts. With it the toolbar, the "+" and notches, and labels outside the
 * element are drawn in xyflow's viewport portal at this z-index, and flow labels take it too.
 * Pick one above the host's selected flows: xyflow lifts a selected edge by 1000.
 */
export interface BpmnOverlay {
  zIndex: number;
}
const BpmnOverlayContext = createContext<BpmnOverlay | null>(null);
export const BpmnOverlayProvider = BpmnOverlayContext.Provider;
export const useBpmnOverlay = () => useContext(BpmnOverlayContext);

const BpmnActionsContext = createContext<BpmnActions | null>(null);

export const BpmnActionsProvider = BpmnActionsContext.Provider;

export function useBpmnActions(): BpmnActions {
  const actions = useContext(BpmnActionsContext);
  if (!actions) throw new Error('useBpmnActions needs a BpmnActionsProvider');
  return actions;
}
