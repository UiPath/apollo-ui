import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hash } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';
import { renderToString } from 'react-dom/server';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAiAssistAction,
  createInsertVariableAction,
  type FieldActionContext,
  type FieldActionGenerate,
} from './field-actions';
import type {
  CustomFieldComponentProps,
  FieldMetadata,
  FormPlugin,
  FormSchema,
} from './form-schema';
import { MetadataForm } from './metadata-form';
import { envelopeCodec, type ValueModeCodec, type ValueModeControlProps } from './value-modes';

const MODES = { modes: ['literal', 'expression'] };

const insertPlugin = (options: Parameters<typeof createInsertVariableAction>[0]): FormPlugin => ({
  name: 'host',
  fieldActions: { header: { 'insert-variable': createInsertVariableAction(options) } },
});

const aiPlugin = (generate: FieldActionGenerate): FormPlugin => ({
  name: 'host',
  fieldActions: { header: { 'ai-assist': createAiAssistAction({ generate }) } },
});

function setup(fields: FieldMetadata[], plugins: FormPlugin[] = [], initialData = {}) {
  let form: UseFormReturn<FieldValues> | undefined;
  const probe: FormPlugin = {
    name: 'probe',
    onFormInit: (ctx) => {
      form = ctx.form;
    },
  };
  const schema: FormSchema = {
    id: 'value-modes',
    title: 'Value modes',
    initialData,
    sections: [{ id: 's', fields }],
  };
  const user = userEvent.setup();
  const result = render(<MetadataForm schema={schema} plugins={[...plugins, probe]} />);
  const values = () => {
    if (!form) throw new Error('form not initialized');
    return form.getValues();
  };
  return { user, values, ...result };
}

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

async function pickMode(user: ReturnType<typeof userEvent.setup>, from: string, to: string) {
  await user.click(screen.getByRole('button', { name: from }));
  await user.click(await screen.findByRole('menuitemradio', { name: new RegExp(to) }));
}

