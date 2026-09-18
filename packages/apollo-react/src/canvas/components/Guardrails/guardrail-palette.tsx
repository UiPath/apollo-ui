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
  labels?: Partial<GuardrailPaletteLabels>;
  className?: string;
}

/** Chips after an entry's name. Both tones are the colours the two products already ship. */
function definitionChips(
  definition: GuardrailPaletteDefinition,
  labels: GuardrailPaletteLabels,
  previewChip: boolean
) {
  return (
    <>
      {definition.byoConnectorName !== undefined && (
        <GuardrailStatusChip tone="success">{definition.byoConnectorName}</GuardrailStatusChip>
      )}
      {previewChip && <GuardrailStatusChip tone="info">{labels.preview}</GuardrailStatusChip>}
      {definition.status === 'Unauthorised' && (
        <GuardrailStatusChip tone="warning">{labels.statusUnauthorized}</GuardrailStatusChip>
      )}
    </>
  );
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

  // With a create-custom entry there is still something to pick, so "no guardrails available"
  // would contradict what is on screen.
  const isEmpty = groups.length === 0 && onCreateCustom === undefined;

  // Roving focus, so Tab enters and leaves the palette instead of walking a user through the
  // create-custom entry, six validators and every BYO group. `aria-disabled` entries keep
  // their place on purpose, which is also why this is not wind's `Command`: cmdk's item query
  // skips them. The flat index runs create-custom first, then each group in order.
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
  // A shrunken catalog can leave the remembered entry past the end, which would leave the
  // palette with no tab stop at all.
  const rovingEntry = activeEntry < entryCount ? activeEntry : 0;

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
      className={cn('flex flex-col gap-2', className)}
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
                    name={definition.displayName}
                    description={definition.description}
                    chips={definitionChips(definition, labels, previewChip)}
                    // The only non-`Available` status a correctly filtered palette receives.
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
