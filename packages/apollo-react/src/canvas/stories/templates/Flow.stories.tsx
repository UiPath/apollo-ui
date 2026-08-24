import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  type NodeProps,
  useNodesInitialized,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Checkbox,
  type FormSchema,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  type PanelImperativeHandle,
  RadioGroup,
  RadioGroupItem,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  VariablePicker,
  type VariablePickerItem,
} from '@uipath/apollo-wind';
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react';
import { DockviewReact } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import {
  AtSign,
  Blocks,
  Bold,
  Bug,
  ChevronDown,
  ChevronUp,
  Code2,
  FlaskConical,
  GitBranch,
  Globe,
  Italic,
  List,
  ListOrdered,
  Mail,
  Maximize2,
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
    'NodePatternComposition',
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

function FlowCanvas({
  workflowVariant = 'default',
  onNodeSelect,
}: {
  workflowVariant?: WorkflowVariant;
  onNodeSelect?: (nodeId: string) => void;
}) {
  const graph = useMemo(() => createFlowGraph(workflowVariant), [workflowVariant]);
  const { canvasProps } = useCanvasStory({
    initialNodes: graph.nodes,
    initialEdges: graph.edges,
  });

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      onNodeClick={(_event, node) => onNodeSelect?.(node.id)}
    />
  );
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
  return (
    <NodePropertyTrigger
      panels={panels}
      behaviorOptions={panelBehaviorOptions}
      layout={layout}
      layoutOptions={panelLayoutOptions}
      onLayoutChange={onLayoutChange}
      onPanelToggle={onPanelToggle}
      onPropertiesClick={onPropertiesClick}
    />
  );
}

