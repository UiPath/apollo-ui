import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GuardrailFormLayout } from './guardrail-form-layout';

const meta = {
  title: 'Components/UiPath/Guardrail Form Layout',
  component: GuardrailFormLayout,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Layout shell for guardrail builder forms with three modes: inline + hideHeader (scrollable
region with a footer), inline (adds a back-button header), and modal (a Dialog). The footer
carries Cancel, an optional secondary action, and Save; footerStart renders a left-aligned
region, e.g. an evaluations toggle.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[480px] h-[360px] border rounded-md overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuardrailFormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <div className="space-y-3 py-4">
    <p className="text-sm">Form body content goes here.</p>
    <p className="text-sm text-muted-foreground">The region scrolls when it overflows.</p>
  </div>
);

export const InlineWithHeader: Story = {
  args: {
    open: true,
    inline: true,
    title: 'Edit PII detection guardrail',
    children: body,
    onSave: () => {},
    onCancel: () => {},
  },
};

export const InlineHiddenHeader: Story = {
  args: { ...InlineWithHeader.args, hideHeader: true },
};

export const Modal: Story = {
  decorators: [(Story) => <Story />],
  args: {
    open: true,
    title: 'Edit PII detection guardrail',
    children: body,
    onSave: () => {},
    onCancel: () => {},
  },
};

export const WithSecondaryAction: Story = {
  args: {
    ...InlineHiddenHeader.args,
    secondaryAction: { label: 'Save as new', onClick: () => {} },
  },
};

export const WithFooterStart: Story = {
  args: {
    ...InlineHiddenHeader.args,
    footerStart: (
      <div className="flex items-center gap-2">
        <Switch id="footer-evals" defaultChecked />
        <Label htmlFor="footer-evals" className="text-sm font-normal">
          Enable guardrail for evaluations
        </Label>
      </div>
    ),
  },
};

export const SaveDisabled: Story = {
  args: { ...InlineHiddenHeader.args, saveDisabled: true },
};
