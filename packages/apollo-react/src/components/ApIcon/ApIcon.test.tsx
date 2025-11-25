import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ApIcon } from './ApIcon';
import type { IconName } from '@uipath/apollo-core/icons';

// Mock SVG content for testing
const mockSvgContent = '<svg width="24" height="24"><circle cx="12" cy="12" r="10" /></svg>';

// Mock dynamic imports for specific icons
vi.mock('@uipath/apollo-core/icons/svg/alert-error.svg', () => ({
  default: mockSvgContent,
}));

vi.mock('@uipath/apollo-core/icons/svg/home.svg', () => ({
  default: mockSvgContent,
}));

vi.mock('@uipath/apollo-core/icons/svg/settings.svg', () => ({
  default: mockSvgContent,
}));

vi.mock('@uipath/apollo-core/icons/svg/arrow-left.svg', () => ({
  default: mockSvgContent,
}));

describe('ApIcon', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<ApIcon name="AlertError" />);

      // Wait for the icon to load
      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render the correct SVG content', async () => {
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg?.querySelector('circle')).toBeInTheDocument();
      });
    });

    it('should render empty span before icon loads', () => {
      render(<ApIcon name="AlertError" />);

      const span = document.querySelector('span');
      expect(span).toBeInTheDocument();
    });
  });

  describe('Size prop', () => {
    it('should accept size as number', async () => {
      render(<ApIcon name="AlertError" size={32} />);

      await waitFor(() => {
        // Check that the wrapper span has the correct size
        const span = document.querySelector('span[style*="width: 32px"]');
        expect(span).toBeInTheDocument();
        // Verify SVG is rendered (either as element or in dangerouslySetInnerHTML)
        expect(span?.innerHTML).toContain('svg');
      });
    });

    it('should accept size as string with units', async () => {
      render(<ApIcon name="AlertError" size="2rem" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('width');
        expect(svg).toHaveAttribute('height');
        // Check that the wrapper span has the correct size
        const span = document.querySelector('span[style*="width: 2rem"]');
        expect(span).toBeInTheDocument();
      });
    });

    it('should use default size of 24px when not provided', async () => {
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('width');
        expect(svg).toHaveAttribute('height');
        // Check that the wrapper span has the correct size
        const span = document.querySelector('span[style*="width: 24px"]');
        expect(span).toBeInTheDocument();
      });
    });
  });

  describe('Color prop', () => {
    it('should apply custom color', async () => {
      render(<ApIcon name="AlertError" color="red" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'red');
      });
    });

    it('should use currentColor by default', async () => {
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'currentColor');
      });
    });

    it('should accept CSS variables as color', async () => {
      render(<ApIcon name="AlertError" color="var(--color-primary-500)" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'var(--color-primary-500)');
      });
    });
  });

  describe('ClassName and Style props', () => {
    it('should apply custom className', async () => {
      render(<ApIcon name="AlertError" className="custom-icon" />);

      await waitFor(() => {
        const span = document.querySelector('.custom-icon');
        expect(span).toBeInTheDocument();
      });
    });

    it('should apply custom inline styles', async () => {
      render(<ApIcon name="AlertError" style={{ margin: '10px' }} />);

      await waitFor(() => {
        const span = document.querySelector('span[style*="margin"]');
        expect(span).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have img role by default', async () => {
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const span = screen.getByRole('img');
        expect(span).toBeInTheDocument();
      });
    });

    it('should use icon name as aria-label by default', async () => {
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const element = screen.getByLabelText('AlertError');
        expect(element).toBeInTheDocument();
      });
    });

    it('should accept custom ariaLabel', async () => {
      render(<ApIcon name="AlertError" ariaLabel="Error icon" />);

      await waitFor(() => {
        const element = screen.getByLabelText('Error icon');
        expect(element).toBeInTheDocument();
      });
    });

    it('should hide from screen readers when decorative', async () => {
      render(<ApIcon name="AlertError" decorative />);

      await waitFor(() => {
        const span = document.querySelector('span[aria-hidden="true"]');
        expect(span).toBeInTheDocument();
      });
    });

    it('should not have aria-label when decorative', async () => {
      render(<ApIcon name="AlertError" decorative />);

      await waitFor(() => {
        const span = document.querySelector('span[aria-hidden="true"]');
        expect(span).not.toHaveAttribute('aria-label');
      });
    });

    it('should have presentation role when decorative', async () => {
      render(<ApIcon name="AlertError" decorative />);

      await waitFor(() => {
        const span = document.querySelector('span[role="presentation"]');
        expect(span).toBeInTheDocument();
      });
    });
  });

  describe('Interactive features', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ApIcon name="AlertError" onClick={handleClick} />);

      await waitFor(() => {
        const span = document.querySelector('span[role="button"]');
        expect(span).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have button role when onClick is provided', async () => {
      render(<ApIcon name="AlertError" onClick={() => {}} />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should have pointer cursor when onClick is provided', async () => {
      render(<ApIcon name="AlertError" onClick={() => {}} />);

      await waitFor(() => {
        const span = document.querySelector('span[style*="cursor: pointer"]');
        expect(span).toBeInTheDocument();
      });
    });
  });

  describe('Title prop', () => {
    it('should render title attribute', async () => {
      render(<ApIcon name="AlertError" title="Error occurred" />);

      await waitFor(() => {
        const element = screen.getByTitle('Error occurred');
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('TestId prop', () => {
    it('should render with testId', async () => {
      render(<ApIcon name="AlertError" testId="test-icon" />);

      await waitFor(() => {
        const element = screen.getByTestId('test-icon');
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Fallback prop', () => {
    it('should render with fallback prop (Suspense integration)', async () => {
      // Note: Suspense fallback behavior is difficult to test with mocked imports
      // as the mock resolves synchronously in the test environment
      render(
        <ApIcon
          name="AlertError"
          fallback={<div data-testid="loading">Loading...</div>}
        />
      );

      // Icon should eventually render
      await waitFor(() => {
        const span = document.querySelector('span[style*="width: 24px"]');
        expect(span).toBeInTheDocument();
      });
    });

    it('should accept fallback prop without errors', () => {
      // Verify that the fallback prop is accepted by the component
      expect(() => {
        render(
          <ApIcon
            name="AlertError"
            fallback={<div data-testid="loading">Loading...</div>}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref to span element', () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<ApIcon name="AlertError" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('Multiple icons', () => {
    it('should render multiple different icons', async () => {
      render(
        <div>
          <ApIcon name="AlertError" testId="icon-1" />
          <ApIcon name="Home" testId="icon-2" />
          <ApIcon name="Settings" testId="icon-3" />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('icon-1')).toBeInTheDocument();
        expect(screen.getByTestId('icon-2')).toBeInTheDocument();
        expect(screen.getByTestId('icon-3')).toBeInTheDocument();
      });
    });

    it('should handle same icon rendered multiple times', async () => {
      render(
        <div>
          <ApIcon name="AlertError" testId="icon-1" />
          <ApIcon name="AlertError" testId="icon-2" />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('icon-1')).toBeInTheDocument();
        expect(screen.getByTestId('icon-2')).toBeInTheDocument();
      });
    });
  });

  describe('Icon name to path conversion', () => {
    it('should convert PascalCase to kebab-case', async () => {
      // This is tested implicitly by the mock working
      render(<ApIcon name="AlertError" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should handle single word names', async () => {
      render(<ApIcon name="Home" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should handle multi-word names', async () => {
      render(<ApIcon name="ArrowLeft" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing icons gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Use an icon name that's not mocked
      render(<ApIcon name="NonExistentIcon" testId="error-icon" />);

      // Should still render the component
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Dynamic style updates', () => {
    it('should update size when prop changes', async () => {
      const { rerender } = render(<ApIcon name="AlertError" size={24} />);

      await waitFor(() => {
        const span = document.querySelector('span[style*="width: 24px"]');
        expect(span).toBeInTheDocument();
      });

      rerender(<ApIcon name="AlertError" size={48} />);

      await waitFor(() => {
        const span = document.querySelector('span[style*="width: 48px"]');
        expect(span).toBeInTheDocument();
      });
    });

    it('should update color when prop changes', async () => {
      const { rerender } = render(<ApIcon name="AlertError" color="red" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'red');
      });

      rerender(<ApIcon name="AlertError" color="blue" />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'blue');
      });
    });
  });
});