function StandaloneRightPropertiesComposition() {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
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
    if (x < 0.25) return 'left';
    if (x > 0.75) return 'right';
    if (y < 0.25) return 'top';
    if (y > 0.75) return 'bottom';
    return 'center';
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-slot="node-property-panel-drag-handle"]')) return;
    const panelBounds = event.currentTarget.getBoundingClientRect();
    const containerBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerBounds) return;
    dragState.current = {
      pointerId: event.pointerId,
      pointerOffsetX: event.clientX - panelBounds.left,
      pointerOffsetY: event.clientY - panelBounds.top,
    };
    setDragPreviewPosition({
      left: panelBounds.left - containerBounds.left,
      top: panelBounds.top - containerBounds.top,
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
    const previewHeight = Math.min(560, containerBounds.height - 16);
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
    center: 'absolute inset-0 grid place-items-center p-4',
  }[panelZone];
  const panelSizeClass = dragPreviewPosition
    ? 'h-[min(560px,calc(100vh-16px))] w-[min(380px,calc(100vw-16px))]'
    : panelZone === 'top' || panelZone === 'bottom'
      ? 'h-[360px] w-full'
      : panelZone === 'center'
        ? 'h-[min(720px,calc(100%-32px))] w-[380px]'
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
              setPanelZone(
                layout === 'bottom' ? 'bottom' : layout === 'split' ? 'center' : 'right'
              );
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
          className={`${dragPreviewPosition ? 'absolute p-0' : panelPositionClass} z-50 touch-none`}
          style={dragPreviewPosition ?? undefined}
        >
          <div
            className={`${panelSizeClass} overflow-hidden rounded-2xl border border-border-subtle shadow-lg ${dragPreviewPosition ? 'cursor-grabbing opacity-80 shadow-2xl ring-2 ring-primary/30 [&_[data-slot=node-property-panel-drag-handle]]:cursor-grabbing [&_[data-slot=node-property-panel-titlebar]]:bg-surface-overlay' : ''}`}
          >
            <PropertiesPanel className="h-full" onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

type StandaloneDockZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

function StandaloneDockHint({ zone }: { zone: StandaloneDockZone }) {
  const zoneClass = {
    left: 'inset-y-4 left-4 right-[52%]',
    right: 'inset-y-4 left-[52%] right-4',
    top: 'inset-x-4 top-4 bottom-[52%]',
    bottom: 'inset-x-4 top-[52%] bottom-4',
    center: 'inset-[24%]',
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
  onNodeSelect,
}: {
  trigger?: ReactNode;
  children?: ReactNode;
  bottomControlsOffset?: number;
  rightControlsOffset?: number;
  workflowVariant?: WorkflowVariant;
  onNodeSelect?: (nodeId: string) => void;
}) {
  const { getNodes, getNodesBounds, setNodes, setViewport } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  const fitWorkflow = useCallback(
    (duration: number) => {
      const container = viewportContainerRef.current;
      const nodes = getNodes();
      if (!container || nodes.length === 0) return;
      const bounds = getNodesBounds(nodes);
      const occupiedRight = Math.max(0, rightControlsOffset - 16);
      const occupiedBottom = Math.max(0, bottomControlsOffset - 20);
      const availableWidth = container.clientWidth - occupiedRight;
      const availableHeight = container.clientHeight - occupiedBottom;
      const padding = 48;
      const zoom = Math.min(
        0.85,
        Math.max(0.1, (availableWidth - padding * 2) / bounds.width),
        Math.max(0.1, (availableHeight - padding * 2) / bounds.height)
      );
      const availableCenterX = availableWidth / 2;
      const availableCenterY = availableHeight / 2;
      void setViewport(
        {
          zoom,
          x: availableCenterX - (bounds.x + bounds.width / 2) * zoom,
          y: availableCenterY - (bounds.y + bounds.height / 2) * zoom,
        },
        { duration }
      );
    },
    [bottomControlsOffset, getNodes, getNodesBounds, rightControlsOffset, setViewport]
  );

  useEffect(() => {
    if (!nodesInitialized) return;
    const timeout = window.setTimeout(() => fitWorkflow(200), 100);
    return () => window.clearTimeout(timeout);
  }, [fitWorkflow, nodesInitialized]);

  useEffect(() => {
    const container = viewportContainerRef.current;
    if (!container || !nodesInitialized) return;
    const resizeObserver = new ResizeObserver(() => fitWorkflow(0));
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [fitWorkflow, nodesInitialized]);

  const tidy = useCallback(() => {
    setNodes(createFlowGraph(workflowVariant).nodes);
    window.setTimeout(() => fitWorkflow(200), 100);
  }, [fitWorkflow, setNodes, workflowVariant]);

  return (
    <div ref={viewportContainerRef} className="relative h-full min-h-0 min-w-0 overflow-hidden">
      <FlowCanvas workflowVariant={workflowVariant} onNodeSelect={onNodeSelect} />
      {children}
      <div className="absolute top-4 z-20" style={{ right: rightControlsOffset }}>
        {trigger ?? <PanelTrigger />}
      </div>
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ bottom: bottomControlsOffset }}
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

  useEffect(() => {
    const updatePanelHeight = () => setPanelHeight(getBottomPropertiesPanelHeight());
    window.addEventListener('resize', updatePanelHeight);
    return () => window.removeEventListener('resize', updatePanelHeight);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-surface">
      <CanvasViewport
        bottomControlsOffset={visiblePanels.length > 0 ? panelHeight + 20 : 20}
        trigger={
          <PanelTrigger
            layout={visiblePanels.length > 0 ? 'bottom' : 'closed'}
            panels={(['input', 'properties', 'output'] as const).map((id) => ({
              id,
              label: id[0]?.toUpperCase() + id.slice(1),
              enabled: visiblePanels.includes(id),
            }))}
            onPanelToggle={(id, enabled) => {
              const panelId = id as BottomPanelId;
              setVisiblePanels((current) =>
                enabled
                  ? current.includes(panelId)
                    ? current
                    : [...current, panelId]
                  : current.filter((currentId) => currentId !== panelId)
              );
            }}
            onLayoutChange={(layout) => {
              if (layout === 'bottom') setVisiblePanels(['input', 'properties', 'output']);
            }}
          />
        }
      />
      {visiblePanels.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-0" style={{ height: panelHeight }}>
          <BottomPanels
            visiblePanels={visiblePanels}
            onPanelClose={(panelId) =>
              setVisiblePanels((current) => current.filter((id) => id !== panelId))
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
}: {
  className?: string;
  onClose?: () => void;
  dragHandleProps?: NodePropertyPanelProps['dragHandleProps'];
}) {
  return (
    <NodePropertyPanel
      panelTitle="Properties"
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

function ExpressionField({
  label,
  value,
  placeholder,
  variables = [],
  onInsertVariable,
  onValueChange,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  variables?: VariablePickerItem[];
  onInsertVariable?: (variable: VariablePickerItem) => void;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">{label}</p>
          <VariablePicker
            items={variables}
            onSelect={(variable) => onInsertVariable?.(variable)}
            disabled={!onInsertVariable || variables.length === 0}
            triggerLabel="Select variable"
            triggerAriaLabel={`Select variable for ${label}`}
          />
        </div>
      )}
      <div className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-overlay px-2.5 text-xs focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus">
        <span className="shrink-0 font-mono text-foreground-accent" aria-hidden="true">
          ƒx
        </span>
        <input
          value={value ?? ''}
          onChange={(event) => onValueChange?.(event.target.value)}
          readOnly={!onValueChange}
          placeholder={placeholder}
          aria-label={label ? `${label} expression` : 'Expression'}
          className="h-8 min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground-accent outline-none placeholder:font-sans placeholder:text-foreground-subtle read-only:cursor-default"
        />
        <SlidersHorizontal className="ml-auto size-4 shrink-0 text-foreground-muted" />
      </div>
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

function SendEmailPropertiesPanel({
  onClose,
  onOpenTakeover,
}: {
  onClose: () => void;
  onOpenTakeover: () => void;
}) {
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Mail />}
      nodeLabel="Send Email"
      nodeCategory="Microsoft Outlook 365"
      action={
        <Button size="sm" onClick={onOpenTakeover}>
          Node Takeover
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
  onPanelClose,
}: {
  visiblePanels: BottomPanelId[];
  onPanelClose: (panelId: BottomPanelId) => void;
}) {
  const [order, setOrder] = useState<BottomPanelId[]>(['input', 'properties', 'output']);
  const [draggedPanel, setDraggedPanel] = useState<BottomPanelId | null>(null);

  const panels: Record<BottomPanelId, ReactNode> = {
    input: (
      <NodePropertyPanel
        panelTitle="Input"
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => handleDragStart(event, 'input'),
          onDragEnd: () => setDraggedPanel(null),
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
          onDragEnd: () => setDraggedPanel(null),
        }}
      />
    ),
    output: (
      <NodePropertyPanel
        panelTitle="Output"
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => handleDragStart(event, 'output'),
          onDragEnd: () => setDraggedPanel(null),
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
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', panelId);
  };

  const handleDrop = (targetPanel: BottomPanelId) => {
    if (!draggedPanel || draggedPanel === targetPanel) return;
    setOrder((currentOrder) => {
      const nextOrder = currentOrder.filter((panelId) => panelId !== draggedPanel);
      nextOrder.splice(nextOrder.indexOf(targetPanel), 0, draggedPanel);
      return nextOrder;
    });
    setDraggedPanel(null);
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
              onDragOver={(event) => {
                if (draggedPanel && draggedPanel !== panelId) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(panelId);
              }}
              className={
                draggedPanel === panelId
                  ? 'h-full w-full overflow-hidden opacity-50'
                  : 'h-full w-full overflow-hidden'
              }
            >
              {panels[panelId]}
            </div>
          </ResizablePanel>
          {index < visibleOrder.length - 1 && <ResizableHandle withHandle />}
        </Fragment>
      ))}
    </ResizablePanelGroup>
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
  render: () => (
    <div className="h-screen bg-surface">
      <CanvasViewport />
    </div>
  ),
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
          <PanelTrigger panels={trigger.panels} onPanelToggle={trigger.onPanelToggle} />
        ) : undefined
      }
    />
  );
}

