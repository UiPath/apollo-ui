import type { NodeProps, NodeTypes, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import { type ComponentType, memo, useMemo } from 'react';
import {
  BpmnGlyphEventCompensationCatch,
  BpmnGlyphEventCompensationThrow,
  BpmnGlyphEventConditional,
  BpmnGlyphEventErrorCatch,
  BpmnGlyphEventErrorThrow,
  BpmnGlyphEventEscalationCatch,
  BpmnGlyphEventEscalationThrow,
  BpmnGlyphEventLinkCatch,
  BpmnGlyphEventLinkThrow,
  BpmnGlyphEventMessageCatch,
  BpmnGlyphEventMessageThrow,
  BpmnGlyphEventSignalCatch,
  BpmnGlyphEventSignalThrow,
  BpmnGlyphEventTerminate,
  BpmnGlyphEventTimer,
  BpmnGlyphGatewayComplex,
  BpmnGlyphGatewayEventBased,
  BpmnGlyphGatewayExclusive,
  BpmnGlyphGatewayInclusive,
  BpmnGlyphGatewayParallel,
  BpmnGlyphMarkerParallel,
  BpmnGlyphMarkerSequential,
  BpmnGlyphMarkerSubProcess,
  BpmnGlyphTaskBusinessRule,
  BpmnGlyphTaskManual,
  BpmnGlyphTaskReceive,
  BpmnGlyphTaskScript,
  BpmnGlyphTaskSend,
  BpmnGlyphTaskService,
  BpmnGlyphTaskUser,
} from '../../../icons';
import { cx } from '../../utils/CssUtil';
import { CanvasIcon } from '../../utils/icon-registry';
import { BaseBadgeSlot } from '../BaseNode/BaseNodeBadgeSlot';
import type { NodeOutlinePath } from '../BaseNode/BaseNodeOutline';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import type { ToolbarAction } from '../Toolbar/shared/toolbar.types';
import { BpmnLabel, BpmnNodeShell } from './BpmnNodeShell';
import {
  type BpmnEventDefinition,
  type BpmnNode,
  type BpmnNodeData,
  useBpmnActions,
  useBpmnStrings,
} from './bpmn.model';

type Props = NodeProps<BpmnNode>;

type Glyph = ComponentType<{ size?: string | number }>;

// BPMN's own glyphs, from the apollo icon set. Events differ by catching (outlined) and
// throwing (filled) where the notation does.
const EVENT_GLYPH: Record<BpmnEventDefinition, { catching: Glyph; throwing: Glyph }> = {
  message: { catching: BpmnGlyphEventMessageCatch, throwing: BpmnGlyphEventMessageThrow },
  timer: { catching: BpmnGlyphEventTimer, throwing: BpmnGlyphEventTimer },
  error: { catching: BpmnGlyphEventErrorCatch, throwing: BpmnGlyphEventErrorThrow },
  signal: { catching: BpmnGlyphEventSignalCatch, throwing: BpmnGlyphEventSignalThrow },
  escalation: { catching: BpmnGlyphEventEscalationCatch, throwing: BpmnGlyphEventEscalationThrow },
  compensation: {
    catching: BpmnGlyphEventCompensationCatch,
    throwing: BpmnGlyphEventCompensationThrow,
  },
  conditional: { catching: BpmnGlyphEventConditional, throwing: BpmnGlyphEventConditional },
  link: { catching: BpmnGlyphEventLinkCatch, throwing: BpmnGlyphEventLinkThrow },
  terminate: { catching: BpmnGlyphEventTerminate, throwing: BpmnGlyphEventTerminate },
};

const GATEWAY_GLYPH: Record<string, Glyph> = {
  'bpmn:ExclusiveGateway': BpmnGlyphGatewayExclusive,
  'bpmn:ParallelGateway': BpmnGlyphGatewayParallel,
  'bpmn:InclusiveGateway': BpmnGlyphGatewayInclusive,
  'bpmn:ComplexGateway': BpmnGlyphGatewayComplex,
  'bpmn:EventBasedGateway': BpmnGlyphGatewayEventBased,
};

const TASK_GLYPH: Record<string, Glyph> = {
  'bpmn:UserTask': BpmnGlyphTaskUser,
  'bpmn:ServiceTask': BpmnGlyphTaskService,
  'bpmn:ScriptTask': BpmnGlyphTaskScript,
  'bpmn:SendTask': BpmnGlyphTaskSend,
  'bpmn:ReceiveTask': BpmnGlyphTaskReceive,
  'bpmn:ManualTask': BpmnGlyphTaskManual,
  'bpmn:BusinessRuleTask': BpmnGlyphTaskBusinessRule,
};

const Loop: Glyph = ({ size }) => <CanvasIcon icon="rotate-cw" size={Number(size)} />;
const LOOP_GLYPH: Record<'loop' | 'parallel' | 'sequential', Glyph> = {
  loop: Loop,
  parallel: BpmnGlyphMarkerParallel,
  sequential: BpmnGlyphMarkerSequential,
};

// Flow's 6px inset crowds the label on a 100x80 task.
const BADGE_INSET = 2;
const NO_ADD: Position[] = [];
const EXTERNAL_LABEL = { bottom: 'below', top: 'above', left: 'left', right: 'right' } as const;
const DROP_TARGET = 'outline outline-2 outline-brand';

function useToolbar(kind: 'activity' | 'element' | 'container', data: BpmnNodeData) {
  const actions = useBpmnActions();
  const strings = useBpmnStrings();
  return useMemo<ToolbarAction[]>(() => {
    const remove: ToolbarAction[] = actions.deleteNode
      ? [{ id: 'delete', icon: 'trash-2', label: strings.delete, onAction: actions.deleteNode }]
      : [];
    if (kind === 'container') return remove;

    // An action the host leaves out takes its button with it.
    const leading: ToolbarAction[] = [];
    if (actions.changeElement) {
      leading.push({
        id: 'change-element',
        icon: 'replace',
        label: strings.changeElement,
        onAction: actions.changeElement,
      });
    }
    if (kind === 'activity') {
      if (actions.toggleLoop) {
        leading.push({
          id: 'iteration',
          icon: 'repeat',
          label: strings.iteration,
          isToggled: !!data.loopCharacteristics,
          onAction: actions.toggleLoop,
        });
      }
      if (actions.addBoundaryEvent) {
        leading.push({
          id: 'boundary-event',
          icon: 'circle-dot',
          label: strings.addBoundaryEvent,
          onAction: actions.addBoundaryEvent,
        });
      }
      if (actions.toggleBreakpoint) {
        leading.push({
          id: 'breakpoint',
          icon: 'octagon-pause',
          label: strings.toggleBreakpoint,
          isToggled: !!data.breakpoint,
          onAction: actions.toggleBreakpoint,
        });
      }
    }
    const trailing: ToolbarAction[] = [];
    if (actions.duplicate) {
      trailing.push({
        id: 'duplicate',
        icon: 'copy',
        label: strings.duplicate,
        onAction: actions.duplicate,
      });
    }
    trailing.push(...remove);
    return leading.length && trailing.length
      ? [...leading, { id: 'separator' }, ...trailing]
      : [...leading, ...trailing];
  }, [actions, strings, kind, data.loopCharacteristics, data.breakpoint]);
}

const Ring = ({ className }: { className: string }) => (
  <span
    className={cx('pointer-events-none absolute rounded-[inherit] border-inherit', className)}
  />
);

/** Start, intermediate catch/throw, boundary and end events on `BaseContainer shape="circle"`. */
export const BpmnEventNode = memo(function BpmnEventNode(props: Props) {
  const { id, type, data, selected, dragging, width = 36, height = 36 } = props;
  const isEnd = type === 'bpmn:EndEvent';
  const isIntermediate = !isEnd && type !== 'bpmn:StartEvent';
  const throwing = isEnd || type === 'bpmn:IntermediateThrowEvent';
  const toolbar = useToolbar('element', data);
  const EventGlyph =
    data.eventDefinition && EVENT_GLYPH[data.eventDefinition][throwing ? 'throwing' : 'catching'];

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      shape="circle"
      radius="50%"
      borderStyle={data.nonInterrupting ? 'dashed' : 'solid'}
      addSides={isEnd ? NO_ADD : undefined}
      toolbar={toolbar}
      outside={
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement={EXTERNAL_LABEL[data.labelPlacement ?? 'bottom']}
          selected={selected}
          dragging={dragging}
        />
      }
    >
      {isIntermediate && (
        <Ring className={cx('inset-[2px] border', data.nonInterrupting && 'border-dashed')} />
      )}
      {isEnd && <Ring className="-inset-px border-[3px]" />}
      {EventGlyph && <EventGlyph size={18} />}
    </BpmnNodeShell>
  );
});

