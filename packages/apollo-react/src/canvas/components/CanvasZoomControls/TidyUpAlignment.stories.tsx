import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  Edge,
  EdgeTypes,
  Node,
  NodeMouseHandler,
  OnSelectionChangeFunc,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  NodeToolbar,
  Panel,
  Position,
  useNodesInitialized,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Badge,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from '@uipath/apollo-wind';
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceAround,
  BrushCleaning,
} from 'lucide-react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import {
  ALIGN_ANIMATION_MS,
  type AlignmentType,
  alignNodes,
  animateNodes,
  applyWaypoints,
  type DistributionDirection,
  distributeNodes,
  FLOW_WORKBENCH_LAYOUT_SOURCE,
  type LayoutResult,
  type ProposedLayout,
  subtleAlignNodes,
  TIDY_ANIMATION_MS,
  tidyAll,
  tidyProposed,
  tidySelected,
} from '../../storybook-utils/flow-workbench-layout/flow-workbench-layout';
import { CanvasIcon } from '../../utils/icon-registry';
import type { AlignmentPositionUpdate } from '../AlignmentGuides';
import { AlignmentGuidesOverlay, useAlignmentGuides } from '../AlignmentGuides';
import { BaseCanvas } from '../BaseCanvas';
import { BaseNodeOverrideConfigProvider } from '../BaseNode';
import { CanvasEdge } from '../Edges';
import type { NodeToolbarConfig } from '../Toolbar';
import { ToolbarButton, ToolbarIconButton } from '../Toolbar';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

const meta: Meta = {
  title: 'Components/Canvas/Tidy up & Alignment',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj;

// ============================================================================
// Demo workflow
// ============================================================================

// Node order is the ELK model order the layout was recorded with. Keep it in
// sync with storybook-utils/flow-workbench-layout/record-layout.mts.
const MESSY_NODES: Node[] = [
  createNode({
    id: 'trigger',
    type: 'uipath.manual-trigger',
    position: { x: 64, y: 224 },
    display: { label: 'Invoice received' },
  }),
  createNode({
    id: 'fetch',
    type: 'uipath.blank-node',
    position: { x: 272, y: 96 },
    display: { label: 'Fetch invoice', subLabel: 'HTTP request' },
  }),
  createNode({
    id: 'validate',
    type: 'uipath.blank-node',
    position: { x: 432, y: 288 },
    display: { label: 'Validate fields', subLabel: 'Rules engine' },
  }),
  createNode({
    id: 'decision',
    type: 'uipath.control-flow.decision',
    position: { x: 656, y: 176 },
    display: { label: 'Over $10k?' },
  }),
  createNode({
    id: 'approve',
    type: 'uipath.blank-node',
    position: { x: 848, y: 48 },
    display: { label: 'Manager approval', subLabel: 'Human task' },
  }),
  createNode({
    id: 'normalize',
    type: 'uipath.data.transform',
    position: { x: 880, y: 368 },
    display: { label: 'Normalize data' },
  }),
  createNode({
    id: 'update',
    type: 'uipath.blank-node',
    position: { x: 1104, y: 208 },
    display: { label: 'Update ERP', subLabel: 'SAP connector' },
  }),
  createNode({
    id: 'notify',
    type: 'uipath.blank-node',
    position: { x: 1296, y: 112 },
    display: { label: 'Send notification', subLabel: 'Slack' },
  }),
  createNode({
    id: 'end',
    type: 'uipath.control-flow.terminate',
    position: { x: 1328, y: 336 },
    display: { label: 'End' },
  }),
];

const MODEL_ORDER = MESSY_NODES.map((node) => node.id);
const CANVAS_ID = 'tidy-up-alignment-demo';
const MESSY_POSITIONS = new Map(MESSY_NODES.map((node) => [node.id, node.position]));

const edge = (source: string, target: string, sourceHandle = 'output'): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  sourceHandle,
  targetHandle: 'input',
});

const DEMO_EDGES: Edge[] = [
  edge('trigger', 'fetch'),
  edge('fetch', 'validate'),
  edge('validate', 'decision'),
  edge('decision', 'approve', 'true'),
  edge('decision', 'normalize', 'false'),
  edge('approve', 'update'),
  edge('normalize', 'update'),
  edge('update', 'notify'),
  edge('notify', 'end'),
];

