import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AgentExperienceComposition,
  FullWorkbenchComposition,
  mapTemplateThemeToChat,
} from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';

const meta = {
  title: 'Apollo Wind/Patterns/Layout Patterns',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {
  name: 'UX Form',
  render: () => <FullWorkbenchComposition rightPanelVariant="forms" />,
};

export const Variables: Story = {
  name: 'UX Variables',
  render: () => <FullWorkbenchComposition rightPanelVariant="node" />,
};

export const VariableSelect: Story = {
  name: 'UX Variables select',
  render: () => <FullWorkbenchComposition rightPanelVariant="variables" />,
};

export const Rule: Story = {
  name: 'UX Rule',
  render: () => <FullWorkbenchComposition rightPanelVariant="rules" />,
};

export const Dap: Story = {
  name: 'UX DAP',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const Agent: Story = {
  name: 'UX Agent',
  render: (_args, context) => (
    <AgentExperienceComposition theme={mapTemplateThemeToChat(context.globals.theme)} />
  ),
};
