import type { Meta, StoryObj } from '@storybook/react-vite';

import { withCanvasProviders } from '../../storybook-utils';
import {
  AgentExperienceComposition,
  FullWorkbenchComposition,
  mapTemplateThemeToChat,
  NodeInventoryComposition,
} from './Flow.stories';

const meta = {
  title: 'Templates/Flow Standalone',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkbenchWithForms: Story = {
  name: 'UX Form',
  render: () => <FullWorkbenchComposition rightPanelVariant="forms" />,
};

export const WorkbenchWithNode: Story = {
  name: 'UX Variables',
  render: () => <FullWorkbenchComposition rightPanelVariant="node" />,
};

export const RuleBuilding: Story = {
  name: 'UX Rule',
  render: () => <FullWorkbenchComposition rightPanelVariant="rules" />,
};

export const VariableManagement: Story = {
  name: 'UX Nodes',
  render: () => <NodeInventoryComposition />,
};

export const DapUX: Story = {
  name: 'UX DAP',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const AgentExperience: Story = {
  name: 'UX Agent',
  render: (_args, context) => (
    <AgentExperienceComposition theme={mapTemplateThemeToChat(context.globals.theme)} />
  ),
};
