'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import * as React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import {
  filterZoneGroups,
  formatOffset,
  getZoneGroups,
  localZone,
  zoneCity,
  zoneOffsetMinutes,
} from './timezones';

interface TimeZoneSelectProps {
  value: string;
  onChange: (zone: string) => void;
  /** The instant offsets are read at, so a zone shows its summer or winter offset as it applies. */
  at?: Date;
  'aria-labelledby'?: string;
  id?: string;
}

/**
 * An IANA timezone picked from a searchable list. A plain Select suits a shortlist, but every
 * zone the runtime knows is several hundred rows, which needs a search to be a choice.
 */
export function TimeZoneSelect({
  value,
  onChange,
  at,
  id,
  'aria-labelledby': ariaLabelledBy,
}: TimeZoneSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const atTime = at?.getTime();

  // One offset per zone, built only while the list is open: formatting several hundred zones on
  // every keystroke, or on every render of a closed picker, is slow.
  const offsets = React.useMemo(() => {
    const map = new Map<string, string>();
    if (!open) return map;
    const instant = atTime === undefined ? new Date() : new Date(atTime);
    for (const { zones } of getZoneGroups()) {
      for (const zone of zones) map.set(zone, formatOffset(zoneOffsetMinutes(zone, instant)));
    }
    return map;
  }, [open, atTime]);
  const offsetOf = (zone: string) => offsets.get(zone) ?? formatOffset(zoneOffsetMinutes(zone, at));

  const groups = React.useMemo(
    () => (open ? filterZoneGroups(search, (zone) => offsets.get(zone) ?? '') : []),
    [open, search, offsets]
  );
  const local = React.useMemo(() => localZone(), []);

  const pick = (zone: string) => {
    onChange(zone);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-labelledby={ariaLabelledBy}
          className={cn(
            'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:hover:bg-surface-hover future:px-4 future:gap-4'
          )}
        >
          <Globe className="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{zoneCity(value)}</span>
          <span className="shrink-0 text-xs text-foreground-muted">{offsetOf(value)}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Timezones"
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
      >
        <Command loop shouldFilter={false} label="Search timezones">
          <CommandInput
            placeholder="Search city, region or offset"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-64">
            <CommandEmpty className="px-3 py-2 text-sm text-foreground-muted">
              No timezones match.
            </CommandEmpty>
            {/* The viewer's own zone first, only while nothing is searched: it is the answer often
                enough to be worth not scrolling for. */}
            {!search && (
              <CommandGroup heading="Your timezone">
                <ZoneRow
                  zone={local}
                  offset={offsetOf(local)}
                  selected={value === local}
                  onSelect={() => pick(local)}
                  itemValue={`local:${local}`}
                />
              </CommandGroup>
            )}
            {groups.map(({ label, zones }) => (
              <CommandGroup key={label} heading={label}>
                {zones.map((zone) => (
                  <ZoneRow
                    key={zone}
                    zone={zone}
                    offset={offsetOf(zone)}
                    selected={value === zone}
                    onSelect={() => pick(zone)}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ZoneRow({
  zone,
  offset,
  selected,
  onSelect,
  itemValue,
}: {
  zone: string;
  offset: string;
  selected: boolean;
  onSelect: () => void;
  itemValue?: string;
}) {
  return (
    <CommandItem value={itemValue ?? zone} title={zone} onSelect={onSelect}>
      <Check
        className={cn('shrink-0', selected ? 'opacity-100' : 'opacity-0')}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{zoneCity(zone)}</span>
      <span className="shrink-0 text-xs text-foreground-muted">{offset}</span>
    </CommandItem>
  );
}