const submit = async () => {
  fireEvent.submit(document.querySelector('form')!);
  await settle();
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('value modes', () => {
  it('reads a raw stored value as literal and wraps it on its first write', async () => {
    const { user, values } = setup(
      [{ name: 'title', type: 'text', label: 'Title', valueModes: MODES }],
      [],
      { title: 'Hello' }
    );
    await settle();
    expect(screen.getByLabelText('Title')).toHaveValue('Hello');
    expect(screen.getByRole('button', { name: 'Fixed value' })).toBeInTheDocument();
    expect(values().title).toBe('Hello');
    await user.type(screen.getByLabelText('Title'), '!');
    expect(values().title).toStrictEqual({ $mode: 'literal', value: 'Hello!' });
  });

  it('shows the expression glyph and a plain input for an expression value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setup([{ name: 'count', type: 'number', label: 'Count', valueModes: MODES }], [], {
      count: { $mode: 'expression', value: 'a + 1' },
    });
    await settle();
    expect(screen.getByRole('img', { name: 'JavaScript expression' })).toBeInTheDocument();
    expect(screen.getByLabelText('Count')).not.toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Count')).toHaveValue('a + 1');
    expect(warn).not.toHaveBeenCalled();
  });

  it('asks before a switch that loses the value, and writes only on confirm', async () => {
    const { user, values } = setup(
      [{ name: 'title', type: 'text', label: 'Title', valueModes: MODES }],
      [],
      { title: 'Hello' }
    );
    await settle();

    await pickMode(user, 'Fixed value', 'Expression');
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(values().title).toBe('Hello');

    await pickMode(user, 'Fixed value', 'Expression');
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Switch',
      })
    );
    expect(values().title).toStrictEqual({ $mode: 'expression' });
    expect(screen.getByRole('button', { name: 'Expression' })).toBeInTheDocument();
  });

  it('switches an expression back to a fixed value and shows the emptied control', async () => {
    const { user, values } = setup(
      [{ name: 'retries', type: 'number', label: 'Retries', valueModes: MODES }],
      [],
      { retries: { $mode: 'expression', value: 'config.retries + 1' } }
    );
    await settle();

    await pickMode(user, 'Expression', 'Fixed value');
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
    );
    expect(values().retries).toStrictEqual({ $mode: 'literal' });
    expect(screen.getByRole('button', { name: 'Fixed value' })).toBeInTheDocument();
    expect(screen.getByLabelText('Retries')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Retries')).toHaveValue(null);
    expect(screen.queryByRole('img', { name: 'JavaScript expression' })).toBeNull();
  });

  it('shows each mode its own value while cycling through modes', async () => {
    const { user, values } = setup(
      [{ name: 'title', type: 'text', label: 'Title', valueModes: MODES }],
      [],
      { title: 'Hello' }
    );
    await settle();
    const confirm = async () =>
      user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
      );

    await pickMode(user, 'Fixed value', 'Expression');
    await confirm();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    await user.type(screen.getByLabelText('Title'), 'a + b');
    await pickMode(user, 'Expression', 'Fixed value');
    await confirm();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(values().title).toStrictEqual({ $mode: 'literal' });
  });

  it('writes an ok conversion straight away', async () => {
    const codec: ValueModeCodec = {
      ...envelopeCodec,
      convert: (from) => ({ kind: 'ok', value: String(from.value) }),
    };
    const { user, values } = setup(
      [{ name: 'count', type: 'number', label: 'Count', valueModes: MODES }],
      [{ name: 'host', valueModes: { codecs: { default: codec } } }],
      { count: 4 }
    );
    await settle();
    await pickMode(user, 'Fixed value', 'Expression');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(values().count).toEqual({ $mode: 'expression', value: '4' });
  });

  describe('empty values', () => {
    it('switches an empty field without asking, for the envelope codec and a custom one', async () => {
      const lossy: ValueModeCodec = {
        decode: (stored) =>
          typeof stored === 'string' && stored.startsWith('=')
            ? { mode: 'expression', value: stored.slice(1) }
            : { mode: 'literal', value: stored },
        // An empty value in any mode encodes to `null`, so only local state keeps the mode.
        encode: (mode, inner) =>
          inner == null || inner === '' ? null : mode === 'literal' ? inner : `=${inner}`,
        convert: () => ({ kind: 'lossy', value: undefined }),
      };
      const { user } = setup(
        [
          { name: 'a', type: 'text', label: 'A', valueModes: MODES },
          {
            name: 'b',
            type: 'text',
            label: 'B',
            valueModes: { ...MODES, codec: 'lossy' },
          },
        ],
        [{ name: 'host', valueModes: { codecs: { lossy } } }]
      );
      await settle();

      const [a, b] = screen.getAllByRole('button', { name: 'Fixed value' });
      await user.click(a);
      await user.click(await screen.findByRole('menuitemradio', { name: /Expression/ }));
      await user.click(b);
      await user.click(await screen.findByRole('menuitemradio', { name: /Expression/ }));

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.getAllByRole('button', { name: 'Expression' })).toHaveLength(2);
    });

    it('stores the chosen mode of an empty field and keeps it across re-renders', async () => {
      const field: FieldMetadata = {
        name: 'a',
        type: 'text',
        label: 'A',
        valueModes: { ...MODES, defaultMode: 'expression' },
      };
      const { user, rerender, values } = setup([field]);
      await settle();
      expect(screen.getByRole('button', { name: 'Expression' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'JavaScript expression' })).toBeInTheDocument();

      await pickMode(user, 'Expression', 'Fixed value');
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(values().a).toStrictEqual({ $mode: 'literal' });
      rerender(
        <MetadataForm
          schema={{
            id: 'value-modes',
            title: 'Value modes',
            sections: [{ id: 's', fields: [field] }],
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'Fixed value' })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('validates a literal value by its field type and requires a value in other modes', async () => {
      setup(
        [
          {
            name: 'count',
            type: 'number',
            label: 'Count',
            valueModes: MODES,
            validation: { required: true, min: 5 },
          },
          {
            name: 'title',
            type: 'text',
            label: 'Title',
            valueModes: MODES,
            validation: { required: true },
          },
          {
            name: 'formula',
            type: 'text',
            label: 'Formula',
            valueModes: MODES,
          },
        ],
        [
          {
            name: 'host',
            valueModes: {
              definitions: {
                expression: { validate: (value) => (value === '(' ? 'Unbalanced' : undefined) },
              },
            },
          },
        ],
        {
          count: 2,
          title: { $mode: 'expression', value: '' },
          formula: { $mode: 'expression', value: '(' },
        }
      );
      await settle();
      await submit();

      expect(screen.getByText('Must be at least 5')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('Unbalanced')).toBeInTheDocument();
      expect(screen.getByLabelText('Formula')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('controls', () => {
    it('warns once about a mode with no definition and renders an input', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = setup(
        [
          {
            name: 'a',
            type: 'text',
            label: 'A',
            valueModes: { modes: ['literal', 'mystery'] },
          },
        ],
        [],
        { a: { $mode: 'mystery', value: 'x' } }
      );
      await settle();
      rerender(
        <MetadataForm
          schema={{
            id: 'value-modes',
            title: 'Value modes',
            initialData: { a: { $mode: 'mystery', value: 'x' } },
            sections: [
              {
                id: 's',
                fields: [
                  {
                    name: 'a',
                    type: 'text',
                    label: 'A',
                    valueModes: { modes: ['literal', 'mystery'] },
                  },
                ],
              },
            ],
          }}
        />
      );
      await settle();
      expect(screen.getByLabelText('A')).toHaveValue('x');
      const mentions = warn.mock.calls.filter(([message]) =>
        String(message).includes('"mystery", which has no definition')
      );
      expect(mentions).toHaveLength(1);
    });

    it('renders a registered control for a host mode, with its geometry', async () => {
      const Control = forwardRef<unknown, ValueModeControlProps>(function Control(props) {
        return (
          <input
            id={props.id}
            value={String(props.value ?? '')}
            onChange={(e) => props.onChange(e.target.value)}
            {...props.controlProps}
          />
        );
      });
      const { user, values } = setup(
        [
          {
            name: 'code',
            type: 'text',
            label: 'Code',
            valueModes: { modes: ['literal', 'regex'] },
          },
        ],
        [
          {
            name: 'host',
            valueModes: {
              definitions: {
                regex: {
                  icon: Hash,
                  title: 'Pattern',
                  control: { component: Control, layout: 'grow', variant: 'ghost' },
                },
              },
            },
          },
        ],
        { code: { $mode: 'regex', value: '^a' } }
      );
      await settle();

      const input = screen.getByLabelText('Code');
      expect(input.closest('[data-slot="input-group"]')).toHaveAttribute('data-layout', 'grow');
      await user.type(input, 'b');
      expect(values().code).toEqual({ $mode: 'regex', value: '^ab' });
      expect(screen.getByRole('button', { name: 'Pattern' })).toBeInTheDocument();
    });

    it('switches from a host mode back to a fixed value', async () => {
      const Control = (props: ValueModeControlProps) => (
        <input
          id={props.id}
          value={String(props.value ?? '')}
          onChange={(e) => props.onChange(e.target.value)}
        />
      );
      const { user, values } = setup(
        [
          {
            name: 'code',
            type: 'text',
            label: 'Code',
            valueModes: { modes: ['literal', 'regex'] },
          },
        ],
        [
          {
            name: 'host',
            valueModes: {
              definitions: {
                regex: { icon: Hash, title: 'Pattern', control: { component: Control } },
              },
            },
          },
        ],
        { code: { $mode: 'regex', value: '^a' } }
      );
      await settle();

      await pickMode(user, 'Pattern', 'Fixed value');
      await user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
      );
      expect(values().code).toStrictEqual({ $mode: 'literal' });
      expect(screen.getByRole('button', { name: 'Fixed value' })).toBeInTheDocument();
      expect(screen.getByLabelText('Code')).toHaveValue('');
    });

    it('changes only the control of a built-in mode, keeping its localized title', async () => {
      const Code = (props: ValueModeControlProps) => (
        <textarea
          id={props.id}
          data-testid="code"
          value={String(props.value ?? '')}
          onChange={(e) => props.onChange(e.target.value)}
        />
      );
      setup(
        [{ name: 'f', type: 'text', label: 'F', valueModes: MODES }],
        [
          {
            name: 'host',
            valueModes: {
              definitions: { expression: { control: { component: Code, layout: 'fill' } } },
            },
            strings: { valueModes: { expressionTitle: 'Formule' } },
          },
        ],
        { f: { $mode: 'expression', value: 'a' } }
      );
      await settle();
      expect(screen.getByTestId('code')).toHaveValue('a');
      expect(screen.getByRole('button', { name: 'Formule' })).toBeInTheDocument();
      expect(screen.getByTestId('code').closest('[data-slot="input-group"]')).toHaveAttribute(
        'data-layout',
        'fill'
      );
    });

    it('lets a field name a registered control, ahead of the plugin defaults', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const Named = (props: ValueModeControlProps) => (
        <input id={props.id} data-testid="named" value={String(props.value ?? '')} readOnly />
      );
      const Default = (props: ValueModeControlProps) => (
        <input id={props.id} data-testid="default" readOnly />
      );
      setup(
        [
          {
            name: 'a',
            type: 'text',
            label: 'A',
            valueModes: { ...MODES, controls: { literal: 'named' } },
          },
          {
            name: 'b',
            type: 'text',
            label: 'B',
            valueModes: { ...MODES, controls: { literal: 'missing' } },
          },
        ],
        [
          {
            name: 'host',
            valueModes: {
              controlRegistry: { named: { component: Named } },
              literalControls: { text: { component: Default } },
            },
          },
        ],
        { a: 'x', b: 'y' }
      );
      await settle();
      expect(screen.getByTestId('named')).toHaveValue('x');
      // An unregistered name warns and falls through to the plugin default.
      expect(screen.getByTestId('default')).toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
    });

    it('prefers the plugin literal control for a field type over the built-in one', async () => {
      const Stepper = (props: ValueModeControlProps) => (
        <button type="button" id={props.id} onClick={() => props.onChange(Number(props.value) + 1)}>
          step {String(props.value)}
        </button>
      );
      const { user, values } = setup(
        [{ name: 'n', type: 'number', label: 'N', valueModes: MODES }],
        [
          {
            name: 'host',
            valueModes: {
              literalControls: { number: { component: Stepper } },
            },
          },
        ],
        { n: 1 }
      );
      await settle();
      // The header's label names the control, which is how the label reaches a registered control.
      await user.click(screen.getByRole('button', { name: 'N' }));
      expect(values().n).toStrictEqual({ $mode: 'literal', value: 2 });
    });
  });

  describe('booleans', () => {
    it('renders a tri-state radio group named by the header', async () => {
      const { user, values } = setup(
        [{ name: 'flag', type: 'boolean', label: 'Flag', valueModes: MODES }],
        [],
        { flag: true }
      );
      await settle();

      const group = screen.getByRole('radiogroup');
      const label = screen.getByText('Flag');
      expect(group).toHaveAttribute('aria-labelledby', 'flag-label');
      expect(label.closest('label')).toHaveAttribute('id', 'flag-label');

      expect(screen.getByRole('radio', { name: 'True' })).toBeChecked();
      await user.click(screen.getByRole('radio', { name: 'False' }));
      expect(values().flag).toStrictEqual({ $mode: 'literal', value: false });
      await user.click(screen.getByRole('radio', { name: 'False' }));
      expect(values().flag).toStrictEqual({ $mode: 'literal' });
      // Unset, not back to the initial `true`.
      for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
      await user.click(screen.getByRole('radio', { name: 'True' }));
      expect(values().flag).toStrictEqual({ $mode: 'literal', value: true });
    });

    it('renders the radios without value modes too, named by the label', async () => {
      const { user, values } = setup([{ name: 'flag', type: 'boolean', label: 'Flag' }]);
      await settle();
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'flag-label');
      await user.click(screen.getByRole('radio', { name: 'False' }));
      expect(values().flag).toBe(false);
    });

    it('clears a plain boolean that started with a value', async () => {
      const { user, values } = setup([{ name: 'flag', type: 'boolean', label: 'Flag' }], [], {
        flag: true,
      });
      await settle();
      await user.click(screen.getByRole('radio', { name: 'True' }));
      expect(values().flag).toBeNull();
      for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    });

    it('keeps a switch a switch, with value modes or without', async () => {
      setup([
        { name: 'plain', type: 'switch', label: 'Plain' },
        { name: 'moded', type: 'switch', label: 'Moded', valueModes: MODES },
      ]);
      await settle();
      expect(screen.getAllByRole('switch')).toHaveLength(2);
      expect(screen.getByRole('switch', { name: 'Moded' })).toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).toBeNull();
    });
  });
});

