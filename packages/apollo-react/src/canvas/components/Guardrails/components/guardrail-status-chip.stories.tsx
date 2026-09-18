import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuardrailStatusChip } from './guardrail-status-chip';

const meta = {
  title: 'Components/UiPath/Guardrail Status Chip',
  component: GuardrailStatusChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Read-only status label for a guardrail row: definition status in the palette, governance
origin in the centralized section. It is a span carrying the wind badge classes, not a
control, so it is safe inside a button and stays out of the tab order. Use
\`GuardrailChip\` instead when the pill is meant to be toggled.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { children: 'Governance managed' },
} satisfies Meta<typeof GuardrailStatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * One tone per definition status, plus the two both products already ship: green for a BYO
 * origin or connector, blue for a "Preview" lifecycle label.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <GuardrailStatusChip>Governance managed</GuardrailStatusChip>
      <GuardrailStatusChip tone="info">Preview</GuardrailStatusChip>
      <GuardrailStatusChip tone="success">Bring your own</GuardrailStatusChip>
      <GuardrailStatusChip tone="warning">Feature disabled</GuardrailStatusChip>
      <GuardrailStatusChip tone="error">Unauthorized</GuardrailStatusChip>
    </div>
  ),
};

/**
 * Host text of any length: the label truncates rather than wrapping out of the pill, and the
 * full text is on the chip's `title`.
 */
export const LongLabel: Story = {
  render: () => (
    <div className="flex w-56 items-center gap-2">
      <GuardrailStatusChip tone="success">
        Contoso Content Safety (EU West production)
      </GuardrailStatusChip>
    </div>
  ),
};

/** Valid inside a button, which is what the palette entry needs. */
export const InsideAButton: Story = {
  render: () => (
    <button type="button" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span>Prompt injection</span>
      <GuardrailStatusChip tone="warning">Feature disabled</GuardrailStatusChip>
    </button>
  ),
};
