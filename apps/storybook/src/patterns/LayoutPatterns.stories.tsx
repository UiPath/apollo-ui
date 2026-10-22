import type { Meta, StoryObj } from '@storybook/react-vite';
import { withCanvasProviders } from '@uipath/apollo-react/canvas/storybook-utils';
import { useArgs } from 'storybook/preview-api';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { DapLayoutsPage } from './DapLayoutsPage';
import { FlowNodePanelsPage } from './flow-node-panels/FlowNodePanelsPage';
import { FLOW_NODE_PANEL_ITEMS } from './flow-node-panels/flow-node-catalog';

const meta = {
  title: 'Apollo Wind/Patterns/Layout Patterns',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every Flow Workbench node on one canvas; selecting a node opens its right
 * panel. The `node` arg (e.g. `&args=node:core-logic-delay`) deep-links to a
 * single panel.
 */
export const FlowNodePanels: StoryObj<{ node: string }> = {
  name: 'Flow Node Panels',
  args: { node: '' },
  argTypes: {
    node: {
      description: 'The node whose right panel is open, by slug.',
      control: 'select',
      options: ['', ...FLOW_NODE_PANEL_ITEMS.map((item) => item.slug)],
    },
  },
  render: function Render() {
    const [{ node }, updateArgs] = useArgs<{ node: string }>();
    return (
      <FlowNodePanelsPage nodeSlug={node} onNodeSelect={(slug) => updateArgs({ node: slug })} />
    );
  },
};

export const DapSendEmail: Story = {
  name: 'UX DAP - Send email',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const DapAlignment: Story = {
  name: 'UX DAP - Alignment',
  render: () => <DapLayoutsPage />,
};
