import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { NodeRegistryProvider } from '../../core';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import type { ElementStatus } from '../../types/execution';
import { BaseCanvas } from '../BaseCanvas';
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
