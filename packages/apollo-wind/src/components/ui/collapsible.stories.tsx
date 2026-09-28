import type { Meta } from '@storybook/react-vite';
import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Components/Data Display/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An interactive component which expands and collapses a panel. ' +
          'For a stacked set of expandable sections, see the Accordion component.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Basic (Uncontrolled)
// ============================================================================

export const Basic = {
  name: 'Basic (Uncontrolled)',
  render: () => (
    <Collapsible defaultOpen className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 font-mono text-sm">@radix-ui/primitives</div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 font-mono text-sm">@radix-ui/colors</div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">@stitches/react</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

// ============================================================================
// Controlled
// ============================================================================

function ControlledCollapsibleExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-[350px] space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Collapse' : 'Expand'} from outside
        </Button>
        <span className="text-sm text-muted-foreground">State: {open ? 'open' : 'closed'}</span>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
        <div className="flex items-center justify-between space-x-4 rounded-md border px-4 py-2">
          <h4 className="text-sm font-semibold">Advanced settings</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 text-sm">Retry policy: exponential</div>
          <div className="rounded-md border px-4 py-3 text-sm">Timeout: 30 seconds</div>
          <div className="rounded-md border px-4 py-3 text-sm">Log level: verbose</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export const Controlled = {
  name: 'Controlled',
  render: () => <ControlledCollapsibleExample />,
};

// ============================================================================
// Disabled
// ============================================================================

export const Disabled = {
  name: 'Disabled',
  render: () => (
    <Collapsible disabled className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 rounded-md border px-4 py-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Locked section</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0" disabled>
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="rounded-md border px-4 py-3 text-sm">This content cannot be revealed.</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
