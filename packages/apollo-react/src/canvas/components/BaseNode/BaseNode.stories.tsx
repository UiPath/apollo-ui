/**
 * BaseNode Stories
 *
 * Demonstrates the BaseNode component with various shapes, sizes, and execution states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, cn, Input, Label, Slider, Switch } from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import type { CategoryManifest, NodeManifest } from '../../schema';
import {
  allCategoryManifests,
  allNodeManifests,
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import type { ValidationErrorSeverity } from '../../types/validation';
import { CanvasIcon } from '../../utils/icon-registry';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';
import type { BaseNodeData } from './BaseNode.types';
import { BaseNodeOverrideConfigProvider } from './BaseNodeConfigContext';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<BaseNodeData> = {
  title: 'Components/Nodes/BaseNode',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Node Grid Definitions
// ============================================================================

const SHAPES = [
  { shape: 'circle', nodeType: 'uipath.manual-trigger' },
  { shape: 'square', nodeType: 'uipath.blank-node' },
  { shape: 'rectangle', nodeType: 'uipath.agent' },
] as const;
const STATUSES = [
  'NotExecuted',
  'InProgress',
  'Completed',
  'Failed',
  'Paused',
  'ActionNeeded',
] as const;

const GRID_CONFIG = {
  startX: 96,
  startY: 96,
  gapX: 192,
  gapY: 159,
};

/**
 * Creates a grid of nodes showing all shape/status combinations.
 */
function createShapeStatusGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  STATUSES.forEach((status, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `${shape}-${status}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            executionStatus: status,
            display: {
              label: shape,
              subLabel: status.replace(/([A-Z])/g, ' $1').trim(),
              shape,
            },
          },
        })
      );
    });
  });

  SHAPES.forEach(({ shape, nodeType }, shapeI) => {
    nodes.push(
      createNode({
        id: `${shape}-loading`,
        type: nodeType,
        position: {
          x: GRID_CONFIG.startX + shapeI * GRID_CONFIG.gapX,
          y: GRID_CONFIG.startY + STATUSES.length * GRID_CONFIG.gapY,
        },
        data: {
          nodeType,
          version: '1.0.0',
          display: { label: shape, shape, subLabel: 'Loading state' },
          loading: true,
        },
      })
    );
  });

  // Manifest missing entirely: BaseNode falls back to InitialsBadge from `label`.
  nodes.push(
    createNode({
      id: `unknown-node`,
      type: 'uipath.unknown-node',
      position: {
        x: GRID_CONFIG.startX,
        y: GRID_CONFIG.startY + (STATUSES.length + 1) * GRID_CONFIG.gapY,
      },
      data: {
        nodeType: 'uipath.unknown-node',
        version: '1.0.0',
        display: { label: 'Unknown Node', shape: 'square', subLabel: 'Missing manifest' },
      },
    })
  );

  // Manifest present but `display.icon` omitted: falls back to InitialsBadge.
  nodes.push(
    createNode({
      id: `no-icon-node`,
      type: 'uipath.no-icon-node',
      position: {
        x: GRID_CONFIG.startX + GRID_CONFIG.gapX,
        y: GRID_CONFIG.startY + (STATUSES.length + 1) * GRID_CONFIG.gapY,
      },
      data: {
        nodeType: 'uipath.no-icon-node',
        version: '1.0.0',
        display: {
          label: 'Missing Icon',
          shape: 'square',
          subLabel: 'Fallback to icon w/ first letter',
        },
      },
    })
  );

  return nodes;
}

// ============================================================================
// Size Grid Definitions
// ============================================================================

const RECTANGLE_WIDTHS = [128, 160, 192, 256, 320] as const;

const SQUARE_WIDTHS = [96, 128, 160] as const;

// Circle height floor is (maxSideHandles * 2 + 2) * 16, so these counts yield
// 96/128/160px. Width is set to match, keeping circles round.
const SIZE_STEPS = [
  { size: 96, handles: 2 },
  { size: 128, handles: 3 },
  { size: 160, handles: 4 },
] as const;

const sizeInputs = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `in-${i}`,
    type: 'target' as const,
    handleType: 'input' as const,
  }));

// Registers proportional circle types whose height grows with handle count.
// Merged with the default manifests so squares/rectangles keep their built-in types.
const sizeGridManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    ...allCategoryManifests,
    {
      id: 'sizing',
      name: 'Sizing',
      sortOrder: 99,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'git-branch',
      tags: [],
    },
  ],
  nodes: [
    ...allNodeManifests,
    ...SIZE_STEPS.map(({ size, handles }) => ({
      nodeType: `uipath.size-circle-${size}`,
      version: '1.0.0',
      category: 'sizing',
      tags: ['sizing'],
      sortOrder: size,
      display: { label: String(size), shape: 'circle' as const, icon: 'construction' },
      handleConfiguration: [{ position: 'left' as const, handles: sizeInputs(handles) }],
    })),
  ],
};

/**
 * Creates nodes demonstrating sizing. Squares vary by width with a computed
 * height; circles grow proportionally with handle count (height is derived).
 * Rectangles vary by width at a fixed 96px height.
 */
function createSizeGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  // Squares: width varies, height is left to the node (settles at the 96px floor).
  let sqX = 80;
  SQUARE_WIDTHS.forEach((size) => {
    nodes.push({
      ...createNode({
        id: `square-${size}`,
        type: 'uipath.blank-node',
        position: { x: sqX, y: 80 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: String(size), shape: 'square' },
        },
      }),
      width: size,
    });
    sqX += size + 64;
  });

  // Circles: handle-driven, proportional (width = height = size).
  let cX = 80;
  SIZE_STEPS.forEach(({ size }) => {
    nodes.push({
      ...createNode({
        id: `circle-${size}`,
        type: `uipath.size-circle-${size}`,
        position: { x: cX, y: 240 },
        data: {
          nodeType: `uipath.size-circle-${size}`,
          version: '1.0.0',
          display: { label: String(size), shape: 'circle' },
        },
      }),
      width: size,
      height: size,
    });
    cX += size + 64;
  });

  // Rectangles: width varies, height stays at the 96px floor.
  let rectX = 80;
  const rectY = 464;
  RECTANGLE_WIDTHS.forEach((width, index) => {
    nodes.push({
      ...createNode({
        id: `r-${index}`,
        type: 'uipath.agent',
        position: { x: rectX, y: rectY },
        data: {
          nodeType: 'uipath.agent',
          version: '1.0.0',
          display: { label: `${width}×96`, shape: 'rectangle' },
        },
      }),
      width,
      height: 96,
    });
    rectX += width + 64;
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function ShapesCanvas() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'shape-circle',
        type: 'uipath.manual-trigger',
        position: { x: 96, y: 120 },
        data: {
          nodeType: 'uipath.manual-trigger',
          version: '1.0.0',
          display: { label: 'Circle', subLabel: 'Manual trigger', shape: 'circle' },
        },
      }),
      createNode({
        id: 'shape-square',
        type: 'uipath.blank-node',
        position: { x: 320, y: 120 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Square', subLabel: 'Blank node', shape: 'square' },
        },
      }),
      createNode({
        id: 'shape-rectangle',
        type: 'uipath.agent',
        position: { x: 560, y: 120 },
        data: {
          nodeType: 'uipath.agent',
          version: '1.0.0',
          display: { label: 'Rectangle', subLabel: 'Agent', shape: 'rectangle' },
        },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

const shapeRows = [
  {
    shape: 'circle',
    value: "'circle'",
    example: 'uipath.manual-trigger',
    use: 'Triggers, entry and exit points',
  },
  {
    shape: 'square',
    value: "'square'",
    example: 'uipath.blank-node',
    use: 'Standard actions — the default for most task nodes',
  },
  {
    shape: 'rectangle',
    value: "'rectangle'",
    example: 'uipath.agent',
    use: 'Agents and wide nodes that need more horizontal label space',
  },
] as const;

function CanvasPreviewButton({
  expanded,
  onExpand,
  onClose,
}: {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}) {
  return expanded ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 4.5l-6 6M10.5 1.5l-6 6M1.5 1.5l4 4M10.5 10.5l-4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Close
    </button>
  ) : (
    <button
      type="button"
      onClick={onExpand}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 4.5V1.5H7.5M1.5 7.5v3h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Expand
    </button>
  );
}

function ShapesPage({ globalTheme }: { globalTheme: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Shapes</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          BaseNode supports three shapes: <strong className="text-foreground">circle</strong>,{' '}
          <strong className="text-foreground">square</strong>, and{' '}
          <strong className="text-foreground">rectangle</strong>. Shape is set via{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">display.shape</code>{' '}
          in the node data and controls both the rendered outline and the icon crop. Use the shape
          that best communicates the node's role to the user.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      {/* ── Preview ── */}
      <div className="pb-8">
        <div className="mx-auto max-w-4xl px-8 mb-4">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Preview</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The three shapes rendered side by side in their default (NotExecuted) state.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-[90vw] h-[560px] overflow-hidden rounded-xl border border-border">
            {!expanded && <ShapesCanvas />}
            <CanvasPreviewButton
              expanded={false}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      </div>

      {/* Expanded overlay — single canvas instance, inline unmounted while open */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-border"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ShapesCanvas />
            <CanvasPreviewButton
              expanded={true}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* ── Anatomy + How to use ── */}
      <div className="mx-auto max-w-4xl px-8 pb-8">
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Anatomy</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Each shape communicates a distinct role in the flow. Choose the shape that best maps to
          the node's function — not just its appearance.
        </p>

        {/* Shape gallery */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {/* Circle */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex h-24 items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-surface-raised">
                <div className="h-7 w-7 rounded-full bg-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Circle</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
                  'circle'
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Triggers and entry/exit points. Signals a boundary event — where a flow begins or
                ends.
              </p>
            </div>
          </div>

          {/* Square */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex h-24 items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-border bg-surface-raised">
                <div className="h-7 w-7 rounded bg-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Square</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
                  'square'
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Standard actions — the default for most task nodes. Use when no other shape more
                specifically communicates the node's role.
              </p>
            </div>
          </div>

          {/* Rectangle */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex h-24 items-center justify-center">
              <div className="flex h-12 w-40 items-center gap-3 rounded-lg border-2 border-border bg-surface-raised px-3">
                <div className="h-6 w-6 flex-shrink-0 rounded bg-muted" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-1.5 w-16 rounded-full bg-muted" />
                  <div className="h-1.5 w-10 rounded-full bg-muted opacity-50" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Rectangle</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
                  'rectangle'
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Agents and complex nodes that need more horizontal space for labels or internal
                layout.
              </p>
            </div>
          </div>
        </div>

        {/* Spec table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Shape</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <code className="text-xs">display.shape</code>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Example node type
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Typical use
                </th>
              </tr>
            </thead>
            <tbody>
              {shapeRows.map((row) => (
                <tr key={row.shape} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.shape}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">{row.value}</code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-muted-foreground">{row.example}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="my-10 h-px bg-border" />

        {/* ── How to use ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">How to use</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Set{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">display.shape</code>{' '}
          when creating node data. If omitted, the registry manifest's{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">display.shape</code>{' '}
          is used as the fallback.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
          {`createNode({
  id: 'my-node',
  type: 'uipath.blank-node',
  position: { x: 100, y: 100 },
  data: {
    nodeType: 'uipath.blank-node',
    version: '1.0.0',
    display: {
      label: 'My Node',
      shape: 'square', // 'circle' | 'square' | 'rectangle'
    },
  },
})`}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Execution States Page
// ============================================================================

function TakeActionModal({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/20">
            <CanvasIcon icon="flag" size={20} color="rgb(251 191 36)" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Action Needed</h3>
            <p className="text-xs text-muted-foreground">Node: {nodeId}</p>
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          This node is paused and waiting for your input before execution can continue. Review the
          details and confirm to proceed.
        </p>
        <div className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-foreground">
          <span className="font-medium">Pending:</span> Manual review and approval required.
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-900 transition-colors hover:bg-amber-300"
          >
            Complete Action
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function ExecutionStatesCanvas({ onActionNeeded }: { onActionNeeded?: (nodeId: string) => void }) {
  const initialNodes = useMemo(() => createShapeStatusGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseNodeOverrideConfigProvider value={{ onActionNeeded }}>
      <BaseCanvas {...canvasProps} mode="design">
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>
      </BaseCanvas>
    </BaseNodeOverrideConfigProvider>
  );
}

function ExecutionStatesPreviewButton({
  isExpanded,
  onExpand,
  onClose,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}) {
  return isExpanded ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 4.5l-6 6M10.5 1.5l-6 6M1.5 1.5l4 4M10.5 10.5l-4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Close
    </button>
  ) : (
    <button
      type="button"
      onClick={onExpand}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 4.5V1.5H7.5M1.5 7.5v3h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Expand
    </button>
  );
}

const executionStateCards = [
  {
    state: 'NotExecuted',
    value: "'NotExecuted'",
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
    iconClass: 'bg-muted',
    description: 'Default state. The node has not yet been reached in the current run.',
  },
  {
    state: 'InProgress',
    value: "'InProgress'",
    borderClass: 'border-sky-400',
    bgClass: 'bg-sky-400/10',
    iconClass: 'bg-sky-400',
    description: 'The node is actively being processed. Renders a progress indicator on the node.',
  },
  {
    state: 'Completed',
    value: "'Completed'",
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-500/10',
    iconClass: 'bg-emerald-500',
    description: 'The node finished executing successfully.',
  },
  {
    state: 'Failed',
    value: "'Failed'",
    borderClass: 'border-red-500',
    bgClass: 'bg-red-500/10',
    iconClass: 'bg-red-500',
    description: 'The node encountered an error during execution.',
  },
  {
    state: 'Paused',
    value: "'Paused'",
    borderClass: 'border-amber-400',
    bgClass: 'bg-amber-400/10',
    iconClass: 'bg-amber-400',
    description: 'Execution is paused at this node, typically at a breakpoint.',
  },
  {
    state: 'Loading',
    value: 'data.loading: true',
    borderClass: 'border-border',
    bgClass: 'bg-muted/40',
    iconClass: 'bg-muted',
    description: 'Node metadata is still loading. Set via data.loading, not executionStatus.',
  },
  {
    state: 'ActionNeeded',
    value: "'ActionNeeded'",
    borderClass: 'border-amber-400',
    bgClass: 'bg-amber-400/10',
    iconClass: 'bg-amber-400',
    description:
      'The process is blocked waiting for human input during an active execution. Shows a flag icon and an always-visible "Action needed" pill at the top-right of the node. Only rendered when the flow is in an executing state.',
  },
] as const;

const executionStateRows = [
  {
    state: 'NotExecuted',
    trigger: 'No state returned',
    meaning: 'Node has not been reached in the current run',
  },
  {
    state: 'InProgress',
    trigger: "status: 'InProgress'",
    meaning: 'Node is actively being processed',
  },
  {
    state: 'Completed',
    trigger: "status: 'Completed'",
    meaning: 'Node finished executing successfully',
  },
  {
    state: 'Failed',
    trigger: "status: 'Failed'",
    meaning: 'Node encountered an error during execution',
  },
  {
    state: 'Paused',
    trigger: "status: 'Paused'",
    meaning: 'Execution paused at this node (e.g. breakpoint)',
  },
  {
    state: 'Loading',
    trigger: 'data.loading: true',
    meaning: 'Node manifest or metadata is still loading',
  },
  {
    state: 'ActionNeeded',
    trigger: "status: 'ActionNeeded'",
    meaning: 'Process blocked — waiting for human input before continuing',
  },
] as const;

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-foreground"
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <CanvasIcon icon={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      {open && <div className="pb-8">{children}</div>}
    </div>
  );
}

function ExecutionStatesPage({ globalTheme }: { globalTheme: string }) {
  const [expanded, setExpanded] = useState(false);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const [takeActionOpen, setTakeActionOpen] = useState(false);
  const [actionNodeId, setActionNodeId] = useState<string | null>(null);
  const allOpen = anatomyOpen && howToUseOpen && takeActionOpen;
  const toggleAll = () => {
    const next = !allOpen;
    setAnatomyOpen(next);
    setHowToUseOpen(next);
    setTakeActionOpen(next);
  };

  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Execution States</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Execution states reflect a node's runtime status — where it is in the current run. They
          are applied externally via the{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            executionState
          </code>{' '}
          provider, not stored in the node's own data. When no state is provided a node renders in
          its default{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">NotExecuted</code>{' '}
          appearance.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      {/* ── Preview — 90vw centered ── */}
      <div className="pb-8">
        <div className="mx-auto max-w-4xl px-8 mb-4">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Preview</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            All execution states across every shape — rows are states, columns are shapes.
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Note:</strong> This grid shows{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">Failed</code> and{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">ActionNeeded</code>{' '}
            side by side for documentation purposes only. In a real execution these states are
            mutually exclusive — a node cannot be in both at the same time.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-[90vw] h-[560px] overflow-hidden rounded-xl border border-border">
            {!expanded && <ExecutionStatesCanvas onActionNeeded={setActionNodeId} />}
            <ExecutionStatesPreviewButton
              isExpanded={false}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-border"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExecutionStatesCanvas onActionNeeded={setActionNodeId} />
            <ExecutionStatesPreviewButton
              isExpanded={true}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* ── Collapsible sections ── */}
      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* Expand / Collapse all */}
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <CollapsibleSection
          title="Anatomy"
          open={anatomyOpen}
          onToggle={() => setAnatomyOpen((o) => !o)}
        >
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Each state communicates a distinct moment in the execution lifecycle. The visual
            treatment (border color, overlay icon) updates automatically when the provider returns a
            new state.
          </p>

          <div className="mb-8 grid grid-cols-3 gap-4">
            {executionStateCards.map((card) => (
              <div
                key={card.state}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-24 items-center justify-center">
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-lg border-2',
                      card.borderClass,
                      card.bgClass
                    )}
                  >
                    <div className={cn('h-7 w-7 rounded bg-opacity-80', card.iconClass)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{card.state}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
                      {card.value}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Spec table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">State</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    How it is set
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {executionStateRows.map((row) => (
                  <tr key={row.state} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.state}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-primary">{row.trigger}</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Action needed"
          open={takeActionOpen}
          onToggle={() => setTakeActionOpen((o) => !o)}
        >
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            When a node is in the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              ActionNeeded
            </code>{' '}
            state, an "Action needed" pill is surfaced at the top-right of the node to prompt the
            user to unblock execution.{' '}
            <strong className="font-medium text-foreground">
              This pill is only present on flows that are in an executing state
            </strong>{' '}
            — it will not appear during design-time or when no run is active.
          </p>

          <div className="mb-8 grid grid-cols-3 gap-8">
            {/* Always visible */}
            <div className="flex flex-col gap-3">
              <div className="flex h-16 items-center">
                <button
                  type="button"
                  onClick={() => setActionNodeId('state-1-preview')}
                  className="flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-sm transition-colors hover:bg-amber-300"
                >
                  <CanvasIcon icon="flag" size={12} />
                  Action needed
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">Always visible</span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Solid amber pill with flag icon and label, always rendered at the top-right when
                  the node is in{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    ActionNeeded
                  </code>{' '}
                  state. Clicking it triggers the{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    onActionNeeded
                  </code>{' '}
                  callback wired through{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    BaseNodeOverrideConfigProvider
                  </code>
                  .
                </p>
              </div>
            </div>

            {/* TBD: Action response */}
            <div className="flex flex-col gap-3">
              <div className="flex h-16 items-center">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  Action response — not yet defined
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Clicking the pill fires{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    onActionNeeded(nodeId)
                  </code>{' '}
                  — what the app renders in response is a consumer responsibility. The surface
                  (modal, side panel, or inline) and its content model have not yet been specified.
                </p>
              </div>
            </div>

            {/* TBD: Execution count impact */}
            <div className="flex flex-col gap-3">
              <div className="flex h-16 items-center">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  Execution count display — not yet defined
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  It has not yet been specified how{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    ActionNeeded
                  </code>{' '}
                  interacts with the execution count badge (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                    IterationNavigatorPill
                  </code>
                  ). Does the count freeze while blocked? Increment on resolution? Show a distinct
                  state when a count is also present?
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="How to use"
          open={howToUseOpen}
          onToggle={() => setHowToUseOpen((o) => !o)}
        >
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Wire up the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              executionState
            </code>{' '}
            option on{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              withCanvasProviders
            </code>{' '}
            to drive state from outside the node. In stories you can also set{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
              data.executionStatus
            </code>{' '}
            directly as a shorthand.
          </p>

          <div className="flex flex-col gap-4">
            <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
              {`// Via executionState provider (production pattern)
withCanvasProviders({
  executionState: {
    getNodeExecutionState: (nodeId) => {
      // Return state for each node from your runtime source
      return nodeId === 'my-node'
        ? { status: 'InProgress' }
        : { status: 'NotExecuted' };
    },
    getEdgeExecutionState: () => undefined,
  },
})`}
            </pre>
            <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
              {`// Via node data (story / testing shorthand)
createNode({
  id: 'my-node',
  type: 'uipath.blank-node',
  position: { x: 100, y: 100 },
  data: {
    nodeType: 'uipath.blank-node',
    version: '1.0.0',
    executionStatus: 'Completed', // 'NotExecuted' | 'InProgress' | 'Completed' | 'Failed' | 'Paused'
    display: { label: 'My Node', shape: 'square' },
  },
})`}
            </pre>
          </div>
        </CollapsibleSection>
      </div>
      {actionNodeId && (
        <TakeActionModal nodeId={actionNodeId} onClose={() => setActionNodeId(null)} />
      )}
    </div>
  );
}

function SizesStory() {
  const initialNodes = useMemo(() => createSizeGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Sizes"
        description="Node height is decided by the handle count, not the width prop: height is (maxSideHandles * 2 + 2) * 16, with a 96px minimum. Squares and rectangles vary by width at a computed height (96px with default handles). Circles grow 96 to 160px as handles increase (2 to 4 per side), staying round."
      />
    </BaseCanvas>
  );
}

function LabelTooltipsStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'label-tooltip-circle',
        type: 'uipath.manual-trigger',
        position: { x: 160, y: 180 },
        data: {
          nodeType: 'uipath.manual-trigger',
          version: '1.0.0',
          display: {
            label:
              'Customer Intake Trigger With a Very Long Header That Should Clamp Across Multiple Lines and Continue Far Beyond the Visible Node Label Area for Tooltip Testing',
            subLabel:
              'Fallback sublabel tooltip uses this full trigger description when labelTooltip is absent. This deliberately verbose description keeps going long enough to exceed the circular node sublabel clamp, so hover can reveal the complete text for a customer intake process with multiple upstream systems, exception routing, validation notes, and operational metadata.',
            shape: 'circle',
          },
        },
      }),
      createNode({
        id: 'label-tooltip-square',
        type: 'uipath.blank-node',
        position: { x: 440, y: 180 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: {
            label:
              'Quarterly Revenue Reconciliation Approval With Exception Handling Manual Review Regional Overrides Audit Controls and a Name That Intentionally Keeps Going',
            subLabel:
              'Hover this sublabel to verify it becomes the tooltip content without an override. The copy is intentionally extended with enough operational detail to overflow the square node sublabel clamp during visual review, including invoice matching, revenue variance notes, controller approval status, and downstream posting requirements.',
            shape: 'square',
          },
        },
      }),
      {
        ...createNode({
          id: 'label-tooltip-rectangle',
          type: 'uipath.agent',
          position: { x: 720, y: 180 },
          data: {
            nodeType: 'uipath.agent',
            version: '1.0.0',
            display: {
              label:
                'Operations Agent With Long Header Text That Exceeds the Available Rectangle Width by a Wide Margin for Tooltip Testing',
              subLabel:
                'This rectangle sublabel is intentionally long so the smart tooltip can expose the full text after the two-line clamp, including monitoring context, escalation policy, queue ownership, and remediation notes.',
              shape: 'rectangle',
            },
          },
        }),
        width: 184,
        height: 64,
      },
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Label Tooltips"
        description="Hover the truncated node labels and sublabels. No labelTooltip override is provided, so each tooltip should use the corresponding label or sublabel text."
      />
    </BaseCanvas>
  );
}

/**
 * Story-only manifest with `repeat` expressions and templated labels so the
 * DynamicHandles story can demonstrate manifest-level dynamic handle features.
 *
 * The shared `defaultWorkflowManifest` deliberately keeps the production
 * `uipath.control-flow.switch` / `uipath.control-flow.decision` manifests
 * static (no repeat, no template strings), so the story registers its own
 * fictional `uipath.control-switch` / `uipath.decision` types that the
 * `manifest-resolver` can expand.
 */
const dynamicHandlesManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    {
      id: 'control',
      name: 'Control Flow',
      sortOrder: 1,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'git-branch',
      tags: [],
    },
  ],
  nodes: [
    {
      nodeType: 'uipath.control-switch',
      version: '1.0.0',
      category: 'control',
      tags: ['dynamic', 'repeat'],
      sortOrder: 1,
      display: {
        label: 'Dynamic Handle Node',
        icon: 'switch',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'input-{index}',
              type: 'target',
              handleType: 'input',
              label: '{item.label}',
              repeat: 'inputs.dynamicInputs',
            },
          ],
        },
        {
          position: 'right',
          handles: [
            {
              id: 'output-{index}',
              type: 'source',
              handleType: 'output',
              label: '{item.name}',
              repeat: 'inputs.dynamicOutputs',
            },
            {
              id: 'default',
              type: 'source',
              handleType: 'output',
              label: 'Default Output',
              visible: 'inputs.hasDefault',
            },
          ],
        },
      ],
    },
    {
      nodeType: 'uipath.decision',
      version: '1.0.0',
      category: 'control',
      tags: ['control', 'decision'],
      sortOrder: 2,
      display: {
        label: 'Decision',
        icon: 'decision',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        },
        {
          position: 'right',
          handles: [
            { id: 'true', type: 'source', handleType: 'output', label: '{inputs.trueLabel}' },
            { id: 'false', type: 'source', handleType: 'output', label: '{inputs.falseLabel}' },
          ],
        },
      ],
    },
    {
      nodeType: 'uipath.hover-labels',
      version: '1.0.0',
      category: 'control',
      tags: ['handle', 'label'],
      sortOrder: 3,
      display: {
        label: 'Hover Labels',
        icon: 'tag',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'right',
          handles: [
            {
              id: 'out-hover',
              type: 'source',
              handleType: 'output',
              label: 'Hover label',
              labelVisibility: 'hover',
            },
            {
              id: 'out-always',
              type: 'source',
              handleType: 'output',
              label: 'Always label',
              labelVisibility: 'always',
            },
          ],
        },
      ],
    },
    {
      nodeType: 'uipath.hover-sink',
      version: '1.0.0',
      category: 'control',
      tags: ['handle'],
      sortOrder: 4,
      display: {
        label: 'Sink',
        shape: 'circle',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            { id: 'sink-hover', type: 'target', handleType: 'input' },
            { id: 'sink-always', type: 'target', handleType: 'input' },
          ],
        },
      ],
    },
  ],
};

function DynamicHandlesStory() {
  const [switchData, setSwitchData] = useState({
    dynamicInputs: [
      { label: 'Primary Input' },
      { label: 'Secondary Input' },
      { label: 'Tertiary Input' },
    ],
    dynamicOutputs: [{ name: 'Success Path' }, { name: 'Failure Path' }],
    hasDefault: false,
  });

  const [decisionData, setDecisionData] = useState({
    trueLabel: 'Approved',
    falseLabel: 'Rejected',
  });

  const initialNodes = useMemo(() => {
    return [
      {
        ...createNode({
          id: 'dynamic-handles-node',
          type: 'uipath.control-switch',
          position: { x: 700, y: 200 },
          data: {
            nodeType: 'uipath.control-switch',
            version: '1.0.0',
            inputs: {
              dynamicInputs: switchData.dynamicInputs,
              dynamicOutputs: switchData.dynamicOutputs,
              hasDefault: switchData.hasDefault,
            },
            display: {
              label: 'Dynamic Handles',
              subLabel: `${switchData.dynamicInputs.length} inputs, ${switchData.dynamicOutputs.length} outputs`,
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
      {
        ...createNode({
          id: 'decision-node',
          type: 'uipath.decision',
          position: { x: 700, y: 600 },
          data: {
            nodeType: 'uipath.decision',
            version: '1.0.0',
            inputs: {
              trueLabel: decisionData.trueLabel,
              falseLabel: decisionData.falseLabel,
            },
            display: {
              label: 'Decision',
              subLabel: 'Templated labels',
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
      {
        ...createNode({
          id: 'hover-labels-node',
          type: 'uipath.hover-labels',
          position: { x: 1150, y: 200 },
          data: {
            nodeType: 'uipath.hover-labels',
            version: '1.0.0',
            display: {
              label: 'Hover Labels',
              subLabel: 'Hover to toggle labels',
              shape: 'square',
            },
          },
        }),
        height: 96,
        width: 96,
      },
      {
        ...createNode({
          id: 'hover-sink-node',
          type: 'uipath.hover-sink',
          position: { x: 1550, y: 230 },
          data: {
            nodeType: 'uipath.hover-sink',
            version: '1.0.0',
            display: {
              label: 'Sink',
              shape: 'circle',
            },
          },
        }),
        height: 48,
        width: 48,
      },
    ];
  }, [switchData, decisionData]);

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'e-hover',
        source: 'hover-labels-node',
        sourceHandle: 'out-hover',
        target: 'hover-sink-node',
        targetHandle: 'sink-hover',
      },
      {
        id: 'e-always',
        source: 'hover-labels-node',
        sourceHandle: 'out-always',
        target: 'hover-sink-node',
        targetHandle: 'sink-always',
      },
    ],
    []
  );

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes, initialEdges });

  // Sync switch node data when controls change
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === 'dynamic-handles-node') {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: {
                dynamicInputs: switchData.dynamicInputs,
                dynamicOutputs: switchData.dynamicOutputs,
                hasDefault: switchData.hasDefault,
              },
              display: {
                ...(node.data.display || {}),
                subLabel: `${switchData.dynamicInputs.length} inputs, ${switchData.dynamicOutputs.length} outputs`,
              },
            },
          };
        }
        if (node.id === 'decision-node') {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: {
                trueLabel: decisionData.trueLabel,
                falseLabel: decisionData.falseLabel,
              },
            },
          };
        }
        return node;
      })
    );
  }, [switchData, decisionData, setNodes]);

  const handleInputCount = useCallback((value: number[]) => {
    const count = value[0] ?? 0;
    setSwitchData((prev) => {
      const current = prev.dynamicInputs;
      if (count > current.length) {
        const added = Array.from({ length: count - current.length }, (_, i) => ({
          label: `Input ${current.length + i + 1}`,
        }));
        return { ...prev, dynamicInputs: [...current, ...added] };
      }
      return { ...prev, dynamicInputs: current.slice(0, count) };
    });
  }, []);

  const handleOutputCount = useCallback((value: number[]) => {
    const count = value[0] ?? 0;
    setSwitchData((prev) => {
      const current = prev.dynamicOutputs;
      if (count > current.length) {
        const added = Array.from({ length: count - current.length }, (_, i) => ({
          name: `Output ${current.length + i + 1}`,
        }));
        return { ...prev, dynamicOutputs: [...current, ...added] };
      }
      return { ...prev, dynamicOutputs: current.slice(0, count) };
    });
  }, []);

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Handles"
        description={
          <>
            Demonstrates repeat expressions (dynamic handle count) and templated handle labels.
            <br />
            The Hover Labels node uses labelVisibility: hover, so its label shows only while the
            node is hovered or selected, while the Always label stays on.
          </>
        }
      >
        <Column gap={20}>
          <Column gap={12}>
            <Label className="font-semibold">Switch Node — Repeat Handles</Label>
            <Column gap={6} align="flex-start">
              <Label>Inputs ({switchData.dynamicInputs.length})</Label>
              <Slider
                value={[switchData.dynamicInputs.length]}
                onValueChange={handleInputCount}
                min={0}
                max={10}
                step={1}
              />
            </Column>
            <Column gap={6} align="flex-start">
              <Label>Outputs ({switchData.dynamicOutputs.length})</Label>
              <Slider
                value={[switchData.dynamicOutputs.length]}
                onValueChange={handleOutputCount}
                min={0}
                max={10}
                step={1}
              />
            </Column>
            <div className="flex items-center gap-2">
              <Switch
                checked={switchData.hasDefault}
                onCheckedChange={(checked) =>
                  setSwitchData((prev) => ({ ...prev, hasDefault: checked }))
                }
              />
              <Label>Has Default Output</Label>
            </div>
          </Column>

          <Column gap={12}>
            <Label className="font-semibold">Decision Node — Templated Labels</Label>
            <Column gap={6} align="flex-start">
              <Label>True Label</Label>
              <Input
                value={decisionData.trueLabel}
                onChange={(e) =>
                  setDecisionData((prev) => ({ ...prev, trueLabel: e.target.value }))
                }
              />
            </Column>
            <Column gap={6} align="flex-start">
              <Label>False Label</Label>
              <Input
                value={decisionData.falseLabel}
                onChange={(e) =>
                  setDecisionData((prev) => ({ ...prev, falseLabel: e.target.value }))
                }
              />
            </Column>
          </Column>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSwitchData({
                dynamicInputs: [{ label: 'Primary Input' }],
                dynamicOutputs: [{ name: 'Success Path' }],
                hasDefault: false,
              });
              setDecisionData({ trueLabel: 'Approved', falseLabel: 'Rejected' });
            }}
          >
            Reset All
          </Button>
        </Column>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Shapes: Story = {
  name: 'Shapes',
  render: (_, { globals }) => <ShapesPage globalTheme={globals.theme || 'future-dark'} />,
};

export const ExecutionStates: Story = {
  name: 'Execution States',
  render: (_, { globals }) => <ExecutionStatesPage globalTheme={globals.theme || 'future-dark'} />,
};

export const Sizes: Story = {
  name: 'Sizes',
  // Register the story-only proportional square/circle types (see sizeGridManifest).
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={sizeGridManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <SizesStory />,
};

export const LabelTooltips: Story = {
  name: 'Label Tooltips',
  render: () => <LabelTooltipsStory />,
};

export const Handles: Story = {
  name: 'Handles',
  // Story-level decorator wraps innermost, shadowing the registry installed by
  // the meta-level `withCanvasProviders()`. This lets us register the
  // story-only `uipath.control-switch` / `uipath.decision` manifests that
  // declare `repeat` expressions and templated labels.
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={dynamicHandlesManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <DynamicHandlesStory />,
};

// ============================================================================
// Validation States Story
// ============================================================================

const VALIDATION_SEVERITIES = ['WARNING', 'ERROR', 'CRITICAL'] as const;

const validationMessages: Record<string, string> = {
  WARNING: 'Trigger should be connected to at least one node',
  ERROR: 'URL is required',
  CRITICAL: 'Node configuration is invalid',
};

/**
 * Creates a grid of nodes showing validation states across shapes.
 */
function createValidationGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  VALIDATION_SEVERITIES.forEach((severity, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `validation-${shape}-${severity}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            display: {
              label: shape,
              subLabel: severity,
              shape,
            },
          },
        })
      );
    });
  });

  return nodes;
}