describe('field actions', () => {
  it('renders an overflow menu, and no modes, for menu actions alone', async () => {
    const { user, values } = setup(
      [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          menuActions: ['clear'],
        },
      ],
      [],
      { title: 'Hello' }
    );
    await settle();

    await user.click(screen.getByRole('button', { name: 'Field actions' }));
    expect(screen.queryByRole('menuitemradio')).toBeNull();
    await user.click(await screen.findByRole('menuitem', { name: /Clear value/ }));
    expect(values().title).toBeNull();
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('clears a select back to its placeholder', async () => {
    const { user, values } = setup(
      [
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          placeholder: 'Pick one',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' },
          ],
          menuActions: ['clear'],
        },
      ],
      [],
      { priority: 'high' }
    );
    await settle();
    expect(screen.getByRole('combobox')).toHaveTextContent('High');

    await user.click(screen.getByRole('button', { name: 'Field actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Clear value/ }));
    expect(values().priority).toBeNull();
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick one');
  });

  it('clears a mode-aware value in its mode', async () => {
    const { user, values } = setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          valueModes: MODES,
          menuActions: ['clear'],
        },
      ],
      [],
      { a: { $mode: 'expression', value: 'x' } }
    );
    await settle();
    await user.click(screen.getByRole('button', { name: 'Expression' }));
    await user.click(await screen.findByRole('menuitem', { name: /Clear value/ }));
    expect(values().a).toStrictEqual({ $mode: 'expression' });
    expect(screen.getByRole('button', { name: 'Expression' })).toBeInTheDocument();
  });

  it('renders header actions in their order, and lets a plugin replace a built-in', async () => {
    const seen: FieldActionContext[] = [];
    const onSelect = vi.fn();
    setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          headerActions: ['second', 'first'],
          menuActions: ['clear'],
        },
        {
          name: 'b',
          type: 'text',
          label: 'B',
          valueModes: MODES,
          headerActions: ['first'],
        },
      ],
      [
        {
          name: 'host',
          fieldActions: {
            header: {
              first: {
                id: 'first',
                render: (ctx) => {
                  seen.push(ctx);
                  return <button type="button">First {ctx.name}</button>;
                },
              },
              second: {
                id: 'second',
                render: () => <button type="button">Second</button>,
              },
            },
            menu: { clear: { id: 'clear', label: 'Wipe', onSelect } },
          },
        },
      ]
    );
    await settle();

    const header = screen.getByText('First a').parentElement!;
    expect(
      within(header)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Second', 'First a']);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Field actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Wipe' }));
    expect(onSelect).toHaveBeenCalled();

    const forA = seen.find((ctx) => ctx.name === 'a')!;
    const forB = seen.find((ctx) => ctx.name === 'b')!;
    expect(forA.mode).toBeUndefined();
    expect(forA.setModeValue).toBeUndefined();
    expect(forB.mode).toEqual({ mode: 'literal', value: undefined });
  });

  it('renders a custom component inside the anatomy with its registration geometry', async () => {
    const Picker = (props: CustomFieldComponentProps) => (
      <input
        id={props.name}
        data-testid="picker"
        value={String(props.value ?? '')}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
    setup(
      [
        {
          name: 'thing',
          type: 'custom',
          label: 'Thing',
          component: 'Picker',
          menuActions: ['clear'],
        },
      ],
      [
        {
          name: 'host',
          components: {
            Picker: { component: Picker, layout: 'grow', variant: 'ghost' },
          },
        },
      ]
    );
    await settle();
    const group = screen.getByTestId('picker').closest('[data-slot="input-group"]');
    expect(group).toHaveAttribute('data-layout', 'grow');
    expect(group?.className).toContain('bg-surface-overlay');
    expect(group?.className).not.toContain('border-input');
  });

  describe('insert variable', () => {
    const variables = [{ id: 'order', label: 'Order id', value: '$vars.orderId' }];

    it('inserts at the caret of a text field', async () => {
      const { user, values } = setup(
        [
          {
            name: 'msg',
            type: 'text',
            label: 'Message',
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables })],
        { msg: 'Hi !' }
      );
      await settle();
      const input = screen.getByLabelText('Message') as HTMLInputElement;
      input.setSelectionRange(3, 3);

      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(values().msg).toBe('Hi $vars.orderId!');
    });

    it('formats the reference it writes at the caret, and not the one a flip writes', async () => {
      const formatReference = vi.fn((reference: string, { mode }: { mode: string }) =>
        mode === 'literal' ? `{{ ${reference} }}` : reference
      );
      const { user, values } = setup(
        [
          { name: 'msg', type: 'text', label: 'Message', headerActions: ['insert-variable'] },
          {
            name: 'n',
            type: 'number',
            label: 'N',
            valueModes: MODES,
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables, formatReference })],
        { msg: 'Hi ', n: 1 }
      );
      await settle();
      const [forMsg, forN] = screen.getAllByRole('button', { name: 'Insert variable' });

      await user.click(forMsg);
      await user.click(await screen.findByText('Order id'));
      expect(values().msg).toBe('Hi {{ $vars.orderId }}');
      await user.click(forN);
      await user.click(await screen.findByText('Order id'));
      expect(values().n).toEqual({ $mode: 'expression', value: '$vars.orderId' });
      expect(formatReference).toHaveBeenCalledTimes(1);
    });

    it('flips a number field to an expression holding the reference, without asking', async () => {
      const { user, values } = setup(
        [
          {
            name: 'n',
            type: 'number',
            label: 'N',
            valueModes: MODES,
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables })],
        { n: 3 }
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(values().n).toEqual({
        $mode: 'expression',
        value: '$vars.orderId',
      });
    });

    it('flips a select that offers only variable mode to a variable', async () => {
      const { user, values } = setup(
        [
          {
            name: 's',
            type: 'select',
            label: 'S',
            options: [{ label: 'One', value: '1' }],
            valueModes: { modes: ['literal', 'variable'] },
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables })]
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(values().s).toEqual({ $mode: 'variable', value: '$vars.orderId' });
    });

    it('is disabled on a field that can take the reference nowhere', async () => {
      setup(
        [
          {
            name: 's',
            type: 'select',
            label: 'S',
            options: [{ label: 'One', value: '1' }],
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables })]
      );
      await settle();
      expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
    });

    it('asks a variables function only when the picker opens', async () => {
      const source = vi.fn(() => variables);
      const { user } = setup(
        [
          {
            name: 'msg',
            type: 'text',
            label: 'Message',
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables: source })]
      );
      await settle();
      expect(source).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      expect(source).toHaveBeenCalledWith({
        field: expect.objectContaining({ name: 'msg' }),
      });
    });

    it('inserts at the caret of a registered control that attached no handle', async () => {
      function Code({ id, value, onChange, controlProps }: ValueModeControlProps) {
        return (
          <textarea
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            {...controlProps}
          />
        );
      }
      const { user, values } = setup(
        [
          {
            name: 'a',
            type: 'text',
            label: 'A',
            valueModes: MODES,
            headerActions: ['insert-variable'],
          },
        ],
        [
          insertPlugin({ variables }),
          {
            name: 'code',
            valueModes: {
              definitions: { expression: { control: { component: Code, insertable: true } } },
            },
          },
        ],
        { a: { $mode: 'expression', value: 'x + ' } }
      );
      await settle();
      (screen.getByLabelText('A') as HTMLTextAreaElement).setSelectionRange(4, 4);
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(values().a).toStrictEqual({ $mode: 'expression', value: 'x + $vars.orderId' });
    });

    it("inserts through a custom component's own handle", async () => {
      const insertText = vi.fn();
      function Editor({ controlRef }: CustomFieldComponentProps) {
        useImperativeHandle(controlRef, () => ({ focus: () => {}, insertText }), []);
        return <div data-testid="editor" />;
      }
      const { user } = setup(
        [
          {
            name: 'a',
            type: 'custom',
            component: 'editor',
            label: 'A',
            valueModes: MODES,
            headerActions: ['insert-variable'],
          } as FieldMetadata,
        ],
        [
          insertPlugin({ variables }),
          { name: 'editor', components: { editor: { component: Editor, insertable: true } } },
        ],
        { a: 'abc' }
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(insertText).toHaveBeenCalledWith('$vars.orderId');
    });

    it('appends, with a warning, for an insertable control with no handle and no text input', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      function Editor() {
        return <div data-testid="editor" />;
      }
      const { user, values } = setup(
        [
          {
            name: 'a',
            type: 'custom',
            component: 'editor',
            label: 'A',
            valueModes: MODES,
            headerActions: ['insert-variable'],
          } as FieldMetadata,
        ],
        [
          insertPlugin({ variables }),
          { name: 'editor', components: { editor: { component: Editor, insertable: true } } },
        ],
        { a: 'abc' }
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      expect(values().a).toStrictEqual({ $mode: 'literal', value: 'abc$vars.orderId' });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no controlRef handle'));
    });

    it('asks before replacing a chosen option with the reference', async () => {
      const { user, values } = setup(
        [
          {
            name: 's',
            type: 'select',
            label: 'S',
            options: [{ label: 'One', value: '1' }],
            valueModes: MODES,
            headerActions: ['insert-variable'],
          },
        ],
        [insertPlugin({ variables })],
        { s: { $mode: 'literal', value: '1' } }
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(await screen.findByText('Order id'));
      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Replace the value?')).toBeInTheDocument();
      expect(values().s).toStrictEqual({ $mode: 'literal', value: '1' });
      await user.click(within(dialog).getByRole('button', { name: 'Replace' }));
      expect(values().s).toStrictEqual({ $mode: 'expression', value: '$vars.orderId' });
    });
  });

  describe('AI assist', () => {
    const aiField: FieldMetadata = {
      name: 'a',
      type: 'text',
      label: 'A',
      valueModes: MODES,
      headerActions: ['ai-assist'],
    };

    it('renders nothing, and warns once, until a host registers it', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setup([{ ...aiField, name: 'unregistered' }]);
      await settle();
      expect(screen.queryByRole('button', { name: 'AI assist' })).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"ai-assist"'));
    });

    it('writes a result in the mode the field is in when it resolves', async () => {
      let resolve!: (value: { value: unknown }) => void;
      const generate = vi.fn(
        () =>
          new Promise<{ value: unknown }>((r) => {
            resolve = r;
          })
      );
      const { user, values } = setup([aiField], [aiPlugin(generate)]);
      await settle();

      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.type(screen.getByLabelText('Describe what you want'), 'the id');
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      expect(generate).toHaveBeenCalledWith({ prompt: 'the id' }, expect.anything());
      expect(screen.getByRole('button', { name: 'Generating' })).toBeDisabled();

      // The field changes mode while the request is out.
      await pickMode(user, 'Fixed value', 'Expression');
      await act(async () => resolve({ value: 'order.id' }));
      expect(values().a).toEqual({ $mode: 'expression', value: 'order.id' });
      await waitFor(() => expect(screen.queryByLabelText('Describe what you want')).toBeNull());
    });

    it('cannot generate on a disabled form', async () => {
      const generate = vi.fn(async () => ({ value: 'gen' }));
      render(
        <MetadataForm
          disabled
          schema={{
            id: 'f',
            title: 'F',
            sections: [{ id: 's', fields: [aiField] }],
          }}
          plugins={[aiPlugin(generate)]}
        />
      );
      await settle();
      expect(screen.getByRole('button', { name: 'AI assist' })).toBeDisabled();
    });

    it('takes a placeholder per field', async () => {
      const { user } = setup(
        [aiField],
        [
          {
            name: 'host',
            fieldActions: {
              header: {
                'ai-assist': createAiAssistAction({
                  generate: async () => undefined,
                  placeholder: ({ field }) => `Describe ${field.label}`,
                }),
              },
            },
          },
        ]
      );
      await settle();
      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      expect(screen.getByPlaceholderText(`Describe ${aiField.label}`)).toBeInTheDocument();
    });

    it('closes without writing when the generator resolves with nothing', async () => {
      const generate = vi.fn(async () => undefined);
      const { user, values } = setup([aiField], [aiPlugin(generate)], {
        a: 'kept',
      });
      await settle();
      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await waitFor(() => expect(screen.queryByLabelText('Describe what you want')).toBeNull());
      expect(values().a).toBe('kept');
    });

    it('stays open when the generator rejects', async () => {
      const generate = vi.fn(async () => {
        throw new Error('offline');
      });
      const { user, values } = setup([aiField], [aiPlugin(generate)], {
        a: 'kept',
      });
      await settle();
      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await settle();
      expect(screen.getByLabelText('Describe what you want')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
      expect(values().a).toBe('kept');
    });
  });
});

