import type { Meta, StoryObj } from '@storybook/react-vite';
import { withCanvasProviders } from '../../storybook-utils';
import { DraggablePanelLayout } from './Flow.stories';

const meta = {
  title: 'Templates/Flow VS Code',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CanvasOnly: Story = {
  name: 'Canvas Only',
  render: () => <DraggablePanelLayout />,
};

export const WithRightPanel: Story = {
  name: 'w/ Right Panel',
  render: () => <DraggablePanelLayout initialPanelIds={['properties']} />,
};

export const WithInputPanel: Story = {
  name: 'w/ Input Panel',
  render: () => <DraggablePanelLayout initialPanelIds={['input']} />,
};

export const WithOutputPanel: Story = {
  name: 'w/ Output Panel',
  render: () => <DraggablePanelLayout initialPanelIds={['output']} />,
};

export const MultiPanel: Story = {
  name: 'Multi Panel',
  render: () => <DraggablePanelLayout initialPanelIds={['input', 'properties', 'output']} />,
};
