import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Drawer, DrawerContent, DrawerTitle } from './drawer';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PortalContainerProvider, useResolvedPortalContainer } from './portal-container';
import { Sheet, SheetContent, SheetTitle } from './sheet';
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from './tooltip';

describe('useResolvedPortalContainer', () => {
  const provided = document.createElement('div');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PortalContainerProvider container={provided}>{children}</PortalContainerProvider>
  );

  it('returns undefined (Radix default → body) with no override and no provider', () => {
    const { result } = renderHook(() => useResolvedPortalContainer());
    expect(result.current).toBeUndefined();
  });

  it("returns undefined for the 'body' sentinel, even under a provider", () => {
    const { result } = renderHook(() => useResolvedPortalContainer('body'), { wrapper });
    expect(result.current).toBeUndefined();
  });

  it('returns an explicit element override', () => {
    const el = document.createElement('div');
    const { result } = renderHook(() => useResolvedPortalContainer(el), { wrapper });
    expect(result.current).toBe(el);
  });

  it('inherits the provider for both undefined and null (ref-safe)', () => {
    const undef = renderHook(() => useResolvedPortalContainer(undefined), { wrapper });
    expect(undef.result.current).toBe(provided);

    const nul = renderHook(() => useResolvedPortalContainer(null), { wrapper });
    expect(nul.result.current).toBe(provided);
  });
});

/**
 * Popover is the vehicle here, but the resolution is shared by Select and
 * DropdownMenu, so these cases cover all three overlays. Dialog, Sheet and
 * AlertDialog resolve the same way — covered separately below, since they own
 * their portal rather than exposing it as a sibling.
 */
describe('PortalContainerProvider', () => {
  it('portals overlay content into the in-tree boundary by default', async () => {
    render(
      <div data-testid="host">
        <PortalContainerProvider>
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Menu</PopoverContent>
          </Popover>
        </PortalContainerProvider>
      </div>
    );

    await waitFor(() => {
      const content = screen.getByText('Menu');
      expect(screen.getByTestId('host').contains(content)).toBe(true);
    });
  });

  it('portals to document.body when no provider is mounted', async () => {
    render(
      <div data-testid="host">
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Menu</PopoverContent>
        </Popover>
      </div>
    );

    await waitFor(() => {
      const content = screen.getByText('Menu');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });

  it('lets an explicit container prop override the provider (and tolerates a null ref)', async () => {
    // `container={target}` is null on the first render — the ref-safe design
    // must inherit the provider then, not force body, and end up in `custom`.
    const Harness = () => {
      const [target, setTarget] = React.useState<HTMLElement | null>(null);
      return (
        <PortalContainerProvider>
          <div data-testid="custom" ref={setTarget} />
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent container={target}>Menu</PopoverContent>
          </Popover>
        </PortalContainerProvider>
      );
    };
    render(<Harness />);

    await waitFor(() => {
      const content = screen.getByText('Menu');
      expect(screen.getByTestId('custom').contains(content)).toBe(true);
    });
  });

  it("forces document.body with container='body', even under a provider", async () => {
    render(
      <div data-testid="host">
        <PortalContainerProvider>
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent container="body">Menu</PopoverContent>
          </Popover>
        </PortalContainerProvider>
      </div>
    );

    await waitFor(() => {
      const content = screen.getByText('Menu');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });

  it('inherits the provider (not body) when container={null}', async () => {
    render(
      <div data-testid="host">
        <PortalContainerProvider>
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent container={null}>Menu</PopoverContent>
          </Popover>
        </PortalContainerProvider>
      </div>
    );

    await waitFor(() => {
      const content = screen.getByText('Menu');
      expect(screen.getByTestId('host').contains(content)).toBe(true);
    });
  });
});

/**
 * Dialog, Sheet and AlertDialog render their own portal inside `*Content`, so a
 * consumer cannot reach it — the ambient provider is the only way to move them,
 * which is what a shadow-DOM host needs (its stylesheet cannot reach body).
 */
describe.each([
  ['Dialog', Dialog, DialogContent, DialogTitle],
  ['Sheet', Sheet, SheetContent, SheetTitle],
  ['AlertDialog', AlertDialog, AlertDialogContent, AlertDialogTitle],
] as const)('%s portal container', (_name, Root, Content, Title) => {
  const renderOverlay = (
    props: { container?: Element | DocumentFragment | 'body' | null } = {},
    provider = true
  ) => {
    const overlay = (
      <Root open>
        <Content {...props}>
          <Title>Title</Title>
        </Content>
      </Root>
    );
    return render(
      <div data-testid="host">
        {provider ? <PortalContainerProvider>{overlay}</PortalContainerProvider> : overlay}
      </div>
    );
  };

  it('portals into the in-tree boundary of the ambient provider', async () => {
    renderOverlay();

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByText('Title'))).toBe(true);
    });
  });

  it('portals to document.body when no provider is mounted', async () => {
    renderOverlay({}, false);

    await waitFor(() => {
      const content = screen.getByText('Title');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });

  it('honors an explicit container override', async () => {
    const target = document.createElement('div');
    target.setAttribute('data-testid', 'custom');
    document.body.appendChild(target);

    renderOverlay({ container: target });

    await waitFor(() => {
      expect(target.contains(screen.getByText('Title'))).toBe(true);
    });
    target.remove();
  });

  it("forces document.body with container='body', even under a provider", async () => {
    renderOverlay({ container: 'body' });

    await waitFor(() => {
      const content = screen.getByText('Title');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });
});

/**
 * `TooltipContent` deliberately takes no `container`: it renders no portal of its own, so accepting
 * one would double-portal when composed inside `TooltipPortal`.
 */
describe('Tooltip portal container', () => {
  const renderTooltip = (
    props: { container?: Element | DocumentFragment | 'body' | null; forceMount?: true } = {},
    provider = true
  ) => {
    const overlay = (
      <TooltipProvider>
        {/* Closed for the forceMount case, so that test proves forceMount and not `open`. */}
        <Tooltip open={!props.forceMount}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipPortal {...props}>
            {/* Queried by testid: Radix also renders a visually-hidden copy of the text. */}
            <TooltipContent data-testid="hint">Hint</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
    );
    return render(
      <div data-testid="host">
        {provider ? <PortalContainerProvider>{overlay}</PortalContainerProvider> : overlay}
      </div>
    );
  };

  it('portals into the in-tree boundary of the ambient provider', async () => {
    renderTooltip();

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByTestId('hint'))).toBe(true);
    });
  });

  it('portals to document.body when no provider is mounted', async () => {
    renderTooltip({}, false);

    await waitFor(() => {
      const content = screen.getByTestId('hint');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });

  it('honors an explicit container override', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    renderTooltip({ container: target });

    await waitFor(() => {
      expect(target.contains(screen.getByTestId('hint'))).toBe(true);
    });
    target.remove();
  });

  it("forces document.body with container='body', even under a provider", async () => {
    renderTooltip({ container: 'body' });

    await waitFor(() => {
      const content = screen.getByTestId('hint');
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });

  it('inherits the provider (not body) when container={null}', async () => {
    renderTooltip({ container: null });

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByTestId('hint'))).toBe(true);
    });
  });

  it('still forwards forceMount, the one prop the container Omit could have eaten', async () => {
    renderTooltip({ forceMount: true });

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByTestId('hint'))).toBe(true);
    });
  });

  it('portals into a ShadowRoot passed directly, the case the host actually has', async () => {
    // `PortalContainerOverride` admits DocumentFragment for this; a shadow root is the target the
    // whole feature exists for, and it used not to typecheck.
    const shadowHost = document.body.appendChild(document.createElement('div'));
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    renderTooltip({ container: shadowRoot });

    await waitFor(() => {
      expect(shadowRoot.querySelector('[data-testid="hint"]')).not.toBeNull();
    });
    shadowHost.remove();
  });
});

