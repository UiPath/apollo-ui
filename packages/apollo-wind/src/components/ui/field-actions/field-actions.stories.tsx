import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { FormField, FormFieldHeader } from '../form-field';
import { Input } from '../input';
import { InputGroup } from '../input-group';
import { TooltipProvider } from '../tooltip';
import { AiAssistAction } from './ai-assist-action';
import { InsertVariableAction } from './insert-variable-action';

const meta = {
  title: 'Components/Core/Field Actions',
  component: InsertVariableAction,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Actions for a field's header row, passed to \`FormFieldHeader\`'s \`actions\`.

- **InsertVariableAction** opens a variable picker and reports the pick. It is disabled with nothing
  to insert or nowhere to insert it, and collapses to its icon below a 260px \`@container\`.
- **AiAssistAction** opens a prompt and reports it. It needs an ancestor \`TooltipProvider\`.
`,
      },
    },
  },
  tags: ['autodocs'],
  args: { variables: [] },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof InsertVariableAction>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIABLES = [
  { label: 'Order id', value: '$vars.orderId' },
  { label: 'Customer email', value: '$vars.customerEmail' },
];

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/** Enabled, disabled with no variables, compact, collapsed by a narrow container, and translated. */
export const InsertVariable: Story = {
  render: () => {
    const [inserted, setInserted] = useState<string | null>(null);
    return (
      <div className="grid w-80 gap-5">
        <Example label={inserted ? `Inserted ${inserted}` : 'Enabled'}>
          <InsertVariableAction variables={VARIABLES} onInsert={setInserted} />
        </Example>
        <Example label="No variables">
          <InsertVariableAction variables={[]} onInsert={setInserted} />
        </Example>
        <Example label="Compact">
          <InsertVariableAction variables={VARIABLES} onInsert={setInserted} compact />
        </Example>
        <Example label="In a container under 260px">
          <div className="@container w-56 rounded border border-dashed p-1">
            <InsertVariableAction variables={VARIABLES} onInsert={setInserted} />
          </div>
        </Example>
        <Example label="Translated">
          <InsertVariableAction
            variables={VARIABLES}
            onInsert={setInserted}
            strings={{ label: 'Insérer', ariaLabel: 'Insérer une variable' }}
          />
        </Example>
      </div>
    );
  },
};

/** With a hint under the prompt, and with translated strings. */
export const AiAssist: Story = {
  render: () => {
    const [prompt, setPrompt] = useState<string | null>(null);
    return (
      <div className="grid w-80 gap-5">
        <Example label={prompt ? `Generated from "${prompt}"` : 'With a hint'}>
          <AiAssistAction hint="Output: string value" onGenerate={setPrompt} />
        </Example>
        <Example label="Translated">
          <AiAssistAction
            onGenerate={setPrompt}
            strings={{
              trigger: 'Assistant IA',
              tooltip: 'Générer avec l’IA',
              prompt: 'Décrivez ce que vous voulez',
              promptPlaceholder: 'Afficher une valeur de l’étape précédente',
              generate: 'Générer',
            }}
          />
        </Example>
      </div>
    );
  },
};

/** Both actions in a field's header row. Insert variable appends to the value. */
export const InHeader: Story = {
  render: () => {
    const [value, setValue] = useState('Order ');
    return (
      <FormField className="w-96">
        <FormFieldHeader
          label="Subject"
          htmlFor="actions-subject"
          actions={
            <>
              <AiAssistAction hint="Output: string value" onGenerate={() => {}} />
              <InsertVariableAction
                variables={VARIABLES}
                onInsert={(variable) => setValue((v) => (v ? `${v} ${variable}` : variable))}
              />
            </>
          }
        />
        <InputGroup>
          <Input id="actions-subject" value={value} onChange={(e) => setValue(e.target.value)} />
        </InputGroup>
      </FormField>
    );
  },
};
