import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BUILT_IN_GUARDRAIL, CUSTOM_GUARDRAIL } from '../__fixtures__/list-items';
import { GUARDRAIL_LIST_EN_LABELS } from '../i18n';
import type { GuardrailListItem, GuardrailListItemState } from '../list-types';
import { GuardrailListRow, type GuardrailListRowProps } from './guardrail-list-row';

const labels = GUARDRAIL_LIST_EN_LABELS;

function renderRow(
  overrides: Partial<GuardrailListRowProps> = {},
  wrapper?: (n: ReactNode) => ReactNode
) {
  const guardrail = overrides.guardrail ?? BUILT_IN_GUARDRAIL;
  const state: GuardrailListItemState = overrides.state ?? { status: 'Available', origin: 'local' };
  const row = (
    <GuardrailListRow
      guardrail={guardrail}
      id={guardrail.id ?? guardrail.name}
      state={state}
      labels={labels}
      disabled={false}
      sortable
      statusChips
      previewChip={false}
      activatesEdit={false}
      formatScopes={(item) => item.selector?.scopes?.join(', ')}
      formatAction={(item) => item.action?.$actionType}
      {...overrides}
    />
  );
  return render(
    <DndContext>
      <SortableContext items={[guardrail.id ?? guardrail.name]}>
        <ul>{wrapper ? wrapper(row) : row}</ul>
      </SortableContext>
    </DndContext>
  );
}

