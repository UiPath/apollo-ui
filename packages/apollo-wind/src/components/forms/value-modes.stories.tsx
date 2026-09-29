import type { Meta, StoryObj } from '@storybook/react-vite';
import { Regex } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormPlugin, FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';
import {
  type ConvertResult,
  envelopeCodec,
  type ValueModeCodec,
  type ValueModeControlProps,
} from './value-modes';

const meta = {
  title: 'Forms/Value modes',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A field with \`valueModes\` renders the field anatomy: a trailing menu switches the value between
modes, and the active mode's control edits it. The default codec stores every value as
\`{ $mode, value }\`, leaving out \`value\` once cleared. It reads a raw value as a fixed value, so
existing data loads, and wraps it on its first write. Rules, conditions and data sources read a
field's fixed value only. Switching a non-empty value asks first; an empty one never does, though a
codec's \`convert\` may seed it. Hosts add codecs, modes and controls through
\`FormPlugin.valueModes\` (a definition for a built-in mode changes only what it gives, such as its
control) and strings through \`FormPlugin.strings\`. The built-in Variable and Prompt modes have no
control of their own yet.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const MODES = { modes: ['literal', 'expression'] };

function Demo({ schema, plugins = [] }: { schema: FormSchema; plugins?: FormPlugin[] }) {
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

const everyFieldType: FormSchema = {
  id: 'value-modes',
  title: 'Value modes',
  // Validate as the user types; MetadataForm, like react-hook-form, defaults to on submit.
  mode: 'onChange',
  initialData: {
    subject: 'Order received',
    retries: { $mode: 'expression', value: 'config.retries + 1' },
    priority: { $mode: 'literal', value: 'high' },
  },
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'subject',
          type: 'text',
          label: 'Subject',
          description: 'Stored raw, as before it had modes; the first edit wraps it.',
          valueModes: MODES,
        },
        {
          name: 'retries',
          type: 'number',
          label: 'Retries',
          badge: 'number',
          valueModes: MODES,
          validation: { required: true, min: 0 },
        },
        {
          name: 'notify',
          type: 'boolean',
          label: 'Notify',
          description: 'True, false, or not set. Click the checked radio to clear it.',
          valueModes: MODES,
        },
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' },
          ],
          valueModes: MODES,
        },
        {
          name: 'escalation',
          type: 'text',
          label: 'Escalation contact',
          description: 'Shown while Priority is the fixed value High, never for an expression.',
          rules: [
            {
              id: 'high-priority',
              conditions: [{ when: 'priority', is: 'high' }],
              effects: { visible: true },
            },
          ],
        },
        {
          name: 'tags',
          type: 'multiselect',
          label: 'Tags',
          options: [
            { label: 'Urgent', value: 'urgent' },
            { label: 'Billing', value: 'billing' },
            { label: 'Support', value: 'support' },
          ],
          valueModes: MODES,
        },
        {
          name: 'formula',
          type: 'text',
          label: 'Formula',
          description: 'Starts in Expression mode while empty.',
          valueModes: { ...MODES, defaultMode: 'expression' },
        },
      ],
    },
  ],
};

/** Every field type in scope, each offering a fixed value and an expression. */
export const EveryFieldType: Story = {
  render: () => <Demo schema={everyFieldType} />,
};

function PatternControl({ id, value, onChange, disabled, controlProps }: ValueModeControlProps) {
  return (
    <input
      id={id}
      className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="^[A-Z]{3}-\d+$"
      {...controlProps}
    />
  );
}

const patternPlugin: FormPlugin = {
  name: 'patterns',
  valueModes: {
    definitions: {
      pattern: {
        icon: Regex,
        title: 'Pattern',
        description: 'Match with a regular expression',
        control: { component: PatternControl, insertable: false },
        indicator: <span className="px-2 font-mono text-xs text-muted-foreground">/…/</span>,
      },
    },
  },
};

const hostModeSchema: FormSchema = {
  id: 'host-mode',
  title: 'Host mode',
  initialData: { code: { $mode: 'pattern', value: '^ORD-\\d+$' } },
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Order code',
          valueModes: { modes: ['literal', 'expression', 'pattern'] },
        },
      ],
    },
  ],
};

/** A fifth mode registered by the host, with its own glyph and control. */
export const HostMode: Story = {
  render: () => <Demo schema={hostModeSchema} plugins={[patternPlugin]} />,
};

/** A fixed value written as the JavaScript literal an expression would evaluate to. */
function toExpression(value: unknown): string | undefined {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  return undefined;
}

/** The fixed value an expression holds, when it is a plain literal of the field's type. */
function toLiteral(expression: string, fieldType: string): { value: unknown } | undefined {
  const text = expression.trim();
  if (fieldType === 'number') {
    return /^-?\d+(\.\d+)?$/.test(text) ? { value: Number(text) } : undefined;
  }
  if (fieldType === 'boolean' || fieldType === 'switch' || fieldType === 'checkbox') {
    return text === 'true' || text === 'false' ? { value: text === 'true' } : undefined;
  }
  if (/^"(?:[^"\\]|\\.)*"$/.test(text)) return { value: JSON.parse(text) };
  if (/^'[^'\\]*'$/.test(text)) return { value: text.slice(1, -1) };
  return undefined;
}

/**
 * The envelope codec, with conversions that keep the value where JavaScript can: a fixed value
 * becomes its literal (`4`, `"Hi"`), and an expression that is only a literal becomes a fixed
 * value again. Anything else still asks before clearing. `convert` returns the value in the new
 * mode and the form encodes it. Canvas's own codec does the same for its ExpressionValue format.
 */
const jsLiteralCodec: ValueModeCodec = {
  ...envelopeCodec,
  convert(from, to, ctx): ConvertResult {
    if (from.mode === 'literal' && to === 'expression') {
      const expression = toExpression(from.value);
      if (expression !== undefined) return { kind: 'ok', value: expression };
    }
    if (from.mode === 'expression' && to === 'literal' && typeof from.value === 'string') {
      const literal = toLiteral(from.value, ctx.fieldType);
      if (literal) return { kind: 'ok', value: literal.value };
      return {
        kind: 'lossy',
        value: undefined,
        description: `"${from.value}" is not a plain value, so switching will clear it.`,
      };
    }
    return { kind: 'lossy', value: undefined };
  },
};

const losslessPlugin: FormPlugin = {
  name: 'js-literals',
  valueModes: { codecs: { default: jsLiteralCodec } },
};

const losslessSchema: FormSchema = {
  id: 'lossless',
  title: 'Lossless conversions',
  initialData: {
    greeting: { $mode: 'literal', value: 'Hello' },
    retries: { $mode: 'literal', value: 3 },
    enabled: { $mode: 'literal', value: true },
    total: { $mode: 'expression', value: 'order.items.length * 2' },
  },
  sections: [
    {
      id: 'main',
      fields: [
        {
          name: 'greeting',
          type: 'text',
          label: 'Greeting',
          description: 'Becomes "Hello" as an expression, and back.',
          valueModes: MODES,
        },
        { name: 'retries', type: 'number', label: 'Retries', valueModes: MODES },
        { name: 'enabled', type: 'boolean', label: 'Enabled', valueModes: MODES },
        {
          name: 'total',
          type: 'number',
          label: 'Total',
          description: 'Not a plain value, so switching to a fixed value asks first.',
          valueModes: MODES,
        },
      ],
    },
  ],
};

/** A host codec that converts without asking whenever the value survives the switch. */
export const LosslessConversions: Story = {
  render: () => <Demo schema={losslessSchema} plugins={[losslessPlugin]} />,
};
