import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type Edge,
  type Node,
  useNodesInitialized,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  type PanelImperativeHandle,
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
} from '@uipath/apollo-wind';
import {
  AlertCircle,
  AtSign,
  Bug,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Mail,
  Play,
  Plus,
  Redo2,
  Sparkles,
  StickyNote,
  Undo2,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseCanvas } from '../../../../packages/apollo-react/src/canvas/components/BaseCanvas';
import {
  CanvasBottomPanel,
  type CanvasBottomPanelTab,
} from '../../../../packages/apollo-react/src/canvas/components/CanvasBottomPanel';
import {
  CANVAS_LEFT_SIDEBAR_DEFAULT_BOTTOM_ITEMS,
  CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS,
  CanvasLeftSidebar,
  type CanvasLeftSidebarItemId,
} from '../../../../packages/apollo-react/src/canvas/components/CanvasLeftSidebar';
import {
  CanvasModeToolbar,
  CountBadge,
  TOOLBAR_ICON_BUTTON_CLASS,
} from '../../../../packages/apollo-react/src/canvas/components/CanvasModeToolbar';
import { CanvasZoomControls } from '../../../../packages/apollo-react/src/canvas/components/CanvasZoomControls';
import { NodePropertyPanel } from '../../../../packages/apollo-react/src/canvas/components/NodePropertyPanel';
import { ToolbarButton } from '../../../../packages/apollo-react/src/canvas/components/ToolbarButton';
import {
  NodePropertyTrigger,
  type NodePropertyTriggerLayout,
} from '../../../../packages/apollo-react/src/canvas/controls/NodePropertyTrigger';
import { ValidationStatusContext } from '../../../../packages/apollo-react/src/canvas/hooks';
import {
  createNode,
  useCanvasStory,
  withCanvasProviders,
} from '../../../../packages/apollo-react/src/canvas/storybook-utils';
import { ValidationErrorSeverity } from '../../../../packages/apollo-react/src/canvas/types/validation';

const ALL_SIDEBAR_ITEMS = [
  ...CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS,
  ...CANVAS_LEFT_SIDEBAR_DEFAULT_BOTTOM_ITEMS,
];

const withErrorDot = (icon: ReactNode) => (
  <span className="relative grid size-5 place-items-center">
    {icon}
    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-error ring-2 ring-surface-raised" />
  </span>
);

const VALIDATION_SIDEBAR_ITEMS = CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS.map((item) =>
  item.id === 'variables' ? { ...item, icon: withErrorDot(item.icon) } : item
);

function createValidationFlowGraph(): { nodes: Node[]; edges: Edge[] } {
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
      position: { x: 340, y: 200 },
      display: { label: 'Extract invoice details', subLabel: 'Document understanding' },
    }),
    createNode({
      id: 'approver',
      type: 'uipath.blank-node',
      position: { x: 600, y: 200 },
      display: { label: 'Get approver', subLabel: 'Directory lookup' },
    }),
    createNode({
      id: 'email',
      type: 'uipath.blank-node',
      position: { x: 860, y: 200 },
      selected: true,
      display: { label: 'Send email', subLabel: 'Gmail' },
    }),
  ];
  return {
    nodes,
    edges: [
      ['trigger', 'extract'],
      ['extract', 'approver'],
      ['approver', 'email'],
    ].map(([source, target]) => ({
      id: `e-${source}-${target}`,
      source,
      target,
      sourceHandle: 'output',
      targetHandle: 'input',
    })),
  };
}

function FlowCanvas() {
  const graph = useMemo(() => createValidationFlowGraph(), []);
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
      onPropertiesClick={onPropertiesClick ?? (() => onPanelToggle?.('properties', true))}
    />
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
  bottomControlsOffset = 20,
  rightControlsOffset = 16,
}: {
  trigger?: ReactNode;
  bottomControlsOffset?: number;
  rightControlsOffset?: number;
}) {
  const { getNodes, getNodesBounds, setEdges, setNodes, setViewport } = useReactFlow();
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
    const graph = createValidationFlowGraph();
    setNodes(graph.nodes);
    setEdges(graph.edges);
    window.setTimeout(() => fitWorkflow(200), 100);
  }, [fitWorkflow, setEdges, setNodes]);

  return (
    <div ref={viewportContainerRef} className="relative h-full min-h-0 min-w-0 overflow-hidden">
      <FlowCanvas />
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

function ValidationTabLabel({ label, count }: { label: string; count?: number }) {
  if (!count) return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span
        title={`${count} issue${count === 1 ? '' : 's'}`}
        className="grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-foreground-on-accent"
      >
        <span aria-hidden="true">{count}</span>
        <span className="sr-only">{`${count} issue${count === 1 ? '' : 's'}`}</span>
      </span>
    </span>
  );
}

