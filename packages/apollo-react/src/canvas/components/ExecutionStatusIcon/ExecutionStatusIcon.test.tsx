import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExecutionStatusIcon, getExecutionStatusColor } from './ExecutionStatusIcon';

vi.mock('../../utils/icon-registry', () => ({
  CanvasIcon: ({ icon, color, size }: { icon: string; color?: string; size?: number }) => (
    <span data-color={color} data-icon={icon} data-size={size} data-testid="canvas-icon" />
  ),
}));

vi.mock('@uipath/apollo-wind', () => ({
  Spinner: ({ className, style }: { className?: string; style?: CSSProperties }) => (
    <span className={className} data-testid="spinner" style={style} />
  ),
}));

describe('ExecutionStatusIcon', () => {
  it('renders InProgress as an info-colored spinner', () => {
    render(<ExecutionStatusIcon status="InProgress" size={20} />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner.className).toContain('[&>svg]:text-[color:var(--color-info-icon)]');
  });

  it('renders UserCancelled with the cancelled glyph and info color', () => {
    render(<ExecutionStatusIcon status="UserCancelled" size={20} />);

    const icon = screen.getByTestId('canvas-icon');
    expect(icon).toHaveAttribute('data-icon', 'circle-stop');
    expect(icon).toHaveAttribute('data-color', 'var(--color-info-icon)');
    expect(icon).toHaveAttribute('data-size', '20');
  });
});

describe('getExecutionStatusColor', () => {
  it('keeps UserCancelled aligned with info-colored execution states', () => {
    expect(getExecutionStatusColor('UserCancelled')).toBe('var(--color-info-icon)');
  });
});
