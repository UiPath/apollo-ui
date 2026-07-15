import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '../../utils/testing';
import type { JsonSchema, JsonTreeChange, JsonValue } from '../JsonTree';
import { NodeIOView } from './NodeIOView';

const SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    responseBody: {
      type: 'object',
      properties: {
        currency: { type: 'string', enum: ['USD', 'EUR'] },
      },
    },
    cached: { type: 'boolean' },
    errorMessage: { type: ['string', 'null'] },
  },
};

const VALUE: JsonValue = {
  statusCode: 200,
  responseBody: { currency: 'USD' },
  cached: false,
  debugInfo: { attempt: 1 },
};

const UNSET_FILTERS = [
  {
    id: 'unset',
    label: 'Unset fields',
    predicate: (node: { value?: JsonValue }) => node.value === undefined,
  },
];

describe('NodeIOView', () => {
  it('renders schema-declared and value-only keys', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    expect(screen.getByText('statusCode')).toBeInTheDocument();
    expect(screen.getByText('responseBody')).toBeInTheDocument();
    expect(screen.getByText('debugInfo')).toBeInTheDocument();
  });

  it('marks keys missing from the value as unset', () => {
    // "unset" placeholders are an editing affordance, so the tree must be
    // editable to show them (read-only hides them).
    render(<NodeIOView schema={SCHEMA} value={VALUE} onValueChange={vi.fn()} />);
    // errorMessage is declared by the schema but absent from the value.
    expect(screen.getByText('errorMessage')).toBeInTheDocument();
    expect(screen.getByText('unset')).toBeInTheDocument();
  });

  it('renders a fully schema-driven tree when no value is given', () => {
    render(<NodeIOView schema={SCHEMA} onValueChange={vi.fn()} />);
    expect(screen.getByText('statusCode')).toBeInTheDocument();
    expect(screen.getAllByText('unset').length).toBeGreaterThanOrEqual(3);
  });

  it('groups the key count with the container name', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    const key = screen.getByRole('button', {
      name: 'Copy path for responseBody',
    });
    // The count is the immediate sibling of the key, not pushed to the far edge.
    expect(key.nextElementSibling?.textContent).toBe('1 key');
  });

  it('hides a container count when decoration.hideCount is set', () => {
    render(
      <NodeIOView
        value={{ big: { a: 1, b: 2, c: 3 }, small: { a: 1 } }}
        decorateNode={(node) => (node.path === 'big' ? { hideCount: true } : undefined)}
      />
    );
    // big's count is suppressed; the undecorated small container keeps its own.
    expect(screen.queryByText('3 keys')).not.toBeInTheDocument();
    expect(screen.getByText('1 key')).toBeInTheDocument();
  });

  it('renders the title bar when a title is given', () => {
    render(<NodeIOView title="HTTP Request" titleBadge="httpRequest1" value={{}} />);
    expect(screen.getByText('HTTP Request')).toBeInTheDocument();
    expect(screen.getByText('httpRequest1')).toBeInTheDocument();
  });

  it('collapses a container when a non-interactive part of its row is clicked', async () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    expect(screen.getByText('currency')).toBeInTheDocument();
    // The key count is a plain span, not a control, so a click there toggles.
    const count = screen.getByRole('button', {
      name: 'Copy path for responseBody',
    }).nextElementSibling as HTMLElement;
    await userEvent.click(count);
    expect(screen.queryByText('currency')).not.toBeInTheDocument();
  });

  it('copies the path when the field name is clicked', async () => {
    const onCopy = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={VALUE} onCopy={onCopy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy path for statusCode' }));
    expect(onCopy).toHaveBeenCalledWith({
      kind: 'path',
      path: 'statusCode',
      text: 'statusCode',
    });
  });

  it('confirms a path copy with an inline indicator', async () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy path for statusCode' }));
    // A tooltip would be dismissed by the click itself, so the confirmation
    // rides on an inline indicator next to the key instead.
    expect(await screen.findByRole('img', { name: 'Path copied' })).toBeInTheDocument();
  });

  it('copies the value from the row action', async () => {
    const onCopy = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={VALUE} onCopy={onCopy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy value of statusCode' }));
    expect(onCopy).toHaveBeenCalledWith({
      kind: 'value',
      path: 'statusCode',
      text: '200',
    });
  });

  it('offers no copy-value action on unset nodes', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    expect(
      screen.queryByRole('button', { name: 'Copy value of errorMessage' })
    ).not.toBeInTheDocument();
  });

  it('commits an enum edit and reports the full updated value', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ responseBody: { currency: 'USD' } }}
        onValueChange={onValueChange}
      />
    );
    // currency is an enum: it edits through a dropdown.
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of currency' }));
    await userEvent.click(screen.getByRole('menuitem', { name: '"EUR"' }));
    const [next, change] = onValueChange.mock.calls[0] as [JsonValue, JsonTreeChange];
    expect(next).toEqual({ responseBody: { currency: 'EUR' } });
    expect(change.path).toBe('responseBody.currency');
  });

  it('edits numbers through the inline editor', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView schema={SCHEMA} value={{ statusCode: 200 }} onValueChange={onValueChange} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of statusCode' }));
    const input = screen.getByRole('textbox', {
      name: 'Edit value of statusCode',
    });
    fireEvent.change(input, { target: { value: '404' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ statusCode: 404 });
  });

  it('rejects a fractional value for an integer field', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView schema={SCHEMA} value={{ statusCode: 200 }} onValueChange={onValueChange} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of statusCode' }));
    const input = screen.getByRole('textbox', { name: 'Edit value of statusCode' });
    fireEvent.change(input, { target: { value: '4.5' } });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('rejects a non-finite number (would serialize as null)', async () => {
    const onValueChange = vi.fn();
    const schema: JsonSchema = { type: 'object', properties: { amount: { type: 'number' } } };
    render(<NodeIOView schema={schema} value={{ amount: 10 }} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of amount' }));
    const input = screen.getByRole('textbox', { name: 'Edit value of amount' });
    fireEvent.change(input, { target: { value: 'Infinity' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('toggles booleans on a single click', async () => {
    const onValueChange = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={{ cached: false }} onValueChange={onValueChange} />);
    // No dropdown: clicking the value commits the opposite boolean directly.
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of cached' }));
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ cached: true });
  });

  it('toggles an unset boolean to true on first click', async () => {
    const onValueChange = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={{}} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of cached' }));
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ cached: true });
  });

  it('sets a value on a schema-declared key that is absent from the value', async () => {
    const onValueChange = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={{}} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of errorMessage' }));
    const input = screen.getByRole('textbox', {
      name: 'Edit value of errorMessage',
    });
    fireEvent.change(input, { target: { value: 'timeout' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ errorMessage: 'timeout' });
  });

  it('wraps a scalar row and edits it with the multiline editor', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ errorMessage: 'a very long message' }}
        onValueChange={onValueChange}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Wrap value of errorMessage' }));
    // Wrapped view: click the value block, then the multiline editor appears.
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of errorMessage' }));
    const textarea = screen.getByRole('textbox', {
      name: 'Edit value of errorMessage',
    });
    expect(textarea.tagName).toBe('TEXTAREA');
    fireEvent.change(textarea, { target: { value: 'line one\nline two' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ errorMessage: 'line one\nline two' });
    expect(
      screen.getByRole('button', { name: 'Unwrap value of errorMessage' })
    ).toBeInTheDocument();
  });

  it('renders wrapped multiline strings raw, with real line breaks', async () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ errorMessage: 'line one\nline two' }}
        onValueChange={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Wrap value of errorMessage' }));
    const display = screen.getByRole('button', {
      name: 'Edit value of errorMessage',
    });
    // Raw string, matching the multiline editor: no quotes, no \n escapes.
    expect(display.textContent).toBe('line one\nline two');
  });

  it('offers no wrap action for booleans and enums', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} onValueChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Wrap value of cached' })).not.toBeInTheDocument();
  });

  it('derives custom type-badge icons per node', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: {
            doc: { type: 'object', format: 'file', properties: {} },
          },
        }}
        value={{ doc: {} }}
        deriveTypeIcon={(node) =>
          node.schema?.format === 'file' ? <span data-testid="file-badge-icon" /> : undefined
        }
      />
    );
    expect(screen.getByTestId('file-badge-icon')).toBeInTheDocument();
  });

  it('edits containers as JSON', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ responseBody: { currency: 'USD' } }}
        onValueChange={onValueChange}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit responseBody as JSON' }));
    const textarea = screen.getByRole('textbox', {
      name: 'Edit JSON of responseBody',
    });
    fireEvent.change(textarea, {
      target: { value: '{"currency": "EUR", "total": 10}' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ responseBody: { currency: 'EUR', total: 10 } });
  });

  it('rejects invalid JSON in the container editor', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView schema={SCHEMA} value={{ responseBody: {} }} onValueChange={onValueChange} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit responseBody as JSON' }));
    const textarea = screen.getByRole('textbox', {
      name: 'Edit JSON of responseBody',
    });
    fireEvent.change(textarea, { target: { value: '{not json' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders a custom value cell through renderValue', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: {
            doc: { type: 'object', format: 'file', properties: {} },
          },
        }}
        value={{ doc: { FullName: 'a.pdf' } }}
        onValueChange={onValueChange}
        renderValue={(node, ctx) =>
          node.schema?.format === 'file' ? (
            <button type="button" onClick={() => ctx.commit({ FullName: 'b.pdf' })}>
              pick file
            </button>
          ) : undefined
        }
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'pick file' }));
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ doc: { FullName: 'b.pdf' } });
  });

  it('shows no editing affordances when readOnly', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} readOnly onValueChange={vi.fn()} />);
    expect(
      screen.queryByRole('button', { name: 'Edit value of statusCode' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit value of cached' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit responseBody as JSON' })
    ).not.toBeInTheDocument();
  });

  it('renders a serialized JSON fallback in the JSON tab', async () => {
    render(<NodeIOView schema={SCHEMA} value={{ statusCode: 200 }} />);
    await userEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    expect(screen.getByText(/"statusCode": 200/)).toBeInTheDocument();
  });

  it('hides the filter control unless filters are provided', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
  });

  it('applies a consumer-provided filter', async () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} filters={UNSET_FILTERS} />);
    await userEvent.click(screen.getByRole('button', { name: /Filter/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Unset fields/ }));
    expect(screen.queryByText('statusCode')).not.toBeInTheDocument();
    // errorMessage is declared by the schema but absent from the value.
    expect(screen.getByText('errorMessage')).toBeInTheDocument();
  });

  it('searches keys and values', async () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search fields and values' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search fields and values...' }),
      'currency'
    );
    expect(screen.getByText('currency')).toBeInTheDocument();
    expect(screen.queryByText('statusCode')).not.toBeInTheDocument();
  });

  it('renders decoration label and sublabel while keeping the raw key for paths', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        decorateNode={(node) =>
          node.path === 'responseBody'
            ? {
                label: 'Response Body',
                sublabel: 'responseBody',
              }
            : undefined
        }
      />
    );
    const keyButton = screen.getByRole('button', {
      name: 'Copy path for responseBody',
    });
    expect(keyButton).toHaveTextContent('Response Body');
    expect(screen.getByText('responseBody')).toBeInTheDocument();
  });

  it('matches decoration labels and sublabels in search', async () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        decorateNode={(node) =>
          node.path === 'responseBody' ? { label: 'Http Response' } : undefined
        }
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Search fields and values' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search fields and values...' }),
      'Http Resp'
    );
    expect(screen.getByText('Http Response')).toBeInTheDocument();
    expect(screen.queryByText('statusCode')).not.toBeInTheDocument();
  });

  it('overrides the type badge icon and color through decoration.badge', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        deriveTypeIcon={() => <svg data-testid="derived-icon" />}
        decorateNode={(node) =>
          node.path === 'responseBody'
            ? {
                badge: {
                  icon: <svg data-testid="badge-icon" />,
                  className: 'text-info',
                },
              }
            : undefined
        }
      />
    );
    // decoration.badge.icon wins over deriveTypeIcon for the decorated row only.
    const badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon.parentElement).toHaveClass('text-info');
    expect(screen.getAllByTestId('derived-icon').length).toBeGreaterThan(0);
  });

  it('renders icon-only decoration chips with an accessible tooltip', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        decorateNode={(node) =>
          node.path === 'statusCode'
            ? {
                chip: {
                  icon: <svg data-testid="chip-icon" />,
                  tooltip: 'Node output is mocked',
                },
              }
            : undefined
        }
      />
    );
    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Node output is mocked' })).toBeInTheDocument();
  });

  it('works without a schema: value-driven tree', () => {
    render(<NodeIOView value={{ anything: 1 }} />);
    expect(screen.getByText('anything')).toBeInTheDocument();
  });

  it('marks schema-required keys with a required indicator', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          required: ['statusCode'],
          properties: {
            statusCode: { type: 'integer' },
            cached: { type: 'boolean' },
          },
        }}
        value={{ statusCode: 200, cached: false }}
      />
    );
    expect(screen.getByText('required')).toBeInTheDocument();
  });

  it('prefixes paths with basePath in copied paths', async () => {
    const onCopy = vi.fn();
    render(<NodeIOView schema={SCHEMA} value={VALUE} basePath="httpRequest1" onCopy={onCopy} />);
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Copy path for httpRequest1.statusCode',
      })
    );
    expect(onCopy).toHaveBeenCalledWith({
      kind: 'path',
      path: 'httpRequest1.statusCode',
      text: 'httpRequest1.statusCode',
    });
  });

  it('edits values at their real position regardless of basePath', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ statusCode: 200 }}
        basePath="httpRequest1"
        onValueChange={onValueChange}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit value of statusCode' }));
    const input = screen.getByRole('textbox', {
      name: 'Edit value of statusCode',
    });
    fireEvent.change(input, { target: { value: '500' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const [next, change] = onValueChange.mock.calls[0] as [JsonValue, JsonTreeChange];
    expect(next).toEqual({ statusCode: 500 });
    expect(change.path).toBe('httpRequest1.statusCode');
    expect(change.segments).toEqual(['statusCode']);
  });

  it('removes a value through the renderValue clear context', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: {
            doc: { type: 'object', format: 'file', properties: {} },
          },
        }}
        value={{ doc: { FullName: 'a.pdf' }, other: 1 }}
        onValueChange={onValueChange}
        renderValue={(node, ctx) =>
          node.schema?.format === 'file' ? (
            <button type="button" onClick={() => ctx.clear()}>
              remove file
            </button>
          ) : undefined
        }
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'remove file' }));
    const [next, change] = onValueChange.mock.calls[0] as [JsonValue, JsonTreeChange];
    expect(next).toEqual({ other: 1 });
    expect(change.value).toBeUndefined();
    expect(change.previous).toEqual({ FullName: 'a.pdf' });
  });

  it('renders extra tabs and switches to their content', async () => {
    const onTabChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        onTabChange={onTabChange}
        extraTabs={[
          {
            id: 'results',
            label: 'Results',
            content: <div>custom results view</div>,
          },
        ]}
      />
    );
    // With extra tabs present the switcher collapses from pills to a dropdown.
    await userEvent.click(screen.getByRole('button', { name: /View:/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Results' }));
    expect(screen.getByText('custom results view')).toBeInTheDocument();
    expect(onTabChange).toHaveBeenCalledWith('results');
  });

  it('opens on defaultTab and falls back to Schema when the tab disappears', async () => {
    const { rerender } = render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        defaultTab="results"
        extraTabs={[
          {
            id: 'results',
            label: 'Results',
            content: <div>custom results view</div>,
          },
        ]}
      />
    );
    expect(screen.getByText('custom results view')).toBeInTheDocument();
    // The node type changed and no longer resolves the custom tab.
    rerender(<NodeIOView schema={SCHEMA} value={VALUE} defaultTab="results" />);
    expect(screen.getByRole('tab', { name: 'Schema' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders content between the tab strip and the tab body', () => {
    render(<NodeIOView schema={SCHEMA} value={VALUE} beforeContent={<div>instruction box</div>} />);
    expect(screen.getByText('instruction box')).toBeInTheDocument();
  });

  it('wraps rows with a custom rowWrapper', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        rowWrapper={({ node, className, style, children }) => (
          <div data-testid={`row-${node.path}`} className={className} style={style}>
            {children}
          </div>
        )}
      />
    );
    expect(screen.getByTestId('row-statusCode')).toBeInTheDocument();
    // The wrapper carries the row layout class so it IS the row element.
    expect(screen.getByTestId('row-statusCode').className).toContain('group');
  });

  it('shows the consumer-provided empty message when there are no fields', () => {
    render(<NodeIOView value={{}} emptyMessage="Nothing captured yet." />);
    expect(screen.getByText('Nothing captured yet.')).toBeInTheDocument();
  });

  it('wraps copied paths through pathForCopy', async () => {
    const onCopy = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        onCopy={onCopy}
        pathForCopy={(path) => `{{${path}}}`}
      />
    );
    // The copy affordance surfaces the wrapped path (what actually gets copied),
    // not the raw tree path.
    await userEvent.click(screen.getByRole('button', { name: 'Copy path for {{statusCode}}' }));
    expect(onCopy).toHaveBeenCalledWith({
      kind: 'path',
      path: 'statusCode',
      text: '{{statusCode}}',
    });
  });

  it('renders custom row actions alongside the defaults via ctx.defaultActions', async () => {
    const onSelect = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        onValueChange={vi.fn()}
        nodeActions={(node, { defaultActions }) =>
          node.path === 'statusCode'
            ? [
                {
                  id: 'star',
                  icon: <svg data-testid="star-icon" />,
                  label: `Star ${node.key}`,
                  onSelect,
                },
                ...defaultActions,
              ]
            : undefined
        }
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Star statusCode' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ path: 'statusCode' }));
    // The built-in copy-value survives because the resolver spread defaultActions.
    expect(screen.getByRole('button', { name: 'Copy value of statusCode' })).toBeInTheDocument();
  });

  it('keeps the default actions on rows the resolver returns undefined for', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        onValueChange={vi.fn()}
        nodeActions={() => undefined}
      />
    );
    // undefined everywhere == the pre-nodeActions behavior.
    expect(screen.getByRole('button', { name: 'Copy value of statusCode' })).toBeInTheDocument();
  });

  it('omits all row actions for a node when the resolver returns an empty list', () => {
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        onValueChange={vi.fn()}
        nodeActions={(node) => (node.path === 'statusCode' ? [] : undefined)}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Copy value of statusCode' })
    ).not.toBeInTheDocument();
    // Sibling rows still carry their defaults.
    expect(screen.getByRole('button', { name: 'Copy value of cached' })).toBeInTheDocument();
  });

  it('commits a value through a custom action context', async () => {
    const onValueChange = vi.fn();
    render(
      <NodeIOView
        schema={SCHEMA}
        value={{ statusCode: 200 }}
        onValueChange={onValueChange}
        nodeActions={(node, ctx) =>
          node.path === 'statusCode'
            ? [
                {
                  id: 'set',
                  icon: <svg />,
                  label: 'Set 500',
                  onSelect: () => ctx.commit(500),
                },
              ]
            : undefined
        }
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Set 500' }));
    const [next] = onValueChange.mock.calls[0] as [JsonValue];
    expect(next).toEqual({ statusCode: 500 });
  });

  it('previews an array item shape from the schema when there is no value', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, count: { type: 'integer' } },
              },
            },
          },
        }}
        onValueChange={vi.fn()}
      />
    );
    // The array's item shape is visible even with no value: one "item" preview
    // row expanding to the declared fields.
    expect(screen.getByText('rows')).toBeInTheDocument();
    expect(screen.getByText('item')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('count')).toBeInTheDocument();
    // The preview is not a real element, so the array still reads "0 items".
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  it('leaves the preview item read-only in an editable tree', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        }}
        onValueChange={vi.fn()}
      />
    );
    // A preview field illustrates the shape; it is not settable like a real
    // unset key, so it exposes no edit control (the field is still surfaced).
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit value of name' })).not.toBeInTheDocument();
  });

  it('previews the item shape for a present-but-empty array', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
        }}
        value={{ tags: [] }}
        onValueChange={vi.fn()}
      />
    );
    expect(screen.getByText('item')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  it('previews the item shape even when the tree is read-only', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
        }}
        readOnly
      />
    );
    // Unlike a plain unset key (hidden when read-only), the preview always
    // surfaces so the shape is discoverable.
    expect(screen.getByText('item')).toBeInTheDocument();
  });

  it('shows real items instead of a preview once the array has a value', () => {
    render(
      <NodeIOView
        schema={{
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
        }}
        value={{ tags: ['a', 'b'] }}
      />
    );
    expect(screen.queryByText('item')).not.toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('collapses row actions beyond the inline cap into an overflow menu', async () => {
    const mk = (n: number) => ({
      id: `a${n}`,
      icon: <svg />,
      label: `Action ${n}`,
      onSelect: vi.fn(),
    });
    render(
      <NodeIOView
        schema={SCHEMA}
        value={VALUE}
        nodeActions={(node) => (node.path === 'statusCode' ? [mk(1), mk(2), mk(3), mk(4)] : [])}
      />
    );
    // Cap is 3: the first two stay inline, the rest move under "More actions".
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Action 4' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menuitem', { name: 'Action 4' })).toBeInTheDocument();
  });
});
