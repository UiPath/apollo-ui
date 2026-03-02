import type { Meta } from '@storybook/react-vite';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Combobox, ComboboxItem } from './combobox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib';

const meta: Meta<typeof Combobox> = {
  title: 'Components/Core/Combobox',
  component: Combobox,
  tags: ['autodocs'],
};

export default meta;

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const frameworks: ComboboxItem[] = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'gatsby', label: 'Gatsby' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue' },
];

const countries: ComboboxItem[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'au', label: 'Australia' },
  { value: 'ca', label: 'Canada' },
  { value: 'br', label: 'Brazil' },
];

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => {
    const [value, setValue] = React.useState('');

    return (
      <Combobox
        items={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search frameworks..."
      />
    );
  },
};

// ============================================================================
// Combobox Multi-select
// ============================================================================

function MultiSelectCombobox() {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggle = (val: string) => {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const remove = (val: string) => {
    setSelected((prev) => prev.filter((v) => v !== val));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[320px] justify-between"
          >
            {selected.length > 0
              ? `${selected.length} selected`
              : 'Select frameworks...'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search frameworks..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((item) => (
                  <CommandItem key={item.value} value={item.value} onSelect={() => toggle(item.value)}>
                    {item.label}
                    <Check className={cn('ml-auto', selected.includes(item.value) ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((val) => {
            const item = frameworks.find((f) => f.value === val);
            return (
              <Badge key={val} variant="secondary" className="gap-1">
                {item?.label}
                <button onClick={() => remove(val)} className="ml-0.5 rounded-full hover:bg-muted">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ComboboxMultiSelect = {
  name: 'Combobox Multi-select',
  render: () => <MultiSelectCombobox />,
};

// ============================================================================
// Combobox with Custom Display
// ============================================================================

function CustomDisplayCombobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  type EnrichedItem = { value: string; label: string; emoji: string; desc: string };

  const items: EnrichedItem[] = [
    { value: 'bug', label: 'Bug', emoji: '🐛', desc: 'Something is broken' },
    { value: 'feature', label: 'Feature', emoji: '✨', desc: 'New functionality' },
    { value: 'improvement', label: 'Improvement', emoji: '🔧', desc: 'Enhance existing feature' },
    { value: 'docs', label: 'Documentation', emoji: '📝', desc: 'Update documentation' },
    { value: 'performance', label: 'Performance', emoji: '⚡', desc: 'Speed improvement' },
  ];

  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[320px] justify-between">
          {selected ? (
            <span className="flex items-center gap-2">
              <span>{selected.emoji}</span>
              <span>{selected.label}</span>
            </span>
          ) : (
            'Select issue type...'
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search types..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(v) => { setValue(v === value ? '' : v); setOpen(false); }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Check className={cn('ml-auto', value === item.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const ComboboxWithCustomDisplay = {
  name: 'Combobox with Custom Display',
  render: () => <CustomDisplayCombobox />,
};

// ============================================================================
// Combobox Async
// ============================================================================

function AsyncCombobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<ComboboxItem[]>([]);

  const allItems: ComboboxItem[] = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
    { value: 'preact', label: 'Preact' },
    { value: 'lit', label: 'Lit' },
    { value: 'alpine', label: 'Alpine.js' },
    { value: 'htmx', label: 'HTMX' },
    { value: 'qwik', label: 'Qwik' },
  ];

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timeout = setTimeout(() => {
      const filtered = allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const selected = allItems.find((i) => i.value === value);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Simulates a 500ms async search delay.</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[280px] justify-between">
            {selected ? selected.label : 'Search libraries...'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Type to search..." value={query} onValueChange={setQuery} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(v) => { setValue(v === value ? '' : v); setOpen(false); }}
                    >
                      {item.label}
                      <Check className={cn('ml-auto', value === item.value ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const ComboboxAsync = {
  name: 'Combobox Async',
  render: () => <AsyncCombobox />,
};

// ============================================================================
// Combobox Disabled
// ============================================================================

export const ComboboxDisabled = {
  name: 'Combobox Disabled',
  render: () => {
    const [value, setValue] = React.useState('next.js');

    return (
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm">With value (disabled)</Label>
          <Combobox
            items={frameworks}
            value={value}
            onValueChange={setValue}
            placeholder="Select framework..."
            disabled
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Empty (disabled)</Label>
          <Combobox
            items={frameworks}
            value=""
            onValueChange={() => {}}
            placeholder="Select framework..."
            disabled
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => {
    const [framework, setFramework] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [role, setRole] = React.useState('');

    const roles: ComboboxItem[] = [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
      { value: 'viewer', label: 'Viewer' },
      { value: 'developer', label: 'Developer' },
      { value: 'designer', label: 'Designer' },
    ];

    return (
      <div className="flex flex-col gap-8">
        {/* Form field */}
        <div>
          <p className="text-sm font-medium mb-3">Form Field</p>
          <div className="grid max-w-sm gap-4">
            <div className="space-y-1.5">
              <Label>Framework</Label>
              <Combobox
                items={frameworks}
                value={framework}
                onValueChange={setFramework}
                placeholder="Select framework..."
                searchPlaceholder="Search frameworks..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Combobox
                items={countries}
                value={country}
                onValueChange={setCountry}
                placeholder="Select country..."
                searchPlaceholder="Search countries..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Combobox
                items={roles}
                value={role}
                onValueChange={setRole}
                placeholder="Select role..."
                searchPlaceholder="Search roles..."
              />
            </div>
          </div>
        </div>

        {/* Inline filters */}
        <div>
          <p className="text-sm font-medium mb-3">Inline Filters</p>
          <div className="flex items-center gap-2">
            <Combobox
              items={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
              value=""
              onValueChange={() => {}}
              placeholder="Status"
              className="w-[150px]"
            />
            <Combobox
              items={roles}
              value=""
              onValueChange={() => {}}
              placeholder="Role"
              className="w-[150px]"
            />
            <Combobox
              items={countries}
              value=""
              onValueChange={() => {}}
              placeholder="Region"
              className="w-[150px]"
            />
          </div>
        </div>
      </div>
    );
  },
};
