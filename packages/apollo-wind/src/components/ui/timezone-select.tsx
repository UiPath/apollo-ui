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
// Rows PageUp and PageDown move the active row by, about one screen of the list.
const PAGE_ROWS = 8;

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

  // The active row, held here rather than in cmdk so the keys below can move it onto a row that is
  // only about to mount. cmdk navigates mounted rows alone: left to itself, ArrowDown would stop
  // at (or, looping, wrap from) the last mounted one.
  const [active, setActive] = React.useState('');
  // The row to bring into view after the keys below (or opening the list) moved onto it. A new
  // object each time, so the same row asked for twice still scrolls.
  const [scrollTarget, setScrollTarget] = React.useState<{ zone: string } | null>(null);
  const activate = (zone: string) => {
    setActive(zone);
    setScrollTarget({ zone });
  };

  // A new search starts from the first batch again. Opening the list opens it on the selected
  // zone: the batches up to its row mount, it becomes the active row and scrolls into view, so the
  // keys move on from there rather than from a row left over from the last time it was open.
  const [rowLimit, setRowLimit] = React.useState(ROW_BATCH);
  const [limitFor, setLimitFor] = React.useState({ open, search });
  if (limitFor.open !== open || limitFor.search !== search) {
    setLimitFor({ open, search });
    let limit = ROW_BATCH;
    if (open && !search) {
      // The viewer's own row comes first when it is the selected one; otherwise its row in the
      // list, or the first row when the value isn't listed.
      const zones = groups.flatMap((group) => group.zones);
      const index = sameZone(value, local) ? -1 : zones.findIndex((zone) => sameZone(zone, value));
      if (index >= 0) limit = Math.ceil((index + 1) / ROW_BATCH) * ROW_BATCH;
      activate(index >= 0 ? zones[index] : `local:${local}`);
    } else if (!open) {
      setActive('');
      setScrollTarget(null);
    }
    setRowLimit(limit);
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
  // Every row in list order, mounted or not, so the keyboard can reach rows past the mounted ones.
  const allZones = React.useMemo(() => groups.flatMap((group) => group.zones), [groups]);

  const listRef = React.useRef<HTMLDivElement>(null);
  // Makes a row active by its place in the whole list, mounting the batches up to it first.
  const moveTo = (index: number) => {
    const target = Math.min(Math.max(index, 0), allZones.length - 1);
    if (target < 0) return;
    if (batched && target >= rowLimit) {
      setRowLimit(Math.ceil((target + 1) / ROW_BATCH) * ROW_BATCH);
    }
    activate(allZones[target]);
  };
  const firstRow = !search ? `local:${local}` : allZones[0];
  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || allZones.length === 0) return;
    // The viewer's own row sits above the list, at -1.
    const index = allZones.indexOf(active);
    const lastMounted = Math.min(rowLimit, allZones.length) - 1;
    const down =
      event.key === 'ArrowDown' || (event.ctrlKey && (event.key === 'n' || event.key === 'j'));
    let target: number | undefined;
    if (event.key === 'End' || (down && event.metaKey)) {
      target = allZones.length - 1;
    } else if (event.key === 'PageDown') {
      target = index + PAGE_ROWS;
    } else if (event.key === 'PageUp') {
      if (index - PAGE_ROWS < 0) {
        event.preventDefault();
        activate(firstRow);
        return;
      }
      target = index - PAGE_ROWS;
    } else if (down && event.altKey && hasMore) {
      // The next group, which may not be mounted yet.
      const group = groups.findIndex((g) => g.zones.includes(active));
      const next = groups[group + 1];
      if (group !== -1 && next && allZones.indexOf(next.zones[0]) > lastMounted) {
        target = allZones.indexOf(next.zones[0]);
      }
    } else if (down && !event.altKey && hasMore && index === lastMounted) {
      target = index + 1;
    }
    if (target === undefined) return;
    // Handled here, so cmdk's own handling of the key doesn't run as well.
    event.preventDefault();
    moveTo(target);
  };

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

  // Picking the zone already chosen, under either spelling (the runtime may list a renamed zone
  // under its other one) or any alias, changes nothing, so it only closes the list. A change
  // reported for it would have the date-time picker rebuild the instant from its wall clock, which
  // in a repeated daylight saving hour can move it to the other occurrence.
  const pick = (zone: string) => {
    if (!sameZone(zone, value)) onChange(zone);
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
        {/* Wrapping from the last row to the first only once every row is mounted, so ArrowDown
            at the last mounted row loads the next batch instead of jumping back to the top. */}
        <Command
          loop={!hasMore}
          shouldFilter={false}
          label="Search timezones"
          value={active}
          onValueChange={setActive}
          onKeyDown={onListKeyDown}
        >
          <CommandInput
            placeholder="Search city, region or offset"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList ref={listRef} className="max-h-64">
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
            <ScrollRowIntoView listRef={listRef} target={scrollTarget} />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Scrolls the asked-for row into view. Rendered inside the list, after its rows, so its effect
 * runs once they are in the document, including on the open that mounts the list (in the
 * popover's portal, a render after the one that asked). Found by its cmdk value rather than by
 * cmdk's selected mark, which cmdk sets in a render of its own.
 */
function ScrollRowIntoView({
  listRef,
  target,
}: {
  listRef: React.RefObject<HTMLDivElement | null>;
  target: { zone: string } | null;
}) {
  React.useEffect(() => {
    if (!target) return;
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[cmdk-item]') ?? [];
    for (const row of rows) {
      if (row.getAttribute('data-value') === target.zone) {
        row.scrollIntoView({ block: 'nearest' });
        return;
      }
    }
  }, [listRef, target]);
  return null;
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
