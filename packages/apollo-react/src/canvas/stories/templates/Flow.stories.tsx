import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FormSchema, Separator } from '@uipath/apollo-wind';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
// @ts-expect-error -- Vite alias
import { FlowTemplate } from '@uipath/apollo-wind/templates/Flow/template-flow';
import { Globe, Play, Plus, Redo2, StickyNote, Undo2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import type { BaseNodeData } from '../../components/BaseNode/BaseNode.types';
import { BaseCanvas } from '../../components/BaseCanvas';
import {
  CanvasModeToolbar,
  CountBadge,
  TOOLBAR_ICON_BUTTON_CLASS,
} from '../../components/CanvasModeToolbar';
import { CanvasZoomControls } from '../../components/CanvasZoomControls';
import { NodeIOView } from '../../components/NodeIOView';
import { NodePropertyPanel, NodePropertyPanelLayout } from '../../components/NodePropertyPanel';
import { ToolbarButton } from '../../components/ToolbarButton';
import { NodePropertyTrigger } from '../../controls/NodePropertyTrigger';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Templates/Canvas with Panels',
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

function createFlowNodes(): Node<BaseNodeData>[] {
  return [
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
}

const flowEdges: Edge[] = [
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

// ============================================================================
// Canvas content component (must be inside ReactFlowProvider)
// ============================================================================

function FlowCanvas() {
  const initialNodes = useMemo(() => createFlowNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: flowEdges,
  });

  return <BaseCanvas {...canvasProps} mode="design" />;
}

function UpdatedFlowTemplate({ children, ...props }: ComponentProps<typeof FlowTemplate>) {
  return (
    <FlowTemplate
      {...props}
      hideLeftPanel
      topRightControl={
        <NodePropertyTrigger
          panels={[
            { id: 'button-1', label: 'Button 1', enabled: false },
            { id: 'button-2', label: 'Button 2', enabled: false },
            { id: 'button-3', label: 'Button 3', enabled: false },
          ]}
          behaviorOptions={[
            { value: 'auto-hide', label: 'Button 1' },
            { value: 'always-persist', label: 'Button 2' },
          ]}
          layoutOptions={[
            { value: 'right', label: 'Button 1' },
            { value: 'bottom', label: 'Button 2' },
            { value: 'split', label: 'Button 3' },
          ]}
        />
      }
      bottomCenterControl={
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
      }
      bottomRightControl={<CanvasZoomControls orientation="vertical" />}
    >
      {children}
    </FlowTemplate>
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

function PropertiesPanel({ className }: { className?: string }) {
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
      onClose={() => {}}
      className={className}
    />
  );
}

function BottomPanels() {
  return (
    <NodePropertyPanelLayout
      className="h-full"
      input={
        <NodePropertyPanel panelTitle="Input" contentInset="0.875rem" className="h-full">
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
      }
      properties={<PropertiesPanel className="h-full" />}
      output={
        <NodePropertyPanel panelTitle="Output" contentInset="0.875rem" className="h-full">
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
      }
    />
  );
}

export const Default: Story = {
  name: 'Default',
  render: (_, { globals }) => (
    <UpdatedFlowTemplate theme={globals.theme || 'future-dark'} blank>
      <FlowCanvas />
    </UpdatedFlowTemplate>
  ),
};

export const PropertiesRight: Story = {
  name: 'Properties — Right',
  render: (_, { globals }) => (
    <UpdatedFlowTemplate
      theme={globals.theme || 'future-dark'}
      blank
      rightPanel={
        <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
          <PropertiesPanel className="h-full" />
        </div>
      }
    >
      <FlowCanvas />
    </UpdatedFlowTemplate>
  ),
};

export const PropertiesBottom: Story = {
  name: 'Properties — Bottom',
  render: (_, { globals }) => (
    <UpdatedFlowTemplate
      theme={globals.theme || 'future-dark'}
      blank
      bottomPanel={<BottomPanels />}
    >
      <FlowCanvas />
    </UpdatedFlowTemplate>
  ),
};
