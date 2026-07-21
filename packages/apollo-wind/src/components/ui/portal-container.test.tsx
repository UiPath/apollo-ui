import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PortalContainerProvider } from './portal-container';

/**
 * Popover is used as the vehicle here, but the resolution logic is shared by
 * Select and DropdownMenu, so these cases cover all three overlays.
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

  it('lets an explicit container prop override the provider', async () => {
    const Harness = () => {
      const [target, setTarget] = React.useState<HTMLElement | null>(null);
      return (
        <PortalContainerProvider>
          <div data-testid="custom" ref={setTarget} />
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            {target && <PopoverContent container={target}>Menu</PopoverContent>}
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

  it('falls back to document.body when container={null}, even under a provider', async () => {
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
      expect(document.body.contains(content)).toBe(true);
      expect(screen.getByTestId('host').contains(content)).toBe(false);
    });
  });
});
