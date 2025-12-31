import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

describe('ToggleGroup', () => {
  const ToggleGroupExample = ({ type = 'single' as const, onValueChange = vi.fn() }) => (
    <ToggleGroup type={type} onValueChange={onValueChange} aria-label="Text formatting">
      <ToggleGroupItem value="bold" aria-label="Bold">
        Bold
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        Italic
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        Underline
      </ToggleGroupItem>
    </ToggleGroup>
  );

  it('renders without crashing', () => {
    const { container } = render(<ToggleGroupExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ToggleGroupExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all toggle items', () => {
    render(<ToggleGroupExample />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Underline')).toBeInTheDocument();
  });

  it('selects item when clicked in single mode', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<ToggleGroupExample type="single" onValueChange={handleValueChange} />);

    const boldToggle = screen.getByLabelText('Bold');
    await user.click(boldToggle);

    expect(handleValueChange).toHaveBeenCalledWith('bold');
    expect(boldToggle).toHaveAttribute('data-state', 'on');
  });

  it('only allows one selection at a time in single mode', async () => {
    const user = userEvent.setup();
    render(<ToggleGroupExample type="single" />);

    const boldToggle = screen.getByLabelText('Bold');
    const italicToggle = screen.getByLabelText('Italic');

    await user.click(boldToggle);
    expect(boldToggle).toHaveAttribute('data-state', 'on');

    await user.click(italicToggle);
    expect(italicToggle).toHaveAttribute('data-state', 'on');
    expect(boldToggle).toHaveAttribute('data-state', 'off');
  });

  it('allows multiple selections in multiple mode', async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldToggle = screen.getByLabelText('Bold');
    const italicToggle = screen.getByLabelText('Italic');

    await user.click(boldToggle);
    await user.click(italicToggle);

    expect(boldToggle).toHaveAttribute('data-state', 'on');
    expect(italicToggle).toHaveAttribute('data-state', 'on');
  });

  it('supports keyboard navigation with Arrow Right', async () => {
    const user = userEvent.setup();
    render(<ToggleGroupExample />);

    const boldToggle = screen.getByLabelText('Bold');
    await user.click(boldToggle);
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      const italicToggle = screen.getByLabelText('Italic');
      expect(italicToggle).toHaveFocus();
    });
  });

  it('supports keyboard navigation with Arrow Left', async () => {
    const user = userEvent.setup();
    render(<ToggleGroupExample />);

    const italicToggle = screen.getByLabelText('Italic');
    await user.click(italicToggle);
    await user.keyboard('{ArrowLeft}');

    await waitFor(() => {
      const boldToggle = screen.getByLabelText('Bold');
      expect(boldToggle).toHaveFocus();
    });
  });

  it('can disable entire group', () => {
    render(
      <ToggleGroup type="single" disabled aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const toggle = screen.getByLabelText('Bold');
    expect(toggle).toBeDisabled();
  });

  it('can disable individual items', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <ToggleGroup type="single" onValueChange={handleValueChange} aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold" disabled>
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldToggle = screen.getByLabelText('Bold');
    await user.click(boldToggle);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(boldToggle).toBeDisabled();
  });

  it('supports default value in single mode', () => {
    render(
      <ToggleGroup type="single" defaultValue="italic" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const italicToggle = screen.getByLabelText('Italic');
    expect(italicToggle).toHaveAttribute('data-state', 'on');
  });

  it('supports default value in multiple mode', () => {
    render(
      <ToggleGroup type="multiple" defaultValue={['bold', 'italic']} aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldToggle = screen.getByLabelText('Bold');
    const italicToggle = screen.getByLabelText('Italic');
    expect(boldToggle).toHaveAttribute('data-state', 'on');
    expect(italicToggle).toHaveAttribute('data-state', 'on');
  });

  it('applies variant to all items', () => {
    render(
      <ToggleGroup type="single" variant="outline" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const toggle = screen.getByLabelText('Bold');
    expect(toggle).toHaveClass('border');
  });

  it('applies size to all items', () => {
    render(
      <ToggleGroup type="single" size="sm" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const toggle = screen.getByLabelText('Bold');
    expect(toggle).toHaveClass('h-9');
  });

  it('supports controlled mode in single type', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <ToggleGroup
        type="single"
        value="bold"
        onValueChange={handleValueChange}
        aria-label="Text formatting"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldToggle = screen.getByLabelText('Bold');
    expect(boldToggle).toHaveAttribute('data-state', 'on');

    const italicToggle = screen.getByLabelText('Italic');
    await user.click(italicToggle);
    expect(handleValueChange).toHaveBeenCalledWith('italic');

    rerender(
      <ToggleGroup
        type="single"
        value="italic"
        onValueChange={handleValueChange}
        aria-label="Text formatting"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(italicToggle).toHaveAttribute('data-state', 'on');
  });

  it('applies custom className to ToggleGroup', () => {
    const { container } = render(
      <ToggleGroup type="single" className="custom-group" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(container.firstChild).toHaveClass('custom-group');
  });

  it('applies custom className to ToggleGroupItem', () => {
    render(
      <ToggleGroup type="single" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold" className="custom-item">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const toggle = screen.getByLabelText('Bold');
    expect(toggle).toHaveClass('custom-item');
  });

  it('forwards ref correctly to ToggleGroup', () => {
    const ref = { current: null };
    render(
      <ToggleGroup ref={ref} type="single" aria-label="Text formatting">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref correctly to ToggleGroupItem', () => {
    const ref = { current: null };
    render(
      <ToggleGroup type="single" aria-label="Text formatting">
        <ToggleGroupItem ref={ref} value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