function DockviewInputPanel(_props: IDockviewPanelProps) {
  return (
    <NodePropertyPanel panelTitle="Input" hideTitleBar className="h-full">
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
  return <PropertiesPanel className="h-full" />;
}

function DockviewOutputPanel(_props: IDockviewPanelProps) {
  return (
    <NodePropertyPanel panelTitle="Output" hideTitleBar className="h-full">
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
          initialWidth: id === 'properties' ? 380 : 320,
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
          : { referencePanel: 'canvas', direction: 'below' },
        initialHeight: openSibling ? undefined : 300,
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
            className="pointer-events-auto z-20 mx-8 translate-y-3 bg-transparent aria-[orientation=horizontal]:w-[calc(100%-4rem)]"
          />
        )}
        <ResizablePanel
          panelRef={panelRef}
          collapsible
          collapsedSize={80}
          defaultSize={368}
          minSize={368}
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
        <CanvasViewport />
      </div>
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

type VariableDemoTab = 'parameters' | 'variables';

type EditableWorkflowVariable = {
  id: string;
  name: string;
  type: string;
  value: string;
};

const VARIABLE_TAB_LIST_CLASS =
  'mx-3 h-auto justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0.5 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const VARIABLE_TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';

type VariableDemoNode = {
  label: string;
  category: string;
  icon: ReactNode;
  parameters: { label: string; value: string; expression?: boolean }[];
  inputs: { name: string; type: string; required?: boolean }[];
  outputs: { name: string; type: string }[];
  updates?: { name: string; value: string }[];
};

const VARIABLE_DEMO_NODES: Record<string, VariableDemoNode> = {
  trigger: {
    label: 'Start workflow',
    category: 'Manual trigger',
    icon: <Play />,
    parameters: [
      { label: 'Trigger type', value: 'Manual' },
      { label: 'Allow API invocation', value: 'Enabled' },
      { label: 'Default invoice ID', value: '$vars.currentInvoice.id', expression: true },
    ],
    inputs: [
      { name: 'invoiceId', type: 'Text', required: true },
      { name: 'priority', type: 'Number' },
    ],
    outputs: [{ name: 'requestedBy', type: 'Text' }],
  },
  initialize: {
    label: 'Initialize variables',
    category: 'Workflow scope',
    icon: <Code2 />,
    parameters: [
      { label: 'Invoice ID', value: '$vars.startWorkflow.output.invoiceId', expression: true },
      { label: 'Initial status', value: 'Pending review' },
    ],
    inputs: [{ name: 'invoiceId', type: 'Text', required: true }],
    outputs: [
      { name: 'invoice', type: 'Object' },
      { name: 'approvalStatus', type: 'Text' },
    ],
    updates: [
      { name: 'currentInvoice', value: '$result.invoice' },
      { name: 'approvalStatus', value: 'Pending review' },
    ],
  },
  transform: {
    label: 'Transform invoice data',
    category: 'Expressions',
    icon: <Sparkles />,
    parameters: [
      { label: 'Source', value: '$vars.currentInvoice', expression: true },
      { label: 'Transformation', value: 'Normalize invoice fields' },
    ],
    inputs: [{ name: 'currentInvoice', type: 'Object', required: true }],
    outputs: [{ name: 'normalizedInvoice', type: 'Object' }],
  },
  assign: {
    label: 'Assign approval state',
    category: 'Variables',
    icon: <SlidersHorizontal />,
    parameters: [
      { label: 'Condition', value: '$vars.currentInvoice.total > 10000', expression: true },
      { label: 'Approval state', value: 'Manager review' },
    ],
    inputs: [
      { name: 'currentInvoice', type: 'Object', required: true },
      { name: 'approvalStatus', type: 'Text' },
    ],
    outputs: [{ name: 'requiresApproval', type: 'Boolean' }],
    updates: [{ name: 'approvalStatus', value: 'Manager review' }],
  },
  output: {
    label: 'Publish outputs',
    category: 'Workflow results',
    icon: <Upload />,
    parameters: [
      { label: 'Invoice', value: '$vars.normalizedInvoice', expression: true },
      { label: 'Status', value: '$vars.approvalStatus', expression: true },
    ],
    inputs: [
      { name: 'normalizedInvoice', type: 'Object', required: true },
      { name: 'approvalStatus', type: 'Text', required: true },
    ],
    outputs: [
      { name: 'invoice', type: 'Object' },
      { name: 'status', type: 'Text' },
    ],
  },
};

function VariableRow({ name, type, required }: { name: string; type: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-overlay px-3 py-2.5">
      <Code2 className="size-4 shrink-0 text-foreground-subtle" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-medium text-foreground">{name}</p>
        <p className="mt-0.5 text-[11px] text-foreground-muted">
          {type}
          {required ? ' · Required' : ''}
        </p>
      </div>
    </div>
  );
}

function UnifiedVariablesPanel({
  nodeId,
  activeTab,
  onActiveTabChange,
  onClose,
  onExpand,
  workflowVariables,
  onWorkflowVariablesChange,
  parameterValues,
  onParameterValueChange,
  columnMode,
}: {
  nodeId: string;
  activeTab: VariableDemoTab;
  onActiveTabChange: (tab: VariableDemoTab) => void;
  onClose?: () => void;
  onExpand?: () => void;
  workflowVariables: EditableWorkflowVariable[];
  onWorkflowVariablesChange: (variables: EditableWorkflowVariable[]) => void;
  parameterValues: Record<string, string>;
  onParameterValueChange: (key: string, value: string) => void;
  columnMode?: VariableDemoTab;
}) {
  const node = VARIABLE_DEMO_NODES[nodeId] ?? VARIABLE_DEMO_NODES.trigger;
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const variablePickerItems = workflowVariables.map((variable) => ({
    id: variable.id,
    label: variable.name,
    value: `$vars.${variable.name}`,
    type: variable.type.toLowerCase(),
  }));
  const updateWorkflowVariable = (
    variableId: string,
    updates: Partial<EditableWorkflowVariable>
  ) => {
    onWorkflowVariablesChange(
      workflowVariables.map((variable) =>
        variable.id === variableId ? { ...variable, ...updates } : variable
      )
    );
  };
  return (
    <NodePropertyPanel
      panelTitle={
        columnMode ? (columnMode === 'parameters' ? 'Parameters' : 'Variables') : 'Properties'
      }
      nodeIcon={columnMode ? undefined : node.icon}
      nodeLabel={columnMode ? undefined : node.label}
      nodeCategory={columnMode ? undefined : node.category}
      onClose={onClose}
      headerExtra={
        onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand configuration"
            title="Expand configuration"
            className="grid size-6 place-items-center rounded text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
          >
            <Maximize2 size={14} />
          </button>
        ) : undefined
      }
      contentInset="0.875rem"
      className="h-full"
    >
      <Tabs
        value={columnMode ?? activeTab}
        onValueChange={(value) => onActiveTabChange(value as VariableDemoTab)}
        className="flex h-full min-h-0 flex-col"
      >
        {!columnMode && (
          <TabsList className={VARIABLE_TAB_LIST_CLASS}>
            <TabsTrigger value="parameters" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Parameters
            </TabsTrigger>
            <TabsTrigger value="variables" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Variables
            </TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="parameters" className="min-h-0 flex-1 overflow-auto p-3">
          <div className="space-y-4">
            <p className="text-xs leading-5 text-foreground-muted">
              Configure what this node does when the workflow runs.
            </p>
            {node.parameters.map((parameter) => {
              const parameterKey = `${nodeId}:${parameter.label}`;
              const value = parameterValues[parameterKey] ?? parameter.value;
              return (
                <div key={parameter.label}>
                  {parameter.expression ? (
                    <ExpressionField
                      label={parameter.label}
                      value={value}
                      variables={variablePickerItems}
                      onInsertVariable={(variable) =>
                        onParameterValueChange(parameterKey, variable.value ?? variable.label)
                      }
                      onValueChange={(nextValue) => onParameterValueChange(parameterKey, nextValue)}
                    />
                  ) : (
                    <>
                      <p className="mb-1.5 text-xs font-medium text-foreground">
                        {parameter.label}
                      </p>
                      <div className="flex min-h-9 items-center rounded-lg border border-border-subtle bg-surface-overlay px-2.5 text-xs text-foreground">
                        {value}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="variables" className="min-h-0 flex-1 overflow-auto p-3">
          <div className="space-y-5">
            <p className="text-xs leading-5 text-foreground-muted">
              See the values this node receives, creates, and changes.
            </p>
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Inputs</p>
                <span className="text-[11px] text-foreground-muted">Available to this node</span>
              </div>
              <div className="space-y-2">
                {node.inputs.map((variable) => (
                  <VariableRow key={variable.name} {...variable} />
                ))}
              </div>
            </section>
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Outputs</p>
                <span className="text-[11px] text-foreground-muted">Created by this node</span>
              </div>
              <div className="space-y-2">
                {node.outputs.map((variable) => (
                  <VariableRow key={variable.name} {...variable} />
                ))}
              </div>
            </section>
            {node.updates && (
              <section>
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Changes when this node runs
                </p>
                <div className="space-y-2">
                  {node.updates.map((update) => (
                    <div
                      key={update.name}
                      className="rounded-lg border border-border-subtle px-3 py-2.5"
                    >
                      <p className="font-mono text-xs font-medium">{update.name}</p>
                      <p className="mt-1 truncate font-mono text-[11px] text-foreground-muted">
                        {update.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="border-t border-border-subtle pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Workflow variables</p>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">
                    Reusable across every node
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs font-semibold text-brand hover:text-brand"
                  onClick={() => {
                    const id = `variable-${Date.now()}`;
                    onWorkflowVariablesChange([
                      ...workflowVariables,
                      { id, name: 'newVariable', type: 'Text', value: '' },
                    ]);
                    setEditingVariableId(id);
                  }}
                >
                  <Plus size={14} /> Add variable
                </Button>
              </div>
              <div className="space-y-2">
                {workflowVariables.map((variable) =>
                  editingVariableId === variable.id ? (
                    <div
                      key={variable.id}
                      className="space-y-2 rounded-lg border border-border-focus bg-surface-overlay p-3"
                    >
                      <div className="grid grid-cols-[1fr_92px] gap-2">
                        <input
                          value={variable.name}
                          onChange={(event) =>
                            updateWorkflowVariable(variable.id, { name: event.target.value })
                          }
                          aria-label="Variable name"
                          className="h-8 min-w-0 rounded-md border border-border-subtle bg-surface px-2 text-xs outline-none focus:border-border-focus"
                        />
                        <select
                          value={variable.type}
                          onChange={(event) =>
                            updateWorkflowVariable(variable.id, { type: event.target.value })
                          }
                          aria-label="Variable type"
                          className="h-8 rounded-md border border-border-subtle bg-surface px-2 text-xs outline-none focus:border-border-focus"
                        >
                          <option>Text</option>
                          <option>Number</option>
                          <option>Boolean</option>
                          <option>Object</option>
                        </select>
                      </div>
                      <input
                        value={variable.value}
                        onChange={(event) =>
                          updateWorkflowVariable(variable.id, { value: event.target.value })
                        }
                        placeholder="Default value"
                        aria-label="Default value"
                        className="h-8 w-full rounded-md border border-border-subtle bg-surface px-2 text-xs outline-none focus:border-border-focus"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => setEditingVariableId(null)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={variable.id}
                      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-overlay px-3 py-2.5"
                    >
                      <Code2 className="size-4 shrink-0 text-foreground-subtle" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium">{variable.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
                          {variable.type} · {variable.value || 'No default value'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingVariableId(variable.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
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
    const itemNodes = group.items.map((item, columnIndex) => {
      const hasPanelMockup = NODE_PANEL_SPECS[item.id] !== undefined;
      return createNode({
        id: item.id,
        type: 'uipath.blank-node',
        position: { x: 190 + columnIndex * 245, y: y + 8 },
        display: {
          label: item.label,
          subLabel: hasPanelMockup
            ? '🟢 Panel mockup'
            : item.source === 'dynamic'
              ? 'Dynamic catalog example'
              : group.category,
          icon: item.icon,
        },
        data: {
          inventoryNodeType: item.nodeType,
          inventoryItem: true,
        },
      });
    });
    return [categoryNode, ...itemNodes];
  });
}

const inventoryNodeTypes = {
  'inventory-category': InventoryCategoryNode,
};

function NodeInventoryCanvas({
  onItemSelect,
  rightPanelOpen,
}: {
  onItemSelect: (item: NodeInventoryItem) => void;
  rightPanelOpen: boolean;
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
      <div
        className="absolute bottom-5 z-20 -translate-x-1/2 transition-[left] duration-200"
        style={{ left: rightPanelOpen ? 'calc(50% - 198px)' : '50%' }}
      >
        <CanvasNavigationControls />
      </div>
      <div
        className="absolute bottom-5 z-20 transition-[right] duration-200"
        style={{ right: rightPanelOpen ? 412 : 16 }}
      >
        <CanvasZoomControls
          orientation="vertical"
          onOrganize={() => void fitView({ padding: 0.12, duration: 200, maxZoom: 0.85 })}
        />
      </div>
    </div>
  );
}

type InventoryField = {
  label: string;
  value?: string;
  helper?: string;
  kind?: 'expression' | 'select' | 'textarea' | 'toggle' | 'checkbox';
  required?: boolean;
};

type InventoryPanelSpec = {
  section?: string;
  description?: string;
  fields?: InventoryField[];
  action?: string;
  empty?: boolean;
};

const NODE_PANEL_SPECS: Record<string, InventoryPanelSpec> = {
  'autonomous-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Harness', value: 'Standard harness', kind: 'select' },
      { label: 'Model', value: 'anthropic.claude-sonnet-5', kind: 'select', required: true },
      {
        label: 'System prompt',
        value: 'You are an agentic assistant.',
        kind: 'textarea',
        required: true,
      },
      {
        label: 'User prompt',
        value: 'What is the current date?',
        kind: 'textarea',
        required: true,
      },
    ],
    action: 'Add output variable',
  },
  'conversational-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Model', value: 'anthropic.claude-sonnet-5', kind: 'select' },
      { label: 'System prompt', value: "You're an agent", kind: 'textarea' },
      { label: 'Conversation context', value: '$vars.flowTest', kind: 'expression' },
      {
        label: 'End exchange',
        helper: 'End the conversation exchange after this response.',
        kind: 'checkbox',
      },
    ],
    action: 'Add output variable',
  },
  'voice-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Model', value: 'gemini-3.1-flash-live-preview', kind: 'select' },
      { label: 'Persona', value: 'Aoede', kind: 'select' },
      { label: 'System prompt', value: '', kind: 'textarea' },
      { label: 'Call context', value: '$metadata.FolderKey', kind: 'expression' },
    ],
    action: 'Add output variable',
  },
  'http-request-v2': {
    fields: [
      { label: 'Authentication', value: 'Manual authentication', kind: 'select', required: true },
      { label: 'Method', value: 'POST', kind: 'select', required: true },
      { label: 'URL', value: 'https://catfact.ninja/fact', kind: 'expression', required: true },
      { label: 'Body', value: '', kind: 'textarea' },
    ],
    action: 'Add header or query pair',
  },
  'slack-send': {
    fields: [
      { label: 'Slack connection', value: 'carl.schultze', kind: 'select', required: true },
      {
        label: 'Channel name/ID',
        value: 'carl-design - C0HBZDNJKPT',
        kind: 'expression',
        required: true,
      },
      { label: 'Message', value: 'Test', kind: 'expression', required: true },
      { label: 'Send as', value: 'Bot', kind: 'select', required: true },
      { label: 'Button actions', value: '', kind: 'expression' },
      { label: 'Image URL', value: '', kind: 'expression' },
    ],
  },
  'batch-transform': {
    section: 'Data source',
    fields: [
      { label: 'Attachment', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Prompt', value: 'Transform the data', kind: 'textarea', required: true },
      { label: 'Enable web search grounding', kind: 'checkbox' },
      { label: 'Output column', value: 'OutputColumn1' },
      {
        label: 'Description',
        value: 'Describe what this new column should contain',
        kind: 'textarea',
      },
    ],
    action: 'Add column',
  },
  filter: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Condition', value: 'Equals', kind: 'select' },
      { label: 'Value', value: '1' },
    ],
    action: 'Add condition',
  },
  'group-by': {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Operation', value: 'Count', kind: 'select', required: true },
      { label: 'Output name', value: 'count', required: true },
    ],
    action: 'Add aggregation',
  },
  map: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Transformation', value: 'Trim whitespace', kind: 'select' },
    ],
    action: 'Add field',
  },
  transform: {
    description: 'Build a visual transformation from input to output.',
    action: 'Edit transformation',
  },
  'read-entity': {
    fields: [
      { label: 'Data Fabric entity', value: 'Account', kind: 'select' },
      { label: 'Filter field', value: 'Field', kind: 'select' },
      { label: 'Filter value', value: '$vars.flowTest', kind: 'expression' },
    ],
    action: 'Add AND or OR filter',
  },
  'update-entity': {
    section: 'How to identify the record',
    fields: [
      { label: 'Data Fabric entity', value: 'Account', kind: 'select' },
      { label: 'Record ID', value: '1', kind: 'expression' },
      { label: 'Field to update', value: 'AnotherThing', kind: 'select' },
      { label: 'New value', value: '1', kind: 'expression' },
    ],
    action: 'Add field',
  },
  summarize: {
    section: 'Data source',
    fields: [
      { label: 'Attachment', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Prompt', value: 'Summarize this', kind: 'textarea', required: true },
    ],
  },
  extract: {
    section: 'Model config',
    fields: [
      { label: 'Model family', value: 'Gemini', kind: 'select' },
      { label: 'Model version', value: '2.5 Flash', kind: 'select' },
      { label: 'Execution mode', value: 'Standard', kind: 'select' },
      { label: 'File', value: '$vars.flowTest', kind: 'expression', required: true },
      {
        label: 'Overall extraction instructions',
        value: 'Context relevant across the whole schema...',
        kind: 'textarea',
      },
    ],
    action: 'Add field group',
  },
  'quick-form': {
    section: 'Task delivery',
    fields: [
      { label: 'Delivery channel', value: 'Slack', kind: 'select' },
      { label: 'Assignment criteria', value: 'All users', kind: 'select' },
      { label: 'Form title', value: 'Quick Approval' },
      { label: 'New field', value: '', kind: 'expression' },
    ],
    action: 'Add outcome',
  },
  'action-app': {
    section: 'Task delivery',
    fields: [
      { label: 'Delivery channel', value: 'Slack', kind: 'select' },
      { label: 'Assignment criteria', value: 'Single User', kind: 'select' },
      { label: 'Assignee', value: 'carl.schultze@uipath.com' },
      { label: 'Action App', value: 'Select a coded action app', kind: 'select' },
    ],
  },
  mock: { empty: true },
  merge: { empty: true },
  flow: { empty: true },
  'rpa-workflow': { empty: true },
  decision: {
    fields: [
      { label: 'Condition', value: '$vars.flowBoolean', kind: 'expression', required: true },
      { label: 'True branch label', value: 'True' },
      { label: 'False branch label', value: 'False' },
    ],
  },
  switch: {
    section: 'Switch cases',
    fields: [
      { label: 'Case 1', value: '$vars.flowBoolean', kind: 'expression' },
      { label: 'Other', value: '$vars.flowBoolean', kind: 'expression' },
    ],
    action: 'Add case',
  },
  end: { action: 'Add output variable' },
  terminate: { empty: true },
  loop: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Parallel', helper: 'Run iterations at the same time.', kind: 'toggle' },
      { label: 'Break on condition', value: '$vars.flowBoolean', kind: 'expression' },
      { label: 'Show break handle', kind: 'toggle' },
    ],
  },
  script: { fields: [{ label: 'Code', value: '//', kind: 'textarea', required: true }] },
  'wait-message': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'From', value: 'User', kind: 'select' },
      { label: 'Number of exchanges', value: '20' },
    ],
  },
  'conversation-context': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Exchange limit', value: '20' },
    ],
  },
  'send-message': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Exchange ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'End exchange after writing', kind: 'checkbox' },
      { label: 'Content', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Mimetype', value: 'text/markdown' },
    ],
  },
  'queue-create': {
    fields: [{ label: 'Queue', value: 'Select a queue', kind: 'select', required: true }],
  },
  'queue-create-wait': {
    fields: [{ label: 'Queue', value: 'Select a queue', kind: 'select', required: true }],
  },
  'outgoing-call': {
    fields: [
      { label: 'From', value: 'Select a connected number...', kind: 'select', required: true },
      { label: 'To', value: '$vars.flowTest', kind: 'expression', required: true },
    ],
  },
  'end-call': {
    fields: [
      { label: 'Call context', value: '$vars.flowTest', kind: 'expression', required: true },
    ],
  },
  'manual-trigger': {
    description: 'Define input arguments provided when this trigger starts the flow.',
    action: 'Add input argument',
  },
  'scheduled-trigger': {
    fields: [
      { label: 'Frequency', value: 'Hourly', kind: 'select', required: true },
      { label: 'Every', value: '1' },
      { label: 'At minute', value: '0', kind: 'select' },
    ],
  },
  'slack-trigger': {
    fields: [{ label: 'Slack connection', value: 'carl.schultze', kind: 'select', required: true }],
  },
  'http-webhook': {
    fields: [
      { label: 'HTTP Webhook connection', value: 'Flow Test', kind: 'select', required: true },
    ],
  },
  'incoming-call': { empty: true },
  'conversation-trigger': { empty: true },
  delay: {
    fields: [
      { label: 'Type', value: 'Duration', kind: 'select', required: true },
      { label: 'Duration', value: '15 minutes', kind: 'select', required: true },
    ],
  },
  'webhook-wait': {
    fields: [
      { label: 'HTTP Webhook connection', value: 'Flow Test', kind: 'select', required: true },
    ],
  },
  'email-wait': {
    fields: [
      { label: 'Gmail connection', value: 'Select a connection', kind: 'select', required: true },
    ],
  },
  subflow: {
    section: 'Inputs',
    description:
      'Define input variables for this subflow and map expressions from the parent scope.',
    action: 'Add input variable',
  },
  bpmn: { empty: true },
  case: {
    fields: [
      {
        label: 'Enable fire and forget',
        helper: 'Start the run without waiting for it to finish.',
        kind: 'toggle',
      },
    ],
  },
  'api-workflow': { empty: true },
};