// Proposed Vertical layout flips handles to the top and bottom so edges stay
// straight. Horizontal layouts clear the override and use the manifest's sides.
const input = { id: 'input', type: 'target' as const, handleType: 'input' as const };
const output = { id: 'output', type: 'source' as const, handleType: 'output' as const };
const VERTICAL_HANDLES: Record<string, unknown> = {
  'uipath.manual-trigger': [{ position: Position.Bottom, handles: [output] }],
  'uipath.blank-node': [
    { position: Position.Top, handles: [input] },
    { position: Position.Bottom, handles: [output] },
  ],
  'uipath.data.transform': [
    { position: Position.Top, handles: [input] },
    { position: Position.Bottom, handles: [output] },
  ],
  'uipath.control-flow.decision': [
    { position: Position.Top, handles: [input] },
    {
      position: Position.Bottom,
      handles: [
        // Unlabeled: bottom captions would collide with the node's own label.
        { id: 'true', type: 'source' as const, handleType: 'output' as const },
        { id: 'false', type: 'source' as const, handleType: 'output' as const },
      ],
    },
  ],
  'uipath.control-flow.terminate': [{ position: Position.Top, handles: [input] }],
};

function withOrientation(nodes: Node[], vertical: boolean): Node[] {
  return nodes.map((node) => {
    const handleConfigurations = vertical ? VERTICAL_HANDLES[node.type ?? ''] : undefined;
    if (node.data.handleConfigurations === handleConfigurations) return node;
    return { ...node, data: { ...node.data, handleConfigurations } };
  });
}

/** The node and everything downstream of it. */
function downstreamOf(nodeId: string): Set<string> {
  const ids = new Set([nodeId]);
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const e of DEMO_EDGES) {
      if (e.source === current && !ids.has(e.target)) {
        ids.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return ids;
}

const nextFrames = (count: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) =>
      left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(count);
  });

// Flow Workbench's FlowCanvas fit options.
const FIT_VIEW_OPTIONS = { duration: 200, padding: 0.1, maxZoom: 1 };
// Demo-only starting view: leaves room for the cards pinned to the corners.
const INITIAL_FIT_VIEW_OPTIONS = { padding: { x: '360px', y: '120px' }, maxZoom: 0.85 };

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const TIDY_ALL_SHORTCUT = isMac ? '⌘⇧L' : 'Ctrl+Shift+L';
const TIDY_SELECTED_SHORTCUT = isMac ? '⌘⌥L' : 'Ctrl+Alt+L';

// ============================================================================
// Small presentational pieces
// ============================================================================

function StatusTag({ proposed }: { proposed?: boolean }) {
  return (
    <Badge variant={proposed ? 'info' : 'success'} className="shrink-0">
      {proposed ? 'Proposed' : 'In product'}
    </Badge>
  );
}

function DemoCard({
  title,
  collapsible,
  children,
}: {
  title: string;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-80 flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 text-foreground shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">{title}</span>
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <CanvasIcon icon={open ? 'chevron-up' : 'chevron-down'} size={16} />
          </Button>
        )}
      </div>
      {open && children}
    </div>
  );
}

function BehaviorRow({
  label,
  detail,
  proposed,
}: {
  label: string;
  detail: string;
  proposed?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-foreground-muted">{detail}</span>
      </div>
      <StatusTag proposed={proposed} />
    </div>
  );
}

function SettingRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ============================================================================
// Context menu (mirrors Flow Workbench's CanvasContextMenu "Auto layout" section)
// ============================================================================

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

