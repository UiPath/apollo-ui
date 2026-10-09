import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SOURCES_STRINGS, SourceItem, Sources, SourcesList } from './sources';

function Example(props: Partial<React.ComponentProps<typeof Sources>>) {
  return (
    <Sources count={2} {...props}>
      <SourcesList>
        <SourceItem
          index={1}
          title="Invoice policy"
          source="policies.example.com"
          href="https://policies.example.com"
        />
        <SourceItem index={2} title="Q3 report.pdf" source="Page 4" />
      </SourcesList>
    </Sources>
  );
}

describe('Sources', () => {
  it('shows the count from strings and flips aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: '2 sources' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Invoice policy')).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Invoice policy')).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses the singular string for one source', () => {
    render(
      <Sources count={1}>
        <SourcesList />
      </Sources>
    );
    expect(screen.getByRole('button', { name: '1 source' })).toBeInTheDocument();
  });

  it('interpolates overridden strings', () => {
    render(<Example strings={{ showSources: 'Quellen ({count})' }} />);
    expect(screen.getByRole('button', { name: 'Quellen (2)' })).toBeInTheDocument();
  });

  it('renders an href with an unsafe protocol as a button, not a link', () => {
    render(
      <Sources count={2} defaultOpen>
        <SourcesList>
          <SourceItem index={1} title="Bad" href="javascript:alert(1)" />
          <SourceItem index={2} title="Relative" href="/docs/policy" />
        </SourcesList>
      </Sources>
    );
    expect(screen.queryByRole('link', { name: /Bad/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bad/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Relative/ })).toHaveAttribute('href', '/docs/policy');
  });

  it('renders a link when href is set and a button otherwise', () => {
    render(<Example defaultOpen />);
    const link = screen.getByRole('link', { name: /Invoice policy/ });
    expect(link).toHaveAttribute('href', 'https://policies.example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent(DEFAULT_SOURCES_STRINGS.opensInNewTab);
    expect(screen.getByRole('button', { name: /Q3 report\.pdf/ })).toHaveAttribute(
      'type',
      'button'
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('calls onSelect with the source and lets the host cancel navigation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn((_source, event: React.MouseEvent) => event.preventDefault());
    render(
      <Sources count={1} defaultOpen>
        <SourcesList>
          <SourceItem index={1} title="Doc" href="https://example.com" onSelect={onSelect} />
        </SourcesList>
      </Sources>
    );
    await user.click(screen.getByRole('link', { name: /Doc/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual({
      index: 1,
      title: 'Doc',
      source: undefined,
      snippet: undefined,
      href: 'https://example.com',
    });
    expect(onSelect.mock.calls[0][1].defaultPrevented).toBe(true);
  });

  it('has no accessibility violations collapsed or expanded', async () => {
    const { container, rerender } = render(<Example />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Example open />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
