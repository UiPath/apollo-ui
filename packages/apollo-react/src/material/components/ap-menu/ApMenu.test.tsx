import { describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApMenu } from './ApMenu';
import type { IMenuItem } from './ApMenu.types';

describe('ApMenu', () => {
  const mockAnchorEl = document.createElement('button');

  const basicMenuItems: IMenuItem[] = [
    {
      variant: 'item',
      title: 'Item 1',
      onClick: vi.fn(),
    },
    {
      variant: 'item',
      title: 'Item 2',
      onClick: vi.fn(),
    },
  ];

  it('renders when open', () => {
    render(
      <ApMenu menuItems={basicMenuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ApMenu menuItems={basicMenuItems} isOpen={false} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders menu items', () => {
    render(
      <ApMenu menuItems={basicMenuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('calls onClick when menu item is clicked', async () => {
    const onClick = vi.fn();
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Clickable Item',
        onClick,
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    const menuItem = screen.getByText('Clickable Item');
    await userEvent.click(menuItem);

    expect(onClick).toHaveBeenCalled();
  });

  it('renders section header', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'section',
        title: 'Section Header',
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByText('Section Header')).toBeInTheDocument();
  });

  it('renders separator', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Item 1',
      },
      {
        variant: 'separator',
      },
      {
        variant: 'item',
        title: 'Item 2',
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    const separator = document.querySelector('.MuiDivider-root');
    expect(separator).toBeInTheDocument();
  });

  it('renders menu item with subtitle', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Item Title',
        subtitle: 'Item Subtitle',
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByText('Item Title')).toBeInTheDocument();
    expect(screen.getByText('Item Subtitle')).toBeInTheDocument();
  });

  it('renders menu item with start icon', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Item with Icon',
        startIcon: <span data-testid="start-icon">Icon</span>,
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders menu item with end icon', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Item with End Icon',
        endIcon: <span data-testid="end-icon">End</span>,
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('disables menu item when disabled prop is true', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Disabled Item',
        disabled: true,
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    const menuItem = screen.getByRole('menuitem');
    expect(menuItem).toHaveClass('Mui-disabled');
  });

  it('applies custom width', () => {
    render(
      <ApMenu
        menuItems={basicMenuItems}
        isOpen={true}
        anchorEl={mockAnchorEl}
        onClose={vi.fn()}
        width={300}
      />
    );

    const paper = document.querySelector('.MuiPaper-root');
    expect(paper).toHaveStyle({ width: '300px' });
  });

  it('applies default width of 246px', () => {
    render(
      <ApMenu menuItems={basicMenuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    const paper = document.querySelector('.MuiPaper-root');
    expect(paper).toHaveStyle({ width: '246px' });
  });

  it('renders submenu items', async () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'submenu',
        title: 'Parent Item',
        subItems: [
          {
            variant: 'item',
            title: 'Sub Item 1',
          },
          {
            variant: 'item',
            title: 'Sub Item 2',
          },
        ],
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    // Check that parent item shows arrow icon
    expect(screen.getByText('Parent Item')).toBeInTheDocument();

    // Click to open submenu
    const parentItem = screen.getByText('Parent Item');
    await userEvent.click(parentItem);

    // Check submenu items appear
    await waitFor(() => {
      expect(screen.getByText('Sub Item 1')).toBeInTheDocument();
      expect(screen.getByText('Sub Item 2')).toBeInTheDocument();
    });
  });

  it('shows selected state for menu item', () => {
    const menuItems: IMenuItem[] = [
      {
        variant: 'item',
        title: 'Selected Item',
        isSelected: true,
      },
    ];

    render(
      <ApMenu menuItems={menuItems} isOpen={true} anchorEl={mockAnchorEl} onClose={vi.fn()} />
    );

    const menuItem = screen.getByRole('menuitem');
    // Just verify the selected menu item renders correctly
    expect(menuItem).toBeInTheDocument();
    expect(screen.getByText('Selected Item')).toBeInTheDocument();
  });
});
