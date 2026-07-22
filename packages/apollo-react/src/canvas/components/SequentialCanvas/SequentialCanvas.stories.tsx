/**
 * Sequential Canvas stories.
 *
 * These are the flagship stories for the feature: the wireframe reproduction, a
 * generated performance graph, and execution status flowing into bars.
 * SequentialCanvas is intentionally NOT exported from components/index.ts until
 * GA (D13), so every import below is a direct source path.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useEdgesState, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { Switch, ToggleGroup, ToggleGroupItem } from '@uipath/apollo-wind';
import { useCallback, useMemo, useState } from 'react';
import { SEQ_INDENT_PX } from '../../constants';
import { StoryInfoPanel, withCanvasProviders } from '../../storybook-utils';
import {
  SequentialCanvasStoryHarness,
  sequentialWireframeManifests,
} from '../../storybook-utils/sequential';
import { makeWireframeFixture } from '../../utils/sequential/fixtures';
import { SequentialCanvas } from './SequentialCanvas';

const meta: Meta = {
  title: 'Components/Canvas/SequentialCanvas',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SEQUENCE_DENSITY_PRESETS = [
  {
    id: 'compact',
    label: 'Compact',
    nodeWidth: 512,
    nodeHeight: 40,
    indentMultiplier: 1,
    rowGap: 24,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    nodeWidth: 640,
    nodeHeight: 48,
    indentMultiplier: 1.5,
    rowGap: 48,
  },
  {
    id: 'spacious',
    label: 'Spacious',
    nodeWidth: 800,
    nodeHeight: 64,
    indentMultiplier: 2,
    rowGap: 64,
  },
] as const;
const BALANCED_DENSITY_PRESET = SEQUENCE_DENSITY_PRESETS[1];

// ---------------------------------------------------------------------------
// (a) Interactive Sequence: configurable sequential workflow example.
// ---------------------------------------------------------------------------

function InteractiveSequenceStory() {
  const fixture = useMemo(() => makeWireframeFixture(), []);
  const [isReadonly, setIsReadonly] = useState(false);
  const [nodeWidth, setNodeWidth] = useState(BALANCED_DENSITY_PRESET.nodeWidth);
  const [nodeHeight, setNodeHeight] = useState(BALANCED_DENSITY_PRESET.nodeHeight);
  const [indentMultiplier, setIndentMultiplier] = useState(
    BALANCED_DENSITY_PRESET.indentMultiplier
  );
  const [rowGap, setRowGap] = useState(BALANCED_DENSITY_PRESET.rowGap);
  const sequenceLayoutOptions = useMemo(
    () => ({
      barWidth: nodeWidth,
      barHeight: nodeHeight,
      indent: Math.round((SEQ_INDENT_PX * indentMultiplier) / 16) * 16,
      rowGap,
    }),
    [nodeWidth, nodeHeight, indentMultiplier, rowGap]
  );
  const activeDensityPreset =
    SEQUENCE_DENSITY_PRESETS.find(
      (preset) =>
        preset.nodeWidth === nodeWidth &&
        preset.nodeHeight === nodeHeight &&
        preset.indentMultiplier === indentMultiplier &&
        preset.rowGap === rowGap
    )?.id ?? '';

  const applyDensityPreset = (presetId: string) => {
    const preset = SEQUENCE_DENSITY_PRESETS.find(({ id }) => id === presetId);
    if (!preset) return;

    setNodeWidth(preset.nodeWidth);
    setNodeHeight(preset.nodeHeight);
    setIndentMultiplier(preset.indentMultiplier);
    setRowGap(preset.rowGap);
  };

  return (
    <div className="relative h-full w-full">
      <SequentialCanvasStoryHarness
        initialNodes={fixture.nodes}
        initialEdges={fixture.edges}
        extraManifests={sequentialWireframeManifests}
        mode={isReadonly ? 'readonly' : 'design'}
        sequenceLayoutOptions={sequenceLayoutOptions}
        onAddTrigger={() => console.log('Add trigger clicked')}
      />
      <StoryInfoPanel
        collapsible
        defaultCollapsed
        title="Sequence controls"
        description="Toggle interaction mode and adjust projection geometry without changing the canonical graph."
      >
        <div>
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span>Readonly canvas</span>
            <Switch
              size="sm"
              checked={isReadonly}
              onCheckedChange={setIsReadonly}
              aria-label="Readonly canvas"
              className="nodrag nopan nowheel"
            />
          </div>
          <div className="mt-3">
            <span className="block text-xs font-medium">Density preset</span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="xs"
              className="nodrag nopan nowheel mt-1 w-full"
              value={activeDensityPreset}
              onValueChange={applyDensityPreset}
              aria-label="Sequence density preset"
            >
              {SEQUENCE_DENSITY_PRESETS.map((preset) => (
                <ToggleGroupItem key={preset.id} value={preset.id} className="flex-1">
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <label className="mt-3 block text-xs">
            <span className="flex justify-between gap-4">
              <span>Node width</span>
              <strong>{nodeWidth}px</strong>
            </span>
            <input
              type="range"
              aria-label="Node width"
              className="nodrag nopan nowheel mt-1 w-full cursor-pointer"
              min={384}
              max={960}
              step={16}
              value={nodeWidth}
              onChange={(event) => setNodeWidth(Number(event.target.value))}
            />
          </label>
          <label className="mt-3 block text-xs">
            <span className="flex justify-between gap-4">
              <span>Node height</span>
              <strong>{nodeHeight}px</strong>
            </span>
            <input
              type="range"
              aria-label="Node height"
              className="nodrag nopan nowheel mt-1 w-full cursor-pointer"
              min={40}
              max={80}
              step={8}
              value={nodeHeight}
              onChange={(event) => setNodeHeight(Number(event.target.value))}
            />
          </label>
          <label className="mt-3 block text-xs">
            <span className="flex justify-between gap-4">
              <span>Indent multiplier</span>
              <strong>{indentMultiplier.toFixed(2)}x</strong>
            </span>
            <input
              type="range"
              aria-label="Indent multiplier"
              className="nodrag nopan nowheel mt-1 w-full cursor-pointer"
              min={0.5}
              max={2.5}
              step={0.25}
              value={indentMultiplier}
              onChange={(event) => setIndentMultiplier(Number(event.target.value))}
            />
          </label>
          <label className="mt-3 block text-xs">
            <span className="flex justify-between gap-4">
              <span>Gap between nodes</span>
              <strong>{rowGap}px</strong>
            </span>
            <input
              type="range"
              aria-label="Gap between nodes"
              className="nodrag nopan nowheel mt-1 w-full cursor-pointer"
              min={24}
              max={80}
              step={8}
              value={rowGap}
              onChange={(event) => setRowGap(Number(event.target.value))}
            />
          </label>
        </div>
      </StoryInfoPanel>
    </div>
  );
}

export const InteractiveSequence: Story = {
  name: 'Interactive Sequence',
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the design concept: a Workflow start bar, HTTP Request, Javascript, a For Each container whose body is an If branching into Then: Javascript 1 and Else: HTTP Request 1, Send Message to User, and the terminal add-step control. Built from utils/sequential/fixtures.ts makeWireframeFixture, the same fixture the projection engine unit tests assert exact step numbers and connectors against.',
      },
    },
  },
  render: () => <InteractiveSequenceStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole('radio', { name: 'Compact' }));
    await waitFor(() => {
      const width = canvas.getByRole('slider', { name: 'Node width' }) as HTMLInputElement;
      const height = canvas.getByRole('slider', { name: 'Node height' }) as HTMLInputElement;
      const indent = canvas.getByRole('slider', { name: 'Indent multiplier' }) as HTMLInputElement;
      const gap = canvas.getByRole('slider', { name: 'Gap between nodes' }) as HTMLInputElement;
      if (
        width.value !== '512' ||
        height.value !== '40' ||
        indent.value !== '1' ||
        gap.value !== '24'
      ) {
        throw new Error('Expected the Compact preset to update all layout controls.');
      }
    });

    await userEvent.click(canvas.getByRole('radio', { name: 'Spacious' }));
    await waitFor(() => {
      const width = canvas.getByRole('slider', { name: 'Node width' }) as HTMLInputElement;
      const height = canvas.getByRole('slider', { name: 'Node height' }) as HTMLInputElement;
      const indent = canvas.getByRole('slider', { name: 'Indent multiplier' }) as HTMLInputElement;
      const gap = canvas.getByRole('slider', { name: 'Gap between nodes' }) as HTMLInputElement;
      if (
        width.value !== '800' ||
        height.value !== '64' ||
        indent.value !== '2' ||
        gap.value !== '64'
      ) {
        throw new Error('Expected the Spacious preset to update all layout controls.');
      }
    });

    await userEvent.click(canvas.getByRole('radio', { name: 'Balanced' }));
    await waitFor(() => {
      const width = canvas.getByRole('slider', { name: 'Node width' }) as HTMLInputElement;
      const height = canvas.getByRole('slider', { name: 'Node height' }) as HTMLInputElement;
      const indent = canvas.getByRole('slider', { name: 'Indent multiplier' }) as HTMLInputElement;
      const gap = canvas.getByRole('slider', { name: 'Gap between nodes' }) as HTMLInputElement;
      if (
        width.value !== '640' ||
        height.value !== '48' ||
        indent.value !== '1.5' ||
        gap.value !== '48'
      ) {
        throw new Error('Expected the Balanced preset to update all layout controls.');
      }
    });

    // For Each is step 3 (D7); its body (If=4, Javascript 1=5, HTTP Request 1=6)
    // starts expanded.
    await waitFor(() => {
      if (!canvas.queryByText('If'))
        throw new Error('Expected the If bar to be visible initially.');
    });

    const collapseButton = await canvas.findByRole('button', { name: 'Collapse step 3' });
    await userEvent.click(collapseButton);
    await waitFor(() => {
      if (canvas.queryByText('If')) {
        throw new Error('Expected collapsing For Each (step 3) to hide its body rows.');
      }
    });

    const expandButton = await canvas.findByRole('button', { name: 'Expand step 3' });
    await userEvent.click(expandButton);
    await waitFor(() => {
      if (!canvas.queryByText('If')) {
        throw new Error('Expected expanding For Each (step 3) to restore its body rows.');
      }
    });
  },
};

// ---------------------------------------------------------------------------
// (b) Performance: a generated ~150-node graph mixing branches and containers.
// ---------------------------------------------------------------------------

const PERF_TYPES = {
  step: 'uipath.data.transform',
  decision: 'uipath.control-flow.decision',
  foreach: 'uipath.control-flow.foreach',
} as const;

const DEFAULT_PERF_UNIT_COUNT = 30;
const MIN_PERF_UNIT_COUNT = 1;
const MAX_PERF_UNIT_COUNT = 60;

function perfNode(id: string, type: string, label: string, parentId?: string): Node {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    ...(parentId ? { parentId } : {}),
    data: { display: { label } },
  };
}

function perfEdge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  label?: string
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    ...(label ? { data: { label } } : {}),
  };
}

/**
 * Generates a mixed branch/container graph of roughly `unitCount * 5 + 1`
 * nodes: a spine of Decision -> (Then/Else) -> For Each[one child], repeated
 * `unitCount` times, with each container child looping back into the
 * container's `continue` handle. Used to stress-test projection, layout, and
 * render cost at scale; D12's structural fingerprint memo is what keeps a
 * data-only change (e.g. an inline rename) from re-running either.
 */
