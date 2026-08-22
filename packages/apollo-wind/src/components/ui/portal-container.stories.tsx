import type { Meta } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { PortalContainerProvider } from './portal-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const meta: Meta<typeof PortalContainerProvider> = {
  title: 'Components/Overlays/Portal Container',
  component: PortalContainerProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'By default, Radix overlays (Popover, Select, DropdownMenu) portal their content into ' +
          'document.body. That breaks inside shadow DOM or focus-trapped hosts, where body-level ' +
          'content escapes the root. PortalContainerProvider redirects those portals into its own ' +
          'subtree (or an explicit container you own), keeping overlay DOM inside the same root ' +
          'as the trigger. Mount one provider per React root.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Default vs Provider
// ============================================================================

export const DefaultVsProvider = {
  name: 'Default vs Provider',
  render: () => (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="space-y-2">
        <p className="text-sm font-medium">Without provider</p>
        <p className="text-sm text-muted-foreground">
          The popover content portals into document.body. Inspect the DOM while it is open: the
          overlay lives outside this subtree.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover (body portal)</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm">
            This content is portaled into document.body, the Radix default.
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">With PortalContainerProvider</p>
        <p className="text-sm text-muted-foreground">
          The same popover now portals into an in-tree boundary rendered by the provider, so the
          overlay DOM stays inside the provider subtree.
        </p>
        <PortalContainerProvider>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover (in-tree portal)</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm">
              This content is portaled into the provider boundary, not document.body.
            </PopoverContent>
          </Popover>
        </PortalContainerProvider>
      </div>
    </div>
  ),
};

// ============================================================================
// Explicit Container
// ============================================================================

function ExplicitContainerExample() {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <p className="text-sm text-muted-foreground">
        Pass a container element you own to portal overlays into a specific node. Open the popover
        or select below, then inspect the outlined box: the overlay DOM is appended inside it.
      </p>
      <PortalContainerProvider container={container}>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 text-sm">
              Rendered inside the custom container.
            </PopoverContent>
          </Popover>
          <Select>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PortalContainerProvider>
      <div
        ref={setContainer}
        className="relative min-h-[80px] rounded-md border border-dashed border-primary/50 p-3"
      >
        <span className="text-xs text-muted-foreground">
          Custom portal container: overlay content is appended here while open.
        </span>
      </div>
    </div>
  );
}

export const ExplicitContainer = {
  name: 'Explicit Container',
  render: () => <ExplicitContainerExample />,
};

// ============================================================================
// Per-Overlay Override
// ============================================================================

export const PerOverlayOverride = {
  name: 'Per-Overlay Override',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <p className="text-sm text-muted-foreground">
        Individual overlays can opt out of the ambient provider. Passing container="body" on
        PopoverContent forces the Radix default (document.body) even inside a provider.
      </p>
      <PortalContainerProvider>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Inherits provider</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 text-sm">
              Portaled into the provider boundary.
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Forces body</Button>
            </PopoverTrigger>
            <PopoverContent container="body" className="w-56 text-sm">
              Portaled into document.body via container="body".
            </PopoverContent>
          </Popover>
        </div>
      </PortalContainerProvider>
    </div>
  ),
};
