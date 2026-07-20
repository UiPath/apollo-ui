import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ElementStatusValues } from '../../types/execution';
import type { LoopNodeExecutionCountState } from './LoopNode.types';
import { getIterationStatusColor, LoopNodeExecutionCount } from './LoopNodeExecutionCount';

vi.mock('../../utils/icon-registry', () => ({
  CanvasIcon: ({ icon }: { icon: string }) => <span data-testid={`canvas-icon-${icon}`} />,
}));

function buildState(
  overrides: Partial<LoopNodeExecutionCountState> = {}
): LoopNodeExecutionCountState {
  return {
    activeIndex: 1,
    total: 5,
    onActiveIndexChange: vi.fn(),
    disabled: false,
    isAll: false,
    onAllChange: vi.fn(),
    ...overrides,
  };
}

function renderPill(
  stateOverrides: Partial<LoopNodeExecutionCountState> = {},
  size: 'full' | 'compact' | 'minimal' = 'full'
) {
  const state = buildState(stateOverrides);
  render(<LoopNodeExecutionCount state={state} size={size} />);
  return {
    onActiveIndexChange: state.onActiveIndexChange as ReturnType<typeof vi.fn>,
    onAllChange: state.onAllChange as ReturnType<typeof vi.fn>,
  };
}

// ─── getIterationStatusColor ──────────────────────────────────────────────────

describe('getIterationStatusColor', () => {
  it.each([
    ['Completed', '#22c55e'],
    ['Failed', '#ef4444'],
    ['InProgress', '#f59e0b'],
    ['Paused', '#a855f7'],
    ['Cancelled', '#94a3b8'],
    [undefined, 'currentColor'],
    ['Unknown', 'currentColor'],
  ])('returns correct color for status %s', (status, expected) => {
    expect(getIterationStatusColor(status as ElementStatusValues | undefined)).toBe(expected);
  });
});

// ─── Full tier — prev / next ──────────────────────────────────────────────────