describe('strings', () => {
  it('reaches every built-in', async () => {
    const { user } = setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          valueModes: MODES,
          headerActions: ['insert-variable', 'ai-assist'],
          menuActions: ['clear'],
        },
      ],
      [
        {
          name: 'fr',
          strings: {
            valueModes: {
              literalTitle: 'Valeur fixe',
              expressionTitle: 'Expression JS',
              expressionIndicator: 'Expression JavaScript',
              lossyTitle: 'Changer de mode ?',
              confirm: 'Changer',
            },
            insertVariable: { ariaLabel: 'Insérer une variable' },
            aiAssist: { trigger: 'Assistant IA' },
            clear: { label: 'Effacer' },
          },
          fieldActions: {
            header: {
              'insert-variable': createInsertVariableAction({
                variables: [{ id: 'x', label: 'X', value: 'x' }],
              }),
              'ai-assist': createAiAssistAction({ generate: async () => undefined }),
            },
          },
        },
      ],
      { a: 'bonjour' }
    );
    await settle();

    expect(screen.getByRole('button', { name: 'Insérer une variable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assistant IA' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Valeur fixe' }));
    expect(await screen.findByRole('menuitem', { name: /Effacer/ })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitemradio', { name: /Expression JS/ }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Changer de mode ?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Changer' }));
    await user.type(screen.getByLabelText('A'), 'x');
    expect(screen.getByRole('img', { name: 'Expression JavaScript' })).toBeInTheDocument();
  });
});

