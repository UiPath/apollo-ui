import type { Meta, StoryObj } from '@storybook/react-vite';
import { Eraser, Type, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from './button';
import { AiAssistAction, InsertVariableAction } from './field-actions';
import { type ValueMode, ValueModeIndicator, ValueModeMenu } from './field-addons';
import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldHeader,
  FormFieldLabel,
} from './form-field';
import { Input } from './input';
import { InputGroup, InputGroupAddon } from './input-group';
import { TooltipProvider } from './tooltip';

const meta = {
  title: 'Components/Core/Form Field',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The parts stacked around a field's control. They hold no form state, so they compose the same way
in a metadata-driven form as in a hand-built panel.

- **FormField** stacks the parts with the field rhythm.
- **FormFieldLabel** names the field, with an optional required marker and info tooltip.
- **FormFieldHeader** is the label row for a field whose header carries more than a label: a
  leading glyph, a type badge and actions such as Insert variable. It sits outside the control's
  box, so the actions never stretch it.
- **FormFieldDescription** and **FormFieldError** go below the control.
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
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every part together, as a metadata form renders a mode-switchable field: a header with actions,
 * the control's box with value-mode addons, and the validation message. Switch to Expression from
 * the menu, insert a variable from the header, or clear the value to see the error.
 */
export const FullField: Story = {
  render: () => {
    const [mode, setMode] = useState<ValueMode>('literal');
    const [value, setValue] = useState('1042');
    const expression = mode === 'expression';
    return (
      <FormField className="w-96">
        <FormFieldHeader
          label="Order id"
          htmlFor="full-order-id"
          required
          tooltip="The order to look up."
          actions={
            <>
              <AiAssistAction hint="Output: string value" onGenerate={() => {}} />
              <InsertVariableAction
                variables={[
                  { label: 'Order id', value: '$vars.orderId' },
                  { label: 'Customer id', value: '$vars.customerId' },
                ]}
                onInsert={(variable) => {
                  setMode('expression');
                  setValue((v) => (v ? `${v} ${variable}` : variable));
                }}
              />
            </>
          }
        />
        <InputGroup>
          <InputGroupAddon>
            <ValueModeIndicator mode={mode} className="px-0" />
          </InputGroupAddon>
          <Input
            id="full-order-id"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!value || undefined}
            className={expression ? 'font-mono' : undefined}
            placeholder={expression ? '$vars.orderId' : 'Enter an order id'}
          />
          <InputGroupAddon align="inline-end">
            <ValueModeMenu
              mode={mode}
              onSelect={setMode}
              actions={[
                { id: 'clear', label: 'Clear value', icon: X, onSelect: () => setValue('') },
              ]}
            />
          </InputGroupAddon>
        </InputGroup>
        <FormFieldError>{value ? null : 'Enter an order id to continue.'}</FormFieldError>
      </FormField>
    );
  },
};

/** Label, control, then either supporting text or the validation message. */
export const Anatomy: Story = {
  render: () => {
    const [name, setName] = useState('');
    return (
      <div className="grid w-80 gap-6">
        <FormField>
          <FormFieldLabel htmlFor="anatomy-queue">Queue name</FormFieldLabel>
          <InputGroup>
            <Input id="anatomy-queue" defaultValue="Invoices" />
          </InputGroup>
          <FormFieldDescription>Shown to operators in the queue list.</FormFieldDescription>
        </FormField>
        <FormField>
          <FormFieldLabel htmlFor="anatomy-name" required tooltip="Unique within the folder.">
            Process name
          </FormFieldLabel>
          <InputGroup>
            <Input
              id="anatomy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!name || undefined}
              placeholder="Enter a name"
            />
          </InputGroup>
          <FormFieldError>{name ? null : 'Enter a process name to continue.'}</FormFieldError>
        </FormField>
      </div>
    );
  },
};

function HeaderExample({ id, children }: { id: string; children: ReactNode }) {
  return (
    <FormField>
      {children}
      <InputGroup>
        <Input id={id} placeholder="Enter a value" />
      </InputGroup>
    </FormField>
  );
}

/** Each part of the header row. `leading` and `badge` only ride a row a label or actions opened. */
export const Header: Story = {
  render: () => (
    <div className="grid w-96 gap-6">
      <HeaderExample id="header-plain">
        <FormFieldHeader label="Summary" htmlFor="header-plain" />
      </HeaderExample>
      <HeaderExample id="header-required">
        <FormFieldHeader
          label="Summary"
          htmlFor="header-required"
          required
          tooltip="Shown in the run history."
        />
      </HeaderExample>
      <HeaderExample id="header-badges">
        <FormFieldHeader
          label="Payload"
          htmlFor="header-badges"
          leading={<Type className="size-3.5 text-muted-foreground" />}
          badge={<span className="text-xs text-muted-foreground">string</span>}
        />
      </HeaderExample>
      <HeaderExample id="header-actions">
        <FormFieldHeader
          label="Payload"
          htmlFor="header-actions"
          actions={
            <Button variant="ghost" size="3xs" className="gap-1 text-muted-foreground">
              <Eraser />
              Clear
            </Button>
          }
        />
      </HeaderExample>
      <HeaderExample id="header-muted">
        <FormFieldHeader label="Retry delay" htmlFor="header-muted" variant="muted" />
      </HeaderExample>
    </div>
  ),
};
