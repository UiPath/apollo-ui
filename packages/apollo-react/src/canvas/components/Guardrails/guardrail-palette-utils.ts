import { isByoGuardrailDefinition } from './definitions-enrich';
import type { GuardrailPaletteDefinition, GuardrailPaletteGroup } from './palette-types';

/**
 * Pure helpers behind `GuardrailPalette`. Exported because hosts need the same answers
 * outside the picker (a sidebar deciding whether it has anything to show, a telemetry
 * payload naming the chosen item), and because this is where both products' duplicated
 * grouping converges.
 */

/**
 * A palette entry's identity.
 *
 * A UiPath validator is unique by its id. A bring-your-own validator name is unique per
 * *connection*, not per tenant, so two connections can expose the same name and the
 * connection id has to join the key. This is Agents' rule; Flow keys BYO entries by
 * `byo:<name>` alone today, which collides in exactly that case.
 *
 * Not the same question as `matchesGuardrailListDefinition`, which resolves a *saved*
 * guardrail against the catalog and matches BYO on the name alone on purpose (an admin
 * rebinding a configuration to another connection must still resolve).
 */
export function getGuardrailPaletteItemId(definition: GuardrailPaletteDefinition): string {
  return definition.byoValidatorName === undefined
    ? definition.validator
    : `${definition.byoValidatorName}:${definition.byoGuardrailConnectionId ?? ''}`;
}

/**
 * Group definitions the way both products already do (`groupGuardrailsForPalette`, shipped
 * identically in Agents and Flow):
 *
 * - No bring-your-own definitions at all: one unheaded group, payload order preserved.
 * - Otherwise: one group per BYO `folderPath ?? byoConnectorName`, sorted by that key, then a
 *   trailing UiPath group. Definitions inside a group sort by display name.
 *
 * The unheaded case keeps payload order because that is the backend's own ordering, and a
 * single-group palette has nothing to disambiguate. Once folders appear, names sort so a
 * customer's folder does not reshuffle whenever the catalog does.
 */
export function groupGuardrailsForPalette<T extends GuardrailPaletteDefinition>(
  definitions: readonly T[],
  uipathGroupLabel: string
): Array<GuardrailPaletteGroup<T>> {
  if (!definitions.some(isByoGuardrailDefinition)) {
    return definitions.length === 0
      ? []
      : [{ key: '__all__', header: null, isByo: false, definitions: [...definitions] }];
  }

  const byoGroups = new Map<string | undefined, T[]>();
  const uipathDefinitions: T[] = [];

  for (const definition of definitions) {
    if (isByoGuardrailDefinition(definition)) {
      const key = definition.folderPath ?? definition.byoConnectorName;
      const existing = byoGroups.get(key);
      if (existing) existing.push(definition);
      else byoGroups.set(key, [definition]);
    } else {
      uipathDefinitions.push(definition);
    }
  }

  const byDisplayName = (a: T, b: T) => a.displayName.localeCompare(b.displayName);

  const groups: Array<GuardrailPaletteGroup<T>> = [...byoGroups.entries()]
    .sort(([a], [b]) => (a ?? '').localeCompare(b ?? ''))
    .map(([key, list]) => ({
      // A BYO definition with neither a folder nor a connector name has nothing to head its
      // group with; both products still render it, unheaded.
      key: key ?? '__byo__',
      header: key ?? null,
      isByo: true,
      definitions: [...list].sort(byDisplayName),
    }));

  if (uipathDefinitions.length > 0) {
    groups.push({
      key: '__uipath__',
      header: uipathGroupLabel,
      isByo: false,
      definitions: [...uipathDefinitions].sort(byDisplayName),
    });
  }

  return groups;
}
