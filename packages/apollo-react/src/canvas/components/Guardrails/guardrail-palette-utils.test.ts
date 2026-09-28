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
import { getGuardrailPaletteItemId, groupGuardrailsForPalette } from './guardrail-palette-utils';
import type { GuardrailPaletteDefinition } from './palette-types';

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
