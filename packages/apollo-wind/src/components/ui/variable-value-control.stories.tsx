import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormField, FormFieldLabel } from './form-field';
import { InputGroup } from './input-group';
import { VariableValueControl } from './variable-value-control';

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