function ValidationStatesStory() {
  const initialNodes = useMemo(() => createValidationGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Validation States"
        description="Grid showing warning, error, and critical validation badges across shapes. Warnings show a yellow badge only (no border). Errors/critical show a red badge."
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Adornments Story
// ============================================================================

/**
 * Adornment configurations for the grid.
 * Each row demonstrates a different adornment position/type.
 */
const ADORNMENT_ROWS = [
  { key: 'breakpoint', label: 'Breakpoint (top-left)' },
  { key: 'status-completed', label: 'Status: Completed (top-right)' },
  { key: 'status-inprogress', label: 'Status: InProgress (top-right)' },
  { key: 'status-failed', label: 'Status: Failed (top-right)' },
  { key: 'start-point', label: 'Start Point (bottom-left)' },
  { key: 'square-dashed', label: 'Square Dashed (bottom-right)' },
  { key: 'all', label: 'All Adornments' },
  { key: 'multi-exec', label: 'Multi-execution (count: 5)' },
] as const;

/**
 * Creates nodes demonstrating all adornment types across shapes.
 */
function createAdornmentGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  ADORNMENT_ROWS.forEach((row, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      nodes.push(
        createNode({
          id: `adorn-${row.key}-${shape}`,
          type: nodeType,
          position: {
            x: GRID_CONFIG.startX + colIndex * GRID_CONFIG.gapX,
            y: GRID_CONFIG.startY + rowIndex * GRID_CONFIG.gapY,
          },
          data: {
            nodeType,
            version: '1.0.0',
            display: {
              label: shape,
              subLabel: row.label,
              shape,
            },
          },
        })
      );
    });
  });

  return nodes;
}

