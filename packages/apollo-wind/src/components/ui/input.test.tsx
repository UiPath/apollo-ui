import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';
import { Label } from './label';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText(/type here/i);

    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

    rerender(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('accepts custom className', () => {
    render(<Input className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('renders inline validation and associates it with the input', () => {
    render(<Input id="node-name" error="Enter a unique name before saving." />);
    const input = screen.getByRole('textbox');
    const message = screen.getByText('Enter a unique name before saving.');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'node-name-error');
    expect(input).toHaveAttribute('aria-errormessage', 'node-name-error');
    expect(message).toHaveAttribute('id', 'node-name-error');
    expect(message).toHaveTextContent('Enter a unique name before saving.');
    expect(message).toHaveClass('text-xs', 'leading-4', 'text-error');
  });

  it('preserves existing descriptions when rendering inline validation', () => {
    render(
      <>
        <p id="name-help">Use a unique node name.</p>
        <Input id="node-name" aria-describedby="name-help" error="Name is already in use." />
      </>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'name-help node-name-error'
    );
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies ghost variant classes', () => {
    render(<Input variant="ghost" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-surface-overlay');
    expect(input).not.toHaveClass('border-input');
  });

  it('applies xs size classes', () => {
    render(<Input size="xs" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-6', 'text-xs', 'rounded');
  });

  it('applies ghost variant and xs size together', () => {
    render(<Input variant="ghost" size="xs" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-6', 'text-xs', 'rounded', 'bg-surface-overlay');
    expect(input).not.toHaveClass('border-input');
  });

  describe('Read-only', () => {
    it('swaps the border for a muted fill', () => {
      render(<Input readOnly value="Generated" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveClass('bg-muted', 'border-transparent');
      expect(input).not.toHaveClass('bg-transparent', 'border-input');
    });

    it('sits a step below the page in Future themes', () => {
      render(<Input readOnly value="Generated" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('future:bg-surface-raised');
      expect(input).not.toHaveClass('future:bg-surface-overlay');
    });

    it('keeps the error border and ring when invalid', () => {
      render(<Input readOnly value="Generated" error="Name is taken." />);
      expect(screen.getByRole('textbox')).toHaveClass(
        'aria-invalid:border-error',
        'future:aria-invalid:ring-error/40'
      );
    });

    it('keeps the standard focus ring', () => {
      render(<Input readOnly value="Generated" />);
      expect(screen.getByRole('textbox')).toHaveClass('focus-visible:ring-2');
    });

    it('replaces the ghost surface', () => {
      render(<Input variant="ghost" readOnly value="Generated" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-muted');
      expect(input).not.toHaveClass('bg-surface-overlay');
    });

    it('leaves editable inputs unchanged', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).not.toHaveClass('bg-muted');
    });

    it('keeps the disabled look when also disabled', () => {
      render(<Input readOnly disabled value="Generated" />);
      expect(screen.getByRole('textbox')).not.toHaveClass('bg-muted');
    });

    it('keeps the disabled look when a disabled group disables it', () => {
      render(
        <InputGroup disabled>
          <InputGroupAddon>
            <Input readOnly value="Generated" />
          </InputGroupAddon>
        </InputGroup>
      );
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).not.toHaveClass('bg-muted');
    });

    it('leaves the box to the group inside an InputGroup', () => {
      render(
        <InputGroup>
          <InputGroupInput readOnly value="Generated" />
        </InputGroup>
      );
      expect(screen.getByRole('textbox')).not.toHaveClass('bg-muted');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<Input aria-label="Run ID" readOnly value="Generated" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Future focus ring', () => {
    it.each([
      ['default', 'default'],
      ['ghost', 'xs'],
    ] as const)('applies the primary ring for variant=%s size=%s', (variant, size) => {
      render(<Input variant={variant} size={size} />);
      expect(screen.getByRole('textbox')).toHaveClass('future:focus-visible:ring-primary');
    });

    it('keeps the error ring above the primary ring when invalid', () => {
      render(<Input aria-invalid />);
      expect(screen.getByRole('textbox')).toHaveClass(
        'future:aria-invalid:focus-visible:ring-error'
      );
    });

    it('lets consumers override the focus color', () => {
      render(<Input className="future:focus-visible:ring-foreground" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('future:focus-visible:ring-foreground');
      expect(input).not.toHaveClass('future:focus-visible:ring-primary');
    });
  });
});
