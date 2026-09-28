import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuardrailStatusBanner } from './guardrail-status-banner';

const meta = {
  title: 'Components/UiPath/Guardrail Status Banner',
  component: GuardrailStatusBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Why a guardrail cannot run: the definition is disabled, the tenant is not entitled to it, or
the feature is off. Exported so a host can compose it into \`GuardrailList\`'s
\`statusBanner\` slot, which takes a node rather than a typed banner prop because the reasons
are product knowledge.

Two tones, and they differ in more than colour. \`error\` keeps the underlying alert's
\`role="alert"\`, which interrupts a screen reader. \`warning\` is a persistent notice, so it
downgrades to \`role="status"\`, a polite live region.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: { tone: 'error', message: 'This guardrail is unavailable for your tenant.' },
} satisfies Meta<typeof GuardrailStatusBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorTone: Story = {};

export const WarningTone: Story = {
  args: { tone: 'warning', message: 'This guardrail is disabled and will not be evaluated.' },
};

/** Both tones stacked, which is how a list renders more than one reason. */
export const BothTones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <GuardrailStatusBanner
        tone="error"
        message="This guardrail is unavailable for your tenant."
      />
      <GuardrailStatusBanner
        tone="warning"
        message="This guardrail is disabled and will not be evaluated."
      />
    </div>
  ),
};
