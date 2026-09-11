import { cn } from '@uipath/apollo-wind';
import { FolderOpen, Loader2, Plus } from 'lucide-react';
import { useMemo } from 'react';
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

  const groups = useMemo(
    () => groupGuardrailsForPalette(ootbDefinitions, labels.uipathGroup),
    [ootbDefinitions, labels.uipathGroup]
  );

  // The empty line only stands in for the whole palette: with a create-custom entry there is
  // still something to pick, and announcing "no guardrails available" above it contradicts it.
  const isEmpty = groups.length === 0 && onCreateCustom === undefined;

  return (
    // biome-ignore lint/a11y/useSemanticElements: the region groups buttons, not form controls; <fieldset> would add form semantics and its own default box (same call as ProbeCard and wind's ButtonGroup)
    <div
      data-slot="guardrail-palette"
      role="group"
      aria-label={labels.listAriaLabel}
      className={cn('flex flex-col gap-2', className)}
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
              onSelect={onCreateCustom}
            />
          )}
          {isEmpty && <p className="px-2 py-1 text-sm text-muted-foreground">{labels.empty}</p>}
          {groups.map((group) => (
            // biome-ignore lint/a11y/useSemanticElements: as above; the name is what tells a screen reader which folder an entry came from, since the heading is only adjacent text and two folders can hold the same validator
            <div
              key={group.key}
              role="group"
              aria-label={group.header ?? undefined}
              className="flex flex-col gap-1"
            >
              {group.header !== null && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {group.isByo && <FolderOpen className="size-3.5" aria-hidden="true" />}
                  <span className="truncate">{group.header}</span>
                </div>
              )}
              {group.definitions.map((definition) => (
                <GuardrailPaletteItem
                  key={getGuardrailPaletteItemId(definition)}
                  name={definition.displayName}
                  description={definition.description}
                  chips={definitionChips(definition, labels, previewChip)}
                  // The only status that reaches a correctly filtered palette: both products
                  // drop `FeatureDisabled` and `Disabled` before rendering, and keep
                  // `Unauthorised` so a tenant can see what it is not entitled to.
                  disabled={definition.status === 'Unauthorised'}
                  onSelect={() => onSelectOotb(definition)}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
