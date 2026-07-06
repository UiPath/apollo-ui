import type { Meta, StoryObj } from '@storybook/react-vite';
import { Lock, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Command, CommandGroup, CommandItem, CommandList } from './command';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta = {
  title: 'Components/Core/Input Group',
  component: InputGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
      description:
        'Visual style, matches Input. Ghost removes the border and sets a surface background.',
    },
    size: {
      control: 'select',
      options: ['default', 'xs'],
      description: 'Height and text size, matches Input.',
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLeadingIcon: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <Search className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search fields..." />
    </InputGroup>
  ),
};

export const Clearable: Story = {
  render: () => {
    const [value, setValue] = useState('Pre-filled value');
    return (
      <InputGroup className="w-72">
        <InputGroupInput value={value} onChange={(e) => setValue(e.target.value)} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton icon size="3xs" aria-label="Clear value" onClick={() => setValue('')}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
};

const LOCK_OPTIONS = [
  { id: 'input', label: 'Input' },
  { id: 'output', label: 'Output' },
  { id: 'variable', label: 'Process variable' },
];

export const LockedFieldWithPopover: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [bound, setBound] = useState<string | null>(null);

    return (
      <InputGroup className="w-72">
        <InputGroupAddon align="inline-start">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton icon size="3xs" aria-label="Lock field to a value">
                <Lock />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-1">
              <Command>
                <CommandList>
                  <CommandGroup heading="Bind to">
                    {LOCK_OPTIONS.map((option) => (
                      <CommandItem
                        key={option.id}
                        onSelect={() => {
                          setBound(option.label);
                          setOpen(false);
                        }}
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
        <InputGroupInput
          readOnly
          value={bound ?? ''}
          placeholder="Click the lock to bind a value"
        />
      </InputGroup>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <Lock className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Disabled" disabled />
    </InputGroup>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-72 items-center gap-1.5">
      <Label htmlFor="bound-field">Value</Label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Lock className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput id="bound-field" placeholder="Click the lock to bind a value" />
      </InputGroup>
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <InputGroup size="xs" className="w-72">
      <InputGroupAddon align="inline-start">
        <Search className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
};