const CORNER = 4;

/** A closed polygon with each vertex rounded off by `CORNER`. */
function roundedPolygon(points: [number, number][]) {
  const toward = ([x, y]: [number, number], [tx, ty]: [number, number]) => {
    const length = Math.hypot(tx - x, ty - y);
    return `${x + ((tx - x) / length) * CORNER} ${y + ((ty - y) / length) * CORNER}`;
  };
  return `${points
    .map((point, i) => {
      const before = points[(i + points.length - 1) % points.length]!;
      const after = points[(i + 1) % points.length]!;
      return `${i === 0 ? 'M' : 'L'}${toward(point, before)} Q${point[0]} ${point[1]} ${toward(point, after)}`;
    })
    .join(' ')} Z`;
}

const diamond: NodeOutlinePath = (w, h) =>
  roundedPolygon([
    [w / 2, 0.5],
    [w - 0.5, h / 2],
    [w / 2, h - 0.5],
    [0.5, h / 2],
  ]);

/** Gateways: the diamond is a host-supplied outline, drawn by apollo's `BaseNodeOutline`. */
export const BpmnGatewayNode = memo(function BpmnGatewayNode(props: Props) {
  const { id, type, data, selected, dragging, width = 48, height = 48 } = props;
  const toolbar = useToolbar('element', data);
  const GatewayGlyph = GATEWAY_GLYPH[type] ?? BpmnGlyphGatewayExclusive;

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      outlinePath={diamond}
      toolbar={toolbar}
      outside={
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement={EXTERNAL_LABEL[data.labelPlacement ?? 'bottom']}
          selected={selected}
          dragging={dragging}
        />
      }
    >
      <GatewayGlyph size={20} />
    </BpmnNodeShell>
  );
});

