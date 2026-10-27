import {
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { ChevronDown, Folder, FolderOpen, Loader2, Plus, Search, X } from 'lucide-react';
import { type FocusEvent, type KeyboardEvent, useId, useMemo, useRef, useState } from 'react';
import { GuardrailPaletteItem } from './components/guardrail-palette-item';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { GuardrailStatusChip } from './components/guardrail-status-chip';
import { isByoGuardrailDefinition } from './definitions-enrich';
import {
  filterGuardrailPaletteGroups,
  getGuardrailPaletteItemId,
  groupGuardrailsForPalette,
} from './guardrail-palette-utils';
import { type GuardrailPaletteLabels, useGuardrailPaletteLabels } from './i18n';
import type { GuardrailPaletteDefinition, GuardrailPaletteSource } from './palette-types';

export interface GuardrailPaletteProps<
  T extends GuardrailPaletteDefinition = GuardrailPaletteDefinition,
> {
  /**
   * Already filtered by the host: flags, entitlements, `FeatureDisabled` / `Disabled` removal
   * and scope filtering never cross this boundary. The palette offers everything it is given.
   */
  ootbDefinitions: T[];
  /** The builder, the default name and telemetry stay host-side. */
  onSelectOotb: (definition: T) => void;
  /**
   * Its *presence* renders the create-custom entry, so a host offering it conditionally (Flow,
   * for `scope === 'Tool'`) passes it conditionally and Agents omits it for its own header.
   */
  onCreateCustom?: () => void;
  isLoading?: boolean;
  /** Transport failure, shaped like `useGuardrailDefinitions`' `error`. */
  error?: Error | null;
  /** Product lifecycle, not a package concern. */
  previewChip?: boolean;
  /**
   * Present bring-your-own entries as both products' legacy palettes do: named by their
   * configuration (`byoValidatorName`) and sorted by it, with a "BYO" chip in place of the
   * connector-name chip and an italic "Provider: {connector}" caption.
   */
  byoDisplay?: boolean;
  /**
   * A search field above the entries, matching what each entry shows: its name, description,
   * connector and folder. On by default; `false` leaves it out.
   */
  searchable?: boolean;
  /**
   * An All / UiPath / BYO dropdown beside the search field, each option counting what the
   * search left. Rendered only while the catalog holds both kinds, since there is nothing to
   * split otherwise. Its menu portals, so a shadow-root host wraps the palette in wind's
   * `PortalContainerProvider`. On by default; `false` leaves it out.
   */
  sourceFilter?: boolean;
  labels?: Partial<GuardrailPaletteLabels>;
  className?: string;
}

const SOURCES: readonly GuardrailPaletteSource[] = ['all', 'uipath', 'byo'];

const ENTRY_SELECTOR = '[data-slot="guardrail-palette-item"]';
// Everything in the roving order, in document order: group headings and entries.
const ROVING_SELECTOR = `${ENTRY_SELECTOR}, [data-slot="guardrail-palette-group-toggle"]`;

/** Chips after an entry's name. Both tones are the colours the two products already ship. */
function definitionChips(
  definition: GuardrailPaletteDefinition,
  labels: Required<GuardrailPaletteLabels>,
  previewChip: boolean,
  byoDisplay: boolean
) {
  return (
    <>
      {byoDisplay
        ? isByoGuardrailDefinition(definition) && (
            <GuardrailStatusChip tone="success">{labels.byo}</GuardrailStatusChip>
          )
        : definition.byoConnectorName !== undefined && (
            <GuardrailStatusChip tone="success">{definition.byoConnectorName}</GuardrailStatusChip>
          )}
      {previewChip && definition.isPreview !== false && (
        <GuardrailStatusChip tone="info">{labels.preview}</GuardrailStatusChip>
      )}
      {definition.status === 'Unauthorised' && (
        <GuardrailStatusChip tone="warning">{labels.statusUnauthorized}</GuardrailStatusChip>
      )}
    </>
  );
}

/** A BYO entry's configuration name under `byoDisplay`; any other entry's display name. */
function paletteEntryName(definition: GuardrailPaletteDefinition): string {
  return definition.byoValidatorName ?? definition.displayName;
}

/**
 * The add-guardrail picker: the definitions a user may add, grouped, with an optional
 * create-custom entry.
 *
 * The picker only. Flow opens it in a dialog or an inline overlay and Agents takes over the
 * whole sidebar, so the shell is host orchestration; the stories show both.
 */
export function GuardrailPalette<T extends GuardrailPaletteDefinition>({
  ootbDefinitions,
  onSelectOotb,
  onCreateCustom,
  isLoading = false,
  error = null,
  previewChip = false,
  byoDisplay = false,
  searchable = true,
  sourceFilter = true,
  labels: labelOverrides,
  className,
}: GuardrailPaletteProps<T>) {
  const labels = useGuardrailPaletteLabels(labelOverrides);
  const headerIdPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeEntry, setActiveEntry] = useState(0);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<GuardrailPaletteSource>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set());
  // Radix hands focus back to the source trigger when its menu closes, and that focus counts as
  // `:focus-visible` (its pointerdown is prevented, so no mouse focus is recorded). After a
  // pointer pick, the ring is held back until the next key press, or until focus leaves.
  const [sourcePointerFocus, setSourcePointerFocus] = useState(false);
  const sourceOpenRef = useRef(false);

  const getName = byoDisplay ? paletteEntryName : undefined;

  const groups = useMemo(
    () => groupGuardrailsForPalette(ootbDefinitions, labels.uipathGroup, getName),
    [ootbDefinitions, labels.uipathGroup, getName]
  );

  const showSourceFilter =
    sourceFilter && groups.some((group) => group.isByo) && groups.some((group) => !group.isByo);
  // A source picked before the catalog lost one side would otherwise hide every entry.
  const activeSource = showSourceFilter ? source : 'all';
  const showControls = (searchable || showSourceFilter) && groups.length > 0;

  // Search first, so each source option can count what the search left on its side.
  const searchedGroups = useMemo(
    () => (searchable ? filterGuardrailPaletteGroups(groups, { query }, getName) : groups),
    [groups, searchable, query, getName]
  );
  const visibleGroups = useMemo(
    () => filterGuardrailPaletteGroups(searchedGroups, { source: activeSource }),
    [searchedGroups, activeSource]
  );
  const sourceCounts = useMemo(() => {
    let all = 0;
    let byo = 0;
    for (const group of searchedGroups) {
      all += group.definitions.length;
      if (group.isByo) byo += group.definitions.length;
    }
    return { all, uipath: all - byo, byo };
  }, [searchedGroups]);

  const sourceLabels: Record<GuardrailPaletteSource, string> = {
    all: labels.sourceAll,
    uipath: labels.sourceUipath,
    byo: labels.byo,
  };

  // With a create-custom entry there is still something to pick, so "no guardrails available"
  // would contradict what is on screen.
  const isEmpty = groups.length === 0 && onCreateCustom === undefined;
  // The catalog has entries and the controls hid them all. Said even beside create-custom,
  // because it answers the search rather than the catalog.
  const hasNoMatches = groups.length > 0 && visibleGroups.length === 0;

  // Roving focus, so Tab enters and leaves the palette instead of walking a user through the
  // create-custom entry, six validators and every BYO group. `aria-disabled` entries keep
  // their place on purpose, which is also why this is not wind's `Command`: cmdk's item query
  // skips them. The flat index runs create-custom first, then each group's heading (when it
  // has one) and, unless the group is folded, its entries.
  const roving = useMemo(() => {
    let offset = onCreateCustom ? 1 : 0;
    const groupLayout = visibleGroups.map((group) => {
      const headed = group.header !== null;
      const collapsed = headed && collapsedGroups.has(group.key);
      const headerIndex = headed ? offset : -1;
      if (headed) offset += 1;
      const firstEntry = offset;
      if (!collapsed) offset += group.definitions.length;
      return { headerIndex, firstEntry, collapsed };
    });
    return { groupLayout, count: offset };
  }, [visibleGroups, onCreateCustom, collapsedGroups]);
  // A shrunken catalog can leave the remembered entry past the end, which would leave the
  // palette with no tab stop at all.
  const rovingEntry = activeEntry < roving.count ? activeEntry : 0;

  // A narrowed list renumbers its entries, so the tab stop goes back to the first one. Starting
  // a search unfolds every group, so a match is never hidden in a folded one.
  const updateQuery = (next: string) => {
    if (query.trim() === '' && next.trim() !== '') setCollapsedGroups(new Set());
    setQuery(next);
    setActiveEntry(0);
  };
  const toggleGroup = (key: string) =>
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const updateSource = (next: GuardrailPaletteSource) => {
    setSource(next);
    setActiveEntry(0);
  };

  const entryElements = () =>
    Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>(ROVING_SELECTOR) ?? []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = entryElements();
    // Off the event, not `document.activeElement`: that retargets to the shadow *host* inside
    // Agents' shadow root, so the lookup would never match and every arrow key would no-op.
    const focused: EventTarget = event.target;
    const current = entries.indexOf(focused as HTMLButtonElement);

    if (current === -1) {
      // ArrowDown hands over from the search field to the first guardrail, past any heading,
      // the way a search hands over to its first result. An IME composing a query (Japanese,
      // Chinese) uses ArrowDown for its candidates, so it keeps it. The source filter keeps it
      // too, to open its menu.
      if (
        event.key === 'ArrowDown' &&
        !event.nativeEvent.isComposing &&
        event.keyCode !== 229 &&
        focused === searchRef.current
      ) {
        const target = entries.find((entry) => entry.matches(ENTRY_SELECTOR)) ?? entries[0];
        if (!target) return;
        event.preventDefault();
        setActiveEntry(entries.indexOf(target));
        target.focus();
      }
      return;
    }

    // And ArrowUp on the first entry hands back to the search field.
    if (event.key === 'ArrowUp' && current === 0 && searchRef.current) {
      event.preventDefault();
      searchRef.current.focus();
      return;
    }

    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = current + 1;
        break;
      case 'ArrowUp':
        next = current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = entries.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    // Clamped, not wrapped: Home/End are the way to jump across a short grouped list.
    const target = Math.min(Math.max(next, 0), entries.length - 1);
    setActiveEntry(target);
    entries[target]?.focus();
  };

  // Focus also arrives by click or by tabbing in, and the tab stop follows it.
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const focused: HTMLElement = event.target;
    const index = entryElements().findIndex((entry) => entry === focused);
    if (index !== -1) setActiveEntry(index);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: the region groups buttons, not form controls; <fieldset> would add form semantics and its own default box (same call as ProbeCard and wind's ButtonGroup)
    <div
      ref={rootRef}
      data-slot="guardrail-palette"
      role="group"
      aria-label={labels.listAriaLabel}
      className={cn('flex min-h-0 flex-col gap-2', className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {error && <GuardrailStatusBanner tone="error" message={labels.loadError} />}
      {isLoading ? (
        // `<output>` for its implicit `role="status"`, with no styling of its own.
        <output className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {labels.loading}
        </output>
      ) : (
        <>
          {showControls && (
            <div
              data-slot="guardrail-palette-controls"
              className="flex shrink-0 items-center gap-2"
            >
              {searchable && (
                <InputGroup className="h-8 min-w-0 flex-1 future:h-9">
                  <InputGroupAddon align="inline-start">
                    <Search className="size-4" aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={searchRef}
                    type="search"
                    autoComplete="off"
                    aria-label={labels.search}
                    placeholder={labels.search}
                    value={query}
                    onChange={(event) => updateQuery(event.target.value)}
                    // The clear button below stands in for the browser's own.
                    className="[&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {query && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        icon
                        size="3xs"
                        aria-label={labels.clearSearch}
                        onClick={() => {
                          updateQuery('');
                          searchRef.current?.focus();
                        }}
                      >
                        <X aria-hidden="true" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              )}
              {showSourceFilter && (
                <Select
                  value={activeSource}
                  onValueChange={(value) => updateSource(value as GuardrailPaletteSource)}
                  onOpenChange={(open) => {
                    sourceOpenRef.current = open;
                  }}
                >
                  {/* The search field's height, so the two read as one row. */}
                  <SelectTrigger
                    aria-label={labels.sourceFilter}
                    data-pointer-focus={sourcePointerFocus || undefined}
                    onPointerDown={() => setSourcePointerFocus(true)}
                    onKeyDown={() => setSourcePointerFocus(false)}
                    // Not while the menu is open: opening it moves focus into the menu.
                    onBlur={() => {
                      if (!sourceOpenRef.current) setSourcePointerFocus(false);
                    }}
                    className="h-8 w-auto shrink-0 gap-2 future:h-9 data-[pointer-focus]:focus:ring-0 data-[pointer-focus]:focus-visible:ring-0"
                  >
                    {/* The bare label, so the trigger keeps its width while the counts change. */}
                    <SelectValue>{sourceLabels[activeSource]}</SelectValue>
                  </SelectTrigger>
                  {/* A key pressed in the menu (Escape, or picking with Enter) is keyboard use. */}
                  <SelectContent onKeyDown={() => setSourcePointerFocus(false)}>
                    {SOURCES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {/* The space keeps the accessible name "BYO 2" rather than "BYO2". */}
                        {sourceLabels[option]}{' '}
                        <span className="tabular-nums text-muted-foreground">
                          {sourceCounts[option]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          {/* The entries scroll on their own, so the controls stay put once a host bounds the
              palette's height. The padding, cancelled by the margin, keeps focus rings inside
              the scroll box. */}
          <div
            data-slot="guardrail-palette-entries"
            className="-m-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1"
          >
            {onCreateCustom && (
              <GuardrailPaletteItem
                name={labels.createCustom}
                description={labels.createCustomDescription}
                icon={<Plus aria-hidden="true" />}
                tabIndex={rovingEntry === 0 ? 0 : -1}
                onSelect={onCreateCustom}
              />
            )}
            {isEmpty && <p className="px-2 py-1 text-sm text-muted-foreground">{labels.empty}</p>}
            {/* Mounted with the controls and filled on no match, so a screen reader announces
                it while focus stays in the search field. `<output>` is a polite status, and
                `empty:sr-only` keeps the empty region out of the layout. */}
            {showControls && (
              <output className="px-2 py-1 text-sm text-muted-foreground empty:sr-only">
                {hasNoMatches ? labels.noMatches : null}
              </output>
            )}
            {visibleGroups.map((group, groupIndex) => {
              const headerId = `${headerIdPrefix}-${groupIndex}`;
              const layout = roving.groupLayout[groupIndex];
              const collapsed = layout?.collapsed ?? false;
              const FolderIcon = collapsed ? Folder : FolderOpen;
              return (
                // biome-ignore lint/a11y/useSemanticElements: as above; the name is what tells a screen reader which folder an entry came from, since the heading is only adjacent text and two folders can hold the same validator
                <div
                  key={group.key}
                  role="group"
                  // Named by the visible header rather than a copy of it in `aria-label`.
                  aria-labelledby={group.header !== null ? headerId : undefined}
                  className="flex flex-col gap-1"
                >
                  {group.header !== null && (
                    // Folds the group on click. The count says what a folded group holds.
                    <button
                      type="button"
                      data-slot="guardrail-palette-group-toggle"
                      aria-expanded={!collapsed}
                      tabIndex={rovingEntry === layout?.headerIndex ? 0 : -1}
                      onClick={() => toggleGroup(group.key)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-semibold text-muted-foreground ring-offset-background transition-colors',
                        'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                    >
                      {group.isByo && (
                        <FolderIcon className="size-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {/* The group's name is this text alone, without the count. */}
                      <span id={headerId} className="truncate">
                        {group.header}
                      </span>{' '}
                      <span className="ml-auto font-normal tabular-nums">
                        {group.definitions.length}
                      </span>
                      <ChevronDown
                        className={cn(
                          'size-3.5 shrink-0 transition-transform',
                          collapsed && '-rotate-90'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                  {!collapsed &&
                    group.definitions.map((definition, definitionIndex) => (
                      <GuardrailPaletteItem
                        key={getGuardrailPaletteItemId(definition)}
                        name={byoDisplay ? paletteEntryName(definition) : definition.displayName}
                        description={definition.description}
                        chips={definitionChips(definition, labels, previewChip, byoDisplay)}
                        caption={
                          byoDisplay && definition.byoConnectorName !== undefined
                            ? `${labels.provider}: ${definition.byoConnectorName}`
                            : undefined
                        }
                        // The only non-`Available` status a correctly filtered palette receives.
                        disabled={definition.status === 'Unauthorised'}
                        tabIndex={
                          rovingEntry === (layout?.firstEntry ?? 0) + definitionIndex ? 0 : -1
                        }
                        onSelect={() => onSelectOotb(definition)}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
