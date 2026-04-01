import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies default variant classes', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('applies text size classes', () => {
    const { rerender } = render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="xs">Extra Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="2xs">2XS</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-7');
  });

  it('applies icon prop for square buttons', () => {
    const { rerender } = render(<Button icon>Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'aspect-square', 'p-0');

    rerender(
      <Button size="lg" icon>
        Icon LG
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('h-11', 'aspect-square', 'p-0');

    rerender(
      <Button size="sm" icon>
        Icon SM
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('h-9', 'aspect-square', 'p-0');

    rerender(
      <Button size="xs" icon>
        Icon XS
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('h-8', 'aspect-square', 'p-0');

    rerender(
      <Button size="2xs" icon>
        Icon 2XS
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('h-7', 'aspect-square', 'p-0');

    rerender(
      <Button size="3xs" icon>
        Icon 3XS
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('h-6', 'aspect-square', 'p-0');
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
