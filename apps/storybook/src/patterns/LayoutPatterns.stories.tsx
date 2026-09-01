import type { Meta, StoryObj } from '@storybook/react-vite';
import { withCanvasProviders } from '@uipath/apollo-react/canvas/storybook-utils';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { DapLayoutsPage } from './DapLayoutsPage';
import { ErrorAndValidationWorkbench } from './ErrorAndValidationWorkbench';

const meta = {
  title: 'Apollo Wind/Patterns/Layout Patterns',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorAndValidation: Story = {
  name: 'UX Error and Validation',
  render: () => <ErrorAndValidationWorkbench />,
};

export const DapSendEmail: Story = {
  name: 'UX DAP - Send email',
  render: () => <FullWorkbenchComposition rightPanelVariant="dap" />,
};

export const DapAlignment: Story = {
  name: 'UX DAP - Alignment',
  render: () => <DapLayoutsPage />,
};
