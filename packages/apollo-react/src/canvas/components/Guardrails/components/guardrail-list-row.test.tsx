import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  BYO_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  DEFINITIONS,
  PII_GUARDRAIL,
} from '../__fixtures__/guardrail-list.fixtures';
import { resolveGuardrailListItemState } from '../guardrail-list-utils';
import { GUARDRAIL_LIST_EN_LABELS } from '../i18n';
import type { GuardrailListItem } from '../list-types';
import { GuardrailListRow, type GuardrailListRowProps } from './guardrail-list-row';

const labels = GUARDRAIL_LIST_EN_LABELS;

function renderRow(
  item: GuardrailListItem = PII_GUARDRAIL,
  props: Partial<GuardrailListRowProps> = {},
  definitions = DEFINITIONS
) {
  return render(
    <GuardrailListRow
      item={item}
      id={item.id ?? item.name}
      index={0}
      state={resolveGuardrailListItemState(item, definitions)}
      labels={labels}
      {...props}
    />
  );
}

describe('GuardrailListRow', () => {
  it('renders the name, description, action and scopes', () => {
    renderRow();

    expect(screen.getByText('PII detection 1')).toBeInTheDocument();
    expect(screen.getByText('Scans agent output for personal data.')).toBeInTheDocument();
    expect(screen.getByText('log')).toBeInTheDocument();
    expect(screen.getByText('Agent, Tool')).toBeInTheDocument();
  });

  it('renders the BYO connector as the provider line', () => {
    renderRow(BYO_GUARDRAIL);

    expect(screen.getByText('Provider: Noma Security')).toBeInTheDocument();
  });

  it('falls back to the unknown-action label when a row has no action', () => {
    renderRow({ name: 'Legacy guardrail' });

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders no action or scopes line when both are formatted away', () => {
    renderRow(PII_GUARDRAIL, { formatAction: () => null, formatScopes: () => null });

    expect(screen.queryByText('log')).not.toBeInTheDocument();
    expect(screen.queryByText('Agent, Tool')).not.toBeInTheDocument();
  });

  it('lets the host localize the scopes and the action', () => {
    renderRow(PII_GUARDRAIL, {
      formatScopes: (item) => `Scopes: ${item.selector?.scopes?.length}`,
      formatAction: () => 'Protokollieren',
    });

    expect(screen.getByText('Scopes: 2')).toBeInTheDocument();
    expect(screen.getByText('Protokollieren')).toBeInTheDocument();
  });

  describe('chips', () => {
    it('renders no chips by default', () => {
      renderRow(PII_GUARDRAIL, { statusChips: false, administration: 'governance' });

      expect(screen.queryByText('Governance managed')).not.toBeInTheDocument();
    });

    it('renders the status and administration chips when asked', () => {
      renderRow(BYO_GUARDRAIL, { statusChips: true, administration: 'governance' }, [
        { validator: 'byo', status: 'Unauthorised', byoValidatorName: 'noma_prompt_injection' },
      ]);

      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      expect(screen.getByText('Governance managed')).toBeInTheDocument();
    });

    it('renders the preview badge only for built-in validators, and only when asked', () => {
      const { unmount } = renderRow(PII_GUARDRAIL, { previewChip: true });
      expect(screen.getByText('Preview')).toBeInTheDocument();
      unmount();

      renderRow(CUSTOM_GUARDRAIL, { previewChip: true });
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });
  });

  describe('BYO notices', () => {
    it('announces a disabled configuration', () => {
      renderRow(BYO_GUARDRAIL, {}, [
        { validator: 'byo', status: 'Disabled', byoValidatorName: 'noma_prompt_injection' },
      ]);

      expect(screen.getByRole('alert')).toHaveTextContent(
        "This guardrail's configuration has been disabled"
      );
    });

    it('announces a configuration that no longer resolves', () => {
      renderRow(BYO_GUARDRAIL, {}, [{ validator: 'pii_detection', status: 'Available' }]);

      expect(screen.getByRole('alert')).toHaveTextContent(
        "This guardrail's configuration is no longer available"
      );
    });

    it('shows neither notice for a healthy row', () => {
      renderRow(BYO_GUARDRAIL);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders only the actions the host wired up', () => {
      renderRow(PII_GUARDRAIL, { onEdit: vi.fn() });

      expect(screen.getByRole('button', { name: 'Edit guardrail' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove guardrail' })).not.toBeInTheDocument();
    });

    it('reports edit and remove intents with the row', () => {
      const onEdit = vi.fn();
      const onRemove = vi.fn();
      renderRow(PII_GUARDRAIL, { onEdit, onRemove });

      fireEvent.click(screen.getByRole('button', { name: 'Edit guardrail' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove guardrail' }));

      expect(onEdit).toHaveBeenCalledWith(PII_GUARDRAIL);
      expect(onRemove).toHaveBeenCalledWith(PII_GUARDRAIL);
    });

    it('disables both actions when the list is read-only', () => {
      const onEdit = vi.fn();
      renderRow(PII_GUARDRAIL, { onEdit, onRemove: vi.fn(), disabled: true });

      const edit = screen.getByRole('button', { name: 'Edit guardrail' });
      expect(edit).toBeDisabled();
      fireEvent.click(edit);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('hands the slot the row, its position and the default actions', () => {
      const renderItemActions = vi.fn(() => <button type="button">More options</button>);
      renderRow(PII_GUARDRAIL, { onEdit: vi.fn(), index: 2, renderItemActions });

      expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit guardrail' })).not.toBeInTheDocument();
      expect(renderItemActions).toHaveBeenCalledWith(
        expect.objectContaining({ item: PII_GUARDRAIL, id: 'g1', index: 2, disabled: false })
      );
    });

    it('lets a slot render the default actions alongside its own', () => {
      renderRow(PII_GUARDRAIL, {
        onEdit: vi.fn(),
        renderItemActions: ({ defaultActions }) => (
          <>
            {defaultActions}
            <button type="button">More options</button>
          </>
        ),
      });

      expect(screen.getByRole('button', { name: 'Edit guardrail' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    });
  });

  describe('rowActivatesEdit', () => {
    it('does not make the body activatable by default', () => {
      renderRow(PII_GUARDRAIL, { onEdit: vi.fn() });

      expect(
        screen.queryByRole('button', { name: 'Edit PII detection 1' })
      ).not.toBeInTheDocument();
    });

    it('opens the editor on click and on Enter or Space', () => {
      const onEdit = vi.fn();
      renderRow(PII_GUARDRAIL, { onEdit, rowActivatesEdit: true });

      const body = screen.getByRole('button', { name: 'Edit PII detection 1' });
      fireEvent.click(body);
      fireEvent.keyDown(body, { key: 'Enter' });
      fireEvent.keyDown(body, { key: ' ' });

      expect(onEdit).toHaveBeenCalledTimes(3);
    });

    it('stays inert while read-only', () => {
      renderRow(PII_GUARDRAIL, { onEdit: vi.fn(), rowActivatesEdit: true, disabled: true });

      expect(
        screen.queryByRole('button', { name: 'Edit PII detection 1' })
      ).not.toBeInTheDocument();
    });

    it('keeps the row actions out of the activatable body, so no button nests in a button', async () => {
      const { container } = renderRow(PII_GUARDRAIL, {
        onEdit: vi.fn(),
        onRemove: vi.fn(),
        rowActivatesEdit: true,
      });

      const body = screen.getByRole('button', { name: 'Edit PII detection 1' });
      expect(body.querySelector('button')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('renders the host tooltip over the row body', () => {
    renderRow(PII_GUARDRAIL, { renderRowTooltip: (item) => `About ${item.name}` });

    // Radix keeps the content unmounted until it opens; what matters here is that a row
    // brings its own provider, so mounting a tooltip outside one does not throw.
    expect(screen.getByText('PII detection 1')).toBeInTheDocument();
  });

  it('renders the drag handle the list passes in', () => {
    renderRow(PII_GUARDRAIL, { handle: <button type="button">Reorder guardrail</button> });

    expect(screen.getByRole('button', { name: 'Reorder guardrail' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderRow(BYO_GUARDRAIL, {
      onEdit: vi.fn(),
      onRemove: vi.fn(),
      statusChips: true,
      previewChip: true,
      administration: 'governance',
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
