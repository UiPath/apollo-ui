import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { FieldMetadata, FormSchema } from './form-schema';
import { serializeSchema } from './schema-serializer';
import { modeAwareSchema, validationConfigToZod } from './validation-converter';
import {
  codecContext,
  convertValue,
  envelopeCodec,
  isEmptyModeValue,
  isValueModeEnvelope,
  literalValues,
  VALUE_MODE_OPAQUE,
  type ValueModeCodec,
} from './value-modes';

const numberField: FieldMetadata = {
  name: 'count',
  type: 'number',
  label: 'Count',
  valueModes: { modes: ['literal', 'expression'] },
};
const ctx = codecContext(numberField, numberField.valueModes!);

describe('envelopeCodec', () => {
  it("wraps a literal value too, and decodes it in its field type's shape", () => {
    const stored = envelopeCodec.encode('literal', 42, ctx);
    expect(stored).toStrictEqual({ $mode: 'literal', value: 42 });
    expect(envelopeCodec.decode(stored, ctx)).toEqual({ mode: 'literal', value: 42 });
  });

  it('reads a raw value, such as data from before the field had modes, as literal', () => {
    expect(envelopeCodec.decode(42, ctx)).toEqual({ mode: 'literal', value: 42 });
    expect(envelopeCodec.decode(undefined, ctx)).toEqual({ mode: 'literal', value: undefined });
  });

  it('keeps the envelope of a cleared value and drops its `value`', () => {
    for (const cleared of [undefined, null, '', Number.NaN, []]) {
      expect(envelopeCodec.encode('expression', cleared, ctx)).toStrictEqual({
        $mode: 'expression',
      });
    }
    expect(envelopeCodec.encode('literal', ' ', ctx)).toStrictEqual({
      $mode: 'literal',
      value: ' ',
    });
  });

  it('round-trips any other mode through an envelope', () => {
    const stored = envelopeCodec.encode('expression', 'a + 1', ctx);
    expect(stored).toEqual({ $mode: 'expression', value: 'a + 1' });
    expect(envelopeCodec.decode(stored, ctx)).toEqual({
      mode: 'expression',
      value: 'a + 1',
    });
  });

  it('does not read an object value with a `mode` of its own as an envelope', () => {
    const value = { mode: 'fast', retries: 3 };
    expect(isValueModeEnvelope(value)).toBe(false);
    expect(envelopeCodec.decode(value, ctx)).toEqual({
      mode: 'literal',
      value,
    });
  });
});

describe('convertValue', () => {
  it('switches an empty value to nothing without asking', () => {
    const from = envelopeCodec.decode(undefined, ctx);
    expect(convertValue(envelopeCodec, from, 'expression', ctx)).toStrictEqual({
      kind: 'ok',
      value: undefined,
    });
  });

  it('asks before clearing a value when the codec has no conversion', () => {
    const from = envelopeCodec.decode(5, ctx);
    expect(convertValue(envelopeCodec, from, 'expression', ctx)).toStrictEqual({
      kind: 'lossy',
      value: undefined,
    });
  });

  it("uses the codec's conversion, which returns the value in the new mode", () => {
    const codec: ValueModeCodec = {
      ...envelopeCodec,
      convert: (from) => ({ kind: 'ok', value: String(from.value) }),
    };
    expect(convertValue(codec, codec.decode(5, ctx), 'expression', ctx)).toStrictEqual({
      kind: 'ok',
      value: '5',
    });
  });

  it('asks the conversion about an empty value too, so it can seed one, but never asks the user', () => {
    const convert = vi.fn(() => ({ kind: 'lossy' as const, value: 'seed' }));
    const codec: ValueModeCodec = { ...envelopeCodec, convert };
    expect(convertValue(codec, codec.decode('', ctx), 'expression', ctx)).toStrictEqual({
      kind: 'ok',
      value: 'seed',
    });
    expect(convert).toHaveBeenCalledWith(
      expect.objectContaining({ empty: true }),
      'expression',
      ctx
    );
  });
});

describe('isEmptyModeValue', () => {
  it('decodes before judging', () => {
    expect(isEmptyModeValue({ $mode: 'expression', value: '' }, numberField)).toBe(true);
    expect(isEmptyModeValue({ $mode: 'expression', value: 'x' }, numberField)).toBe(false);
  });

  it('judges a field without value modes by its raw value', () => {
    const plain: FieldMetadata = { name: 'n', type: 'text', label: 'N' };
    expect(isEmptyModeValue({ $mode: 'expression', value: '' }, plain)).toBe(false);
    expect(isEmptyModeValue('  ', plain)).toBe(true);
  });
});

