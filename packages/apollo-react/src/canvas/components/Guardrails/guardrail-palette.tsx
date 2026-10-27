import {
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@uipath/apollo-wind';
import { FolderOpen, Loader2, Plus, Search, X } from 'lucide-react';
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
   * connector and folder.
   */
  searchable?: boolean;
  /**
   * An All / UiPath / BYO filter above the entries, each option counting what the search left.
   * Rendered only while the catalog holds both kinds, since there is nothing to split otherwise.
   */
  sourceFilter?: boolean;
  labels?: Partial<GuardrailPaletteLabels>;
  className?: string;
}

const SOURCES: readonly GuardrailPaletteSource[] = ['all', 'uipath', 'byo'];

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
  searchable = false,
  sourceFilter = false,
  labels: labelOverrides,
  className,
}: GuardrailPaletteProps<T>) {
  const labels = useGuardrailPaletteLabels(labelOverrides);
  const headerIdPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeEntry, setActiveEntry] = useState(0);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<GuardrailPaletteSource>('all');

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
  // skips them. The flat index runs create-custom first, then each group in order.
  const groupOffsets = useMemo(() => {
    let offset = onCreateCustom ? 1 : 0;
    return visibleGroups.map((group) => {
      const start = offset;
      offset += group.definitions.length;
      return start;
    });
  }, [visibleGroups, onCreateCustom]);

  const entryCount =
    (onCreateCustom ? 1 : 0) +
    visibleGroups.reduce((total, group) => total + group.definitions.length, 0);
  // A shrunken catalog can leave the remembered entry past the end, which would leave the
  // palette with no tab stop at all.
  const rovingEntry = activeEntry < entryCount ? activeEntry : 0;

  // A narrowed list renumbers its entries, so the tab stop goes back to the first one.
  const updateQuery = (next: string) => {
    setQuery(next);
    setActiveEntry(0);
  };
  const updateSource = (next: GuardrailPaletteSource) => {
    setSource(next);
    setActiveEntry(0);
  };

  const entryElements = () =>
    Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-slot="guardrail-palette-item"]'
      ) ?? []
    );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = entryElements();
    // Off the event, not `document.activeElement`: that retargets to the shadow *host* inside
    // Agents' shadow root, so the lookup would never match and every arrow key would no-op.
    const focused: EventTarget = event.target;
    const current = entries.indexOf(focused as HTMLButtonElement);

    if (current === -1) {
      // ArrowDown hands over from the search field or the source filter to the first entry.
      // The filter is horizontal, so it leaves ArrowDown alone for this.
      if (
        event.key === 'ArrowDown' &&
        !event.defaultPrevented &&
        entries.length > 0 &&
        controlsRef.current?.contains(focused as Node)
      ) {
        event.preventDefault();
        setActiveEntry(0);
        entries[0]?.focus();
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
              ref={controlsRef}
              data-slot="guardrail-palette-controls"
              className="flex shrink-0 flex-col gap-2"
            >
              {searchable && (
                <InputGroup className="h-8 future:h-9">
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
                <ToggleGroup
                  type="single"
                  size="xs"
                  orientation="horizontal"
                  aria-label={labels.sourceFilter}
                  value={activeSource}
                  // A single group may be deselected; the filter always shows one side.
                  onValueChange={(value) => {
                    if (value) updateSource(value as GuardrailPaletteSource);
                  }}
                >
                  {SOURCES.map((option) => (
                    <ToggleGroupItem key={option} value={option}>
                      {/* The space keeps the accessible name "BYO 2" rather than "BYO2". */}
                      {sourceLabels[option]}{' '}
                      <span className="tabular-nums text-muted-foreground">
                        {sourceCounts[option]}
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
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
            {hasNoMatches && (
              <p className="px-2 py-1 text-sm text-muted-foreground">{labels.noMatches}</p>
            )}
            {visibleGroups.map((group, groupIndex) => {
              const headerId = `${headerIdPrefix}-${groupIndex}`;
              const groupOffset = groupOffsets[groupIndex] ?? 0;
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
                    <div
                      id={headerId}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      {group.isByo && <FolderOpen className="size-3.5" aria-hidden="true" />}
                      <span className="truncate">{group.header}</span>
                    </div>
                  )}
                  {group.definitions.map((definition, definitionIndex) => (
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
                      tabIndex={rovingEntry === groupOffset + definitionIndex ? 0 : -1}
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
