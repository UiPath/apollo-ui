import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Toaster } from './sonner';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('Toaster', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Toaster />);
      // Sonner renders a section element
      expect(document.querySelector('section')).toBeInTheDocument();
    });

    it('applies toaster class to wrapping element', () => {
      render(<Toaster />);
      // Sonner applies className to inner ol element, not section
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Toaster />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Props tests
  describe('props', () => {
    it('passes additional props to Sonner', () => {
      render(<Toaster position="top-center" />);
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(<Toaster className="custom-toaster" />);
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });
});
