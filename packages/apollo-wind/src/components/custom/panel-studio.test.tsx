import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { StudioPanel, StudioPanelSelection } from './panel-studio';

describe('StudioPanel', () => {
  it('renders children with the default width', () => {
    render(
      <StudioPanel side="left">
        <p>Panel content</p>
      </StudioPanel>
    );
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '340');
  });

  it('applies the inner-edge border per side', () => {
    const { container: left } = render(<StudioPanel side="left">content</StudioPanel>);
    expect(left.firstElementChild).toHaveClass('border-r');

    const { container: right } = render(<StudioPanel side="right">content</StudioPanel>);
    expect(right.firstElementChild).toHaveClass('border-l');
  });

  it('resizes with arrow keys on the separator', () => {
    render(<StudioPanel side="left">content</StudioPanel>);
    const separator = screen.getByRole('separator');

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(separator).toHaveAttribute('aria-valuenow', '350');

    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    expect(separator).toHaveAttribute('aria-valuenow', '340');
  });

  it('clamps keyboard resizing to the maximum width', () => {
    render(<StudioPanel side="left">content</StudioPanel>);
    const separator = screen.getByRole('separator');

    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(separator, { key: 'ArrowRight' });
    }
    expect(separator).toHaveAttribute('aria-valuenow', '460');
  });
});

describe('StudioPanelSelection', () => {
  it('renders five icon buttons', () => {
    render(<StudioPanelSelection side="left" onIconClick={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('fires onIconClick with the clicked index', async () => {
    const user = userEvent.setup();
    const onIconClick = vi.fn();
    render(<StudioPanelSelection side="left" onIconClick={onIconClick} />);

    await user.click(screen.getByRole('button', { name: 'Panel view 3' }));
    expect(onIconClick).toHaveBeenCalledTimes(1);
    expect(onIconClick).toHaveBeenCalledWith(2);
  });

  it('marks the active icon with aria-pressed', () => {
    render(<StudioPanelSelection side="left" onIconClick={() => {}} activeIndex={1} />);
    expect(screen.getByRole('button', { name: 'Panel view 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Panel view 1' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <StudioPanelSelection side="left" onIconClick={() => {}} activeIndex={0} />
        <StudioPanel side="left">
          <p>Accessible panel</p>
        </StudioPanel>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
