import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  type NodeProps,
  useNodesInitialized,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  Card,
  CardContent,
  type FormSchema,
  InputGroup,
  InputGroupInput,
  Label,
  type PanelImperativeHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react';
import { DockviewReact } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import {
  Blocks,
  Bold,
  Bug,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Code2,
  FlaskConical,
  GitBranch,
  Globe,
  Italic,
  List,
  ListOrdered,
  Mail,
  Play,
  Plus,
  Redo2,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Trash2,
  Underline,
  Undo2,
  Upload,
  UserRoundCheck,
} from 'lucide-react';
import {
  createContext,
  type DragEvent,
  Fragment,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ApChat,
  type ApChatTheme,
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatRole,
  AutopilotChatService,
} from '../../../material/components';
import { BaseCanvas } from '../../components/BaseCanvas';
import type { BaseNodeData } from '../../components/BaseNode/BaseNode.types';
import { CanvasBottomPanel, type CanvasBottomPanelTab } from '../../components/CanvasBottomPanel';
import {
  CanvasLeftSidebar,
  type CanvasLeftSidebarItemId,
} from '../../components/CanvasLeftSidebar';
import {
  CanvasModeToolbar,
  CountBadge,
  TOOLBAR_ICON_BUTTON_CLASS,
} from '../../components/CanvasModeToolbar';
import { CanvasTakeoverModal } from '../../components/CanvasTakeoverModal';
import { CanvasZoomControls } from '../../components/CanvasZoomControls';
import { NodeIOView } from '../../components/NodeIOView';
import { NodePropertyPanel, NodePropertyPanelLayout } from '../../components/NodePropertyPanel';
import { QuickFormPanel } from '../../components/NodePropertyPanel/NodePropertyPanel.stories';
import type { NodePropertyPanelProps } from '../../components/NodePropertyPanel/NodePropertyPanel.types';
import { ToolbarButton } from '../../components/ToolbarButton';
import {
  NodePropertyTrigger,
  type NodePropertyTriggerLayout,
} from '../../controls/NodePropertyTrigger';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { CanvasIcon } from '../../utils/icon-registry';
import './Flow.stories.css';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Templates/Flow Standalone',
  excludeStories: [
    'QuickFormPropertiesPanelPreview',
    'DraggablePanelLayout',
    'FullWorkbenchComposition',
    'NodeInventoryComposition',
    'AgentExperienceComposition',
    'mapTemplateThemeToChat',
  ],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample Canvas Data
// ============================================================================

type WorkflowVariant = 'default' | 'forms' | 'node' | 'rules' | 'variables';

function createFlowGraph(variant: WorkflowVariant): {
  nodes: Node<BaseNodeData>[];
  edges: Edge[];
} {
  if (variant === 'forms') {
    const nodes = [
      createNode({
        id: 'trigger',
        type: 'uipath.manual-trigger',
        position: { x: 80, y: 200 },
        display: { label: 'Invoice received', subLabel: 'Document trigger' },
      }),
      createNode({
        id: 'extract',
        type: 'uipath.blank-node',
        position: { x: 310, y: 200 },
        display: { label: 'Extract invoice', subLabel: 'Document understanding' },
      }),
      createNode({
        id: 'form',
        type: 'uipath.blank-node',
        position: { x: 540, y: 110 },
        display: { label: 'Build approval form', subLabel: 'Quick Approve' },
      }),
      createNode({
        id: 'response',
        type: 'uipath.blank-node',
        position: { x: 540, y: 290 },
        display: { label: 'Wait for response', subLabel: 'Human in the loop' },
      }),
      createNode({
        id: 'update',
        type: 'uipath.blank-node',
        position: { x: 780, y: 200 },
        display: { label: 'Update invoice', subLabel: 'System of record' },
      }),
    ];
    return {
      nodes,
      edges: [
        ['trigger', 'extract'],
        ['extract', 'form'],
        ['form', 'response'],
        ['response', 'update'],
      ].map(([source, target]) => ({
        id: `e-${source}-${target}`,
        source,
        target,
        sourceHandle: 'output',
        targetHandle: 'input',
      })),
    };
  }

  if (variant === 'node') {
    const nodes = [
      createNode({
        id: 'trigger',
        type: 'uipath.manual-trigger',
        position: { x: 100, y: 200 },
        display: { label: 'Record updated', subLabel: 'Salesforce trigger' },
      }),
      createNode({
        id: 'assignee',
        type: 'uipath.blank-node',
        position: { x: 360, y: 100 },
        display: { label: 'Get assignee', subLabel: 'Data query' },
      }),
      createNode({
        id: 'account',
        type: 'uipath.blank-node',
        position: { x: 360, y: 300 },
        display: { label: 'Get account details', subLabel: 'Salesforce' },
      }),
      createNode({
        id: 'email',
        type: 'uipath.blank-node',
        position: { x: 640, y: 200 },
        display: { label: 'Send Email', subLabel: 'Microsoft Outlook 365' },
      }),
    ];
    return {
      nodes,
      edges: [
        ['trigger', 'assignee'],
        ['trigger', 'account'],
        ['assignee', 'email'],
        ['account', 'email'],
      ].map(([source, target]) => ({
        id: `e-${source}-${target}`,
        source,
        target,
        sourceHandle: 'output',
        targetHandle: 'input',
      })),
    };
  }

  if (variant === 'rules') {
    const nodes = [
      createNode({
        id: 'trigger',
        type: 'uipath.manual-trigger',
        position: { x: 70, y: 200 },
        display: { label: 'Invoice received', subLabel: 'Document trigger' },
      }),
      createNode({
        id: 'extract',
        type: 'uipath.blank-node',
        position: { x: 290, y: 200 },
        display: { label: 'Extract invoice facts', subLabel: 'Document understanding' },
      }),
      createNode({
        id: 'rules',
        type: 'uipath.blank-node',
        position: { x: 520, y: 200 },
        display: { label: 'Evaluate approval rules', subLabel: 'Conditional logic' },
      }),
      createNode({
        id: 'approve',
        type: 'uipath.blank-node',
        position: { x: 760, y: 100 },
        display: { label: 'Auto approve', subLabel: 'Low risk' },
      }),
      createNode({
        id: 'review',
        type: 'uipath.blank-node',
        position: { x: 760, y: 300 },
        display: { label: 'Manager review', subLabel: 'High risk' },
      }),
    ];
    return {
      nodes,
      edges: [
        ['trigger', 'extract'],
        ['extract', 'rules'],
        ['rules', 'approve'],
        ['rules', 'review'],
      ].map(([source, target]) => ({
        id: `e-${source}-${target}`,
        source,
        target,
        sourceHandle: 'output',
        targetHandle: 'input',
      })),
    };
  }

  if (variant === 'variables') {
    const nodes = [
      createNode({
        id: 'trigger',
        type: 'uipath.manual-trigger',
        position: { x: 80, y: 200 },
        display: { label: 'Start workflow', subLabel: 'Manual trigger' },
      }),
      createNode({
        id: 'initialize',
        type: 'uipath.blank-node',
        position: { x: 320, y: 200 },
        display: { label: 'Initialize variables', subLabel: 'Workflow scope' },
      }),
      createNode({
        id: 'transform',
        type: 'uipath.blank-node',
        position: { x: 560, y: 110 },
        display: { label: 'Transform invoice data', subLabel: 'Expressions' },
      }),
      createNode({
        id: 'assign',
        type: 'uipath.blank-node',
        position: { x: 560, y: 290 },
        display: { label: 'Assign approval state', subLabel: 'Variables' },
      }),
      createNode({
        id: 'output',
        type: 'uipath.blank-node',
        position: { x: 800, y: 200 },
        display: { label: 'Publish outputs', subLabel: 'Workflow results' },
      }),
    ];
    return {
      nodes,
      edges: [
        ['trigger', 'initialize'],
        ['initialize', 'transform'],
        ['initialize', 'assign'],
        ['transform', 'output'],
        ['assign', 'output'],
      ].map(([source, target]) => ({
        id: `e-${source}-${target}`,
        source,
        target,
        sourceHandle: 'output',
        targetHandle: 'input',
      })),
    };
  }

  const nodes = [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: { x: 100, y: 200 },
      display: { label: 'Manual trigger' },
    }),
    createNode({
      id: 'action-1',
      type: 'uipath.blank-node',
      position: { x: 350, y: 100 },
      display: { label: 'Read Excel', subLabel: 'Excel activities' },
    }),
    createNode({
      id: 'action-2',
      type: 'uipath.blank-node',
      position: { x: 350, y: 300 },
      display: { label: 'Analyze data', subLabel: 'AI Agent' },
    }),
    createNode({
      id: 'action-3',
      type: 'uipath.blank-node',
      position: { x: 600, y: 200 },
      display: { label: 'Send summary', subLabel: 'Slack integration' },
    }),
  ];
  const edges: Edge[] = [
    {
      id: 'e-trigger-action-1',
      source: 'trigger',
      target: 'action-1',
      sourceHandle: 'output',
      targetHandle: 'input',
    },
    {
      id: 'e-trigger-action-2',
      source: 'trigger',
      target: 'action-2',
      sourceHandle: 'output',
      targetHandle: 'input',
    },
    {
      id: 'e-action-1-action-3',
      source: 'action-1',
      target: 'action-3',
      sourceHandle: 'output',
      targetHandle: 'input',
    },
    {
      id: 'e-action-2-action-3',
      source: 'action-2',
      target: 'action-3',
      sourceHandle: 'output',
      targetHandle: 'input',
    },
  ];
  return { nodes, edges };
}

// ============================================================================
// Canvas content component (must be inside ReactFlowProvider)
// ============================================================================

function FlowCanvas({ workflowVariant = 'default' }: { workflowVariant?: WorkflowVariant }) {
  const graph = useMemo(() => createFlowGraph(workflowVariant), [workflowVariant]);
  const { canvasProps } = useCanvasStory({
    initialNodes: graph.nodes,
    initialEdges: graph.edges,
  });

  return <BaseCanvas {...canvasProps} mode="design" />;
}

const panelBehaviorOptions = [
  { value: 'auto-hide', label: 'Auto hide' },
  { value: 'always-persist', label: 'Always persist' },
];

const panelLayoutOptions = [
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'split', label: 'Split' },
];

function PanelTrigger({
  panels = [
    { id: 'input', label: 'Input', enabled: false },
    { id: 'properties', label: 'Properties', enabled: false },
    { id: 'output', label: 'Output', enabled: false },
  ],
  layout,
  onLayoutChange,
  onPanelToggle,
  onPropertiesClick,
}: {
  panels?: { id: string; label: string; enabled: boolean }[];
  layout?: NodePropertyTriggerLayout;
  onLayoutChange?: (layout: NodePropertyTriggerLayout) => void;
  onPanelToggle?: (id: string, enabled: boolean) => void;
  onPropertiesClick?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <NodePropertyTrigger
      open={menuOpen}
      onOpenChange={setMenuOpen}
      panels={panels}
      behaviorOptions={panelBehaviorOptions}
      layout={layout}
      layoutOptions={panelLayoutOptions}
      onLayoutChange={onLayoutChange}
      onPanelToggle={(id, enabled) => {
        onPanelToggle?.(id, enabled);
        setMenuOpen(false);
      }}
      onPropertiesClick={onPropertiesClick}
    />
  );
}

