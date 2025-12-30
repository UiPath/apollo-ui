import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewBaseNode } from './NewBaseNode';

// Mock dependencies
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  useStore: () => ({ edges: [], isConnecting: false }),
  useConnection: () => ({ inProgress: false }),
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  }),
}));

vi.mock('../ButtonHandle/useButtonHandles', () => ({
  useButtonHandles: () => null,
}));

vi.mock('@uipath/portal-shell-react', () => ({
  ApIcon: ({ name }: { name: string }) => <div data-testid={`icon-${name}`}>{name}</div>,
  ApTooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ApTypography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Partial mock is not needed for NewBaseNode tests
// The component uses cx() from @uipath/uix/core which works fine unmocked

const defaultProps = {
  id: 'test-node',
  type: 'test',
  data: {},
  position: { x: 0, y: 0 },
  selected: false,
  dragging: false,
  draggable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  selectable: true,
  deletable: true,
};

describe('NewBaseNode - Bottom Handle Text Positioning', () => {
  it('should render text container when there are no bottom handles (hasVisibleBottomHandles=false)', () => {
    render(
      <NewBaseNode
        {...defaultProps}
        selected={true}
        display={{ label: 'Test Node Left Right' }}
        handleConfigurations={[
          {
            position: 'left' as any,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
          {
            position: 'right' as any,
            handles: [{ id: 'output', type: 'source', handleType: 'output' }],
          },
        ]}
      />
    );

    // Text container renders - hasVisibleBottomHandles should be false since no bottom handles
    expect(screen.getByText('Test Node Left Right')).toBeInTheDocument();
  });

  it('should render text container when node is not selected (hasVisibleBottomHandles=false)', () => {
    render(
      <NewBaseNode
        {...defaultProps}
        selected={false}
        display={{ label: 'Test Node Not Selected' }}
        handleConfigurations={[
          {
            position: 'bottom' as any,
            handles: [{ id: 'artifact', type: 'source', handleType: 'artifact' }],
          },
        ]}
      />
    );

    // Text container renders - hasVisibleBottomHandles should be false even with bottom handles
    // because the node is not selected
    expect(screen.getByText('Test Node Not Selected')).toBeInTheDocument();
  });

  it('should render text container when selected with bottom handles (hasVisibleBottomHandles=true)', () => {
    render(
      <NewBaseNode
        {...defaultProps}
        selected={true}
        display={{ label: 'Test Node With Bottom' }}
        handleConfigurations={[
          {
            position: 'bottom' as any,
            handles: [{ id: 'artifact', type: 'source', handleType: 'artifact' }],
          },
        ]}
      />
    );

    // Text container renders - hasVisibleBottomHandles should be true
    // because selected=true AND there are bottom handles
    expect(screen.getByText('Test Node With Bottom')).toBeInTheDocument();
  });

  it('should render text container when bottom handles array is empty (hasVisibleBottomHandles=false)', () => {
    render(
      <NewBaseNode
        {...defaultProps}
        selected={true}
        display={{ label: 'Test Node Empty Bottom' }}
        handleConfigurations={[
          {
            position: 'bottom' as any,
            handles: [], // Empty handles array
          },
        ]}
      />
    );

    // Text container renders - hasVisibleBottomHandles should be false
    // because handles.length === 0
    expect(screen.getByText('Test Node Empty Bottom')).toBeInTheDocument();
  });

  it('should not apply bottom handle offset when bottom handles have visible=false (hasVisibleBottomHandles=false)', () => {
    render(
      <NewBaseNode
        {...defaultProps}
        selected={true}
        display={{ label: 'Test Node Hidden Bottom' }}
        handleConfigurations={[
          {
            position: 'top' as any,
            handles: [{ id: 'top-handle', type: 'target', handleType: 'artifact' }],
            visible: true,
          },
          {
            position: 'bottom' as any,
            handles: [{ id: 'bottom-handle', type: 'source', handleType: 'artifact' }],
            visible: false, // Bottom handles exist but are not visible
          },
        ]}
      />
    );

    // Text container renders - hasVisibleBottomHandles should be false
    // because visible=false on the bottom handle configuration
    expect(screen.getByText('Test Node Hidden Bottom')).toBeInTheDocument();
  });
});

describe('NewBaseNode - Footer Display (centerAdornmentComponent)', () => {
  describe('Footer Rendering', () => {
    it('should render centerAdornmentComponent when provided', () => {
      const footerContent = <div data-testid="custom-footer">Custom Footer</div>;

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: footerContent,
          }}
        />
      );

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Custom Footer')).toBeInTheDocument();
    });

    it('should not render centerAdornmentComponent when undefined', () => {
      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: undefined,
          }}
        />
      );

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-footer')).not.toBeInTheDocument();
    });

    it('should not render centerAdornmentComponent when null', () => {
      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: null,
          }}
        />
      );

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-footer')).not.toBeInTheDocument();
    });

    it('should render centerAdornmentComponent with subLabel', () => {
      const footerContent = <div data-testid="footer-badge">Badge</div>;

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Main Label',
            subLabel: 'Sub Label',
            centerAdornmentComponent: footerContent,
          }}
        />
      );

      expect(screen.getByText('Main Label')).toBeInTheDocument();
      expect(screen.getByText('Sub Label')).toBeInTheDocument();
      expect(screen.getByTestId('footer-badge')).toBeInTheDocument();
    });

    it('should not render centerAdornmentComponent without label', () => {
      // centerAdornmentComponent should not render if there's no label
      const footerContent = <div data-testid="orphan-footer">Footer</div>;

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            centerAdornmentComponent: footerContent,
          }}
        />
      );

      // centerAdornmentComponent should not be present because label is required for text container
      expect(screen.queryByTestId('orphan-footer')).not.toBeInTheDocument();
    });
  });

  describe('centerAdornmentComponent Content Types', () => {
    it('should render text centerAdornmentComponent', () => {
      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: 'Simple text footer',
          }}
        />
      );

      expect(screen.getByText('Simple text footer')).toBeInTheDocument();
    });

    it('should render complex JSX centerAdornmentComponent', () => {
      const complexFooter = (
        <div data-testid="complex-footer">
          <span data-testid="footer-icon">🎯</span>
          <span data-testid="footer-text">Complex Content</span>
        </div>
      );

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: complexFooter,
          }}
        />
      );

      expect(screen.getByTestId('complex-footer')).toBeInTheDocument();
      expect(screen.getByTestId('footer-icon')).toBeInTheDocument();
      expect(screen.getByTestId('footer-text')).toBeInTheDocument();
    });

    it('should render number centerAdornmentComponent', () => {
      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Test Node',
            centerAdornmentComponent: 42,
          }}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('centerAdornmentComponent with Different Shapes', () => {
    it('should render centerAdornmentComponent with shape rectangle', () => {
      const footerContent = <div data-testid="rect-footer">Footer</div>;

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Rectangle Node',
            shape: 'rectangle',
            centerAdornmentComponent: footerContent,
          }}
        />
      );

      expect(screen.getByText('Rectangle Node')).toBeInTheDocument();
      expect(screen.getByTestId('rect-footer')).toBeInTheDocument();
    });

    it('should render centerAdornmentComponent with shape circle', () => {
      const footerContent = <div data-testid="circle-footer">Footer</div>;

      render(
        <NewBaseNode
          {...defaultProps}
          display={{
            label: 'Circle Node',
            shape: 'circle',
            centerAdornmentComponent: footerContent,
          }}
        />
      );

      expect(screen.getByText('Circle Node')).toBeInTheDocument();
      expect(screen.getByTestId('circle-footer')).toBeInTheDocument();
    });
  });
});