describe('GuardrailListRow', () => {
  it('renders the name, description, action and scopes', () => {
    renderRow();

    expect(screen.getByText('PII detection')).toBeInTheDocument();
    expect(screen.getByText('Detect personally identifiable information')).toBeInTheDocument();
    expect(screen.getByText('log')).toBeInTheDocument();
    expect(screen.getByText('Agent, Llm')).toBeInTheDocument();
  });

  it('names the drag handle after the guardrail', () => {
    renderRow();
    expect(screen.getByRole('button', { name: 'Reorder guardrail PII detection' })).toBeEnabled();
  });

  it('renders no drag handle when the list is not sortable', () => {
    renderRow({ sortable: false });
    expect(screen.queryByRole('button', { name: /Reorder guardrail/ })).not.toBeInTheDocument();
  });

  it('renders no chips when statusChips is off, which is both products today', () => {
    renderRow({
      statusChips: false,
      previewChip: true,
      state: { status: 'Disabled', origin: 'governance' },
    });

    expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
    expect(screen.queryByText('Governance')).not.toBeInTheDocument();
    // The preview chip has its own flag, and the BYO notices are never gated.
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders no chips for a healthy local row', () => {
    renderRow();

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Governance')).not.toBeInTheDocument();
    expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
  });

  it.each([
    ['Disabled', 'Disabled'],
    ['Unavailable', 'Unavailable'],
    ['Unauthorised', 'Not entitled'],
    ['FeatureDisabled', 'Feature disabled'],
  ] as const)('chips the %s status', (status, expectedLabel) => {
    renderRow({ state: { status, origin: 'local' } });
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('chips a governance-managed row', () => {
    renderRow({ state: { status: 'Available', origin: 'governance' } });
    expect(screen.getByText('Governance')).toBeInTheDocument();
  });

  it('chips built-in rows as preview only when the host asks for it', () => {
    const { unmount } = renderRow({ previewChip: true });
    expect(screen.getByText('Preview')).toBeInTheDocument();
    unmount();

    renderRow({ previewChip: true, guardrail: CUSTOM_GUARDRAIL });
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });

  it('announces the BYO disabled notice as an alert', () => {
    renderRow({ state: { status: 'Disabled', origin: 'local', notice: 'byoDisabled' } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This guardrail's configuration has been disabled"
    );
  });

  it('announces the BYO unavailable notice as an alert', () => {
    renderRow({ state: { status: 'Unavailable', origin: 'local', notice: 'byoUnavailable' } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This guardrail's configuration is no longer available"
    );
  });

  it('renders the provider line for a BYO row', () => {
    renderRow({ state: { status: 'Available', origin: 'local', byoConnectorName: 'Acme' } });

    const provider = screen.getByText('Provider: Acme');
    expect(provider).toHaveAttribute('title', 'Provider: Acme');
  });

  it('reports edit and remove with the original guardrail object', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    renderRow({ onEdit, onRemove });

    await user.click(screen.getByRole('button', { name: 'Edit guardrail' }));
    await user.click(screen.getByRole('button', { name: 'Delete guardrail' }));

    expect(onEdit).toHaveBeenCalledWith(BUILT_IN_GUARDRAIL);
    expect(onEdit.mock.calls[0][0]).toBe(BUILT_IN_GUARDRAIL);
    expect(onRemove.mock.calls[0][0]).toBe(BUILT_IN_GUARDRAIL);
  });

  it('renders only the affordances the host wired up', () => {
    renderRow({ onEdit: vi.fn() });

    expect(screen.getByRole('button', { name: 'Edit guardrail' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete guardrail' })).not.toBeInTheDocument();
  });

  it('disables the row actions in read-only mode', () => {
    renderRow({ disabled: true, onEdit: vi.fn(), onRemove: vi.fn() });

    expect(screen.getByRole('button', { name: 'Edit guardrail' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete guardrail' })).toBeDisabled();
  });

  it('leaves the drag handle live in a read-only row, which is Flow behaviour', () => {
    // The list decides whether a row is sortable; `disabled` only governs the actions, so a
    // host can keep reordering while editing is off.
    renderRow({ disabled: true });
    expect(screen.getByRole('button', { name: /Reorder guardrail/ })).toBeEnabled();
  });

  it('is not a control unless rowActivatesEdit is set', () => {
    renderRow({ onEdit: vi.fn() });
    expect(screen.queryByRole('button', { name: /Edit guardrail PII/ })).not.toBeInTheDocument();
  });

  it('activates edit from the row body on click and on Enter', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderRow({ activatesEdit: true, onEdit });

    const body = screen.getByRole('button', { name: 'Edit guardrail PII detection' });
    await user.click(body);
    body.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onEdit).toHaveBeenCalledTimes(3);
  });

  it('does not activate a read-only row body', () => {
    renderRow({ activatesEdit: true, disabled: true, onEdit: vi.fn() });
    expect(
      screen.queryByRole('button', { name: 'Edit guardrail PII detection' })
    ).not.toBeInTheDocument();
  });

  it('replaces the built-in actions with the host slot', () => {
    renderRow({
      onEdit: vi.fn(),
      onRemove: vi.fn(),
      renderActions: () => <button type="button">More options</button>,
    });

    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit guardrail' })).not.toBeInTheDocument();
  });

  it('wraps the row body in a tooltip when the host supplies one', async () => {
    const user = userEvent.setup();
    renderRow(
      { renderTooltip: (item) => `Scopes: ${item.selector?.scopes?.join(', ')}` },
      (row) => <TooltipProvider>{row}</TooltipProvider>
    );

    await user.hover(screen.getByText('PII detection'));
    expect(await screen.findAllByText('Scopes: Agent, Llm')).not.toHaveLength(0);
  });

  it('omits the footer when the guardrail carries neither an action nor scopes', () => {
    const bare: GuardrailListItem = { $guardrailType: 'custom', name: 'Bare' };
    renderRow({ guardrail: bare });

    expect(screen.getByText('Bare')).toBeInTheDocument();
    expect(screen.queryByText('log')).not.toBeInTheDocument();
  });

  it('has no accessibility violations when every element renders', async () => {
    const { container } = renderRow({
      previewChip: true,
      activatesEdit: true,
      state: {
        status: 'Disabled',
        origin: 'governance',
        notice: 'byoDisabled',
        byoConnectorName: 'Acme',
      },
      onEdit: vi.fn(),
      onRemove: vi.fn(),
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