function StandaloneRightPropertiesComposition({
  initiallyOpen = true,
}: {
  initiallyOpen?: boolean;
} = {}) {
  const [rightPanelOpen, setRightPanelOpen] = useState(initiallyOpen);
  const [panelZone, setPanelZone] = useState<StandaloneDockZone>('right');
  const [activeDropZone, setActiveDropZone] = useState<StandaloneDockZone | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const dragState = useRef<{
    pointerId: number;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const activeDropZoneRef = useRef<StandaloneDockZone | null>(null);

  const getDropZone = (event: PointerEvent<HTMLDivElement>): StandaloneDockZone => {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return panelZone;
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const horizontalZone = x < 0.5 ? 'left' : 'right';
    const verticalZone = y < 0.5 ? 'top' : 'bottom';
    const horizontalEdgeDistance = Math.min(x, 1 - x);
    const verticalEdgeDistance = Math.min(y, 1 - y);
    return horizontalEdgeDistance < verticalEdgeDistance ? horizontalZone : verticalZone;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-slot="node-property-panel-drag-handle"]')) return;
    const titleBar = target.closest<HTMLElement>('[data-slot="node-property-panel-titlebar"]');
    if (!titleBar) return;
    const titleBarBounds = titleBar.getBoundingClientRect();
    const containerBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerBounds) return;
    dragState.current = {
      pointerId: event.pointerId,
      pointerOffsetX: event.clientX - titleBarBounds.left,
      pointerOffsetY: event.clientY - titleBarBounds.top,
    };
    setDragPreviewPosition({
      left: titleBarBounds.left - containerBounds.left,
      top: titleBarBounds.top - containerBounds.top,
    });
    activeDropZoneRef.current = panelZone;
    setActiveDropZone(panelZone);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const containerBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerBounds) return;
    const previewWidth = Math.min(380, containerBounds.width - 16);
    const previewHeight = 40;
    setDragPreviewPosition({
      left: Math.max(
        8,
        Math.min(
          containerBounds.width - previewWidth - 8,
          event.clientX - containerBounds.left - drag.pointerOffsetX
        )
      ),
      top: Math.max(
        8,
        Math.min(
          containerBounds.height - previewHeight - 8,
          event.clientY - containerBounds.top - drag.pointerOffsetY
        )
      ),
    });
    const nextZone = getDropZone(event);
    activeDropZoneRef.current = nextZone;
    setActiveDropZone(nextZone);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const nextZone = activeDropZoneRef.current;
    if (nextZone) setPanelZone(nextZone);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    activeDropZoneRef.current = null;
    setActiveDropZone(null);
    setDragPreviewPosition(null);
  };

  const panelPositionClass = {
    left: 'absolute inset-y-0 left-0 p-4 pr-0',
    right: 'absolute inset-y-0 right-0 p-4 pl-0',
    top: 'absolute inset-x-0 top-0 p-4 pb-0',
    bottom: 'absolute inset-x-0 bottom-0 p-4 pt-0',
  }[panelZone];
  const panelSizeClass = dragPreviewPosition
    ? 'h-10 w-[min(380px,calc(100vw-16px))]'
    : panelZone === 'top' || panelZone === 'bottom'
      ? 'h-[360px] w-full'
      : 'h-full w-[380px]';

  return (
    <div className="relative h-screen overflow-hidden bg-surface">
      <CanvasViewport
        rightControlsOffset={rightPanelOpen && panelZone === 'right' ? 412 : 16}
        bottomControlsOffset={rightPanelOpen && panelZone === 'bottom' ? 380 : 20}
        trigger={
          <PanelTrigger
            layout={
              rightPanelOpen
                ? panelZone === 'right' || panelZone === 'bottom'
                  ? panelZone
                  : 'split'
                : 'closed'
            }
            panels={[
              { id: 'input', label: 'Input', enabled: false },
              { id: 'properties', label: 'Properties', enabled: rightPanelOpen },
              { id: 'output', label: 'Output', enabled: false },
            ]}
            onPanelToggle={(id, enabled) => {
              if (id === 'properties') setRightPanelOpen(enabled);
            }}
            onLayoutChange={(layout) => {
              setPanelZone(layout === 'bottom' ? 'bottom' : layout === 'split' ? 'left' : 'right');
              setRightPanelOpen(true);
            }}
            onPropertiesClick={() => {
              setPanelZone('right');
              setRightPanelOpen(true);
            }}
          />
        }
      />
      {activeDropZone && <StandaloneDockHint zone={activeDropZone} />}
      {rightPanelOpen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          aria-grabbed={Boolean(dragPreviewPosition)}
          className={`${dragPreviewPosition ? 'absolute touch-none p-0' : panelPositionClass} z-50`}
          style={dragPreviewPosition ?? undefined}
        >
          <div
            className={`${panelSizeClass} overflow-hidden rounded-2xl border border-border-subtle shadow-lg ${dragPreviewPosition ? 'cursor-grabbing shadow-2xl ring-2 ring-primary/30 [&_[data-slot=node-property-panel-drag-handle]]:cursor-grabbing [&_[data-slot=node-property-panel-titlebar]]:bg-surface-overlay' : ''}`}
          >
            <PropertiesPanel
              className={
                dragPreviewPosition
                  ? 'h-10 [&>*:not([data-slot=node-property-panel-titlebar])]:hidden'
                  : 'h-full'
              }
              onClose={() => setRightPanelOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type StandaloneDockZone = 'left' | 'right' | 'top' | 'bottom';

function StandaloneDockHint({ zone }: { zone: StandaloneDockZone }) {
  const zoneClass = {
    left: 'inset-y-4 left-4 right-[52%]',
    right: 'inset-y-4 left-[52%] right-4',
    top: 'inset-x-4 top-4 bottom-[52%]',
    bottom: 'inset-x-4 top-[52%] bottom-4',
  }[zone];

  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-hidden="true">
      <div
        className={`absolute ${zoneClass} rounded-xl border-2 border-primary bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]`}
      />
    </div>
  );
}

function CanvasNavigationControls() {
  return (
    <CanvasModeToolbar>
      <ToolbarButton label="Undo (⌘Z)" className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}>
        <Undo2 />
        <CountBadge count={3} />
      </ToolbarButton>
      <ToolbarButton label="Redo (⌘⇧Z)" className={`relative ${TOOLBAR_ICON_BUTTON_CLASS}`}>
        <Redo2 />
        <CountBadge count={1} />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-5" />
      <ToolbarButton label="Run debug" className={TOOLBAR_ICON_BUTTON_CLASS}>
        <Play />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-5" />
      <ToolbarButton label="Add node" className={TOOLBAR_ICON_BUTTON_CLASS}>
        <Plus />
      </ToolbarButton>
      <ToolbarButton label="Add note" className={TOOLBAR_ICON_BUTTON_CLASS}>
        <StickyNote />
      </ToolbarButton>
    </CanvasModeToolbar>
  );
}

function CanvasViewport({
  trigger,
  children,
  bottomControlsOffset = 20,
  rightControlsOffset = 16,
  workflowVariant = 'default',
}: {
  trigger?: ReactNode;
  children?: ReactNode;
  bottomControlsOffset?: number;
  rightControlsOffset?: number;
  workflowVariant?: WorkflowVariant;
}) {
  const { getNodes, getNodesBounds, getViewport, setEdges, setNodes, setViewport } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const occupiedRight = Math.max(0, rightControlsOffset - 16);

  const centerWorkflow = useCallback(
    (duration: number) => {
      const container = viewportContainerRef.current;
      const nodes = getNodes();
      if (!container || nodes.length === 0) return;
      const bounds = getNodesBounds(nodes);
      const viewport = getViewport();
      const occupiedBottom = Math.max(0, bottomControlsOffset - 20);
      const availableCenterX = (container.clientWidth - occupiedRight) / 2;
      const availableCenterY = (container.clientHeight - occupiedBottom) / 2;
      void setViewport(
        {
          ...viewport,
          x: availableCenterX - (bounds.x + bounds.width / 2) * viewport.zoom,
          y: availableCenterY - (bounds.y + bounds.height / 2) * viewport.zoom,
        },
        { duration }
      );
    },
    [bottomControlsOffset, getNodes, getNodesBounds, getViewport, occupiedRight, setViewport]
  );

  useEffect(() => {
    if (!nodesInitialized) return;
    const timeout = window.setTimeout(() => centerWorkflow(200), 100);
    return () => window.clearTimeout(timeout);
  }, [centerWorkflow, nodesInitialized]);

  const tidy = useCallback(() => {
    const graph = createFlowGraph(workflowVariant);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    window.setTimeout(() => centerWorkflow(200), 100);
  }, [centerWorkflow, setEdges, setNodes, workflowVariant]);

  return (
    <div ref={viewportContainerRef} className="relative h-full min-h-0 min-w-0 overflow-hidden">
      <FlowCanvas workflowVariant={workflowVariant} />
      {children}
      <div className="absolute top-4 z-20" style={{ right: rightControlsOffset }}>
        {trigger ?? <PanelTrigger />}
      </div>
      <div
        className="absolute z-20 -translate-x-1/2"
        style={{ left: `calc(50% - ${occupiedRight / 2}px)`, bottom: bottomControlsOffset }}
      >
        <CanvasNavigationControls />
      </div>
      <div
        className="absolute z-20"
        style={{ right: rightControlsOffset, bottom: bottomControlsOffset }}
      >
        <CanvasZoomControls orientation="vertical" onOrganize={tidy} />
      </div>
    </div>
  );
}

function getBottomPropertiesPanelHeight() {
  return Math.min(720, Math.max(320, window.innerHeight * 0.4));
}

function BottomPropertiesComposition() {
  const [panelHeight, setPanelHeight] = useState(getBottomPropertiesPanelHeight);
  const [visiblePanels, setVisiblePanels] = useState<BottomPanelId[]>([
    'input',
    'properties',
    'output',
  ]);
  const [panelZones, setPanelZones] = useState<
    Record<BottomPanelId, StandaloneDockZone | 'bottom'>
  >({
    input: 'bottom',
    properties: 'bottom',
    output: 'bottom',
  });
  const [draggedPanel, setDraggedPanel] = useState<BottomPanelId | null>(null);
  const [activeDockZone, setActiveDockZone] = useState<StandaloneDockZone | null>(null);

  useEffect(() => {
    const updatePanelHeight = () => setPanelHeight(getBottomPropertiesPanelHeight());
    window.addEventListener('resize', updatePanelHeight);
    return () => window.removeEventListener('resize', updatePanelHeight);
  }, []);

  const bottomPanels = visiblePanels.filter((panelId) => panelZones[panelId] === 'bottom');
  const dockedPanels = (zone: Exclude<StandaloneDockZone, 'bottom'>) =>
    visiblePanels.filter((panelId) => panelZones[panelId] === zone);

  const resetPanelDrag = () => {
    setDraggedPanel(null);
    setActiveDockZone(null);
  };

  const closePanel = (panelId: BottomPanelId) => {
    setVisiblePanels((current) => current.filter((id) => id !== panelId));
    resetPanelDrag();
  };

  const getCanvasDockZone = (event: DragEvent<HTMLDivElement>): StandaloneDockZone => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const horizontalZone = x < 0.5 ? 'left' : 'right';
    const verticalZone = y < 0.5 ? 'top' : 'bottom';
    return Math.min(x, 1 - x) < Math.min(y, 1 - y) ? horizontalZone : verticalZone;
  };

  return (
    <div
      className="relative h-screen overflow-hidden bg-surface"
      onDragOver={(event) => {
        if (!draggedPanel || (event.target as HTMLElement).closest('[data-bottom-panel-slot]'))
          return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setActiveDockZone(getCanvasDockZone(event));
      }}
      onDrop={(event) => {
        if (!draggedPanel || !activeDockZone) return;
        event.preventDefault();
        setPanelZones((current) => ({ ...current, [draggedPanel]: activeDockZone }));
        resetPanelDrag();
      }}
      onDragEnd={resetPanelDrag}
    >
      <CanvasViewport
        bottomControlsOffset={bottomPanels.length > 0 ? panelHeight + 20 : 20}
        rightControlsOffset={dockedPanels('right').length > 0 ? 412 : 16}
        trigger={
          <PanelTrigger
            layout={
              visiblePanels.length === 0
                ? 'closed'
                : bottomPanels.length === visiblePanels.length
                  ? 'bottom'
                  : 'split'
            }
            panels={(['input', 'properties', 'output'] as const).map((id) => ({
              id,
              label: id[0]?.toUpperCase() + id.slice(1),
              enabled: visiblePanels.includes(id),
            }))}
            onPanelToggle={(id, enabled) => {
              const panelId = id as BottomPanelId;
              if (enabled) {
                setPanelZones((current) => ({ ...current, [panelId]: 'bottom' }));
              }
              setVisiblePanels((current) =>
                enabled
                  ? current.includes(panelId)
                    ? current
                    : [...current, panelId]
                  : current.filter((currentId) => currentId !== panelId)
              );
            }}
            onLayoutChange={(layout) => {
              if (layout === 'bottom') {
                setVisiblePanels(['input', 'properties', 'output']);
                setPanelZones({ input: 'bottom', properties: 'bottom', output: 'bottom' });
              }
            }}
            onPropertiesClick={() => {
              setPanelZones((current) => ({ ...current, properties: 'bottom' }));
              setVisiblePanels((current) =>
                current.includes('properties') ? current : [...current, 'properties']
              );
            }}
          />
        }
      />
      {activeDockZone && <StandaloneDockHint zone={activeDockZone} />}
      {(['left', 'right', 'top'] as const).map((zone) => {
        const zonePanels = dockedPanels(zone);
        return zonePanels.length > 0 ? (
          <DockedDataPanels
            key={zone}
            zone={zone}
            panelIds={zonePanels}
            onPanelClose={closePanel}
            onPanelDragStart={setDraggedPanel}
            onPanelDragEnd={resetPanelDrag}
          />
        ) : null;
      })}
      {bottomPanels.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-0" style={{ height: panelHeight }}>
          <BottomPanels
            visiblePanels={bottomPanels}
            activeDraggedPanel={draggedPanel}
            onPanelClose={closePanel}
            onPanelDragStart={setDraggedPanel}
            onPanelDragEnd={resetPanelDrag}
            onPanelReorderHover={() => setActiveDockZone(null)}
            onPanelMoveToBottom={(panelId) =>
              setPanelZones((current) => ({ ...current, [panelId]: 'bottom' }))
            }
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

const httpRequestForm: FormSchema = {
  id: 'http-request',
  title: 'HTTP Request',
  mode: 'onChange',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'text',
              name: 'endpoint',
              label: 'Endpoint',
              defaultValue: 'https://finance.internal/api/invoices',
            },
            {
              type: 'select',
              name: 'method',
              label: 'Method',
              defaultValue: 'GET',
              dataSource: {
                type: 'static',
                options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({
                  label: value,
                  value,
                })),
              },
            },
          ],
        },
      ],
    },
    { id: 'error-handling', title: 'Error handling', sections: [] },
    { id: 'advanced', title: 'Advanced', sections: [] },
  ],
};