function StatusBadge({ data }: { data: BpmnNodeData }) {
  if (data.modification) {
    const icon = { add: 'plus', update: 'pencil', delete: 'minus' }[data.modification];
    return <CanvasIcon icon={icon} size={14} />;
  }
  if (data.validationStatus) {
    return (
      <CanvasIcon
        icon="triangle-alert"
        size={14}
        color={
          data.validationStatus === 'WARNING'
            ? 'var(--color-warning-icon)'
            : 'var(--color-error-icon)'
        }
      />
    );
  }
  return data.executionStatus ? (
    <ExecutionStatusIcon status={data.executionStatus} size={14} />
  ) : null;
}

/** Tasks, call activity, collapsed and expanded sub-process on `BaseContainer` + `BaseBadgeSlot`. */
export const BpmnActivityNode = memo(function BpmnActivityNode(props: Props) {
  const { id, type, data, selected, dragging, width = 100, height = 80 } = props;
  const isSubProcess = type === 'bpmn:SubProcess';
  const isExpanded = isSubProcess && data.isExpanded === true;
  const isCollapsed = isSubProcess && !isExpanded;
  const toolbar = useToolbar('activity', data);
  const { view } = useBpmnActions();
  const strings = useBpmnStrings();
  const TaskGlyph = TASK_GLYPH[type];
  const LoopGlyph = data.loopCharacteristics && LOOP_GLYPH[data.loopCharacteristics];
  const hasStatus = data.modification || data.validationStatus || data.executionStatus;

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      borderStyle={data.triggeredByEvent ? 'dashed' : 'solid'}
      overlay={
        isCollapsed &&
        view && (
          // As in BPMN today: top-centre, shown while the node is hovered or selected. Sits just
          // below the top handle's "+", which reaches 8px into the node.
          <Button
            size="3xs"
            aria-label={data.label ? `${strings.view} ${data.label}` : strings.view}
            onClick={(event) => {
              event.stopPropagation();
              view(id);
            }}
            className={cx(
              'nodrag nopan pointer-events-auto absolute top-2.5 left-1/2 h-4.5 -translate-x-1/2 gap-0.5 rounded-sm px-1.5 text-[10px] transition-opacity group-hover/bpmn-node:opacity-100',
              selected ? 'opacity-100' : 'opacity-0'
            )}
          >
            {strings.view}
            <CanvasIcon icon="chevron-down" size={10} />
          </Button>
        )
      }
      resizable={isExpanded}
      toolbar={toolbar}
    >
      {type === 'bpmn:CallActivity' && <Ring className="-inset-px border-[3px]" />}
      {isExpanded && data.dropTarget && (
        <span
          data-bpmn-drop-target
          className="pointer-events-none absolute -inset-px rounded-[inherit] border-2 border-brand"
        />
      )}
      {(data.icon || TaskGlyph) && (
        <BaseBadgeSlot position="top-left" inset={BADGE_INSET}>
          {data.icon ?? (TaskGlyph && <TaskGlyph size={16} />)}
        </BaseBadgeSlot>
      )}
      {hasStatus && (
        <BaseBadgeSlot position="top-right" inset={BADGE_INSET}>
          <StatusBadge data={data} />
        </BaseBadgeSlot>
      )}
      {data.mocked && (
        <BaseBadgeSlot position="bottom-left" inset={BADGE_INSET}>
          <CanvasIcon icon="flask-conical" size={14} />
        </BaseBadgeSlot>
      )}
      {data.connected && (
        <BaseBadgeSlot position="bottom-right" inset={BADGE_INSET}>
          <CanvasIcon icon="plug" size={14} />
        </BaseBadgeSlot>
      )}
      <BpmnLabel
        nodeId={id}
        label={data.label}
        placement={isExpanded ? 'top' : 'inside'}
        selected={selected}
        dragging={dragging}
      />
      {(LoopGlyph || isCollapsed) && (
        // No apollo slot for bottom-centre markers yet.
        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1 text-foreground">
          {LoopGlyph && <LoopGlyph size={14} />}
          {isCollapsed && <BpmnGlyphMarkerSubProcess size={14} />}
        </div>
      )}
    </BpmnNodeShell>
  );
});