/**
 * Maps adornment row keys to execution states.
 */
function getAdornmentExecutionState(key: string) {
  switch (key) {
    case 'breakpoint':
      return { status: 'None' as const, debug: true };
    case 'status-completed':
      return { status: 'Completed' as const };
    case 'status-inprogress':
      return { status: 'InProgress' as const };
    case 'status-failed':
      return { status: 'Failed' as const };
    case 'start-point':
      return { status: 'None' as const, isExecutionStartPoint: true };
    case 'square-dashed':
      return { status: 'None' as const, isOutputPinned: true };
    case 'all':
      return {
        status: 'Completed' as const,
        debug: true,
        isExecutionStartPoint: true,
        isOutputPinned: true,
      };
    case 'multi-exec':
      return { status: 'Completed' as const, count: 5 };
    default:
      return undefined;
  }
}

function AdornmentsStory() {
  const initialNodes = useMemo(() => createAdornmentGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Adornments"
        description="Grid showing all adornment types across shapes. Each row demonstrates a different adornment: breakpoint (top-left), execution status (top-right), execution start point (bottom-left), square dashed (bottom-right), and all combined."
      />
    </BaseCanvas>
  );
}

export const Adornments: Story = {
  name: 'Adornments',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => {
          // Extract the adornment key from node IDs like "adorn-breakpoint-circle"
          const parts = nodeId.split('-');
          // Rejoin all parts between first and last to get the key (handles keys with dashes)
          const key = parts.slice(1, -1).join('-');
          return getAdornmentExecutionState(key);
        },
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <AdornmentsStory />,
};

