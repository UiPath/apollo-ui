import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertiesExpanded } from './flow-properties-expanded';

const meta = {
  title: 'Components/UiPath/Properties Expanded',
  component: PropertiesExpanded,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PropertiesExpanded>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-[700px] bg-future-surface p-4">
      <div className="flex flex-1 items-center justify-center text-sm text-future-foreground-muted">
        Canvas area
      </div>
      <PropertiesExpanded
        nodeName="AI Agent"
        nodeType="AI Agent"
        activeTab="properties"
      />
    </div>
  ),
};