describe('codecs', () => {
  it('lets a switch from an empty value seed one, and Clear not re-seed it', async () => {
    const codec: ValueModeCodec = {
      ...envelopeCodec,
      convert: (from, to) =>
        from.empty && to === 'expression'
          ? { kind: 'ok', value: 'input.value' }
          : { kind: 'lossy', value: undefined },
    };
    const { user, values } = setup(
      [{ name: 'a', type: 'text', label: 'A', valueModes: MODES, menuActions: ['clear'] }],
      [{ name: 'host', valueModes: { codecs: { default: codec } } }]
    );
    await settle();
    await pickMode(user, 'Fixed value', 'Expression');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(values().a).toStrictEqual({ $mode: 'expression', value: 'input.value' });

    await user.click(screen.getByRole('button', { name: 'Expression' }));
    await user.click(await screen.findByRole('menuitem', { name: /Clear value/ }));
    expect(values().a).toStrictEqual({ $mode: 'expression' });
  });

  it("hands encode the stored value, so a shape can keep another mode's data", async () => {
    // Keeps the prompt's text while the value is fixed, as a multi-slot shape does.
    const slots: ValueModeCodec = {
      decode: (stored) => {
        const s = (stored ?? {}) as { mode?: string; text?: string; prompt?: string };
        const mode = s.mode ?? 'literal';
        return { mode, value: mode === 'prompt' ? s.prompt : s.text };
      },
      encode: (mode, inner, _ctx, previous) => ({
        ...(previous as object),
        mode,
        [mode === 'prompt' ? 'prompt' : 'text']: inner,
      }),
    };
    const { user, values } = setup(
      [{ name: 'a', type: 'text', label: 'A', valueModes: { modes: ['literal', 'prompt'] } }],
      [{ name: 'host', valueModes: { codecs: { default: slots } } }],
      { a: { mode: 'literal', text: '', prompt: 'the order id' } }
    );
    await settle();
    await user.type(screen.getByLabelText('A'), 'x');
    expect(values().a).toStrictEqual({ mode: 'literal', text: 'x', prompt: 'the order id' });
  });
});