function createPerformanceFixture(unitCount: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [perfNode('perf-root', PERF_TYPES.step, 'Load batch')];
  const edges: Edge[] = [];
  let previousId = 'perf-root';

  for (let i = 0; i < unitCount; i++) {
    const decisionId = `perf-decision-${i}`;
    const thenId = `perf-then-${i}`;
    const elseId = `perf-else-${i}`;
    const foreachId = `perf-foreach-${i}`;
    const childId = `perf-child-${i}`;

    nodes.push(
      perfNode(decisionId, PERF_TYPES.decision, `Check batch ${i + 1}`),
      perfNode(thenId, PERF_TYPES.step, `Transform ${i + 1}`),
      perfNode(elseId, PERF_TYPES.step, `Fallback ${i + 1}`),
      perfNode(foreachId, PERF_TYPES.foreach, `For each item ${i + 1}`),
      perfNode(childId, PERF_TYPES.step, `Process item ${i + 1}`, foreachId)
    );

    edges.push(
      perfEdge(`perf-e-${previousId}-${decisionId}`, previousId, 'output', decisionId, 'input'),
      perfEdge(`perf-e-${decisionId}-${thenId}`, decisionId, 'true', thenId, 'input', 'Then'),
      perfEdge(`perf-e-${decisionId}-${elseId}`, decisionId, 'false', elseId, 'input', 'Else'),
      perfEdge(`perf-e-${thenId}-${foreachId}`, thenId, 'output', foreachId, 'input'),
      perfEdge(`perf-e-${elseId}-${foreachId}`, elseId, 'output', foreachId, 'input'),
      perfEdge(`perf-e-${foreachId}-${childId}`, foreachId, 'start', childId, 'input'),
      perfEdge(`perf-e-${childId}-${foreachId}`, childId, 'output', foreachId, 'continue')
    );

    previousId = foreachId;
  }

  return { nodes, edges };
}

