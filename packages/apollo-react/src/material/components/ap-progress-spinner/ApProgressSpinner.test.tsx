import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApProgressSpinner } from './ApProgressSpinner';

describe('ApProgressSpinner', () => {
  it('renders without crashing', () => {
    render(<ApProgressSpinner />);
    expect(screen.getByTestId('ap-progress-spinner')).toBeInTheDocument();
  });

  it('applies default size of m', () => {
    render(<ApProgressSpinner />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'm');
  });

  it('applies xs size', () => {
    render(<ApProgressSpinner size="xs" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'xs');
  });

  it('applies s size', () => {
    render(<ApProgressSpinner size="s" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 's');
  });

  it('applies l size', () => {
    render(<ApProgressSpinner size="l" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'l');
  });

  it('applies xl size', () => {
    render(<ApProgressSpinner size="xl" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'xl');
  });

  it('applies xxl size', () => {
    render(<ApProgressSpinner size="xxl" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'xxl');
  });

  it('applies default color primary', () => {
    render(<ApProgressSpinner />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveClass('MuiCircularProgress-colorPrimary');
  });

  it('applies secondary color', () => {
    render(<ApProgressSpinner color="secondary" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveClass('MuiCircularProgress-colorSecondary');
  });

  it('applies default aria-label', () => {
    render(<ApProgressSpinner />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies custom aria-label', () => {
    render(<ApProgressSpinner aria-label="Processing data" />);
    const spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Processing data');
  });

  it('renders with different size and color combinations', () => {
    const { rerender } = render(<ApProgressSpinner size="xs" color="primary" />);
    let spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'xs');
    expect(spinner).toHaveClass('MuiCircularProgress-colorPrimary');

    rerender(<ApProgressSpinner size="xxl" color="secondary" />);
    spinner = screen.getByTestId('ap-progress-spinner');
    expect(spinner).toHaveAttribute('data-size', 'xxl');
    expect(spinner).toHaveClass('MuiCircularProgress-colorSecondary');
  });
});
