import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { StatsCard } from './stats-card';

describe('StatsCard', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders title and value', () => {
      render(<StatsCard title="Revenue" value="$10,000" />);
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<StatsCard title="Revenue" value="$10,000" description="Monthly total" />);
      expect(screen.getByText('Monthly total')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <StatsCard title="Revenue" value="$10,000" icon={<span data-testid="icon">$</span>} />,
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders numeric value', () => {
      render(<StatsCard title="Count" value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<StatsCard title="Revenue" value="$10,000" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with all props', async () => {
      const { container } = render(
        <StatsCard
          title="Revenue"
          value="$10,000"
          description="Monthly"
          trend={{ value: 12, label: 'vs last month' }}
          icon={<span>$</span>}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Variant tests
  describe('variants', () => {
    it('applies default variant', () => {
      const { container } = render(<StatsCard title="Test" value="100" />);
      const card = container.firstChild;
      expect(card).not.toHaveClass('border-primary/20');
    });

    it('applies primary variant', () => {
      const { container } = render(<StatsCard title="Test" value="100" variant="primary" />);
      const card = container.firstChild;
      expect(card).toHaveClass('border-primary/20');
    });

    it('applies success variant', () => {
      const { container } = render(<StatsCard title="Test" value="100" variant="success" />);
      const card = container.firstChild;
      expect(card).toHaveClass('border-green-500/20');
    });

    it('applies warning variant', () => {
      const { container } = render(<StatsCard title="Test" value="100" variant="warning" />);
      const card = container.firstChild;
      expect(card).toHaveClass('border-yellow-500/20');
    });

    it('applies danger variant', () => {
      const { container } = render(<StatsCard title="Test" value="100" variant="danger" />);
      const card = container.firstChild;
      expect(card).toHaveClass('border-red-500/20');
    });
  });

  // Trend tests
  describe('trend', () => {
    it('renders positive trend with up icon', () => {
      render(<StatsCard title="Revenue" value="$10,000" trend={{ value: 12 }} />);
      expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('renders negative trend with down icon', () => {
      render(<StatsCard title="Revenue" value="$10,000" trend={{ value: -5 }} />);
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('renders trend label', () => {
      render(
        <StatsCard title="Revenue" value="$10,000" trend={{ value: 12, label: 'vs last month' }} />,
      );
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('respects explicit direction override', () => {
      render(
        <StatsCard title="Revenue" value="$10,000" trend={{ value: 12, direction: 'down' }} />,
      );
      expect(screen.getByText('12%')).toBeInTheDocument();
    });
  });

  // Ref forwarding tests
  describe('ref forwarding', () => {
    it('forwards ref to the card element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<StatsCard ref={ref} title="Test" value="100" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  // Custom className tests
  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<StatsCard title="Test" value="100" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
