import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormField, FormFieldLabel } from './form-field';
import { InputGroup } from './input-group';
import { PromptValueControl } from './prompt-value-control';

const meta = {
  title: 'Components/Core/Prompt Value Control',
  component: PromptValueControl,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A prompt an agent fills the value from: a textarea that starts one line tall and grows to six. Render
it in an \`InputGroup\` with \`variant="agent"\` and \`layout="grow"\`, whose tinted box marks the value
as a prompt. It is the built-in control of MetadataForm's Prompt mode.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PromptValueControl>;

export default meta;
type Story = StoryObj<typeof meta>;

function Prompt({ initial }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <FormField className="w-96">
      <FormFieldLabel htmlFor="summary">Summary</FormFieldLabel>
      <InputGroup variant="agent" layout="grow">
        <PromptValueControl id="summary" value={value} onChange={setValue} />
      </InputGroup>
    </FormField>
  );
}

/** Type past the end of the line: the box grows to six lines, then scrolls. */
export const Default: Story = {
  args: { onChange: () => {} },
  render: () => <Prompt initial="A one-line summary of the confirmation email" />,
};

/** An empty prompt shows its placeholder. */
export const Empty: Story = {
  args: { onChange: () => {} },
  render: () => <Prompt />,
};