// ============================================================================
// Stacked Treatment Story (drillable / collapsed)
// ============================================================================

/**
 * Story-only manifest registering a drillable agent type, so we can demo the
 * `drillable` branch of the stacked treatment without touching the shared
 * default manifests.
 */
const stackedManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    ...allCategoryManifests,
    {
      id: 'agents',
      name: 'Agents',
      sortOrder: 1,
      color: '#7c3aed',
      colorDark: '#8b5cf6',
      icon: 'robot',
      tags: [],
    },
  ],
  nodes: [
    ...allNodeManifests,
    {
      nodeType: 'uipath.agent.drillable',
      version: '1.0.0',
      category: 'agents',
      tags: ['agent'],
      sortOrder: 1,
      drillable: true,
      display: {
        label: 'Drillable Agent',
        icon: 'agent',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        },
        {
          position: 'right',
          handles: [{ id: 'output', type: 'source', handleType: 'output' }],
        },
      ],
    },
  ],
};

function StackedTreatmentStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'plain',
        type: 'uipath.blank-node',
        position: { x: 96, y: 200 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Plain', subLabel: 'No treatment', shape: 'square' },
        },
      }),
      createNode({
        id: 'drillable',
        type: 'uipath.agent.drillable',
        position: { x: 320, y: 200 },
        data: {
          nodeType: 'uipath.agent.drillable',
          version: '1.0.0',
          display: { label: 'Drillable', subLabel: 'manifest.drillable', shape: 'square' },
        },
      }),
      createNode({
        id: 'collapsed',
        type: 'uipath.blank-node',
        position: { x: 544, y: 200 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Collapsed', subLabel: 'data.isCollapsed', shape: 'square' },
          isCollapsed: true,
        },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Stacked Treatment"
        description="Drillable (manifest) and collapsed (instance data) nodes render a decorative stacked layer behind the card. The effect is purely visual — node dimensions and hit area are unchanged."
      />
    </BaseCanvas>
  );
}

