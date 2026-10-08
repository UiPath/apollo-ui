import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Citation } from './citation';

const data = {
  index: 2,
  title: 'Invoice policy 2026',
  snippet: 'Invoices above $5,000 need a manager approval.',
  source: 'policies.example.com',
  href: 'https://policies.example.com/invoices',
};

describe('Citation', () => {
  it('renders the index in a button named from the title', () => {
    render(<Citation {...data} />);
    const button = screen.getByRole('button', { name: 'Citation 2: Invoice policy 2026' });
    expect(button).toHaveTextContent('2');
    expect(button).toHaveAttribute('data-slot', 'citation');
  });

  it('falls back to the index-only name and accepts a custom label', () => {
    render(<Citation index="a" label="[a]" />);
    expect(screen.getByRole('button', { name: 'Citation a' })).toHaveTextContent('[a]');
  });

  it('calls onSelect with the citation on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual(data);
  });

  it('calls onSelect on Enter and Space', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Citation {...data} onSelect={onSelect} />);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('shows the preview when focused', async () => {
    const user = userEvent.setup();
    render(<Citation {...data} />);
    expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();
    await user.tab();
    expect(await screen.findByText(data.title)).toBeInTheDocument();
    expect(screen.getByText(data.snippet)).toBeInTheDocument();
    expect(screen.getByText(data.source)).toBeInTheDocument();
  });

  it('skips the preview without content or when disabled by prop', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Citation index={1} />);
    await user.tab();
    expect(document.querySelector('[data-slot=citation-preview]')).toBeNull();
    rerender(<Citation {...data} preview={false} />);
    await user.tab();
    expect(screen.queryByText(data.snippet)).not.toBeInTheDocument();
  });

  it('applies the size variant and forwards refs', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Citation ref={ref} index={1} size="sm" className="custom" />);
    expect(ref.current).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toHaveClass('custom', 'h-4');
  });

  it('uses overridden strings', () => {
    render(<Citation {...data} strings={{ labelWithTitle: 'Quelle {index}: {title}' }} />);
    expect(
      screen.getByRole('button', { name: 'Quelle 2: Invoice policy 2026' })
    ).toBeInTheDocument();
  });

  it('has no accessibility violations in prose', async () => {
    const { container } = render(
      <p>
        Approval is required above $5,000
        <Citation {...data} /> and must be logged
        <Citation index={3} title="Audit guide" />.
      </p>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