const FOLD = 10;
const DATA_CORNER = 3;
// One path is stroked in one colour, so the fold is filled by hatching it with strokes: it then
// follows the outline through hover, selection and status.
const foldFill = (w: number) =>
  Array.from({ length: FOLD - 2 }, (_, i) => `M${w - FOLD} ${i + 2} L${w - i - 2} ${FOLD}`).join(
    ' '
  );
const dataObject: NodeOutlinePath = (w, h) => {
  const right = w - 1;
  const bottom = h - 1;
  return (
    `M${1 + DATA_CORNER} 1 H${w - FOLD} L${right} ${FOLD} V${bottom - DATA_CORNER} ` +
    `Q${right} ${bottom} ${right - DATA_CORNER} ${bottom} H${1 + DATA_CORNER} ` +
    `Q1 ${bottom} 1 ${bottom - DATA_CORNER} V${1 + DATA_CORNER} Q1 1 ${1 + DATA_CORNER} 1 Z ` +
    `M${right} ${FOLD} H${w - FOLD} V1 ${foldFill(w)}`
  );
};
// Control points sit 2px outside the box so each arc peaks exactly on its edge.
// Drawn right to left: an open subpath is closed for filling, and wound the other way that
// closure would cut the area above the band out of the fill.
const storeBand = (w: number, y: number) => `M${w - 1} ${y} C${w - 1} ${y + 8} 1 ${y + 8} 1 ${y}`;
const dataStore: NodeOutlinePath = (w, h) =>
  `M1 7 C1 -1 ${w - 1} -1 ${w - 1} 7 V${h - 7} C${w - 1} ${h + 1} 1 ${h + 1} 1 ${h - 7} Z ` +
  `${storeBand(w, 7)} ${storeBand(w, h / 2)}`;

/** Data object, input, output and store: borderless shapes via a host-supplied outline. */
export const BpmnDataNode = memo(function BpmnDataNode(props: Props) {
  const { id, type, data, selected, dragging, width = 36, height = 50 } = props;
  const toolbar = useToolbar('element', data);
  const direction = type === 'bpmn:DataInput' || type === 'bpmn:DataOutput';

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      outlinePath={type === 'bpmn:DataStoreReference' ? dataStore : dataObject}
      addSides={NO_ADD}
      toolbar={toolbar}
      outside={
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement={EXTERNAL_LABEL[data.labelPlacement ?? 'bottom']}
          selected={selected}
          dragging={dragging}
        />
      }
    >
      {direction && (
        <span className="absolute top-1 left-1">
          <CanvasIcon
            icon="arrow-big-right"
            size={12}
            fill={type === 'bpmn:DataOutput' ? 'currentColor' : undefined}
          />
        </span>
      )}
    </BpmnNodeShell>
  );
});

const selectedOutline = 'outline outline-2 outline-foreground-accent-muted';

/** Text annotation: no apollo card applies, so only handles, toolbar and label are shared. */
export const BpmnTextAnnotationNode = memo(function BpmnTextAnnotationNode(props: Props) {
  const { id, data, selected, dragging, width = 100, height = 40 } = props;
  const toolbar = useToolbar('container', data);
  const strings = useBpmnStrings();

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      frame={false}
      addSides={NO_ADD}
      toolbar={toolbar}
    >
      <div className={cx('relative h-full w-full rounded-sm', selected && selectedOutline)}>
        <span className="absolute inset-y-0 left-0 w-2 rounded-l-sm border-y border-l border-foreground-muted" />
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement="annotation"
          selected={selected}
          dragging={dragging}
          multiline
          placeholder={strings.annotationPlaceholder}
        />
      </div>
    </BpmnNodeShell>
  );
});

