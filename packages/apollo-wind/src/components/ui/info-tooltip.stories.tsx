import type { Meta } from '@storybook/react-vite';
import { InfoTooltip } from './info-tooltip';
import { Label, RequiredIndicator } from './label';
import { TooltipProvider } from './tooltip';

const meta = {
  title: 'Components/Core/InfoTooltip',
  component: InfoTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Info icon with a tooltip, for the explanatory text that sits next to a field label.

The trigger is a real \`<button>\`, so the tooltip is keyboard-reachable and screen readers
announce it from the required \`aria-label\`. An ancestor \`TooltipProvider\` is required:
Radix throws \`Tooltip must be used within TooltipProvider\` without one.

Schema-driven forms get this for free. Set \`tooltip\` (and optionally \`tooltipAriaLabel\`)
on any field metadata and \`MetadataForm\` renders the trigger beside the label.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof InfoTooltip>;

export default meta;

export const Default = {
  args: {
    content: 'Rows are matched against the generated output.',
    'aria-label': 'More information',
  },
};

/** The usual placement: after a field label, before the required indicator. */
export const NextToALabel = {
  args: Default.args,
  render: (args: React.ComponentProps<typeof InfoTooltip>) => (
    <Label htmlFor="blocked-phrases">
      Blocked phrases
      <RequiredIndicator />
      <InfoTooltip {...args} />
    </Label>
  ),
};

/** `content` is a ReactNode, so hosts can pass formatted copy rather than a plain string. */
export const RichContent = {
  args: {
    'aria-label': 'More information about matching',
    content: (
      <div className="space-y-1">
        <p className="font-medium">Matching is case-insensitive.</p>
        <p>Each row is compared independently; the first match blocks the response.</p>
      </div>
    ),
  },
};

/** Long copy wraps at the component's 300px clamp instead of stretching the viewport. */
export const LongContent = {
  args: {
    'aria-label': 'More information',
    content:
      'When enabled, this guardrail runs on every generated response before it reaches the user, and a match is recorded against the run so reviewers can audit why the response was withheld.',
  },
};