function PropertiesPanel({
  className,
  onClose,
  dragHandleProps,
  hideTitleBar,
}: {
  className?: string;
  onClose?: () => void;
  dragHandleProps?: NodePropertyPanelProps['dragHandleProps'];
  hideTitleBar?: boolean;
}) {
  return (
    <NodePropertyPanel
      panelTitle={hideTitleBar ? undefined : 'Properties'}
      nodeIcon={<Globe />}
      nodeLabel="Fetch invoice details"
      nodeCategory="HTTP Request"
      action={
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent"
        >
          <Play size={14} />
          Run
        </button>
      }
      schema={httpRequestForm}
      contentInset="0.875rem"
      onClose={onClose}
      dragHandleProps={dragHandleProps}
      className={className}
    />
  );
}

export function QuickFormPropertiesPanelPreview({ onClose }: { onClose: () => void }) {
  const [formView, setFormView] = useState<'edit' | 'json'>('edit');

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<UserRoundCheck />}
      nodeLabel="Quick Approve"
      nodeCategory="Quick approve/reject decision for the extracted invoice."
      action={
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent"
        >
          <Play size={14} />
          Debug
        </button>
      }
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
          <TabsList className="h-auto justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0.5 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ['parameters', 'Parameters'],
              ['branching', 'Branching'],
              ['error-handling', 'Error handling'],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent
          value="parameters"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-auto py-3 [padding-inline:var(--mf-content-inset,0.875rem)]"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Quick form</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Generate with AI"
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <Sparkles size={14} />
                </button>
                <ToggleGroup
                  type="single"
                  size="xs"
                  value={formView}
                  onValueChange={(value) => value && setFormView(value as 'edit' | 'json')}
                >
                  <ToggleGroupItem value="edit" className="!px-2.5 !text-xs">
                    UI
                  </ToggleGroupItem>
                  <ToggleGroupItem value="json" className="!px-2.5 !text-xs">
                    JSON
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    aria-label="Upload a file"
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle transition hover:bg-surface-overlay/70 hover:text-foreground [&>svg]:size-5"
                  >
                    <Upload />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <button
                      type="button"
                      className="truncate rounded px-1 text-left text-base font-semibold leading-5 tracking-[-0.3px] transition hover:bg-surface-overlay"
                    >
                      Quick Approve
                    </button>
                    <button
                      type="button"
                      className="truncate rounded px-1 text-left text-xs leading-4 text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                    >
                      Add a description
                    </button>
                  </div>
                </div>
                {formView === 'edit' ? (
                  <>
                    <div className="flex flex-col gap-4">
                      {[
                        ['Invoice number', 'INV-2024-001'],
                        ['Supplier', 'Northwind Traders'],
                        ['Approval notes', 'Review extracted invoice details'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-border-subtle p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{label}</span>
                            <span className="rounded-md bg-surface-overlay px-2 py-0.5 text-[10px] text-foreground-muted">
                              Fixed
                            </span>
                          </div>
                          <input
                            value={value}
                            readOnly
                            className="h-8 w-full rounded-lg border border-border-subtle bg-surface-overlay px-2.5 text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="flex w-fit items-center gap-1.5 text-xs text-brand"
                    >
                      <Plus size={12} /> Add field
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="secondary">
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost" aria-label="Add button">
                        <Plus size={14} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <pre className="min-h-64 overflow-auto rounded-xl border border-border-subtle bg-surface-overlay p-3 text-[11px] text-foreground-muted">
                    {JSON.stringify(
                      {
                        title: 'Quick Approve',
                        fields: ['Invoice number', 'Supplier', 'Approval notes'],
                        actions: ['Approve', 'Reject'],
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="branching" className="mt-0 p-3 text-xs text-foreground-muted" />
        <TabsContent value="error-handling" className="mt-0 p-3 text-xs text-foreground-muted" />
      </Tabs>
    </NodePropertyPanel>
  );
}

function QuickFormPropertiesPanel({ onClose }: { onClose: () => void }) {
  return <QuickFormPanel embedded onClose={onClose} className="h-full" />;
}

function ExpressionField({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <div className="flex min-h-9 items-center rounded-lg border border-border-subtle bg-surface-overlay px-2.5 text-xs">
      {value ? (
        <span className="max-w-full truncate rounded-md bg-brand-subtle px-2 py-1 font-mono text-foreground-accent">
          ƒx {value}
        </span>
      ) : (
        <span className="truncate text-foreground-subtle">{placeholder}</span>
      )}
      <SlidersHorizontal className="ml-auto size-4 shrink-0 text-foreground-muted" />
    </div>
  );
}

function BooleanField({ label }: { label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium">{label}</p>
      <div className="flex items-center gap-5 text-xs text-foreground-muted">
        <span className="flex items-center gap-2">
          <span className="size-4 rounded-full border-2 border-border" /> True
        </span>
        <span className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded-full border-2 border-brand">
            <span className="size-2 rounded-full bg-brand" />
          </span>
          False
        </span>
      </div>
    </div>
  );
}

function SendEmailForm({ spacious = false }: { spacious?: boolean }) {
  return (
    <div className={spacious ? 'mx-auto w-full max-w-[760px] p-6' : 'p-3'}>
      <div className="mb-5 flex items-center gap-1 border-b border-border-subtle pb-2">
        <button
          type="button"
          className="rounded-lg bg-surface-overlay px-3 py-1.5 text-xs font-semibold"
        >
          Parameters{' '}
          <span className="ml-1 rounded-full bg-error px-1.5 text-foreground-on-accent">1</span>
        </button>
        <button type="button" className="px-3 py-1.5 text-xs text-foreground-muted">
          Error handling
        </button>
        <button type="button" className="px-3 py-1.5 text-xs text-foreground-muted">
          Advanced
        </button>
      </div>
      <div className={spacious ? 'space-y-5' : 'space-y-4'}>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium">Microsoft Outlook 365 connection *</p>
            <button type="button" className="shrink-0 text-xs text-brand">
              Refresh Schema
            </button>
          </div>
          <div className="flex min-h-9 items-center rounded-lg border border-border-subtle bg-surface-overlay px-2.5 text-xs">
            <Mail className="mr-1.5 size-4 text-brand" />
            <span className="truncate rounded bg-brand-subtle px-1.5 py-0.5">
              anurag.krishna@uipath.com
            </span>
          </div>
        </div>
        <BooleanField label="Save as draft" />
        <div>
          <p className="mb-2 text-xs font-medium">To *</p>
          <ExpressionField value="$vars.executeQuerySynchronously1.output[0].assignee_email" />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium">Subject</p>
          <ExpressionField value="$vars.recordUpdated1.output.Subject" />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium">Body</p>
          <div className="rounded-lg border border-border-subtle bg-surface-overlay">
            <div className="flex h-9 items-center gap-1 border-b border-border-subtle px-2 text-foreground-muted">
              {[
                ['bold', Bold],
                ['italic', Italic],
                ['underline', Underline],
                ['code', Code2],
                ['list', List],
                ['ordered-list', ListOrdered],
              ].map(([id, Icon]) => (
                <button
                  key={id as string}
                  type="button"
                  className="grid size-7 place-items-center rounded-md hover:bg-surface-hover"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <div className="min-h-16 p-2.5">
              <span className="rounded-md bg-brand-subtle px-2 py-1 font-mono text-xs text-foreground-accent">
                ƒx $vars.recordUpdated1.output.Description
              </span>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium">Attachment</p>
          <ExpressionField placeholder="The file to attach to the email" />
        </div>
        <BooleanField label="Include message details" />
        <button
          type="button"
          className="mx-auto flex items-center gap-2 text-xs font-semibold text-brand"
        >
          <Plus className="size-4" /> Manage Properties
        </button>
        <div className="rounded-lg bg-surface-overlay px-3 py-2 text-xs font-semibold">Options</div>
        <div>
          <p className="mb-2 text-xs font-medium">Reply to</p>
          <ExpressionField placeholder="Email addresses to use when replying" />
        </div>
      </div>
    </div>
  );
}

function SendEmailPropertiesPanel({ onClose }: { onClose: () => void }) {
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Mail />}
      nodeLabel="Send Email"
      nodeCategory="Microsoft Outlook 365"
      action={
        <Button size="sm">
          <Play size={14} /> Run node
        </Button>
      }
      onClose={onClose}
      className="h-full"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <SendEmailForm />
      </div>
    </NodePropertyPanel>
  );
}

type BottomPanelId = 'input' | 'properties' | 'output';

function BottomPanels({
  visiblePanels,
  activeDraggedPanel,
  onPanelClose,
  onPanelDragStart,
  onPanelDragEnd,
  onPanelReorderHover,
  onPanelMoveToBottom,
}: {
  visiblePanels: BottomPanelId[];
  activeDraggedPanel: BottomPanelId | null;
  onPanelClose: (panelId: BottomPanelId) => void;
  onPanelDragStart: (panelId: BottomPanelId) => void;
  onPanelDragEnd: () => void;
  onPanelReorderHover: () => void;
  onPanelMoveToBottom: (panelId: BottomPanelId) => void;
}) {
  const [order, setOrder] = useState<BottomPanelId[]>(['input', 'properties', 'output']);
  const [draggedPanel, setDraggedPanel] = useState<BottomPanelId | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    panelId: BottomPanelId;
    position: 'before' | 'after';
  } | null>(null);
  const activePanel = draggedPanel ?? activeDraggedPanel;

  useEffect(() => {
    if (activeDraggedPanel) return;
    setDraggedPanel(null);
    setDropTarget(null);
  }, [activeDraggedPanel]);

  const panels: Record<BottomPanelId, ReactNode> = {
    input: (
      <NodePropertyPanel
        panelTitle="Input"
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => handleDragStart(event, 'input'),
          onDragEnd: () => resetDragState(),
        }}
        contentInset="0.875rem"
        className="h-full"
        onClose={() => onPanelClose('input')}
      >
        <div className="flex h-full flex-col p-6 pt-4">
          <NodeIOView
            className="min-h-0 flex-1"
            title="HTTP Request"
            titleBadge="httpRequest1"
            value={{ endpoint: 'https://finance.internal/api/invoices', method: 'GET' }}
            readOnly
            searchPlaceholder="Search inputs..."
            pathForCopy={(path) => `$vars.${path}`}
          />
        </div>
      </NodePropertyPanel>
    ),
    properties: (
      <PropertiesPanel
        className="h-full"
        onClose={() => onPanelClose('properties')}
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => handleDragStart(event, 'properties'),
          onDragEnd: () => resetDragState(),
        }}
      />
    ),
    output: (
      <NodePropertyPanel
        panelTitle="Output"
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => handleDragStart(event, 'output'),
          onDragEnd: () => resetDragState(),
        }}
        contentInset="0.875rem"
        className="h-full"
        onClose={() => onPanelClose('output')}
      >
        <div className="flex h-full flex-col p-6 pt-4">
          <NodeIOView
            className="min-h-0 flex-1"
            title="HTTP Request"
            titleBadge="httpRequest1"
            value={{ statusCode: 200, body: { invoiceId: 'INV-2024-001', valid: true } }}
            readOnly
            searchPlaceholder="Search output..."
            pathForCopy={(path) => `$vars.${path}`}
          />
        </div>
      </NodePropertyPanel>
    ),
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, panelId: BottomPanelId) => {
    setDraggedPanel(panelId);
    onPanelDragStart(panelId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', panelId);
    const titleBar = event.currentTarget.closest<HTMLElement>(
      '[data-slot="node-property-panel-titlebar"]'
    );
    if (titleBar) {
      const bounds = titleBar.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        titleBar,
        Math.max(0, event.clientX - bounds.left),
        Math.max(0, event.clientY - bounds.top)
      );
    }
  };

  const resetDragState = () => {
    setDraggedPanel(null);
    setDropTarget(null);
    onPanelDragEnd();
  };

  const handleDrop = (targetPanel: BottomPanelId, position: 'before' | 'after') => {
    if (!activePanel || activePanel === targetPanel) return;
    setOrder((currentOrder) => {
      const nextOrder = currentOrder.filter((panelId) => panelId !== activePanel);
      const targetIndex = nextOrder.indexOf(targetPanel);
      nextOrder.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, activePanel);
      return nextOrder;
    });
    onPanelMoveToBottom(activePanel);
    resetDragState();
  };
  const visibleOrder = order.filter((panelId) => visiblePanels.includes(panelId));

  return (
    <ResizablePanelGroup
      key={order.join('-')}
      orientation="horizontal"
      className="h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-lg"
    >
      {visibleOrder.map((panelId, index) => (
        <Fragment key={panelId}>
          <ResizablePanel defaultSize={index === 1 ? '34%' : '33%'} minSize="15%">
            <div
              data-bottom-panel-slot
              onDragOver={(event) => {
                onPanelReorderHover();
                if (activePanel && activePanel !== panelId) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setDropTarget({
                    panelId,
                    position: event.clientX < bounds.left + bounds.width / 2 ? 'before' : 'after',
                  });
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDrop(panelId, dropTarget?.position ?? 'before');
              }}
              className={`relative ${
                activePanel === panelId
                  ? 'h-full w-full overflow-hidden opacity-50'
                  : 'h-full w-full overflow-hidden'
              }`}
            >
              {panels[panelId]}
              {dropTarget?.panelId === panelId && activePanel !== panelId && (
                <div
                  className={`pointer-events-none absolute inset-y-3 z-30 w-1 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_16%,transparent)] ${
                    dropTarget.position === 'before' ? 'left-1' : 'right-1'
                  }`}
                />
              )}
            </div>
          </ResizablePanel>
          {index < visibleOrder.length - 1 && (
            <ResizableHandle
              withHandle
              className="cursor-col-resize after:w-3 [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 data-[separator=hover]:[&>div]:opacity-100"
            />
          )}
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
}

function DockedDataPanels({
  zone,
  panelIds,
  onPanelClose,
  onPanelDragStart,
  onPanelDragEnd,
}: {
  zone: Exclude<StandaloneDockZone, 'bottom'>;
  panelIds: BottomPanelId[];
  onPanelClose: (panelId: BottomPanelId) => void;
  onPanelDragStart: (panelId: BottomPanelId) => void;
  onPanelDragEnd: () => void;
}) {
  const positionClass = {
    left: 'absolute inset-y-0 left-0 z-30 w-[380px] p-4 pr-0',
    right: 'absolute inset-y-0 right-0 z-30 w-[380px] p-4 pl-0',
    top: 'absolute inset-x-0 top-0 z-30 h-[360px] p-4 pb-0',
  }[zone];

  const dragHandleProps = (panelId: BottomPanelId) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLDivElement>) => {
      onPanelDragStart(panelId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', panelId);
      const titleBar = event.currentTarget.closest<HTMLElement>(
        '[data-slot="node-property-panel-titlebar"]'
      );
      if (titleBar) {
        const bounds = titleBar.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          titleBar,
          Math.max(0, event.clientX - bounds.left),
          Math.max(0, event.clientY - bounds.top)
        );
      }
    },
    onDragEnd: onPanelDragEnd,
  });

  const renderPanel = (panelId: BottomPanelId) => {
    if (panelId === 'properties') {
      return (
        <PropertiesPanel
          className="h-full"
          onClose={() => onPanelClose(panelId)}
          dragHandleProps={dragHandleProps(panelId)}
        />
      );
    }

    const isInput = panelId === 'input';
    return (
      <NodePropertyPanel
        panelTitle={isInput ? 'Input' : 'Output'}
        dragHandleProps={dragHandleProps(panelId)}
        contentInset="0.875rem"
        className="h-full"
        onClose={() => onPanelClose(panelId)}
      >
        <div className="flex h-full flex-col p-6 pt-4">
          <NodeIOView
            className="min-h-0 flex-1"
            title="HTTP Request"
            titleBadge="httpRequest1"
            value={
              isInput
                ? { endpoint: 'https://finance.internal/api/invoices', method: 'GET' }
                : { statusCode: 200, body: { invoiceId: 'INV-2024-001', valid: true } }
            }
            readOnly
            searchPlaceholder={isInput ? 'Search inputs...' : 'Search output...'}
            pathForCopy={(path) => `$vars.${path}`}
          />
        </div>
      </NodePropertyPanel>
    );
  };

  return (
    <div className={positionClass}>
      <ResizablePanelGroup
        orientation={zone === 'top' ? 'horizontal' : 'vertical'}
        className="h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-lg"
      >
        {panelIds.map((panelId, index) => (
          <Fragment key={panelId}>
            <ResizablePanel defaultSize={`${100 / panelIds.length}%`} minSize="15%">
              <div className="h-full min-h-0 overflow-hidden">{renderPanel(panelId)}</div>
            </ResizablePanel>
            {index < panelIds.length - 1 && (
              <ResizableHandle
                withHandle
                className={`${zone === 'top' ? 'cursor-col-resize after:w-3' : 'cursor-row-resize aria-[orientation=horizontal]:after:h-3'} [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 data-[separator=hover]:[&>div]:opacity-100`}
              />
            )}
          </Fragment>
        ))}
      </ResizablePanelGroup>
    </div>
  );
}

