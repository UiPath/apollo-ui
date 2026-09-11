import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { flushDndFrame, layoutRowsVertically } from './__fixtures__/dnd-geometry';
import {
  BYO_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  DEFINITIONS,
  GUARDRAILS,
  PII_GUARDRAIL,
} from './__fixtures__/guardrail-list.fixtures';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { GuardrailList, type GuardrailListProps } from './guardrail-list';

function renderList(props: Partial<GuardrailListProps> = {}) {
  return render(<GuardrailList guardrails={GUARDRAILS} definitions={DEFINITIONS} {...props} />);
}

const reorderHandle = (name: string) =>
  screen.getByRole('button', { name: `Reorder guardrail ${name}` });

describe('GuardrailList', () => {
  it('renders every row it is given, in order', () => {
    renderList();

    const rows = screen.getAllByText(/PII detection 1|Noma prompt shield|Blocked words/);
    expect(rows.map((row) => row.textContent)).toEqual([
      'PII detection 1',
      'Noma prompt shield',
      'Blocked words',
    ]);
  });

  it('renders a row whose definition never arrived', () => {
    renderList({ definitions: [] });

    expect(screen.getByText('Noma prompt shield')).toBeInTheDocument();
  });

  describe('header', () => {
    it('renders the title and the add affordance', () => {
      const onAdd = vi.fn();
      renderList({ onAdd });

      expect(screen.getByText('Guardrails')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('omits the add button when the host wired no intent', () => {
      renderList();

      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('disables the add button while read-only', () => {
      renderList({ onAdd: vi.fn(), disabled: true });

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('lets a slot replace the add button', () => {
      renderList({ onAdd: vi.fn(), addSlot: <span>Requires entitlement</span> });

      expect(screen.getByText('Requires entitlement')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('can be hidden for hosts that own the section chrome', () => {
      renderList({ hideHeader: true, onAdd: vi.fn() });

      expect(screen.queryByText('Guardrails')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });
  });

  describe('chrome', () => {
    it('renders a card by default and drops it when unstyled', () => {
      const { container, unmount } = renderList();
      expect(container.querySelector('[data-slot="guardrail-list"]')).toHaveClass('border');
      unmount();

      const { container: bare } = renderList({ unstyled: true });
      expect(bare.querySelector('[data-slot="guardrail-list"]')).not.toHaveClass('border');
    });

    it('renders the status banner above the rows', () => {
      renderList({
        statusBanner: <GuardrailStatusBanner tone="error" message="Failed to load validators" />,
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load validators');
    });

    it('renders the footer below the rows', () => {
      renderList({ footer: <button type="button">Add another guardrail</button> });

      expect(screen.getByRole('button', { name: 'Add another guardrail' })).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('explains itself by default', () => {
      renderList({ guardrails: [] });

      expect(screen.getByText('No guardrails configured')).toBeInTheDocument();
    });

    it('renders nothing when the host passes null', () => {
      renderList({ guardrails: [], emptyState: null });

      expect(screen.queryByText('No guardrails configured')).not.toBeInTheDocument();
    });

    it('renders a host-supplied replacement', () => {
      renderList({ guardrails: [], emptyState: <span>Nothing here yet</span> });

      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
      expect(screen.queryByText('No guardrails configured')).not.toBeInTheDocument();
    });
  });

  describe('rows', () => {
    it('identifies rows by id, and by name when the host has no ids', () => {
      const { container, unmount } = renderList();
      expect(
        Array.from(container.querySelectorAll('[data-guardrail-id]')).map((row) =>
          row.getAttribute('data-guardrail-id')
        )
      ).toEqual(['g1', 'g2', 'g3']);
      unmount();

      const { container: byName } = renderList({
        guardrails: [{ name: 'PII detection 1' }],
      });
      expect(byName.querySelector('[data-guardrail-id]')).toHaveAttribute(
        'data-guardrail-id',
        'PII detection 1'
      );
    });

    it('lets the host override row identity', () => {
      const { container } = renderList({ getItemId: (item) => `custom-${item.name}` });

      expect(container.querySelector('[data-guardrail-id]')).toHaveAttribute(
        'data-guardrail-id',
        'custom-PII detection 1'
      );
    });

    it('tags governance-administered rows when the chips are on', () => {
      renderList({
        statusChips: true,
        getItemAdministration: (item) => (item.id === 'g2' ? 'governance' : 'local'),
      });

      expect(screen.getAllByText('Governance managed')).toHaveLength(1);
    });

    it('forwards the row intents', () => {
      const onEdit = vi.fn();
      const onRemove = vi.fn();
      renderList({ onEdit, onRemove });

      // Addressed by name rather than by index, which is what naming each row's actions buys.
      fireEvent.click(screen.getByRole('button', { name: 'Edit PII detection 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove Noma prompt shield' }));

      expect(onEdit).toHaveBeenCalledWith(PII_GUARDRAIL);
      expect(onRemove).toHaveBeenCalledWith(BYO_GUARDRAIL);
    });
  });

  describe('reorder', () => {
    it('mounts no drag affordance without an onReorder intent', () => {
      renderList();

      expect(screen.queryByRole('button', { name: /^Reorder guardrail/ })).not.toBeInTheDocument();
    });

    it('mounts no drag affordance for a single row', () => {
      renderList({ guardrails: [PII_GUARDRAIL], onReorder: vi.fn() });

      expect(screen.queryByRole('button', { name: /^Reorder guardrail/ })).not.toBeInTheDocument();
    });

    it('mounts no DndContext at all while reorder is off', () => {
      const { rerender } = renderList({ onReorder: vi.fn(), reorderDisabled: true });

      // `DndContext` announces drags through a live region it renders itself, so its absence
      // is the observable half of "no drag machinery mounts". The other half is structural:
      // the sensors are hooks, and they live in `SortableRows` next to the context rather
      // than in `GuardrailList`, so they do not run for a non-reorderable list either.
      expect(document.querySelector('[id^="DndLiveRegion"]')).toBeNull();

      rerender(
        <GuardrailList guardrails={GUARDRAILS} definitions={DEFINITIONS} onReorder={vi.fn()} />
      );

      expect(document.querySelector('[id^="DndLiveRegion"]')).not.toBeNull();
    });

    it('follows `disabled` by default', () => {
      renderList({ onReorder: vi.fn(), disabled: true });

      expect(screen.queryByRole('button', { name: /^Reorder guardrail/ })).not.toBeInTheDocument();
    });

    it('stays reorderable in a read-only list when the host asks', () => {
      renderList({ onReorder: vi.fn(), disabled: true, reorderDisabled: false });

      expect(reorderHandle('PII detection 1')).toBeInTheDocument();
    });

    it('names each handle after its row, and keeps it keyboard reachable', () => {
      renderList({ onReorder: vi.fn() });

      const handle = reorderHandle('Noma prompt shield');
      expect(handle.tagName).toBe('BUTTON');
      expect(handle).not.toHaveAttribute('aria-hidden');
    });

    it('reports the reordered rows and the move after a keyboard drag', async () => {
      const onReorder = vi.fn();
      const { container } = renderList({ onReorder });
      layoutRowsVertically(container);

      const handle = reorderHandle('PII detection 1');
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });
      await flushDndFrame();
      fireEvent.keyDown(handle, { key: 'ArrowDown', code: 'ArrowDown' });
      await flushDndFrame();
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });

      expect(onReorder).toHaveBeenCalledWith([BYO_GUARDRAIL, PII_GUARDRAIL, CUSTOM_GUARDRAIL], {
        from: 0,
        to: 1,
        id: 'g1',
      });
    });

    it('reports nothing when a drag is cancelled', async () => {
      const onReorder = vi.fn();
      const { container } = renderList({ onReorder });
      layoutRowsVertically(container);

      const handle = reorderHandle('PII detection 1');
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });
      await flushDndFrame();
      fireEvent.keyDown(handle, { key: 'ArrowDown', code: 'ArrowDown' });
      await flushDndFrame();
      fireEvent.keyDown(handle, { key: 'Escape', code: 'Escape' });

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('reports nothing when a row is dropped where it started', async () => {
      const onReorder = vi.fn();
      const { container } = renderList({ onReorder });
      layoutRowsVertically(container);

      const handle = reorderHandle('PII detection 1');
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });
      await flushDndFrame();
      fireEvent.keyDown(handle, { key: ' ', code: 'Space' });

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderList({
      onAdd: vi.fn(),
      onEdit: vi.fn(),
      onRemove: vi.fn(),
      onReorder: vi.fn(),
      statusChips: true,
      previewChip: true,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations while empty and read-only', async () => {
    const { container } = renderList({ guardrails: [], disabled: true, onAdd: vi.fn() });

    expect(await axe(container)).toHaveNoViolations();
  });
});
