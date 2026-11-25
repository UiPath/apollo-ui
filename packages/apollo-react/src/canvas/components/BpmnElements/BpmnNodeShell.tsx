import {
  Position,
  type ReactFlowState,
  useStore,
  ViewportPortal,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/CssUtil';
import { resolveNodeHandleAffordances, selectIsConnecting } from '../../utils/NodeUtils';
import { useBaseCanvasModeOr, useSelectionState } from '../BaseCanvas';
import { BaseContainer } from '../BaseNode/BaseNodeContainer';
import type { NodeOutlinePath } from '../BaseNode/BaseNodeOutline';
import { useInlineLabelEditing } from '../BaseNode/useInlineLabelEditing';
import {
  ButtonHandle,
  type ButtonHandleHandleProps,
  type HandleActionEvent,
} from '../ButtonHandle';
import { HandleHoverBridge } from '../ButtonHandle/HandleButton';
import { ResizeControls } from '../ContainerNode/ContainerNodeParts';
import { NodeToolbar } from '../Toolbar/NodeToolbar';
import type { ToolbarAction } from '../Toolbar/shared/toolbar.types';
import {
  type BpmnNodeData,
  bpmnHandleId,
  bpmnHandleSide,
  useBpmnActions,
  useBpmnControls,
  useBpmnOverlay,
  useBpmnStrings,
} from './bpmn.model';

const SIDES = [Position.Left, Position.Right, Position.Top, Position.Bottom];
// BPMN offers "+" on every side but the incoming one.
const DEFAULT_ADD_SIDES = [Position.Top, Position.Right, Position.Bottom];
const NO_SIDES: Position[] = [];
// The toolbar rests 12px off the node; the expanded top "+" reaches 20px (circle) or 30px
// (rounded) out. The always-on button takes apollo's own unlabeled-button offset instead.
const TOOLBAR_OFFSET = { circle: 12, rounded: 26 } as const;
// Hover bridge reach: just past the expanded "+", instead of the 60px a labelled Flow handle needs.
const BRIDGE_EXTENT = { circle: 28, rounded: 38 } as const;
// The expanded "+" is 28px across, so each unit of scale pushes its far edge that much further.
const BUTTON_SIZE = 28;
const selectZoom = (state: ReactFlowState) => state.transform[2];
const selectNoZoom = () => 1;
// The side of this node a dragged connection would end on, if it can.
const selectTargetSide = (nodeId: string) => (state: ReactFlowState) => {
  const { inProgress, toHandle, isValid } = state.connection;
  return inProgress && isValid && toHandle?.nodeId === nodeId
    ? bpmnHandleSide(toHandle.id)
    : undefined;
};
// As BPMN fills elements today: the canvas background, a step darker than Flow's raised card in
// dark themes, and slightly translucent so an overlapped element's outline still shows through.
const ELEMENT_FILL = 'color-mix(in srgb, var(--canvas-background) 92%, transparent)';
const noop = () => {};
// Flow's container minimums are sized for its cards and would snap a small BPMN element up.
const DEFAULT_RESIZE_MINIMUMS = { width: 60, height: 40 };
// Important, since the button's own rest and hover border colours are equally specific.
const SELECTED_BUTTON_OUTLINE = 'border-(color:--canvas-primary)!';
// A target takes a drop anywhere on its quarter of the node, but never starts a connection, so
// xyflow leaves it inert and the body draggable until one is in progress.
const TARGET_HANDLE_PROPS = { isConnectableStart: false } as const;
// Keeps a source's strip from shadowing the target underneath it while a connection is dragged.
const SOURCE_HANDLE_PROPS = { isConnectableEnd: false } as const;

// A host-driven state only sets these variables, which the border, fill, label and glyphs read:
// one rule colours every part, in the node and in its overlay, and a host stylesheet can
// override it.
const GLYPH_TINT = 'text-(color:--bpmn-element-icon)';
// What each state sets, and so which of the element's own colours it replaces. Written out in
// full, since Tailwind only generates the classes it finds in the source.
const TINT = {
  primary: {
    className: `[--bpmn-element-border:var(--canvas-primary)] [--bpmn-element-foreground:var(--canvas-primary)] [--bpmn-element-icon:var(--canvas-primary)] [--bpmn-element-fill:color-mix(in_srgb,var(--canvas-primary)_5%,var(--canvas-background,var(--color-background)))] ${GLYPH_TINT}`,
    border: true,
    fill: true,
  },
  success: {
    className: `[--bpmn-element-border:var(--canvas-success-icon)] [--bpmn-element-foreground:var(--canvas-success-icon)] [--bpmn-element-icon:var(--canvas-success-icon)] [--bpmn-element-fill:color-mix(in_srgb,var(--canvas-success-icon)_5%,var(--canvas-background,var(--color-background)))] ${GLYPH_TINT}`,
    border: true,
    fill: true,
  },
  error: {
    className: `[--bpmn-element-border:var(--canvas-error-text)] [--bpmn-element-foreground:var(--canvas-error-text)] [--bpmn-element-icon:var(--canvas-error-text)] [--bpmn-element-fill:color-mix(in_srgb,var(--canvas-error-text)_10%,var(--canvas-background,var(--color-background)))] ${GLYPH_TINT}`,
    border: true,
    fill: true,
  },
  wash: {
    className: '[--bpmn-element-fill:color-mix(in_srgb,var(--canvas-primary)_10%,transparent)]',
    border: false,
    fill: true,
  },
  ring: { className: '[--bpmn-element-border:var(--canvas-primary)]', border: true, fill: false },
} as const;
const DROP_TINT = { invalid: 'error', valid: 'wash', 'valid-border': 'ring' } as const;
const CONNECTION_TINT = { target: 'primary', 'target-picked': 'success' } as const;
// Important, since handles set their own pointer events.
const UNAVAILABLE = 'opacity-30 delay-100 pointer-events-none [&_*]:pointer-events-none!';
/** What an element's parts read, each falling back to its own colour with no state on. */
export const ELEMENT_BORDER =
  'border-[color:var(--bpmn-element-border,var(--color-foreground-muted))]';
export const ELEMENT_FOREGROUND =
  'text-[color:var(--bpmn-element-foreground,var(--color-foreground))]';
export const ELEMENT_GLYPH = 'text-[color:var(--bpmn-element-icon,var(--color-foreground))]';
/** For elements with no card. Only while a state is on, so it does not fight a selection fill. */
export const ELEMENT_STATE_FILL = 'bg-(--bpmn-element-fill)';

/** How the host's connection and drop states show on an element. A drop state wins. */
export function resolveElementState({ connectionState, dropState }: BpmnNodeData) {
  const key = dropState
    ? DROP_TINT[dropState]
    : connectionState === 'target' || connectionState === 'target-picked'
      ? CONNECTION_TINT[connectionState]
      : undefined;
  const tint = key && TINT[key];
  return {
    tintsBorder: !!tint?.border,
    tintsFill: !!tint?.fill,
    ring: key === 'ring',
    // No toolbar or "+" on an element the connection can end on, or cannot use.
    quiet: !!connectionState && connectionState !== 'anchor',
    className: cx(tint?.className, !dropState && connectionState === 'unavailable' && UNAVAILABLE),
  };
}

/**
 * The node's overlay element while the host opted into `BpmnOverlayProvider`: `null` until it is
 * mounted, `undefined` with no opt-in.
 */
const NodeOverlayContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * A box of the node's size at its absolute position in xyflow's viewport portal, which shares
 * the nodes' and edges' stacking context. What is rendered into it lays out as it does in the
 * node, and stays a React descendant of it, so hover and clicks reach the node as before.
 */
function NodeOverlay({
  nodeId,
  selected,
  data,
  stateClassName,
  zIndex,
  width,
  height,
  elementRef,
  children,
}: {
  nodeId: string;
  selected?: boolean;
  data: BpmnNodeData;
  stateClassName?: string;
  zIndex: number;
  width: number;
  height: number;
  elementRef: (element: HTMLDivElement | null) => void;
  children?: React.ReactNode;
}) {
  const x = useStore(
    (state: ReactFlowState) => state.nodeLookup.get(nodeId)?.internals.positionAbsolute.x
  );
  const y = useStore(
    (state: ReactFlowState) => state.nodeLookup.get(nodeId)?.internals.positionAbsolute.y
  );
  if (x === undefined || y === undefined) return null;
  return (
    <ViewportPortal>
      <div
        ref={elementRef}
        data-bpmn-node-overlay={nodeId}
        // The box is outside the node's element, so its `selected` class does not reach it.
        data-node-selected={selected ? 'true' : 'false'}
        data-connection-state={data.connectionState}
        data-drop-state={data.dropState}
        className={cx(
          'pointer-events-none absolute transition-opacity duration-100',
          stateClassName
        )}
        style={{ left: x, top: y, width, height, zIndex }}
      >
        {children}
      </div>
    </ViewportPortal>
  );
}

export interface BpmnNodeShellProps {
  id: string;
  data: BpmnNodeData;
  selected?: boolean;
  dragging?: boolean;
  width: number;
  height: number;
  /** `false` renders `children` as the whole node, for elements with no card (pool, group). */
  frame?: boolean;
  shape?: 'circle' | 'square';
  radius?: string;
  outlinePath?: NodeOutlinePath;
  borderStyle?: 'solid' | 'dashed';
  isStacked?: boolean;
  connectable?: boolean;
  /** Sides whose source handle carries the "+" add button. */
  addSides?: Position[];
  toolbar?: ToolbarAction[];
  toolbarAlign?: 'start' | 'center' | 'end';
  /** `false` shows the toolbar only while selected, for elements too large to hover usefully. */
  toolbarOnHover?: boolean;
  resizable?: boolean;
  /** Rendered beside the card instead of inside it: external labels, breakpoints. */
  outside?: React.ReactNode;
  /** Laid over the card via `BaseContainer`'s overlay slot. */
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * What every BPMN renderer shares, composed from apollo primitives: `BaseContainer` for the card
 * and its rest/hover/selected/status states, `ButtonHandle` for handles and the "+" (anchored on
 * the node, so edges end on its border and a connection can be dropped anywhere on it),
 * `resolveNodeHandleAffordances` for when they show, and `NodeToolbar` for actions.
 *
 * Nothing here reads a manifest or writes the xyflow store.
 */
// Not memoised: every caller passes fresh children, so a memo would never skip a render.
export function BpmnNodeShell({
  id,
  data,
  selected = false,
  dragging = false,
  width,
  height,
  frame = true,
  shape = 'square',
  radius = '12px',
  outlinePath,
  borderStyle,
  isStacked,
  connectable = true,
  addSides = DEFAULT_ADD_SIDES,
  toolbar,
  toolbarAlign = 'center',
  toolbarOnHover = true,
  resizable,
  outside,
  overlay,
  children,
}: BpmnNodeShellProps) {
  const [hovered, setHovered] = useState(false);
  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();
  const canEdit = useBaseCanvasModeOr('design') === 'design';
  const { addAfter, startConnection, resize } = useBpmnActions();
  const strings = useBpmnStrings();
  const lifted = useBpmnOverlay();
  const {
    buttonReveal = 'expand-on-hover',
    buttonShape = 'circle',
    maxZoomScale,
    selectedButtonOutline,
    buttonOutset = 0,
    resizeMinimums = DEFAULT_RESIZE_MINIMUMS,
  } = useBpmnControls();
  const handleStyle = buttonReveal === 'always' ? 'always' : buttonShape;
  const resizeLimits = useMemo(
    () => ({
      left: resizeMinimums.width,
      right: resizeMinimums.width,
      top: resizeMinimums.height,
      bottom: resizeMinimums.height,
    }),
    [resizeMinimums.width, resizeMinimums.height]
  );
  // Only a selected node follows the zoom, so zooming re-renders that node alone.
  const zoom = useStore(selected && maxZoomScale ? selectZoom : selectNoZoom);
  const controlScale = Math.min(Math.max(1 / zoom, 1), maxZoomScale ?? 1);
  // How much further the expanded "+" reaches than the constants above assume.
  const extraReach = handleStyle === 'always' ? 0 : buttonOutset + BUTTON_SIZE * (controlScale - 1);
  const [overlayElement, setOverlayElement] = useState<HTMLDivElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const state = resolveElementState(data);
  const selectTarget = useMemo(() => selectTargetSide(id), [id]);
  const draggedTo = useStore(selectTarget);
  // The visible notch is the source handle's: the target handle that takes the drop has none.
  const targetSide = draggedTo ?? data.connectionSide;

  const affordances = resolveNodeHandleAffordances({
    isConnecting,
    selected,
    hovered,
    dragging,
    canEdit,
    multipleNodesSelected,
  });
  // A connection the host runs is unknown to xyflow, so its targets show their notches here.
  const shouldShowHandles =
    affordances.shouldShowHandles ||
    data.connectionState === 'target' ||
    data.connectionState === 'target-picked';
  const isAddButtonVisible = affordances.isAddButtonVisible && !state.quiet;

  const onAdd = useCallback(
    (event: HandleActionEvent) => addAfter(event.nodeId, event.position),
    [addAfter]
  );

  const style = {
    width,
    height,
    '--node-w': `${width}px`,
    '--node-h': `${height}px`,
    '--node-radius': radius,
  } as React.CSSProperties;

  const onResize = useCallback(
    (_event: unknown, size: { width: number; height: number }) =>
      resize?.(id, { width: size.width, height: size.height }),
    [id, resize]
  );

  const toolbarConfig = useMemo(
    () =>
      // Every toolbar action edits the diagram, so there is none outside design mode.
      canEdit && toolbar?.length
        ? {
            actions: toolbar,
            position: 'top' as const,
            align: toolbarAlign,
            testId: 'node-toolbar',
          }
        : null,
    [canEdit, toolbar, toolbarAlign]
  );

  const sidesWithAdd = canEdit ? addSides : NO_SIDES;

  const sourceHandleProps = useMemo(
    () =>
      Object.fromEntries(
        SIDES.map((side) => [
          side,
          // Connecting edits the diagram, so the host is only told in design mode.
          startConnection && canEdit
            ? {
                ...SOURCE_HANDLE_PROPS,
                onPointerDown: (event: React.PointerEvent) => startConnection(id, side, event),
              }
            : SOURCE_HANDLE_PROPS,
        ])
      ) as Record<Position, ButtonHandleHandleProps>,
    [id, startConnection, canEdit]
  );

  const toolbarNode = toolbarConfig && (
    <NodeToolbar
      nodeId={id}
      config={toolbarConfig}
      expanded={selected || (toolbarOnHover && hovered)}
      hidden={dragging || multipleNodesSelected || state.quiet}
      // Sits 8px above the expanded "+" on the top handle.
      offsetToolbar={
        isAddButtonVisible && sidesWithAdd.includes(Position.Top)
          ? handleStyle === 'always'
            ? 'button-only'
            : TOOLBAR_OFFSET[handleStyle] + extraReach
          : false
      }
      // Only with zoom scaling on, since a scaled toolbar gives up its layout animation.
      scale={maxZoomScale ? controlScale : undefined}
    />
  );
  // `undefined` leaves each part where it renders by default.
  const overlayContainer = lifted ? overlayElement : undefined;
  // The handles' visuals go in the overlay or, without one, in this node's own element: one
  // lookup here instead of one per handle.
  const handleVisuals = lifted ? overlayElement : rootElement;

  return (
    <NodeOverlayContext.Provider value={overlayContainer}>
      <div
        ref={setRootElement}
        data-connection-state={data.connectionState}
        data-drop-state={data.dropState}
        className={cx('group/bpmn-node relative transition-opacity duration-100', state.className)}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {frame ? (
          <BaseContainer
            shape={shape}
            isSelected={selected}
            isHovered={hovered}
            isStacked={isStacked}
            interactionState={
              dragging ? 'drag' : selected ? 'selected' : hovered ? 'hover' : 'default'
            }
            // A tinted border stands in for the status colours while the state is on.
            executionStatus={state.tintsBorder ? undefined : data.executionStatus}
            validationStatus={state.tintsBorder ? undefined : data.validationStatus}
            suggestionType={state.tintsBorder ? undefined : data.modification}
            background={
              state.tintsFill ? 'var(--bpmn-element-fill)' : (data.backgroundColor ?? ELEMENT_FILL)
            }
            borderColor={state.tintsBorder ? 'var(--bpmn-element-border)' : undefined}
            outlinePath={outlinePath}
            borderStyle={borderStyle}
            // BPMN borders carry meaning (event and activity kinds), so they read darker than Flow's.
            borderTone="strong"
            overlay={overlay}
          >
            {children}
          </BaseContainer>
        ) : (
          children
        )}
        {outside}
        {state.ring && (
          <span
            data-bpmn-drop-ring
            className="pointer-events-none absolute -inset-0.5 rounded-[calc(var(--node-radius)+2px)] border-2 border-(color:--canvas-primary)"
          />
        )}
        {data.breakpoint && (
          <span
            role="img"
            aria-label={strings.breakpoint}
            className="absolute -top-1.5 -left-1.5 z-10 size-2.5 rounded-full bg-error"
          />
        )}
        {lifted ? (
          <NodeOverlay
            nodeId={id}
            selected={selected}
            data={data}
            stateClassName={state.className}
            zIndex={lifted.zIndex}
            width={width}
            height={height}
            elementRef={setOverlayElement}
          >
            {toolbarNode}
          </NodeOverlay>
        ) : (
          toolbarNode
        )}
        {/* Only with a host `resize`, so a host that draws its own resizers gets no second set. */}
        {resizable && selected && canEdit && resize && (
          <ResizeControls
            minimums={resizeLimits}
            onResize={onResize}
            onResizeStart={noop}
            onResizeEnd={noop}
          />
        )}
        {/* Keeps hover alive across the gap between the node and its "+" / toolbar. */}
        {connectable &&
          sidesWithAdd.map((side) => (
            <HandleHoverBridge
              key={`bridge-${side}`}
              position={side}
              visible={isAddButtonVisible}
              extent={
                handleStyle === 'always' ? undefined : BRIDGE_EXTENT[handleStyle] + extraReach
              }
            />
          ))}
        {connectable &&
          SIDES.map((side) => (
            <ButtonHandle
              key={`target-${side}`}
              id={bpmnHandleId(id, 'target', side)}
              nodeId={id}
              type="target"
              position={side}
              handleType="input"
              anchor="node"
              hitRegion="quadrant"
              showNotches={false}
              handleProps={TARGET_HANDLE_PROPS}
              visualsContainer={handleVisuals}
            />
          ))}
        {connectable &&
          SIDES.map((side) => (
            <ButtonHandle
              key={`source-${side}`}
              id={bpmnHandleId(id, 'source', side)}
              nodeId={id}
              type="source"
              position={side}
              handleType="output"
              visible={shouldShowHandles}
              showButton={isAddButtonVisible && sidesWithAdd.includes(side)}
              selected={selected}
              highlighted={side === targetSide}
              anchor="node"
              hitRegion="strip"
              handleProps={sourceHandleProps[side]}
              buttonReveal={buttonReveal}
              buttonShape={buttonShape}
              onAction={sidesWithAdd.includes(side) ? onAdd : undefined}
              addButtonTestId={`quick-add-handle-${id}-${side}`}
              addButtonAriaLabel={strings.quickAdd}
              addButtonClassName={
                selectedButtonOutline && selected ? SELECTED_BUTTON_OUTLINE : undefined
              }
              buttonOutset={buttonOutset}
              buttonScale={controlScale}
              visualsContainer={handleVisuals}
            />
          ))}
      </div>
    </NodeOverlayContext.Provider>
  );
}

const LABEL_PLACEMENT = {
  // 4px each side, as BPMN's own task label, so a short name stays on one line.
  inside: 'flex w-full flex-1 items-center justify-center px-1 text-center',
  below:
    'absolute top-full left-1/2 z-10 mt-1 flex w-28 -translate-x-1/2 justify-center text-center',
  above:
    'absolute bottom-full left-1/2 z-10 mb-1 flex w-28 -translate-x-1/2 justify-center text-center',
  left: 'absolute top-1/2 right-full z-10 mr-1 flex w-28 -translate-y-1/2 justify-end text-right',
  right: 'absolute top-1/2 left-full z-10 ml-1 flex w-28 -translate-y-1/2 justify-start text-left',
  top: 'absolute inset-x-8 top-2 flex justify-center text-center',
  'top-left': 'absolute top-1.5 left-3 text-left',
  annotation: 'flex h-full w-full items-center pl-3 text-left',
  header: 'flex h-full w-full items-center justify-center [writing-mode:vertical-rl] rotate-180',
  'header-top': 'flex h-full w-full items-center justify-center overflow-hidden px-2',
  center: 'flex h-full w-full items-center justify-center px-2 text-center',
} as const;

const OUTSIDE_PLACEMENTS: ReadonlySet<string> = new Set(['below', 'above', 'left', 'right']);
// An outline in the canvas colour, as BPMN labels carry today, keeps a label readable over a flow.
const LABEL_HALO = {
  WebkitTextStroke: '4px var(--canvas-background, var(--color-background))',
  paintOrder: 'stroke fill',
} as const;

/**
 * BPMN label built on apollo's `useInlineLabelEditing`. `NodeLabel` itself only lays out as
 * "beside the icon" or "below at 150% of the node's width", neither of which fits a 100x80 task
 * or a 36px event, so the hook is the reusable part.
 */
export const BpmnLabel = memo(function BpmnLabel({
  nodeId,
  label = '',
  placement,
  selected,
  dragging,
  multiline = false,
  placeholder,
}: {
  nodeId: string;
  label?: string;
  placement: keyof typeof LABEL_PLACEMENT;
  selected?: boolean;
  dragging?: boolean;
  /** Enter adds a line instead of committing, and the text wraps without a line limit. */
  multiline?: boolean;
  /** Shown muted in place of an empty label on an editable canvas. */
  placeholder?: string;
}) {
  const { rename } = useBpmnActions();
  const strings = useBpmnStrings();
  const readonly = useBaseCanvasModeOr('design') !== 'design';
  const onChange = useCallback(
    (values: { label: string }) => rename(nodeId, values.label),
    [nodeId, rename]
  );
  const edit = useInlineLabelEditing({
    label,
    subLabel: '',
    selected,
    dragging,
    readonly,
    onChange,
  });

  const { handleKeyDown, setLocalLabel } = edit;
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Plain Enter commits, as in a single-line label; Shift or Alt with it adds a line.
      if (!multiline || event.key !== 'Enter' || !(event.shiftKey || event.altKey)) {
        handleKeyDown(event);
        return;
      }
      // Kept from the canvas. A textarea adds the line for Shift+Enter but not for Alt+Enter.
      event.stopPropagation();
      if (event.shiftKey) return;
      event.preventDefault();
      const textarea = event.currentTarget;
      textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end');
      setLocalLabel(textarea.value);
    },
    [multiline, handleKeyDown, setLocalLabel]
  );
  // The hook skips the save when focus moves to its sub-label input, and with none mounted it
  // reads focus leaving for nowhere as that case. Name the document so the blur commits.
  const { handleBlur } = edit;
  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) =>
      handleBlur(
        event.relatedTarget
          ? event
          : { ...event, relatedTarget: event.currentTarget.ownerDocument.body }
      ),
    [handleBlur]
  );
  const showPlaceholder = !label && !!placeholder && !readonly;
  const outside = OUTSIDE_PLACEMENTS.has(placement);
  const overlayElement = useContext(NodeOverlayContext);
  const lifted = outside && overlayElement !== undefined;

  const editor = (
    <textarea
      ref={edit.labelInputRef}
      value={edit.localLabel}
      rows={1}
      aria-label={strings.editLabel}
      onChange={(event) => edit.setLocalLabel(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      // A host's node menu stays closed during an edit; the browser's own still opens.
      onContextMenu={(event) => event.stopPropagation()}
      className="nodrag nopan nowheel pointer-events-auto field-sizing-content max-w-full resize-none rounded-sm border-none bg-transparent px-1 font-[inherit] text-xs leading-4 font-semibold text-foreground outline-1 outline-dashed outline-border-de-emp"
    />
  );
  const textClassName = cx(
    'text-xs leading-4 font-semibold',
    showPlaceholder ? 'text-foreground-muted' : ELEMENT_FOREGROUND,
    placement === 'header' || placement === 'header-top'
      ? 'whitespace-nowrap'
      : multiline
        ? 'whitespace-pre-wrap wrap-break-word'
        : 'line-clamp-3 wrap-break-word',
    // An empty label still needs somewhere to double-click to add one.
    !label && !showPlaceholder && !readonly && 'min-h-4 min-w-12'
  );
  const text = showPlaceholder ? placeholder : label;
  const textStyle = outside ? LABEL_HALO : undefined;

  if (!lifted) {
    return (
      <div data-node-part="label" className={LABEL_PLACEMENT[placement]}>
        {edit.isEditing ? (
          editor
        ) : (
          <div
            onDoubleClick={readonly ? undefined : edit.handleDoubleClick(edit.labelInputRef)}
            className={textClassName}
            style={textStyle}
          >
            {text}
          </div>
        )}
      </div>
    );
  }

  // The label in the node stays the one to click, drag and double-click, unseen; what is read
  // and typed into is drawn in the overlay, above any flow that crosses it.
  return (
    <>
      <div data-node-part="label" className={LABEL_PLACEMENT[placement]}>
        <div
          onDoubleClick={readonly ? undefined : edit.handleDoubleClick(edit.labelInputRef)}
          className={cx(textClassName, 'opacity-0')}
        >
          {text}
        </div>
      </div>
      {overlayElement &&
        createPortal(
          <div
            data-bpmn-label-overlay={nodeId}
            aria-hidden={edit.isEditing ? undefined : true}
            className={LABEL_PLACEMENT[placement]}
          >
            {edit.isEditing ? (
              editor
            ) : (
              <div className={textClassName} style={textStyle}>
                {text}
              </div>
            )}
          </div>,
          overlayElement
        )}
    </>
  );
});
