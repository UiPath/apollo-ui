import type { Meta, StoryObj } from '@storybook/react-vite';
import { Braces } from 'lucide-react';
import * as React from 'react';
import { Button } from '../button';
import { VariablePicker, type VariablePickerItem } from './variable-picker';

const variables: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: [
      {
        id: 'manual-trigger',
        label: 'manualTrigger1',
        value: '$vars.manualTrigger1',
        type: 'object',
        children: [
          {
            id: 'customer-name',
            label: 'customerName',
            value: '$vars.manualTrigger1.customerName',
            type: 'string',
          },
          {
            id: 'order-total',
            label: 'orderTotal',
            value: '$vars.manualTrigger1.orderTotal',
            type: 'number',
          },
          {
            id: 'is-priority',
            label: 'isPriority',
            value: '$vars.manualTrigger1.isPriority',
            type: 'boolean',
          },
        ],
      },
    ],
  },
  {
    id: 'metadata',
    label: '$metadata',
    type: 'object',
    children: [
      {
        id: 'job-id',
        label: 'jobId',
        value: '$metadata.jobId',
        type: 'string',
      },
      {
        id: 'retry-count',
        label: 'retryCount',
        value: '$metadata.retryCount',
        type: 'number',
      },
    ],
  },
];

const meta = {
  title: 'Components/UiPath/Variable Picker',
  component: VariablePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A searchable, hierarchical picker for inserting one variable into a consumer-owned value.

This is a single-action picker, not a multi-select. Branch rows expand and collapse; choosing a leaf calls \`onSelect(item)\` and closes the popover. The consumer owns the editor state and decides whether to insert \`item.value\`, replace a value, or perform another action.

## Consumer guidance

- Provide stable, unique \`id\` values and nest variables with \`children\`.
- Give selectable leaves a \`value\`; use \`type\` to show the standard variable badge.
- Handle insertion in \`onSelect\` so cursor and editor behavior remain owned by the consuming surface.
- Use \`open\` and \`onOpenChange\` when the surrounding experience needs controlled popover state.
- Pass a child trigger to match an existing toolbar; omit it for the standard **Insert** trigger.
- Search matches both labels and values and automatically reveals matching descendants.
        `,
      },
    },
  },
  argTypes: {
    items: { description: 'Hierarchical variable data shown by the picker.' },
    onSelect: {
      description: 'Called with the selected leaf. The consumer performs the actual insertion.',
    },
    open: { description: 'Controlled open state.' },
    onOpenChange: { description: 'Called whenever the popover requests an open-state change.' },
    children: { control: false, description: 'Optional custom trigger element.' },
  },
} satisfies Meta<typeof VariablePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function InsertIntoValueDemo() {
  const [value, setValue] = React.useState('Hello ');

  return (
    <div className="w-[520px] space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="variable-picker-value" className="text-sm font-medium text-foreground">
          Message
        </label>
        <VariablePicker
          items={variables}
          onSelect={(item) => setValue((current) => `${current}${item.value ?? item.label}`)}
        />
      </div>
      <textarea
        id="variable-picker-value"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-28 w-full resize-none rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="text-xs text-foreground-muted">
        This example appends the selected value. Editors can instead insert at the cursor.
      </p>
    </div>
  );
}

export const InsertIntoValue: Story = {
  render: () => <InsertIntoValueDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A working consumer example. The picker reports the selected variable and the surrounding field owns the value update.',
      },
    },
  },
};

export const CustomTrigger: Story = {
  args: { items: variables, onSelect: () => undefined },
  render: (args) => (
    <VariablePicker {...args}>
      <Button variant="outline" size="sm">
        <Braces /> Choose variable
      </Button>
    </VariablePicker>
  ),
};

export const Controlled: Story = {
  args: { items: variables, onSelect: () => undefined },
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return <VariablePicker {...args} open={open} onOpenChange={setOpen} />;
  },
};

export const Disabled: Story = {
  args: { items: variables, onSelect: () => undefined, disabled: true },
};

export const Empty: Story = {
  args: { items: [], onSelect: () => undefined, emptyText: 'No variables are available.' },
};
