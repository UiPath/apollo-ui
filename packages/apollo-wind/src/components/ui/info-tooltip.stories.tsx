import type { Meta } from '@storybook/react-vite';
import { FormFieldLabel } from './form-field';
import { InfoTooltip } from './info-tooltip';
import { Textarea } from './textarea';
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

**In forms, reach for \`FormFieldLabel\` instead of composing this by hand**: it takes
\`tooltip\` / \`tooltipAriaLabel\` and places the trigger after the required indicator for you.
Schema-driven forms get it for free — set \`tooltip\` on any field metadata and
\`MetadataForm\` renders it.
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

/**
 * The idiomatic form usage: `FormFieldLabel` owns the composition, so the trigger lands
 * after the required indicator without the call site assembling the parts.
 */
export const NextToALabel = {
  args: Default.args,
  render: (args: React.ComponentProps<typeof InfoTooltip>) => (
    <div className="w-80 space-y-1.5">
      <FormFieldLabel
        htmlFor="blocked-phrases"
        required
        tooltip={args.content}
        tooltipAriaLabel={args['aria-label']}
      >
        Blocked phrases
      </FormFieldLabel>
      <Textarea id="blocked-phrases" placeholder="confidential" minRows={2} />
    </div>
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
