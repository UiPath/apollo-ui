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
import type { PortalContainerOverride } from '@/components/ui/portal-container';
import { cn } from '@/lib';
import {
  filterZoneGroups,
  formatOffset,
  localZone,
  sameZone,
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
  /** Shows the zone without letting it change. */
  disabled?: boolean;
  /** Where the list portals to, so it stays inside the date-time picker's own container. */
  container?: PortalContainerOverride;
}

// Rows mounted when the list opens, and added each time the reader scrolls near the end. Every
// zone at once is several hundred command items, a long task on each open.
const ROW_BATCH = 60;

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
  disabled,
  container,
}: TimeZoneSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  // Without `at`, offsets are read at the moment the list last opened, so a picker that stays
  // mounted across a daylight saving change shows the new offsets the next time it opens.
  const [openedAt, setOpenedAt] = React.useState(() => Date.now());
  const atTime = at?.getTime() ?? openedAt;

  // Offsets are formatted as rows need them and kept for the instant, rather than for every zone
  // up front: only the mounted rows, plus every zone when a search is for an offset.
  const offsetOf = React.useMemo(() => {
    const instant = new Date(atTime);
    const offsets = new Map<string, string>();
    return (zone: string) => {
      let offset = offsets.get(zone);
      if (offset === undefined) {
        offset = formatOffset(zoneOffsetMinutes(zone, instant));
        offsets.set(zone, offset);
      }
      return offset;
    };
  }, [atTime]);

  const groups = React.useMemo(
    () => (open ? filterZoneGroups(search, offsetOf) : []),
    [open, search, offsetOf]
  );
  const local = React.useMemo(() => localZone(), []);

  // A new search or a reopened list starts from the first batch again.
  const [rowLimit, setRowLimit] = React.useState(ROW_BATCH);
  const [limitFor, setLimitFor] = React.useState({ open, search });
  if (limitFor.open !== open || limitFor.search !== search) {
    setLimitFor({ open, search });
    setRowLimit(ROW_BATCH);
  }
  const totalRows = groups.reduce((count, group) => count + group.zones.length, 0);
  // Without IntersectionObserver (older engines, jsdom) nothing would load the rest, so every row
  // mounts at once as before.
  const batched = typeof IntersectionObserver !== 'undefined';
  const shownGroups = React.useMemo(() => {
    if (!batched) return groups;
    let left = rowLimit;
    const shown: typeof groups = [];
    for (const group of groups) {
      if (left <= 0) break;
      shown.push({ label: group.label, zones: group.zones.slice(0, left) });
      left -= group.zones.length;
    }
    return shown;
  }, [groups, rowLimit, batched]);
  const hasMore = batched && rowLimit < totalRows;

  // Mounts the next batch as the end of the list scrolls into view, by mouse or by the arrow keys,
  // which scroll the active row into view. Kept in state rather than a ref: the list mounts with
  // the popover, after this component's own effects run.
  const [sentinel, setSentinel] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setRowLimit((limit) => limit + ROW_BATCH);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel]);

  // The runtime may list a renamed zone under its other spelling. Picking the zone already chosen
  // keeps the value's spelling rather than swapping it for the list's.
  const pick = (zone: string) => {
    onChange(sameZone(zone, value) ? value : zone);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOpenedAt(Date.now());
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-labelledby={ariaLabelledBy}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
        container={container}
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
                  selected={sameZone(value, local)}
                  onSelect={() => pick(local)}
                  itemValue={`local:${local}`}
                />
              </CommandGroup>
            )}
            {shownGroups.map(({ label, zones }) => (
              <CommandGroup key={label} heading={label}>
                {zones.map((zone) => (
                  <ZoneRow
                    key={zone}
                    zone={zone}
                    offset={offsetOf(zone)}
                    selected={sameZone(value, zone)}
                    onSelect={() => pick(zone)}
                  />
                ))}
              </CommandGroup>
            ))}
            {hasMore && <div ref={setSentinel} aria-hidden="true" className="h-px" />}
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