function PerformanceStory() {
  const [unitCount, setUnitCount] = useState(DEFAULT_PERF_UNIT_COUNT);
  const initialFixture = useMemo(() => createPerformanceFixture(DEFAULT_PERF_UNIT_COUNT), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialFixture.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialFixture.edges);

  const handleUnitCountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextCount = Number.parseInt(event.target.value, 10);
      const nextFixture = createPerformanceFixture(nextCount);
      setUnitCount(nextCount);
      setNodes(nextFixture.nodes);
      setEdges(nextFixture.edges);
    },
    [setNodes, setEdges]
  );

  return (
    <SequentialCanvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      mode="design"
    >
      <StoryInfoPanel
        title="Performance"
        description="Adjust the unit count to profile projection, layout, and render cost at scale. Each unit adds a Decision, two branches, and a For Each container."
      >
        <div className="mt-3 flex items-center justify-between text-xs">
          <span>Nodes</span>
          <strong>{nodes.length}</strong>
        </div>
        <input
          type="range"
          className="nodrag nopan nowheel mt-2 w-full cursor-pointer"
          min={MIN_PERF_UNIT_COUNT}
          max={MAX_PERF_UNIT_COUNT}
          value={unitCount}
          onChange={handleUnitCountChange}
        />
      </StoryInfoPanel>
    </SequentialCanvas>
  );
}

