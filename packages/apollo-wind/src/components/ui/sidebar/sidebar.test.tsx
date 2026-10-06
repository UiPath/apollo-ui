import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '.';

function EmbeddedMenu({ onSelect = vi.fn() }: { onSelect?: (id: string) => void }) {
  const [selected, setSelected] = React.useState('owner');
  const items = [
    { id: 'owner', label: 'Owner' },
    { id: 'worker', label: 'Worker' },
    { id: 'auditor', label: 'Auditor', disabled: true },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Roles</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={selected === item.id}
                    disabled={item.disabled}
                    onClick={() => {
                      setSelected(item.id);
                      onSelect(item.id);
                    }}
                  >
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

function StateProbe() {
  const { state } = useSidebar();
  return <span data-testid="state">{state}</span>;
}

describe('Sidebar', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<EmbeddedMenu />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders the menu as a list of buttons', () => {
    render(<EmbeddedMenu />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Owner' })).toHaveAttribute('type', 'button');
  });

  it('marks the active item with data-active and aria-current', () => {
    render(<EmbeddedMenu />);
    const owner = screen.getByRole('button', { name: 'Owner' });
    const worker = screen.getByRole('button', { name: 'Worker' });
    expect(owner).toHaveAttribute('data-active', 'true');
    expect(owner).toHaveAttribute('aria-current', 'true');
    expect(worker).toHaveAttribute('data-active', 'false');
    expect(worker).not.toHaveAttribute('aria-current');
  });

  it('moves the selection on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EmbeddedMenu onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Worker' }));

    expect(onSelect).toHaveBeenCalledWith('worker');
    expect(screen.getByRole('button', { name: 'Worker' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Owner' })).not.toHaveAttribute('aria-current');
  });

  it('does not select disabled items', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EmbeddedMenu onSelect={onSelect} />);

    const auditor = screen.getByRole('button', { name: 'Auditor' });
    expect(auditor).toBeDisabled();
    await user.click(auditor);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reaches items with the keyboard', async () => {
    const user = userEvent.setup();
    render(<EmbeddedMenu />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Owner' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Worker' })).toHaveFocus();
  });

  it('expands and collapses a sub-menu', async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <Collapsible asChild>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>Review</SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#credit">Credit review</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );

    const trigger = screen.getByRole('button', { name: 'Review' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Credit review')).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Credit review' })).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles open state from SidebarTrigger and reports it through onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SidebarProvider defaultOpen onOpenChange={onOpenChange}>
        <SidebarTrigger />
        <StateProbe />
      </SidebarProvider>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Uncontrolled: onOpenChange observes, so internal state still updates.
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('stays on the controlled value when open is passed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SidebarProvider open onOpenChange={onOpenChange}>
        <SidebarTrigger />
        <StateProbe />
      </SidebarProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });

  it('defaults group and row actions to type="button" so they do not submit forms', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SidebarProvider>
          <Sidebar collapsible="none">
            <SidebarGroup>
              <SidebarGroupAction aria-label="Add role" />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Owner</SidebarMenuButton>
                  <SidebarMenuAction aria-label="More options" />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>
      </form>
    );

    for (const name of ['Add role', 'More options', 'Owner']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('type', 'button');
      await user.click(button);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('collapses off-canvas by default and reports it on the sidebar element', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );

    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    expect(sidebar).toHaveAttribute('data-collapsible', '');

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas');
  });

  it('runs a callback ref cleanup on the desktop element when it unmounts', () => {
    const cleanup = vi.fn();
    const callbackRef = vi.fn((node: HTMLDivElement | null) => (node ? cleanup : undefined));
    const { unmount } = render(
      <SidebarProvider>
        <Sidebar ref={callbackRef}>
          <span>Panel</span>
        </Sidebar>
      </SidebarProvider>
    );
    expect(callbackRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('moves a right-side sidebar to the end of the row without changing DOM order', () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar side="right">
          <span>Panel</span>
        </Sidebar>
        <SidebarInset>Page</SidebarInset>
      </SidebarProvider>
    );
    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]') as HTMLElement;
    const inset = container.querySelector('[data-slot="sidebar-inset"]') as HTMLElement;
    expect(sidebar).toHaveAttribute('data-side', 'right');
    expect(sidebar).toHaveClass('data-[side=right]:order-last');
    // The inset's peer-* selectors need the sidebar to come first in the DOM.
    expect(sidebar.nextElementSibling).toBe(inset);
  });

  it('forwards ref and props to the same desktop element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SidebarProvider>
        <Sidebar ref={ref} id="app-sidebar" className="custom-sidebar">
          <span>Desktop content</span>
        </Sidebar>
      </SidebarProvider>
    );
    expect(ref.current).toHaveAttribute('id', 'app-sidebar');
    expect(ref.current).toHaveClass('custom-sidebar');
    expect(ref.current).toHaveAttribute('data-slot', 'sidebar-container');
  });

  it('collapses to an icon rail and toggles from the rail', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <SidebarProvider onOpenChange={onOpenChange}>
        <Sidebar collapsible="icon">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Home">Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    );

    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    const rail = container.querySelector('[data-slot="sidebar-rail"]') as HTMLElement;

    expect(rail).toHaveAttribute('aria-expanded', 'true');
    expect(rail).toHaveAttribute('tabindex', '-1');
    // Shown only at the desktop breakpoint, where the sheet isn't used.
    expect(rail).toHaveClass('hidden', 'md:flex');
    expect(rail).not.toHaveClass('sm:flex');

    await user.click(rail);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
    expect(rail).toHaveAttribute('aria-expanded', 'false');

    await user.click(rail);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });

  it('runs a consumer onClick on the rail without losing the toggle', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarRail onClick={onClick} />
        </Sidebar>
      </SidebarProvider>
    );

    await user.click(container.querySelector('[data-slot="sidebar-rail"]') as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slot="sidebar"][data-state]')).toHaveAttribute(
      'data-state',
      'collapsed'
    );
  });

  it('blocks activation of aria-disabled links, including Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onNavigate = vi.fn((event: MouseEvent) => event.preventDefault());
    document.addEventListener('click', onNavigate);
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild aria-disabled="true" onClick={onClick}>
                <a href="#billing">Billing</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="#invoices" aria-disabled onClick={onClick}>
                    Invoices
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );

    for (const name of ['Billing', 'Invoices']) {
      const link = screen.getByRole('link', { name });
      await user.click(link);
      link.focus();
      await user.keyboard('{Enter}');
    }
    expect(onClick).not.toHaveBeenCalled();
    // The guard stops propagation, so no click reaches the document's navigation handler.
    expect(onNavigate).not.toHaveBeenCalled();
    document.removeEventListener('click', onNavigate);
  });

  it("blocks a slotted child's own onClick when aria-disabled", async () => {
    const user = userEvent.setup();
    const childClick = vi.fn();
    render(
      <SidebarProvider>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild aria-disabled="true">
              <button type="button" onClick={childClick}>
                Reports
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild aria-disabled>
                  <button type="button" onClick={childClick}>
                    Archive
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarProvider>
    );

    for (const name of ['Reports', 'Archive']) {
      const item = screen.getByRole('button', { name });
      await user.click(item);
      item.focus();
      await user.keyboard('{Enter}');
    }
    expect(childClick).not.toHaveBeenCalled();
  });

  it('removes a collapsed off-canvas sidebar from the tab order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    const menu = container.querySelector('[data-slot="sidebar-menu"]') as HTMLElement;
    expect(menu).not.toHaveAttribute('inert');

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(menu).toHaveAttribute('inert');
    expect(menu).toHaveAttribute('aria-hidden', 'true');

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(menu).not.toHaveAttribute('inert');
    expect(menu).not.toHaveAttribute('aria-hidden');
  });

  it('keeps the rail usable so a collapsed off-canvas sidebar can reopen', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Home</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    );
    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]') as HTMLElement;
    const rail = container.querySelector('[data-slot="sidebar-rail"]') as HTMLElement;
    const content = container.querySelector('[data-slot="sidebar-content"]') as HTMLElement;

    await user.click(rail);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(content).toHaveAttribute('inert');
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(rail).not.toHaveAttribute('inert');
    expect(rail.closest('[inert]')).toBeNull();

    await user.click(rail);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    expect(content).not.toHaveAttribute('inert');
  });

  it('leaves consumer-set inert and aria-hidden on sidebar children alone', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <div data-testid="decorative" aria-hidden="true" />
          {/* Set through a ref because React 18 and 19 treat the inert prop differently. */}
          <div data-testid="inactive" ref={(node) => node?.setAttribute('inert', '')} />
          <SidebarContent>Menu</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    const decorative = screen.getByTestId('decorative');
    const inactive = screen.getByTestId('inactive');
    const content = container.querySelector('[data-slot="sidebar-content"]') as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' });

    // Initial expanded render keeps the consumer's attributes.
    expect(decorative).toHaveAttribute('aria-hidden', 'true');
    expect(inactive).toHaveAttribute('inert');

    await user.click(trigger);
    expect(content).toHaveAttribute('inert');

    await user.click(trigger);
    expect(content).not.toHaveAttribute('inert');
    expect(content).not.toHaveAttribute('aria-hidden');
    expect(decorative).toHaveAttribute('aria-hidden', 'true');
    expect(inactive).toHaveAttribute('inert');
  });

  it('hides content inserted later by a nested update while collapsed', async () => {
    const user = userEvent.setup();
    let reveal: () => void = () => {};
    function LateContent() {
      const [shown, setShown] = React.useState(false);
      reveal = () => setShown(true);
      return shown ? <div data-testid="late">Late link</div> : null;
    }
    const { container } = render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <SidebarContent>Menu</SidebarContent>
          <LateContent />
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    );

    const trigger = container.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;
    await user.click(trigger);
    act(() => reveal());

    const late = await screen.findByTestId('late');
    await waitFor(() => expect(late).toHaveAttribute('inert'));
    expect(late).toHaveAttribute('aria-hidden', 'true');

    await user.click(trigger);
    expect(late).not.toHaveAttribute('inert');
  });

  it('keeps an icon rail focusable when collapsed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar collapsible="icon">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(container.querySelector('[inert]')).toBeNull();
  });

  it('still calls onClick on enabled menu buttons', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SidebarProvider>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onClick}>Home</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('gives the menu skeleton a stable width between 50% and 90%', () => {
    const { container, rerender } = render(
      <SidebarProvider>
        <SidebarMenuSkeleton />
      </SidebarProvider>
    );
    const text = container.querySelector('[data-sidebar="menu-skeleton-text"]') as HTMLElement;
    const width = text.style.getPropertyValue('--skeleton-width');
    expect(Number.parseInt(width, 10)).toBeGreaterThanOrEqual(50);
    expect(Number.parseInt(width, 10)).toBeLessThanOrEqual(90);

    rerender(
      <SidebarProvider>
        <SidebarMenuSkeleton />
      </SidebarProvider>
    );
    expect(text.style.getPropertyValue('--skeleton-width')).toBe(width);
  });

  it('forwards className, props and ref to the mobile sheet', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...original(query),
      matches: query.includes('max-width'),
    })) as typeof window.matchMedia;

    const user = userEvent.setup();
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar ref={ref} id="app-sidebar" className="custom-sidebar" aria-label="Main">
          <span>Sheet content</span>
        </Sidebar>
      </SidebarProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    const sheet = await screen.findByText('Sheet content');
    const content = sheet.closest('[data-mobile="true"]');
    expect(content).toHaveAttribute('id', 'app-sidebar');
    expect(content).toHaveAttribute('aria-label', 'Main');
    expect(content).toHaveClass('custom-sidebar');
    expect(ref.current).toBe(content);

    window.matchMedia = original;
  });

  it('ignores Cmd/Ctrl+B unless keyboardShortcut is set', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SidebarProvider>
        <StateProbe />
      </SidebarProvider>
    );
    await user.keyboard('{Control>}b{/Control}');
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
    unmount();

    render(
      <SidebarProvider keyboardShortcut>
        <StateProbe />
      </SidebarProvider>
    );
    await user.keyboard('{Control>}b{/Control}');
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');
  });

  it('does not write a cookie when the state changes', async () => {
    const user = userEvent.setup();
    const before = document.cookie;
    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(document.cookie).toBe(before);
  });

  it('throws a clear error when used outside SidebarProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SidebarTrigger />)).toThrow(
      'useSidebar must be used within a SidebarProvider.'
    );
    spy.mockRestore();
  });
});
