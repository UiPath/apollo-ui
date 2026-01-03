import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders without crashing', () => {
    const { container } = render(<Progress value={50} aria-label="Progress" />);
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Progress value={50} aria-label="Loading progress" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders progressbar role', () => {
    render(<Progress value={0} aria-label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('handles 50% progress value', () => {
    render(<Progress value={50} aria-label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('handles 100% progress value', () => {
    render(<Progress value={100} aria-label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('rerenders correctly with new value', () => {
    const { rerender } = render(<Progress value={25} aria-label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();

    rerender(<Progress value={75} aria-label="Progress" />);
    expect(progressbar).toBeInTheDocument();
  });

  it('handles undefined value', () => {
    render(<Progress aria-label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Progress value={50} className="custom-class" aria-label="Progress" />
    );
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Progress ref={ref} value={50} aria-label="Progress" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has proper ARIA label', () => {
    render(<Progress value={60} aria-label="Upload progress" />);
    const progressbar = screen.getByRole('progressbar', {
      name: 'Upload progress',
    });
    expect(progressbar).toBeInTheDocument();
  });

  it('renders with rounded-full class', () => {
    const { container } = render(<Progress value={50} aria-label="Progress" />);
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveClass('rounded-full');
  });

  it('renders with overflow-hidden class', () => {
    const { container } = render(<Progress value={50} aria-label="Progress" />);
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveClass('overflow-hidden');
  });

  it('renders with bg-secondary class', () => {
    const { container } = render(<Progress value={50} aria-label="Progress" />);
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveClass('bg-secondary');
  });
});
