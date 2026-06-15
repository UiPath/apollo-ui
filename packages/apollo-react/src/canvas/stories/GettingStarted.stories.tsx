import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared UI components  (mirrors apollo-wind getting-started style exactly)
// ============================================================================

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50">
      {label && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!label && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function StepItem({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="mb-2 text-base font-semibold text-foreground">{title}</h4>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Overview
// ============================================================================

function OverviewTab() {
  return (
    <div className="space-y-6">
      <SectionDescription>
        Apollo Canvas is a React-based visual workflow editor built on top of ReactFlow. It provides
        a complete set of nodes, edges, controls, and panels designed for building process
        automation UIs, consistent with the Apollo design system.
      </SectionDescription>

      <InfoCallout>
        The canvas is powered by <InlineCode>@uipath/apollo-react/canvas/xyflow/react</InlineCode> —
        a re-export of ReactFlow with Apollo-specific extensions. You do not need to install
        ReactFlow separately.
      </InfoCallout>

      <Divider />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Core Concepts</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Canvas',
              description:
                'The root container that manages the viewport, pan/zoom, and event system. Wraps ReactFlow with Apollo defaults.',
              components: ['BaseCanvas', 'HierarchicalCanvas'],
            },
            {
              title: 'Nodes',
              description:
                'Visual elements placed on the canvas. Each type maps to a specific workflow activity or structure.',
              components: [
                'BaseNode',
                'LoopNode',
                'GroupNode',
                'StageNode',
                'TriggerNode',
                'StickyNoteNode',
              ],
            },
            {
              title: 'Edges',
              description:
                'Connections between nodes with animated states that reflect execution feedback.',
              components: ['SequenceEdge'],
            },
            {
              title: 'Controls',
              description:
                'Interactive UI overlaid on the canvas: toolbar, zoom, node picker, and handles.',
              components: ['CanvasModeToolbar', 'CanvasZoomControls', 'Toolbox', 'AddNodePanel'],
            },
            {
              title: 'Panels',
              description:
                'Side panels for inspecting and editing selected nodes, rendered outside the canvas viewport.',
              components: ['NodeInspector', 'NodePropertiesPanel', 'CollapseConfig'],
            },
          ].map(({ title, description, components }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-1 text-base font-semibold text-foreground">{title}</h4>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="flex flex-wrap gap-1.5">
                {components.map((c) => (
                  <InlineCode key={c}>{c}</InlineCode>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Canvas Modes</h3>
        <SectionDescription>
          The canvas operates in one of three modes, controlled via{' '}
          <InlineCode>CanvasModeToolbar</InlineCode>. The active mode gates what interactions are
          available.
        </SectionDescription>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Purpose
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Canvas editable?
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['design', 'Build and edit the workflow graph', 'Yes'],
                ['debug', 'Step through execution with live node status', 'No, locked during run'],
                ['evaluate', 'Review and assess workflow quality', 'No'],
              ].map(([mode, purpose, editable]) => (
                <tr key={mode} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <InlineCode>{mode}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{editable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">UX Principles</h3>
        <div className="space-y-3">
          {[
            {
              title: 'Nodes are data-driven',
              body: 'Node appearance is controlled entirely by data passed via nodeTypes and the node data object. Never use direct DOM manipulation.',
            },
            {
              title: 'Status is contextual',
              body: 'Execution status (running, paused, error, completed) is provided via ExecutionStatusContext and consumed automatically by nodes. Avoid passing status as node data.',
            },
            {
              title: 'Panels live outside the canvas',
              body: 'NodeInspector and NodePropertiesPanel live outside the ReactFlow viewport. Use host-app layout to position them alongside BaseCanvas.',
            },
            {
              title: 'Controls are overlaid via Panel',
              body: 'Use the ReactFlow <Panel> component to position CanvasModeToolbar and CanvasZoomControls. This keeps them in canvas space without affecting node layout.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Quick Start
// ============================================================================

const quickStartPaths = ['Add to existing project', 'Run locally'] as const;
type QuickStartPath = (typeof quickStartPaths)[number];

function QuickStartTab() {
  const [path, setPath] = React.useState<QuickStartPath>('Add to existing project');

  return (
    <div className="space-y-8">
      {/* Path switcher */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">What are you trying to do?</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose the path that matches your goal — the steps below will update accordingly.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {quickStartPaths.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPath(p)}
              className={cn(
                'flex-1 cursor-pointer rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                path === p
                  ? 'border-primary bg-primary/10 font-medium text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="block font-medium text-foreground">{p}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {p === 'Add to existing project'
                  ? 'Install Apollo Canvas as a dependency in your own app'
                  : 'Clone the apollo-ui repo and run Storybook locally'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {path === 'Add to existing project' && (
        <>
          <div className="space-y-6">
            <StepItem step={1} title="Install the package">
              <CodeBlock label="terminal">{'pnpm add @uipath/apollo-react'}</CodeBlock>
              <p>
                The canvas is included in the main package. No separate install needed for
                ReactFlow.
              </p>
            </StepItem>

            <StepItem step={2} title="Import the CSS theme">
              <CodeBlock label="main.tsx or _app.tsx">
                {"import '@uipath/apollo-react/core/theme.css';"}
              </CodeBlock>
              <p>This loads the Apollo design tokens as CSS custom properties.</p>
            </StepItem>

            <StepItem step={3} title="Render a canvas">
              <CodeBlock label="MyCanvas.tsx">
                {`import { useState, useCallback } from 'react';
import {
  type Node, type Edge,
  type NodeChange, type EdgeChange, type Connection,
  applyNodeChanges, applyEdgeChanges, addEdge,
  Panel,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas, CanvasModeToolbar, CanvasZoomControls } from '@uipath/apollo-react/canvas';

const initialNodes: Node[] = [
  { id: '1', type: 'baseNode', position: { x: 100, y: 100 }, data: { label: 'Start' } },
  { id: '2', type: 'baseNode', position: { x: 300, y: 100 }, data: { label: 'Process' } },
];
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'sequenceEdge' },
];

export function MyCanvas() {
  const [mode, setMode] = useState('design');
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((n) => applyNodeChanges(changes, n)), []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((e) => applyEdgeChanges(changes, e)), []
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((e) => addEdge(connection, e)), []
  );

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <BaseCanvas
        mode={mode}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Panel position="bottom-center">
          <CanvasModeToolbar mode={mode} onModeChange={setMode} />
        </Panel>
        <Panel position="bottom-right">
          <CanvasZoomControls />
        </Panel>
      </BaseCanvas>
    </div>
  );
}`}
              </CodeBlock>
            </StepItem>
          </div>

          <Divider />

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Import Paths</h3>
            <SectionDescription>
              Canvas exports are namespaced under the <InlineCode>/canvas</InlineCode> subpath.
            </SectionDescription>
            <div className="space-y-3">
              <CodeBlock label="Canvas components">
                {`import { BaseCanvas, CanvasModeToolbar, CanvasZoomControls } from '@uipath/apollo-react/canvas';`}
              </CodeBlock>
              <CodeBlock label="ReactFlow re-exports (nodes, edges, hooks)">
                {`import { useReactFlow, Panel, Handle } from '@uipath/apollo-react/canvas/xyflow/react';`}
              </CodeBlock>
              <CodeBlock label="Canvas hooks">
                {`import { useCanvasEvents, useExportCanvas, useElementsOverlap } from '@uipath/apollo-react/canvas';`}
              </CodeBlock>
            </div>
          </div>

          <Divider />

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Writing Stories</h3>
            <SectionDescription>
              Use the built-in storybook utilities to reduce boilerplate in canvas stories.
            </SectionDescription>
            <CodeBlock label="MyNode.stories.tsx">
              {`import { withCanvasProviders, useCanvasStory } from '../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';

const meta = {
  title: 'Components/Nodes/MyNode',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
};

function MyStory() {
  const { canvasProps } = useCanvasStory({
    initialNodes: [...],
    initialEdges: [...],
  });

  return <BaseCanvas {...canvasProps} mode="design" />;
}

export const Default = { render: () => <MyStory /> };`}
            </CodeBlock>
            <div className="mt-3">
              <InfoCallout>
                <span className="font-medium text-foreground">withCanvasProviders</span> wraps the
                story in ReactFlowProvider, ExecutionStatusContext, and ValidationStatusContext.{' '}
                <span className="font-medium text-foreground">useCanvasStory</span> manages
                node/edge state and returns a ready-to-spread <InlineCode>canvasProps</InlineCode>{' '}
                object.
              </InfoCallout>
            </div>
          </div>
        </>
      )}

      {path === 'Run locally' && (
        <>
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">Before you begin</p>
            <p>
              This path is for contributors and team members who want to browse or modify Apollo
              Canvas source files and run Storybook on their machine.
            </p>
          </InfoCallout>

          <div className="space-y-6">
            <StepItem step={1} title="Clone the repository">
              <CodeBlock label="terminal">
                {'git clone https://github.com/UiPath/apollo-ui.git\ncd apollo-ui'}
              </CodeBlock>
            </StepItem>

            <StepItem step={2} title="Install dependencies">
              <CodeBlock label="terminal">{'npm install -g pnpm\npnpm install'}</CodeBlock>
              <p>
                This project uses <InlineCode>pnpm</InlineCode> workspaces. Install it globally if
                you don't have it yet.
              </p>
            </StepItem>

            <StepItem step={3} title="Build all packages">
              <CodeBlock label="terminal">{'pnpm build'}</CodeBlock>
              <p>Compiles apollo-core, apollo-wind, and apollo-react before Storybook starts.</p>
            </StepItem>

            <StepItem step={4} title="Start Storybook">
              <CodeBlock label="terminal">{'pnpm storybook:dev'}</CodeBlock>
              <p>
                Opens Apollo Canvas Storybook at <InlineCode>http://localhost:6007</InlineCode>.
                Changes to source files hot-reload automatically.
              </p>
            </StepItem>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Tab: Components
// ============================================================================

const canvasComponents = [
  {
    category: 'Canvas',
    name: 'BaseCanvas',
    description: 'Root canvas container with Apollo defaults, pan/zoom, and mode handling.',
  },
  {
    category: 'Canvas',
    name: 'HierarchicalCanvas',
    description: 'Canvas variant for nested/hierarchical workflow structures.',
  },
  {
    category: 'Nodes',
    name: 'BaseNode',
    description: 'Standard rectangular node. Foundation for all other node types.',
  },
  {
    category: 'Nodes',
    name: 'LoopNode',
    description: 'Node that visually wraps a looping sub-process with iteration count.',
  },
  {
    category: 'Nodes',
    name: 'GroupNode',
    description: 'Collapsible container node for grouping related activities.',
  },
  {
    category: 'Nodes',
    name: 'StageNode',
    description: 'Stage/phase node representing top-level process milestones.',
  },
  {
    category: 'Nodes',
    name: 'TriggerNode',
    description: 'Entry-point node representing a workflow trigger event.',
  },
  {
    category: 'Nodes',
    name: 'StickyNoteNode',
    description: 'Free-form annotation node for adding canvas notes.',
  },
  {
    category: 'Edges',
    name: 'SequenceEdge',
    description: 'Animated directed edge representing execution flow between nodes.',
  },
  {
    category: 'Controls',
    name: 'CanvasModeToolbar',
    description: 'Mode switcher (design / debug / evaluate) with undo/redo and debug controls.',
  },
  {
    category: 'Controls',
    name: 'CanvasZoomControls',
    description: 'Zoom in, zoom out, fit-to-screen, and optional tidy-up controls.',
  },
  {
    category: 'Controls',
    name: 'Toolbox',
    description: 'Floating node picker panel for adding new nodes to the canvas.',
  },
  {
    category: 'Controls',
    name: 'AddNodePanel',
    description: 'Searchable add-node panel rendered inline or in a popover.',
  },
  {
    category: 'Controls',
    name: 'SmartHandle',
    description: 'Connection handle that shows contextual add-node actions on hover.',
  },
  {
    category: 'Controls',
    name: 'ButtonHandles',
    description: 'Handles that render as visible buttons for explicit connection creation.',
  },
  {
    category: 'Controls',
    name: 'NodeToolbar',
    description: 'Contextual action toolbar that appears above a selected node.',
  },
  {
    category: 'Panels',
    name: 'NodeInspector',
    description: 'Side panel showing structured properties for the selected node.',
  },
  {
    category: 'Panels',
    name: 'NodePropertiesPanel',
    description: 'Full-featured properties editor panel with sections and fields.',
  },
  {
    category: 'Panels',
    name: 'CollapseConfig',
    description: 'Collapsible configuration panel for compact inspector layouts.',
  },
  {
    category: 'Primitives',
    name: 'ExecutionStatusIcon',
    description: 'Icon indicating the execution status of a node (running, error, complete, etc.).',
  },
  {
    category: 'Primitives',
    name: 'TaskIcon',
    description: 'Icon component for rendering node-type icons from the Apollo icon registry.',
  },
] as const;

function ComponentsTab() {
  const categories = [...new Set(canvasComponents.map((c) => c.category))];

  return (
    <div className="space-y-8">
      <SectionDescription>
        All canvas components organised by category. Open the sidebar story for live examples and
        full prop documentation.
      </SectionDescription>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Component
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <React.Fragment key={category}>
                <tr className="border-b border-border bg-muted/30">
                  <td
                    colSpan={2}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {category}
                  </td>
                </tr>
                {canvasComponents
                  .filter((c) => c.category === category)
                  .map(({ name, description }) => (
                    <tr
                      key={name}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <InlineCode>{name}</InlineCode>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{description}</td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

const tabs = ['Overview', 'Quick Start', 'Components'] as const;
type TabId = (typeof tabs)[number];

function GettingStartedPage({ globalTheme }: { globalTheme: string }) {
  const [activeTab, setActiveTab] = React.useState<TabId>('Overview');

  return (
    <div
      className={cn(
        globalTheme || 'future-dark',
        'min-h-screen w-full bg-background text-foreground'
      )}
    >
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        {/* Header */}
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">Apollo Canvas</h1>
        <p className="text-base leading-7 text-muted-foreground">
          A visual workflow canvas built on ReactFlow. Nodes, edges, controls, and panels designed
          for process automation UIs.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0 pt-6">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={cn(
                'cursor-pointer px-4 pb-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Quick Start' && <QuickStartTab />}
          {activeTab === 'Components' && <ComponentsTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story export
// ============================================================================

export const Default: Story = {
  name: 'Getting Started',
  render: (_, { globals }) => <GettingStartedPage globalTheme={globals.theme || 'future-dark'} />,
};
