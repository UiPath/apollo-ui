import type { GuardrailDefinitionStatus } from './builder-types';

/**
 * The minimum a definition needs for the palette to render it.
 *
 * Deliberately narrower than `EnrichedGuardrailDefinition` (which satisfies it), for the same
 * reason the list keeps its own definition shape: the palette reads eight fields, and a
 * product feeding its own definition type should not have to adopt ours to show a picker.
 * `GuardrailPalette` is generic over this, so whatever goes in comes back out of
 * `onSelectOotb` unchanged and the host still has `parameters` to open its builder with.
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
  /** BYO folder placement, resolved host-side; the preferred group key when present. */
  folderPath?: string;
}

/** One rendered section of the palette: a BYO folder or connector, or the UiPath validators. */
export interface GuardrailPaletteGroup<T extends GuardrailPaletteDefinition> {
  /** Stable react key. Synthetic (`__all__`, `__uipath__`, `__byo__`) where there is no name. */
  key: string;
  /** Rendered heading, or `null` for a group that carries no heading at all. */
  header: string | null;
  isByo: boolean;
  definitions: T[];
}
