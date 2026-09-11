import { cn } from '@uipath/apollo-wind';
import { FolderOpen, Loader2, Plus } from 'lucide-react';
import { type FocusEvent, type KeyboardEvent, useId, useMemo, useRef, useState } from 'react';
import { GuardrailPaletteItem } from './components/guardrail-palette-item';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { GuardrailStatusChip } from './components/guardrail-status-chip';
import { getGuardrailPaletteItemId, groupGuardrailsForPalette } from './guardrail-palette-utils';
import { type GuardrailPaletteLabels, useGuardrailPaletteLabels } from './i18n';
import type { GuardrailPaletteDefinition } from './palette-types';

export interface GuardrailPaletteProps<
  T extends GuardrailPaletteDefinition = GuardrailPaletteDefinition,
> {
  /**
   * The definitions to offer, **already filtered by the host**: feature flags, entitlements,
   * `FeatureDisabled` / `Disabled` removal and scope filtering never cross this boundary.
   * Both products already filter before rendering; the palette offers everything it is given.
   */
  ootbDefinitions: T[];
  /** A definition was chosen. The builder, the default name and telemetry stay host-side. */
  onSelectOotb: (definition: T) => void;
  /**
   * Create a custom guardrail. Its **presence** is what renders the create-custom entry, so a
   * host offering it conditionally (Flow only for `scope === 'Tool'`) passes it conditionally,
   * and a host that puts the affordance in its own chrome (Agents' palette header) omits it.
   */
  onCreateCustom?: () => void;
  /** Definitions are in flight: renders a loading line instead of the entries. */
  isLoading?: boolean;
  /** Transport failure, shaped like `useGuardrailDefinitions`' `error`. */
  error?: Error | null;
  /** Render the "Preview" chip on definition entries. Product lifecycle, not a package concern. */
  previewChip?: boolean;
  labels?: Partial<GuardrailPaletteLabels>;
  className?: string;
}

/** Chips after an entry's name: the BYO connector, the lifecycle chip, the status chip. */
function definitionChips(
  definition: GuardrailPaletteDefinition,
  labels: GuardrailPaletteLabels,
  previewChip: boolean
) {
  return (
    <>
      {definition.byoConnectorName !== undefined && (
        <GuardrailStatusChip tone="neutral">{definition.byoConnectorName}</GuardrailStatusChip>
      )}
      {previewChip && <GuardrailStatusChip tone="neutral">{labels.preview}</GuardrailStatusChip>}
      {definition.status === 'Unauthorised' && (
        <GuardrailStatusChip tone="warning">{labels.statusUnauthorized}</GuardrailStatusChip>
      )}
    </>
  );
}

/**
 * The add-guardrail picker: the guardrail definitions a user may add, grouped, with an
 * optional create-custom entry.
 *
 * Ships the picker only. The shell around it is host orchestration, because the two products
 * disagree about it and both are right for their surface: Flow opens a dialog (or an inline
 * overlay that renders the chosen builder underneath), Agents takes over the whole sidebar
 * with a back button and its own create affordance. Composing either around this is a few
 * lines; a wrapper that modelled both would be a worse contract than no wrapper.
 */
export function GuardrailPalette<T extends GuardrailPaletteDefinition>({
  ootbDefinitions,
  onSelectOotb,
  onCreateCustom,
  isLoading = false,
  error = null,
  previewChip = false,
  labels: labelOverrides,
  className,
}: GuardrailPaletteProps<T>) {
  const labels = useGuardrailPaletteLabels(labelOverrides);
  const headerIdPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeEntry, setActiveEntry] = useState(0);

  const groups = useMemo(
    () => groupGuardrailsForPalette(ootbDefinitions, labels.uipathGroup),
    [ootbDefinitions, labels.uipathGroup]
  );

  // The empty line only stands in for the whole palette: with a create-custom entry there is
  // still something to pick, and announcing "no guardrails available" above it contradicts it.
  const isEmpty = groups.length === 0 && onCreateCustom === undefined;

  // Roving focus: the palette is one tab stop and Arrow/Home/End move inside it, so a keyboard
  // user is not tabbed through the create-custom entry, six UiPath validators and every BYO
  // group on the way past. Entries are `aria-disabled`, never `disabled`, so the arrow keys
  // reach the `Unauthorised` one too and its chip stays readable. This is also why the palette
  // is a list of buttons rather than wind's `Command`, whose cmdk navigation skips
  // `aria-disabled` items by construction.
  //
  // The flat entry index runs create-custom first, then every group's definitions in order.
  const groupOffsets = useMemo(() => {
    let offset = onCreateCustom ? 1 : 0;
    return groups.map((group) => {
      const start = offset;
      offset += group.definitions.length;
      return start;
    });
  }, [groups, onCreateCustom]);

  const entryCount =
    (onCreateCustom ? 1 : 0) + groups.reduce((total, group) => total + group.definitions.length, 0);
  // A catalog that shrank can leave the remembered entry past the end; falling back to the
  // first one keeps the palette at exactly one tab stop rather than none.
  const rovingEntry = activeEntry < entryCount ? activeEntry : 0;

  const entryElements = () =>
    Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-slot="guardrail-palette-item"]'
      ) ?? []
    );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = entryElements();
    // The focused entry comes off the event, not `document.activeElement`. Agents renders the
    // family inside a shadow root, where `document.activeElement` retargets to the shadow
    // *host*: the lookup would never match and every arrow key would be a silent no-op there.
    // React delivers the un-retargeted target for an event raised in its own tree.
    const focused: EventTarget = event.target;
    const current = entries.indexOf(focused as HTMLButtonElement);
    if (current === -1) return;

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
    // Clamped, not wrapped: the ends of a short grouped list are a useful stop, and Home/End
    // are the way to jump across it.
    const target = Math.min(Math.max(next, 0), entries.length - 1);
    setActiveEntry(target);
    entries[target]?.focus();
  };

  // Focus can also arrive by click or by tabbing in; the tab stop follows it. React types the
  // delegated target as the root element; focus actually lands on the entry inside it.
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
      className={cn('flex flex-col gap-2', className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {error && <GuardrailStatusBanner tone="error" message={labels.loadError} />}
      {isLoading ? (
        // <output> for its implicit role="status": a polite live region, and the one native
        // element that carries it without bringing any styling of its own.
        <output className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {labels.loading}
        </output>
      ) : (
        <>
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
          {groups.map((group, groupIndex) => {
            const headerId = `${headerIdPrefix}-${groupIndex}`;
            const groupOffset = groupOffsets[groupIndex] ?? 0;
            return (
              // biome-ignore lint/a11y/useSemanticElements: as above; the name is what tells a screen reader which folder an entry came from, since the heading is only adjacent text and two folders can hold the same validator
              <div
                key={group.key}
                role="group"
                // Named by the visible header rather than a copy of it in `aria-label`: one
                // string, and a header the user can see is the one a screen reader announces.
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
                    name={definition.displayName}
                    description={definition.description}
                    chips={definitionChips(definition, labels, previewChip)}
                    // The only status that reaches a correctly filtered palette: both products
                    // drop `FeatureDisabled` and `Disabled` before rendering, and keep
                    // `Unauthorised` so a tenant can see what it is not entitled to.
                    disabled={definition.status === 'Unauthorised'}
                    tabIndex={rovingEntry === groupOffset + definitionIndex ? 0 : -1}
                    onSelect={() => onSelectOotb(definition)}
                  />
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
