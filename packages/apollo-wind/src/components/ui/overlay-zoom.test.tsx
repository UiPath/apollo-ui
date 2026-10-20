import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// Anchored overlays zoom from their anchor (Radix's transform-origin variable, in Tailwind v4's
// parenthesis form) and slide in from the trigger's side, as shadcn intends.
function expectAnchoredZoom(element: Element | null, radixName: string) {
  expect(element).toHaveClass(
    `origin-(--radix-${radixName}-content-transform-origin)`,
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=top]:slide-in-from-bottom-2'
  );
  expect(element?.className).toMatch(/zoom-in-95/);
  expect(element?.className).not.toMatch(/origin-\[|origin-center/);
}

describe('overlay zoom', () => {
  it('zooms popovers, tooltips and hover cards from their anchor', () => {
    render(
      <TooltipProvider>
        <Popover open>
          <PopoverTrigger>Popover</PopoverTrigger>
          <PopoverContent data-testid="popover">Body</PopoverContent>
        </Popover>
        <Tooltip open>
          <TooltipTrigger>Tooltip</TooltipTrigger>
          <TooltipContent data-testid="tooltip">Tip</TooltipContent>
        </Tooltip>
        <HoverCard open>
          <HoverCardTrigger>Card</HoverCardTrigger>
          <HoverCardContent data-testid="hover-card">Card body</HoverCardContent>
        </HoverCard>
      </TooltipProvider>
    );
    expectAnchoredZoom(screen.getByTestId('popover'), 'popover');
    expectAnchoredZoom(screen.getByTestId('tooltip'), 'tooltip');
    expectAnchoredZoom(screen.getByTestId('hover-card'), 'hover-card');
  });

  it('zooms menus, their submenus and select lists from their anchor', () => {
    render(
      <>
        <DropdownMenu open>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="menu">
            <DropdownMenuItem>One</DropdownMenuItem>
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent data-testid="submenu">
                <DropdownMenuItem>Two</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <Select open>
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-testid="select">
            <SelectItem value="open">Open</SelectItem>
          </SelectContent>
        </Select>
      </>
    );
    expectAnchoredZoom(screen.getByTestId('menu'), 'dropdown-menu');
    expectAnchoredZoom(screen.getByTestId('submenu'), 'dropdown-menu');
    expectAnchoredZoom(screen.getByTestId('select'), 'select');
  });

  it('zooms context menus from their anchor and alert dialogs from their centre', () => {
    render(
      <>
        <ContextMenu>
          <ContextMenuTrigger>Area</ContextMenuTrigger>
          <ContextMenuContent data-testid="context-menu">
            <ContextMenuItem>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <AlertDialog open>
          <AlertDialogContent data-testid="alert-dialog" aria-describedby={undefined}>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
    fireEvent.contextMenu(screen.getByText('Area'));
    expectAnchoredZoom(screen.getByTestId('context-menu'), 'context-menu');
    const dialog = screen.getByTestId('alert-dialog');
    expect(dialog).toHaveClass('origin-center', 'data-[state=open]:zoom-in-95');
    expect(dialog.className).not.toMatch(/slide-(in-from|out-to)/);
  });
});
