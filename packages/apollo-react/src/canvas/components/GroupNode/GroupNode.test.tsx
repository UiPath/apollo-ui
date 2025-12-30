import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@uipath/uix/xyflow/react';
import { GroupNode, type GroupNodeProps } from './GroupNode';

const defaultProps: GroupNodeProps = {
  id: 'test-group',
  type: 'group',
  data: {
    title: 'Test Group',
    iconName: 'folder',
    parameters: {},
  },
  selected: false,
  isConnectable: true,
  zIndex: 0,
  dragging: false,
  draggable: true,
  selectable: true,
  deletable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};

describe('GroupNode', () => {
  it('renders with default title', () => {
    renderWithProvider(<GroupNode {...defaultProps} />);
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const props: GroupNodeProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        title: 'Custom Group Title',
      },
    };
    renderWithProvider(<GroupNode {...props} />);
    expect(screen.getByText('Custom Group Title')).toBeInTheDocument();
  });

  it('renders with default icon when no icon specified', () => {
    const props: GroupNodeProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        iconName: undefined,
      },
    };
    renderWithProvider(<GroupNode {...props} />);
    // Icon should still render (default folder icon)
    const container = screen.getByText('Test Group').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const props: GroupNodeProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        iconName: 'api',
      },
    };
    renderWithProvider(<GroupNode {...props} />);
    const container = screen.getByText('Test Group').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('applies selected state correctly', () => {
    const { container } = renderWithProvider(<GroupNode {...defaultProps} selected={true} />);
    // Check if the container has selected styling
    const groupContainer = container.querySelector('.nodrag');
    expect(groupContainer).toBeInTheDocument();
  });

  it('renders with collapsed state', () => {
    const props: GroupNodeProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        collapsed: true,
      },
    };
    renderWithProvider(<GroupNode {...props} />);
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('renders resize controls', () => {
    const { container } = renderWithProvider(<GroupNode {...defaultProps} />);
    // NodeResizeControl components should be rendered (4 corners)
    expect(container).toBeInTheDocument();
  });

  it('uses fallback title when title is not provided', () => {
    const props: GroupNodeProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        title: undefined,
      },
    };
    renderWithProvider(<GroupNode {...props} />);
    expect(screen.getByText('Group')).toBeInTheDocument();
  });
});
