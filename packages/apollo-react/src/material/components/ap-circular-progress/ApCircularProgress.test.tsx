import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApCircularProgress } from './ApCircularProgress';

describe('ApCircularProgress', () => {
  it('renders without crashing', () => {
    render(<ApCircularProgress />);
    expect(screen.getByTestId('ap-circular-progress')).toBeInTheDocument();
  });

  it('applies default size of 64', () => {
    render(<ApCircularProgress />);
    const wrapper = screen.getByTestId('ap-circular-progress');
    expect(wrapper).toHaveAttribute('data-size', '64');
  });

  it('applies custom size', () => {
    const { rerender } = render(<ApCircularProgress size={100} />);
    let wrapper = screen.getByTestId('ap-circular-progress');
    expect(wrapper).toHaveAttribute('data-size', '100');

    rerender(<ApCircularProgress size={50} />);
    wrapper = screen.getByTestId('ap-circular-progress');
    expect(wrapper).toHaveAttribute('data-size', '50');
  });

  it('applies default color', () => {
    render(<ApCircularProgress />);
    const ring = screen.getByTestId('ap-circular-progress-ring');
    expect(ring).toHaveAttribute('data-color', 'var(--color-primary)');
  });

  it('applies custom color', () => {
    const { rerender } = render(<ApCircularProgress color="red" />);
    let ring = screen.getByTestId('ap-circular-progress-ring');
    expect(ring).toHaveAttribute('data-color', 'red');

    rerender(<ApCircularProgress color="var(--color-success)" />);
    ring = screen.getByTestId('ap-circular-progress-ring');
    expect(ring).toHaveAttribute('data-color', 'var(--color-success)');
  });

  it('renders 4 ring elements', () => {
    render(<ApCircularProgress />);
    const ring = screen.getByTestId('ap-circular-progress-ring');
    expect(ring.children.length).toBe(4);
  });

  it('applies both custom size and color', () => {
    render(<ApCircularProgress size={80} color="blue" />);
    const wrapper = screen.getByTestId('ap-circular-progress');
    const ring = screen.getByTestId('ap-circular-progress-ring');

    expect(wrapper).toHaveAttribute('data-size', '80');
    expect(ring).toHaveAttribute('data-color', 'blue');
  });

  it('applies custom style prop', () => {
    render(<ApCircularProgress style={{ backgroundColor: 'transparent' }} />);
    const wrapper = screen.getByTestId('ap-circular-progress');
    expect(wrapper).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('applies multiple style properties', () => {
    render(<ApCircularProgress style={{ backgroundColor: 'red', opacity: 0.5 }} />);
    const wrapper = screen.getByTestId('ap-circular-progress');
    expect(wrapper).toHaveStyle({ backgroundColor: 'red', opacity: 0.5 });
  });
});
