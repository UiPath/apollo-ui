import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { MaestroPanel } from './panel-maestro';

describe('MaestroPanel', () => {
  it('renders children when expanded', () => {
    render(
      <MaestroPanel side="left">
        <p>Panel content</p>
      </MaestroPanel>
    );
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse panel' })).toBeInTheDocument();
  });

  it('hides children when collapsed and offers an expand button', () => {
    render(
      <MaestroPanel side="left" isCollapsed>
        <p>Panel content</p>
      </MaestroPanel>
    );
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand panel' })).toBeInTheDocument();
  });

  it('fires onToggle when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MaestroPanel side="left" onToggle={onToggle}>
        content
      </MaestroPanel>
    );
    await user.click(screen.getByRole('button', { name: 'Collapse panel' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies a right border for the left side and a left border for the right side', () => {
    const { container: left } = render(<MaestroPanel side="left">content</MaestroPanel>);
    expect(left.firstElementChild).toHaveClass('border-r');

    const { container: right } = render(<MaestroPanel side="right">content</MaestroPanel>);
    expect(right.firstElementChild).toHaveClass('border-l');
  });

  it('applies the expanded and collapsed width classes', () => {
    const { container: expanded } = render(<MaestroPanel side="left">content</MaestroPanel>);
    expect(expanded.firstElementChild).toHaveClass('w-[300px]');

    const { container: collapsed } = render(
      <MaestroPanel side="left" isCollapsed>
        content
      </MaestroPanel>
    );
    expect(collapsed.firstElementChild).toHaveClass('w-8');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MaestroPanel side="left">
        <p>Accessible panel</p>
      </MaestroPanel>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
