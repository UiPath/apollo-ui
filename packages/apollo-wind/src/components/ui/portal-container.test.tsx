import { render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './alert-dialog';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PortalContainerProvider, useResolvedPortalContainer } from './portal-container';
import { Sheet, SheetContent, SheetTitle } from './sheet';

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
    props: { container?: HTMLElement | 'body' | null } = {},
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
