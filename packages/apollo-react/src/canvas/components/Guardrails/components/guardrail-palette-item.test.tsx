import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { GuardrailPaletteItem } from './guardrail-palette-item';
import { GuardrailStatusChip } from './guardrail-status-chip';

describe('GuardrailPaletteItem', () => {
  it('renders the name, the description and the chips', () => {
    render(
      <GuardrailPaletteItem
        name="PII detection"
        description="Detects personally identifiable information."
        chips={<GuardrailStatusChip tone="neutral">Preview</GuardrailStatusChip>}
        onSelect={vi.fn()}
      />
    );

    const item = screen.getByRole('button');
    expect(item).toHaveTextContent('PII detection');
    expect(item).toHaveTextContent('Detects personally identifiable information.');
    expect(item).toHaveTextContent('Preview');
  });

  it('is a button, so Enter and Space select it without a key handler of our own', () => {
    const onSelect = vi.fn();
    render(<GuardrailPaletteItem name="PII detection" onSelect={onSelect} />);

    const item = screen.getByRole('button', { name: 'PII detection' });
    expect(item).toHaveAttribute('type', 'button');
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  describe('when disabled', () => {
    it('does not select', () => {
      const onSelect = vi.fn();
      render(<GuardrailPaletteItem name="Harmful content" disabled onSelect={onSelect} />);

      fireEvent.click(screen.getByRole('button', { name: 'Harmful content' }));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('stays focusable, so the chip saying why is still reachable', () => {
      render(
        <GuardrailPaletteItem
          name="Harmful content"
          chips={<GuardrailStatusChip tone="warning">Unauthorized</GuardrailStatusChip>}
          disabled
          onSelect={vi.fn()}
        />
      );

      const item = screen.getByRole('button', { name: /Harmful content/ });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).not.toBeDisabled();
      item.focus();
      expect(item).toHaveFocus();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <GuardrailPaletteItem name="PII detection" description="Detects PII." onSelect={vi.fn()} />
        <GuardrailPaletteItem
          name="Harmful content"
          chips={<GuardrailStatusChip tone="warning">Unauthorized</GuardrailStatusChip>}
          disabled
          onSelect={vi.fn()}
        />
      </>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