describe('control resolution', () => {
  it('names the step that picked the control', async () => {
    const Code = (props: ValueModeControlProps) => <textarea id={props.id} />;
    setup(
      [
        { name: 'a', type: 'text', label: 'A', valueModes: MODES },
        { name: 'b', type: 'text', label: 'B', valueModes: MODES },
      ],
      [
        {
          name: 'host',
          valueModes: { definitions: { expression: { control: { component: Code } } } },
        },
      ],
      { b: { $mode: 'expression', value: 'x' } }
    );
    await settle();
    const group = (label: string) =>
      screen.getByLabelText(label).closest('[data-slot="input-group"]');
    expect(group('A')).toHaveAttribute('data-value-mode-control', 'field-type');
    expect(group('B')).toHaveAttribute('data-value-mode-control', 'definition');
  });

  it('lets a registration name itself through the label id', async () => {
    const Radios = ({ labelId }: ValueModeControlProps) => (
      <div role="radiogroup" aria-labelledby={labelId} />
    );
    setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'Pick',
          valueModes: { ...MODES, controls: { literal: 'radios' } },
        },
      ],
      [
        {
          name: 'host',
          valueModes: {
            controlRegistry: { radios: { component: Radios, labelTarget: 'labelledby' } },
          },
        },
      ]
    );
    await settle();
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getByText('Pick').closest('label')).not.toHaveAttribute('for');
  });

  it("describes the fixed value by the field's expected type", async () => {
    const { user } = setup([
      {
        name: 'a',
        type: 'text',
        label: 'A',
        valueModes: { ...MODES, expectedType: 'number' },
      },
    ]);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Fixed value' }));
    expect(await screen.findByText('Enter a numeric value')).toBeInTheDocument();
  });
});

describe('menu actions and badges', () => {
  it('disables Clear while there is nothing to clear', async () => {
    const { user } = setup([
      { name: 'a', type: 'text', label: 'A', valueModes: MODES, menuActions: ['clear'] },
    ]);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Fixed value' }));
    expect(await screen.findByRole('menuitem', { name: /Clear value/ })).toHaveAttribute(
      'data-disabled'
    );
  });

  it('shows a badge on a field with nothing else of the anatomy', async () => {
    setup([{ name: 'a', type: 'text', label: 'A', badge: 'string' }]);
    await settle();
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByLabelText('A')).toBeInTheDocument();
  });
});

