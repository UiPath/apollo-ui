import MonacoEditor from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BaseCanvas } from '@uipath/apollo-react/canvas/components/BaseCanvas';
import {
  CanvasBottomPanel,
  type CanvasBottomPanelTab,
} from '@uipath/apollo-react/canvas/components/CanvasBottomPanel';
import {
  CANVAS_LEFT_SIDEBAR_DEFAULT_BOTTOM_ITEMS,
  CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS,
  CanvasLeftSidebar,
  type CanvasLeftSidebarItemId,
} from '@uipath/apollo-react/canvas/components/CanvasLeftSidebar';
import {
  CanvasModeToolbar,
  CountBadge,
  TOOLBAR_ICON_BUTTON_CLASS,
} from '@uipath/apollo-react/canvas/components/CanvasModeToolbar';
import { CanvasZoomControls } from '@uipath/apollo-react/canvas/components/CanvasZoomControls';
import { NodePropertyPanel } from '@uipath/apollo-react/canvas/components/NodePropertyPanel';
import { ToolbarButton } from '@uipath/apollo-react/canvas/components/ToolbarButton';
import {
  NodePropertyTrigger,
  type NodePropertyTriggerLayout,
} from '@uipath/apollo-react/canvas/controls/NodePropertyTrigger';
import { ValidationStatusContext } from '@uipath/apollo-react/canvas/hooks';
import {
  createNode,
  useCanvasStory,
  withCanvasProviders,
} from '@uipath/apollo-react/canvas/storybook-utils';
import { ValidationErrorSeverity } from '@uipath/apollo-react/canvas/types/validation';
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
  Badge,
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  DateTimePicker,
  FileUpload,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  LockableValueField,
  MultiSelect,
  type PanelImperativeHandle,
  RadioGroup,
  RadioGroupItem,
  RequiredIndicator,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollableTabsList,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
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
  Copy,
  Eye,
  EyeOff,
  FlaskConical,
  GripVertical,
  Link2,
  Mail,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Sparkles,
  StickyNote,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import {
  apolloCoreDarkHCMonaco,
  apolloCoreDarkMonaco,
  apolloCoreLightHCMonaco,
  apolloCoreLightMonaco,
  apolloFutureDarkMonaco,
  apolloFutureLightMonaco,
} from '../../../../packages/apollo-wind/src/editor-themes';
import { DapLayoutsPage } from './DapLayoutsPage';

const INVENTORY_TAB_LIST_CLASS =
  'h-auto justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0.5 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const INVENTORY_TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';
