import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { JsonTreeViewProvider } from './json-tree-view';
import {
  ToolCall,
  ToolCallContent,
  ToolCallError,
  ToolCallHeader,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallProps,
  ToolCallSection,
} from './tool-call';

function Card({
  input = { query: 'weather in Paris' },
  output,
  error,
  ...props
}: Partial<ToolCallProps> & { input?: unknown; output?: unknown; error?: unknown }) {
  return (
    <ToolCall data-testid="tool-call" status="completed" {...props}>
      <ToolCallHeader name="search web" duration="1.20 seconds" />
      <ToolCallContent>
        <ToolCallInput value={input} />
        <ToolCallError value={error} />
        <ToolCallOutput value={output} />
      </ToolCallContent>
    </ToolCall>
  );
}

const toggle = () => screen.getByRole('button', { name: /search web/ });
const section = (name: string) => screen.getByRole('button', { name });

describe('ToolCall', () => {
  it.each([
    ['pending', 'Pending', "Running 'search web'"],
    ['executing', 'Running', "Running 'search web'"],
    ['completed', 'Completed', "Ran 'search web' for 1.20 seconds"],
    ['failed', 'Failed', "Ran 'search web' for 1.20 seconds"],
  ] as const)('shows the %s status line and data-status', (status, statusText, line) => {
    render(<Card status={status} />);
    const root = screen.getByTestId('tool-call');
    expect(root).toHaveAttribute('data-slot', 'tool-call');
    expect(root).toHaveAttribute('data-status', status);
    expect(screen.getByText(statusText)).toHaveAttribute('data-slot', 'tool-call-status');
    expect(screen.getByText(line)).toHaveAttribute('data-slot', 'tool-call-label');
    expect(toggle()).toHaveAccessibleName(`${statusText} ${line}`);
  });

  it('leaves the duration out when there is none', () => {
    render(
      <ToolCall status="completed">
        <ToolCallHeader name="search web" />
      </ToolCall>
    );
    expect(screen.getByText("Ran 'search web'")).toBeInTheDocument();
  });

  it('spins the executing icon unless reduced motion is requested', () => {
    const { container } = render(<Card status="executing" />);
    expect(container.querySelector('[data-slot="tool-call-status-icon"]')).toHaveClass(
      'animate-spin',
      'motion-reduce:animate-none'
    );
  });

  it('forwards the ref and exposes the size', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} size="sm" />);
    expect(ref.current).toBe(screen.getByTestId('tool-call'));
    expect(ref.current).toHaveAttribute('data-size', 'sm');
  });

  it('starts closed and toggles the body from the whole status line', async () => {
    const user = userEvent.setup();
    render(<Card />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Input')).not.toBeInTheDocument();

    await user.click(screen.getByText("Ran 'search web' for 1.20 seconds"));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const content = screen.getByText('Input').closest('[data-slot="tool-call-content"]');
    expect(content).toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-controls', content?.id);

    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Input')).not.toBeInTheDocument();
  });

  it('honours defaultOpen', () => {
    render(<Card defaultOpen />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(section('Input')).toBeInTheDocument();
  });

  it('respects a controlled open state and reports toggles', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Card open={false} onOpenChange={onOpenChange} />);

    await user.click(toggle());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');

    rerender(<Card open onOpenChange={onOpenChange} />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('renders a plain status line without a toggle when there is no content', () => {
    render(
      <ToolCall status="completed">
        <ToolCallHeader name="search web" />
      </ToolCall>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('starts each section closed and toggles it independently', async () => {
    const user = userEvent.setup();
    render(<Card defaultOpen output={{ temperature: 18 }} />);
    expect(section('Input')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('query')).not.toBeInTheDocument();

    await user.click(section('Input'));
    expect(section('Input')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('query')).toBeInTheDocument();
    expect(section('Output')).toHaveAttribute('aria-expanded', 'false');
  });

  it('honours defaultOpen on a section', () => {
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="escalate" />
        <ToolCallContent>
          <ToolCallSection title="Escalation" defaultOpen>
            Task link
          </ToolCallSection>
        </ToolCallContent>
      </ToolCall>
    );
    expect(section('Escalation')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Task link')).toBeInTheDocument();
  });

  it('renders objects as a JSON tree with nested values folded', async () => {
    const user = userEvent.setup();
    const value = { query: 'Paris', filters: { lang: 'fr' }, tags: ['a', 'b'] };
    const tree = (input: object) => (
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="search web" />
        <ToolCallContent>
          <ToolCallInput defaultOpen value={input} />
        </ToolCallContent>
      </ToolCall>
    );
    const { rerender } = render(tree(value));
    expect(screen.getByText('query').closest('[data-slot="tool-call-value"]')).toBeInTheDocument();
    expect(screen.queryByText('lang')).not.toBeInTheDocument();

    const expandFilters = screen.getByRole('button', { name: 'Expand filters' });
    expect(expandFilters).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandFilters);
    expect(screen.getByRole('button', { name: 'Collapse filters' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('lang')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand tags' })).toBeInTheDocument();

    // A container that arrives in a later value (e.g. while streaming) starts folded too.
    rerender(tree({ ...value, meta: { page: 1 } }));
    expect(screen.getByRole('button', { name: 'Expand meta' })).toBeInTheDocument();
    expect(screen.getByText('lang')).toBeInTheDocument();
  });

  it('renders string payloads as wrapped text', () => {
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="summarise" />
        <ToolCallContent>
          <ToolCallOutput defaultOpen value={'line one\nline two'} />
        </ToolCallContent>
      </ToolCall>
    );
    const value = screen.getByText(/line one/);
    expect(value).toHaveAttribute('data-slot', 'tool-call-value');
    expect(value.textContent).toBe('line one\nline two');
  });

  it('skips a section whose value is undefined', () => {
    render(<Card defaultOpen />);
    expect(screen.queryByRole('button', { name: 'Output' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Errors' })).not.toBeInTheDocument();
  });

  it('renders structured errors like other values', async () => {
    const user = userEvent.setup();
    render(<Card status="failed" defaultOpen error={{ code: 429, message: 'Rate limited' }} />);
    await user.click(section('Errors'));
    const error = section('Errors').closest('[data-slot="tool-call-error"]');
    expect(error).toHaveTextContent('code');
    expect(error).toHaveTextContent('Rate limited');
  });

  it('uses renderValue when it returns a node and falls back otherwise', () => {
    const renderValue = vi.fn((value: unknown) =>
      typeof value === 'string' ? <code data-testid="custom">{value}</code> : undefined
    );
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="run sql" />
        <ToolCallContent>
          <ToolCallInput defaultOpen value="SELECT 1" renderValue={renderValue} />
          <ToolCallOutput defaultOpen value={{ rows: 1 }} renderValue={renderValue} />
        </ToolCallContent>
      </ToolCall>
    );
    expect(screen.getByTestId('custom')).toHaveTextContent('SELECT 1');
    expect(renderValue).toHaveBeenCalledWith('SELECT 1');
    expect(screen.getByText('rows')).toBeInTheDocument();
  });

  it('respects a controlled section and reports toggles', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const traces = (open: boolean) => (
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="escalate" />
        <ToolCallContent>
          <ToolCallSection title="Traces" open={open} onOpenChange={onOpenChange}>
            Trace rows
          </ToolCallSection>
        </ToolCallContent>
      </ToolCall>
    );
    const { rerender } = render(traces(false));
    await user.click(section('Traces'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Trace rows')).not.toBeInTheDocument();

    rerender(traces(true));
    expect(screen.getByText('Trace rows')).toBeInTheDocument();
  });

  it('adds and removes the toggle as content mounts and unmounts', () => {
    const card = (withContent: boolean) => (
      <ToolCall status="completed">
        <ToolCallHeader name="search web" />
        {withContent ? (
          <ToolCallContent>
            <ToolCallInput value="x" />
          </ToolCallContent>
        ) : null}
      </ToolCall>
    );
    const { rerender } = render(card(false));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(card(true));
    expect(toggle()).toBeInTheDocument();
    rerender(card(false));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['zero', 0, '0'],
    ['false', false, 'false'],
    ['an empty object', {}, '{}'],
    ['an empty array', [], '[]'],
    ['an Error', new Error('Rate limited'), 'Error: Rate limited'],
    ['a bigint', BigInt(10), '10'],
  ])('renders %s as text', (_, value, text) => {
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="search web" />
        <ToolCallContent>
          <ToolCallOutput defaultOpen value={value} />
        </ToolCallContent>
      </ToolCall>
    );
    expect(screen.getByText(text)).toHaveAttribute('data-slot', 'tool-call-value');
  });

  it('mounts only the rows in view for large payloads', () => {
    const items = Array.from({ length: 500 }, (_, i) => `item ${i}`);
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="list items" />
        <ToolCallContent>
          <ToolCallOutput defaultOpen value={items} />
        </ToolCallContent>
      </ToolCall>
    );
    expect(screen.queryByText('"item 499"')).not.toBeInTheDocument();
    expect(screen.queryAllByText(/"item \d+"/).length).toBeLessThan(items.length);
  });

  it('hides a section whose value is null', () => {
    render(<Card defaultOpen output={null} error={null} />);
    expect(screen.queryByRole('button', { name: 'Output' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Errors' })).not.toBeInTheDocument();
  });

  it('only calls renderValue while the section is open', async () => {
    const user = userEvent.setup();
    const renderValue = vi.fn(() => undefined);
    render(
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="run sql" />
        <ToolCallContent>
          <ToolCallInput value="SELECT 1" renderValue={renderValue} />
        </ToolCallContent>
      </ToolCall>
    );
    expect(renderValue).not.toHaveBeenCalled();
    await user.click(section('Input'));
    expect(renderValue).toHaveBeenCalledWith('SELECT 1');
  });

  it('keeps the English default when an override is undefined', () => {
    render(<Card status="executing" strings={{ running: undefined, executing: undefined }} />);
    expect(screen.getByText("Running 'search web'")).toBeInTheDocument();
    expect(screen.getByText('Running')).toHaveAttribute('data-slot', 'tool-call-status');
  });

  it('applies string overrides', () => {
    render(
      <Card
        status="executing"
        defaultOpen
        strings={{
          executing: 'Läuft',
          running: (name) => `'${name}' wird ausgeführt`,
          input: 'Eingabe',
        }}
      />
    );
    expect(screen.getByText('Läuft')).toHaveAttribute('data-slot', 'tool-call-status');
    expect(screen.getByText("'search web' wird ausgeführt")).toBeInTheDocument();
    expect(section('Eingabe')).toBeInTheDocument();
  });

  it('translates the JSON tree through jsonTreeStrings over an outer provider', () => {
    render(
      <JsonTreeViewProvider
        strings={{
          expandKey: (key) => `${key} aufklappen`,
          copyPathFor: (path) => `Pfad ${path} kopieren`,
        }}
      >
        <ToolCall
          status="completed"
          defaultOpen
          jsonTreeStrings={{ copyPathFor: (path) => `Copier le chemin ${path}` }}
        >
          <ToolCallHeader name="search web" />
          <ToolCallContent>
            <ToolCallInput defaultOpen value={{ filters: { lang: 'fr' } }} />
          </ToolCallContent>
        </ToolCall>
      </JsonTreeViewProvider>
    );
    expect(screen.getByRole('button', { name: 'filters aufklappen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le chemin filters' })).toBeInTheDocument();
  });

  it('throws when a part is used outside ToolCall', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<ToolCallHeader name="x" />)).toThrow(/within a ToolCall/);
      expect(() => render(<ToolCallSection title="x" />)).toThrow(/within a ToolCall/);
    } finally {
      spy.mockRestore();
    }
  });

  it('has no accessibility violations closed', async () => {
    const { container } = render(<Card />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations with every section open', async () => {
    const { container } = render(
      <ToolCall status="failed" defaultOpen>
        <ToolCallHeader name="search web" duration="1.20 seconds" />
        <ToolCallContent>
          <ToolCallInput defaultOpen value={{ query: 'Paris', filters: { lang: 'fr' } }} />
          <ToolCallError defaultOpen value="Rate limit exceeded" />
          <ToolCallOutput defaultOpen value="partial output" />
        </ToolCallContent>
      </ToolCall>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
