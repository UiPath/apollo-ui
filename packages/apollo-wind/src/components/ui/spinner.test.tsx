import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { Spinner } from './spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with default size', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6');
    });

    it('renders small size', () => {
      const { container } = render(<Spinner size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('renders large size', () => {
      const { container } = render(<Spinner size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8');
    });

    it('renders extra large size', () => {
      const { container } = render(<Spinner size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12', 'w-12');
    });

    it('has animation class', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role status', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has default aria-label', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('has custom aria-label when label prop provided', () => {
      render(<Spinner label="Processing" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing');
    });

    it('has screen reader text when showLabel is false', () => {
      render(<Spinner label="Loading data" />);
      expect(screen.getByText('Loading data')).toHaveClass('sr-only');
    });

    it('shows visible label when showLabel is true', () => {
      render(<Spinner label="Loading data" showLabel />);
      const label = screen.getByText('Loading data');
      expect(label).not.toHaveClass('sr-only');
      expect(label).toHaveClass('text-muted-foreground');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the container element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Spinner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<Spinner className="custom-spinner" />);
      expect(screen.getByRole('status')).toHaveClass('custom-spinner');
    });

    it('merges with default classes', () => {
      render(<Spinner className="custom-spinner" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('flex', 'items-center', 'justify-center', 'custom-spinner');
    });
  });

  describe('props', () => {
    it('passes additional props to container', () => {
      render(<Spinner data-testid="my-spinner" />);
      expect(screen.getByTestId('my-spinner')).toBeInTheDocument();
    });
  });
});