describe('literalValues', () => {
  const schema: FormSchema = {
    id: 'f',
    title: 'F',
    sections: [
      {
        id: 's',
        fields: [
          numberField,
          { name: 'plain', type: 'text', label: 'Plain' },
          {
            name: 'address.city',
            type: 'text',
            label: 'City',
            valueModes: { modes: ['literal', 'expression'] },
          },
        ],
      },
    ],
  };

  it('reads a field with value modes by its literal value', () => {
    const values = {
      count: { $mode: 'literal', value: 3 },
      plain: { $mode: 'literal', value: 'as stored' },
      address: { city: { $mode: 'literal', value: 'Paris' }, zip: '75001' },
    };
    expect(literalValues(values, schema)).toEqual({
      count: 3,
      plain: { $mode: 'literal', value: 'as stored' },
      address: { city: 'Paris', zip: '75001' },
    });
    // The form's own values are left as they are.
    expect(values.count).toEqual({ $mode: 'literal', value: 3 });
  });

  it('reads a value in another mode as opaque, whatever its shape, and an empty one as undefined', () => {
    const expression = { $mode: 'expression', value: 'a + 1' };
    const read = literalValues(
      { count: expression, address: { city: { $mode: 'expression' } } },
      schema
    );
    expect(read.count).toBe(VALUE_MODE_OPAQUE);
    expect(read.address).toEqual({ city: undefined });
  });

  it("keeps the arrays along a field's path as arrays", () => {
    const listSchema: FormSchema = {
      id: 'f',
      title: 'F',
      sections: [
        {
          id: 's',
          fields: [
            {
              name: 'items.0.title',
              type: 'text',
              label: 'Title',
              valueModes: { modes: ['literal', 'expression'] },
            },
          ],
        },
      ],
    };
    const values = { items: [{ title: { $mode: 'literal', value: 'a' } }, { title: 'b' }] };
    const read = literalValues(values, listSchema);
    expect(Array.isArray(read.items)).toBe(true);
    expect(read.items).toEqual([{ title: 'a' }, { title: 'b' }]);
    expect(values.items[0].title).toEqual({ $mode: 'literal', value: 'a' });
  });

  it('returns the values themselves when nothing needs decoding', () => {
    const values = { count: 3, plain: 'x' };
    expect(literalValues(values, schema)).toBe(values);
  });
});

describe('modeAwareSchema', () => {
  const schemaFor = (codec: ValueModeCodec = envelopeCodec, required = true) =>
    modeAwareSchema(validationConfigToZod({ required, min: 1 }, 'number'), {
      codec,
      context: ctx,
      required,
    });

  it("validates a literal value with its field type's schema", () => {
    expect(schemaFor().safeParse({ $mode: 'literal', value: 3 }).success).toBe(true);
    expect(schemaFor().safeParse({ $mode: 'literal', value: 0 }).success).toBe(false);
    expect(schemaFor().safeParse(3).success).toBe(true);
  });

  it('requires a non-empty value in any other mode', () => {
    const result = schemaFor().safeParse({ $mode: 'expression', value: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('This field is required');
    expect(schemaFor(envelopeCodec, false).safeParse({ $mode: 'expression' }).success).toBe(true);
  });

  it('reports an empty fixed value as required rather than as a type error', () => {
    for (const empty of [undefined, null, Number.NaN]) {
      const result = schemaFor().safeParse(empty);
      expect(result.error?.issues[0].message).toBe('This field is required');
    }
    expect(schemaFor(envelopeCodec, false).safeParse(Number.NaN).success).toBe(true);
  });

  it("runs the mode's validation on a non-literal value", () => {
    const schema = modeAwareSchema(z.any(), {
      codec: envelopeCodec,
      context: ctx,
      required: false,
      validators: { expression: (value) => (value === 'bad' ? 'Not an expression' : undefined) },
    });
    const result = schema.safeParse({ $mode: 'expression', value: 'bad' });
    expect(result.error?.issues[0].message).toBe('Not an expression');
    expect(schema.safeParse({ $mode: 'expression', value: 'ok' }).success).toBe(true);
  });

  it('is a zod schema a form can nest', () => {
    const form = z.object({ count: schemaFor() });
    expect(form.safeParse({ count: 2 }).success).toBe(true);
  });
});

describe('serializing value modes and field actions', () => {
  it('round-trips value modes, field actions and the badge', () => {
    const schema: FormSchema = {
      id: 'f',
      title: 'F',
      sections: [
        {
          id: 's',
          fields: [
            {
              name: 'a',
              type: 'text',
              label: 'A',
              valueModes: {
                modes: ['literal', 'expression'],
                defaultMode: 'expression',
                labels: { expression: { title: 'Formula' } },
              },
              headerActions: ['insert-variable'],
              menuActions: ['clear'],
              badge: 'string',
            },
          ],
        },
      ],
    };
    const field = (serializeSchema(schema).sections as Array<{ fields: object[] }>)[0].fields[0];
    expect(JSON.parse(JSON.stringify(field))).toMatchObject({
      valueModes: schema.sections[0].fields[0].valueModes,
      headerActions: ['insert-variable'],
      menuActions: ['clear'],
      badge: 'string',
    });
  });

  it('drops a `frame` a schema was never meant to carry', () => {
    const field = {
      name: 'c',
      type: 'custom',
      label: 'C',
      component: 'X',
      frame: 'row',
    };
    const schema = {
      id: 'f',
      title: 'F',
      sections: [{ id: 's', fields: [field] }],
    };
    const serialized = serializeSchema(schema as unknown as FormSchema);
    expect((serialized.sections as Array<{ fields: object[] }>)[0].fields[0]).not.toHaveProperty(
      'frame'
    );
  });
});
