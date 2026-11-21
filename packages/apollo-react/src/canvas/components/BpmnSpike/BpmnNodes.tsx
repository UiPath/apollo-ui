import { type NodeProps, type NodeTypes, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
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
  useBpmnSpikeActions,
} from './bpmnSpike.model';

type Props = NodeProps<BpmnNode>;

// Lucide stand-ins. PO.Frontend would pass its own BPMN glyph components here.
const EVENT_GLYPH: Record<BpmnEventDefinition, string> = {
  message: 'mail',
  timer: 'clock',
  error: 'zap',
  signal: 'triangle',
  escalation: 'chevrons-up',
  compensation: 'rewind',
  conditional: 'list',
  link: 'arrow-right',
  terminate: 'circle',
};

const GATEWAY_GLYPH: Record<string, string> = {
  'bpmn:ExclusiveGateway': 'x',
  'bpmn:ParallelGateway': 'plus',
  'bpmn:InclusiveGateway': 'circle',
  'bpmn:ComplexGateway': 'asterisk',
  'bpmn:EventBasedGateway': 'pentagon',
};

const TASK_GLYPH: Record<string, string> = {
  'bpmn:UserTask': 'user',
  'bpmn:ServiceTask': 'settings',
  'bpmn:ScriptTask': 'scroll-text',
  'bpmn:SendTask': 'send',
  'bpmn:ReceiveTask': 'mail',
  'bpmn:ManualTask': 'hand',
  'bpmn:BusinessRuleTask': 'table',
};

const LOOP_GLYPH = { loop: 'repeat', parallel: 'tally-3', sequential: 'menu' } as const;

// Flow's 6px inset crowds the label on a 100x80 task.
const BADGE_INSET = 2;
const NO_ADD: Position[] = [];
const ADD_RIGHT = [Position.Right];

function useToolbar(kind: 'activity' | 'element' | 'container', data: BpmnNodeData) {
  const actions = useBpmnSpikeActions();
  return useMemo<ToolbarAction[]>(() => {
    const remove: ToolbarAction = {
      id: 'delete',
      icon: 'trash-2',
      label: 'Delete',
      onAction: actions.deleteNode,
    };
    if (kind === 'container') return [remove];
    const change: ToolbarAction = {
      id: 'change-element',
      icon: 'replace',
      label: 'Change element',
      onAction: actions.changeElement,
    };
    const duplicate: ToolbarAction = {
      id: 'duplicate',
      icon: 'copy',
      label: 'Duplicate',
      onAction: actions.duplicate,
    };
    if (kind === 'element') return [change, { id: 'separator' }, duplicate, remove];
    return [
      change,
      {
        id: 'iteration',
        icon: 'repeat',
        label: 'Iteration',
        isToggled: !!data.loopCharacteristics,
        onAction: actions.toggleLoop,
      },
      {
        id: 'boundary-event',
        icon: 'circle-dot',
        label: 'Add boundary event',
        onAction: actions.addBoundaryEvent,
      },
      {
        id: 'breakpoint',
        icon: 'octagon-pause',
        label: 'Toggle breakpoint',
        isToggled: !!data.breakpoint,
        onAction: actions.toggleBreakpoint,
      },
      { id: 'separator' },
      duplicate,
      remove,
    ];
  }, [actions, kind, data.loopCharacteristics, data.breakpoint]);
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
      addSides={isEnd ? NO_ADD : ADD_RIGHT}
      toolbar={toolbar}
      outside={
        <BpmnLabel
          nodeId={id}
          label={data.label}
          placement="below"
          selected={selected}
          dragging={dragging}
        />
      }
    >
      {isIntermediate && (
        <Ring className={cx('inset-[2px] border', data.nonInterrupting && 'border-dashed')} />
      )}
      {isEnd && <Ring className="-inset-px border-[3px]" />}
      {data.eventDefinition && (
        <CanvasIcon
          icon={EVENT_GLYPH[data.eventDefinition]}
          size={16}
          fill={throwing ? 'currentColor' : undefined}
        />
      )}
    </BpmnNodeShell>
  );
});

