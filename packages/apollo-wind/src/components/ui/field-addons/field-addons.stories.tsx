import type { Meta, StoryObj } from '@storybook/react-vite';
import { RefreshCw, Sparkles, Type, Variable, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { FormField, FormFieldLabel } from '../form-field';
import { Input } from '../input';
import { InputGroup, InputGroupAddon, type InputGroupLayout } from '../input-group';
import { Textarea } from '../textarea';
import { FieldMenu } from './field-menu';
import { ValueModeIndicator } from './value-mode-indicator';
import type { ValueMode, ValueModeStrings } from './value-mode-strings';

const meta = {
  title: 'Components/Core/Field Addons',
  component: FieldMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Addons for a field whose value can switch between modes, such as a fixed value and an expression.
Each goes in an \`InputGroupAddon\`.

- **FieldMenu** sits in a trailing addon. Its trigger shows the current mode's icon, and
  its menu lists each mode with a description, then any field actions. With the modes hidden it is
  the field's overflow menu. The four built-in modes (Fixed value, Expression, Variable, Prompt)
  can be listed by id; a field offers only the ones it lists, Fixed value and Expression by default.
- **ValueModeIndicator** sits in a leading addon and shows \`=\` ahead of an expression. It renders
  nothing in literal mode, and the addon collapses with it.
- Every addon takes a \`strings\` prop, merged over the English defaults, which a localized host
  fills with its own translations.
`,
      },
    },
  },
  tags: ['autodocs'],
  args: { mode: 'literal', onSelect: () => {} },
} satisfies Meta<typeof FieldMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

function MenuField({ id, label, menu }: { id: string; label: string; menu: ReactNode }) {
  return (
    <FormField>
      <FormFieldLabel htmlFor={id}>{label}</FormFieldLabel>
      <InputGroup>
        <Input id={id} defaultValue="42" />
        <InputGroupAddon align="inline-end">{menu}</InputGroupAddon>
      </InputGroup>
    </FormField>
  );
}

/**
 * The built-in pair, all four built-in modes, custom and extra modes, field actions under the modes,
 * and actions alone. With the modes disabled, the trigger becomes an overflow menu.
 */
export const ModeMenu: Story = {
  render: () => {
    const [twoMode, setTwoMode] = useState<ValueMode>('literal');
    const [fourMode, setFourMode] = useState<ValueMode>('variable');
    const [custom, setCustom] = useState<'prompt' | 'variable' | 'text'>('prompt');
    return (
      <div className="grid w-96 gap-6">
        <MenuField
          id="menu-two"
          label="Built-in modes"
          menu={<FieldMenu mode={twoMode} onSelect={setTwoMode} expectedType="number" />}
        />
        <MenuField
          id="menu-four"
          label="All four built-in modes"
          menu={
            <FieldMenu
              mode={fourMode}
              onSelect={setFourMode}
              modes={['literal', 'expression', 'variable', 'prompt']}
            />
          }
        />
        <MenuField
          id="menu-extra"
          label="Custom and extra modes"
          menu={
            <FieldMenu<'prompt' | 'variable' | 'text'>
              mode={custom}
              onSelect={setCustom}
              modes={[
                {
                  id: 'variable',
                  title: 'Variable',
                  description: 'Bind to a variable from the flow',
                  icon: Variable,
                },
                {
                  id: 'text',
                  title: 'Fixed value',
                  description: 'Enter a value directly',
                  icon: Type,
                },
              ]}
              extraModes={[
                {
                  id: 'prompt',
                  title: 'Prompt',
                  description: 'Describe the value for the agent to fill in',
                  icon: Sparkles,
                },
              ]}
            />
          }
        />
        <MenuField
          id="menu-actions"
          label="With actions"
          menu={
            <FieldMenu
              mode={twoMode}
              onSelect={setTwoMode}
              actions={[
                { id: 'clear', label: 'Clear value', icon: X, onSelect: () => {} },
                { id: 'refresh', label: 'Force refresh', icon: RefreshCw, onSelect: () => {} },
              ]}
            />
          }
        />
        <MenuField
          id="menu-actions-only"
          label="Actions only"
          menu={
            <FieldMenu
              mode="literal"
              modesDisabled
              onSelect={() => {}}
              actions={[{ id: 'clear', label: 'Clear value', icon: X, onSelect: () => {} }]}
            />
          }
        />
      </div>
    );
  },
};