describe('form strings', () => {
  it('translates the boolean radios of a field without value modes', async () => {
    setup(
      [{ name: 'flag', type: 'boolean', label: 'Flag' }],
      [{ name: 'fr', strings: { boolean: { trueLabel: 'Vrai', falseLabel: 'Faux' } } }]
    );
    await settle();
    expect(screen.getByRole('radio', { name: 'Vrai' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Faux' })).toBeInTheDocument();
  });

  it("lets a factory's own strings win over the form's", async () => {
    setup(
      [{ name: 'a', type: 'text', label: 'A', headerActions: ['insert-variable'] }],
      [
        { name: 'fr', strings: { insertVariable: { ariaLabel: 'Insérer une variable' } } },
        insertPlugin({ variables: [], strings: { ariaLabel: 'Variable' } }),
      ]
    );
    await settle();
    expect(screen.getByRole('button', { name: 'Variable' })).toBeInTheDocument();
  });

  it('translates the required message of a field without value modes too', async () => {
    setup(
      [
        { name: 'a', type: 'text', label: 'A', validation: { required: true } },
        {
          name: 'b',
          type: 'text',
          label: 'B',
          validation: { required: true, messages: { required: 'B manque' } },
        },
      ],
      [{ name: 'fr', strings: { validation: { required: 'Obligatoire' } } }],
      { a: '', b: '' }
    );
    await settle();
    await submit();
    expect(screen.getByText('Obligatoire')).toBeInTheDocument();
    expect(screen.getByText('B manque')).toBeInTheDocument();
  });

  it('translates the required message', async () => {
    setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          valueModes: MODES,
          validation: { required: true },
        },
      ],
      [{ name: 'fr', strings: { validation: { required: 'Obligatoire' } } }]
    );
    await settle();
    await submit();
    expect(screen.getByText('Obligatoire')).toBeInTheDocument();
  });
});

describe('server rendering', () => {
  it('renders a field with value modes to a string', () => {
    const html = renderToString(
      <MetadataForm
        schema={{
          id: 'f',
          title: 'F',
          initialData: { a: { $mode: 'expression', value: 'x + 1' } },
          sections: [
            { id: 's', fields: [{ name: 'a', type: 'text', label: 'A', valueModes: MODES }] },
          ],
        }}
      />
    );
    expect(html).toContain('x + 1');
  });
});

describe('edge cases', () => {
  const variables = [{ id: 'order', label: 'Order id', value: '$vars.orderId' }];

  it('appends to an email field, which has no caret to restore', async () => {
    const { user, values } = setup(
      [{ name: 'to', type: 'email', label: 'To', headerActions: ['insert-variable'] }],
      [insertPlugin({ variables })],
      { to: 'ops@' }
    );
    await settle();
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.click(await screen.findByText('Order id'));
    await settle();
    expect(values().to).toBe('ops@$vars.orderId');
  });

  it('writes nothing on confirm once the field has been disabled', async () => {
    let form: UseFormReturn<FieldValues> | undefined;
    const plugins: FormPlugin[] = [
      {
        name: 'probe',
        onFormInit: (ctx) => {
          form = ctx.form;
        },
      },
    ];
    const schema: FormSchema = {
      id: 'f',
      title: 'F',
      initialData: { a: { $mode: 'literal', value: 'Hello' } },
      sections: [{ id: 's', fields: [{ name: 'a', type: 'text', label: 'A', valueModes: MODES }] }],
    };
    const user = userEvent.setup();
    const { rerender } = render(<MetadataForm schema={schema} plugins={plugins} />);
    await settle();
    await pickMode(user, 'Fixed value', 'Expression');
    const dialog = await screen.findByRole('alertdialog');
    rerender(<MetadataForm schema={schema} plugins={plugins} disabled />);
    await user.click(within(dialog).getByRole('button', { name: 'Switch' }));
    expect(form?.getValues().a).toStrictEqual({ $mode: 'literal', value: 'Hello' });
  });

  it('inserts nothing once the field has been disabled with the picker open', async () => {
    let form: UseFormReturn<FieldValues> | undefined;
    const plugins: FormPlugin[] = [
      insertPlugin({ variables }),
      {
        name: 'probe',
        onFormInit: (ctx) => {
          form = ctx.form;
        },
      },
    ];
    const schema: FormSchema = {
      id: 'f',
      title: 'F',
      initialData: { a: 'Hi ' },
      sections: [
        {
          id: 's',
          fields: [{ name: 'a', type: 'text', label: 'A', headerActions: ['insert-variable'] }],
        },
      ],
    };
    const user = userEvent.setup();
    const { rerender } = render(<MetadataForm schema={schema} plugins={plugins} />);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    const row = await screen.findByText('Order id');
    rerender(<MetadataForm schema={schema} plugins={plugins} disabled />);
    await user.click(row);
    expect(form?.getValues().a).toBe('Hi ');
  });

  it("bounds a slider by a field's fixed value when that field has value modes", async () => {
    setup(
      [
        { name: 'capacity', type: 'number', label: 'Capacity', valueModes: MODES },
        {
          name: 'share',
          type: 'slider',
          label: 'Share',
          maxRef: { fromField: 'capacity', fallback: 10 },
        } as FieldMetadata,
      ],
      [],
      { capacity: { $mode: 'literal', value: 50 }, share: 30 }
    );
    await settle();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '50');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '30');
  });

  it('keeps the mode Clear empties, for a codec that stores an empty value as null', async () => {
    const bare: ValueModeCodec = {
      decode: (stored) =>
        typeof stored === 'string' && stored.startsWith('=')
          ? { mode: 'expression', value: stored.slice(1) }
          : { mode: 'literal', value: stored },
      encode: (mode, inner) =>
        inner == null || inner === '' ? null : mode === 'literal' ? inner : `=${inner}`,
    };
    const { user, values } = setup(
      [{ name: 'a', type: 'text', label: 'A', valueModes: MODES, menuActions: ['clear'] }],
      [{ name: 'host', valueModes: { codecs: { default: bare } } }],
      { a: '=x + 1' }
    );
    await settle();
    await user.click(screen.getByRole('button', { name: 'Expression' }));
    await user.click(await screen.findByRole('menuitem', { name: /Clear value/ }));
    expect(values().a).toBeNull();
    expect(screen.getByRole('button', { name: 'Expression' })).toBeInTheDocument();
  });
});

