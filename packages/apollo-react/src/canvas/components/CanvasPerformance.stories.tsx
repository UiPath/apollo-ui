import type { Meta, StoryObj } from '@storybook/react';
import type { Connection, Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { DefaultCanvasTranslations } from '../types';
import { BaseCanvas } from './BaseCanvas';
import { CanvasPositionControls } from './CanvasPositionControls';
import { StageConnectionEdge } from './StageNode/StageConnectionEdge';
import { StageEdge } from './StageNode/StageEdge';
import { StageNodeWrapper } from './StageNode/StageNode.stories.utils';
import type { StageTaskItem } from './StageNode/StageNode.types';

const meta: Meta = {
  title: 'Components/Canvas/Performance',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const PERFORMANCE_STAGE_NODE_WIDTH = 336;
const PERFORMANCE_STAGE_SPACING_X = 400;
const PERFORMANCE_STAGE_SPACING_Y = 384;
const DEFAULT_STAGE_COUNT = 48;
const MIN_STAGE_COUNT = 1;
const MAX_STAGE_COUNT = 200;

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

const ProcessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

function createPerformanceStageTasks(index: number): StageTaskItem[][] {
  return [
    [
      {
        id: `stage-${index}-task-intake`,
        label: 'Intake Review',
        icon: <VerificationIcon />,
      },
    ],
    [
      {
        id: `stage-${index}-task-documents`,
        label: 'Document Processing',
        icon: <DocumentIcon />,
      },
    ],
    [
      {
        id: `stage-${index}-task-risk`,
        label: 'Risk Assessment',
        icon: <VerificationIcon />,
      },
      {
        id: `stage-${index}-task-policy`,
        label: 'Policy Validation',
        icon: <VerificationIcon />,
      },
    ],
    [
      {
        id: `stage-${index}-task-review`,
        label: 'Final Review',
        icon: <ProcessIcon />,
      },
    ],
  ];
}

function createPerformanceStageNodes(stageCount: number): Node[] {
  const columns = Math.ceil(Math.sqrt(stageCount));

  return Array.from({ length: stageCount }, (_, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const stageId = `performance-stage-${index}`;

    return {
      id: stageId,
      type: 'stage',
      position: {
        x: col * PERFORMANCE_STAGE_SPACING_X,
        y: row * PERFORMANCE_STAGE_SPACING_Y,
      },
      width: PERFORMANCE_STAGE_NODE_WIDTH,
      data: {
        stageDetails: {
          label: `Performance Stage ${index + 1}`,
          tasks: createPerformanceStageTasks(index),
        },
        execution: {
          stageStatus: {
            duration: `SLA: ${30 + (index % 5) * 15}m`,
          },
        },
      },
    };
  });
}

function createPerformanceStageEdges(stageCount: number): Edge[] {
  const columns = Math.ceil(Math.sqrt(stageCount));
  const edges: Edge[] = [];

  for (let index = 0; index < stageCount; index++) {
    const col = index % columns;
    const sourceId = `performance-stage-${index}`;

    const rightIndex = index + 1;
    if (col < columns - 1 && rightIndex < stageCount) {
      const targetId = `performance-stage-${rightIndex}`;
      edges.push({
        id: `performance-edge-right-${index}`,
        type: 'stage',
        source: sourceId,
        sourceHandle: `${sourceId}____source____right`,
        target: targetId,
        targetHandle: `${targetId}____target____left`,
      });
    }
  }

  return edges;
}

const CanvasPerformanceStory = () => {
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);
  const defaultEdgeOptions = useMemo(() => ({ type: 'stage' }), []);
  const [stageCount, setStageCount] = useState(DEFAULT_STAGE_COUNT);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    createPerformanceStageNodes(DEFAULT_STAGE_COUNT)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    createPerformanceStageEdges(DEFAULT_STAGE_COUNT)
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleStageCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextCount = Number.parseInt(e.target.value, 10);
      setStageCount(nextCount);
      setNodes(createPerformanceStageNodes(nextCount));
      setEdges(createPerformanceStageEdges(nextCount));
    },
    [setEdges, setNodes]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
        >
          <Panel position="top-left">
            <div
              className="nodrag nopan nowheel"
              style={{
                width: 240,
                background: 'var(--canvas-background)',
                border: '1px solid var(--canvas-border-de-emp)',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>Performance Test</div>
              <div
                style={{
                  marginTop: 6,
                  color: 'var(--canvas-foreground-de-emp)',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                Adjust the number of stage nodes to profile drag and pan performance.
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                <span>Stage Count</span>
                <strong style={{ fontSize: 14 }}>{stageCount}</strong>
              </div>
              <input
                type="range"
                min={MIN_STAGE_COUNT}
                max={MAX_STAGE_COUNT}
                value={stageCount}
                onChange={handleStageCountChange}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </Panel>
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

export const StageWorkflow: Story = {
  name: 'Stage Workflow',
  parameters: {
    docs: {
      description: {
        story:
          'Standalone performance story with adjustable stage count. Use this to profile stage workflow drag and pan behavior under load.',
      },
    },
  },
  render: () => <CanvasPerformanceStory />,
};
