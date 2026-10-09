import type { Meta } from '@storybook/react-vite';
import { Copy, Ellipsis, GripVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import {
  CollapsibleBox,
  CollapsibleBoxActions,
  CollapsibleBoxContent,
  CollapsibleBoxHeader,
  CollapsibleBoxTrigger,
} from './collapsible-box';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { FormFieldError } from './form-field';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta: Meta<typeof CollapsibleBox> = {
  title: 'Components/Layout/Collapsible Box',
  component: CollapsibleBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A bordered, collapsible box with a header, optional actions and a body, for grouping related content. ' +
          'The header holds a chevron, a title and optional actions such as a more-actions menu. ' +
          'Use it wherever related content needs stronger grouping than a section heading gives, ' +
          'for example a set of fields in a properties panel.',
      },
    },
  },
};

export default meta;

function MoreActionsMenu({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="3xs" icon aria-label={`${label} actions`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-error focus:text-error">
          <Trash2 /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <CollapsibleBox className="w-[420px]">
      <CollapsibleBoxHeader>
        <CollapsibleBoxTrigger>Retry policy</CollapsibleBoxTrigger>
        <CollapsibleBoxActions>
          <MoreActionsMenu label="Retry policy" />
        </CollapsibleBoxActions>
      </CollapsibleBoxHeader>
      <CollapsibleBoxContent>
        <Input aria-label="Max attempts" placeholder="Max attempts" />
        <Input aria-label="Delay in seconds" placeholder="Delay in seconds" />
      </CollapsibleBoxContent>
    </CollapsibleBox>
  ),
};

// ============================================================================
// Collapsed
// ============================================================================

export const Collapsed = {
  name: 'Collapsed by default',
  render: () => (
    <CollapsibleBox defaultOpen={false} className="w-[420px]">
      <CollapsibleBoxHeader>
        <CollapsibleBoxTrigger>Advanced settings</CollapsibleBoxTrigger>
      </CollapsibleBoxHeader>
      <CollapsibleBoxContent>
        <Input aria-label="Internal identifier" placeholder="Internal identifier" />
      </CollapsibleBoxContent>
    </CollapsibleBox>
  ),
};

// ============================================================================
// Controlled
// ============================================================================

function ControlledExample() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="grid w-[420px] gap-3">
      <Button variant="outline" size="xs" className="w-fit" onClick={() => setOpen(!open)}>
        {open ? 'Collapse' : 'Expand'} from outside
      </Button>
      <CollapsibleBox open={open} onOpenChange={setOpen}>
        <CollapsibleBoxHeader>
          <CollapsibleBoxTrigger>Output mapping</CollapsibleBoxTrigger>
        </CollapsibleBoxHeader>
        <CollapsibleBoxContent>
          <Input aria-label="Output variable" placeholder="Output variable" />
        </CollapsibleBoxContent>
      </CollapsibleBox>
    </div>
  );
}

export const Controlled = {
  name: 'Controlled',
  render: () => <ControlledExample />,
};

// ============================================================================
// Filters
// ============================================================================

function FilterCondition({ invalid = false }: { invalid?: boolean }) {
  const errorId = React.useId();
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <GripVertical aria-hidden="true" className="size-4 shrink-0 text-foreground-subtle" />
        <Checkbox aria-label="Select condition" />
        <Select>
          <SelectTrigger
            className="w-32 shrink-0"
            aria-label="Field"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
          >
            <SelectValue placeholder="Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger
            className="w-32 shrink-0"
            aria-label="Operand"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
          >
            <SelectValue placeholder="Operand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="min-w-0 flex-1"
          aria-label="Value or expression"
          placeholder="Value or expression"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
        />
        <Button variant="ghost" size="2xs" icon aria-label="Delete condition">
          <Trash2 />
        </Button>
      </div>
      {invalid && (
        <FormFieldError id={errorId} className="pl-12">
          Select a field and a condition
        </FormFieldError>
      )}
    </div>
  );
}

export const Filters = {
  name: 'Filters',
  render: () => (
    <CollapsibleBox className="w-[640px]">
      <CollapsibleBoxHeader>
        <CollapsibleBoxTrigger>Filters</CollapsibleBoxTrigger>
        <CollapsibleBoxActions>
          <MoreActionsMenu label="Filters" />
        </CollapsibleBoxActions>
      </CollapsibleBoxHeader>
      <CollapsibleBoxContent>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" defaultValue="and" aria-label="Match">
            <ToggleGroupItem value="and">And</ToggleGroupItem>
            <ToggleGroupItem value="or">Or</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-sm text-foreground-muted">of the following are met:</span>
        </div>
        <FilterCondition />
        <FilterCondition invalid />
        <div className="flex gap-2">
          <Button variant="text" size="2xs">
            <Plus /> Add condition
          </Button>
          <Button variant="text" size="2xs">
            <Plus /> Add group
          </Button>
        </div>
      </CollapsibleBoxContent>
    </CollapsibleBox>
  ),
};
