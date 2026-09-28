import { describe, expect, it, vi } from 'vitest';
import { render, screen, type UserEvent, userEvent } from '../../utils/testing';
import type { ListItem } from './ListView';
import type { ToolboxQuickAction } from './QuickActionsRow';
import { Toolbox } from './Toolbox';

const mockItems: ListItem[] = [
  {
    id: 'item-1',
    name: 'Item 1',
    data: { value: 'data-1' },
    icon: { name: 'star' },
  },
];

const baseProps = {
  title: 'Test Toolbox',
  initialItems: mockItems,
  onClose: vi.fn(),
  onItemSelect: vi.fn(),
};

describe('Toolbox quickActions', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('does not render the quick actions row when quickActions is undefined', () => {
    render(<Toolbox {...baseProps} />);

    expect(screen.queryByTestId('toolbox-quick-actions')).not.toBeInTheDocument();
  });

  it('does not render the quick actions row when quickActions is empty', () => {
    render(<Toolbox {...baseProps} quickActions={[]} />);

    expect(screen.queryByTestId('toolbox-quick-actions')).not.toBeInTheDocument();
  });

  it('renders all leading actions and no separator when only leading actions exist', () => {
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Action A', icon: <span>A</span> },
      { id: 'b', title: 'Action B', icon: <span>B</span> },
      { id: 'c', title: 'Action C', icon: <span>C</span> },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    expect(screen.getByTestId('toolbox-quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('toolbox-quick-action-a')).toBeInTheDocument();
    expect(screen.getByTestId('toolbox-quick-action-b')).toBeInTheDocument();
    expect(screen.getByTestId('toolbox-quick-action-c')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbox-quick-actions-separator')).not.toBeInTheDocument();
  });

  it('renders a separator between leading and trailing actions', () => {
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Action A', icon: <span>A</span> },
      { id: 'b', title: 'Action B', icon: <span>B</span> },
      { id: 'connect', title: 'Connect', icon: <span>C</span>, trailing: true },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    expect(screen.getByTestId('toolbox-quick-actions-separator')).toBeInTheDocument();
    expect(screen.getByTestId('toolbox-quick-action-connect')).toBeInTheDocument();
  });

  it('does not render a separator when only trailing actions exist', () => {
    const actions: ToolboxQuickAction[] = [
      { id: 'connect', title: 'Connect', icon: <span>C</span>, trailing: true },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    expect(screen.getByTestId('toolbox-quick-action-connect')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbox-quick-actions-separator')).not.toBeInTheDocument();
  });

  it('fires onClick when an action button is clicked', async () => {
    const onClick = vi.fn();
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Action A', icon: <span>A</span>, onClick },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    await user.click(screen.getByTestId('toolbox-quick-action-a'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onMouseEnter and onMouseLeave on hover', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Action A', icon: <span>A</span>, onMouseEnter, onMouseLeave },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    const button = screen.getByTestId('toolbox-quick-action-a');
    await user.hover(button);
    expect(onMouseEnter).toHaveBeenCalled();

    await user.unhover(button);
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('disables the button and suppresses onClick when disabled is true', async () => {
    const onClick = vi.fn();
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Action A', icon: <span>A</span>, onClick, disabled: true },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    const button = screen.getByTestId('toolbox-quick-action-a');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses title as aria-label on each button', () => {
    const actions: ToolboxQuickAction[] = [
      { id: 'a', title: 'Add element', icon: <span>A</span> },
      { id: 'b', title: 'Delete element', icon: <span>B</span> },
    ];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    expect(screen.getByRole('button', { name: 'Add element' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete element' })).toBeInTheDocument();
  });

  it('renders the quick actions row above the title', () => {
    const actions: ToolboxQuickAction[] = [{ id: 'a', title: 'Action A', icon: <span>A</span> }];

    render(<Toolbox {...baseProps} quickActions={actions} />);

    const row = screen.getByTestId('toolbox-quick-actions');
    const title = screen.getByText('Test Toolbox');

    expect(row.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