const diamond: NodeOutlinePath = (w, h) =>
  `M${w / 2} 1 L${w - 1} ${h / 2} L${w / 2} ${h - 1} L1 ${h / 2} Z`;

/** Gateways: the diamond is a host-supplied outline, drawn by apollo's `BaseNodeOutline`. */
export const BpmnGatewayNode = memo(function BpmnGatewayNode(props: Props) {
  const { id, type, data, selected, dragging, width = 50, height = 50 } = props;
  const toolbar = useToolbar('element', data);

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
          placement="below"
          selected={selected}
          dragging={dragging}
        />
      }
    >
      <CanvasIcon icon={GATEWAY_GLYPH[type] ?? 'x'} size={20} />
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
  const glyph = TASK_GLYPH[type];
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
      // Flow's "drillable" stack doubles as the collapsed sub-process cue.
      isStacked={isCollapsed}
      resizable={isExpanded}
      toolbar={toolbar}
    >
      {type === 'bpmn:CallActivity' && <Ring className="-inset-px border-[3px]" />}
      {glyph && (
        <BaseBadgeSlot position="top-left" inset={BADGE_INSET}>
          <CanvasIcon icon={glyph} size={14} />
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
      {(data.loopCharacteristics || isCollapsed) && (
        // No apollo slot for bottom-centre markers yet.
        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1 text-foreground">
          {data.loopCharacteristics && (
            <CanvasIcon icon={LOOP_GLYPH[data.loopCharacteristics]} size={12} />
          )}
          {isCollapsed && <CanvasIcon icon="square-plus" size={12} />}
        </div>
      )}
    </BpmnNodeShell>
  );
});

const FOLD = 10;
const dataObject: NodeOutlinePath = (w, h) =>
  `M1 1 H${w - FOLD} L${w - 1} ${FOLD} V${h - 1} H1 Z M${w - FOLD} 1 V${FOLD} H${w - 1}`;
// Control points sit 2px outside the box so each arc peaks exactly on its edge.
const dataStore: NodeOutlinePath = (w, h) =>
  `M1 7 C1 -1 ${w - 1} -1 ${w - 1} 7 V${h - 7} C${w - 1} ${h + 1} 1 ${h + 1} 1 ${h - 7} Z ` +
  `M1 7 C1 15 ${w - 1} 15 ${w - 1} 7`;

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
          placement="below"
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
          'h-full w-full rounded-xl border-2 border-dashed border-border',
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
 * Pool and lane. apollo has no band container, so these are drawn with its surface, border and
 * shadow tokens; handles (message flows), toolbar, resize and label editing are the shared parts.
 */
export const BpmnSwimlaneNode = memo(function BpmnSwimlaneNode(props: Props) {
  const { id, type, data, selected, dragging, width = 600, height = 250 } = props;
  const isPool = type === 'bpmn:Participant';
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
      connectable={isPool}
      addSides={NO_ADD}
      resizable={isPool}
      toolbar={isPool ? toolbar : undefined}
    >
      <div
        className={cx(
          'flex h-full w-full',
          isPool
            ? 'rounded-lg border border-border bg-surface-overlay shadow-(--canvas-node-shadow-rest)'
            : 'border-t border-border first:border-t-0',
          selected && selectedOutline,
          selected && !isPool && 'bg-foreground-accent-muted/5'
        )}
      >
        <div className="w-7 shrink-0 border-r border-border">
          <BpmnLabel
            nodeId={id}
            label={data.label}
            placement="header"
            selected={selected}
            dragging={dragging}
          />
        </div>
      </div>
    </BpmnNodeShell>
  );
});

/** Story-only row heading for the element gallery. */
const HeadingNode = memo(function HeadingNode({ data }: Props) {
  return (
    <div className="text-sm font-semibold whitespace-nowrap text-foreground-muted">
      {data.label}
    </div>
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
  'spike:heading': HeadingNode,
};

export const BPMN_TASK_TYPES = ['bpmn:Task', ...Object.keys(TASK_GLYPH)];
export const BPMN_GATEWAY_TYPES = Object.keys(GATEWAY_GLYPH);
