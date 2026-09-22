import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Button } from '../src/index';

describe('Button', () => {
  it('renders from the package root export', () => {
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
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('applies AI variant classes', () => {
    render(<Button variant="ai">Ask AI</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ai');
  });
});
