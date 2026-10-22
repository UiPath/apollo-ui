import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hash, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { FormField, FormFieldLabel } from './form-field';
import { InputGroup } from './input-group';
import type { RenderVariablePicker } from './variable-picker';
import { type VariableReferenceDescription, VariableValueControl } from './variable-value-control';

const meta = {
  title: 'Components/Core/Variable Value Control',
  component: VariableValueControl,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A value bound to a variable: the whole control is a picker showing the bound reference, and picking
a variable replaces it. Render it in an \`InputGroup\`; the panel opens at the box's width. It is the
built-in control of MetadataForm's Variable mode.

A host can render its own picker in the panel with \`renderPicker\`, which gets the bound reference
as \`value\`, and show its own name and type icon for the reference with \`describeReference\`.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VariableValueControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const variables = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      { id: 'orderId', label: 'orderId', value: '$vars.orderId', type: 'string' },
      { id: 'total', label: 'total', value: '$vars.total', type: 'number' },
    ],
  },
];

function Bound({ initial }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <FormField className="w-96">
      <FormFieldLabel htmlFor="order-id">Order id</FormFieldLabel>
      <InputGroup>
        <VariableValueControl
          id="order-id"
          value={value}
          onChange={setValue}
          variables={variables}
        />
      </InputGroup>
    </FormField>
  );
}

/** Bound to a variable; open the picker to rebind it. */
export const Default: Story = {
  args: { value: '$vars.orderId', onChange: () => {}, variables },
  render: () => <Bound initial="$vars.orderId" />,
};

/** No variable bound yet. */
export const Empty: Story = {
  args: { onChange: () => {}, variables },
  render: () => <Bound />,
};

// A host's catalogue: what it knows about each reference it can bind.
const CATALOGUE: Record<string, VariableReferenceDescription> = {
  '$vars.orderId': { label: 'Order id', icon: <Hash /> },
  '$assets.apiKey': { label: 'API key', icon: <KeyRound /> },
};
const describeReference = (reference: string) => CATALOGUE[reference];

const hostPicker: RenderVariablePicker = ({ value, onSelect }) => (
  <div className="grid gap-1 p-2 text-xs">
    <span className="px-1 text-foreground-muted">Host picker</span>
    {Object.entries(CATALOGUE).map(([reference, { label, icon }]) => (
      <button
        key={reference}
        type="button"
        aria-current={reference === value || undefined}
        onClick={() => onSelect(reference)}
        className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-surface-overlay aria-[current]:font-semibold [&_svg]:size-3.5"
      >
        {icon}
        {label}
      </button>
    ))}
  </div>
);

function HostBound() {
  const [value, setValue] = useState<string | undefined>('$vars.orderId');
  return (
    <FormField className="w-96">
      <FormFieldLabel htmlFor="host-order-id">Order id</FormFieldLabel>
      <InputGroup>
        <VariableValueControl
          id="host-order-id"
          value={value}
          onChange={setValue}
          renderPicker={hostPicker}
          describeReference={describeReference}
        />
      </InputGroup>
    </FormField>
  );
}

/** The host's own picker in the panel, and its label and type icon on the chip. */
export const HostPicker: Story = {
  args: { onChange: () => {}, renderPicker: hostPicker },
  render: () => <HostBound />,
};
