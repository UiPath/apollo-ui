import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IterationNavigator } from './IterationNavigator';
import type { LoopIterationState } from './LoopNode.types';

function renderNavigator(iterationState: Partial<LoopIterationState> = {}) {
  const onActiveIndexChange = vi.fn();

  render(
    <IterationNavigator
      iterationState={{
        activeIndex: 1,
        total: 3,
        onActiveIndexChange,
        ...iterationState,
      }}
    />
  );

  return { onActiveIndexChange };
}

describe('IterationNavigator', () => {
  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('does not render for %s total', (_caseName, total) => {
    renderNavigator({ total });

    expect(screen.queryByTestId('loop-iteration-navigator')).not.toBeInTheDocument();
  });

  it('clamps activeIndex before displaying and computing callbacks', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderNavigator({ activeIndex: 99, total: 3 });

    expect(screen.getByTestId('loop-iteration-label')).toHaveTextContent('3 / 3');
    expect(screen.getByRole('button', { name: 'Next loop iteration' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous loop iteration' }));

    expect(onActiveIndexChange).toHaveBeenCalledOnce();
    expect(onActiveIndexChange).toHaveBeenCalledWith(1);
  });

  it('fires previous and next callbacks with the adjacent index', async () => {
    const user = userEvent.setup();
    const { onActiveIndexChange } = renderNavigator({ activeIndex: 1, total: 3 });

    await user.click(screen.getByRole('button', { name: 'Previous loop iteration' }));
    await user.click(screen.getByRole('button', { name: 'Next loop iteration' }));

    expect(onActiveIndexChange).toHaveBeenNthCalledWith(1, 0);
    expect(onActiveIndexChange).toHaveBeenNthCalledWith(2, 2);
  });

  it('disables previous and next at iteration boundaries', () => {
    const { rerender } = render(
      <IterationNavigator
        iterationState={{
          activeIndex: 0,
          total: 3,
          onActiveIndexChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous loop iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next loop iteration' })).not.toBeDisabled();

    rerender(
      <IterationNavigator
        iterationState={{
          activeIndex: 2,
          total: 3,
          onActiveIndexChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous loop iteration' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next loop iteration' })).toBeDisabled();
  });

  it('renders as label-only when onActiveIndexChange is omitted', () => {
    renderNavigator({ onActiveIndexChange: undefined });

    expect(screen.getByTestId('loop-iteration-label')).toHaveTextContent('2 / 3');
    expect(screen.getByRole('button', { name: 'Previous loop iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next loop iteration' })).toBeDisabled();
  });

  it('disables navigation when disabled', () => {
    renderNavigator({ disabled: true });

    expect(screen.getByRole('button', { name: 'Previous loop iteration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next loop iteration' })).toBeDisabled();
  });
});