function SendEmailTakeoverPanels() {
  return (
    <NodePropertyPanelLayout
      className="h-full"
      input={
        <NodePropertyPanel panelTitle="Input" contentInset="0.875rem" className="h-full">
          <div className="flex h-full flex-col p-6 pt-4">
            <NodeIOView
              className="min-h-0 flex-1"
              title="Get Assignee"
              titleBadge="executeQuerySynchronously1"
              value={{
                output: [{ assignee_email: 'anurag.krishna@uipath.com' }],
                account: {
                  AccountNumber: 'unset',
                  BillingAddress: { city: 'unset', country: 'unset' },
                },
              }}
              readOnly
              searchPlaceholder="Search inputs..."
              pathForCopy={(path) => `$vars.${path}`}
            />
          </div>
        </NodePropertyPanel>
      }
      properties={
        <NodePropertyPanel
          panelTitle="Properties"
          nodeIcon={<Mail />}
          nodeLabel="Send Email"
          nodeCategory="Microsoft Outlook 365"
          action={
            <Button size="sm">
              <Play size={14} /> Run node
            </Button>
          }
          contentInset="0.875rem"
          className="h-full"
        >
          <div className="min-h-0 flex-1 overflow-auto">
            <SendEmailForm spacious />
          </div>
        </NodePropertyPanel>
      }
      output={
        <NodePropertyPanel panelTitle="Output" contentInset="0.875rem" className="h-full">
          <div className="flex h-full flex-col p-6 pt-4">
            <NodeIOView
              className="min-h-0 flex-1"
              title="Send Email"
              titleBadge="sendEmail1"
              value={{
                output: {
                  status: 'sent',
                  id: 'AAMkADk3...',
                  conversationId: 'AAQkADk3...',
                  internetMessageId: '<message@outlook.com>',
                },
              }}
              readOnly
              searchPlaceholder="Search output..."
              pathForCopy={(path) => `$vars.${path}`}
            />
          </div>
        </NodePropertyPanel>
      }
    />
  );
}

