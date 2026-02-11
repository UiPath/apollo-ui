import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepsView } from './chat-steps-view';

const meta = {
  title: 'Components/UiPath/Steps View',
  component: StepsView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StepsView>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSteps = [
  {
    id: '1',
    title: 'Extract invoice data',
    stepRange: 'Steps 1-3',
    description: 'Use Document Understanding to extract key fields from uploaded invoice PDFs.',
  },
  {
    id: '2',
    title: 'Validate amounts',
    stepRange: 'Steps 4-6',
    description: 'Cross-reference extracted amounts against purchase order records.',
  },
  {
    id: '3',
    title: 'Route for approval',
    stepRange: 'Steps 7-9',
    description: 'Send validated invoices to the appropriate approver based on amount thresholds.',
    loop: 'Loop until approved',
  },
  {
    id: '4',
    title: 'Post to ERP',
    stepRange: 'Steps 10-12',
    description: 'Create journal entries in SAP for approved invoices.',
  },
];

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-screen bg-future-surface">
      <StepsView
        className="mx-auto max-w-3xl"
        flowName="Invoice processing"
        flowDescription="Automate end-to-end invoice processing with AI-powered data extraction and validation."
        status="Active"
        lastRun="2 hours ago"
        totalRuns={847}
        steps={sampleSteps}
      />
    </div>
  ),
};