function InventoryPanelField({ field }: { field: InventoryField }) {
  if (field.kind === 'toggle' || field.kind === 'checkbox') {
    return (
      <div className="flex items-start justify-between gap-3 py-1">
        <div>
          <Label className="text-xs">{field.label}</Label>
          {field.helper && (
            <p className="mt-0.5 text-[11px] text-foreground-muted">{field.helper}</p>
          )}
        </div>
        {field.kind === 'toggle' ? <Switch /> : <Checkbox aria-label={field.label} />}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {field.label}
        {field.required && <span className="text-error"> *</span>}
      </Label>
      {field.kind === 'select' ? (
        <Select defaultValue="current">
          <SelectTrigger className="h-9 w-full bg-surface-overlay text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">{field.value}</SelectItem>
          </SelectContent>
        </Select>
      ) : field.kind === 'textarea' ? (
        <Textarea
          defaultValue={field.value}
          className="min-h-24 resize-none bg-surface-overlay text-xs"
        />
      ) : field.kind === 'expression' ? (
        <div className="flex items-center rounded-lg border border-border-subtle bg-surface-overlay px-2 focus-within:border-border-focus">
          <span className="mr-1.5 font-mono text-xs text-foreground-subtle">=</span>
          <Input
            defaultValue={field.value}
            className="border-0 bg-transparent px-0 font-mono text-xs text-foreground-accent shadow-none focus-visible:ring-0"
          />
        </div>
      ) : (
        <Input defaultValue={field.value} className="h-9 bg-surface-overlay text-xs" />
      )}
      {field.helper && <p className="text-[11px] text-foreground-muted">{field.helper}</p>}
    </div>
  );
}

function NodeInventoryPanel({ item, onClose }: { item: NodeInventoryItem; onClose?: () => void }) {
  const spec = NODE_PANEL_SPECS[item.id];
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<CanvasIcon icon={item.icon} size={22} />}
      nodeLabel={item.label}
      nodeCategory={item.category}
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
          <TabsList className={VARIABLE_TAB_LIST_CLASS}>
            <TabsTrigger value="parameters" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Parameters
            </TabsTrigger>
            <TabsTrigger value="errors" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Error handling
            </TabsTrigger>
            <TabsTrigger value="advanced" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Advanced
            </TabsTrigger>
          </TabsList>
          <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <div className="space-y-4">
              <p className="text-xs leading-5 text-foreground-muted">
                Configure what this node does when the workflow runs.
              </p>
              {spec?.section && (
                <p className="text-xs font-semibold text-foreground">{spec.section}</p>
              )}
              {spec?.description && (
                <p className="text-xs leading-5 text-foreground-muted">{spec.description}</p>
              )}
              {spec?.empty && (
                <p className="text-xs text-foreground-muted">No available parameters</p>
              )}
              {spec?.fields?.map((field) => (
                <InventoryPanelField key={field.label} field={field} />
              ))}
              {spec?.action && (
                <Button
                  size="sm"
                  variant={spec.action.startsWith('Add') ? 'ghost' : 'outline'}
                  className={
                    spec.action.startsWith('Add')
                      ? 'h-7 px-2 text-xs font-semibold text-brand hover:text-brand'
                      : 'h-8 text-xs'
                  }
                >
                  {spec.action.startsWith('Add') && <Plus size={14} />}
                  {spec.action}
                </Button>
              )}
              {!spec && (
                <p className="text-xs text-foreground-muted">
                  No Figma reference is available for this node yet.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="errors" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <p className="text-xs leading-5 text-foreground-muted">
              Configure retry, timeout, and error continuation behavior for this node.
            </p>
          </TabsContent>
          <TabsContent value="advanced" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <p className="text-xs leading-5 text-foreground-muted">
              Advanced execution settings are available when supported by this node.
            </p>
          </TabsContent>
        </Tabs>
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
          rightPanelOpen={rightPanelOpen}
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

function SingleNodePatternCanvas({ item }: { item: NodeInventoryItem }) {
  const nodes = useMemo(
    () => [
      createNode({
        id: item.id,
        type: 'uipath.blank-node',
        position: { x: 0, y: 0 },
        selected: true,
        display: {
          label: item.label,
          subLabel: item.category,
          icon: item.icon,
        },
        data: {
          inventoryNodeType: item.nodeType,
          inventoryItem: true,
        },
      }),
    ],
    [item]
  );
  const { fitView, getViewport, setViewport } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const { canvasProps } = useCanvasStory({ initialNodes: nodes, initialEdges: [] });

  const fitNode = useCallback(
    async (duration: number) => {
      await fitView({ padding: 0.42, maxZoom: 1, duration });
      const viewport = getViewport();
      await setViewport({ ...viewport, x: viewport.x - 198 }, { duration: 0 });
    },
    [fitView, getViewport, setViewport]
  );

  useEffect(() => {
    if (!nodesInitialized) return;
    void fitNode(0);
  }, [fitNode, nodesInitialized]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <BaseCanvas {...canvasProps} mode="view" />
      <div
        className="absolute bottom-5 z-20 -translate-x-1/2"
        style={{ left: 'calc(50% - 198px)' }}
      >
        <CanvasNavigationControls />
      </div>
      <div className="absolute bottom-5 right-[412px] z-20">
        <CanvasZoomControls orientation="vertical" onOrganize={() => void fitNode(200)} />
      </div>
    </div>
  );
}

export function NodePatternComposition({ nodeId }: { nodeId: string }) {
  const item = NODE_INVENTORY_ITEMS.find((candidate) => candidate.id === nodeId);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');

  if (!item) {
    return (
      <div className="grid h-screen place-items-center bg-surface p-8 text-sm text-foreground-muted">
        Node pattern “{nodeId}” was not found.
      </div>
    );
  }

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
        <SingleNodePatternCanvas item={item} />
        <div className="absolute right-[412px] top-4 z-20">
          <PanelTrigger
            layout="right"
            panels={[
              { id: 'input', label: 'Input', enabled: false },
              { id: 'properties', label: 'Properties', enabled: true },
              { id: 'output', label: 'Output', enabled: false },
            ]}
          />
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">
        <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
          <NodeInventoryPanel item={item} />
        </div>
      </div>
    </div>
  );
}

function DapValueField({
  id,
  label,
  value,
  placeholder,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-error"> *</span>}
      </Label>
      <InputGroup className="h-9 bg-surface-overlay">
        <InputGroupInput
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="text-xs"
        />
        <InputGroupAddon align="inline-end" className="-my-1 gap-0 self-stretch">
          <InputGroupButton
            icon
            aria-label={`Insert variable for ${label}`}
            title="Insert variable"
            className="h-full rounded-none border-l px-2.5"
            onClick={() => onChange(`${value}$vars.`)}
          >
            <AtSign size={14} />
          </InputGroupButton>
          <InputGroupButton
            icon
            aria-label={`Configure value for ${label}`}
            title="Configure value"
            className="h-full rounded-none border-l px-2.5"
          >
            <SlidersHorizontal size={14} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function DapPanel({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('Invoice approval required');
  const [recipient, setRecipient] = useState('$vars.approverEmail');
  const [body, setBody] = useState(
    'Hi $vars.approverName,\n\nPlease review invoice $vars.invoiceNumber.'
  );
  const [attachment, setAttachment] = useState('$vars.invoicePdf');
  const [replyTo, setReplyTo] = useState('finance-ops@example.com');
  const [includeDetails, setIncludeDetails] = useState('true');
  const [selectedProperties, setSelectedProperties] = useState(['Subject', 'Body', 'Importance']);

  const toggleProperty = (property: string) => {
    setSelectedProperties((current) =>
      current.includes(property)
        ? current.filter((candidate) => candidate !== property)
        : [...current, property]
    );
  };

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Mail />}
      nodeLabel="Send email"
      nodeCategory="Gmail · DAP layout"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <Tabs defaultValue="parameters" className="flex h-full min-h-0 flex-col">
        <TabsList className={VARIABLE_TAB_LIST_CLASS}>
          <TabsTrigger value="parameters" className={VARIABLE_TAB_TRIGGER_CLASS}>
            Parameters
          </TabsTrigger>
          <TabsTrigger value="variables" className={VARIABLE_TAB_TRIGGER_CLASS}>
            Variables
          </TabsTrigger>
        </TabsList>
        <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-5">
            <p className="text-xs leading-5 text-foreground-muted">
              Configure a connector activity using reusable DAP field and value-source patterns.
            </p>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-foreground">Connection</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs font-semibold text-brand hover:text-brand"
                >
                  Refresh schema
                </Button>
              </div>
              <Select defaultValue="gmail-finance">
                <SelectTrigger className="h-9 w-full bg-surface-overlay text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail-finance">Gmail · Finance operations</SelectItem>
                  <SelectItem value="gmail-personal">Gmail · Personal</SelectItem>
                </SelectContent>
              </Select>
              <Alert className="border-brand/30 bg-brand-subtle/30 py-2.5">
                <AlertDescription className="text-[11px] leading-4">
                  Schema is current. Nine configurable message properties are available.
                </AlertDescription>
              </Alert>
            </section>

            <Separator />

            <section className="space-y-4">
              <p className="text-xs font-semibold text-foreground">Message</p>
              <DapValueField
                id="dap-recipient"
                label="To"
                value={recipient}
                placeholder="Recipient email address"
                required
                onChange={setRecipient}
              />
              <DapValueField
                id="dap-subject"
                label="Subject"
                value={subject}
                placeholder="The subject of the email"
                required
                onChange={setSubject}
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="dap-body" className="text-xs">
                    Body <span className="text-error">*</span>
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-brand hover:text-brand"
                    onClick={() => setBody(`${body}$vars.`)}
                  >
                    <AtSign size={13} /> Insert variable
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-overlay focus-within:border-border-focus">
                  <div className="flex h-8 items-center gap-1 border-b border-border-subtle px-2">
                    <Button size="sm" variant="ghost" className="size-6 p-0" aria-label="Bold">
                      <Bold size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0"
                      aria-label="Bulleted list"
                    >
                      <List size={13} />
                    </Button>
                    <span className="ml-auto text-[10px] text-foreground-muted">Rich text</span>
                  </div>
                  <Textarea
                    id="dap-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    className="min-h-28 resize-none rounded-none border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <DapValueField
                id="dap-attachment"
                label="Attachment"
                value={attachment}
                placeholder="The file to attach"
                onChange={setAttachment}
              />
            </section>

            <Accordion type="multiple" defaultValue={['options']} className="space-y-2">
              <AccordionItem
                value="options"
                className="rounded-lg border border-border-subtle px-3"
              >
                <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
                  Options
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Include message details</Label>
                    <RadioGroup
                      value={includeDetails}
                      onValueChange={setIncludeDetails}
                      className="flex gap-5"
                    >
                      <label className="flex items-center gap-2 text-xs" htmlFor="dap-details-true">
                        <RadioGroupItem id="dap-details-true" value="true" /> True
                      </label>
                      <label
                        className="flex items-center gap-2 text-xs"
                        htmlFor="dap-details-false"
                      >
                        <RadioGroupItem id="dap-details-false" value="false" /> False
                      </label>
                    </RadioGroup>
                  </div>
                  <DapValueField
                    id="dap-reply-to"
                    label="Reply to"
                    value={replyTo}
                    placeholder="Reply-to address"
                    onChange={setReplyTo}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Importance</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger className="h-9 w-full bg-surface-overlay text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="properties"
                className="rounded-lg border border-border-subtle px-3"
              >
                <AccordionTrigger className="py-3 text-xs font-semibold hover:no-underline">
                  Manage properties
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <p className="text-[11px] leading-4 text-foreground-muted">
                    Choose the optional fields shown for this connector activity.
                  </p>
                  {['Subject', 'Body', 'Reply to', 'Importance', 'Attachment'].map((property) => (
                    <div
                      key={property}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-xs"
                    >
                      <Checkbox
                        id={`dap-property-${property.toLowerCase().replaceAll(' ', '-')}`}
                        checked={selectedProperties.includes(property)}
                        onCheckedChange={() => toggleProperty(property)}
                      />
                      <Label
                        htmlFor={`dap-property-${property.toLowerCase().replaceAll(' ', '-')}`}
                        className="flex-1 cursor-pointer text-xs font-normal"
                      >
                        {property}
                      </Label>
                      <span className="text-[10px] text-foreground-muted">String</span>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="h-8 w-full text-xs">
                    Update fields
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            <p className="text-xs leading-5 text-foreground-muted">
              Values available to the connector fields and produced when this activity runs.
            </p>
            {[
              ['$vars.approverEmail', 'Text · Input'],
              ['$vars.approverName', 'Text · Input'],
              ['$vars.invoiceNumber', 'Text · Input'],
              ['$vars.invoicePdf', 'File · Input'],
              ['$output.messageId', 'Text · Output'],
            ].map(([name, metadata]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-overlay px-3 py-2.5"
              >
                <Blocks className="size-4 shrink-0 text-foreground-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-medium">{name}</p>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">{metadata}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </NodePropertyPanel>
  );
}

export function FullWorkbenchComposition({
  rightPanelVariant = 'properties',
}: {
  rightPanelVariant?: 'properties' | 'forms' | 'node' | 'rules' | 'variables' | 'dap';
}) {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [selectedVariableNodeId, setSelectedVariableNodeId] = useState('trigger');
  const [variableDemoTab, setVariableDemoTab] = useState<VariableDemoTab>('parameters');
  const [editableWorkflowVariables, setEditableWorkflowVariables] = useState<
    EditableWorkflowVariable[]
  >([
    { id: 'current-invoice', name: 'currentInvoice', type: 'Object', value: '{}' },
    { id: 'approval-status', name: 'approvalStatus', type: 'Text', value: 'Pending review' },
    { id: 'review-threshold', name: 'reviewThreshold', type: 'Number', value: '10000' },
  ]);
  const [variableParameterValues, setVariableParameterValues] = useState<Record<string, string>>(
    {}
  );
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
    else panelRef.current?.expand();
  };

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
            rightPanelVariant === 'properties' || rightPanelVariant === 'dap'
              ? 'default'
              : rightPanelVariant
          }
          bottomControlsOffset={bottomPanelHeight + 20}
          rightControlsOffset={rightPanelOpen ? 412 : 16}
          onNodeSelect={
            rightPanelVariant === 'variables'
              ? (nodeId) => {
                  setSelectedVariableNodeId(nodeId);
                  setRightPanelOpen(true);
                }
              : undefined
          }
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
            />
          }
        />

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
                <UnifiedVariablesPanel
                  nodeId={selectedVariableNodeId}
                  activeTab={variableDemoTab}
                  onActiveTabChange={setVariableDemoTab}
                  onClose={() => setRightPanelOpen(false)}
                  onExpand={() => setTakeoverOpen(true)}
                  workflowVariables={editableWorkflowVariables}
                  onWorkflowVariablesChange={setEditableWorkflowVariables}
                  parameterValues={variableParameterValues}
                  onParameterValueChange={(key, value) =>
                    setVariableParameterValues((current) => ({ ...current, [key]: value }))
                  }
                />
              ) : rightPanelVariant === 'dap' ? (
                <DapPanel onClose={() => setRightPanelOpen(false)} />
              ) : rightPanelVariant === 'node' ? (
                <SendEmailPropertiesPanel
                  onClose={() => setRightPanelOpen(false)}
                  onOpenTakeover={() => setTakeoverOpen(true)}
                />
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
              className="pointer-events-auto z-20 mx-8 translate-y-3 bg-transparent aria-[orientation=horizontal]:w-[calc(100%-4rem)]"
            />
          )}
          <ResizablePanel
            panelRef={panelRef}
            collapsible
            collapsedSize={80}
            defaultSize={80}
            minSize={368}
            onResize={({ inPixels }) => setBottomPanelHeight(inPixels)}
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
      {rightPanelVariant === 'variables' && (
        <CanvasTakeoverModal
          open={takeoverOpen}
          onOpenChange={setTakeoverOpen}
          title={VARIABLE_DEMO_NODES[selectedVariableNodeId]?.label ?? 'Node configuration'}
        >
          <div className="grid h-full min-h-0 grid-cols-2 divide-x divide-border-subtle overflow-hidden">
            <UnifiedVariablesPanel
              nodeId={selectedVariableNodeId}
              activeTab={variableDemoTab}
              onActiveTabChange={setVariableDemoTab}
              workflowVariables={editableWorkflowVariables}
              onWorkflowVariablesChange={setEditableWorkflowVariables}
              parameterValues={variableParameterValues}
              onParameterValueChange={(key, value) =>
                setVariableParameterValues((current) => ({ ...current, [key]: value }))
              }
              columnMode="parameters"
            />
            <UnifiedVariablesPanel
              nodeId={selectedVariableNodeId}
              activeTab={variableDemoTab}
              onActiveTabChange={setVariableDemoTab}
              workflowVariables={editableWorkflowVariables}
              onWorkflowVariablesChange={setEditableWorkflowVariables}
              parameterValues={variableParameterValues}
              onParameterValueChange={(key, value) =>
                setVariableParameterValues((current) => ({ ...current, [key]: value }))
              }
              columnMode="variables"
            />
          </div>
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
        sidebar={
          <div className="space-y-3 p-4 text-xs">
            <p className="font-semibold">Workflow outline</p>
            <p>1. Read Excel</p>
            <p>2. Analyze data</p>
            <p>3. Send summary</p>
          </div>
        }
        headerActions={<Button size="sm">Run test</Button>}
      >
        <div className="h-full min-h-[480px]">
          <CanvasViewport />
        </div>
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

export const WithDraggablePanels: Story = {
  name: 'w/ Panel Draggable',
  render: () => <DraggablePanelLayout />,
};

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