export const CanvasOnly: Story = {
  name: 'Canvas Only',
  render: () => <StandaloneRightPropertiesComposition initiallyOpen={false} />,
};

export const WithRightPropertiesPanel: Story = {
  name: 'w/ Panel Right',
  render: () => <StandaloneRightPropertiesComposition />,
};

export const WithBottomPropertiesPanel: Story = {
  name: 'w/ Panel Bottom',
  render: () => <BottomPropertiesComposition />,
};

// ============================================================================
// Flow Workbench-aligned compositions
// ============================================================================

const DockviewTriggerContext = createContext<{
  panels: { id: string; label: string; enabled: boolean }[];
  onPanelToggle: (id: string, enabled: boolean) => void;
} | null>(null);

function DockviewCanvasPanel(_props: IDockviewPanelProps) {
  const trigger = useContext(DockviewTriggerContext);
  return (
    <CanvasViewport
      trigger={
        trigger ? (
          <PanelTrigger
            panels={trigger.panels}
            onPanelToggle={trigger.onPanelToggle}
            onPropertiesClick={() => trigger.onPanelToggle('properties', true)}
          />
        ) : undefined
      }
    />
  );
}

function DockviewInputPanel(_props: IDockviewPanelProps) {
  return (
    <NodePropertyPanel className="h-full">
      <div className="h-full p-4">
        <NodeIOView
          className="h-full"
          title="HTTP Request"
          titleBadge="httpRequest1"
          value={{ endpoint: 'https://finance.internal/api/invoices', method: 'GET' }}
          readOnly
          searchPlaceholder="Search inputs..."
          pathForCopy={(path) => `$vars.${path}`}
        />
      </div>
    </NodePropertyPanel>
  );
}

function DockviewPropertiesPanel(_props: IDockviewPanelProps) {
  return <PropertiesPanel className="h-full" hideTitleBar />;
}

function DockviewOutputPanel(_props: IDockviewPanelProps) {
  return (
    <NodePropertyPanel className="h-full">
      <div className="h-full p-4">
        <NodeIOView
          className="h-full"
          title="HTTP Request"
          titleBadge="httpRequest1"
          value={{ statusCode: 200, body: { invoiceId: 'INV-2024-001', valid: true } }}
          readOnly
          searchPlaceholder="Search output..."
          pathForCopy={(path) => `$vars.${path}`}
        />
      </div>
    </NodePropertyPanel>
  );
}

const dockviewComponents = {
  canvas: DockviewCanvasPanel,
  input: DockviewInputPanel,
  properties: DockviewPropertiesPanel,
  output: DockviewOutputPanel,
};

const dockviewTheme = {
  name: 'apollo-canvas-template',
  className: 'canvas-template-dockview-theme',
  gap: 0,
} as const;

export function DraggablePanelLayout({
  initialPanelIds = [],
}: {
  initialPanelIds?: Array<'input' | 'properties' | 'output'>;
} = {}) {
  const apiRef = useRef<DockviewApi | null>(null);
  const [panels, setPanels] = useState([
    { id: 'input', label: 'Input', enabled: initialPanelIds.includes('input') },
    {
      id: 'properties',
      label: 'Properties',
      enabled: initialPanelIds.includes('properties'),
    },
    { id: 'output', label: 'Output', enabled: initialPanelIds.includes('output') },
  ]);

  const handleReady = useCallback(
    (event: DockviewReadyEvent) => {
      const { api } = event;
      apiRef.current = api;
      api.addPanel({
        id: 'canvas',
        component: 'canvas',
        title: 'Canvas',
        minimumWidth: 320,
        minimumHeight: 240,
      });
      initialPanelIds.forEach((id, index) => {
        api.addPanel({
          id,
          component: id,
          title: id.charAt(0).toUpperCase() + id.slice(1),
          position: {
            referencePanel: index === 0 ? 'canvas' : initialPanelIds[index - 1],
            direction: 'right',
          },
          initialWidth: 380,
          minimumWidth: 280,
          minimumHeight: 180,
        });
      });
    },
    [initialPanelIds]
  );

  const handlePanelToggle = useCallback((id: string, enabled: boolean) => {
    const api = apiRef.current;
    if (!api) return;

    const existingPanel = api.getPanel(id);
    if (!enabled) {
      if (existingPanel) api.removePanel(existingPanel);
    } else if (!existingPanel) {
      const openSibling = ['input', 'properties', 'output'].find(
        (panelId) => panelId !== id && api.getPanel(panelId)
      );
      api.addPanel({
        id,
        component: id,
        title: id.charAt(0).toUpperCase() + id.slice(1),
        position: openSibling
          ? { referencePanel: openSibling, direction: 'right' }
          : { referencePanel: 'canvas', direction: 'right' },
        initialWidth: 380,
        minimumHeight: 180,
        minimumWidth: 280,
      });
    }

    setPanels((current) =>
      current.map((panel) => (panel.id === id ? { ...panel, enabled } : panel))
    );
  }, []);

  return (
    <div className="h-screen bg-surface">
      <div className="canvas-template-dockview h-full overflow-hidden bg-surface">
        <DockviewTriggerContext.Provider value={{ panels, onPanelToggle: handlePanelToggle }}>
          <DockviewReact
            className="h-full w-full"
            components={dockviewComponents}
            theme={dockviewTheme}
            dndEdges={{
              activationSize: { type: 'pixels', value: 80 },
              size: { type: 'pixels', value: 120 },
            }}
            onReady={handleReady}
          />
        </DockviewTriggerContext.Provider>
      </div>
    </div>
  );
}

function DebugPanelContent() {
  return (
    <div className="grid h-full grid-cols-[220px_1fr]">
      <div className="border-r border-border-subtle p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Run history</p>
        <div className="rounded-lg bg-surface-overlay p-3">
          <span className="block text-xs font-medium text-foreground">Flow run</span>
          <span className="mt-1 block text-[11px] text-foreground-muted">Completed in 2.4s</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-success" /> Execution completed
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs text-foreground-muted">
          Select an execution step to inspect its input, output, logs, and metrics.
        </div>
      </div>
    </div>
  );
}

function EvaluatePanelContent() {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div>
        <Sparkles className="mx-auto mb-3 size-6 text-foreground-accent" />
        <p className="text-sm font-medium text-foreground">Evaluate your flow</p>
        <p className="mt-1 text-xs text-foreground-muted">Connect a dataset and evaluators.</p>
      </div>
    </div>
  );
}

