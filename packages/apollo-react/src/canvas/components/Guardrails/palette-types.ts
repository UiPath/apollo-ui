import type { GuardrailDefinitionStatus } from './builder-types';

/**
 * The minimum a definition needs for the palette to render it, so a product feeding its own
 * definition type does not have to adopt `EnrichedGuardrailDefinition`, which satisfies this.
 * `GuardrailPalette` is generic over it, so whatever goes in comes back out of `onSelectOotb`.
 */
export interface GuardrailPaletteDefinition {
  validator: string;
  displayName: string;
  description?: string;
  status: GuardrailDefinitionStatus;
  /** Present for bring-your-own definitions; decides grouping and the connector chip. */
  byoValidatorName?: string;
  byoConnectorName?: string;
  byoGuardrailConnectionId?: string;
  /** Resolved host-side; the preferred group key when present. */
  folderPath?: string;
}

/** One rendered section of the palette: a BYO folder or connector, or the UiPath validators. */
export interface GuardrailPaletteGroup<T extends GuardrailPaletteDefinition> {
  /** Synthetic (`__all__`, `__uipath__`, `__byo__`) where there is no name. */
  key: string;
  /** `null` for a group that carries no heading at all. */
  header: string | null;
  isByo: boolean;
  definitions: T[];
}
