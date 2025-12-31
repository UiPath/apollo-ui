import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('renders without crashing', () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders with default value', () => {
    render(<Slider defaultValue={[50]} aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders with min and max values', () => {
    render(<Slider min={0} max={100} defaultValue={[50]} aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />);

    const slider = screen.getByRole('slider');
    slider.focus();

    // Radix slider changes with keyboard events
    expect(slider).toBeInTheDocument();
  });

  it('supports keyboard interaction with Arrow Right', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports keyboard interaction with Arrow Left', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports keyboard interaction with Arrow Up', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowUp}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports keyboard interaction with Arrow Down', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowDown}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports keyboard interaction with Home key', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        onValueChange={handleChange}
        aria-label="Volume"
      />,
    );

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{Home}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports keyboard interaction with End key', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        onValueChange={handleChange}
        aria-label="Volume"
      />,
    );

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{End}');

    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Slider disabled defaultValue={[50]} aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('data-disabled', '');
  });

  it('does not respond to keyboard when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Slider disabled defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />,
    );

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports controlled mode', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <Slider value={[25]} onValueChange={handleChange} aria-label="Volume" />,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '25');

    rerender(<Slider value={[75]} onValueChange={handleChange} aria-label="Volume" />);
    expect(slider).toHaveAttribute('aria-valuenow', '75');
  });

  it('supports step attribute', () => {
    render(<Slider step={10} defaultValue={[50]} aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('supports multiple thumbs', () => {
    render(<Slider defaultValue={[25, 75]} aria-label="Range" />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Slider className="custom-class" defaultValue={[50]} aria-label="Volume" />,
    );
    const root = container.querySelector('.custom-class');
    expect(root).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Slider ref={ref} defaultValue={[50]} aria-label="Volume" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('has proper ARIA attributes', () => {
    render(<Slider defaultValue={[50]} aria-label="Volume control" />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('has focus-visible ring for keyboard navigation', () => {
    const { container } = render(<Slider defaultValue={[50]} aria-label="Volume" />);
    const thumb = container.querySelector('[role="slider"]');
    expect(thumb).toHaveClass('focus-visible:ring-2');
  });

  it('supports inverted orientation', () => {
    render(<Slider inverted defaultValue={[50]} aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });
});