/** An expression, a fixed value (no indicator and no gap), and a disabled expression. */
export const ModeIndicator: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <FormField>
        <FormFieldLabel htmlFor="indicator-expression">Expression</FormFieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <ValueModeIndicator mode="expression" className="px-0" />
          </InputGroupAddon>
          <Input id="indicator-expression" className="font-mono" defaultValue="$vars.total" />
        </InputGroup>
      </FormField>
      <FormField>
        <FormFieldLabel htmlFor="indicator-literal">Fixed value</FormFieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <ValueModeIndicator mode="literal" />
          </InputGroupAddon>
          <Input id="indicator-literal" defaultValue="42" />
        </InputGroup>
      </FormField>
      <FormField>
        <FormFieldLabel htmlFor="indicator-disabled">Disabled expression</FormFieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <ValueModeIndicator mode="expression" disabled className="px-0" />
          </InputGroupAddon>
          <Input
            id="indicator-disabled"
            className="font-mono"
            defaultValue="$vars.total"
            disabled
          />
        </InputGroup>
      </FormField>
    </div>
  ),
};

function ModeAwareField({
  id,
  label,
  layout = 'row',
  strings,
}: {
  id: string;
  label: string;
  layout?: InputGroupLayout;
  strings?: Partial<ValueModeStrings>;
}) {
  const [mode, setMode] = useState<ValueMode>('expression');
  const expression = mode === 'expression';
  return (
    <FormField>
      <FormFieldLabel htmlFor={id}>{label}</FormFieldLabel>
      <InputGroup layout={layout}>
        <InputGroupAddon>
          <ValueModeIndicator mode={mode} strings={strings} className="px-0" />
        </InputGroupAddon>
        {layout === 'grow' ? (
          <Textarea
            id={id}
            rows={3}
            className={expression ? 'font-mono' : undefined}
            defaultValue={'$vars.order.lines\n  .map((line) => line.total)\n  .reduce(sum)'}
          />
        ) : (
          <Input
            id={id}
            className={expression ? 'font-mono' : undefined}
            defaultValue="$vars.order.id"
          />
        )}
        <InputGroupAddon align="inline-end">
          <FieldMenu mode={mode} onSelect={setMode} strings={strings} />
        </InputGroupAddon>
      </InputGroup>
    </FormField>
  );
}

/**
 * Switch a field's mode from its menu. The indicator comes and goes with the mode, and both addons
 * stay on the first line of a multi-line value.
 */
export const ModeSwitching: Story = {
  render: () => (
    <div className="grid w-96 gap-6">
      <ModeAwareField id="switching-row" label="Order id" />
      <ModeAwareField id="switching-grow" label="Order total" layout="grow" />
    </div>
  ),
};

const FRENCH_STRINGS: Partial<ValueModeStrings> = {
  literalTitle: 'Valeur fixe',
  literalDescription: 'Saisir une valeur directement',
  literalNumberDescription: 'Saisir une valeur numérique',
  literalBooleanDescription: 'Choisir vrai ou faux',
  expressionTitle: 'Expression',
  expressionDescription: 'Expression JavaScript',
  fieldActions: 'Actions du champ',
  expressionIndicator: 'Expression JavaScript',
};

/** Every string comes from the `strings` prop, merged over the English defaults. */
export const Localized: Story = {
  render: () => (
    <div className="w-96">
      <ModeAwareField id="localized" label="Numéro de commande" strings={FRENCH_STRINGS} />
    </div>
  ),
};
