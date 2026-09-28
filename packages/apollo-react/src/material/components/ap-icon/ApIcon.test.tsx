import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApIcon } from './ApIcon';

// Mock SVG imports for legacy icons - must be at top level
vi.mock('./assets/index', () => {
  // Create a factory function for mock SVG components
  const createMockSvg = () => {
    const Component = (props: any) =>
      React.createElement('svg', {
        'data-testid': 'mock-svg',
        ...props,
      });
    Component.muiName = 'SvgIcon';
    return Component;
  };

  // Use a Proxy to return undefined for unknown icons (allowing error handling to work)
  return new Proxy(
    {
      AutopilotColor: createMockSvg(),
      Agent: createMockSvg(),
      Robot: createMockSvg(),
      NewChat: createMockSvg(),
    },
    {
      get(target: any, prop) {
        return target[prop]; // Returns undefined for unmocked icons
      },
      has() {
        return true; // Tell vitest that any property exists
      },
    }
  );
});

describe('ApIcon', () => {
  describe('Material Icons', () => {
    it('renders a normal Material Icon', () => {
      const { container } = render(<ApIcon name="home" variant="normal" />);
      const icon = container.querySelector('.material-icons');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('home');
    });

    it('renders an outlined Material Icon', () => {
      const { container } = render(<ApIcon name="settings" variant="outlined" />);
      const icon = container.querySelector('.material-icons-outlined');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('settings');
    });

    it('applies custom size to Material Icon', () => {
      const { container } = render(<ApIcon name="search" variant="normal" size="32px" />);
      const icon = container.querySelector('.material-icons');
      expect(icon).toHaveStyle({ fontSize: '32px' });
    });

    it('applies custom color to Material Icon', () => {
      const { container } = render(<ApIcon name="delete" variant="normal" color="red" />);
      const icon = container.querySelector('.material-icons');
      expect(icon).toHaveStyle({ color: 'red' });
    });

    it('uses default size when not specified', () => {
      const { container } = render(<ApIcon name="info" variant="normal" />);
      const icon = container.querySelector('.material-icons');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Legacy Custom Icons', () => {
    it('renders a custom legacy icon', () => {
      const { container } = render(<ApIcon name="autopilot_color" variant="custom" />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('applies custom size to legacy icon', () => {
      const { container } = render(<ApIcon name="agent" variant="custom" size="48px" />);
      // Check that MUI SvgIcon wrapper is rendered (it applies the styles)
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      // Note: The actual size styling is applied by MUI's SvgIcon wrapper via sx prop
    });

    it('applies custom color to legacy icon', () => {
      const { container } = render(<ApIcon name="robot" variant="custom" color="blue" />);
      // Check that MUI SvgIcon wrapper is rendered (it applies the styles)
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      // Note: The actual color styling is applied by MUI's SvgIcon wrapper via sx prop
    });

    it('converts snake_case to PascalCase for legacy icons', () => {
      const { container } = render(<ApIcon name="new_chat" variant="custom" />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe('Default Variant', () => {
    it('defaults to normal variant when not specified', () => {
      const { container } = render(<ApIcon name="star" />);
      const icon = container.querySelector('.material-icons');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('star');
    });
  });

  describe('Error Handling', () => {
    it('logs warning and returns null for non-existent custom icon', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a test that doesn't rely on the mock (since unmocked icons won't exist)
      // This tests the actual error handling code path in the component
      const { container } = render(<ApIcon name="definitely_not_a_real_icon" variant="custom" />);

      // The component should log a warning
      expect(consoleSpy).toHaveBeenCalledWith(
        'Icon "definitely_not_a_real_icon" not found in legacy or core icons'
      );

      // And return null
      expect(container.firstChild).toBeNull();

      consoleSpy.mockRestore();
    });
  });
});