function ResizableBottomPanel() {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const [activeTabId, setActiveTabId] = useState('execution');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState(368);
  const tabs: CanvasBottomPanelTab[] = [
    {
      id: 'execution',
      label: (
        <>
          <Bug className="size-3" /> Executions
        </>
      ),
      group: 'debug',
      content: <DebugPanelContent />,
    },
    { id: 'datasets', label: 'Datasets', group: 'evaluation', content: <EvaluatePanelContent /> },
    {
      id: 'evaluators',
      label: 'Evaluators',
      group: 'evaluation',
      content: <EvaluatePanelContent />,
    },
    {
      id: 'runs',
      label: (
        <>
          <FlaskConical className="size-3" /> Eval runs
        </>
      ),
      group: 'evaluation',
      content: <EvaluatePanelContent />,
    },
  ];

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (collapsed) panelRef.current?.collapse();
    else panelRef.current?.expand();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-surface">
      <CanvasViewport bottomControlsOffset={panelHeight + 20} />
      <ResizablePanelGroup
        orientation="vertical"
        className="pointer-events-none absolute inset-0 z-10"
      >
        <ResizablePanel defaultSize="64%" minSize="30%" className="pointer-events-none" />
        {!isCollapsed && (
          <ResizableHandle
            withHandle
            className="pointer-events-auto z-20 mx-8 translate-y-3 cursor-row-resize bg-transparent aria-[orientation=horizontal]:w-[calc(100%-4rem)] aria-[orientation=horizontal]:after:h-3 [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 data-[separator=hover]:[&>div]:opacity-100"
          />
        )}
        <ResizablePanel
          panelRef={panelRef}
          collapsible
          collapsedSize={80}
          defaultSize={368}
          minSize={240}
          onResize={({ inPixels }) => setPanelHeight(inPixels)}
          className="pointer-events-auto min-h-0 px-4 pb-4 pt-3"
        >
          <CanvasBottomPanel
            variant="floating"
            className="h-full"
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={(tabId) => {
              setActiveTabId(tabId);
              if (isCollapsed) setCollapsed(false);
            }}
            isCollapsed={isCollapsed}
            onCollapsedChange={setCollapsed}
            headerActions={
              <ToolbarButton
                label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                onClick={() => setCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronUp /> : <ChevronDown />}
              </ToolbarButton>
            }
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function LeftSidebarComposition() {
  const [expanded, setExpanded] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CanvasLeftSidebarItemId>('variables');
  const labels: Record<CanvasLeftSidebarItemId, string> = {
    'coding-agent': 'Coding agent',
    files: 'Files',
    variables: 'Variables',
    connections: 'Connections',
    'run-history': 'Run history',
    'whats-new': "What's new",
    account: 'Account',
  };
  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title={labels[activeItem]}
        variant="default"
        isExpanded={expanded}
        onExpandedChange={setExpanded}
        activeItemId={activeItem}
        onItemSelect={setActiveItem}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <CanvasViewport
          rightControlsOffset={rightPanelOpen ? 412 : 16}
          trigger={
            <PanelTrigger
              layout={rightPanelOpen ? 'right' : 'closed'}
              panels={[
                { id: 'input', label: 'Input', enabled: false },
                { id: 'properties', label: 'Properties', enabled: rightPanelOpen },
                { id: 'output', label: 'Output', enabled: false },
              ]}
              onPanelToggle={(id, enabled) => {
                if (id === 'properties') setRightPanelOpen(enabled);
              }}
              onLayoutChange={(layout) => {
                if (layout === 'right') setRightPanelOpen(true);
              }}
              onPropertiesClick={() => setRightPanelOpen(true)}
            />
          }
        />
      </div>
      {rightPanelOpen && (
        <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">
          <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
            <PropertiesPanel className="h-full" onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

type RuleCondition = { id: number; field: string; operator: string; value: string };

function RuleBuildingPanel({ onClose }: { onClose: () => void }) {
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { id: 1, field: 'Invoice total', operator: 'is greater than', value: '10,000' },
    { id: 2, field: 'Supplier risk', operator: 'is one of', value: 'High, Critical' },
  ]);
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const nextConditionId = useRef(3);

  const updateCondition = (id: number, patch: Partial<RuleCondition>) =>
    setConditions((current) =>
      current.map((condition) => (condition.id === id ? { ...condition, ...patch } : condition))
    );

  return (
    <NodePropertyPanel
      panelTitle="Rules"
      nodeIcon={<GitBranch />}
      nodeLabel="Approval routing"
      nodeCategory="Decide when an invoice needs review"
      action={<Button size="sm">Save</Button>}
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 pb-4">
        <div className="flex items-center justify-between border-b border-border-subtle py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">When this rule runs</p>
            <p className="mt-0.5 text-[11px] text-foreground-muted">
              Route invoices that match the conditions below.
            </p>
          </div>
          <span className="rounded-md bg-success-subtle px-2 py-1 text-[10px] font-semibold text-success">
            Active
          </span>
        </div>

        <div className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Match</span>
            <ToggleGroup
              type="single"
              size="xs"
              value={matchMode}
              onValueChange={(value) => value && setMatchMode(value as 'all' | 'any')}
            >
              <ToggleGroupItem value="all" className="!px-2.5 !text-xs">
                All conditions
              </ToggleGroupItem>
              <ToggleGroupItem value="any" className="!px-2.5 !text-xs">
                Any condition
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="relative ml-3 border-l-2 border-brand/40 pl-4">
            <span className="absolute -left-[13px] top-0 rounded-md border border-brand/30 bg-surface-raised px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
              {matchMode === 'all' ? 'AND' : 'OR'}
            </span>
            <div className="space-y-3 pt-7">
              {conditions.map((condition) => (
                <Card key={condition.id} className="relative">
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                        Condition {conditions.indexOf(condition) + 1}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove condition ${conditions.indexOf(condition) + 1}`}
                        onClick={() =>
                          setConditions((current) =>
                            current.filter(({ id }) => id !== condition.id)
                          )
                        }
                        className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <select
                      value={condition.field}
                      onChange={(event) =>
                        updateCondition(condition.id, { field: event.target.value })
                      }
                      className="h-8 w-full rounded-lg border border-border-subtle bg-surface-overlay px-2 text-xs"
                    >
                      <option>Invoice total</option>
                      <option>Supplier risk</option>
                      <option>Invoice currency</option>
                      <option>Purchase order</option>
                    </select>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
                      <select
                        value={condition.operator}
                        onChange={(event) =>
                          updateCondition(condition.id, { operator: event.target.value })
                        }
                        className="h-8 min-w-0 rounded-lg border border-border-subtle bg-surface-overlay px-2 text-xs"
                      >
                        <option>is greater than</option>
                        <option>is equal to</option>
                        <option>is one of</option>
                        <option>contains</option>
                      </select>
                      <input
                        value={condition.value}
                        onChange={(event) =>
                          updateCondition(condition.id, { value: event.target.value })
                        }
                        aria-label={`Condition ${conditions.indexOf(condition) + 1} value`}
                        className="h-8 min-w-0 rounded-lg border border-border-subtle bg-surface-overlay px-2 text-xs outline-none focus:border-border-focus"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const id = nextConditionId.current++;
                  setConditions((current) => [
                    ...current,
                    { id, field: 'Invoice currency', operator: 'is equal to', value: 'USD' },
                  ]);
                }}
                className="w-full border border-dashed border-border-subtle"
              >
                <Plus size={14} /> Add condition
              </Button>
            </div>
          </div>
        </div>

        <Card className="mt-auto">
          <CardContent className="p-3">
            <p className="text-xs font-semibold">Then</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-overlay p-2.5">
              <GitBranch className="size-4 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">Send for manager approval</p>
                <p className="truncate text-[11px] text-foreground-muted">Finance approval queue</p>
              </div>
              <ChevronDown className="ml-auto size-4 text-foreground-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </NodePropertyPanel>
  );
}

function VariableManagementPanel({ onClose }: { onClose: () => void }) {
  return (
    <NodePropertyPanel
      panelTitle="Variables"
      nodeIcon={<Code2 />}
      nodeLabel="Workflow variables"
      nodeCategory="Manage values used throughout this workflow"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="grid min-h-52 flex-1 place-items-center rounded-xl border border-dashed border-border-subtle bg-surface-overlay/30 p-6 text-center">
          <div className="max-w-56">
            <Code2 className="mx-auto size-6 text-foreground-subtle" />
            <p className="mt-3 text-sm font-semibold text-foreground">Variable management</p>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">
              Add the variable list, editor, and scope controls here.
            </p>
          </div>
        </div>
      </div>
    </NodePropertyPanel>
  );
}

type NodeInventoryItem = {
  id: string;
  label: string;
  category: string;
  nodeType: string;
  icon: string;
  source?: 'built-in' | 'dynamic';
};

const NODE_INVENTORY_GROUPS: { category: string; items: Omit<NodeInventoryItem, 'category'>[] }[] =
  [
    {
      category: 'Agents',
      items: [
        {
          id: 'autonomous-agent',
          label: 'Autonomous agent',
          nodeType: 'uipath.agent.autonomous',
          icon: 'autonomous-agent',
        },
        {
          id: 'conversational-agent',
          label: 'Conversational agent',
          nodeType: 'uipath.agent.conversational',
          icon: 'conversational-agent',
        },
        { id: 'voice-agent', label: 'Voice agent', nodeType: 'uipath.agent.voice', icon: 'phone' },
      ],
    },
    {
      category: 'Agent resources',
      items: [
        {
          id: 'escalation',
          label: 'Escalation',
          nodeType: 'uipath.agent.resource.escalation',
          icon: 'user-round-check',
        },
        {
          id: 'quick-form-escalation',
          label: 'Quick Form escalation',
          nodeType: 'uipath.agent.resource.escalation.quick-form',
          icon: 'clipboard-check',
        },
        {
          id: 'action-app-escalation',
          label: 'Action App escalation',
          nodeType: 'uipath.agent.resource.escalation.coded-action-app',
          icon: 'panels-top-left',
        },
      ],
    },
    {
      category: 'Connectors',
      items: [
        {
          id: 'http-request-v2',
          label: 'HTTP Request',
          nodeType: 'core.action.http.v2',
          icon: 'globe',
        },
        {
          id: 'slack-send',
          label: 'Send Message',
          nodeType: 'connector.slack.send-message',
          icon: 'message-square',
          source: 'dynamic',
        },
      ],
    },
    {
      category: 'Data',
      items: [
        {
          id: 'batch-transform',
          label: 'Batch transform',
          nodeType: 'uipath.pattern.batch-transform',
          icon: 'table-properties',
        },
        {
          id: 'filter',
          label: 'Filter',
          nodeType: 'core.action.transform.filter',
          icon: 'list-filter',
        },
        {
          id: 'group-by',
          label: 'Group by',
          nodeType: 'core.action.transform.group-by',
          icon: 'group',
        },
        { id: 'map', label: 'Map', nodeType: 'core.action.transform.map', icon: 'arrow-right' },
        {
          id: 'transform',
          label: 'Transform',
          nodeType: 'core.action.transform',
          icon: 'case-upper',
        },
        {
          id: 'read-entity',
          label: 'Read entity',
          nodeType: 'core.datafabric.read',
          icon: 'database',
        },
        {
          id: 'update-entity',
          label: 'Update entity',
          nodeType: 'core.datafabric.update',
          icon: 'database-zap',
        },
      ],
    },
    {
      category: 'Document',
      items: [
        {
          id: 'summarize',
          label: 'Summarize',
          nodeType: 'uipath.agent.resource.tool.builtin.summarize',
          icon: 'sigma',
        },
        {
          id: 'extract',
          label: 'Extract',
          nodeType: 'connector.document.extract',
          icon: 'file-scan',
          source: 'dynamic',
        },
        { id: 'classify', label: 'Classify', nodeType: 'uipath.document.classify', icon: 'files' },
        {
          id: 'document-validation',
          label: 'Document Validation',
          nodeType: 'uipath.human-in-the-loop.document-validation',
          icon: 'file-check-2',
        },
        {
          id: 'analyze-files',
          label: 'Analyze Files',
          nodeType: 'uipath.agent.resource.tool.builtin.analyzefiles',
          icon: 'scan-search',
        },
      ],
    },
    {
      category: 'Human',
      items: [
        {
          id: 'quick-form',
          label: 'Quick Form',
          nodeType: 'uipath.human-in-the-loop.quick-form',
          icon: 'users',
        },
        {
          id: 'action-app',
          label: 'Action App',
          nodeType: 'uipath.human-in-the-loop.coded-action-app',
          icon: 'user-round-cog',
        },
        {
          id: 'human-task',
          label: 'Human Task',
          nodeType: 'uipath.human-in-the-loop',
          icon: 'user-round-check',
        },
      ],
    },
    {
      category: 'Control',
      items: [
        { id: 'mock', label: 'Mock', nodeType: 'core.logic.mock', icon: 'scan-dashed' },
        { id: 'decision', label: 'Decision', nodeType: 'core.logic.decision', icon: 'decision' },
        { id: 'switch', label: 'Switch', nodeType: 'core.logic.switch', icon: 'switch' },
        { id: 'merge', label: 'Merge', nodeType: 'core.logic.merge', icon: 'git-merge' },
        { id: 'end', label: 'End', nodeType: 'core.control.end', icon: 'circle-check' },
        { id: 'terminate', label: 'Terminate', nodeType: 'core.logic.terminate', icon: 'circle-x' },
        { id: 'do-while', label: 'Do while', nodeType: 'core.logic.dowhile', icon: 'repeat-2' },
        { id: 'loop', label: 'Loop', nodeType: 'core.logic.loop', icon: 'refresh-cw' },
      ],
    },
    {
      category: 'Tool',
      items: [
        { id: 'script', label: 'Script', nodeType: 'core.action.script', icon: 'code-2' },
        {
          id: 'wait-message',
          label: 'Wait for message',
          nodeType: 'uipath.conversational.wait-for-message',
          icon: 'message-square-more',
        },
        {
          id: 'conversation-context',
          label: 'Get conversation context',
          nodeType: 'uipath.conversational.get-conversation-context',
          icon: 'messages-square',
        },
        {
          id: 'send-message',
          label: 'Send message',
          nodeType: 'uipath.conversational.send-message',
          icon: 'message-square-plus',
        },
        {
          id: 'queue-create',
          label: 'Create queue item',
          nodeType: 'core.action.queue.create',
          icon: 'list-plus',
        },
        {
          id: 'queue-create-wait',
          label: 'Create and wait for queue item',
          nodeType: 'core.action.queue.create-and-wait',
          icon: 'list-checks',
        },
        {
          id: 'outgoing-call',
          label: 'Create outgoing call',
          nodeType: 'uipath.conversational.voice.create-outgoing-call',
          icon: 'phone-outgoing',
        },
        {
          id: 'end-call',
          label: 'End call',
          nodeType: 'uipath.conversational.voice.end-call',
          icon: 'phone-off',
        },
        {
          id: 'client-side-tool',
          label: 'Client-side tool',
          nodeType: 'uipath.agent.resource.tool.clientside',
          icon: 'monitor-cog',
        },
      ],
    },
    {
      category: 'Triggers',
      items: [
        {
          id: 'manual-trigger',
          label: 'Manual trigger',
          nodeType: 'core.trigger.manual',
          icon: 'play',
        },
        {
          id: 'scheduled-trigger',
          label: 'Scheduled trigger',
          nodeType: 'core.trigger.scheduled',
          icon: 'calendar-clock',
        },
        {
          id: 'slack-trigger',
          label: 'Message Received in Slack',
          nodeType: 'connector.slack.message-received',
          icon: 'message-circle',
          source: 'dynamic',
        },
        {
          id: 'http-webhook',
          label: 'HTTP Webhook',
          nodeType: 'connector.http.webhook',
          icon: 'webhook',
          source: 'dynamic',
        },
        {
          id: 'incoming-call',
          label: 'Incoming call',
          nodeType: 'core.trigger.voice',
          icon: 'phone-incoming',
        },
        {
          id: 'conversation-trigger',
          label: 'Conversation trigger',
          nodeType: 'core.trigger.conversation',
          icon: 'messages-square',
        },
        {
          id: 'form-trigger',
          label: 'Form trigger',
          nodeType: 'core.trigger.form',
          icon: 'clipboard-list',
        },
      ],
    },
    {
      category: 'Wait for event',
      items: [
        { id: 'delay', label: 'Delay', nodeType: 'core.logic.delay', icon: 'timer' },
        {
          id: 'webhook-wait',
          label: 'HTTP Webhook callback',
          nodeType: 'connector.http.webhook-wait',
          icon: 'webhook',
          source: 'dynamic',
        },
        {
          id: 'email-wait',
          label: 'Email Received (Wait)',
          nodeType: 'connector.gmail.email-received-wait',
          icon: 'mail-clock',
          source: 'dynamic',
        },
      ],
    },
    {
      category: 'UiPath',
      items: [
        { id: 'subflow', label: 'Subflow', nodeType: 'core.subflow', icon: 'layers' },
        {
          id: 'flow',
          label: 'Flow',
          nodeType: 'resource.flow',
          icon: 'flow-project',
          source: 'dynamic',
        },
        {
          id: 'bpmn',
          label: 'BPMN',
          nodeType: 'resource.maestro-bpmn',
          icon: 'agentic-process',
          source: 'dynamic',
        },
        {
          id: 'case',
          label: 'Case',
          nodeType: 'resource.maestro-case',
          icon: 'case-management',
          source: 'dynamic',
        },
        {
          id: 'rpa-workflow',
          label: 'RPA Workflow',
          nodeType: 'resource.rpa-workflow',
          icon: 'rpa',
          source: 'dynamic',
        },
        {
          id: 'api-workflow',
          label: 'API Workflow',
          nodeType: 'resource.api-workflow',
          icon: 'api',
          source: 'dynamic',
        },
      ],
    },
  ];

const NODE_INVENTORY_ITEMS: NodeInventoryItem[] = NODE_INVENTORY_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.category }))
);

function InventoryCategoryNode({ data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="grid h-24 w-36 place-items-start rounded-2xl border-2 border-brand/40 bg-brand-subtle p-4 text-sm font-semibold text-foreground shadow-sm">
      {data.display?.label}
    </div>
  );
}

function InventoryItemNode({ data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="flex w-40 cursor-pointer flex-col items-center gap-2 text-center text-foreground">
      <div className="grid size-16 place-items-center rounded-2xl border border-border-subtle bg-surface shadow-sm transition-shadow hover:shadow-md">
        <CanvasIcon icon={data.display?.icon} size={28} />
      </div>
      <span className="max-w-40 text-xs font-medium leading-4">{data.display?.label}</span>
    </div>
  );
}

function createNodeInventoryNodes(): Node<BaseNodeData>[] {
  return NODE_INVENTORY_GROUPS.flatMap((group, rowIndex) => {
    const y = rowIndex * 150;
    const categoryNode = createNode({
      id: `category-${group.category.toLowerCase().replaceAll(' ', '-')}`,
      type: 'inventory-category',
      position: { x: 0, y },
      display: { label: group.category },
      data: { inventoryCategory: true },
    });
    const itemNodes = group.items.map((item, columnIndex) =>
      createNode({
        id: item.id,
        type: 'inventory-item',
        position: { x: 190 + columnIndex * 245, y: y + 8 },
        display: {
          label: item.label,
          subLabel: item.source === 'dynamic' ? 'Dynamic catalog example' : group.category,
          icon: item.icon,
        },
        data: { nodeType: item.nodeType, inventoryItem: true },
      })
    );
    return [categoryNode, ...itemNodes];
  });
}

const inventoryNodeTypes = {
  'inventory-category': InventoryCategoryNode,
  'inventory-item': InventoryItemNode,
};

function NodeInventoryCanvas({
  onItemSelect,
}: {
  onItemSelect: (item: NodeInventoryItem) => void;
}) {
  const inventoryNodes = useMemo(createNodeInventoryNodes, []);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const { canvasProps } = useCanvasStory({
    initialNodes: inventoryNodes,
    initialEdges: [],
    additionalNodeTypes: inventoryNodeTypes,
  });

  useEffect(() => {
    if (!nodesInitialized) return;
    void fitView({ padding: 0.12, maxZoom: 0.85, duration: 0 });
  }, [fitView, nodesInitialized]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <BaseCanvas
        {...canvasProps}
        mode="view"
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 0.85 }}
        onNodeClick={(_event, node) => {
          if (!node.data.inventoryItem) return;
          const item = NODE_INVENTORY_ITEMS.find((candidate) => candidate.id === node.id);
          if (item) onItemSelect(item);
        }}
      />
      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
        <CanvasNavigationControls />
      </div>
      <div className="absolute bottom-5 right-4 z-20">
        <CanvasZoomControls
          orientation="vertical"
          onOrganize={() => void fitView({ padding: 0.12, duration: 200, maxZoom: 0.85 })}
        />
      </div>
    </div>
  );
}

function NodeInventoryPanel({ item, onClose }: { item: NodeInventoryItem; onClose: () => void }) {
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<CanvasIcon icon={item.icon} size={22} />}
      nodeLabel={item.label}
      nodeCategory={item.category}
      onClose={onClose}
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="rounded-xl border border-border-subtle bg-surface-overlay p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
            Node type
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground-muted">{item.nodeType}</p>
        </div>
        <div className="grid min-h-52 flex-1 place-items-center rounded-xl border border-dashed border-border-subtle p-6 text-center">
          <div className="max-w-56">
            <CanvasIcon icon={item.icon} size={24} />
            <p className="mt-3 text-sm font-semibold">{item.label} panel experience</p>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">
              Add the source-of-truth fields and interactions for this node here.
            </p>
          </div>
        </div>
      </div>
    </NodePropertyPanel>
  );
}

export function NodeInventoryComposition() {
  const [selectedItem, setSelectedItem] = useState(NODE_INVENTORY_ITEMS[0]!);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');

  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title="Variables"
        variant="default"
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeItemId={activeSidebarItem}
        onItemSelect={setActiveSidebarItem}
      />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <NodeInventoryCanvas
          onItemSelect={(item) => {
            setSelectedItem(item);
            setRightPanelOpen(true);
          }}
        />
        <div className="absolute top-4 z-20" style={{ right: rightPanelOpen ? 412 : 16 }}>
          <PanelTrigger
            layout={rightPanelOpen ? 'right' : 'closed'}
            panels={[
              { id: 'input', label: 'Input', enabled: false },
              { id: 'properties', label: 'Properties', enabled: rightPanelOpen },
              { id: 'output', label: 'Output', enabled: false },
            ]}
            onPanelToggle={(id, enabled) => {
              if (id === 'properties') setRightPanelOpen(enabled);
            }}
            onLayoutChange={(layout) => {
              if (layout === 'right') setRightPanelOpen(true);
            }}
            onPropertiesClick={() => setRightPanelOpen(true)}
          />
        </div>
      </div>
      {rightPanelOpen && (
        <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">
          <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
            <NodeInventoryPanel item={selectedItem} onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function DapPanel({ onClose }: { onClose: () => void }) {
  return (
    <NodePropertyPanel
      panelTitle="DAP"
      nodeIcon={<Blocks />}
      nodeLabel="DAP components"
      nodeCategory="Component display and interaction guidance"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="grid min-h-52 flex-1 place-items-center rounded-xl border border-dashed border-border-subtle bg-surface-overlay/30 p-6 text-center">
          <div className="max-w-56">
            <Blocks className="mx-auto size-6 text-foreground-subtle" />
            <p className="mt-3 text-sm font-semibold text-foreground">DAP UX</p>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">
              Add DAP components and their interaction guidance here.
            </p>
          </div>
        </div>
      </div>
    </NodePropertyPanel>
  );
}

function FieldHelpPanel({ onClose }: { onClose: () => void }) {
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.example.com/flows/finance-ops');
  const [retryLimit, setRetryLimit] = useState('3');
  const [signingSecret, setSigningSecret] = useState('example-signing-secret-value');

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Globe />}
      nodeLabel="HTTP Webhook"
      nodeCategory="Triggers · Field help pattern"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
          <p className="text-xs leading-5 text-foreground-muted">
            The Forms/Field guidance patterns, shown in a real scroll-constrained panel next to tabs
            and dense field stacks.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="field-help-url" className="text-xs">
              Webhook URL <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <InputGroup className="h-9 bg-surface-overlay">
              <InputGroupInput
                id="field-help-url"
                aria-describedby="field-help-url-description"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                className="text-xs"
              />
            </InputGroup>
            <p
              id="field-help-url-description"
              className="text-[11px] leading-4 text-foreground-muted"
            >
              Must be publicly reachable over HTTPS. You cannot change this after the flow is
              published.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="field-help-retry" className="text-xs">
                Retry limit
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Help for retry limit"
                    className="inline-flex size-5 cursor-help items-center justify-center rounded-sm text-foreground-muted ring-offset-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <CircleHelp aria-hidden="true" className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56">
                  How many times to retry a failed delivery before giving up.
                </TooltipContent>
              </Tooltip>
            </div>
            <InputGroup className="h-9 bg-surface-overlay">
              <InputGroupInput
                id="field-help-retry"
                inputMode="numeric"
                value={retryLimit}
                onChange={(event) => setRetryLimit(event.target.value)}
                className="text-xs"
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="field-help-secret" className="text-xs">
                Signing secret <span aria-hidden="true">*</span>
                <span className="sr-only"> (required)</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Help for signing secret"
                    className="inline-flex size-5 cursor-help items-center justify-center rounded-sm text-foreground-muted ring-offset-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <CircleHelp aria-hidden="true" className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56">
                  Regenerating this secret invalidates any endpoints still using the old value.
                </TooltipContent>
              </Tooltip>
            </div>
            <InputGroup className="h-9 bg-surface-overlay">
              <InputGroupInput
                id="field-help-secret"
                aria-describedby="field-help-secret-description"
                value={signingSecret}
                onChange={(event) => setSigningSecret(event.target.value)}
                className="font-mono text-xs"
              />
            </InputGroup>
            <p
              id="field-help-secret-description"
              className="text-[11px] leading-4 text-foreground-muted"
            >
              Used to verify webhook payloads came from this flow.
            </p>
          </div>
        </div>
      </TooltipProvider>
    </NodePropertyPanel>
  );
}

export function FullWorkbenchComposition({
  rightPanelVariant = 'properties',
}: {
  rightPanelVariant?:
    | 'properties'
    | 'forms'
    | 'node'
    | 'rules'
    | 'variables'
    | 'dap'
    | 'field-help';
}) {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const expandedBottomPanelHeight = useRef(368);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [takeoverOpen, setTakeoverOpen] = useState(rightPanelVariant === 'node');
  const [activeTabId, setActiveTabId] = useState('execution');
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(80);
  const sidebarLabels: Record<CanvasLeftSidebarItemId, string> = {
    'coding-agent': 'Coding agent',
    files: 'Files',
    variables: 'Variables',
    connections: 'Connections',
    'run-history': 'Run history',
    'whats-new': "What's new",
    account: 'Account',
  };
  const tabs: CanvasBottomPanelTab[] = [
    {
      id: 'execution',
      label: (
        <>
          <Bug className="size-3" /> Executions
        </>
      ),
      group: 'debug',
      content: <DebugPanelContent />,
    },
    { id: 'datasets', label: 'Datasets', content: <EvaluatePanelContent /> },
    { id: 'evaluators', label: 'Evaluators', content: <EvaluatePanelContent /> },
    {
      id: 'runs',
      label: (
        <>
          <FlaskConical className="size-3" /> Eval runs
        </>
      ),
      content: <EvaluatePanelContent />,
    },
  ];

  const setBottomPanelCollapsed = (collapsed: boolean) => {
    setIsBottomPanelCollapsed(collapsed);
    if (collapsed) panelRef.current?.collapse();
    else {
      panelRef.current?.expand();
      panelRef.current?.resize(expandedBottomPanelHeight.current);
    }
  };

  const canvasBottomOffset = bottomPanelHeight + 4;

  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title={sidebarLabels[activeSidebarItem]}
        variant="default"
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeItemId={activeSidebarItem}
        onItemSelect={setActiveSidebarItem}
      />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <CanvasViewport
          workflowVariant={
            rightPanelVariant === 'properties' ||
            rightPanelVariant === 'dap' ||
            rightPanelVariant === 'field-help'
              ? 'default'
              : rightPanelVariant
          }
          bottomControlsOffset={canvasBottomOffset}
          rightControlsOffset={rightPanelOpen ? 412 : 16}
          trigger={
            <PanelTrigger
              layout={rightPanelOpen ? 'right' : 'closed'}
              panels={[
                { id: 'input', label: 'Input', enabled: false },
                { id: 'properties', label: 'Properties', enabled: rightPanelOpen },
                { id: 'output', label: 'Output', enabled: false },
              ]}
              onPanelToggle={(id, enabled) => {
                if (id === 'properties') setRightPanelOpen(enabled);
              }}
              onLayoutChange={(layout) => {
                if (layout === 'right') setRightPanelOpen(true);
              }}
              onPropertiesClick={() => setRightPanelOpen(true)}
            />
          }
        >
          {rightPanelVariant === 'node' && !takeoverOpen && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <Button className="pointer-events-auto" onClick={() => setTakeoverOpen(true)}>
                Open node takeover
              </Button>
            </div>
          )}
        </CanvasViewport>

        {rightPanelOpen && (
          <div
            className="absolute right-0 top-0 z-20 p-4 pl-0"
            style={{ bottom: bottomPanelHeight - 12 }}
          >
            <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
              {rightPanelVariant === 'forms' ? (
                <QuickFormPropertiesPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'rules' ? (
                <RuleBuildingPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'variables' ? (
                <VariableManagementPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'dap' ? (
                <DapPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'field-help' ? (
                <FieldHelpPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'node' ? (
                <SendEmailPropertiesPanel onClose={() => setRightPanelOpen(false)} />
              ) : (
                <PropertiesPanel className="h-full" onClose={() => setRightPanelOpen(false)} />
              )}
            </div>
          </div>
        )}

        <ResizablePanelGroup
          orientation="vertical"
          className="pointer-events-none absolute inset-y-0 left-0 z-30"
          style={{ right: rightPanelOpen ? 396 : 0 }}
        >
          <ResizablePanel defaultSize="55%" minSize="30%" className="pointer-events-none" />
          {!isBottomPanelCollapsed && (
            <ResizableHandle
              withHandle
              className="pointer-events-auto z-20 mx-8 translate-y-3 cursor-row-resize bg-transparent aria-[orientation=horizontal]:w-[calc(100%-4rem)] aria-[orientation=horizontal]:after:h-3 [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 data-[separator=hover]:[&>div]:opacity-100"
            />
          )}
          <ResizablePanel
            panelRef={panelRef}
            collapsible
            collapsedSize={80}
            defaultSize={80}
            minSize={240}
            onResize={({ inPixels }) => {
              setBottomPanelHeight(inPixels);
              if (inPixels > 80) expandedBottomPanelHeight.current = inPixels;
            }}
            className="pointer-events-auto min-h-0 px-4 pb-4 pt-3"
          >
            <CanvasBottomPanel
              variant="floating"
              className="h-full"
              tabs={tabs}
              activeTabId={activeTabId}
              onTabChange={(tabId) => {
                setActiveTabId(tabId);
                if (isBottomPanelCollapsed) setBottomPanelCollapsed(false);
              }}
              isCollapsed={isBottomPanelCollapsed}
              onCollapsedChange={setBottomPanelCollapsed}
              headerActions={
                <ToolbarButton
                  label={isBottomPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                  onClick={() => setBottomPanelCollapsed(!isBottomPanelCollapsed)}
                >
                  {isBottomPanelCollapsed ? <ChevronUp /> : <ChevronDown />}
                </ToolbarButton>
              }
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      {rightPanelVariant === 'node' && (
        <CanvasTakeoverModal
          open={takeoverOpen}
          onOpenChange={setTakeoverOpen}
          title="Send Email"
          headerActions={
            <Button size="sm" variant="secondary">
              <Play size={14} /> Run node
            </Button>
          }
        >
          <SendEmailTakeoverPanels />
        </CanvasTakeoverModal>
      )}
    </div>
  );
}

function TakeoverComposition() {
  const [open, setOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');
  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title="Variables"
        variant="default"
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeItemId={activeSidebarItem}
        onItemSelect={setActiveSidebarItem}
      />
      <div className="relative min-w-0 flex-1">
        <CanvasViewport
          rightControlsOffset={rightPanelOpen ? 412 : 16}
          trigger={
            <PanelTrigger
              panels={[
                { id: 'input', label: 'Input', enabled: false },
                { id: 'properties', label: 'Properties', enabled: rightPanelOpen },
                { id: 'output', label: 'Output', enabled: false },
              ]}
              onPanelToggle={(id, enabled) => {
                if (id === 'properties') setRightPanelOpen(enabled);
              }}
              onPropertiesClick={() => setRightPanelOpen(true)}
            />
          }
        >
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <Button className="pointer-events-auto" onClick={() => setOpen(true)}>
              Open takeover
            </Button>
          </div>
        </CanvasViewport>
      </div>
      {rightPanelOpen && (
        <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">
          <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
            <PropertiesPanel className="h-full" onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      )}
      <CanvasTakeoverModal
        open={open}
        onOpenChange={setOpen}
        title="Test workflow"
        sidebar={<div className="h-full" />}
        headerActions={<Button size="sm">Run test</Button>}
      >
        <div className="h-full min-h-[480px] bg-surface" />
      </CanvasTakeoverModal>
    </div>
  );
}

export function AgentExperienceComposition({ theme }: { theme: ApChatTheme }) {
  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState<CanvasLeftSidebarItemId>('coding-agent');
  const { setEdges, setNodes } = useReactFlow();
  const [chatService] = useState(() =>
    AutopilotChatService.Instantiate({
      instanceName: 'flow-standalone-agent-experience',
      config: {
        mode: AutopilotChatMode.Embedded,
        useLocalHistory: false,
        disabledFeatures: {
          attachments: true,
        },
        firstRunExperience: {
          title: 'What would you like to build?',
          description: 'Describe a workflow and Autopilot will build it on the canvas.',
          suggestions: [
            {
              label: 'Build an invoice approval',
              prompt: 'Build an invoice approval workflow with human review.',
            },
          ],
          sendOnClick: true,
        },
      },
    })
  );

  useEffect(() => {
    chatService.setChatMode(AutopilotChatMode.Embedded);
    const unsubscribe = chatService.on(AutopilotChatEvent.Request, () => {
      const graph = createFlowGraph('forms');
      setNodes(graph.nodes);
      setEdges(graph.edges);
      chatService.sendResponse({
        created_at: new Date().toISOString(),
        widget: '',
        content:
          'I built an invoice approval workflow with extraction, an approval form, human review, and a system update.',
      });
    });

    chatService.setConversation([
      {
        id: 'agent-request',
        role: AutopilotChatRole.User,
        content: 'Build an invoice approval workflow with human review.',
        created_at: new Date().toISOString(),
        widget: '',
      },
      {
        id: 'agent-response',
        role: AutopilotChatRole.Assistant,
        content:
          'Done. I added invoice extraction, an approval form, human review, and an update to the system of record.',
        created_at: new Date().toISOString(),
        widget: '',
      },
    ]);

    return unsubscribe;
  }, [chatService, setEdges, setNodes]);

  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title="Autopilot"
        variant="default"
        expandedContentWidth={400}
        showContentHeader={false}
        isExpanded={expanded}
        onExpandedChange={setExpanded}
        activeItemId={activeItem}
        onItemSelect={setActiveItem}
      >
        {activeItem === 'coding-agent' ? (
          <div className="relative h-full min-h-[480px] overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <ApChat
              chatServiceInstance={chatService}
              theme={theme}
              enableInternalThemeProvider
              disableEmbeddedPortal
            />
          </div>
        ) : (
          <div className="p-1 text-sm font-medium capitalize">
            {activeItem.replaceAll('-', ' ')}
          </div>
        )}
      </CanvasLeftSidebar>
      <div className="min-w-0 flex-1 overflow-hidden">
        <CanvasViewport workflowVariant="forms" />
      </div>
    </div>
  );
}

export function mapTemplateThemeToChat(theme: unknown): ApChatTheme {
  if (typeof theme !== 'string') return 'light';
  if (theme.includes('dark-hc')) return 'dark-hc';
  if (theme.includes('light-hc')) return 'light-hc';
  return theme.includes('dark') ? 'dark' : 'light';
}

export const WithBottomPanel: Story = {
  name: 'w/ Bottom Executions',
  render: () => <ResizableBottomPanel />,
};

export const WithLeftSidebar: Story = {
  name: 'w/ Sidebar Left',
  render: () => <LeftSidebarComposition />,
};

export const WithTakeoverModal: Story = {
  name: 'w/ Modal Takeover',
  render: () => <TakeoverComposition />,
};

export const FullWorkbench: Story = {
  name: 'Workbench',
  render: () => <FullWorkbenchComposition />,
};
