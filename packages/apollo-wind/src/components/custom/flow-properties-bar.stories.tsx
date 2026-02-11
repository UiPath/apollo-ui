import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertiesBar } from './flow-properties-bar';

const meta = {
  title: 'Components/UiPath/Properties Bar',
  component: PropertiesBar,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PropertiesBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark bg-future-surface p-4">
      <PropertiesBar flowName="Invoice processing" flowType="Workflow" />
    </div>
  ),
};