export const Performance: Story = {
  name: 'Performance',
  parameters: {
    docs: {
      description: {
        story:
          'A generated graph mixing branches and containers, defaulting to about 150 nodes. Use this to profile pan and zoom under load, and to confirm projectSequence reuses its cached layout on data-only changes (D12).',
      },
    },
  },
  render: () => <PerformanceStory />,
};

// ---------------------------------------------------------------------------
// (c) ExecutionStatus: bars pulling live execution state, one per status.
// ---------------------------------------------------------------------------

// The Storybook execution-state decorator (storybook-utils/decorators.tsx)
// derives status from the id's second dash-separated segment, so each id here
// is `exec-<ElementStatusValues>`.
const EXECUTION_STATUS_STEPS: Array<{ id: string; type: string; label: string }> = [
  { id: 'exec-Completed', type: 'uipath.script', label: 'Validate input' },
  { id: 'exec-InProgress', type: 'uipath.data.transform', label: 'Transform payload' },
  { id: 'exec-ActionNeeded', type: 'uipath.human-task.approval', label: 'Manager approval' },
  { id: 'exec-Failed', type: 'uipath.workflow.call', label: 'Sync to ERP' },
  { id: 'exec-NotExecuted', type: 'uipath.control-flow.decision', label: 'Check retry' },
];

function createExecutionStatusFixture(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = EXECUTION_STATUS_STEPS.map(({ id, type, label }) => ({
    id,
    type,
    position: { x: 0, y: 0 },
    data: { display: { label } },
  }));
  const edges: Edge[] = EXECUTION_STATUS_STEPS.slice(1).map((step, index) => ({
    id: `e-${EXECUTION_STATUS_STEPS[index]!.id}-${step.id}`,
    source: EXECUTION_STATUS_STEPS[index]!.id,
    target: step.id,
    sourceHandle: 'output',
    targetHandle: 'input',
  }));
  return { nodes, edges };
}

function ExecutionStatusStory() {
  const fixture = useMemo(() => createExecutionStatusFixture(), []);
  return (
    <SequentialCanvas nodes={fixture.nodes} edges={fixture.edges} mode="view">
      <StoryInfoPanel
        title="Execution status"
        description="Bars pulling live status through the same id-keyed ExecutionStatusContext the flow view uses. Completed and Failed color the border; InProgress adds the glow animation; ActionNeeded replaces the trailing status indicator with the amber pill."
      />
    </SequentialCanvas>
  );
}

export const ExecutionStatus: Story = {
  name: 'Execution Status',
  parameters: {
    docs: {
      description: {
        story:
          'Five bars, one per execution status: Completed, InProgress, ActionNeeded, Failed, and NotExecuted. Rendered in view mode to demonstrate the sequential view working outside design mode (open product question Q5).',
      },
    },
  },
  render: () => <ExecutionStatusStory />,
};
