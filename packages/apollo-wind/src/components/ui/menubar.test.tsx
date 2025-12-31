import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from './menubar';

const BasicMenubar = () => (
  <Menubar>
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>New</MenubarItem>
        <MenubarItem>Open</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>Save</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
);

describe('Menubar', () => {
  describe('Rendering', () => {
    it('renders menubar with trigger', () => {
      render(<BasicMenubar />);
      expect(screen.getByRole('menubar')).toBeInTheDocument();
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('renders multiple menu triggers', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('does not render menu content initially', () => {
      render(<BasicMenubar />);
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(<BasicMenubar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct role for menubar', () => {
      render(<BasicMenubar />);
      expect(screen.getByRole('menubar')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('applies custom className to Menubar', () => {
      render(
        <Menubar className="custom-menubar">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByRole('menubar')).toHaveClass('custom-menubar');
    });

    it('applies custom className to MenubarTrigger', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger className="custom-trigger">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      expect(screen.getByText('File')).toHaveClass('custom-trigger');
    });

    it('renders MenubarItem with inset', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem inset>Inset Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Inset Item')).toHaveClass('pl-8');
      });
    });

    it('renders MenubarLabel with inset', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel inset>Label</MenubarLabel>
              <MenubarItem>Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Label')).toHaveClass('pl-8');
      });
    });
  });

  describe('Interactions', () => {
    it('opens menu on click', async () => {
      const user = userEvent.setup();
      render(<BasicMenubar />);

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('calls onSelect when item is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onSelect}>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New'));
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalled();
      });
    });

    it('renders disabled item', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled>Disabled</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Disabled')).toHaveAttribute('data-disabled');
      });
    });
  });

  describe('Checkbox Items', () => {
    it('renders checkbox item', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked>Show Toolbar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('View'));
      await waitFor(() => {
        expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
      });
    });
  });

  describe('Radio Items', () => {
    it('renders radio group with items', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="small">
                <MenubarRadioItem value="small">Small</MenubarRadioItem>
                <MenubarRadioItem value="medium">Medium</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('View'));
      await waitFor(() => {
        expect(screen.getByText('Small')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
      });
    });
  });

  describe('Submenu', () => {
    it('renders submenu', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Email</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
    });

    it('renders submenu trigger with inset', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger inset>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Email</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Share')).toHaveClass('pl-8');
      });
    });
  });

  describe('Shortcut', () => {
    it('renders shortcut text', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>Cmd+N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Cmd+N')).toBeInTheDocument();
      });
    });

    it('applies custom className to shortcut', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut className="custom-shortcut">Cmd+N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      );

      await user.click(screen.getByText('File'));
      await waitFor(() => {
        expect(screen.getByText('Cmd+N')).toHaveClass('custom-shortcut');
      });
    });
  });
});
