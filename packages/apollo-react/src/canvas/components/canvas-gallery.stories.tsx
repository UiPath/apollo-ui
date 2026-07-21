import type { Meta } from '@storybook/react-vite';
import { Button, Input } from '@uipath/apollo-wind';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { IRawSpan } from '../../types/TraceModels';
import { TimelinePlayer } from './AgentCanvas/components/TimelinePlayer';
import { ExecutionStatusIcon } from './ExecutionStatusIcon/ExecutionStatusIcon';
import { TaskIcon } from './TaskIcon/TaskIcon';
import { TaskItemTypeValues } from './TaskIcon/TaskIcon.types';

const meta = {
  title: 'Components/All Components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

enum Category {
  Canvas = 'Canvas',
  Nodes = 'Nodes',
  Controls = 'Controls',
  Edges = 'Edges',
  Utilities = 'Utilities',
}

const CATEGORY_ORDER: Category[] = [
  Category.Canvas,
  Category.Nodes,
  Category.Controls,
  Category.Edges,
  Category.Utilities,
];

interface ComponentInfo {
  name: string;
  description: string;
  storyPath: string;
  category: Category;
  preview: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Mock data for real component previews
// ---------------------------------------------------------------------------

const baseTime = new Date('2024-01-15T10:00:00.000Z');
const ts = (offsetMs: number) => new Date(baseTime.getTime() + offsetMs).toISOString();

const mockTimelineSpans: IRawSpan[] = [
  {
    Id: 'run-1',
    TraceId: 'trace-1',
    ParentId: null,
    SpanType: 'agentRun',
    Name: 'Agent Run',
    StartTime: ts(0),
    EndTime: ts(20000),
    Status: 1,
    Attributes: '{}',
  },
  {
    Id: 'span-1',
    TraceId: 'trace-1',
    ParentId: 'run-1',
    SpanType: 'toolCall',
    Name: 'Load Data',
    StartTime: ts(100),
    EndTime: ts(6000),
    Status: 1,
    Attributes: '{}',
  },
  {
    Id: 'span-2',
    TraceId: 'trace-1',
    ParentId: 'run-1',
    SpanType: 'completion',
    Name: 'Generate Response',
    StartTime: ts(6000),
    EndTime: ts(13000),
    Status: 1,
    Attributes: '{}',
  },
  {
    Id: 'span-3',
    TraceId: 'trace-1',
    ParentId: 'run-1',
    SpanType: 'toolCall',
    Name: 'Save Result',
    StartTime: ts(13000),
    EndTime: ts(19500),
    Status: 1,
    Attributes: '{}',
  },
];

// ---------------------------------------------------------------------------
// Shared preview atoms
// ---------------------------------------------------------------------------

const NodeCircle = () => (
  <div className="w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center" />
);

const NodeSquare = () => (
  <div className="w-8 h-8 rounded border-2 border-border bg-card flex items-center justify-center" />
);

const NodeRect = () => <div className="w-14 h-8 rounded border-2 border-border bg-card" />;

const MiniCanvas = () => (
  <div className="w-full h-20 rounded border border-border bg-muted/20 relative overflow-hidden">
    <div className="absolute top-3 left-4 w-7 h-7 rounded-full border-2 border-border bg-card" />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
      <path
        d="M 47 20 C 80 20 120 45 153 45"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className="text-border"
      />
    </svg>
    <div className="absolute top-9 right-4 w-14 h-7 rounded border-2 border-border bg-card" />
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded border border-border/50 bg-muted/30" />
  </div>
);

// ---------------------------------------------------------------------------
// Component list
// ---------------------------------------------------------------------------

const components: ComponentInfo[] = [
  // ── Canvas ──────────────────────────────────────────────────────────────
  {
    name: 'Agent Flow',
    description: 'Agent workflow canvas with resources and connections',
    storyPath: 'templates-canvas-agent-flow--design-mode',
    category: Category.Canvas,
    preview: <MiniCanvas />,
  },
  {
    name: 'Base Canvas',
    description: 'Core React Flow canvas viewport and provider',
    storyPath: 'components-canvas-basecanvas--default',
    category: Category.Canvas,
    preview: <MiniCanvas />,
  },
  {
    name: 'Coded Agent Flow',
    description: 'Canvas for coded agent process flows',
    storyPath: 'templates-canvas-agent-flow-coded--simple-flow',
    category: Category.Canvas,
    preview: <MiniCanvas />,
  },
  {
    name: 'Hierarchical Canvas',
    description: 'Nested canvas with parent/child viewport navigation',
    storyPath: 'components-canvas-hierarchicalcanvas--default',
    category: Category.Canvas,
    preview: (
      <div className="w-full h-20 rounded border border-border bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-2 rounded border border-dashed border-border/60 bg-muted/10">
          <div className="absolute inset-2 rounded border border-border/40 bg-card/40 flex items-center justify-center">
            <div className="w-6 h-6 rounded border border-border bg-card" />
          </div>
        </div>
      </div>
    ),
  },
  {
    name: 'Sequential Canvas',
    description:
      'Vertical, n8n-style projection of a flow graph with a flow/sequential view toggle',
    storyPath: 'components-sequentialcanvas-sequentialcanvas--wireframe',
    category: Category.Canvas,
    preview: (
      <div className="w-full h-20 rounded border border-border bg-muted/20 relative overflow-hidden p-2 flex flex-col gap-1 justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground w-2 text-right">{i + 1}</span>
            <div className="h-3 flex-1 rounded border border-border bg-card" />
          </div>
        ))}
      </div>
    ),
  },

  // ── Nodes ────────────────────────────────────────────────────────────────
  {
    name: 'Base Node',
    description: 'Core reusable node with shapes, icons and execution states',
    storyPath: 'components-nodes-basenode--default',
    category: Category.Nodes,
    preview: (
      <div className="flex gap-3 items-center">
        <NodeCircle />
        <NodeSquare />
        <NodeRect />
      </div>
    ),
  },
  {
    name: 'Group Node',
    description: 'Container node that holds nested child nodes',
    storyPath: 'components-nodes-groupnode--default',
    category: Category.Nodes,
    preview: (
      <div className="w-full h-20 rounded border-2 border-dashed border-border bg-muted/10 p-2 relative">
        <span className="text-xs text-muted-foreground">Group</span>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <NodeSquare />
          <NodeSquare />
        </div>
      </div>
    ),
  },
  {
    name: 'Loop Node',
    description: 'Iterating container that repeats inner nodes',
    storyPath: 'components-nodes-loopnode--default',
    category: Category.Nodes,
    preview: (
      <div className="w-full h-20 rounded border-2 border-border bg-card p-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Loop</span>
          <span className="text-xs text-muted-foreground">↻</span>
        </div>
        <div className="flex-1 rounded border border-dashed border-border bg-muted/20 flex items-center justify-center">
          <NodeSquare />
        </div>
      </div>
    ),
  },
  {
    name: 'Stage Node',
    description: 'Stage container with an ordered list of tasks',
    storyPath: 'components-nodes-stagenode--default',
    category: Category.Nodes,
    preview: (
      <div className="w-full rounded border-2 border-border bg-card overflow-hidden">
        <div className="px-3 py-1.5 border-b border-border text-xs font-medium">Stage</div>
        <div className="px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted-foreground/30" />
            <div className="h-2 bg-muted rounded flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted-foreground/30" />
            <div className="h-2 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
  {
    name: 'Sticky Note Node',
    description: 'Freeform annotation note on the canvas',
    storyPath: 'components-nodes-stickynotenode--default',
    category: Category.Nodes,
    preview: (
      <div className="w-20 h-16 bg-yellow-100 dark:bg-yellow-900/40 rounded-sm p-2 shadow-sm border border-yellow-300/50 dark:border-yellow-700/50">
        <div className="text-[10px] text-yellow-900 dark:text-yellow-200 leading-tight">
          Note text here…
        </div>
      </div>
    ),
  },
  {
    name: 'Trigger Node',
    description: 'Entry-point node that starts a flow',
    storyPath: 'components-nodes-triggernode--default',
    category: Category.Nodes,
    preview: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-2 bg-muted rounded w-16" />
          <div className="h-2 bg-muted rounded w-10" />
        </div>
      </div>
    ),
  },

  // ── Controls ─────────────────────────────────────────────────────────────
  {
    name: 'Add Node Panel',
    description: 'Panel for selecting and inserting new nodes',
    storyPath: 'components-controls-addnodepanel--preview-selection',
    category: Category.Controls,
    preview: (
      <div className="w-full rounded border border-border bg-card p-2 flex flex-col gap-1.5">
        <div className="h-5 rounded bg-muted/50 w-full mb-1" />
        {['Task', 'Event', 'Gateway'].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-muted-foreground/30 shrink-0" />
            <div className="text-xs text-muted-foreground">{item}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Collapse Config',
    description: 'Collapsible configuration sections for node properties',
    storyPath: 'components-panels-collapseconfig--default',
    category: Category.Controls,
    preview: (
      <div className="w-full rounded border border-border bg-card overflow-hidden text-xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span>Section A</span>
          <span className="text-muted-foreground">▾</span>
        </div>
        <div className="px-3 py-1.5 bg-muted/20">
          <div className="h-2 bg-muted rounded w-3/4" />
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span>Section B</span>
          <span className="text-muted-foreground">▸</span>
        </div>
      </div>
    ),
  },
  {
    name: 'Node Properties Panel',
    description: 'Side panel for editing selected node properties',
    storyPath: 'components-panels-nodepropertiespanel--default',
    category: Category.Controls,
    preview: (
      <div className="w-full rounded border border-border bg-card p-2 flex flex-col gap-2 text-xs">
        <span className="font-medium">Properties</span>
        <div className="flex flex-col gap-1">
          <div className="h-2 bg-muted rounded w-1/3" />
          <div className="h-5 bg-muted/40 rounded border border-border w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-2 bg-muted rounded w-1/4" />
          <div className="h-5 bg-muted/40 rounded border border-border w-full" />
        </div>
      </div>
    ),
  },
  {
    name: 'Node Toolbar',
    description: 'Contextual action toolbar shown above selected nodes',
    storyPath: 'components-controls-nodetoolbar--default',
    category: Category.Controls,
    preview: (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1 rounded-md border border-border bg-card shadow-sm px-1.5 py-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-6 h-6 rounded bg-muted/60" />
          ))}
        </div>
        <NodeRect />
      </div>
    ),
  },
  {
    name: 'Toolbox',
    description: 'Element picker popover for adding canvas components',
    storyPath: 'components-controls-toolbox--default',
    category: Category.Controls,
    preview: (
      <div className="w-full rounded border border-border bg-card p-2 flex flex-col gap-1 text-xs">
        <span className="font-medium mb-0.5">Add element</span>
        {[
          { shape: '○', name: 'Event' },
          { shape: '□', name: 'Task' },
          { shape: '◇', name: 'Gateway' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-muted-foreground">
            <span>{item.shape}</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Toolbox List View',
    description: 'Scrollable list view for toolbox items',
    storyPath: 'components-controls-toolbox-listview--empty-state-default',
    category: Category.Controls,
    preview: (
      <div className="w-full rounded border border-border bg-card overflow-hidden text-xs">
        {['Task', 'Call Activity', 'Gateway', 'Event'].map((name) => (
          <div
            key={name}
            className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 last:border-0"
          >
            <div className="w-3.5 h-3.5 rounded-sm bg-muted-foreground/30 shrink-0" />
            <span>{name}</span>
          </div>
        ))}
      </div>
    ),
  },

  // ── Edges ─────────────────────────────────────────────────────────────────
  {
    name: 'Edges',
    description: 'All canvas edge types and connection styles',
    storyPath: 'components-edges--all-edge-types',
    category: Category.Edges,
    preview: (
      <div className="w-full h-16 relative flex items-center px-3">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-border bg-card shrink-0" />
        <svg className="flex-1 h-8 mx-1" viewBox="0 0 100 32" preserveAspectRatio="none">
          <path
            d="M 0 16 C 25 16 75 16 100 16"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-border"
          />
          <polygon points="96,12 100,16 96,20" fill="currentColor" className="text-border" />
        </svg>
        <div className="w-3.5 h-3.5 rounded-full border-2 border-border bg-card shrink-0" />
      </div>
    ),
  },
  {
    name: 'Sequence Edge',
    description: 'Sequence flow edge connecting ordered nodes',
    storyPath: 'components-edges-sequenceedge--default',
    category: Category.Edges,
    preview: (
      <div className="w-full h-16 relative flex items-center px-3">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/10 shrink-0" />
        <svg className="flex-1 h-8 mx-1" viewBox="0 0 100 32" preserveAspectRatio="none">
          <path
            d="M 0 16 C 25 16 75 16 100 16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 2"
            className="text-primary/60"
          />
          <polygon points="96,12 100,16 96,20" fill="currentColor" className="text-primary/60" />
        </svg>
        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/10 shrink-0" />
      </div>
    ),
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  {
    name: 'Button Handles',
    description: 'Button-style connection handles on canvas nodes',
    storyPath: 'components-controls-buttonhandles--default',
    category: Category.Utilities,
    preview: (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded border-2 border-border bg-card relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border-2 border-primary bg-background absolute -right-1.5 top-1/2 -translate-y-1/2" />
          <div className="w-3 h-3 rounded-full border-2 border-primary bg-background absolute -left-1.5 top-1/2 -translate-y-1/2" />
          <div className="text-xs text-muted-foreground">Node</div>
        </div>
      </div>
    ),
  },
  {
    name: 'Execution Status Icon',
    description: 'Icons representing node execution states',
    storyPath: 'components-primitives-executionstatusicon--default',
    category: Category.Utilities,
    preview: (
      <div className="flex gap-2 flex-wrap">
        <ExecutionStatusIcon status="Completed" size={20} />
        <ExecutionStatusIcon status="InProgress" size={20} />
        <ExecutionStatusIcon status="Failed" size={20} />
        <ExecutionStatusIcon status="Paused" size={20} />
        <ExecutionStatusIcon status="Warning" size={20} />
      </div>
    ),
  },
  {
    name: 'Node Inspector',
    description: 'Debug overlay showing live node and edge state',
    storyPath: 'components-panels-nodeinspector--default',
    category: Category.Utilities,
    preview: (
      <div className="w-full rounded border border-border bg-card p-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
        <div>id: "node-1"</div>
        <div>pos: {'{ x: 96, y: 48 }'}</div>
        <div>type: "baseNode"</div>
        <div>selected: false</div>
      </div>
    ),
  },
  {
    name: 'Performance',
    description: 'Canvas rendering performance benchmark story',
    storyPath: 'components-canvas-performance--stage-workflow',
    category: Category.Utilities,
    preview: (
      <div className="w-full h-16 rounded border border-border bg-muted/20 relative overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-sm border border-border/60 bg-card"
            style={{
              left: `${(i % 6) * 16 + 4}%`,
              top: `${Math.floor(i / 6) * 40 + 15}%`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    name: 'Smart Handle',
    description: 'Adaptive handle that snaps to the nearest node edge',
    storyPath: 'components-controls-smarthandle--default',
    category: Category.Utilities,
    preview: (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded border-2 border-border bg-card relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary/20 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
          <div className="text-xs text-muted-foreground">Node</div>
        </div>
        <svg className="w-10 h-8" viewBox="0 0 40 32">
          <path
            d="M 0 24 C 15 24 25 8 40 8"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-border"
          />
        </svg>
        <div className="w-12 h-12 rounded border-2 border-border bg-card" />
      </div>
    ),
  },
  {
    name: 'Task Icon',
    description: 'Icons representing different task types',
    storyPath: 'components-primitives-taskicon--default',
    category: Category.Utilities,
    preview: (
      <div className="flex gap-2 flex-wrap">
        <TaskIcon type={TaskItemTypeValues.User} size="sm" />
        <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />
        <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />
        <TaskIcon type={TaskItemTypeValues.ExternalAgent} size="sm" />
      </div>
    ),
  },
  {
    name: 'Timeline Player',
    description: 'Playback control for execution trace replay',
    storyPath: 'components-controls-timelineplayer--default',
    category: Category.Utilities,
    preview: (
      <div className="w-full overflow-hidden">
        <TimelinePlayer spans={mockTimelineSpans} enableTimelinePlayer />
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Gallery component
// ---------------------------------------------------------------------------

function CanvasComponentGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedComponents = useMemo(() => {
    const grouped: Record<Category, typeof components> = {
      [Category.Canvas]: [],
      [Category.Nodes]: [],
      [Category.Controls]: [],
      [Category.Edges]: [],
      [Category.Utilities]: [],
    };
    filteredComponents.forEach((component) => {
      grouped[component.category].push(component);
    });
    return grouped;
  }, [filteredComponents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Canvas components
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                Explore the collection of {components.length} canvas components — nodes, edges,
                controls, and utilities for building interactive flow editors.
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="transition-all duration-200"
                >
                  All ({components.length})
                </Button>
                {CATEGORY_ORDER.map((category) => {
                  const count = components.filter((c) => c.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="transition-all duration-200"
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="px-8 py-10 max-w-7xl mx-auto">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No components found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {CATEGORY_ORDER.map((category) => {
              const categoryComponents = groupedComponents[category];
              if (categoryComponents.length === 0) return null;

              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">{category}</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryComponents.map((component) => (
                      <a
                        key={component.name}
                        href={`/?path=/story/${component.storyPath}`}
                        target="_top"
                        className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg min-w-0"
                      >
                        <div className="h-full rounded-lg border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-border hover:shadow-md">
                          {/* Preview Area */}
                          <div className="h-[140px] bg-muted/30 flex items-center justify-center p-4">
                            <div className="max-w-full w-full">{component.preview}</div>
                          </div>

                          {/* Component Info */}
                          <div className="px-4 py-3 border-t border-border/30">
                            <h3 className="font-medium text-sm text-foreground">
                              {component.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {component.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const Default = {
  args: {},
  render: () => <CanvasComponentGallery />,
};
