import { describe, expect, it } from 'vitest';
import {
  BYO_CONNECTOR_ONLY_DEFINITION,
  BYO_FOLDER_DEFINITION,
  BYO_SECOND_CONNECTION_DEFINITION,
  MIXED_DEFINITIONS,
  PII_DEFINITION,
  PROMPT_ATTACKS_DEFINITION,
  UIPATH_DEFINITIONS,
} from './__fixtures__/guardrail-palette.fixtures';
import {
  filterGuardrailPaletteGroups,
  getGuardrailPaletteItemId,
  groupGuardrailsForPalette,
} from './guardrail-palette-utils';
import type { GuardrailPaletteDefinition, GuardrailPaletteGroup } from './palette-types';

describe('getGuardrailPaletteItemId', () => {
  it('identifies a UiPath validator by its validator id', () => {
    expect(getGuardrailPaletteItemId(PII_DEFINITION)).toBe('pii_detection');
  });

  it('joins the connection id for a bring-your-own validator', () => {
    expect(getGuardrailPaletteItemId(BYO_FOLDER_DEFINITION)).toBe(
      'noma_prompt_injection:connection-1'
    );
  });

  it('keeps one validator name on two connections apart', () => {
    expect(getGuardrailPaletteItemId(BYO_FOLDER_DEFINITION)).not.toBe(
      getGuardrailPaletteItemId(BYO_SECOND_CONNECTION_DEFINITION)
    );
  });

  it('still produces an id for a bring-your-own definition with no connection', () => {
    const orphan: GuardrailPaletteDefinition = {
      validator: 'byo',
      displayName: 'Orphan',
      status: 'Available',
      byoValidatorName: 'orphan_validator',
    };

    expect(getGuardrailPaletteItemId(orphan)).toBe('orphan_validator:');
  });
});

describe('groupGuardrailsForPalette', () => {
  it('returns one unheaded group, in payload order, with no bring-your-own definitions', () => {
    const groups = groupGuardrailsForPalette(UIPATH_DEFINITIONS, 'UiPath guardrails');

    expect(groups).toEqual([
      { key: '__all__', header: null, isByo: false, definitions: UIPATH_DEFINITIONS },
    ]);
  });

  it('returns no groups at all for an empty catalog', () => {
    // Deliberately not the hosts' `[{ key: '__all__', definitions: [] }]`: Flow's own empty
    // state is guarded on `groups.length === 0`, which its implementation can never reach.
    expect(groupGuardrailsForPalette([], 'UiPath guardrails')).toEqual([]);
  });

  it('groups bring-your-own definitions by folder and trails the UiPath group', () => {
    const groups = groupGuardrailsForPalette(MIXED_DEFINITIONS, 'UiPath guardrails');

    expect(groups.map((group) => [group.key, group.header, group.isByo])).toEqual([
      ['Acme Guard', 'Acme Guard', true],
      ['Shared/Security', 'Shared/Security', true],
      ['__uipath__', 'UiPath guardrails', false],
    ]);
  });

  it('prefers the folder path over the connector name as the group key', () => {
    const groups = groupGuardrailsForPalette(
      [BYO_FOLDER_DEFINITION, BYO_CONNECTOR_ONLY_DEFINITION],
      'UiPath guardrails'
    );

    expect(groups.map((group) => group.key)).toEqual(['Acme Guard', 'Shared/Security']);
  });

  it('sorts by the name a caller renders when it passes one', () => {
    const groups = groupGuardrailsForPalette(
      [PROMPT_ATTACKS_DEFINITION, PII_DEFINITION],
      'UiPath guardrails',
      (definition) => (definition === PII_DEFINITION ? 'Z' : 'A')
    );

    expect(groups[0]?.definitions).toEqual([PROMPT_ATTACKS_DEFINITION, PII_DEFINITION]);
  });

  it('sorts definitions inside a group by display name', () => {
    const groups = groupGuardrailsForPalette(
      [PROMPT_ATTACKS_DEFINITION, PII_DEFINITION, BYO_FOLDER_DEFINITION],
      'UiPath guardrails'
    );
    const uipath = groups.at(-1);

    expect(uipath?.definitions.map((definition) => definition.displayName)).toEqual([
      'PII detection',
      'Prompt attacks',
    ]);
  });

  it('heads a bring-your-own group with nothing when it has neither folder nor connector', () => {
    const nameless: GuardrailPaletteDefinition = {
      validator: 'byo',
      displayName: 'Nameless',
      status: 'Available',
      byoValidatorName: 'nameless',
    };
    const groups = groupGuardrailsForPalette([nameless, PII_DEFINITION], 'UiPath guardrails');

    expect(groups[0]).toEqual({
      key: '__byo__',
      header: null,
      isByo: true,
      definitions: [nameless],
    });
  });

  it('omits the UiPath group when every definition is bring-your-own', () => {
    const groups = groupGuardrailsForPalette([BYO_FOLDER_DEFINITION], 'UiPath guardrails');

    expect(groups).toHaveLength(1);
    expect(groups[0]?.isByo).toBe(true);
  });

  it('never mutates the input array', () => {
    const input = [PROMPT_ATTACKS_DEFINITION, PII_DEFINITION];
    groupGuardrailsForPalette(input, 'UiPath guardrails');

    expect(input).toEqual([PROMPT_ATTACKS_DEFINITION, PII_DEFINITION]);
  });
});

