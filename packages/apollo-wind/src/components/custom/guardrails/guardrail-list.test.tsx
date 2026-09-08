import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GOLDEN_ENRICHED_DEFINITIONS } from './__fixtures__/golden-enriched';
import {
  BUILT_IN_GUARDRAIL,
  BYO_DISABLED_GUARDRAIL,
  BYO_GUARDRAIL,
  BYO_UNAVAILABLE_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  GUARDRAIL_LIST_ITEMS,
  UNIDENTIFIED_GUARDRAIL,
} from './__fixtures__/list-items';
import { GuardrailList } from './guardrail-list';
import type { GuardrailListItem } from './list-types';

const definitions = GOLDEN_ENRICHED_DEFINITIONS;

function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((row) => within(row).getAllByText(/.+/)[0].textContent);
}

const ROW_HEIGHT = 56;
const ROW_PITCH = 64;

function domRect(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom: top + height,
    left: 0,
    right: 320,
    width: 320,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * jsdom reports a zero rect for everything, which leaves dnd-kit's collision detection unable
 * to tell two rows apart, so a keyboard drag resolves onto the row it started from. Laying the
 * rows out on a synthetic vertical grid is the minimum geometry needed to exercise the real
 * sensor rather than mock the drag away.
 */
function stubRowGeometry() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    const row = this.closest('li');
    if (row?.parentElement) {
      const index = Array.prototype.indexOf.call(row.parentElement.children, row);
      return domRect(index * ROW_PITCH, ROW_HEIGHT);
    }
    const list = this.tagName === 'UL' ? this : this.querySelector('ul');
    if (list) return domRect(0, list.children.length * ROW_PITCH);
    return domRect(0, 0);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GuardrailList', () => {
  it('renders the rows in the given order', () => {
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} definitions={definitions} />);

    expect(rowNames()).toEqual(['PII detection', 'Block refunds over 500', 'Acme toxicity']);
  });

  it('renders the header with the add affordance', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} onAdd={onAdd} />);

    expect(screen.getByText('Guardrails')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('hides the header and the add button when asked', () => {
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} onAdd={vi.fn()} hideHeader />);

    expect(screen.queryByText('Guardrails')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('accepts a custom header title', () => {
    render(<GuardrailList guardrails={[]} title="Tool guardrails" />);
    expect(screen.getByText('Tool guardrails')).toBeInTheDocument();
  });

  it('replaces the add button with the host slot', () => {
    render(
      <GuardrailList guardrails={[]} onAdd={vi.fn()} addSlot={<span>Requires entitlement</span>} />
    );

    expect(screen.getByText('Requires entitlement')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('renders the empty state, and lets the host replace it', () => {
    const { unmount } = render(<GuardrailList guardrails={[]} />);
    expect(screen.getByText('No guardrails configured')).toBeInTheDocument();
    unmount();

    render(<GuardrailList guardrails={[]} emptyState={<span>Nothing here yet</span>} />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByText('No guardrails configured')).not.toBeInTheDocument();
  });

  it('resolves each row against the definitions catalog', () => {
    render(
      <GuardrailList
        guardrails={[BYO_GUARDRAIL, BYO_DISABLED_GUARDRAIL, BYO_UNAVAILABLE_GUARDRAIL]}
        definitions={definitions}
        statusChips
      />
    );

    expect(screen.getByText('Provider: Acme Security')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('tags rows with the host-supplied origin', () => {
    render(
      <GuardrailList
        guardrails={GUARDRAIL_LIST_ITEMS}
        definitions={definitions}
        statusChips
        getItemOrigin={(guardrail) =>
          guardrail.name === 'Block refunds over 500' ? 'governance' : 'local'
        }
      />
    );

    expect(screen.getAllByText('Governance')).toHaveLength(1);
  });

  it('keys rows by name when the host persists no id', () => {
    render(<GuardrailList guardrails={[UNIDENTIFIED_GUARDRAIL]} onReorder={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Reorder guardrail Prompt injection' })
    ).toBeInTheDocument();
  });

  it('accepts a custom id resolver', () => {
    const getItemId = vi.fn((guardrail: GuardrailListItem) => `custom-${guardrail.name}`);
    render(
      <GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} getItemId={getItemId} onReorder={vi.fn()} />
    );

    expect(getItemId).toHaveBeenCalled();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('reports edit and remove with the original guardrail object', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(<GuardrailList guardrails={[CUSTOM_GUARDRAIL]} onEdit={onEdit} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Edit guardrail' }));
    await user.click(screen.getByRole('button', { name: 'Delete guardrail' }));

    expect(onEdit.mock.calls[0][0]).toBe(CUSTOM_GUARDRAIL);
    expect(onRemove.mock.calls[0][0]).toBe(CUSTOM_GUARDRAIL);
  });

  it('routes the host action slot back through onEdit and onRemove', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(
      <GuardrailList
        guardrails={[CUSTOM_GUARDRAIL]}
        onEdit={onEdit}
        onRemove={onRemove}
        renderItemActions={({ guardrail, state, disabled, edit, remove }) => (
          <>
            <span>{`${guardrail.name}:${state.status}:${String(disabled)}`}</span>
            <button type="button" onClick={edit}>
              Menu edit
            </button>
            <button type="button" onClick={remove}>
              Menu remove
            </button>
          </>
        )}
      />
    );

    expect(screen.getByText('Block refunds over 500:Available:false')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit guardrail' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Menu edit' }));
    await user.click(screen.getByRole('button', { name: 'Menu remove' }));

    expect(onEdit.mock.calls[0][0]).toBe(CUSTOM_GUARDRAIL);
    expect(onRemove.mock.calls[0][0]).toBe(CUSTOM_GUARDRAIL);
  });

  it('renders no drag handles without an onReorder callback', () => {
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} />);
    expect(screen.queryByRole('button', { name: /Reorder guardrail/ })).not.toBeInTheDocument();
  });

  it('renders no drag handles in read-only mode', () => {
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} onReorder={vi.fn()} disabled />);
    expect(screen.queryByRole('button', { name: /Reorder guardrail/ })).not.toBeInTheDocument();
  });

  it('keeps reordering when the host separates it from read-only', () => {
    render(
      <GuardrailList
        guardrails={GUARDRAIL_LIST_ITEMS}
        onReorder={vi.fn()}
        disabled
        reorderDisabled={false}
      />
    );

    expect(screen.getAllByRole('button', { name: /Reorder guardrail/ })).toHaveLength(3);
  });

  it('renders nothing for an empty list when the host passes null', () => {
    render(<GuardrailList guardrails={[]} emptyState={null} />);
    expect(screen.queryByText('No guardrails configured')).not.toBeInTheDocument();
  });

  it('renders the footer slot below the rows', () => {
    render(
      <GuardrailList
        guardrails={GUARDRAIL_LIST_ITEMS}
        footer={<button type="button">Add another guardrail</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Add another guardrail' })).toBeInTheDocument();
  });

  it('drops the card chrome when unstyled', () => {
    const { container } = render(<GuardrailList guardrails={[]} unstyled />);

    const root = container.querySelector('[data-slot="guardrail-list"]');
    expect(root).not.toHaveClass('border');
    expect(root).not.toHaveClass('rounded-md');
  });

  it('chips nothing by default, which keeps an adopting host behaviour-identical', () => {
    render(
      <GuardrailList
        guardrails={[BYO_DISABLED_GUARDRAIL]}
        definitions={definitions}
        getItemOrigin={() => 'governance'}
      />
    );

    expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
    expect(screen.queryByText('Governance')).not.toBeInTheDocument();
    // The notice is not a chip and stays on: both products render it today.
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('disables the add and row actions in read-only mode', () => {
    render(
      <GuardrailList
        guardrails={[CUSTOM_GUARDRAIL]}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        disabled
      />
    );

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit guardrail' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete guardrail' })).toBeDisabled();
  });

  it('reorders with the keyboard and reports the move', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    stubRowGeometry();
    render(<GuardrailList guardrails={GUARDRAIL_LIST_ITEMS} onReorder={onReorder} />);

    screen.getByRole('button', { name: 'Reorder guardrail PII detection' }).focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');

    await waitFor(() => expect(onReorder).toHaveBeenCalledOnce());
    const [reordered, move] = onReorder.mock.calls[0];
    expect(reordered.map((guardrail: GuardrailListItem) => guardrail.name)).toEqual([
      'Block refunds over 500',
      'PII detection',
      'Acme toxicity',
    ]);
    expect(move).toEqual({ from: 0, to: 1, id: 'gr-pii' });
    expect(reordered[1]).toBe(BUILT_IN_GUARDRAIL);
  });

  it('renders the section banners, and hides them when the host passes null', () => {
    const { unmount } = render(
      <GuardrailList
        guardrails={[]}
        statusBanner={{ tone: 'error', message: 'Could not load definitions.' }}
        mixedScopes={{ scopes: ['Agent'], tools: ['send_email'] }}
      />
    );

    expect(screen.getByText('Could not load definitions.')).toBeInTheDocument();
    expect(screen.getByText('This guardrail is also applied to:')).toBeInTheDocument();
    expect(screen.getByText('send_email')).toBeInTheDocument();
    unmount();

    render(<GuardrailList guardrails={[]} statusBanner={null} mixedScopes={null} />);
    expect(screen.queryByText('This guardrail is also applied to:')).not.toBeInTheDocument();
  });

  it('reshapes the scope and action summaries through the host slots', () => {
    render(
      <GuardrailList
        guardrails={[BUILT_IN_GUARDRAIL]}
        formatScopes={() => 'Scopes: Agent, LLM calls'}
        formatAction={() => 'Log'}
      />
    );

    expect(screen.getByText('Scopes: Agent, LLM calls')).toBeInTheDocument();
    expect(screen.getByText('Log')).toBeInTheDocument();
  });

  it('overrides chrome strings per key', () => {
    render(<GuardrailList guardrails={[]} labels={{ emptyState: 'No guardrails yet' }} />);

    expect(screen.getByText('No guardrails yet')).toBeInTheDocument();
    expect(screen.getByText('Guardrails')).toBeInTheDocument();
  });

  it('loads the packaged catalog for a host locale', async () => {
    render(<GuardrailList guardrails={[]} locale="de" />);

    await waitFor(() =>
      expect(screen.getByText('Keine Leitplanken konfiguriert')).toBeInTheDocument()
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GuardrailList
        guardrails={GUARDRAIL_LIST_ITEMS}
        definitions={definitions}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with every chip, notice and banner rendered', async () => {
    const { container } = render(
      <GuardrailList
        guardrails={[BYO_DISABLED_GUARDRAIL, BYO_UNAVAILABLE_GUARDRAIL, CUSTOM_GUARDRAIL]}
        definitions={definitions}
        getItemOrigin={() => 'governance'}
        statusChips
        previewChip
        rowActivatesEdit
        statusBanner={{ tone: 'warning', message: 'Read-only.' }}
        mixedScopes={{ scopes: ['Agent'], tools: ['send_email'] }}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