function LayoutContextMenu({
  state,
  selectedCount,
  onClose,
  onTidyAll,
  onTidySelected,
  onAlign,
  onDistribute,
}: {
  state: ContextMenuState;
  selectedCount: number;
  onClose: () => void;
  onTidyAll: () => void;
  onTidySelected: () => void;
  onAlign: (alignment: AlignmentType) => void;
  onDistribute: (direction: DistributionDirection) => void;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const canAlign = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;

  // Same approach as Flow Workbench: a hidden trigger at the pointer that
  // receives a synthetic right-click, so xyflow keeps its own contextmenu handling.
  useEffect(() => {
    if (!state.visible || !triggerRef.current) return;
    const trigger = triggerRef.current;
    const id = setTimeout(() => {
      trigger.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: state.x,
          clientY: state.y,
        })
      );
    }, 0);
    return () => clearTimeout(id);
  }, [state.visible, state.x, state.y]);

  const run = (handler: () => void) => () => {
    handler();
    onClose();
  };

  const alignItems: { id: AlignmentType; label: string; icon: ReactNode }[] = [
    { id: 'left', label: 'Align left', icon: <AlignHorizontalJustifyStart /> },
    { id: 'center', label: 'Align center', icon: <AlignHorizontalJustifyCenter /> },
    { id: 'right', label: 'Align right', icon: <AlignHorizontalJustifyEnd /> },
    { id: 'top', label: 'Align top', icon: <AlignVerticalJustifyStart /> },
    { id: 'middle', label: 'Align middle', icon: <AlignVerticalJustifyCenter /> },
    { id: 'bottom', label: 'Align bottom', icon: <AlignVerticalJustifyEnd /> },
  ];

  return (
    <ContextMenu onOpenChange={(open) => !open && onClose()}>
      <ContextMenuTrigger asChild>
        <div
          ref={triggerRef}
          className="fixed size-px"
          style={{ left: state.x, top: state.y, visibility: state.visible ? 'visible' : 'hidden' }}
        />
      </ContextMenuTrigger>
      <ContextMenuContent className="[&_svg]:size-4">
        <ContextMenuLabel>Auto layout</ContextMenuLabel>
        <ContextMenuItem data-testid="ctx-tidy-all" onClick={run(onTidyAll)}>
          <BrushCleaning className="mr-2" />
          <span className="flex-1">Tidy up nodes</span>
          <ContextMenuShortcut className="pl-10">{TIDY_ALL_SHORTCUT}</ContextMenuShortcut>
        </ContextMenuItem>
        {canAlign && (
          <ContextMenuItem data-testid="ctx-tidy-selected" onClick={run(onTidySelected)}>
            <BrushCleaning className="mr-2" />
            <span className="flex-1">Tidy selected</span>
            <ContextMenuShortcut className="pl-10">{TIDY_SELECTED_SHORTCUT}</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {canAlign && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <AlignStartHorizontal className="mr-2" />
              <span>Alignment</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="[&_svg]:size-4">
              {alignItems.map((item) => (
                <ContextMenuItem
                  key={item.id}
                  data-testid={`ctx-align-${item.id}`}
                  onClick={run(() => onAlign(item.id))}
                >
                  <span className="mr-2 flex">{item.icon}</span>
                  <span>{item.label}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {canDistribute && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <AlignHorizontalSpaceAround className="mr-2" />
              <span>Distribution</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="[&_svg]:size-4">
              <ContextMenuItem
                data-testid="ctx-distribute-horizontal"
                onClick={run(() => onDistribute('horizontal'))}
              >
                <AlignHorizontalSpaceAround className="mr-2" />
                <span>Distribute horizontally</span>
              </ContextMenuItem>
              <ContextMenuItem
                data-testid="ctx-distribute-vertical"
                onClick={run(() => onDistribute('vertical'))}
              >
                <AlignVerticalSpaceAround className="mr-2" />
                <span>Distribute vertically</span>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============================================================================
// Selection toolbar (mirrors Flow Workbench's SelectionToolbar)
// ============================================================================

const SELECTION_TOOLBAR_CLASS =
  'pointer-events-auto flex min-h-10 shrink-0 flex-row items-center gap-1 rounded-xl border border-(--canvas-background-overlay) bg-(--canvas-background-raised) p-1 shadow-[0_2px_6px_rgba(0,0,0,0.08)]';
const SELECTION_SEPARATOR_CLASS = 'h-5 w-px self-center bg-(--canvas-background-overlay)';

function SelectionToolbar({
  selectedIds,
  onTidySelected,
}: {
  selectedIds: string[];
  onTidySelected: () => void;
}) {
  if (selectedIds.length < 2) return null;
  const noop = () => {};

  return (
    <NodeToolbar nodeId={selectedIds} isVisible position={Position.Top} offset={16}>
      <div
        role="toolbar"
        aria-label="Actions for the selected nodes"
        className={SELECTION_TOOLBAR_CLASS}
      >
        <ToolbarButton
          action={{
            id: 'tidy-up',
            icon: <CanvasIcon icon="layout-grid" size={14} />,
            label: 'Tidy up selected',
            onAction: noop,
            onClick: onTidySelected,
          }}
        />
        <ToolbarButton
          action={{
            id: 'convert-to-subflow',
            icon: <CanvasIcon icon="group" size={14} />,
            label: 'Convert to subflow',
            onAction: noop,
            onClick: noop,
          }}
        />
        <div aria-hidden="true" className={SELECTION_SEPARATOR_CLASS} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarIconButton type="button" className="nodrag nopan" aria-label="More actions">
              <CanvasIcon icon="ellipsis-vertical" size={14} />
            </ToolbarIconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem>
              <CanvasIcon icon="copy" size={14} />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CanvasIcon icon="scissors" size={14} />
              Cut
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CanvasIcon icon="trash-2" size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </NodeToolbar>
  );
}

// ============================================================================
// Workflow demo
// ============================================================================

function WorkflowDemoStory() {
  const { canvasProps, nodes, setNodes, setEdges } = useCanvasStory({
    initialNodes: MESSY_NODES,
    initialEdges: DEMO_EDGES,
  });
  const { fitView, flowToScreenPosition } = useReactFlow();

  const [useTidyUpMenu, setUseTidyUpMenu] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [keepInView, setKeepInView] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [lastAction, setLastAction] = useState('None yet');
  const layoutingRef = useRef(false);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const selectedIds = useMemo(() => nodes.filter((n) => n.selected).map((n) => n.id), [nodes]);

  const edgeTypes = useMemo<EdgeTypes>(() => ({ default: CanvasEdge }), []);

  const nodesInitialized = useNodesInitialized();
  const didInitialFitRef = useRef(false);
  useEffect(() => {
    if (!nodesInitialized || didInitialFitRef.current) return;
    didInitialFitRef.current = true;
    void fitView(INITIAL_FIT_VIEW_OPTIONS);
  }, [fitView, nodesInitialized]);

  const isInView = useCallback(
    (target: Node[]) => {
      const bounds = document.getElementById(CANVAS_ID)?.getBoundingClientRect();
      if (!bounds) return true;
      return target.every((node) => {
        const topLeft = flowToScreenPosition(node.position);
        const bottomRight = flowToScreenPosition({
          x: node.position.x + (node.measured?.width ?? 96),
          y: node.position.y + (node.measured?.height ?? 96),
        });
        return (
          topLeft.x >= bounds.left &&
          topLeft.y >= bounds.top &&
          bottomRight.x <= bounds.right &&
          bottomRight.y <= bounds.bottom
        );
      });
    },
    [flowToScreenPosition]
  );

  // One layout pass, the way Flow Workbench's useLayoutOperations runs it:
  // straighten the moving edges, animate the nodes, then apply fresh routes.
  const runLayoutPass = useCallback(
    async (label: string, result: LayoutResult, duration: number, vertical = false) => {
      if (layoutingRef.current) return;
      layoutingRef.current = true;
      try {
        // Handles switch sides before the move so edges re-route as nodes fly.
        setNodes((current) => withOrientation(current, vertical));
        const before = withOrientation(nodesRef.current, vertical);
        const target = withOrientation(result.nodes, vertical);
        const movedIds = new Set(
          result.nodes
            .filter((node) => {
              const prev = before.find((n) => n.id === node.id);
              return (
                prev && (prev.position.x !== node.position.x || prev.position.y !== node.position.y)
              );
            })
            .map((node) => node.id)
        );
        setEdges((edges) => applyWaypoints(edges, movedIds, new Map()));
        await animateNodes(before, target, duration, setNodes);
        setEdges((edges) => applyWaypoints(edges, movedIds, result.waypoints));
        setLastAction(label);
        // Proposed: refit only when the tidied flow no longer fits on screen.
        if (keepInView && !isInView(target)) {
          // Let React Flow commit the final positions before measuring bounds.
          await nextFrames(2);
          await fitView(FIT_VIEW_OPTIONS);
        }
      } finally {
        layoutingRef.current = false;
      }
    },
    [isInView, keepInView, fitView, setEdges, setNodes]
  );

  const handleTidyAll = useCallback(() => {
    void runLayoutPass('Tidy up nodes', tidyAll(nodesRef.current), TIDY_ANIMATION_MS);
  }, [runLayoutPass]);

  const handleProposedLayout = useCallback(
    (layout: ProposedLayout) => {
      void runLayoutPass(
        layout === 'compact' ? 'Compact layout' : 'Vertical layout',
        tidyProposed(nodesRef.current, layout),
        TIDY_ANIMATION_MS,
        layout === 'vertical'
      );
    },
    [runLayoutPass]
  );

  // Proposed: a node-scoped entry point. It promises a contextual result, so it
  // tidies this node and everything after it, never the whole workflow.
  const handleTidyFromHere = useCallback(
    (nodeId: string) => {
      const scope = downstreamOf(nodeId);
      if (scope.size < 2) {
        setLastAction('Tidy from here: nothing downstream');
        return;
      }
      const scoped = nodesRef.current.map((n) => ({ ...n, selected: scope.has(n.id) }));
      setNodes(scoped);
      const result = tidySelected(scoped, MODEL_ORDER);
      if (result) void runLayoutPass('Tidy from here', result, TIDY_ANIMATION_MS);
    },
    [runLayoutPass, setNodes]
  );

  const nodeToolbarConfig = useMemo<NodeToolbarConfig>(
    () => ({
      actions: [
        { id: 'delete', icon: 'trash-2', label: 'Delete', onAction: () => {} },
        { id: 'duplicate', icon: 'copy', label: 'Duplicate', onAction: () => {} },
      ],
      overflowActions: [
        {
          id: 'tidy-from-here',
          icon: 'brush-cleaning',
          label: 'Tidy from here',
          onAction: handleTidyFromHere,
        },
      ],
    }),
    [handleTidyFromHere]
  );

  const handleTidySelected = useCallback(() => {
    const result = tidySelected(nodesRef.current, MODEL_ORDER);
    if (result) void runLayoutPass('Tidy selected', result, TIDY_ANIMATION_MS);
  }, [runLayoutPass]);

  const moveSelected = useCallback(
    (label: string, transform: (selected: Node[]) => Node[]) => {
      const current = nodesRef.current;
      const moved = new Map(
        transform(current.filter((n) => n.selected)).map((n) => [n.id, n.position])
      );
      const target = current.map((n) => {
        const position = moved.get(n.id);
        return position ? { ...n, position } : n;
      });
      void runLayoutPass(label, { nodes: target, waypoints: new Map() }, ALIGN_ANIMATION_MS);
    },
    [runLayoutPass]
  );

  const handleAlign = useCallback(
    (alignment: AlignmentType) =>
      moveSelected(`Align ${alignment}`, (selected) => alignNodes(selected, alignment)),
    [moveSelected]
  );

  const handleDistribute = useCallback(
    (direction: DistributionDirection) =>
      moveSelected(`Distribute ${direction}ly`, (selected) => distributeNodes(selected, direction)),
    [moveSelected]
  );

  const handleSubtleAlign = useCallback(() => {
    void runLayoutPass(
      'Subtle align',
      { nodes: subtleAlignNodes(nodesRef.current), waypoints: new Map() },
      ALIGN_ANIMATION_MS
    );
  }, [runLayoutPass]);

  const handleReset = useCallback(() => {
    setNodes((current) =>
      withOrientation(current, false).map((n) => ({
        ...n,
        selected: false,
        position: MESSY_POSITIONS.get(n.id) ?? n.position,
      }))
    );
    setEdges(DEMO_EDGES);
    setLastAction('Reset');
    requestAnimationFrame(() => void fitView({ ...INITIAL_FIT_VIEW_OPTIONS, duration: 200 }));
  }, [fitView, setEdges, setNodes]);

  // Keyboard shortcuts, same bindings as Flow Workbench.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.code !== 'KeyL') return;
      if (event.shiftKey && !event.altKey) {
        event.preventDefault();
        handleTidyAll();
      } else if (event.altKey && !event.shiftKey) {
        event.preventDefault();
        handleTidySelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTidyAll, handleTidySelected]);

  // Alignment guides while dragging (Apollo's AlignmentGuides).
  const onSnap = useCallback(
    (updates: AlignmentPositionUpdate[]) => {
      const positions = new Map(updates.map(({ id, position }) => [id, position]));
      setNodes((current) =>
        current.map((n) => {
          const position = positions.get(n.id);
          return position ? { ...n, position } : n;
        })
      );
    },
    [setNodes]
  );
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, { onSnap });

  // Dragging a node invalidates the routes touching it, as in Flow Workbench.
  const handleNodeDragStart = useCallback<NodeMouseHandler>(
    (_event, node) => {
      const moving = new Set([
        node.id,
        ...nodesRef.current.filter((n) => n.selected).map((n) => n.id),
      ]);
      setEdges((edges) => applyWaypoints(edges, moving, new Map()));
    },
    [setEdges]
  );

  const openContextMenu = useCallback((event: ReactMouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  }, []);

  const handleNodeContextMenu = useCallback<NodeMouseHandler>(
    (event, node) => {
      if (!node.selected) {
        setNodes((current) => current.map((n) => ({ ...n, selected: n.id === node.id })));
      }
      openContextMenu(event);
    },
    [openContextMenu, setNodes]
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc>(() => {
    setContextMenu((state) => (state.visible ? { ...state, visible: false } : state));
  }, []);

  const tidyUpOptions = useMemo<TidyUpMenuOption[]>(
    () => [
      { id: 'all', label: 'Tidy up nodes', icon: 'brush-cleaning', shortcut: TIDY_ALL_SHORTCUT },
      {
        id: 'selected',
        label: 'Tidy selected',
        icon: 'layout-grid',
        shortcut: TIDY_SELECTED_SHORTCUT,
        disabled: selectedIds.length < 2,
      },
      { id: 'compact', label: 'Compact layout', icon: 'shrink', separatorBefore: true },
      { id: 'vertical', label: 'Vertical layout', icon: 'move-vertical' },
      { id: 'subtle', label: 'Subtle align', icon: 'grid-3x3' },
    ],
    [selectedIds.length]
  );

  const handleTidyUpSelect = useCallback(
    (optionId: string) => {
      if (optionId === 'all') handleTidyAll();
      if (optionId === 'selected') handleTidySelected();
      if (optionId === 'compact' || optionId === 'vertical') handleProposedLayout(optionId);
      if (optionId === 'subtle') handleSubtleAlign();
    },
    [handleProposedLayout, handleSubtleAlign, handleTidyAll, handleTidySelected]
  );

  return (
    <BaseNodeOverrideConfigProvider value={{ toolbarConfig: nodeToolbarConfig }}>
      <BaseCanvas
        {...canvasProps}
        id={CANVAS_ID}
        edgeTypes={edgeTypes}
        mode="design"
        // Measure every node up front so fit view sees the whole flow.
        onlyRenderVisibleElements={false}
        // Flow Workbench's canvas input: drag on empty canvas to box-select,
        // scroll to pan, no scroll zoom.
        selectionOnDrag
        panOnScroll
        zoomOnScroll={false}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={showGuides ? onNodeDrag : undefined}
        onNodeDragStop={showGuides ? onNodeDragStop : undefined}
        onPaneContextMenu={openContextMenu}
        onSelectionContextMenu={openContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onSelectionChange={handleSelectionChange}
      >
        {showGuides && <AlignmentGuidesOverlay guides={guides} />}
        <SelectionToolbar selectedIds={selectedIds} onTidySelected={handleTidySelected} />

        <Panel position="top-left">
          <DemoCard title="Tidy up & Alignment" collapsible>
            <span className="text-sm text-foreground-muted">
              An invoice workflow placed by hand. Tidy it from the corner toolbar, right-click the
              canvas, select two or more nodes, or use the shortcuts.
            </span>
            <div className="flex flex-col gap-2.5">
              <BehaviorRow
                label="Tidy up nodes"
                detail={`Corner toolbar, right-click, ${TIDY_ALL_SHORTCUT}. The leftmost node stays put.`}
              />
              <BehaviorRow
                label="Tidy selected"
                detail={`Selection toolbar, right-click, ${TIDY_SELECTED_SHORTCUT}. The selection stays in place.`}
              />
              <BehaviorRow
                label="Align and distribute"
                detail="Right-click with 2+ nodes (align) or 3+ nodes (distribute) selected."
              />
              <BehaviorRow
                label="Alignment guides"
                detail="Guides and magnetic snapping while dragging. In Apollo, not yet in Flow Workbench."
                proposed
              />
              <BehaviorRow
                label="Tidy up menu"
                detail="Corner button offers Compact, Vertical and Subtle align next to Tidy up nodes."
                proposed
              />
              <BehaviorRow
                label="Tidy from here"
                detail="Node toolbar overflow. Tidies the node and everything after it."
                proposed
              />
              <BehaviorRow
                label="Keep tidied flow in view"
                detail="Refits only when the result runs off screen. Flow Workbench never refits today."
                proposed
              />
            </div>
            <span className="text-xs text-foreground-muted">
              {`Layout recorded from Flow Workbench ${FLOW_WORKBENCH_LAYOUT_SOURCE.commit} (${FLOW_WORKBENCH_LAYOUT_SOURCE.date}).`}
            </span>
          </DemoCard>
        </Panel>

        <Panel position="top-right">
          <DemoCard title="Demo settings">
            <SettingRow
              id="tidy-menu"
              label="Tidy up menu in toolbar"
              checked={useTidyUpMenu}
              onCheckedChange={setUseTidyUpMenu}
            />
            <SettingRow
              id="guides"
              label="Alignment guides while dragging"
              checked={showGuides}
              onCheckedChange={setShowGuides}
            />
            <SettingRow
              id="keep-in-view"
              label="Keep tidied flow in view"
              checked={keepInView}
              onCheckedChange={setKeepInView}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-foreground-muted">Last action: {lastAction}</span>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset demo
              </Button>
            </div>
          </DemoCard>
        </Panel>

        <Panel position="bottom-right">
          <CanvasZoomControls
            fitViewOptions={FIT_VIEW_OPTIONS}
            onOrganize={handleTidyAll}
            tidyUpOptions={useTidyUpMenu ? tidyUpOptions : undefined}
            onTidyUpSelect={handleTidyUpSelect}
          />
        </Panel>
      </BaseCanvas>

      <LayoutContextMenu
        state={contextMenu}
        selectedCount={selectedIds.length}
        onClose={() => setContextMenu((state) => ({ ...state, visible: false }))}
        onTidyAll={handleTidyAll}
        onTidySelected={handleTidySelected}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
      />
    </BaseNodeOverrideConfigProvider>
  );
}

// ============================================================================
// UX guidance
// ============================================================================

function GuidanceSection({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {intro && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function GuidanceTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { cells: ReactNode[]; proposed?: boolean }[];
}) {
  const template = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) 7rem` };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card px-5">
      <div
        className="hidden gap-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid"
        style={template}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
        <span>Status</span>
      </div>
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid gap-2 border-t border-border py-4 text-sm leading-6 sm:gap-6"
          style={template}
        >
          {row.cells.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className={cellIndex === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}
            >
              {cell}
            </div>
          ))}
          <div>
            <StatusTag proposed={row.proposed} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RuleCard({
  title,
  proposed,
  children,
}: {
  title: string;
  proposed?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <StatusTag proposed={proposed} />
      </div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground">{children}</code>
);

const REFERENCE_SNIPPET = `// The host owns the layout engine. Apollo owns the controls.
<CanvasZoomControls
  onOrganize={tidyAll}                 // In product: one button, one action
  tidyUpOptions={[                     // Proposed: a menu of strategies
    { id: 'all', label: 'Tidy up nodes', icon: 'brush-cleaning', shortcut: '⌘⇧L' },
    { id: 'selected', label: 'Tidy selected', icon: 'layout-grid', shortcut: '⌘⌥L',
      disabled: selectedCount < 2 },
    { id: 'compact', label: 'Compact layout', icon: 'shrink', separatorBefore: true },
    { id: 'vertical', label: 'Vertical layout', icon: 'move-vertical' },
  ]}
  onTidyUpSelect={(id) => runStrategy(id)}
/>

// Alignment guides while dragging
const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, { onSnap });
<BaseCanvas onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
  <AlignmentGuidesOverlay guides={guides} />
</BaseCanvas>`;

function TidyUpAlignmentUxGuidance() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-8 py-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          UX guidance
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Tidy up without surprises</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          Tidy up restores order without making people guess how much of their workflow will move.
          Where the action lives tells people what it will touch, and the result should land where
          they can see it.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <StatusTag /> Ships in Flow Workbench today.
          </span>
          <span className="flex items-center gap-2">
            <StatusTag proposed /> Recommended here, not in Flow Workbench yet.
          </span>
        </div>

        <GuidanceSection
          title="Location sets the scope"
          intro="Each entry point promises a scope. A contextual location promises a contextual result, so never put a whole-workflow action in a node or selection menu."
        >
          <GuidanceTable
            columns={['Entry point', 'Moves', 'How to reach it']}
            rows={[
              {
                cells: [
                  'Corner toolbar: Tidy up',
                  'The whole workflow',
                  'Always visible when editable',
                ],
              },
              {
                cells: [
                  'Right-click canvas: Tidy up nodes',
                  'The whole workflow',
                  `Context menu or ${TIDY_ALL_SHORTCUT}`,
                ],
              },
              {
                cells: [
                  'Selection toolbar: Tidy up selected',
                  'Only the selection',
                  'Appears above 2+ selected nodes',
                ],
              },
              {
                cells: [
                  'Right-click selection: Tidy selected',
                  'Only the selection',
                  `Context menu or ${TIDY_SELECTED_SHORTCUT}`,
                ],
              },
              {
                cells: [
                  'Node toolbar overflow: Tidy from here',
                  'The node and everything after it',
                  'More menu on a hovered or selected node',
                ],
                proposed: true,
              },
            ]}
          />
        </GuidanceSection>

        <GuidanceSection
          title="What moves and what stays"
          intro="People should be able to predict the result before they click. Anchor the layout to something they already know."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <RuleCard title="The leftmost node stays put">
              Tidy up nodes keeps the leftmost node, usually the trigger, exactly where it was and
              lays the rest of the flow out around it.
            </RuleCard>
            <RuleCard title="A selection stays in place">
              Tidy selected lays out only the selected nodes and keeps the selection's top-left
              corner where it was. Nothing outside the selection moves.
            </RuleCard>
            <RuleCard title="Everything lands on the grid">
              Every node position and edge bend snaps to the 16px canvas grid, so a tidied flow
              lines up with anything placed by hand afterwards.
            </RuleCard>
            <RuleCard title="Moves animate, briefly">
              Nodes glide to their new positions with an ease-out curve: 500ms for tidy up, 300ms
              for align and distribute. Edges straighten during the move and re-route when it lands.
            </RuleCard>
            <RuleCard title="One undo step">
              A tidy is recorded as a single history step, so {isMac ? '⌘Z' : 'Ctrl+Z'} restores the
              previous layout in one go. The demo uses Reset instead.
            </RuleCard>
            <RuleCard title="Scoped tidy from a node" proposed>
              Tidy from here tidies the node and everything downstream of it. It is the only scope
              that fits a single node's menu without surprising people.
            </RuleCard>
          </div>
        </GuidanceSection>

        <GuidanceSection
          title="Buttons in the toolbars"
          intro="Two toolbars carry layout actions. Disable actions rather than hiding them, so the toolbars keep a stable shape."
        >
          <GuidanceTable
            columns={['Toolbar', 'Buttons, in order', 'Notes']}
            rows={[
              {
                cells: [
                  'Corner controls',
                  'Zoom in, Zoom out, Fit to screen, Tidy up',
                  'Bottom-right. Tidy up only shows when the canvas is editable.',
                ],
              },
              {
                cells: [
                  'Selection toolbar',
                  'Tidy up selected, Convert to subflow, More (Copy, Cut, Delete)',
                  'Floats above a selection of 2+ nodes.',
                ],
              },
              {
                cells: [
                  'Corner controls with Tidy up menu',
                  'Tidy up opens a menu: Tidy up nodes, Tidy selected, then the extra strategies',
                  'Use only when more than one strategy is offered. Keep the default first with its shortcut.',
                ],
                proposed: true,
              },
            ]}
          />
        </GuidanceSection>

        <GuidanceSection
          title="Match the strategy to the intent"
          intro="Let people choose how much change they want. The default reorganizes the flow; the others trade structure for familiarity or space."
        >
          <GuidanceTable
            columns={['Strategy', 'Use when', 'Result']}
            rows={[
              {
                cells: [
                  'Tidy up nodes',
                  'The flow grew organically and needs a clear reading order.',
                  'Left to right with 96px spacing; edges route around nodes.',
                ],
              },
              {
                cells: [
                  'Tidy selected',
                  'One part of the flow is messy and the rest is fine.',
                  'Lays out only the selection, in place.',
                ],
              },
              {
                cells: [
                  'Compact layout',
                  'A large flow needs to fit on screen.',
                  'Same engine and reading order with 48/64px spacing.',
                ],
                proposed: true,
              },
              {
                cells: [
                  'Vertical layout',
                  'The process reads better top to bottom.',
                  'Top-down layout; handles move to the top and bottom so edges stay straight.',
                ],
                proposed: true,
              },
              {
                cells: [
                  'Subtle align',
                  'The layout is understandable but slightly uneven.',
                  'Nudges nearly aligned nodes onto shared lines and keeps the overall shape.',
                ],
                proposed: true,
              },
            ]}
          />
        </GuidanceSection>

        <GuidanceSection
          title="How alignment works with Tidy up"
          intro="Three tools for three moments. Guides prevent mess as it happens, align and distribute fix a few nodes, and tidy up restructures the flow."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <RuleCard title="While dragging: guides" proposed>
              Alignment guides show the edge or center a node will snap to, and magnetic snapping
              places it exactly. Grid snap applies first, then alignment. Available in Apollo as{' '}
              <Code>useAlignmentGuides</Code>, not yet used by Flow Workbench.
            </RuleCard>
            <RuleCard title="After placing: align and distribute">
              With 2+ nodes selected, right-click to align left, center, right, top, middle or
              bottom. With 3+, distribute horizontally or vertically. These only move nodes; they
              never change the flow's structure.
            </RuleCard>
            <RuleCard title="Whole structure: tidy up">
              Tidy up re-flows the graph and re-routes edges. Reach for it when nodes are in the
              wrong order, not just slightly off.
            </RuleCard>
          </div>
        </GuidanceSection>

        <GuidanceSection
          title="Moving into view"
          intro="Because the layout is anchored to the leftmost node, a tidied flow can grow past the right or bottom edge of the screen."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <RuleCard title="Today: the view never moves">
              Flow Workbench leaves the viewport alone after a tidy. If the result runs off screen,
              people have to find it with Fit to screen.
            </RuleCard>
            <RuleCard title="Refit only when needed" proposed>
              After a tidy, refit only if part of the result is off screen, using the product's fit
              settings: 200ms, 10% padding, never zooming past 100%. Leave the view alone when
              everything is visible, since a jump on every tidy is disorienting.
            </RuleCard>
          </div>
        </GuidanceSection>

        <GuidanceSection
          title="Reference implementation"
          intro={
            <>
              Apollo provides the controls; the host keeps its own layout engine. Use{' '}
              <Code>onOrganize</Code> when one predictable action runs immediately, and{' '}
              <Code>tidyUpOptions</Code> with <Code>onTidyUpSelect</Code> when people choose a
              strategy. Try every behavior on the Workflow demo page.
            </>
          }
        >
          <pre className="overflow-x-auto rounded-xl border border-border bg-card p-5 text-[13px] leading-6 text-foreground">
            {REFERENCE_SNIPPET}
          </pre>
          <p className="mt-4 text-xs text-muted-foreground">
            {`The demo replays layouts recorded from Flow Workbench ${FLOW_WORKBENCH_LAYOUT_SOURCE.commit} (${FLOW_WORKBENCH_LAYOUT_SOURCE.date}). Proposed strategies use the same engine with different settings.`}
          </p>
        </GuidanceSection>
      </main>
    </div>
  );
}

// Keep exports in review order. Storybook preserves CSF export order in the sidebar.
export const UxGuidance: Story = {
  name: 'UX Guidance',
  render: () => <TidyUpAlignmentUxGuidance />,
};

export const WorkflowDemo: Story = {
  name: 'Workflow demo',
  render: () => <WorkflowDemoStory />,
};