export const StackedTreatment: Story = {
  name: 'Stacked Treatment',
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={stackedManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <StackedTreatmentStory />,
};

// ============================================================================
// canvasLabel Resolution Story
// ============================================================================

/**
 * Story-only manifest with two node types: one declaring both `label` (palette)
 * and `canvasLabel` (canvas), one declaring only `label`. Used to demo the
 * precedence in `resolveDisplay`:
 * instance.canvasLabel > instance.label > manifest.canvasLabel > manifest.label.
 */
const canvasLabelManifest: { nodes: NodeManifest[]; categories: CategoryManifest[] } = {
  categories: [
    ...allCategoryManifests,
    {
      id: 'communications',
      name: 'Communications',
      sortOrder: 99,
      color: '#3b82f6',
      colorDark: '#60a5fa',
      icon: 'agent',
      tags: [],
    },
  ],
  nodes: [
    ...allNodeManifests,
    {
      nodeType: 'uipath.send-outlook-email',
      version: '1.0.0',
      category: 'communications',
      tags: ['email', 'outlook'],
      sortOrder: 1,
      display: {
        label: 'Send Outlook 365 Email',
        canvasLabel: 'Send Email',
        icon: 'agent',
        shape: 'rectangle',
      },
      handleConfiguration: [
        { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
        { position: 'right', handles: [{ id: 'output', type: 'source', handleType: 'output' }] },
      ],
    },
    {
      nodeType: 'uipath.long-decision',
      version: '1.0.0',
      category: 'communications',
      tags: ['decision'],
      sortOrder: 2,
      display: {
        label: 'Long Decision Without canvasLabel',
        icon: 'agent',
        shape: 'rectangle',
      },
      handleConfiguration: [
        { position: 'left', handles: [{ id: 'input', type: 'target', handleType: 'input' }] },
        { position: 'right', handles: [{ id: 'output', type: 'source', handleType: 'output' }] },
      ],
    },
  ],
};

function CanvasLabelStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'with-canvaslabel',
        type: 'uipath.send-outlook-email',
        position: { x: 96, y: 160 },
        data: {
          nodeType: 'uipath.send-outlook-email',
          version: '1.0.0',
          display: { shape: 'rectangle', subLabel: 'manifest.canvasLabel wins' },
        },
      }),
      createNode({
        id: 'without-canvaslabel',
        type: 'uipath.long-decision',
        position: { x: 96, y: 320 },
        data: {
          nodeType: 'uipath.long-decision',
          version: '1.0.0',
          display: {
            shape: 'rectangle',
            subLabel: 'falls back to manifest.label since canvasLabel is not defined',
          },
        },
      }),
      createNode({
        id: 'instance-rename',
        type: 'uipath.send-outlook-email',
        position: { x: 96, y: 480 },
        data: {
          nodeType: 'uipath.send-outlook-email',
          version: '1.0.0',
          display: {
            shape: 'rectangle',
            canvasLabel: 'Notify Ops Team',
            subLabel: 'instance.canvasLabel overrides manifest.canvasLabel',
          },
        },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Label Resolution"
        description={
          'Three instances of the same canvas, exercising the precedence ' +
          'instance.canvasLabel > instance.label > manifest.canvasLabel > ' +
          'manifest.label resolved by resolveDisplay(). Top: manifest declares ' +
          'both label ("Send Outlook 365 Email") and canvasLabel ("Send Email") ' +
          '— canvas renders the short canvasLabel. Middle: manifest declares ' +
          'only label — canvas falls back to it. Bottom: instance.canvasLabel ' +
          'is set to "Notify Ops Team" — explicit canvas-side override beats ' +
          'manifest.canvasLabel.'
        }
      />
    </BaseCanvas>
  );
}

export const LabelResolution: Story = {
  name: 'Label Resolution',
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={canvasLabelManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <CanvasLabelStory />,
};

export const ValidationStates: Story = {
  name: 'Validation States',
  decorators: [
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: () => undefined,
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: (elementId: string) => {
          const severity = elementId.split('-').pop() as string;
          if (!['WARNING', 'ERROR', 'CRITICAL'].includes(severity)) return undefined;
          return {
            validationStatus: severity as ValidationErrorSeverity,
            validationError: {
              code: `VALIDATION_${severity}`,
              message: validationMessages[severity] ?? `Validation ${severity.toLowerCase()}`,
              description: validationMessages[severity] ?? `Validation ${severity.toLowerCase()}`,
              severity: severity as ValidationErrorSeverity,
            },
          };
        },
      },
    }),
  ],
  render: () => <ValidationStatesStory />,
};
