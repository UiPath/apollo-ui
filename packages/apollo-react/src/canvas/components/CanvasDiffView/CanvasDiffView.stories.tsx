import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, cn } from '@uipath/apollo-wind';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createNode, defaultWorkflowManifest, withCanvasProviders } from '../../storybook-utils';
import { BaseNode } from '../BaseNode/BaseNode';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasEdge } from '../Edges';
import type { CanvasEdgeData } from '../Edges/shared/types';
import { ApolloCanvasDiffPane } from './ApolloCanvasDiffPane';
import { CanvasDiffView } from './CanvasDiffView';
import type {
  CanvasDiffViewOrientation,
  CanvasDiffViewProps,
  ChangeKind,
  ChangePhase,
  DiffModel,
  DiffPaneContext,
} from './CanvasDiffView.types';
import { diffById } from './diffById';

const meta: Meta<typeof CanvasDiffView> = {
  title: 'Components/Canvas/CanvasDiffView',
  component: CanvasDiffView,
  decorators: [withCanvasProviders()],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Before/after review of a graph change, e.g. what a coding agent just did to a workflow.
The view owns the layout (stacked or side by side), the header with change counts,
Keep/Revert, the visual/code toggle, and the selection and viewport the two panes share.
It never draws a canvas itself: \`renderPane(ctx)\` draws one side.

**Build the model.** \`DiffModel\` is plain data: both graphs, a \`highlight\` map of change
kinds by id, a \`summary\` of counts, and optional \`changePhases\` (e.g. applied this turn vs
pending approval, each with its own highlight and summary). \`diffById\` builds the highlight
and summary for graphs whose elements have stable ids.

**Pick a pane.**
- **Default: \`ApolloCanvasDiffPane\`**, for products that render with apollo \`BaseCanvas\`:
  \`renderPane={(ctx) => <ApolloCanvasDiffPane {...ctx} nodeTypes={nodeTypes} />}\`.
- **Own renderer (Flow)**: Flow draws each side with its own read-only canvas inside
  \`renderPane\`, so its node types, manifests and theming apply unchanged.
- **Own React Flow canvas (Case)**: Case renders with its own wrapper over React Flow. Mark
  changes with \`applyDiffHighlight(ctx.nodes, ctx.edges, ctx.highlight)\`; apollo
  \`BaseNode\` and \`CanvasEdge\` draw \`data.suggestionType\`, other nodes and edges read it
  themselves. \`ctx.changePhases\` carries each phase's side of the change for phase styling.

**A custom pane's contract** (see the "Custom pane" story):
\`ctx.highlight\` already holds only this side's changes. Show \`ctx.selectedNodeId\` and
call \`ctx.onSelectNode(id | undefined)\`. Apply \`ctx.viewport\` when it changes, report user
pans and zooms with \`ctx.onViewportChange\` (not the echo of one you just applied), and fit
on mount only when \`ctx.fitViewOnMount\` is true.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const nodeTypes = { 'uipath.blank-node': BaseNode };
const edgeTypes = { 'canvas-edge': CanvasEdge };

interface Graph {
  nodes: Node<BaseNodeData>[];
  edges: Edge<CanvasEdgeData>[];
}

function step(id: string, label: string, x: number, y = 96): Node<BaseNodeData> {
  return createNode({
    id,
    type: 'uipath.blank-node',
    position: { x, y },
    display: { label },
    handleConfigurations: [
      {
        position: Position.Left,
        handles: [{ id: 'in', type: 'target', handleType: 'input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'out', type: 'source', handleType: 'output' }],
      },
    ],
  });
}

function link(source: string, target: string): Edge<CanvasEdgeData> {
  return {
    id: `${source}->${target}`,
    source,
    target,
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'canvas-edge',
  };
}

const beforeGraph: Graph = {
  nodes: [
    step('trigger', 'Invoice received', 96),
    step('extract', 'Extract fields', 288),
    step('notify', 'Email finance', 480),
  ],
  edges: [link('trigger', 'extract'), link('extract', 'notify')],
};

// The agent's first edit, already applied: extract now validates and asks for approval.
const appliedGraph: Graph = {
  nodes: [
    step('trigger', 'Invoice received', 96),
    step('extract', 'Extract and validate fields', 288),
    step('approve', 'Request approval', 480),
  ],
  edges: [link('trigger', 'extract'), link('extract', 'approve')],
};

const afterGraph: Graph = {
  nodes: [...appliedGraph.nodes, step('post', 'Post to ledger', 672)],
  edges: [...appliedGraph.edges, link('approve', 'post')],
};

function diffGraphs(before: Graph, after: Graph) {
  return diffById(before, after, {
    getNodes: (graph: Graph) => graph.nodes,
    getEdges: (graph: Graph) => graph.edges,
    ignoreNodeKeys: ['position', 'measured', 'selected'],
  });
}

function buildModel(
  before: Graph,
  after: Graph,
  changePhases?: ChangePhase[]
): DiffModel<Node, Edge> {
  return { before, after, ...diffGraphs(before, after), changePhases };
}

const apolloPane = (ctx: DiffPaneContext<Node, Edge>) => (
  <ApolloCanvasDiffPane
    {...ctx}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    manifest={defaultWorkflowManifest}
  />
);

type DiffStoryProps = Omit<CanvasDiffViewProps<Node, Edge>, 'renderPane'> & {
  renderPane?: CanvasDiffViewProps<Node, Edge>['renderPane'];
  /** Read-only: no Keep or Revert. */
  preview?: boolean;
};

function DiffStory({ renderPane = apolloPane, preview, ...props }: DiffStoryProps) {
  const [orientation, setOrientation] = useState<CanvasDiffViewOrientation>('vertical');
  const [decision, setDecision] = useState<string>();
  return (
    <CanvasDiffView<Node, Edge>
      renderPane={renderPane}
      orientation={orientation}
      onOrientationChange={setOrientation}
      onKeep={preview ? undefined : () => setDecision('Kept')}
      onRevert={preview ? undefined : () => setDecision('Reverted')}
      headerActions={
        decision ? <span className="text-xs text-foreground-muted">{decision}</span> : undefined
      }
      {...props}
    />
  );
}

const describeStory = (story: string) => ({ docs: { description: { story } } });

export const AddUpdateDelete: Story = {
  name: 'Add, update and delete',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, afterGraph), []);
    return <DiffStory model={model} />;
  },
  parameters: describeStory(
    'The default path: `ApolloCanvasDiffPane` renders each side in `BaseCanvas`. Removed elements show on the before side, added on the after side, changed on both. Click a node to select it in both panes; pan one pane and the other follows.'
  ),
};

export const EmptyDiff: Story = {
  name: 'Empty diff',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, beforeGraph), []);
    return <DiffStory model={model} title="No changes to review" />;
  },
  parameters: describeStory('A model with no changes reads "No changes" in the header.'),
};

export const PhaseSplit: Story = {
  name: 'Change phases',
  render: () => {
    const model = useMemo(
      () =>
        buildModel(beforeGraph, afterGraph, [
          { id: 'applied', label: 'Applied this turn', ...diffGraphs(beforeGraph, appliedGraph) },
          { id: 'pending', label: 'Pending approval', ...diffGraphs(appliedGraph, afterGraph) },
        ]),
      []
    );
    return <DiffStory model={model} title="Agent edits" />;
  },
  parameters: describeStory(
    'With `changePhases`, the header shows one labelled row of counts per phase instead of one overall row. Here each phase is its own `diffById` run: before → applied, then applied → after.'
  ),
};

const KIND_BORDER: Record<ChangeKind, string> = {
  added: 'border-success',
  changed: 'border-warning',
  removed: 'border-error border-dashed',
};

/**
 * A pane with no React Flow at all: absolutely positioned buttons. It honours the whole pane
 * contract: side-filtered highlight, shared selection and shared viewport.
 */
function PlainDomPane({
  nodes,
  highlight,
  selectedNodeId,
  onSelectNode,
  viewport,
  onViewportChange,
}: DiffPaneContext<Node, Edge>) {
  const { x, y, zoom } = viewport ?? { x: 0, y: 0, zoom: 1 };
  const zoomBy = (factor: number) => onViewportChange({ x, y, zoom: zoom * factor });
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}
      >
        {nodes.map((node) => {
          const kind = highlight.nodeKind.get(node.id);
          const selected = node.id === selectedNodeId;
          return (
            <button
              key={node.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectNode(selected ? undefined : node.id)}
              className={cn(
                'absolute w-40 rounded-md border-2 bg-surface-raised px-3 py-2 text-left text-sm',
                kind ? KIND_BORDER[kind] : 'border-border',
                selected && 'ring-2 ring-primary'
              )}
              style={{ left: node.position.x, top: node.position.y + 48 }}
            >
              {(node.data as BaseNodeData).display?.label ?? node.id}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1">
        <Button variant="outline" size="xs" icon aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
          <ZoomOut />
        </Button>
        <Button variant="outline" size="xs" icon aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
          <ZoomIn />
        </Button>
      </div>
    </div>
  );
}

export const CustomPane: Story = {
  name: 'Custom pane',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, afterGraph), []);
    return (
      <DiffStory
        model={model}
        renderPane={(ctx) => <PlainDomPane {...ctx} />}
        title="Custom renderer"
      />
    );
  },
  parameters: describeStory(
    'How a product with its own canvas plugs in (Flow with its own renderer, Case with its own React Flow wrapper). The pane here is plain DOM: it borders nodes from `ctx.highlight` (already filtered to its side), toggles the shared selection, and zooms through `ctx.onViewportChange`, so the other pane follows. A React Flow canvas would mark its elements with `applyDiffHighlight` instead.'
  ),
};

export const SinglePane: Story = {
  name: 'Single pane',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, afterGraph), []);
    return <DiffStory model={model} showBefore={false} title="Generating" />;
  },
  parameters: describeStory(
    '`showBefore={false}` renders only the after pane, e.g. while an agent is still writing.'
  ),
};

export const WithCodeView: Story = {
  name: 'With code view',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, afterGraph), []);
    const codeView = (
      <div className="grid h-full grid-cols-2 divide-x divide-border-subtle overflow-auto text-xs">
        <pre className="p-4">{JSON.stringify(beforeGraph, null, 2)}</pre>
        <pre className="p-4">{JSON.stringify(afterGraph, null, 2)}</pre>
      </div>
    );
    return <DiffStory model={model} codeView={codeView} />;
  },
  parameters: describeStory(
    'Passing `codeView` adds a visual/code toggle. The product supplies the code diff (e.g. Monaco); apollo ships none.'
  ),
};

export const PreviewMode: Story = {
  name: 'Preview',
  render: () => {
    const model = useMemo(() => buildModel(beforeGraph, afterGraph), []);
    return <DiffStory model={model} preview title="Change history" />;
  },
  parameters: describeStory(
    'Omit `onKeep` and `onRevert` for a read-only preview, e.g. a past change.'
  ),
};