function DapValueField({
  id,
  label,
  value,
  placeholder,
  required,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  error?: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-error"> *</span>}
      </Label>
      <InputGroup className="h-9 bg-surface-overlay" error={error}>
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
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function DapValidationPanel({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('Invoice approval required');
  const [recipient, setRecipient] = useState('');
  const [body, setBody] = useState(
    'Hi $vars.approverName,\n\nPlease review invoice $vars.invoiceNumber.'
  );
  const [errorHandlingEnabled, setErrorHandlingEnabled] = useState(true);
  const [retryCount, setRetryCount] = useState('8');

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
        <TabsList className="mx-3 h-auto justify-start gap-0.5 rounded-lg bg-transparent p-0.5">
          <TabsTrigger value="parameters" className="h-6 px-2.5 text-xs">
            <ValidationTabLabel label="Parameters" count={1} />
          </TabsTrigger>
          <TabsTrigger value="error-handling" className="h-6 px-2.5 text-xs">
            <ValidationTabLabel label="Error handling" count={1} />
          </TabsTrigger>
          <TabsTrigger value="variables" className="h-6 px-2.5 text-xs">
            Variables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-5">
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Resolve 2 issues before running this node</AlertTitle>
              <AlertDescription>
                Fix the highlighted fields in Parameters and Error handling before you run or
                publish this workflow.
              </AlertDescription>
            </Alert>

            <section className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Connection</p>
              <Select defaultValue="gmail-finance">
                <SelectTrigger className="h-9 w-full bg-surface-overlay text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail-finance">Gmail · Finance operations</SelectItem>
                  <SelectItem value="gmail-personal">Gmail · Personal</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <Separator />

            <section className="space-y-4">
              <p className="text-xs font-semibold text-foreground">Message</p>
              <DapValueField
                id="dap-validation-recipient"
                label="To"
                value={recipient}
                placeholder="Recipient email address"
                required
                error="This field is required. Enter a recipient or bind a variable."
                onChange={setRecipient}
              />
              <DapValueField
                id="dap-validation-subject"
                label="Subject"
                value={subject}
                placeholder="The subject of the email"
                required
                onChange={setSubject}
              />
              <div className="space-y-1.5">
                <Label htmlFor="dap-validation-body" className="text-xs">
                  Body <span className="text-error">*</span>
                </Label>
                <Textarea
                  id="dap-validation-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="min-h-24 resize-none bg-surface-overlay text-xs"
                />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="error-handling" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="dap-validation-error-handling" className="text-xs">
                  Enable error handling
                </Label>
                <p className="text-xs text-foreground-muted">
                  Add an error output handle on the node to catch and handle failures.
                </p>
              </div>
              <Switch
                id="dap-validation-error-handling"
                checked={errorHandlingEnabled}
                onCheckedChange={setErrorHandlingEnabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dap-validation-retry-count" className="text-xs">
                Retry count
              </Label>
              <Input
                id="dap-validation-retry-count"
                value={retryCount}
                onChange={(event) => setRetryCount(event.target.value)}
                error="Retry count must be between 0 and 5."
                className="bg-surface-overlay text-xs"
              />
            </div>
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
              ['$output.messageId', 'Text · Output'],
            ].map(([name, metadata]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-overlay px-3 py-2.5"
              >
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

function DebugPanelContent() {
  return (
    <div className="grid h-full grid-cols-[220px_1fr]">
      <div className="border-r border-border-subtle p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">Run history</p>
        <div className="rounded-lg bg-surface-overlay p-3">
          <span className="block text-xs font-medium text-foreground">Flow run</span>
          <span className="mt-1 block text-[11px] text-foreground-muted">Failed after 1.8s</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-error" /> Execution failed
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

function ErrorAndValidationWorkbench() {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const expandedBottomPanelHeight = useRef(368);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTabId, setActiveTabId] = useState('execution');
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(80);

  const tabs: CanvasBottomPanelTab[] = [
    {
      id: 'execution',
      label: (
        <>
          <Bug className="size-3" /> <ValidationTabLabel label="Executions" count={2} />
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
  const activeSidebarLabel =
    ALL_SIDEBAR_ITEMS.find((item) => item.id === activeSidebarItem)?.label ?? '';

  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title={activeSidebarLabel}
        variant="default"
        primaryItems={VALIDATION_SIDEBAR_ITEMS}
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeItemId={activeSidebarItem}
        onItemSelect={setActiveSidebarItem}
      >
        <div className="py-6 text-center text-xs text-foreground-muted">
          {activeSidebarLabel} content
        </div>
      </CanvasLeftSidebar>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <ValidationStatusContext.Provider
          value={{
            getElementValidationState: (elementId) =>
              elementId === 'email'
                ? {
                    validationStatus: ValidationErrorSeverity.ERROR,
                    validationError: {
                      code: 'MISSING_REQUIRED_FIELDS',
                      message: 'Resolve 2 issues before running this node.',
                      description: 'Resolve 2 issues before running this node.',
                      severity: ValidationErrorSeverity.ERROR,
                    },
                  }
                : undefined,
          }}
        >
          <CanvasViewport
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
          />
        </ValidationStatusContext.Provider>

        {rightPanelOpen && (
          <div
            className="absolute right-0 top-0 z-20 p-4 pl-0"
            style={{ bottom: bottomPanelHeight - 12 }}
          >
            <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
              <DapValidationPanel onClose={() => setRightPanelOpen(false)} />
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
    </div>
  );
}

const meta = {
  title: 'Apollo Wind/Patterns/Layout Patterns',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorAndValidation: Story = {
  name: 'UX Error and Validation',
  render: () => <ErrorAndValidationWorkbench />,
};