describe('built-in variable and prompt controls', () => {
  const variables = [{ id: 'order', label: 'Order id', value: '$vars.orderId' }];
  const formVariables = (source: FormPlugin['variables']): FormPlugin => ({
    name: 'variables',
    variables: source,
  });

  it("binds a variable picked from the form's variables", async () => {
    const source = vi.fn(() => variables);
    const { user, values } = setup(
      [{ name: 'a', type: 'text', label: 'A', valueModes: { modes: ['literal', 'variable'] } }],
      [formVariables(source)],
      { a: { $mode: 'variable' } }
    );
    await settle();
    const trigger = screen.getByRole('button', { name: 'A' });
    expect(trigger).toHaveTextContent('Select a variable');
    expect(trigger.closest('[data-slot="input-group"]')).toHaveAttribute(
      'data-value-mode-control',
      'built-in'
    );
    expect(source).not.toHaveBeenCalled();

    await user.click(trigger);
    expect(source).toHaveBeenCalledWith({ field: expect.objectContaining({ name: 'a' }) });
    await user.click(await screen.findByText('Order id'));
    expect(values().a).toStrictEqual({ $mode: 'variable', value: '$vars.orderId' });
    expect(screen.getByRole('button', { name: 'A' })).toHaveTextContent('$vars.orderId');
  });

  it('hides Insert variable while the field is bound to a variable', async () => {
    const { user } = setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          valueModes: { modes: ['literal', 'variable'] },
          headerActions: ['insert-variable'],
        },
      ],
      [formVariables(variables), insertPlugin({})],
      { a: { $mode: 'variable', value: '$vars.orderId' } }
    );
    await settle();
    expect(screen.queryByRole('button', { name: 'Insert variable' })).toBeNull();
    await pickMode(user, 'Variable', 'Fixed value');
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Switch' })
    );
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
  });

  it('edits a prompt in a tinted box that grows', async () => {
    const { user, values } = setup(
      [{ name: 'a', type: 'text', label: 'A', valueModes: { modes: ['literal', 'prompt'] } }],
      [],
      { a: { $mode: 'prompt', value: 'The order id' } }
    );
    await settle();
    const textarea = screen.getByRole('textbox', { name: 'A' });
    expect(textarea.tagName).toBe('TEXTAREA');
    const group = textarea.closest('[data-slot="input-group"]');
    expect(group).toHaveAttribute('data-layout', 'grow');
    expect(group?.className).toContain('from-gradient-agent-start/25');
    await user.type(textarea, ' from the email');
    expect(values().a).toStrictEqual({ $mode: 'prompt', value: 'The order id from the email' });
  });

  it('inserts a variable at the caret of a prompt', async () => {
    const { user, values } = setup(
      [
        {
          name: 'a',
          type: 'text',
          label: 'A',
          valueModes: { modes: ['literal', 'prompt'] },
          headerActions: ['insert-variable'],
        },
      ],
      [formVariables(variables), insertPlugin({})],
      { a: { $mode: 'prompt', value: 'Summarize  now' } }
    );
    await settle();
    (screen.getByRole('textbox', { name: 'A' }) as HTMLTextAreaElement).setSelectionRange(10, 10);
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.click(await screen.findByText('Order id'));
    expect(values().a).toStrictEqual({ $mode: 'prompt', value: 'Summarize $vars.orderId now' });
  });

  it('focuses an invalid variable on submit', async () => {
    setup(
      [
        {
          name: 'v',
          type: 'text',
          label: 'V',
          valueModes: { modes: ['literal', 'variable'] },
          validation: { required: true },
        },
        {
          name: 'p',
          type: 'text',
          label: 'P',
          valueModes: { modes: ['literal', 'prompt'] },
          validation: { required: true },
        },
      ],
      [formVariables(variables)],
      { v: { $mode: 'variable' }, p: { $mode: 'prompt', value: 'x' } }
    );
    await settle();
    await submit();
    expect(screen.getByRole('button', { name: 'V' })).toHaveFocus();
  });

  it('focuses an invalid prompt on submit', async () => {
    setup(
      [
        {
          name: 'p',
          type: 'text',
          label: 'P',
          valueModes: { modes: ['literal', 'prompt'] },
          validation: { required: true },
        },
      ],
      [],
      { p: { $mode: 'prompt' } }
    );
    await settle();
    await submit();
    expect(screen.getByRole('textbox', { name: 'P' })).toHaveFocus();
  });

  it("lets Insert variable fall back to the form's variables, and its own win", async () => {
    const { user } = setup(
      [
        { name: 'a', type: 'text', label: 'A', headerActions: ['insert-variable'] },
        { name: 'b', type: 'text', label: 'B', headerActions: ['own'] },
      ],
      [
        formVariables(variables),
        insertPlugin({}),
        {
          name: 'own',
          fieldActions: {
            header: {
              own: createInsertVariableAction({
                id: 'own',
                variables: [{ id: 'mine', label: 'Mine', value: '$vars.mine' }],
              }),
            },
          },
        },
      ]
    );
    await settle();
    const [forA, forB] = screen.getAllByRole('button', { name: 'Insert variable' });
    await user.click(forA);
    expect(await screen.findByText('Order id')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(forB);
    expect(await screen.findByText('Mine')).toBeInTheDocument();
    expect(screen.queryByText('Order id')).toBeNull();
  });
});
