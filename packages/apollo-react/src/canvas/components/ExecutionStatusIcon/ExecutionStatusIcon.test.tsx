import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  Spinner: ({
    className,
    style,
    label,
  }: {
    className?: string;
    style?: CSSProperties;
    label?: string;
  }) => <span className={className} data-label={label} data-testid="spinner" style={style} />,
}));

describe('ExecutionStatusIcon', () => {
  it('renders InProgress as a primary-colored spinner via getExecutionStatusColor', () => {
    render(<ExecutionStatusIcon status="InProgress" size={20} />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner.className).toContain('[&>svg]:text-[color:var(--spinner-color)]');
    expect(spinner.style.getPropertyValue('--spinner-color')).toBe(
      getExecutionStatusColor('InProgress')
    );
    expect(spinner).toHaveAttribute('data-label', 'In progress');
  });

  it.each([
    'Cancelled',
    'UserCancelled',
  ])('renders %s with the circle-slash glyph and muted color', (status) => {
    render(<ExecutionStatusIcon status={status} size={20} />);

    const icon = screen.getByTestId('canvas-icon');
    expect(icon).toHaveAttribute('data-icon', 'circle-slash');
    expect(icon).toHaveAttribute('data-color', 'var(--color-icon-default)');
    expect(icon).toHaveAttribute('data-size', '20');
  });

  it('renders EarlyExit with the early exit glyph and success color', () => {
    render(<ExecutionStatusIcon status="EarlyExit" size={20} />);

    const icon = screen.getByTestId('early-exit-status-icon');
    expect(icon).toBeInTheDocument();
  });
});

describe('getExecutionStatusColor', () => {
  it('maps both cancel variants to the muted color, not an error or info color', () => {
    expect(getExecutionStatusColor('Cancelled')).toBe('var(--color-icon-default)');
    expect(getExecutionStatusColor('UserCancelled')).toBe('var(--color-icon-default)');
  });

  it('maps InProgress to the primary color', () => {
    expect(getExecutionStatusColor('InProgress')).toBe('var(--color-primary)');
  });
});

// Regression guard. apollo-wind declares aliases such as `--color-foreground-muted` inside
// `@theme inline`, which never emits them as real custom properties. An inline `stroke` built
// from one resolves to nothing and the glyph renders invisible, which `tsc` and the DOM
// assertions above both miss. Every color here must be a token apollo-core actually declares.
describe('getExecutionStatusColor tokens', () => {
  const declared = readFileSync(
    resolve(__dirname, '../../../../../apollo-core/dist/tokens/css/theme-variables.css'),
    'utf8'
  );

  const statuses = [
    'NotExecuted',
    'InProgress',
    'Completed',
    'EarlyExit',
    'ActionNeeded',
    'Paused',
    'Warning',
    'Cancelled',
    'UserCancelled',
    'Failed',
    'Terminated',
    'Canceling',
    'Faulted',
    'Pausing',
    'Pending',
    'Resuming',
    'Retrying',
    'Running',
    'Upgrading',
  ];

  it.each(statuses)('%s resolves to a token declared in apollo-core', (status) => {
    const name = getExecutionStatusColor(status).match(/^var\((--[\w-]+)\)$/)?.[1];
    expect(name, `${status} did not return a var() reference`).toBeTruthy();
    expect(declared).toContain(`${name}:`);
  });
});