describe('LoopNodeExecutionCount (full tier)', () => {
  it('displays the visible index and total', () => {
    renderPill({ activeIndex: 2, total: 7 });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('fires onActiveIndexChange with the previous index on prev click', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 2, total: 5 });

    await user.click(screen.getByRole('button', { name: 'Previous iteration' }));

    expect(onActiveIndexChange).toHaveBeenCalledOnce();
    expect(onActiveIndexChange).toHaveBeenCalledWith(1);
  });

  it('fires onActiveIndexChange with the next index on next click', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 2, total: 5 });

    await user.click(screen.getByRole('button', { name: 'Next iteration' }));

    expect(onActiveIndexChange).toHaveBeenCalledOnce();
    expect(onActiveIndexChange).toHaveBeenCalledWith(3);
  });

  it('disables prev at the first iteration', () => {
    renderPill({ activeIndex: 0, total: 5 });

    expect(screen.getByRole('button', { name: 'Previous iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next iteration' })).not.toBeDisabled();
  });

  it('disables next at the last iteration', () => {
    renderPill({ activeIndex: 4, total: 5 });

    expect(screen.getByRole('button', { name: 'Previous iteration' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next iteration' })).toBeDisabled();
  });

  it('disables both nav buttons when disabled prop is true', () => {
    renderPill({ activeIndex: 2, total: 5, disabled: true });

    expect(screen.getByRole('button', { name: 'Previous iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next iteration' })).toBeDisabled();
  });

  it('disables both nav buttons when onActiveIndexChange is omitted', () => {
    renderPill({ activeIndex: 2, total: 5, onActiveIndexChange: undefined });

    expect(screen.getByRole('button', { name: 'Previous iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next iteration' })).toBeDisabled();
  });
});

// ─── All toggle ───────────────────────────────────────────────────────────────

describe('All toggle', () => {
  it('calls onAllChange(true) when isAll is false and All is clicked', async () => {
    const user = userEvent.setup();
    const { onAllChange } = renderPill({ isAll: false });

    await user.click(screen.getByRole('button', { name: 'Show aggregate across all iterations' }));

    expect(onAllChange).toHaveBeenCalledOnce();
    expect(onAllChange).toHaveBeenCalledWith(true);
  });

  it('calls onAllChange(false) when isAll is true and All is clicked', async () => {
    const user = userEvent.setup();
    const { onAllChange } = renderPill({ isAll: true });

    await user.click(screen.getByRole('button', { name: 'Show aggregate across all iterations' }));

    expect(onAllChange).toHaveBeenCalledOnce();
    expect(onAllChange).toHaveBeenCalledWith(false);
  });

  it('shows aggregate Σ + total when isAll is true and no iterationStatuses', () => {
    renderPill({ isAll: true, total: 8 });

    expect(screen.getByText('Σ')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('shows completed and failed counts when isAll is true and iterationStatuses provided', () => {
    renderPill({
      isAll: true,
      iterationStatuses: new Map([
        [0, 'Completed'],
        [1, 'Completed'],
        [2, 'Failed'],
        [3, 'Completed'],
      ]),
    });

    expect(screen.getByText(/✓ 3/)).toBeInTheDocument();
    expect(screen.getByText(/✗ 1/)).toBeInTheDocument();
  });

  it('hides nav buttons when isAll is true', () => {
    renderPill({ isAll: true });

    expect(screen.queryByRole('button', { name: 'Previous iteration' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next iteration' })).not.toBeInTheDocument();
  });
});

// ─── Inline edit ──────────────────────────────────────────────────────────────

describe('inline edit', () => {
  it('opens input when fraction is clicked', async () => {
    const user = userEvent.setup();
    renderPill({ activeIndex: 1, total: 5 });

    await user.click(screen.getByTitle('Click to jump to a specific iteration'));

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('commits on Enter and calls onActiveIndexChange with the correct 0-based index', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 1, total: 5 });

    await user.click(screen.getByTitle('Click to jump to a specific iteration'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '4');
    await user.keyboard('{Enter}');

    expect(onActiveIndexChange).toHaveBeenCalledWith(3);
  });

  it('cancels on Escape without firing onActiveIndexChange', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 1, total: 5 });

    await user.click(screen.getByTitle('Click to jump to a specific iteration'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '4');
    await user.keyboard('{Escape}');

    expect(onActiveIndexChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('clamps values above total to total', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 0, total: 5 });

    await user.click(screen.getByTitle('Click to jump to a specific iteration'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '99');
    await user.keyboard('{Enter}');

    expect(onActiveIndexChange).toHaveBeenCalledWith(4);
  });

  it('clamps values below 1 to 1 (index 0)', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ activeIndex: 2, total: 5 });

    await user.click(screen.getByTitle('Click to jump to a specific iteration'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '-5');
    await user.keyboard('{Enter}');

    expect(onActiveIndexChange).toHaveBeenCalledWith(0);
  });

  it('does not open input when disabled', () => {
    renderPill({ disabled: true });

    const fraction = screen.queryByTitle('Click to jump to a specific iteration');
    expect(fraction).not.toBeInTheDocument();
  });

  it('does not open input when isAll is active', () => {
    renderPill({ isAll: true });

    // In All mode the fraction span is replaced by aggregate content, no edit title
    expect(screen.queryByTitle('Click to jump to a specific iteration')).not.toBeInTheDocument();
  });
});

// ─── Jump to failed ───────────────────────────────────────────────────────────

describe('jump to failed', () => {
  const failedStatuses = new Map<number, ElementStatusValues>([
    [0, ElementStatusValues.Completed],
    [1, ElementStatusValues.Failed],
    [2, ElementStatusValues.Completed],
  ]);

  it('renders jump-to-failed button when a failed iteration exists', () => {
    renderPill({ iterationStatuses: failedStatuses });

    expect(
      screen.getByRole('button', { name: 'Jump to first failed iteration' })
    ).toBeInTheDocument();
  });

  it('calls onActiveIndexChange with the first failed index on click', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderPill({ iterationStatuses: failedStatuses });

    await user.click(screen.getByRole('button', { name: 'Jump to first failed iteration' }));

    expect(onActiveIndexChange).toHaveBeenCalledWith(1);
  });

  it('hides jump-to-failed when isAll is true', () => {
    renderPill({ iterationStatuses: failedStatuses, isAll: true });

    expect(
      screen.queryByRole('button', { name: 'Jump to first failed iteration' })
    ).not.toBeInTheDocument();
  });

  it('shows jump-to-failed even when overall loop has failed', () => {
    renderPill({ iterationStatuses: failedStatuses });

    expect(
      screen.getByRole('button', { name: 'Jump to first failed iteration' })
    ).toBeInTheDocument();
  });

  it('hides jump-to-failed when no iterations have failed', () => {
    renderPill({
      iterationStatuses: new Map([
        [0, 'Completed'],
        [1, 'Completed'],
      ]),
    });

    expect(
      screen.queryByRole('button', { name: 'Jump to first failed iteration' })
    ).not.toBeInTheDocument();
  });

  it('hides jump-to-failed when disabled', () => {
    renderPill({ iterationStatuses: failedStatuses, disabled: true });

    expect(
      screen.queryByRole('button', { name: 'Jump to first failed iteration' })
    ).not.toBeInTheDocument();
  });
});

// ─── Compact tier ─────────────────────────────────────────────────────────────

describe('compact tier', () => {
  it('does not render prev/next buttons', () => {
    renderPill({ activeIndex: 2, total: 5 }, 'compact');

    expect(screen.queryByRole('button', { name: 'Previous iteration' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next iteration' })).not.toBeInTheDocument();
  });

  it('still renders the All toggle', () => {
    renderPill({}, 'compact');

    expect(
      screen.getByRole('button', { name: 'Show aggregate across all iterations' })
    ).toBeInTheDocument();
  });
});

// ─── Minimal tier ─────────────────────────────────────────────────────────────

describe('minimal tier', () => {
  it('shows index / total without nav buttons', () => {
    renderPill({ activeIndex: 2, total: 6 }, 'minimal');

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous iteration' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next iteration' })).not.toBeInTheDocument();
  });

  it('shows Σ + total when isAll and no iterationStatuses', () => {
    renderPill({ isAll: true, total: 10 }, 'minimal');

    expect(screen.getByText('Σ')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows completed and failed counts when isAll and iterationStatuses provided', () => {
    renderPill(
      {
        isAll: true,
        iterationStatuses: new Map([
          [0, 'Completed'],
          [1, 'Failed'],
        ]),
      },
      'minimal'
    );

    expect(screen.getByText(/✓1/)).toBeInTheDocument();
    expect(screen.getByText(/✗1/)).toBeInTheDocument();
  });
});
