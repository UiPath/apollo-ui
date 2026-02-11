import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowViewToolbar } from './toolbar-view';

const meta = {
  title: 'Components/UiPath/View Toolbar',
  component: FlowViewToolbar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FlowViewToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark bg-future-surface p-8">
      <FlowViewToolbar activeNodeSize="m" />
    </div>
  ),
};
