import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import {
  createAiAssistAction,
  createClearAction,
  createInsertVariableAction,
  type FormVariablePicker,
} from './field-actions';
import type { FormPlugin, FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';

const meta = {
  title: 'Forms/Field actions',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`headerActions\` and \`menuActions\` list a field's actions by id, in render order. They work with
or without \`valueModes\`. A plugin registers actions under \`fieldActions.header\` and
\`fieldActions.menu\`, each built from its factory with the configuration it needs:
\`createInsertVariableAction\` (variables, reference format), \`createAiAssistAction\` (generator,
per-field placeholder) and \`createClearAction\`, which is registered by default. Insert writes at
the caret of a control that takes text; otherwise it switches the field to an expression, asking
first before it replaces a value other than a number or boolean. Their strings come from
\`FormPlugin.strings\`, and a factory's own \`strings\` win.

A host can render its own panels in these popovers.
\`createInsertVariableAction({ renderPicker })\` replaces the picker and wins over \`variables\`; a
pick is written as a picked variable would be.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const variables = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      {
        id: 'orderId',
        label: 'orderId',
        value: '$vars.orderId',
        type: 'string',
      },
      { id: 'total', label: 'total', value: '$vars.total', type: 'number' },
    ],
  },
];

function Demo({ schema, plugins }: { schema: FormSchema; plugins: FormPlugin[] }) {
  const [values, setValues] = useState<Record<string, unknown>>(schema.initialData ?? {});
  const all = useMemo<FormPlugin[]>(
    () => [
      ...plugins,
      {
        name: 'values',
        onFormInit: (ctx) => setValues(ctx.form.getValues()),
        onValueChange: (_name, _value, ctx) => setValues({ ...ctx.form.getValues() }),
      },
    ],
    [plugins]
  );
  return (
    <div className="grid max-w-xl gap-6">
      <MetadataForm schema={schema} plugins={all} />
      <pre className="rounded-md bg-surface-overlay p-3 text-xs">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
}

const schema: FormSchema = {
  id: 'field-actions',
  title: 'Field actions',
  initialData: { greeting: 'Hello ', priority: 'high', amount: { $mode: 'literal', value: 12 } },
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'greeting',
          type: 'text',
          label: 'Greeting',
          description: 'Insert variable writes an interpolated reference at the caret.',
          headerActions: ['insert-variable'],
        },
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' },
          ],
          menuActions: ['clear'],
        },
        {
          name: 'amount',
          type: 'number',
          label: 'Amount',
          description:
            'A number cannot take text at a caret, so Insert switches it to an expression.',
          valueModes: { modes: ['literal', 'expression'] },
          headerActions: ['insert-variable'],
          menuActions: ['clear'],
        },
        {
          name: 'summary',
          type: 'textarea',
          label: 'Summary',
          valueModes: { modes: ['literal', 'expression'] },
          headerActions: ['insert-variable', 'ai-assist'],
        },
      ],
    },
  ],
};

const plugin: FormPlugin = {
  name: 'host',
  fieldActions: {
    header: {
      'insert-variable': createInsertVariableAction({
        variables,
        // A reference inside fixed-value text is interpolated; an expression takes it bare.
        formatReference: (reference, { mode }) =>
          mode === 'literal' ? `{{ ${reference} }}` : reference,
      }),
      'ai-assist': createAiAssistAction({
        // A stand-in for a model call.
        generate: ({ prompt }) =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ value: `Generated from "${prompt}"` }), 800)
          ),
        hint: 'Writes in the mode the field is in.',
      }),
    },
    menu: { clear: createClearAction() },
  },
};

/** Header actions, a Clear row, both on one field with modes, and AI assist with a mock generator. */
export const Actions: Story = {
  render: () => <Demo schema={schema} plugins={[plugin]} />,
};

// Stand-in for a host's own picker, such as a virtualized tree with an Assets tab.
const hostPicker: FormVariablePicker = ({ onSelect, close }) => (
  <div className="grid gap-1 p-2 text-xs">
    <span className="px-1 text-foreground-muted">Host picker</span>
    {['$vars.orderId', '$assets.apiKey'].map((reference) => (
      <button
        key={reference}
        type="button"
        onClick={() => onSelect(reference)}
        className="rounded px-2 py-1 text-left font-mono hover:bg-surface-overlay"
      >
        {reference}
      </button>
    ))}
    <button type="button" onClick={close} className="px-1 text-left text-foreground-muted">
      Cancel
    </button>
  </div>
);

const hostPlugin: FormPlugin = {
  name: 'host',
  fieldActions: {
    header: {
      'insert-variable': createInsertVariableAction({
        renderPicker: hostPicker,
        formatReference: (reference, { mode }) =>
          mode === 'literal' ? `{{ ${reference} }}` : reference,
      }),
    },
  },
};

/** Insert variable rendering the host's own picker, through its factory. */
export const HostPanels: Story = {
  render: () => <Demo schema={schema} plugins={[hostPlugin]} />,
};
