import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import type { ElementStatus } from '../../types/execution';
import { BaseCanvas } from '../BaseCanvas';
import { BaseNodeOverrideConfigProvider } from '../BaseNode/BaseNodeConfigContext';
import type { HandleActionEvent, HandleMouseEvent } from '../ButtonHandle/ButtonHandle';
import { caseFlowManifest } from './case-flow.manifest';

const TRIGGER_NODE_TYPE = 'uipath.case.trigger';

const TRIGGER_VARIANTS: Array<{
  id: string;
  label: string;
  status?: ElementStatus;
  icon?: string;
}> = [
  { id: 'default', label: 'Default' },
  { id: 'schedule', label: 'Schedule', icon: 'clock' },
  { id: 'in-progress', label: 'In Progress', status: 'InProgress' },
  { id: 'completed', label: 'Completed', status: 'Completed' },
  { id: 'failed', label: 'Failed', status: 'Failed' },
  { id: 'paused', label: 'Paused', status: 'Paused' },
  { id: 'not-executed', label: 'Not Executed', status: 'NotExecuted' },
  { id: 'timer', label: 'Time Trigger', icon: 'clock' },
  { id: 'email', label: 'Email Trigger', icon: 'mail' },
  { id: 'webhook', label: 'Webhook Trigger', icon: 'webhook' },
];

const STATUS_BY_ID: Record<string, ElementStatus> = Object.fromEntries(
  TRIGGER_VARIANTS.filter((v): v is typeof v & { status: ElementStatus } => Boolean(v.status)).map(
    (v) => [v.id, v.status]
  )
);

const GRID_ORIGIN = { x: 48, y: 96 };
const GRID_GAP = { x: 144, y: 160 };
const GRID_COLUMNS = 5;

const CaseTriggerManifestStory = () => {
  const initialNodes = useMemo(
    () =>
      TRIGGER_VARIANTS.map((variant, index) =>
        createNode({
          id: variant.id,
          type: TRIGGER_NODE_TYPE,
          position: {
            x: GRID_ORIGIN.x + (index % GRID_COLUMNS) * GRID_GAP.x,
            y: GRID_ORIGIN.y + Math.floor(index / GRID_COLUMNS) * GRID_GAP.y,
          },
          data: {
            nodeType: TRIGGER_NODE_TYPE,
            version: '1.0.0',
            display: {
              label: variant.label,
              ...(variant.icon ? { icon: variant.icon } : {}),
            },
          },
        })
      ),
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });

  return <BaseCanvas {...canvasProps} mode="design" />;
};

const meta = {
  title: 'Components/CaseFlow/Trigger',
  component: BaseCanvas,
  decorators: [
    // Provide an explicit execution-state resolver so status comes from
    // TRIGGER_VARIANTS, not from the storybook-util default that derives it
    // by parsing node IDs.
    withCanvasProviders({
      executionState: {
        getNodeExecutionState: (nodeId) => STATUS_BY_ID[nodeId],
        getEdgeExecutionState: () => undefined,
      },
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // Story-level decorator wraps innermost, shadowing the registry installed by
  // the meta-level `withCanvasProviders()`. This is what makes `caseFlowManifest`
  // the manifest under test.
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={caseFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <CaseTriggerManifestStory />,
};

// ============================================================================
// WithHoverPreview — demos `onHandleMouseEnter` / `onHandleMouseLeave` /
// `onHandleAction` on the trigger's source-handle `+` button. Hovering the `+`
// adds a translucent "preview" node next to the trigger; unhovering removes it;
// clicking commits the preview into a solid node. This is the affordance
// PO.Frontend's case-management canvas uses for its hover-to-preview UX and is
// the visual baseline for that capability.
// ============================================================================

const PREVIEW_NODE_ID = 'hover-preview';
const COMMITTED_NODE_ID = 'hover-committed';

const HoverPreviewStory = () => {
  const triggerInitialNodes = useMemo(
    () => [
      createNode({
        id: 'trigger',
        type: TRIGGER_NODE_TYPE,
        position: { x: 96, y: 160 },
        data: {
          nodeType: TRIGGER_NODE_TYPE,
          version: '1.0.0',
          display: { label: 'Hover the +' },
        },
      }),
    ],
    []
  );

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes: triggerInitialNodes });
  const [isCommitted, setIsCommitted] = useState(false);

  const overrideConfig = useMemo(
    () => ({
      onHandleMouseEnter: (_event: HandleMouseEvent) => {
        if (isCommitted) return;
        setNodes((nodes) => {
          if (nodes.some((n) => n.id === PREVIEW_NODE_ID)) return nodes;
          return [
            ...nodes,
            createNode({
              id: PREVIEW_NODE_ID,
              type: TRIGGER_NODE_TYPE,
              position: { x: 296, y: 160 },
              data: {
                nodeType: TRIGGER_NODE_TYPE,
                version: '1.0.0',
                display: { label: 'Preview', icon: 'circle-dashed' },
                // Visual cue for "preview" (translucent). Apollo's BaseNode
                // doesn't have a first-class translucent variant; story-only
                // styling is fine here for the visual demo.
                style: { opacity: 0.4 },
              },
            }),
          ];
        });
      },
      onHandleMouseLeave: (_event: HandleMouseEvent) => {
        if (isCommitted) return;
        setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
      },
      onHandleAction: (_event: HandleActionEvent) => {
        setIsCommitted(true);
        setNodes((nodes) => [
          ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID),
          createNode({
            id: COMMITTED_NODE_ID,
            type: TRIGGER_NODE_TYPE,
            position: { x: 296, y: 160 },
            data: {
              nodeType: TRIGGER_NODE_TYPE,
              version: '1.0.0',
              display: { label: 'Committed', icon: 'check' },
            },
          }),
        ]);
      },
    }),
    [isCommitted, setNodes]
  );

  return (
    <BaseNodeOverrideConfigProvider value={overrideConfig}>
      <BaseCanvas {...canvasProps} mode="design" />
    </BaseNodeOverrideConfigProvider>
  );
};

export const WithHoverPreview: Story = {
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={caseFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <HoverPreviewStory />,
};

// ============================================================================
// WithToolbarAction — demos the `change-trigger-type` action wired into
// `caseManagementTriggerManifest.toolbarExtensions.design`. Selecting the
// trigger reveals the apollo toolbar with the action; clicking it logs to the
// console and bumps an in-story counter for visual feedback.
// ============================================================================

const ToolbarActionStory = () => {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'trigger',
        type: TRIGGER_NODE_TYPE,
        position: { x: 160, y: 160 },
        data: {
          nodeType: TRIGGER_NODE_TYPE,
          version: '1.0.0',
          display: { label: 'Select me' },
        },
      }),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes });
  const [actionCount, setActionCount] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          borderRadius: 4,
          fontFamily: 'sans-serif',
          fontSize: 12,
        }}
      >
        change-trigger-type fired: {actionCount}
      </div>
      <BaseNodeOverrideConfigProvider
        value={{
          toolbarConfig: {
            actions: [
              {
                id: 'change-trigger-type',
                icon: 'square-mouse-pointer',
                label: 'Change trigger type',
                onAction: () => {
                  // biome-ignore lint/suspicious/noConsole: visual-demo logging in a story
                  console.log('[CaseTrigger] change-trigger-type fired');
                  setActionCount((n) => n + 1);
                },
              },
            ],
          },
        }}
      >
        <BaseCanvas {...canvasProps} mode="design" />
      </BaseNodeOverrideConfigProvider>
    </div>
  );
};

export const WithToolbarAction: Story = {
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={caseFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <ToolbarActionStory />,
};