/** Group: a dashed frame with apollo's border and selection tokens. */
export const BpmnGroupNode = memo(function BpmnGroupNode(props: Props) {
  const { id, data, selected, dragging, width = 300, height = 300 } = props;
  const toolbar = useToolbar('container', data);

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      frame={false}
      connectable={false}
      resizable
      toolbar={toolbar}
    >
      <div
        className={cx(
          'h-full w-full rounded-xl border-2 border-dashed border-foreground-muted',
          selected && selectedOutline
        )}
      >
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement="top-left"
          selected={selected}
          dragging={dragging}
        />
      </div>
    </BpmnNodeShell>
  );
});

/**
 * Pool and lane: transparent bands, so the canvas shows through and only the borders and header
 * read. apollo has no band container, so these are drawn with its border tokens; handles (message
 * flows), toolbar, resize and label editing are the shared parts.
 */
export const BpmnSwimlaneNode = memo(function BpmnSwimlaneNode(props: Props) {
  const { id, type, data, selected, dragging, width = 600, height = 250 } = props;
  const isPool = type === 'bpmn:Participant';
  const toolbar = useToolbar('container', data);
  const vertical = data.isHorizontal === false;
  const blackBox = isPool && data.isEmpty === true;
  const divided = !isPool && (data.laneIndex ?? 0) > 0;

  return (
    <BpmnNodeShell
      id={id}
      data={data}
      selected={selected}
      dragging={dragging}
      width={width}
      height={height}
      frame={false}
      connectable={isPool}
      addSides={NO_ADD}
      resizable={isPool}
      toolbar={toolbar}
      toolbarOnHover={false}
    >
      <div
        data-bpmn-drop-target={data.dropTarget || undefined}
        className={cx(
          'relative flex h-full w-full border-foreground-muted',
          vertical && 'flex-col',
          isPool && 'rounded-lg border',
          // Each lane is alone in its shell, so the divider comes from its index, not a sibling.
          divided && (vertical ? 'border-l' : 'border-t'),
          selected && selectedOutline,
          selected && !isPool && 'bg-foreground-accent-muted/5',
          data.dropTarget && DROP_TARGET
        )}
      >
        {blackBox ? (
          <BpmnLabel
            nodeId={id}
            label={data.label}
            placement="center"
            selected={selected}
            dragging={dragging}
          />
        ) : (
          <div
            className={cx(
              'shrink-0 border-foreground-muted',
              vertical ? 'h-7 border-b' : 'w-7 border-r'
            )}
          >
            <BpmnLabel
              nodeId={id}
              label={data.label}
              placement={vertical ? 'header-top' : 'header'}
              selected={selected}
              dragging={dragging}
            />
          </div>
        )}
        {isPool && data.multiplicity && (
          <span
            data-bpmn-multiplicity
            className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-foreground"
          >
            <BpmnGlyphMarkerParallel size={14} />
          </span>
        )}
      </div>
    </BpmnNodeShell>
  );
});

const eventTypes = [
  'bpmn:StartEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:BoundaryEvent',
  'bpmn:EndEvent',
];
const activityTypes = [
  'bpmn:Task',
  ...Object.keys(TASK_GLYPH),
  'bpmn:CallActivity',
  'bpmn:SubProcess',
];
const dataTypes = [
  'bpmn:DataObjectReference',
  'bpmn:DataStoreReference',
  'bpmn:DataInput',
  'bpmn:DataOutput',
];

const register = (types: string[], component: NodeTypes[string]) =>
  Object.fromEntries(types.map((type) => [type, component]));

/** Keyed by BPMN `$type`, as PO.Frontend's `ElementTypesProvider` registers them. */
export const bpmnNodeTypes: NodeTypes = {
  ...register(eventTypes, BpmnEventNode),
  ...register(Object.keys(GATEWAY_GLYPH), BpmnGatewayNode),
  ...register(activityTypes, BpmnActivityNode),
  ...register(dataTypes, BpmnDataNode),
  ...register(['bpmn:Participant', 'bpmn:Lane'], BpmnSwimlaneNode),
  'bpmn:TextAnnotation': BpmnTextAnnotationNode,
  'bpmn:Group': BpmnGroupNode,
};

export const BPMN_TASK_TYPES = ['bpmn:Task', ...Object.keys(TASK_GLYPH)];
export const BPMN_GATEWAY_TYPES = Object.keys(GATEWAY_GLYPH);