describe('filterGuardrailPaletteGroups', () => {
  const groups = groupGuardrailsForPalette(MIXED_DEFINITIONS, 'UiPath guardrails');
  const shown = (result: Array<GuardrailPaletteGroup<GuardrailPaletteDefinition>>) =>
    result.map((group) => [
      group.key,
      group.definitions.map((definition) => definition.displayName),
    ]);

  it('returns every group unchanged with no query and every source', () => {
    expect(filterGuardrailPaletteGroups(groups, {})).toEqual(groups);
    expect(filterGuardrailPaletteGroups(groups, { query: '   ' })).toEqual(groups);
  });

  it('matches the name regardless of case and accents', () => {
    const accented = { ...PII_DEFINITION, displayName: 'Détection PII' };
    const result = filterGuardrailPaletteGroups(
      groupGuardrailsForPalette([accented, PROMPT_ATTACKS_DEFINITION], 'UiPath guardrails'),
      { query: 'DETECTION' }
    );

    expect(result[0]?.definitions).toEqual([accented]);
  });

  it('matches the description, the connector and the folder', () => {
    expect(shown(filterGuardrailPaletteGroups(groups, { query: 'instructions' }))).toEqual([
      ['__uipath__', ['Prompt attacks']],
    ]);
    expect(shown(filterGuardrailPaletteGroups(groups, { query: 'acme guard' }))).toEqual([
      ['Acme Guard', ['Acme policy check']],
    ]);
    expect(shown(filterGuardrailPaletteGroups(groups, { query: 'shared' }))).toEqual([
      ['Shared/Security', ['Noma prompt shield']],
    ]);
  });

  it('needs every word, found in any field and in any order', () => {
    expect(shown(filterGuardrailPaletteGroups(groups, { query: 'traffic pii' }))).toEqual([
      ['__uipath__', ['PII detection']],
    ]);
    expect(filterGuardrailPaletteGroups(groups, { query: 'pii shield' })).toEqual([]);
  });

  it('matches the name a caller renders when it passes one', () => {
    const byConfiguration = (definition: GuardrailPaletteDefinition) =>
      definition.byoValidatorName ?? definition.displayName;

    expect(filterGuardrailPaletteGroups(groups, { query: 'noma_prompt' })).toEqual([]);
    expect(
      shown(filterGuardrailPaletteGroups(groups, { query: 'noma_prompt' }, byConfiguration))
    ).toEqual([['Shared/Security', ['Noma prompt shield']]]);
  });

  it('keeps the groups in order with their headings, and drops one left empty', () => {
    const result = filterGuardrailPaletteGroups(groups, { query: 'detect' });

    expect(shown(result)).toEqual([
      ['Shared/Security', ['Noma prompt shield']],
      ['__uipath__', ['PII detection', 'Prompt attacks']],
    ]);
    expect(result.map((group) => group.header)).toEqual(['Shared/Security', 'UiPath guardrails']);
  });

  it('keeps one side of the catalog by source', () => {
    expect(
      filterGuardrailPaletteGroups(groups, { source: 'byo' }).map((group) => group.key)
    ).toEqual(['Acme Guard', 'Shared/Security']);
    expect(
      filterGuardrailPaletteGroups(groups, { source: 'uipath' }).map((group) => group.key)
    ).toEqual(['__uipath__']);
  });

  it('counts the single unheaded group of a UiPath-only catalog as UiPath', () => {
    const uipathOnly = groupGuardrailsForPalette(UIPATH_DEFINITIONS, 'UiPath guardrails');

    expect(filterGuardrailPaletteGroups(uipathOnly, { source: 'uipath' })).toEqual(uipathOnly);
    expect(filterGuardrailPaletteGroups(uipathOnly, { source: 'byo' })).toEqual([]);
  });

  it('applies the query and the source together', () => {
    expect(shown(filterGuardrailPaletteGroups(groups, { query: 'detect', source: 'byo' }))).toEqual(
      [['Shared/Security', ['Noma prompt shield']]]
    );
  });

  it('never mutates the groups it is given', () => {
    const before = JSON.parse(JSON.stringify(groups));
    filterGuardrailPaletteGroups(groups, { query: 'pii', source: 'uipath' });

    expect(groups).toEqual(before);
  });
});
