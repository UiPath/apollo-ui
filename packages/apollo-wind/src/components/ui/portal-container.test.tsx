import { render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PortalContainerProvider, useResolvedPortalContainer } from './portal-container';

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
 * DropdownMenu, so these cases cover all three overlays.
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