const UX_INVENTORY_CODE_SAMPLE = [
  '// Expression-backed configuration',
  'const invoice = await extractData({',
  '  file: $vars.invoiceFile,',
  "  fields: ['invoiceNumber', 'total', 'dueDate'],",
  '});',
  '',
  'return invoice;',
].join('\n');
const INVENTORY_EDITOR_THEMES = {
  'future-dark': apolloFutureDarkMonaco,
  'future-light': apolloFutureLightMonaco,
  dark: apolloCoreDarkMonaco,
  light: apolloCoreLightMonaco,
  'dark-hc': apolloCoreDarkHCMonaco,
  'light-hc': apolloCoreLightHCMonaco,
} as const;
const PROPOSED_FUTURE_LIGHT_TEAL_STYLE = {
  '--color-primary': '#0092b8',
  '--color-primary-hover': '#007595',
  '--color-primary-focused': '#007595',
  '--color-primary-lighter': '#b9f3fb',
  '--color-primary-pressed': '#00647d',
  '--color-primary-darker': '#00566f',
  '--color-primary-subtle': '#e0f7fa',
  '--brand': '#0092b8',
  '--brand-hover': '#007595',
  '--brand-lighter': '#b9f3fb',
  '--brand-darker': '#00566f',
  '--brand-subtle': '#e0f7fa',
  '--foreground-accent': '#0092b8',
  '--foreground-accent-muted': '#007595',
  '--primary': '#0092b8',
  '--ring': '#007595',
  '--color-background-overlay': '#ffffff',
  '--surface-overlay': '#ffffff',
  '--surface-hover': '#e4e4e7',
  '--surface-selected': '#e4e4e7',
  '--secondary': '#ffffff',
  '--muted': '#ffffff',
  '--popover': '#ffffff',
} as CSSProperties;
const PROPOSED_FUTURE_LIGHT_LAYOUT_STYLE = {
  ...PROPOSED_FUTURE_LIGHT_TEAL_STYLE,
  '--color-background': '#fafafa',
  '--color-background-raised': '#f4f4f5',
  '--color-background-hover': '#52525c14',
  '--color-background-selected': '#d4d4d8',
  '--color-background-gray-emp': '#9f9fa9',
  '--color-background-disabled': '#e4e4e7',
  '--color-foreground': '#09090b',
  '--color-foreground-emp': '#000000',
  '--color-foreground-de-emp': '#71717b',
  '--color-foreground-disable': '#9f9fa9',
  '--canvas-background': '#fafafa',
  '--canvas-background-secondary': '#fafafa',
  '--canvas-background-raised': '#f4f4f5',
  '--canvas-background-overlay': '#e4e4e7',
  '--canvas-background-hover': '#d4d4d8',
  '--canvas-primary': '#0092b8',
  '--canvas-primary-hover': '#007595',
  '--canvas-foreground': '#09090b',
  '--canvas-foreground-de-emp': '#71717b',
} as CSSProperties;
const PROPOSED_FUTURE_LIGHT_LAYOUT_CSS = Object.entries(PROPOSED_FUTURE_LIGHT_LAYOUT_STYLE)
  .map(([property, value]) => `            ${property}: ${String(value)} !important;`)
  .join('\n');

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
  const occupiedRight = Math.max(0, rightControlsOffset - 16);

  const fitWorkflow = useCallback(
    (duration: number) => {
      const container = viewportContainerRef.current;
      const nodes = getNodes();
      if (!container || nodes.length === 0) return;
      const bounds = getNodesBounds(nodes);
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
    [bottomControlsOffset, getNodes, getNodesBounds, occupiedRight, setViewport]
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

function ValidationTabLabel({
  label,
  count,
  inverseCount = false,
}: {
  label: string;
  count?: number;
  inverseCount?: boolean;
}) {
  if (!count) return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span
        title={`${count} issue${count === 1 ? '' : 's'}`}
        className={`grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-foreground-on-accent ${inverseCount ? 'text-white' : ''}`}
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
        {required && <RequiredIndicator />}
      </Label>
      <InputGroup className="h-9 bg-surface-overlay" error={error}>
        <InputGroupInput
          id={id}
          value={value}
          placeholder={placeholder}
          required={required}
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

            <section className="space-y-1.5">
              <Label htmlFor="dap-validation-connection" className="text-xs text-foreground">
                Connection
              </Label>
              <Select defaultValue="gmail-finance">
                <SelectTrigger
                  id="dap-validation-connection"
                  className="h-9 w-full bg-surface-overlay text-xs"
                >
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
                  Body <RequiredIndicator />
                </Label>
                <Textarea
                  id="dap-validation-body"
                  value={body}
                  required
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

const InventoryNotesVisibilityContext = createContext(true);

function InventoryCallout({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const notesVisible = useContext(InventoryNotesVisibilityContext);
  const linkTarget = `components/${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = `ux-inventory/${linkTarget}`;
    window.history.replaceState(null, '', url);
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  if (dismissed || !notesVisible) return null;

  return (
    <aside className="rounded-lg border border-border-subtle bg-surface-overlay p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
          {eyebrow}
        </p>
        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="4xs"
            icon
            onClick={copyLink}
            aria-label={copied ? `Copied link to ${title}` : `Copy link to ${title}`}
            title={copied ? 'Link copied' : 'Copy link'}
            className="text-foreground-subtle hover:bg-surface-raised hover:text-foreground"
          >
            <Link2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="4xs"
            icon
            onClick={() => setDismissed(true)}
            aria-label={`Dismiss ${title} note`}
            title="Dismiss note"
            className="text-foreground-subtle hover:bg-surface-raised hover:text-foreground"
          >
            <X size={12} />
          </Button>
        </div>
      </div>
      <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-4 text-foreground-muted">{children}</p>
    </aside>
  );
}

function FlowComponentInventory({ panelId }: { panelId: number }) {
  const activeTheme = useActiveStorybookTheme();
  const [fixedValue, setFixedValue] = useState('Invoice number');
  const [expressionValue, setExpressionValue] = useState('$vars.invoiceNumber');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2026, 8, 15));
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(
    new Date(2026, 8, 15, 9, 30)
  );
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['react']);
  const [, setFiles] = useState<File[]>([]);
  const editorThemeKey = activeTheme in INVENTORY_EDITOR_THEMES ? activeTheme : 'future-light';
  const editorThemeName = `apollo-inventory-${editorThemeKey}`;

  return (
    <div className="grid gap-4">
      <InventoryCallout eyebrow="Component" title="Inputs">
        Default, compact, disabled, and inline-validation variants used by Flow Workbench forms.
      </InventoryCallout>
      <div className="grid gap-2">
        <Label htmlFor={`ux-${panelId}-input-default`} className="text-xs">
          Default
        </Label>
        <Input id={`ux-${panelId}-input-default`} placeholder="Enter a value" />
        <Input id={`ux-${panelId}-input-compact`} size="xs" defaultValue="Compact value" />
        <Input id={`ux-${panelId}-input-disabled`} disabled placeholder="Disabled value" />
        <Input
          id={`ux-${panelId}-input-error`}
          defaultValue="Invalid value"
          error="Enter a valid value."
        />
      </div>

      <InventoryCallout eyebrow="Component" title="Lockable Value Field">
        Supports fixed and expression modes, lock state, required state, variables, validation, and
        String, Integer, Date, Boolean, select, File, and Object field types.
      </InventoryCallout>
      <div className="grid gap-4">
        <LockableValueField
          id={`ux-${panelId}-lockable-fixed`}
          label={<Label className="text-xs font-medium">Fixed value</Label>}
          value={fixedValue}
          onValueChange={setFixedValue}
          locked={false}
          fieldType="string"
          required
          showFieldActions={false}
        />
        <LockableValueField
          id={`ux-${panelId}-lockable-expression`}
          label={<Label className="text-xs font-medium">Expression</Label>}
          value={expressionValue}
          onValueChange={setExpressionValue}
          locked={false}
          mode="expression"
          fieldType="string"
          leadingAddon="="
          showFieldActions={false}
        />
      </div>

      <InventoryCallout eyebrow="Component" title="Combobox">
        Searchable single-select control for connections, activities, and other large option lists.
      </InventoryCallout>
      <Combobox
        items={[
          { label: 'Production connection', value: 'production' },
          { label: 'Finance connection', value: 'finance' },
          { label: 'Development connection', value: 'development' },
        ]}
        value="production"
        placeholder="Select a connection"
        searchPlaceholder="Search connections"
        className="w-full"
      />

      <InventoryCallout eyebrow="Component" title="Select and Multi-Select">
        Use Select for a short fixed list and Multi-Select when users can choose several values.
      </InventoryCallout>
      <div className="grid gap-3">
        <Select defaultValue="standard">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an execution mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="background">Background</SelectItem>
          </SelectContent>
        </Select>
        <MultiSelect
          options={[
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' },
            { label: 'Svelte', value: 'svelte' },
          ]}
          selected={selectedFrameworks}
          onChange={setSelectedFrameworks}
          placeholder="Select frameworks"
          className="w-full"
        />
      </div>

      <InventoryCallout eyebrow="Component" title="File Upload">
        Support single and multiple files, accepted file types, previews, disabled state, and
        per-file validation feedback.
      </InventoryCallout>
      <FileUpload onFilesChange={setFiles} multiple showPreview />

      <InventoryCallout eyebrow="Component" title="Date and Date-Time Pickers">
        Use date selection for deadlines and schedules, and date-time selection when execution time
        is part of the configuration.
      </InventoryCallout>
      <div className="grid gap-3">
        <DatePicker value={selectedDate} onValueChange={setSelectedDate} />
        <DateTimePicker value={selectedDateTime} onValueChange={setSelectedDateTime} />
        <DatePicker value={selectedDate} onValueChange={setSelectedDate} disabled />
      </div>

      <InventoryCallout eyebrow="Component" title="Textarea">
        Use multiline fields for prompts, instructions, scripts, and other longer free-form values.
      </InventoryCallout>
      <Textarea defaultValue="Overall extraction instructions..." rows={3} />

      <InventoryCallout eyebrow="Component" title="Switch and Toggle">
        Use switches for settings that take effect immediately or represent an on/off configuration.
      </InventoryCallout>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`ux-${panelId}-switch-enabled`} className="text-xs">
            Enable automatic retry
          </Label>
          <Switch id={`ux-${panelId}-switch-enabled`} size="sm" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`ux-${panelId}-switch-disabled`} className="text-xs">
            Disabled setting
          </Label>
          <Switch id={`ux-${panelId}-switch-disabled`} size="sm" disabled />
        </div>
      </div>

      <InventoryCallout eyebrow="Component" title="Radio">
        Use radio groups when the user must choose exactly one visible option.
      </InventoryCallout>
      <RadioGroup defaultValue="automatic" className="grid gap-2">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="automatic" id={`ux-${panelId}-radio-automatic`} />
          <Label htmlFor={`ux-${panelId}-radio-automatic`} className="text-xs">
            Automatic
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="manual" id={`ux-${panelId}-radio-manual`} />
          <Label htmlFor={`ux-${panelId}-radio-manual`} className="text-xs">
            Manual
          </Label>
        </div>
      </RadioGroup>

      <InventoryCallout eyebrow="Component" title="Checkbox">
        Use checkboxes for independent settings and opt-in behavior.
      </InventoryCallout>
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id={`ux-${panelId}-checkbox-enabled`} defaultChecked />
          <Label htmlFor={`ux-${panelId}-checkbox-enabled`} className="text-xs">
            Enabled
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={`ux-${panelId}-checkbox-disabled`} disabled />
          <Label htmlFor={`ux-${panelId}-checkbox-disabled`} className="text-xs">
            Disabled
          </Label>
        </div>
      </div>

      <InventoryCallout eyebrow="Component" title="Button types">
        Primary, secondary, outline, tertiary, destructive, and link actions cover the Flow
        Workbench hierarchy.
      </InventoryCallout>
      <div className="flex flex-wrap gap-2">
        <Button size="xs" className={panelId === 1 ? 'future:!text-white' : undefined}>
          Primary
        </Button>
        <Button size="xs" variant="secondary">
          Secondary
        </Button>
        <Button size="xs" variant="outline">
          Outline
        </Button>
        <Button size="xs" variant="ghost">
          Tertiary
        </Button>
        <Button size="xs" variant="destructive">
          Delete
        </Button>
        <Button
          size="3xs"
          variant="link"
          className={
            panelId === 1 ? 'future:!text-brand future:hover:!text-brand-hover' : undefined
          }
        >
          Add field
        </Button>
      </div>

      <InventoryCallout eyebrow="Component" title="Code Editor">
        Use a code editor for scripts and multi-line expressions when syntax highlighting, line
        numbers, and a larger authoring surface are valuable.
      </InventoryCallout>
      <div
        className={
          panelId === 1 && editorThemeKey === 'future-light'
            ? 'ux-inventory-proposed-editor overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay'
            : 'overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay'
        }
      >
        {panelId === 1 && editorThemeKey === 'future-light' && (
          <style>{`
            .ux-inventory-proposed-editor .monaco-editor {
              --vscode-editor-background: #ffffff !important;
              --vscode-editor-foreground: #3f3f46 !important;
              --vscode-editorGutter-background: #ffffff !important;
              --vscode-editorLineNumber-foreground: #71717a !important;
              --vscode-editorLineNumber-activeForeground: #52525b !important;
              --vscode-editor-selectionBackground: #d4d4d866 !important;
              --vscode-editor-lineHighlightBackground: #f4f4f580 !important;
              --vscode-editorCursor-foreground: #007595 !important;
              --vscode-editorWhitespace-foreground: #a1a1aa !important;
              --vscode-editorIndentGuide-background1: #f4f4f5 !important;
              --vscode-editorIndentGuide-activeBackground1: #d4d4d8 !important;
              --vscode-editorBracketMatch-background: #0075951a !important;
              --vscode-editorBracketMatch-border: #007595 !important;
              --vscode-focusBorder: #007595 !important;
            }
            .ux-inventory-proposed-editor .monaco-editor .mtk1 {
              color: #3f3f46 !important;
            }
            .ux-inventory-proposed-editor .monaco-editor .mtk3 {
              color: #007595 !important;
            }
            .ux-inventory-proposed-editor .monaco-editor .mtk6 {
              color: #71717a !important;
            }
            .ux-inventory-proposed-editor .monaco-editor .mtk7 {
              color: #52525b !important;
            }
          `}</style>
        )}
        <MonacoEditor
          height="220px"
          defaultLanguage="typescript"
          defaultValue={UX_INVENTORY_CODE_SAMPLE}
          theme={editorThemeName}
          beforeMount={(monaco) => {
            Object.entries(INVENTORY_EDITOR_THEMES).forEach(([themeKey, themeConfig]) => {
              monaco.editor.defineTheme(`apollo-inventory-${themeKey}`, themeConfig);
            });
          }}
          options={{
            fontSize: 12,
            lineHeight: 18,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}

function UXInventoryPanel({ onClose, panelId = 0 }: { onClose: () => void; panelId?: number }) {
  const [notesVisible, setNotesVisible] = useState(true);
  const [compositionEditor, setCompositionEditor] = useState<'ui' | 'json'>('ui');
  const [compositionFields, setCompositionFields] = useState([
    'Invoice number',
    'Invoice total',
    'Invoice date',
  ]);
  const [draggedCompositionField, setDraggedCompositionField] = useState<string | null>(null);
  const [dragOverCompositionField, setDragOverCompositionField] = useState<string | null>(null);

  return (
    <NodePropertyPanel
      panelTitle="UX Inventory"
      nodeIcon={<Sparkles />}
      nodeLabel={panelId === 0 ? 'Current Theme' : 'Proposed Theme'}
      nodeCategory={panelId === 0 ? 'Current system' : 'Proposed improvements'}
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <InventoryNotesVisibilityContext.Provider value={notesVisible}>
        <Tabs defaultValue="components" className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3.5 py-3">
            <ScrollableTabsList
              className={`${INVENTORY_TAB_LIST_CLASS} min-w-0 flex-1`}
              scrollButtonClassName="size-6 hover:bg-surface-overlay"
            >
              <TabsTrigger value="components" className={INVENTORY_TAB_TRIGGER_CLASS}>
                Components
              </TabsTrigger>
              <TabsTrigger value="layout" className={INVENTORY_TAB_TRIGGER_CLASS}>
                Layout
              </TabsTrigger>
              <TabsTrigger value="states" className={INVENTORY_TAB_TRIGGER_CLASS}>
                States
              </TabsTrigger>
              <TabsTrigger value="actions" className={INVENTORY_TAB_TRIGGER_CLASS}>
                Actions
              </TabsTrigger>
              <TabsTrigger value="composition" className={INVENTORY_TAB_TRIGGER_CLASS}>
                Composition
              </TabsTrigger>
            </ScrollableTabsList>
            <Button
              variant="ghost"
              size="4xs"
              icon
              onClick={() => setNotesVisible((visible) => !visible)}
              aria-label={notesVisible ? 'Hide notes' : 'Show notes'}
              title={notesVisible ? 'Hide notes' : 'Show notes'}
              className="shrink-0 text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
            >
              {notesVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            </Button>
          </div>

          <TabsContent value="components" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
            <FlowComponentInventory panelId={panelId} />
          </TabsContent>

          <TabsContent value="layout" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              <InventoryCallout eyebrow="Layout pattern" title="Panel anatomy">
                Use a title bar, identity row, navigation tabs, scrollable content, and an optional
                footer. Keep the primary action close to the node identity.
              </InventoryCallout>
              <InventoryCallout eyebrow="Layout pattern" title="Flat content">
                Use always-visible fields for short configurations that do not need grouping or
                nested container chrome.
              </InventoryCallout>
              <div className="grid gap-3 rounded-xl border border-border-subtle p-3">
                <div className="grid gap-2">
                  <Label htmlFor={`ux-${panelId}-layout-name`} className="text-xs">
                    Name
                  </Label>
                  <Input id={`ux-${panelId}-layout-name`} defaultValue="Extract invoice data" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`ux-${panelId}-layout-connection`} className="text-xs">
                    Connection
                  </Label>
                  <Select defaultValue="production">
                    <SelectTrigger id={`ux-${panelId}-layout-connection`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={`ux-${panelId}-layout-enabled`} className="text-xs">
                      Enabled
                    </Label>
                    <p className="text-[11px] text-foreground-muted">
                      Run this node in the workflow.
                    </p>
                  </div>
                  <Switch id={`ux-${panelId}-layout-enabled`} size="sm" defaultChecked />
                </div>
              </div>
              <InventoryCallout eyebrow="Layout pattern" title="Expandable sections">
                Group related settings behind a full-width section header when the panel contains
                multiple configuration areas.
              </InventoryCallout>
              <div className="grid gap-2 rounded-xl border border-border-subtle">
                {['Text and numeric fields', 'Selection controls', 'Advanced options'].map(
                  (section, index) => (
                    <details
                      key={section}
                      open={index === 0}
                      className="group border-b border-border-subtle last:border-b-0"
                    >
                      <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-foreground">
                        {section}
                      </summary>
                      {index === 0 && (
                        <div className="grid gap-3 px-3 pb-3">
                          <Textarea
                            defaultValue="Extract structured fields from incoming invoices."
                            rows={2}
                          />
                          <Input type="number" defaultValue="3" min="0" />
                          <Input value="Generated by the system" readOnly />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="grid gap-3 px-3 pb-3">
                          <RadioGroup defaultValue="automatic" className="grid gap-2">
                            <Label className="flex items-center gap-2 text-xs">
                              <RadioGroupItem value="automatic" /> Automatic
                            </Label>
                            <Label className="flex items-center gap-2 text-xs">
                              <RadioGroupItem value="manual" /> Manual review
                            </Label>
                          </RadioGroup>
                          <Slider defaultValue={[75]} max={100} step={5} />
                        </div>
                      )}
                    </details>
                  )
                )}
              </div>
              <InventoryCallout eyebrow="Layout pattern" title="Sub-containers">
                Use bordered cards for dense groups, repeatable settings, and related controls that
                need stronger visual separation.
              </InventoryCallout>
              <div className="grid gap-2 rounded-xl border border-border-subtle p-3">
                <p className="text-xs font-semibold text-foreground">Panel controls</p>
                <div className="flex flex-wrap gap-2">
                  <Button className={panelId === 1 ? 'future:!text-white' : undefined}>
                    Primary action
                  </Button>
                  <Button variant="outline">Secondary</Button>
                  <Button variant="ghost">Tertiary</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="states" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              <InventoryCallout eyebrow="State pattern" title="Section messages">
                Persistent guidance, success, warning, and error messages summarize panel-level
                results and explain the next action.
              </InventoryCallout>
              <Alert>
                <AlertCircle />
                <AlertTitle>Configuration guidance</AlertTitle>
                <AlertDescription>
                  Use a connection selected for the current folder.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Connection required</AlertTitle>
                <AlertDescription>Select a connection before running this node.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <AlertCircle />
                <AlertTitle>Configuration is valid</AlertTitle>
                <AlertDescription>All required fields have been completed.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertCircle />
                <AlertTitle>Review recommended</AlertTitle>
                <AlertDescription>The request timeout is higher than recommended.</AlertDescription>
              </Alert>
              <InventoryCallout eyebrow="State pattern" title="Navigation validation">
                Error counts on tabs reveal unresolved issues in sections that are not currently
                visible.
              </InventoryCallout>
              <Tabs defaultValue="parameters">
                <ScrollableTabsList
                  className={`${INVENTORY_TAB_LIST_CLASS} w-full`}
                  scrollButtonClassName="size-6 hover:bg-surface-overlay"
                >
                  <TabsTrigger value="parameters" className={INVENTORY_TAB_TRIGGER_CLASS}>
                    <ValidationTabLabel label="Parameters" count={1} inverseCount={panelId === 1} />
                  </TabsTrigger>
                  <TabsTrigger value="error-handling" className={INVENTORY_TAB_TRIGGER_CLASS}>
                    <ValidationTabLabel
                      label="Error handling"
                      count={2}
                      inverseCount={panelId === 1}
                    />
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className={INVENTORY_TAB_TRIGGER_CLASS}>
                    Advanced
                  </TabsTrigger>
                </ScrollableTabsList>
              </Tabs>
              <InventoryCallout eyebrow="State pattern" title="Inline validation">
                Keep field-specific feedback beside the control, with a clear explanation and
                resolution.
              </InventoryCallout>
              <div className="grid gap-1.5">
                <Label htmlFor="ux-inventory-invalid" className="text-xs">
                  Field with validation
                </Label>
                <Input
                  id="ux-inventory-invalid"
                  defaultValue="Existing node"
                  error="This value is already in use."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={panelId === 1 ? 'future:!text-white' : undefined}>Default</Badge>
                <Badge variant="secondary">Optional</Badge>
                <Badge variant="outline">Read only</Badge>
              </div>
              <InventoryCallout eyebrow="State pattern" title="Transient feedback">
                Toasts confirm completed actions without interrupting the current configuration
                task.
              </InventoryCallout>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline">Info</Button>
                <Button variant="outline">Success</Button>
                <Button variant="outline">Warning</Button>
                <Button variant="outline">Error</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              <InventoryCallout eyebrow="Action pattern" title="Button hierarchy">
                Use one primary action per context, with secondary, tertiary, and destructive styles
                reflecting emphasis and consequence.
              </InventoryCallout>
              <div className="flex flex-wrap gap-2">
                <Button className={panelId === 1 ? 'future:!text-white' : undefined}>
                  Primary
                </Button>
                <Button variant="outline">Secondary</Button>
                <Button variant="ghost">Tertiary</Button>
                <Button variant="destructive">Delete</Button>
              </div>
              <InventoryCallout eyebrow="Action pattern" title="Header actions">
                Reserve the panel header for high-frequency node commands such as running or
                debugging, and keep the set small.
              </InventoryCallout>
              <div className="flex flex-wrap gap-2">
                <Button className={panelId === 1 ? 'future:!text-white' : undefined}>Run</Button>
                <Button variant="outline">Debug</Button>
              </div>
              <InventoryCallout eyebrow="Action pattern" title="Manage">
                Use Manage when the action opens a separate configuration surface for the field or
                section it affects.
              </InventoryCallout>
              <div className="flex flex-wrap items-center">
                <Button size="sm" variant="secondary">
                  Manage
                </Button>
              </div>
              <InventoryCallout eyebrow="Action pattern" title="Add">
                Use a lightweight plus link when adding another item to a repeatable list. Keep it
                separate from Manage so the two intents are easy to scan.
              </InventoryCallout>
              <div className="flex flex-wrap items-center">
                <Button
                  size="2xs"
                  variant="link"
                  className={
                    panelId === 1 ? 'future:!text-brand future:hover:!text-brand-hover' : undefined
                  }
                >
                  + Add field
                </Button>
              </div>
              <InventoryCallout eyebrow="Action pattern" title="Footer actions">
                Place panel-level actions at the end of the content, with cancel before the primary
                save action.
              </InventoryCallout>
              <div className="flex justify-end gap-2 border-t border-border-subtle pt-3">
                <Button variant="ghost">Cancel</Button>
                <Button className={panelId === 1 ? 'future:!text-white' : undefined}>
                  Save changes
                </Button>
              </div>
              <InventoryCallout eyebrow="Action pattern" title="Icon-only utilities">
                Use compact icon actions for familiar utilities when space is limited. Always
                provide a tooltip and accessible name.
              </InventoryCallout>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="4xs" icon aria-label="Refresh data">
                  <RefreshCw size={14} />
                </Button>
                <Button variant="ghost" size="4xs" icon aria-label="Duplicate node">
                  <Copy size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="4xs"
                  icon
                  aria-label="Delete node"
                  className="text-error hover:text-error"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="composition" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              <InventoryCallout eyebrow="Composition pattern" title="Repeatable field list">
                Provide reorder, add, and remove controls when users build a variable-length set of
                related fields.
              </InventoryCallout>
              <div className="grid gap-2">
                {compositionFields.map((field, index) => (
                  <li
                    key={field}
                    aria-label={`Drag ${field} to reorder`}
                    draggable
                    onDragStart={() => setDraggedCompositionField(field)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedCompositionField !== field) {
                        setDragOverCompositionField(field);
                      }
                    }}
                    onDrop={() => {
                      if (!draggedCompositionField || draggedCompositionField === field) return;
                      setCompositionFields((fields) => {
                        const nextFields = [...fields];
                        const fromIndex = nextFields.indexOf(draggedCompositionField);
                        const toIndex = nextFields.indexOf(field);
                        nextFields.splice(fromIndex, 1);
                        nextFields.splice(toIndex, 0, draggedCompositionField);
                        return nextFields;
                      });
                      setDraggedCompositionField(null);
                      setDragOverCompositionField(null);
                    }}
                    onDragLeave={() => setDragOverCompositionField(null)}
                    onDragEnd={() => {
                      setDraggedCompositionField(null);
                      setDragOverCompositionField(null);
                    }}
                    className={`group/field flex items-center gap-1 rounded-lg border border-border-subtle p-2 transition-colors hover:bg-accent ${
                      draggedCompositionField === field ? 'opacity-50' : ''
                    } ${
                      dragOverCompositionField === field ? 'bg-accent ring-2 ring-brand/30' : ''
                    }`}
                  >
                    <GripVertical
                      className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover/field:opacity-50 active:cursor-grabbing"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-xs text-foreground">{field}</span>
                    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover/field:opacity-100">
                      <Button
                        variant="ghost"
                        size="4xs"
                        icon
                        aria-label={`Move ${field} up`}
                        disabled={index === 0}
                      >
                        <ChevronUp size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="4xs"
                        icon
                        aria-label={`Move ${field} down`}
                        disabled={index === 2}
                      >
                        <ChevronDown size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="4xs"
                        icon
                        aria-label={`Remove ${field}`}
                        onClick={() =>
                          setCompositionFields((fields) => fields.filter((item) => item !== field))
                        }
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </li>
                ))}
                <Button
                  variant="link"
                  size="2xs"
                  className={`w-fit px-0 ${panelId === 1 ? 'future:!text-brand future:hover:!text-brand-hover' : ''}`}
                >
                  <Plus size={12} /> Add field
                </Button>
              </div>
              <InventoryCallout eyebrow="Composition pattern" title="Editing modes">
                Let users switch between a guided interface and a source representation without
                changing the underlying configuration.
              </InventoryCallout>
              <div className="grid gap-2">
                <div className="flex gap-1">
                  <Button
                    size="2xs"
                    variant={compositionEditor === 'ui' ? 'secondary' : 'ghost'}
                    onClick={() => setCompositionEditor('ui')}
                  >
                    UI
                  </Button>
                  <Button
                    size="2xs"
                    variant={compositionEditor === 'json' ? 'secondary' : 'ghost'}
                    onClick={() => setCompositionEditor('json')}
                  >
                    JSON
                  </Button>
                </div>
                {compositionEditor === 'ui' ? (
                  <Input defaultValue="Quick approve" aria-label="Form title" />
                ) : (
                  <Textarea
                    aria-label="JSON configuration"
                    defaultValue={'{\n  "title": "Quick approve"\n}'}
                    rows={4}
                    className="font-mono text-xs"
                  />
                )}
              </div>
              <InventoryCallout eyebrow="Composition pattern" title="Lockable value field">
                Combine field type, required state, variable insertion, and fixed or expression
                values in one reusable Flow control.
              </InventoryCallout>
              <LockableValueField
                id={`ux-${panelId}-composition-value`}
                label={<Label className="text-xs font-medium">Invoice value</Label>}
                value="${vars.invoiceNumber}"
                onValueChange={() => undefined}
                locked={false}
                mode="expression"
                fieldType="string"
                leadingAddon="="
                showFieldActions={false}
              />
              <InventoryCallout eyebrow="Composition pattern" title="Responsive panel">
                Preserve the same hierarchy when the panel is narrow: keep tabs scrollable, content
                inset consistent, and actions reachable.
              </InventoryCallout>
              <div className="max-w-[280px] rounded-lg border border-border-subtle bg-surface p-2">
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-1 border-b border-border-subtle pb-1">
                    {['Fields', 'Rules', 'Advanced'].map((tab, index) => (
                      <Button
                        key={tab}
                        size="4xs"
                        variant={index === 0 ? 'secondary' : 'ghost'}
                        className="shrink-0"
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 p-2">
                  <Input defaultValue="Invoice fields" aria-label="Responsive panel example" />
                  <div className="flex items-center justify-end gap-1">
                    <Button size="4xs" variant="ghost">
                      Cancel
                    </Button>
                    <Button size="4xs" variant="primary">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
              <InventoryCallout eyebrow="Composition pattern" title="Empty and loading states">
                Explain why content is unavailable and provide the next useful action. Avoid blank
                panels and ambiguous spinners.
              </InventoryCallout>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid min-h-24 place-items-center rounded-lg border border-border-subtle bg-surface p-3 text-center">
                  <div>
                    <p className="text-xs font-medium text-foreground">No fields yet</p>
                    <p className="mt-1 text-[11px] text-foreground-muted">
                      Add a field to start configuring this section.
                    </p>
                    <Button
                      size="4xs"
                      variant="link"
                      className={`mt-2 px-0 ${panelId === 1 ? 'future:!text-brand future:hover:!text-brand-hover' : ''}`}
                    >
                      <Plus size={12} /> Add field
                    </Button>
                  </div>
                </div>
                <div className="grid min-h-24 place-items-center rounded-lg border border-border-subtle bg-surface p-3 text-center">
                  <div>
                    <RefreshCw className="mx-auto size-4 animate-spin text-foreground-subtle" />
                    <p className="mt-2 text-xs font-medium text-foreground">Loading fields</p>
                    <p className="mt-1 text-[11px] text-foreground-muted">Please wait…</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </InventoryNotesVisibilityContext.Provider>
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

function PatternWorkbench({ panel }: { panel: (onClose: () => void) => ReactNode }) {
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
              {panel(() => setRightPanelOpen(false))}
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

function ErrorAndValidationWorkbench() {
  return <PatternWorkbench panel={(onClose) => <DapValidationPanel onClose={onClose} />} />;
}

function useActiveStorybookTheme() {
  const [theme, setTheme] = useState('');

  useEffect(() => {
    const updateTheme = () => {
      const activeTheme = Array.from(document.body.classList).find((className) =>
        ['future-light', 'future-dark', 'light', 'dark', 'light-hc', 'dark-hc'].includes(className)
      );
      setTheme(activeTheme ?? '');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function UXInventoryWorkbench() {
  const activeTheme = useActiveStorybookTheme();

  return (
    <div className="flex min-h-screen items-start justify-center gap-8 overflow-auto bg-surface p-8">
      {[0, 1].map((panel) => (
        <div
          key={panel}
          className="h-[calc(100vh-4rem)] min-h-[600px] w-[380px] shrink-0 overflow-hidden rounded-2xl border border-border-subtle shadow-lg"
          style={
            panel === 1 && activeTheme === 'future-light'
              ? PROPOSED_FUTURE_LIGHT_TEAL_STYLE
              : undefined
          }
        >
          <UXInventoryPanel panelId={panel} onClose={() => undefined} />
        </div>
      ))}
    </div>
  );
}

function UXInventoryLayoutWorkbench() {
  const activeTheme = useActiveStorybookTheme();

  return (
    <div
      className="ux-inventory-layout-proposed"
      style={activeTheme === 'future-light' ? PROPOSED_FUTURE_LIGHT_LAYOUT_STYLE : undefined}
    >
      {activeTheme === 'future-light' && (
        <style>{`
          .ux-inventory-layout-proposed,
          .ux-inventory-layout-proposed * {
${PROPOSED_FUTURE_LIGHT_LAYOUT_CSS}
          }
          .ux-inventory-layout-proposed .react-flow {
            --canvas-background: #fafafa !important;
            --canvas-background-secondary: #fafafa !important;
            --canvas-background-raised: #ffffff !important;
            --canvas-background-overlay: #ffffff !important;
            --canvas-background-hover: #e4e4e7 !important;
            --canvas-primary: #0092b8 !important;
            --canvas-primary-hover: #007595 !important;
            --canvas-foreground: #09090b !important;
            --canvas-foreground-de-emp: #71717a !important;
          }
        `}</style>
      )}
      <FullWorkbenchComposition rightPanelVariant="dap" />
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

export const UXInventory: Story = {
  name: 'UX Inventory',
  render: () => <UXInventoryWorkbench />,
};

export const UXInventoryLayout: Story = {
  name: 'UX Inventory layout',
  render: () => <UXInventoryLayoutWorkbench />,
};

export const ErrorAndValidation: Story = {
  name: 'UX Error and Validation',
  render: () => <ErrorAndValidationWorkbench />,
};

export const DapSendEmail: Story = {
  name: 'UX DAP - Send email',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const DapAlignment: Story = {
  name: 'UX DAP - Alignment',
  render: () => <DapLayoutsPage />,
};