/**
 * ContextMenu and Drawer own their portal inside `*Content`, like Dialog/Sheet/AlertDialog, but
 * were left out of that fix — so they portalled to `document.body` regardless of the provider.
 */
describe('ContextMenu portal container', () => {
  const openMenu = (provider = true) => {
    const overlay = (
      <ContextMenu>
        <ContextMenuTrigger>Right-click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem data-testid="entry">Entry</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
    const result = render(
      <div data-testid="host">
        {provider ? <PortalContainerProvider>{overlay}</PortalContainerProvider> : overlay}
      </div>
    );
    // ContextMenu has no `open` prop — it opens on the contextmenu event.
    fireEvent.contextMenu(screen.getByText('Right-click'));
    return result;
  };

  it('portals into the in-tree boundary of the ambient provider', async () => {
    openMenu();

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByTestId('entry'))).toBe(true);
    });
  });

  it('portals to document.body when no provider is mounted', async () => {
    openMenu(false);

    await waitFor(() => {
      const entry = screen.getByTestId('entry');
      expect(document.body.contains(entry)).toBe(true);
      expect(screen.getByTestId('host').contains(entry)).toBe(false);
    });
  });
});

describe('Drawer portal container', () => {
  const renderDrawer = (provider = true) => {
    const overlay = (
      <Drawer open>
        <DrawerContent>
          <DrawerTitle data-testid="entry">Title</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );
    return render(
      <div data-testid="host">
        {provider ? <PortalContainerProvider>{overlay}</PortalContainerProvider> : overlay}
      </div>
    );
  };

  it('portals into the in-tree boundary of the ambient provider', async () => {
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByTestId('host').contains(screen.getByTestId('entry'))).toBe(true);
    });
  });

  it('portals to document.body when no provider is mounted', async () => {
    renderDrawer(false);

    await waitFor(() => {
      const entry = screen.getByTestId('entry');
      expect(document.body.contains(entry)).toBe(true);
      expect(screen.getByTestId('host').contains(entry)).toBe(false);
    });
  });
});
