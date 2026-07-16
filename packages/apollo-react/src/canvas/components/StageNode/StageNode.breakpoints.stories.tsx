import type { Meta, StoryObj } from '@storybook/react';
import {
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { NodeMenuItem } from '../NodeContextMenu';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import { StageNodeWrapper } from './StageNode.stories.utils';
import type {
  StageNodeProps,
  StageTaskExecution,
  StageTaskItem,
  StageTaskStatus,
} from './StageNode.types';

// ============================================================================
// StageNode: Breakpoints feature
//
// A task carries a breakpoint when its `execution.taskStatus[id].breakpoint` is
// true. The marker is a solid red dot at the top-left corner of the task card
// (debugger-gutter style) and is display-only. Adding and removing breakpoints is
// done through the task's right-click / task menu, whose items the consumer
// (PO.frontend) supplies via `getTaskContextMenuItems`; these stories wire that up
// the same way.
// ============================================================================

const ProcessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const VerificationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 11L12 14L20 6" />
    <path d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H13" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
    <path d="M14 2V8H20" />
    <path d="M8 12H16" />
    <path d="M8 16H16" />
  </svg>
);

const meta: Meta<StageNodeProps> = {
  title: 'Components/Nodes/StageNode/Breakpoints',
  component: StageNode,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const BREAKPOINT_TASKS: StageTaskItem[][] = [
  [{ id: 'classify', label: 'Classify Request', icon: <ProcessIcon /> }],
  [{ id: 'review', label: 'Review and Decide', icon: <VerificationIcon /> }],
  [{ id: 'notify', label: 'Notify Outcome', icon: <DocumentIcon /> }],
];

// Reusable interactive playground: manages breakpoint state for an arbitrary task
// list. A set breakpoint shows a solid, display-only marker; adding and removing
// is done through the task's right-click menu (wired via getTaskContextMenuItems),
// exactly as the consumer (PO.frontend) does it.
const BreakpointPlaygroundStory = ({
  stageLabel,
  tasks,
  initialBreakpoints,
  taskStatuses,
  allowBreakpoint,
  isReadOnly,
}: {
  stageLabel: string;
  tasks: StageTaskItem[][];
  initialBreakpoints: string[];
  /** Fixed execution statuses per task id (e.g. a paused or completed task). */
  taskStatuses?: Record<string, StageTaskStatus>;
  /** Optional predicate gating which tasks can host a breakpoint. */
  allowBreakpoint?: (task: StageTaskItem) => boolean;
  /** Render the stage read-only (like Debug view). The breakpoint menu must still work. */
  isReadOnly?: boolean;
}) => {
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const [breakpoints, setBreakpoints] = useState<Set<string>>(() => new Set(initialBreakpoints));

  const toggleBreakpoint = useCallback((taskId: string) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Derives the stage node's data from the current breakpoint set plus the fixed
  // task statuses. A set breakpoint is a static solid dot; a paused task shows the
  // card's amber border and pause icon (from its status), not a changed dot.
  const buildData = useCallback(() => {
    const taskStatus: Record<string, StageTaskExecution> = {};
    let anyPaused = false;
    for (const group of tasks) {
      for (const task of group) {
        const status = taskStatuses?.[task.id];
        const armed = breakpoints.has(task.id);
        if (!status && !armed) {
          continue;
        }
        if (status === 'Paused') {
          anyPaused = true;
        }
        taskStatus[task.id] = {
          ...(status
            ? { status, ...(status === 'Paused' ? { message: 'Paused on breakpoint' } : {}) }
            : {}),
          ...(armed ? { breakpoint: true } : {}),
        };
      }
    }
    return {
      stageDetails: { label: stageLabel, tasks, isReadOnly },
      execution: {
        stageStatus: anyPaused ? { status: 'Paused' as const, label: 'Paused on breakpoint' } : {},
        taskStatus,
      },
      // Breakpoints are added/removed through the task's right-click menu (works read-only too).
      getTaskContextMenuItems: ({ task }: { task: StageTaskItem }): NodeMenuItem[] => {
        // Restricted tasks get no breakpoint action.
        if (allowBreakpoint && !allowBreakpoint(task)) {
          return [];
        }
        return [
          {
            id: 'toggle-breakpoint',
            label: breakpoints.has(task.id) ? 'Remove breakpoint' : 'Add breakpoint',
            onClick: () => toggleBreakpoint(task.id),
          },
        ];
      },
    };
  }, [tasks, taskStatuses, breakpoints, stageLabel, toggleBreakpoint, allowBreakpoint, isReadOnly]);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: 'debug-stage', type: 'stage', position: { x: 320, y: 96 }, data: buildData() },
  ]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  // Write fresh data into React Flow's own node state whenever the breakpoint set
  // changes, so the stage re-renders immediately. Overlaying a derived `nodes`
  // prop did not reliably re-sync to the store, which left a toggle visually
  // stale until the next canvas interaction.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => (node.id === 'debug-stage' ? { ...node, data: buildData() } : node))
    );
  }, [buildData, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

// The full breakpoint lifecycle in one stage:
// - "Classify Request": completed with a breakpoint -> solid dot (passed).
// - "Review and Decide": the run is paused here on its breakpoint -> solid dot
//   plus the card's amber Paused border and pause icon (the dot itself is static).
// - "Notify Outcome": no breakpoint.
// Right-click any task to add / remove its breakpoint.
export const Interactive: Story = {
  name: 'Interactive (right-click to add/remove)',
  render: () => (
    <BreakpointPlaygroundStory
      stageLabel="HR Review"
      tasks={BREAKPOINT_TASKS}
      initialBreakpoints={['classify', 'review']}
      taskStatuses={{ classify: 'Completed', review: 'Paused' }}
    />
  ),
};

// Breakpoints apply to every task type, not just sequential ones: sequential,
// ad hoc, and event-driven tasks all render the same corner marker. Right-click
// a task to add / remove a breakpoint.
const TASK_TYPE_TASKS: StageTaskItem[][] = [
  [{ id: 'seq-review', label: 'Review and Decide', icon: <VerificationIcon /> }],
  [{ id: 'adhoc-manual', label: 'Manual Check', icon: <ProcessIcon />, isAdhoc: true }],
  [
    {
      id: 'evt-escalation',
      label: 'On Escalation',
      icon: <DocumentIcon />,
      taskGroupType: 'event-driven',
    },
  ],
];

export const AcrossTaskTypes: Story = {
  name: 'Across task types (sequential, ad hoc, event-driven)',
  render: () => (
    <BreakpointPlaygroundStory
      stageLabel="Loan Application"
      tasks={TASK_TYPE_TASKS}
      initialBreakpoints={['seq-review', 'adhoc-manual', 'evt-escalation']}
      taskStatuses={{ 'seq-review': 'Paused' }}
    />
  ),
};

// Only some tasks may host a breakpoint. Here only sequential tasks qualify: the
// right-click menu on an ad hoc or event-driven task offers no breakpoint action.
// This mirrors how a consumer suppresses breakpoints on node types that cannot be
// paused on (the story gates this in its own getTaskContextMenuItems).
export const Restricted: Story = {
  name: 'Restricted (menu gated per task)',
  render: () => (
    <BreakpointPlaygroundStory
      stageLabel="Loan Application"
      tasks={TASK_TYPE_TASKS}
      initialBreakpoints={['seq-review']}
      allowBreakpoint={(task) => !task.isAdhoc && task.taskGroupType !== 'event-driven'}
    />
  ),
};

// Read-only stage (as in Debug view): editing is disabled, but the breakpoint
// right-click menu (Add/Remove) must still work. "Review and Decide" is paused,
// shown by the amber card border and pause icon.
export const ReadOnlyDebugView: Story = {
  name: 'Read-only / Debug view',
  render: () => (
    <BreakpointPlaygroundStory
      stageLabel="Loan Application"
      tasks={BREAKPOINT_TASKS}
      initialBreakpoints={['classify', 'review']}
      taskStatuses={{ classify: 'Completed', review: 'Paused' }}
      isReadOnly
    />
  ),
};

// Breakpoints on tasks inside parallel groups. "Credit Check"/"Fraud Check" and
// "Notify Applicant"/"Write Audit Log" are two parallel groups (rendered with the
// parallel bracket + label); breakpoints sit on tasks within them so you can see
// the marker on parallel tasks (add/remove via right-click).
const BREAKPOINT_PARALLEL_TASKS: StageTaskItem[][] = [
  [{ id: 'intake', label: 'Intake Request', icon: <ProcessIcon /> }],
  [
    { id: 'credit', label: 'Credit Check', icon: <VerificationIcon /> },
    { id: 'fraud', label: 'Fraud Check', icon: <VerificationIcon /> },
  ],
  [
    { id: 'notify-applicant', label: 'Notify Applicant', icon: <DocumentIcon /> },
    { id: 'audit-log', label: 'Write Audit Log', icon: <DocumentIcon /> },
  ],
  [{ id: 'finalize', label: 'Finalize', icon: <ProcessIcon /> }],
];

export const ParallelTaskGroups: Story = {
  name: 'Parallel task groups',
  render: () => (
    <BreakpointPlaygroundStory
      stageLabel="Loan Application"
      tasks={BREAKPOINT_PARALLEL_TASKS}
      initialBreakpoints={['credit', 'notify-applicant', 'finalize']}
    />
  ),
};
