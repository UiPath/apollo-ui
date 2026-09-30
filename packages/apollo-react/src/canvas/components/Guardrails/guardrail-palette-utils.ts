import { isByoGuardrailDefinition } from './definitions-enrich';
import type { GuardrailPaletteDefinition, GuardrailPaletteGroup } from './palette-types';

/**
 * A palette entry's identity. A bring-your-own validator name is unique per *connection*, so
 * the connection id joins the key: Agents' rule, where Flow's `byo:<name>` collides when two
 * connections expose one name. Not `matchesGuardrailListDefinition`, which matches a *saved*
 * guardrail on the name alone so rebinding a configuration still resolves.
 */
export function getGuardrailPaletteItemId(definition: GuardrailPaletteDefinition): string {
  return definition.byoValidatorName === undefined
    ? definition.validator
    : `${definition.byoValidatorName}:${definition.byoGuardrailConnectionId ?? ''}`;
}

/**
 * Group definitions the way both products already do: with no bring-your-own definitions, one
 * unheaded group in payload order; otherwise one group per BYO `folderPath ??
 * byoConnectorName`, then a trailing UiPath group, definitions sorted by the name they render
 * with (`getName`, default the display name). Both sorts are bare `localeCompare()`, so order
 * follows the runtime locale, as it does today.
 */
export function groupGuardrailsForPalette<T extends GuardrailPaletteDefinition>(
  definitions: readonly T[],
  uipathGroupLabel: string,
  getName: (definition: T) => string = (definition) => definition.displayName
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

  const byName = (a: T, b: T) => getName(a).localeCompare(getName(b));

  const groups: Array<GuardrailPaletteGroup<T>> = [...byoGroups.entries()]
    .sort(([a], [b]) => (a ?? '').localeCompare(b ?? ''))
    .map(([key, list]) => ({
      // Neither a folder nor a connector name: both products still render it, unheaded.
      key: key ?? '__byo__',
      header: key ?? null,
      isByo: true,
      definitions: [...list].sort(byName),
    }));

  if (uipathDefinitions.length > 0) {
    groups.push({
      key: '__uipath__',
      header: uipathGroupLabel,
      isByo: false,
      definitions: [...uipathDefinitions].sort(byName),
    });
  }

  return groups;
}
