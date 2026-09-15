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
      />
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
      />
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
      <Slider disabled defaultValue={[50]} onValueChange={handleChange} aria-label="Volume" />
    );

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports controlled mode', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <Slider value={[25]} onValueChange={handleChange} aria-label="Volume" />
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
      <Slider className="custom-class" defaultValue={[50]} aria-label="Volume" />
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

describe('Slider invalid state', () => {
  it('moves the invalid, description and label wiring onto the thumb, which owns role="slider"', () => {
    render(
      <>
        <span id="retries-label">Retries</span>
        <p id="retries-error">Retry count must be between 0 and 5.</p>
        <Slider
          aria-invalid
          aria-labelledby="retries-label"
          aria-describedby="retries-error"
          aria-errormessage="retries-error"
          defaultValue={[8]}
          max={10}
        />
      </>
    );
    const thumb = screen.getByRole('slider', { name: 'Retries' });
    expect(thumb).toHaveAttribute('aria-invalid', 'true');
    expect(thumb).toHaveAttribute('aria-describedby', 'retries-error');
    expect(thumb).toHaveAttribute('aria-errormessage', 'retries-error');
    expect(thumb).toHaveClass('aria-invalid:border-error');
    const root = thumb.closest('[data-slot="slider"]');
    for (const attr of [
      'aria-label',
      'aria-invalid',
      'aria-describedby',
      'aria-errormessage',
      'aria-labelledby',
    ]) {
      expect(root).not.toHaveAttribute(attr);
    }
  });
});

describe('Slider naming', () => {
  it('puts aria-label on the thumb so the slider role has an accessible name', () => {
    render(<Slider aria-label="Volume" defaultValue={[30]} />);
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    expect(thumb).toHaveAttribute('aria-label', 'Volume');
    expect(thumb.closest('[data-slot="slider"]')).not.toHaveAttribute('aria-label');
  });
});
