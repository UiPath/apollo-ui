import type { Meta, StoryObj } from '@storybook/react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, Input, Label, Slider, Switch } from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import type { CategoryManifest, NodeManifest } from '../../schema';
import {
  allCategoryManifests,
  allNodeManifests,
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  useNodeTypesFromRegistry,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { ValidationErrorSeverity } from '../../types/validation';
import {
  AdornmentResolverProvider,
  BreakpointIndicator,
  ExecutionStartPointIndicator,
  ExecutionStatusIndicator,
  SquareDashedIndicator,
  ValidationErrorIndicator,
  ValidationWarningIndicator,
} from '../../utils/adornment-resolver';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import type { BaseNodeData, NodeAdornments, NodeStatusContext } from './BaseNode.types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodeInspector } from '../NodeInspector';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<BaseNodeData> = {
  title: 'Components/BaseNode V2',
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
const STATUSES = ['NotExecuted', 'InProgress', 'Completed', 'Failed', 'Paused'] as const;

const GRID_CONFIG = {
  startX: 96,
  startY: 96,
  gapX: 192,
  gapY: 159,
};

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

const SQUARE_SIZES = [48, 64, 80, 96, 112, 128] as const;
const RECTANGLE_CONFIGS = [
  { width: 128, height: 48 },
  { width: 160, height: 64 },
  { width: 192, height: 80 },
  { width: 256, height: 96 },
  { width: 320, height: 112 },
] as const;

function createSizeGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];
  let xOffset = 96;

  SQUARE_SIZES.forEach((size) => {
    nodes.push({
      ...createNode({
        id: `sq-${size}`,
        type: 'uipath.blank-node',
        position: { x: xOffset, y: 96 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: String(size), shape: 'square' },
        },
      }),
      width: size,
      height: size,
    });
    xOffset += size + 32;
  });

  xOffset = 96;
  SQUARE_SIZES.forEach((size) => {
    nodes.push({
      ...createNode({
        id: `c-${size}`,
        type: 'uipath.blank-node',
        position: { x: xOffset, y: 272 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: String(size), shape: 'circle' },
        },
      }),
      width: size,
      height: size,
    });
    xOffset += size + 32;
  });

  let rectX = 96;
  let rectY = 448;
  RECTANGLE_CONFIGS.forEach(({ width, height }, index) => {
    nodes.push({
      ...createNode({
        id: `r-${index}`,
        type: 'uipath.agent',
        position: { x: rectX, y: rectY },
        data: {
          nodeType: 'uipath.agent',
          version: '1.0.0',
          display: { label: `${width}×${height}`, shape: 'rectangle' },
        },
      }),
      width,
      height,
    });

    rectX += width + 32;
    if (index === 2) {
      rectX = 96;
      rectY = 560;
    }
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createShapeStatusGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="BaseNode V2 — Shapes & States"
        description="Grid showing circle, square, and rectangle shapes with execution states."
      />
    </BaseCanvas>
  );
}

function CustomizedSizesStory() {
  const initialNodes = useMemo(() => createSizeGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Customized Sizes"
        description="Nodes with various dimensions aligned to 16px grid."
      />
    </BaseCanvas>
  );
}

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
    ];
  }, [switchData, decisionData]);

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes });

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
        title="Dynamic Handles"
        description="Demonstrates repeat expressions (dynamic handle count) and templated handle labels."
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
// Anatomy Story — full-page documentation layout
// ============================================================================

const SHAPE_DOCS = [
  {
    label: 'Circle',
    icon: 'repeat',
    usage: 'Trigger / start nodes',
    code: 'shape: "circle"',
    borderRadius: '50%',
    size: { width: 64, height: 64 },
  },
  {
    label: 'Square',
    icon: 'agent',
    usage: 'Standard action nodes',
    code: 'shape: "square"',
    borderRadius: 16,
    size: { width: 64, height: 64 },
  },
  {
    label: 'Rectangle',
    icon: 'agent',
    usage: 'Agent / wide nodes',
    code: 'shape: "rectangle"',
    borderRadius: 16,
    size: { width: 96, height: 64 },
  },
] as const;

const SLOT_DOCS = [
  { slot: 'topLeft',     dot: 'bg-red-500',     rule: 'Breakpoint',                    detail: 'Debug mode — pauses execution at this node.' },
  { slot: 'topRight',    dot: 'bg-emerald-500',  rule: 'Status › Validation error › Warning', detail: 'First matching state wins. Clears when execution ends.' },
  { slot: 'bottomLeft',  dot: 'bg-blue-500',     rule: 'Execution start point',         detail: 'Marks the entry node for the current run.' },
  { slot: 'bottomRight', dot: 'bg-amber-500',    rule: 'Loop count (> 1) › Output pinned', detail: 'Loop count takes priority when both are active.' },
] as const;

