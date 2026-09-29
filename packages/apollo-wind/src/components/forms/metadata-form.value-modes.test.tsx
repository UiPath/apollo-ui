import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataFetcher } from './data-fetcher';
import type { FormPlugin, FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';
import * as converter from './validation-converter';
import { envelopeCodec, type ValueModeControlProps } from './value-modes';

vi.mock('./validation-converter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./validation-converter')>();
  return { ...actual, modeAwareSchema: vi.fn(actual.modeAwareSchema) };
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('MetadataForm with value modes: render stability', () => {
  it('does not re-render a mode-aware field while another field is typed in', async () => {
    const renders = vi.fn();
    const Counted = (props: ValueModeControlProps) => {
      renders();
      return <input id={props.id} value={String(props.value ?? '')} readOnly />;
    };
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
              valueModes: { modes: ['literal', 'expression'] },
            },
            {
              name: 'b',
              type: 'text',
              label: 'B',
              valueModes: {
                modes: ['literal', 'expression'],
                controls: { literal: 'counted' },
              },
            },
          ],
        },
      ],
    };
    const plugins: FormPlugin[] = [
      {
        name: 'host',
        valueModes: { controlRegistry: { counted: { component: Counted } } },
      },
    ];
    render(<MetadataForm schema={schema} plugins={plugins} />);
    await settle();

    const before = renders.mock.calls.length;
    await userEvent.setup().type(screen.getByLabelText('A'), 'hello');
    expect(renders.mock.calls.length).toBe(before);
  });

  it('keeps the validation schema when a new plugin brings the same codecs', async () => {
    const codecs = { default: envelopeCodec };
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
              valueModes: { modes: ['literal', 'expression'] },
            },
          ],
        },
      ],
    };
    const built = vi.mocked(converter.modeAwareSchema);
    const { rerender } = render(
      <MetadataForm schema={schema} plugins={[{ name: 'host', valueModes: { codecs } }]} />
    );
    await settle();
    const before = built.mock.calls.length;

    rerender(
      <MetadataForm
        schema={schema}
        plugins={[{ name: 'host', valueModes: { codecs }, fieldActions: {} }]}
      />
    );
    expect(built.mock.calls.length).toBe(before);

    rerender(
      <MetadataForm
        schema={schema}
        plugins={[
          {
            name: 'host',
            valueModes: { codecs: { default: { ...envelopeCodec } } },
          },
        ]}
      />
    );
    expect(built.mock.calls.length).toBe(before + 1);
  });
});

describe('MetadataForm with value modes: rules, conditions and data sources', () => {
  const schemaWith = (priority: unknown): FormSchema => ({
    id: 'f',
    title: 'F',
    initialData: { priority },
    sections: [
      {
        id: 's',
        fields: [
          {
            name: 'priority',
            type: 'text',
            label: 'Priority',
            valueModes: { modes: ['literal', 'expression'] },
          },
          {
            name: 'escalate',
            type: 'text',
            label: 'Escalate',
            rules: [
              {
                id: 'show',
                conditions: [{ when: 'priority', is: 'high' }],
                effects: { visible: true },
              },
            ],
          },
          {
            name: 'queue',
            type: 'select',
            label: 'Queue',
            dataSource: { type: 'computed', dependency: ['priority'], compute: '[]' },
          },
        ],
      },
      {
        id: 'urgent',
        title: 'Urgent',
        conditions: [{ when: 'priority', is: 'high' }],
        fields: [{ name: 'reason', type: 'text', label: 'Reason' }],
      },
    ],
  });

  it('reads a field with value modes by its literal value', async () => {
    const fetch = vi.spyOn(DataFetcher, 'fetch');
    render(<MetadataForm schema={schemaWith({ $mode: 'literal', value: 'high' })} />);
    await settle();
    expect(screen.getByLabelText('Escalate')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ priority: 'high' })
    );
    fetch.mockRestore();
  });

  it('matches no literal while the value is in another mode', async () => {
    render(<MetadataForm schema={schemaWith({ $mode: 'expression', value: "'high'" })} />);
    await settle();
    expect(screen.queryByLabelText('Escalate')).toBeNull();
    expect(screen.queryByLabelText('Reason')).toBeNull();
  });
});