function AnatomyStory() {
  return (
    <div className="min-h-screen overflow-y-auto px-8 py-12 text-foreground">
      <div className="mx-auto max-w-4xl" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BaseNode Anatomy</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted">
            BaseNode renders in three shapes. Four 20×20 px adornment slots sit at each corner of the
            node — each with a defined priority chain that determines what content to show.
          </p>
        </div>

        <div className="h-px bg-border" />

        {/* ── Shapes ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 className="text-base font-semibold">Shapes</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Controlled by <code className="rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-xs">display.shape</code> on
              the node data or manifest. All shapes share the same slot anatomy.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {SHAPE_DOCS.map(({ label, icon, usage, code, borderRadius, size }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6"
              >
                <div
                  className="flex shrink-0 items-center justify-center bg-surface-overlay border border-border"
                  style={{ ...size, borderRadius }}
                >
                  <CanvasIcon icon={icon} size={28} color="var(--color-foreground-de-emp)" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="mt-0.5 text-xs text-foreground-muted">{usage}</div>
                </div>
                <code className="rounded bg-surface-overlay px-2 py-0.5 font-mono text-[11px] text-foreground-muted">
                  {code}
                </code>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── Adornment Slots ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 className="text-base font-semibold">Adornment Slots</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Four 20×20 px slots at each corner. Each slot runs its priority chain and renders the
              first matching condition. Two placement options are under consideration.
            </p>
          </div>

          {/* Option A / Option B comparison */}
          <div className="flex flex-col gap-6">

            {/* Option A — inside border */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <div>
                <h3 className="text-sm font-semibold">Option A — Inside border</h3>
                <ul className="mt-1.5 space-y-1 text-[12px]">
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-emerald-500">✓</span><span className="text-foreground-muted">Never overflows node bounds — safe for dense canvas layouts where nodes sit close together.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-emerald-500">✓</span><span className="text-foreground-muted">Predictable hit area — all interactions stay within the node boundary.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-red-400">✗</span><span className="text-foreground-muted">Competes with node content near corners, reducing usable space.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-red-400">✗</span><span className="text-foreground-muted">Badge can visually merge with the node background, reducing contrast.</span></li>
                </ul>
              </div>
              <div className="flex flex-1 items-center justify-center py-6">
                <div className="flex items-center gap-10">
                  {/* Left labels */}
                  <div className="flex flex-col gap-10">
                    {SLOT_DOCS.filter((_, i) => i % 2 === 0).map(({ slot, dot, rule }) => (
                      <div key={slot} className="flex items-center justify-end gap-2.5">
                        <div className="text-right">
                          <div className="font-mono text-xs font-semibold">{slot}</div>
                          <div className="text-[11px] text-foreground-muted">{rule}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-px w-6 bg-border" />
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Node mock — inset 6px */}
                  <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                    <div className="flex h-full w-full items-center justify-center border border-border bg-surface-overlay" style={{ borderRadius: 32 }}>
                      <div className="flex items-center justify-center bg-surface" style={{ width: 80, height: 80, borderRadius: 24 }}>
                        <CanvasIcon icon="agent" size={40} color="var(--color-foreground-de-emp)" />
                      </div>
                    </div>
                    <div className="absolute flex items-center justify-center" style={{ top: 6, left: 6, width: 20, height: 20 }}><BreakpointIndicator /></div>
                    <div className="absolute flex items-center justify-center" style={{ top: 6, right: 6, width: 20, height: 20 }}><ExecutionStatusIcon status="Completed" /></div>
                    <div className="absolute flex items-center justify-center" style={{ bottom: 6, left: 6, width: 20, height: 20 }}><ExecutionStartPointIndicator /></div>
                    <div className="absolute" style={{ bottom: 6, right: 6, width: 20, height: 20 }}><LoopCountPill count={3} /></div>
                  </div>
                  {/* Right labels */}
                  <div className="flex flex-col gap-10">
                    {SLOT_DOCS.filter((_, i) => i % 2 !== 0).map(({ slot, dot, rule }) => (
                      <div key={slot} className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                          <div className="h-px w-6 bg-border" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-semibold">{slot}</div>
                          <div className="text-[11px] text-foreground-muted">{rule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Option B — on border (50/50) */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <div>
                <h3 className="text-sm font-semibold">Option B — On border</h3>
                <ul className="mt-1.5 space-y-1 text-[12px]">
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-emerald-500">✓</span><span className="text-foreground-muted">Familiar notification badge pattern — immediately recognisable to most users.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-emerald-500">✓</span><span className="text-foreground-muted">Pops clearly against both the node background and the canvas — stronger contrast.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-red-400">✗</span><span className="text-foreground-muted">Extends slightly outside node bounds — may overlap adjacent nodes or edges at tight spacing.</span></li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-red-400">✗</span><span className="text-foreground-muted">Canvas layout needs to account for the overflow margin around each node.</span></li>
                </ul>
              </div>
              <div className="flex flex-1 items-center justify-center py-6">
                <div className="flex items-center gap-10">
                  {/* Left labels */}
                  <div className="flex flex-col gap-10">
                    {SLOT_DOCS.filter((_, i) => i % 2 === 0).map(({ slot, dot, rule }) => (
                      <div key={slot} className="flex items-center justify-end gap-2.5">
                        <div className="text-right">
                          <div className="font-mono text-xs font-semibold">{slot}</div>
                          <div className="text-[11px] text-foreground-muted">{rule}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-px w-6 bg-border" />
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Node mock — on border (-10px = -½ × 20px slot size) */}
                  <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                    <div className="flex h-full w-full items-center justify-center border border-border bg-surface-overlay" style={{ borderRadius: 32 }}>
                      <div className="flex items-center justify-center bg-surface" style={{ width: 80, height: 80, borderRadius: 24 }}>
                        <CanvasIcon icon="agent" size={40} color="var(--color-foreground-de-emp)" />
                      </div>
                    </div>
                    <div className="absolute flex items-center justify-center" style={{ top: -1, left: -1, width: 20, height: 20 }}><BreakpointIndicator /></div>
                    <div className="absolute flex items-center justify-center" style={{ top: -1, right: -1, width: 20, height: 20 }}><ExecutionStatusIcon status="Completed" /></div>
                    <div className="absolute flex items-center justify-center" style={{ bottom: -1, left: -1, width: 20, height: 20 }}><ExecutionStartPointIndicator /></div>
                    <div className="absolute" style={{ bottom: -1, right: -1, width: 20, height: 20 }}><LoopCountPill count={3} /></div>
                  </div>
                  {/* Right labels */}
                  <div className="flex flex-col gap-10">
                    {SLOT_DOCS.filter((_, i) => i % 2 !== 0).map(({ slot, dot, rule }) => (
                      <div key={slot} className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                          <div className="h-px w-6 bg-border" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-semibold">{slot}</div>
                          <div className="text-[11px] text-foreground-muted">{rule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Key trade-off callout */}
          <div className="rounded-xl border border-border bg-surface-overlay px-5 py-4 text-[12px] text-foreground-muted">
            <span className="font-semibold text-foreground">Key trade-off — </span>
            Option A is the safer choice when canvas nodes are densely packed, since badges never stray outside the node boundary. Option B is more visually distinct and follows a pattern users already recognise from notification systems, but requires the canvas layout to reserve a small overflow margin around each node to avoid clipping into neighbours.
          </div>

          {/* Reference table */}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-overlay">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Priority chain</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SLOT_DOCS.map(({ slot, dot, rule, detail }, i) => (
                  <tr key={slot} className={i < SLOT_DOCS.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                        <code className="font-mono text-xs font-semibold">{slot}</code>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{rule}</td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── V2 Iterations ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h2 className="text-base font-semibold">V2 Iterations</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Improvements introduced in the V2 prototype. All changes are scoped to BaseNode V2
              only — the original BaseNode story is unaffected.
            </p>
          </div>

          {/* Subsection: Loop Count Pill */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="text-sm font-semibold">Loop Count Badge</h3>
            <p className="text-sm text-foreground-muted">
              The <code className="rounded bg-surface-overlay px-1 font-mono text-xs">↻ N</code> badge
              shows how many times this node has executed. For a node inside a loop, N equals the
              number of loop iterations completed — it increments by 1 after each iteration.
              The badge only appears when N &gt; 1.
            </p>

            {/* V1 vs V2 comparison */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start gap-12">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">V1 — count inline</div>
                  <div className="flex items-center gap-1">
                    <span className="pr-0.5 text-sm font-semibold" style={{ color: 'var(--color-foreground-emp)' }}>3</span>
                    <ExecutionStatusIcon status="Completed" />
                  </div>
                  <p className="text-[11px] leading-tight text-foreground-muted">Count prefixes the status icon. Both pieces of information share one slot.</p>
                </div>

                <div className="self-stretch w-px bg-border" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">V2 — dedicated slots</div>
                  <div className="flex items-end gap-4">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <ExecutionStatusIcon status="Completed" />
                      <span className="text-[10px] text-foreground-muted">topRight</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <LoopCountPill count={3} />
                      <span className="text-[10px] text-foreground-muted">bottomRight</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-tight text-foreground-muted">Status and count each occupy their own corner slot — both visible simultaneously.</p>
                </div>
              </div>
            </div>

            {/* Reference table */}
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-overlay">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { prop: 'Badge',            value: '↻ repeat icon + count number' },
                    { prop: 'Slot',             value: 'bottomRight adornment' },
                    { prop: 'Visible when',     value: 'count > 1' },
                    { prop: 'What N means',     value: 'Times this node has run — one per completed loop iteration' },
                    { prop: 'Tooltip',          value: '"Executed N times"' },
                    { prop: 'Priority',         value: 'Overrides the output-pinned badge when both are active' },
                  ] as const).map(({ prop, value }, i, arr) => (
                    <tr key={prop} className={i < arr.length - 1 ? 'border-b border-border' : ''}>
                      <td className="px-4 py-3"><code className="font-mono text-xs font-semibold">{prop}</code></td>
                      <td className="px-4 py-3 text-xs text-foreground-muted">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* ── Action Needed ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 className="text-base font-semibold">Action Needed</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              A new execution state where the node requires human input before the process can
              continue. Visually borrows from the Pause palette (amber/<code className="rounded bg-surface-overlay px-1 font-mono text-xs">--color-warning-icon</code>) to
              signal a temporary halt that needs attention rather than an error.
            </p>
          </div>

          {/* Visual preview */}
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6">

            <div className="grid grid-cols-2 gap-8">

              {/* Adornment slot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Adornment slot — top-right</div>
                <div className="flex items-center gap-3">
                  <span
                    className="flex shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ width: 20, height: 20, backgroundColor: 'var(--color-warning-icon)' }}
                  >
                    <CanvasIcon icon="hand" size={12} color="#451a03" />
                  </span>
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    Same corner slot as the standard execution status icon. Amber color matches
                    Pause — both signal a voluntary stop waiting for intervention.
                  </p>
                </div>
              </div>

              {/* Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Action button — below node</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[12px] font-semibold text-amber-950 shadow-sm"
                  >
                    <CanvasIcon icon="hand" size={12} />
                    Take Action
                  </button>
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    Floats 8 px below the node. Dark text on amber satisfies WCAG AA contrast.
                    Clicking opens the action dialog.
                  </p>
                </div>
              </div>

            </div>

            {/* Node mock */}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Full appearance — node + adornment + button</div>
              <div className="flex items-start justify-center gap-16 py-4">
                {[
                  { shape: 'circle', borderRadius: '50%', width: 56, height: 56 },
                  { shape: 'square', borderRadius: 12, width: 56, height: 56 },
                  { shape: 'rectangle', borderRadius: 12, width: 96, height: 56 },
                ].map(({ shape, borderRadius, width, height }) => (
                  <div key={shape} className="flex flex-col items-center gap-2">
                    <div className="relative" style={{ width, height }}>
                      {/* Node body */}
                      <div
                        className="absolute inset-0 border-2 border-amber-400/50 bg-surface shadow-sm"
                        style={{ borderRadius }}
                      />
                      {/* Node icon placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-4 w-4 rounded bg-foreground-muted/20" />
                      </div>
                      {/* Top-right adornment — amber circle with white hand icon */}
                      <span
                        className="absolute flex items-center justify-center rounded-full shadow-sm"
                        style={{ top: -6, right: -6, width: 16, height: 16, backgroundColor: 'var(--color-warning-icon)' }}
                      >
                        <CanvasIcon icon="hand" size={10} color="#451a03" />
                      </span>
                    </div>
                    {/* Button below */}
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950 shadow-sm"
                    >
                      <CanvasIcon icon="hand" size={10} />
                      Take Action
                    </button>
                    <span className="text-[10px] text-foreground-muted">{shape}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Design notes */}
          <div className="rounded-xl border border-border bg-surface-overlay px-5 py-4 text-[12px] text-foreground-muted space-y-2">
            <p><span className="font-semibold text-foreground">Color — </span>Amber reuses <code className="rounded bg-surface px-1 font-mono text-[10px]">--color-warning-icon</code>, matching the Pause state. This creates a visual language: amber = "waiting on something" — either a system pause or a human action.</p>
            <p><span className="font-semibold text-foreground">Contrast — </span>The action button uses <code className="rounded bg-surface px-1 font-mono text-[10px]">text-amber-950</code> (near-black) on <code className="rounded bg-surface px-1 font-mono text-[10px]">bg-amber-400</code>. This achieves a contrast ratio of ~9:1, well above the WCAG AA threshold of 4.5:1 — resolving the original concern about white text on yellow.</p>
            <p><span className="font-semibold text-foreground">Button placement — </span>The button floats below the node rather than inside the header to avoid crowding the label and status icon. This also makes it easy to find by eye when scanning a busy canvas — it breaks the node boundary intentionally as a "call to action" affordance.</p>
          </div>

          {/* Reference table */}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-overlay">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Value</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { prop: 'Icon',             value: 'hand (Lucide) — top-right adornment slot' },
                  { prop: 'Icon color',       value: 'var(--color-warning-icon) — same as Pause' },
                  { prop: 'Button bg',        value: 'bg-amber-400' },
                  { prop: 'Button text',      value: 'text-amber-950 (dark, ~9:1 contrast ratio)' },
                  { prop: 'Button placement', value: '8 px below node bottom edge, horizontally centered' },
                  { prop: 'On click',         value: 'Opens action dialog / panel (implementation TBD)' },
                ] as const).map(({ prop, value }, i, arr) => (
                  <tr key={prop} className={i < arr.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3"><code className="font-mono text-xs font-semibold">{prop}</code></td>
                    <td className="px-4 py-3 text-xs text-foreground-muted">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

      </div>
    </div>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Anatomy: Story = {
  name: 'Anatomy',
  render: () => <AnatomyStory />,
};

export const Default: Story = {
  name: 'Default',
  render: () => <DefaultStory />,
};

export const CustomizedSizes: Story = {
  name: 'Customized sizes',
  render: () => <CustomizedSizesStory />,
};

export const DynamicHandles: Story = {
  name: 'Dynamic Handles',
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
        description="Grid showing warning, error, and critical validation badges across shapes."
      />
    </BaseCanvas>
  );
}

// ============================================================================
// Option B: Loop Count Pill (V2 prototype — does not affect original BaseNode)
// ============================================================================

function LoopCountPill({ count }: { count: number }) {
  return (
    <CanvasTooltip content={`Executed ${count} times`} placement="bottom">
      <div
        className="flex items-center gap-0.5 px-1.5 rounded-full border border-border bg-surface-overlay shadow-sm whitespace-nowrap"
        style={{ height: 16 }}
      >
        <CanvasIcon icon="repeat-2" size={10} color="var(--color-foreground-emp)" />
        <span
          className="text-[10px] font-semibold leading-none"
          style={{ color: 'var(--color-foreground-emp)' }}
        >
          {count}
        </span>
      </div>
    </CanvasTooltip>
  );
}

function ActionNeededAdornment() {
  return (
    <CanvasTooltip content="Action needed" placement="bottom">
      <span
        className="flex items-center justify-center rounded-full shadow-sm"
        style={{
          display: 'inline-flex',
          width: 16,
          height: 16,
          backgroundColor: 'var(--color-warning-icon)',
        }}
      >
        <CanvasIcon icon="hand" size={10} color="#451a03" />
      </span>
    </CanvasTooltip>
  );
}

// Custom resolver for V2: moves the loop count out of the status icon (top-right)
// into a dedicated pill slot (bottom-right), leaving the status icon uncluttered.
function resolveAdornmentsV2(context: NodeStatusContext): NodeAdornments {
  const executionState = context.executionState;

  const status = typeof executionState === 'object' ? executionState?.status : executionState;
  const count = typeof executionState === 'object' ? executionState.count : undefined;
  const hasBreakpoint = typeof executionState === 'object' && executionState?.debug;
  const isExecutionStartPoint =
    typeof executionState === 'object' && executionState?.isExecutionStartPoint;
  const isOutputPinned = typeof executionState === 'object' && executionState?.isOutputPinned;

  if (status === 'ActionNeeded') {
    return { topRight: <ActionNeededAdornment /> };
  }

  const hasValidationError =
    context.validationState?.validationStatus === ValidationErrorSeverity.ERROR ||
    context.validationState?.validationStatus === ValidationErrorSeverity.CRITICAL;
  const hasValidationWarning =
    context.validationState?.validationStatus === ValidationErrorSeverity.WARNING;

  const getTopRight = () => {
    if (status && status !== 'None') return <ExecutionStatusIndicator status={status} />;
    if (hasValidationError)
      return (
        <ValidationErrorIndicator message={context.validationState?.validationError?.message} />
      );
    if (hasValidationWarning)
      return (
        <ValidationWarningIndicator message={context.validationState?.validationError?.message} />
      );
    return undefined;
  };

  const hasLoopCount = count !== undefined && count > 1;

  return {
    topLeft: hasBreakpoint ? <BreakpointIndicator /> : undefined,
    topRight: getTopRight(),
    bottomLeft: isExecutionStartPoint ? <ExecutionStartPointIndicator /> : undefined,
    // Loop count takes priority over output-pinned when both are present
    bottomRight: hasLoopCount ? (
      <LoopCountPill count={count} />
    ) : isOutputPinned ? (
      <SquareDashedIndicator />
    ) : undefined,
  };
}

function ActionNeededCanvasNode(props: NodeProps<Node<BaseNodeData>>) {
  // props.height is set by ReactFlow after measurement; DEFAULT_NODE_SIZE = 96 is the safe fallback
  const nodeHeight = props.height ?? 96;
  // Get BaseNode via the registry hook to avoid a circular module-initialization dependency.
  // Importing BaseNode directly here would trigger: BaseNode.tsx → adornment-resolver →
  // canvas/index.ts → HierarchicalCanvas.tsx (DEFAULT_NODE_TYPES = { default: BaseNode })
  // while BaseNode.tsx is still evaluating → TDZ crash.
  const nodeTypes = useNodeTypesFromRegistry();
  const NodeComponent = nodeTypes.default as React.ComponentType<NodeProps<Node<BaseNodeData>>>;
  return (
    <>
      {/* Override type with data.nodeType so BaseNode resolves the correct manifest (shape/icon) */}
      <NodeComponent {...props} type={props.data.nodeType as string} />
      {/* Position relative to ReactFlow's own .react-flow__node wrapper (position:absolute),
          so top: nodeHeight + 8 lands exactly 8px below the node's bottom edge */}
      <div
        className="nodrag nopan pointer-events-auto"
        style={{
          position: 'absolute',
          // NodeLabel renders at nodeHeight+8 (bottom:-8 + translate-y-full) and is ~36px tall
          // (label line 18px + subLabel line 18px). Add 8px gap → nodeHeight + 52.
          top: nodeHeight + 52,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          whiteSpace: 'nowrap',
        }}
      >
        <button
          type="button"
          className="nodrag nopan flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[12px] font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <CanvasIcon icon="hand" size={12} />
          Take Action
        </button>
      </div>
    </>
  );
}

const ACTION_NEEDED_NODE_TYPES = {
  'uipath.manual-trigger-action': ActionNeededCanvasNode,
  'uipath.blank-node-action': ActionNeededCanvasNode,
  'uipath.agent-action': ActionNeededCanvasNode,
};

// ============================================================================
// Node Anatomy Diagram
// ============================================================================

const SLOT_LEGEND = [
  {
    label: 'topLeft',
    dot: 'bg-red-500',
    rule: 'Breakpoint',
    detail: 'Debug mode only — pauses execution at this node.',
    side: 'left',
  },
  {
    label: 'topRight',
    dot: 'bg-emerald-500',
    rule: 'Status › Validation error › Warning',
    detail: 'First matching state wins. Clears when execution ends.',
    side: 'right',
  },
  {
    label: 'bottomLeft',
    dot: 'bg-blue-500',
    rule: 'Execution start point',
    detail: 'Marks the entry node for the current run.',
    side: 'left',
  },
  {
    label: 'bottomRight',
    dot: 'bg-amber-500',
    rule: 'Loop count (> 1) › Output pinned',
    detail: 'Loop count takes priority when both are active.',
    side: 'right',
  },
] as const;

function NodeAnatomyDiagram() {
  const leftSlots = SLOT_LEGEND.filter((s) => s.side === 'left');
  const rightSlots = SLOT_LEGEND.filter((s) => s.side === 'right');

  return (
    <Column gap={20} style={{ marginTop: 16 }}>
      {/* Diagram: labels flanking the real node mock */}
      <div className="flex items-stretch gap-3">
        {/* Left labels — aligned to top and bottom of node */}
        <div className="flex flex-col justify-between flex-1">
          {leftSlots.map(({ label, dot, rule }) => (
            <div key={label} className="flex items-center justify-end gap-2">
              <Column gap={0.5} align="flex-end">
                <span className="text-xs font-mono font-semibold leading-tight">{label}</span>
                <span className="text-xs text-foreground-muted leading-tight text-right">{rule}</span>
              </Column>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
            </div>
          ))}
        </div>

        {/* The node — uses exact BaseNode styles at 96 × 96 px */}
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          {/* Outer container */}
          <div
            className="w-full h-full bg-surface-overlay border border-border flex items-center justify-center"
            style={{ borderRadius: 32 }}
          >
            {/* Inner shape */}
            <div
              className="bg-surface flex items-center justify-center"
              style={{ width: 80, height: 80, borderRadius: 24 }}
            >
              <CanvasIcon icon="agent" size={40} color="var(--color-foreground-de-emp)" />
            </div>
          </div>

          {/* topLeft — Breakpoint */}
          <div
            className="absolute flex items-center justify-center"
            style={{ width: 20, height: 20, top: 6, left: 6 }}
          >
            <div className="w-4 h-4 rounded-full bg-red-500 border border-red-600 shadow-sm" />
          </div>

          {/* topRight — Execution status (Completed) */}
          <div
            className="absolute flex items-center justify-center"
            style={{ width: 20, height: 20, top: 6, right: 6 }}
          >
            <ExecutionStatusIcon status="Completed" />
          </div>

          {/* bottomLeft — Start point */}
          <div
            className="absolute flex items-center justify-center"
            style={{ width: 20, height: 20, bottom: 6, left: 6 }}
          >
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600 shadow-sm" />
          </div>

          {/* bottomRight — Loop count pill */}
          <div
            className="absolute flex items-center justify-center"
            style={{ width: 20, height: 20, bottom: 6, right: 6 }}
          >
            <LoopCountPill count={3} />
          </div>
        </div>

        {/* Right labels */}
        <div className="flex flex-col justify-between flex-1">
          {rightSlots.map(({ label, dot, rule }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
              <Column gap={0.5}>
                <span className="text-xs font-mono font-semibold leading-tight">{label}</span>
                <span className="text-xs text-foreground-muted leading-tight">{rule}</span>
              </Column>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-foreground-muted text-center">
        Each slot is 20 × 20 px, inset 6 px from the node corner.
      </p>

      <div className="border-t border-border" />

      {/* Full slot details */}
      <Column gap={12}>
        {SLOT_LEGEND.map(({ label, dot, rule, detail }) => (
          <div key={label} className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dot}`} />
            <Column gap={1}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold">{label}</span>
                <span className="text-xs text-foreground">{rule}</span>
              </div>
              <span className="text-xs text-foreground-muted">{detail}</span>
            </Column>
          </div>
        ))}
      </Column>
    </Column>
  );
}

// ============================================================================
// Adornments Story
// ============================================================================

const ADORNMENT_ROWS = [
  { key: 'breakpoint', label: 'Breakpoint (top-left)' },
  { key: 'status-completed', label: 'Status: Completed (top-right)' },
  { key: 'status-inprogress', label: 'Status: InProgress (top-right)' },
  { key: 'status-failed', label: 'Status: Failed (top-right)' },
  { key: 'start-point', label: 'Start Point (bottom-left)' },
  { key: 'square-dashed', label: 'Square Dashed (bottom-right)' },
  { key: 'all', label: 'All Adornments' },
  { key: 'multi-exec', label: 'Multi-execution (count: 5)' },
  { key: 'action-needed', label: 'Action Needed' },
] as const;

function createAdornmentGrid(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  ADORNMENT_ROWS.forEach((row, rowIndex) => {
    SHAPES.forEach(({ shape, nodeType }, colIndex) => {
      const isActionNeeded = row.key === 'action-needed';
      nodes.push(
        createNode({
          id: `adorn-${row.key}-${shape}`,
          type: isActionNeeded ? `${nodeType}-action` : nodeType,
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
    case 'action-needed':
      return { status: 'ActionNeeded' as string };
    default:
      return undefined;
  }
}

const ADORNMENT_DESCRIPTIONS: { label: string; description: string }[] = [
  {
    label: 'Breakpoint',
    description: 'Pauses execution at this node during a debug run.',
  },
  {
    label: 'Status: Completed',
    description: 'Node finished executing successfully.',
  },
  {
    label: 'Status: In Progress',
    description: 'Node is actively running.',
  },
  {
    label: 'Status: Failed',
    description: 'Node encountered an error during execution.',
  },
  {
    label: 'Start Point',
    description: 'Entry point for the current execution run.',
  },
  {
    label: 'Square Dashed',
    description: 'Output is pinned — result saved for later reference.',
  },
  {
    label: 'All Adornments',
    description: 'All four corners populated at the same time.',
  },
  {
    label: 'Multi-execution',
    description:
      'Loop pill in the bottom-right corner: repeat icon + count. Separate from the execution status icon (top-right) so both are visible at once.',
  },
  {
    label: 'Action Needed',
    description: 'Node requires human input before execution can continue. Hand icon (top-right) uses the same warning amber as Pause. A "Take Action" button appears below the node.',
  },
];

// Stable module-scope reference: triggers fitView on first load without repositioning nodes
const fitViewOnLoad = async () => {};

function ActionNeededStory() {
  const initialNodes = useMemo<Node<BaseNodeData>[]>(
    () => [
      createNode({
        id: 'action-needed-circle',
        type: 'uipath.manual-trigger-action',
        position: { x: 200, y: 200 },
        data: {
          nodeType: 'uipath.manual-trigger',
          version: '1.0.0',
          display: { label: 'Trigger', subLabel: 'Action Needed', shape: 'circle' },
        },
      }),
      createNode({
        id: 'action-needed-square',
        type: 'uipath.blank-node-action',
        position: { x: 450, y: 200 },
        data: {
          nodeType: 'uipath.blank-node',
          version: '1.0.0',
          display: { label: 'Task', subLabel: 'Action Needed', shape: 'square' },
        },
      }),
      createNode({
        id: 'action-needed-rectangle',
        type: 'uipath.agent-action',
        position: { x: 700, y: 200 },
        data: {
          nodeType: 'uipath.agent',
          version: '1.0.0',
          display: { label: 'Agent', subLabel: 'Action Needed', shape: 'rectangle' },
        },
      }),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, additionalNodeTypes: ACTION_NEEDED_NODE_TYPES });

  return (
    <BaseCanvas {...canvasProps} mode="design" initialAutoLayout={fitViewOnLoad}>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Action Needed"
        description="A new execution state where the node requires human input before the process can continue. Amber adornment in the top-right corner + Take Action button below the node."
      />
    </BaseCanvas>
  );
}

function AdornmentsStory() {
  const initialNodes = useMemo(() => createAdornmentGrid(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, additionalNodeTypes: ACTION_NEEDED_NODE_TYPES });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Adornments"
        description="Each row demonstrates one adornment slot. See the Anatomy story for slot positions and priority rules."
        collapsible
      >
        <Column gap={10} style={{ marginTop: 12 }}>
          {ADORNMENT_DESCRIPTIONS.map(({ label, description }) => (
            <Column key={label} gap={1}>
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-foreground-muted">{description}</span>
            </Column>
          ))}
        </Column>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

export const Adornments: Story = {
  name: 'Adornments',
  decorators: [
    (Story) => (
      <AdornmentResolverProvider value={resolveAdornmentsV2}>
        <Story />
      </AdornmentResolverProvider>
    ),
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId: string) => {
          const parts = nodeId.split('-');
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

export const ActionNeeded: Story = {
  name: 'Action Needed',
  decorators: [
    (Story) => (
      <AdornmentResolverProvider value={resolveAdornmentsV2}>
        <Story />
      </AdornmentResolverProvider>
    ),
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: () => ({ status: 'ActionNeeded' as string }),
        getEdgeExecutionState: () => undefined,
      },
      validationState: {
        getElementValidationState: () => undefined,
      },
    }),
  ],
  render: () => <ActionNeededStory />,
};

// ============================================================================
// Stacked Treatment Story
// ============================================================================

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
        description="Drillable (manifest) and collapsed (instance data) nodes render a decorative stacked layer behind the card."
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
        title="canvasLabel resolution"
        description={
          'Three instances exercising the precedence ' +
          'instance.canvasLabel > instance.label > manifest.canvasLabel > manifest.label.'
        }
      />
    </BaseCanvas>
  );
}

export const CanvasLabel: Story = {
  name: 'canvasLabel resolution',
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
