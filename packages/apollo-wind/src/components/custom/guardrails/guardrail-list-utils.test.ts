import { describe, expect, it } from 'vitest';
import { GOLDEN_ENRICHED_DEFINITIONS } from './__fixtures__/golden-enriched';
import {
  BUILT_IN_GUARDRAIL,
  BYO_DISABLED_GUARDRAIL,
  BYO_GUARDRAIL,
  BYO_UNAVAILABLE_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  UNIDENTIFIED_GUARDRAIL,
} from './__fixtures__/list-items';
import {
  defaultGuardrailItemId,
  findGuardrailDefinition,
  type GuardrailListDefinition,
  matchGuardrailDefinition,
  moveGuardrail,
  resolveGuardrailListItemState,
} from './guardrail-list-utils';
import type { GuardrailListItem } from './list-types';

const definitions = GOLDEN_ENRICHED_DEFINITIONS;

function definition(overrides: Partial<GuardrailListDefinition>): GuardrailListDefinition {
  return {
    validator: 'pii_detection',
    displayName: 'PII detection',
    allowedScopes: ['Agent'],
    parameters: [],
    status: 'Available',
    ...overrides,
  };
}

describe('defaultGuardrailItemId', () => {
  it('prefers the persisted id', () => {
    expect(defaultGuardrailItemId(BUILT_IN_GUARDRAIL)).toBe('gr-pii');
  });

  it('falls back to the name for hosts that persist no id', () => {
    expect(defaultGuardrailItemId(UNIDENTIFIED_GUARDRAIL)).toBe('Prompt injection');
  });
});

describe('matchGuardrailDefinition', () => {
  it('matches a built-in on its validator id', () => {
    expect(matchGuardrailDefinition(definition({}), BUILT_IN_GUARDRAIL)).toBe(true);
  });

  it('does not match a built-in against a BYO definition sharing the validator id', () => {
    const byoDefinition = definition({ byoValidatorName: 'acme-pii-v1' });
    expect(matchGuardrailDefinition(byoDefinition, BUILT_IN_GUARDRAIL)).toBe(false);
  });

  it('matches a BYO guardrail on the validator name alone, ignoring the validator id', () => {
    const rebound = definition({ validator: 'something_else', byoValidatorName: 'acme-pii-v1' });
    const guardrail: GuardrailListItem = {
      $guardrailType: 'builtInValidator',
      name: 'Acme PII',
      validatorType: 'pii_detection',
      byoValidatorName: 'acme-pii-v1',
    };
    expect(matchGuardrailDefinition(rebound, guardrail)).toBe(true);
  });
});

describe('findGuardrailDefinition', () => {
  it('resolves a built-in guardrail to the non-BYO definition of the same validator', () => {
    const found = findGuardrailDefinition(BUILT_IN_GUARDRAIL, definitions);
    expect(found?.validator).toBe('pii_detection');
    expect(found?.byoValidatorName).toBeUndefined();
  });

  it('never resolves a custom guardrail', () => {
    expect(findGuardrailDefinition(CUSTOM_GUARDRAIL, definitions)).toBeUndefined();
  });

  it('tolerates a missing catalog', () => {
    expect(findGuardrailDefinition(BUILT_IN_GUARDRAIL, undefined)).toBeUndefined();
  });
});

describe('resolveGuardrailListItemState', () => {
  it('reports a custom guardrail as quiet, with no definition lookup', () => {
    expect(resolveGuardrailListItemState(CUSTOM_GUARDRAIL, definitions)).toEqual({
      status: 'Available',
      origin: 'local',
    });
  });

  it('reports a healthy built-in as quiet', () => {
    expect(resolveGuardrailListItemState(BUILT_IN_GUARDRAIL, definitions)).toEqual({
      status: 'Available',
      origin: 'local',
    });
  });

  it('carries the connector name of a BYO definition', () => {
    expect(resolveGuardrailListItemState(BYO_GUARDRAIL, definitions)).toEqual({
      status: 'Available',
      origin: 'local',
      byoConnectorName: 'Acme Security',
    });
  });

  it('notices a BYO configuration that was disabled', () => {
    expect(resolveGuardrailListItemState(BYO_DISABLED_GUARDRAIL, definitions)).toEqual({
      status: 'Disabled',
      origin: 'local',
      notice: 'byoDisabled',
    });
  });

  it('notices a BYO configuration that no longer exists', () => {
    expect(resolveGuardrailListItemState(BYO_UNAVAILABLE_GUARDRAIL, definitions)).toEqual({
      status: 'Unavailable',
      origin: 'local',
      notice: 'byoUnavailable',
    });
  });

  it('stays quiet about an unmatched BYO guardrail while the catalog is still empty', () => {
    expect(resolveGuardrailListItemState(BYO_UNAVAILABLE_GUARDRAIL, [])).toEqual({
      status: 'Available',
      origin: 'local',
    });
    expect(resolveGuardrailListItemState(BYO_UNAVAILABLE_GUARDRAIL)).toEqual({
      status: 'Available',
      origin: 'local',
    });
  });

  it('stays quiet about an unmatched built-in, which is a filtered catalog and not a fault', () => {
    const guardrail: GuardrailListItem = {
      $guardrailType: 'builtInValidator',
      name: 'Unknown',
      validatorType: 'not_in_catalog',
    };
    expect(resolveGuardrailListItemState(guardrail, definitions)).toEqual({
      status: 'Available',
      origin: 'local',
    });
  });

  it.each([
    'FeatureDisabled',
    'Unauthorised',
  ] as const)('passes the %s status through without a notice', (status) => {
    expect(resolveGuardrailListItemState(BUILT_IN_GUARDRAIL, [definition({ status })])).toEqual({
      status,
      origin: 'local',
    });
  });

  it('reports a disabled built-in with a chip but no inline notice', () => {
    expect(
      resolveGuardrailListItemState(BUILT_IN_GUARDRAIL, [definition({ status: 'Disabled' })])
    ).toEqual({ status: 'Disabled', origin: 'local' });
  });

  it('carries the host-supplied origin', () => {
    expect(resolveGuardrailListItemState(CUSTOM_GUARDRAIL, definitions, 'governance')).toEqual({
      status: 'Available',
      origin: 'governance',
    });
    expect(resolveGuardrailListItemState(BYO_GUARDRAIL, definitions, 'governance').origin).toBe(
      'governance'
    );
  });
});

describe('moveGuardrail', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getId = (item: { id: string }) => item.id;

  it('moves the active item to the position of the item it was dropped on', () => {
    const result = moveGuardrail(items, 'a', 'c', getId);
    expect(result?.guardrails.map(getId)).toEqual(['b', 'c', 'a']);
    expect(result?.move).toEqual({ from: 0, to: 2, id: 'a' });
  });

  it('moves upwards too', () => {
    const result = moveGuardrail(items, 'c', 'a', getId);
    expect(result?.guardrails.map(getId)).toEqual(['c', 'a', 'b']);
    expect(result?.move).toEqual({ from: 2, to: 0, id: 'c' });
  });

  it('leaves the input array untouched', () => {
    moveGuardrail(items, 'a', 'c', getId);
    expect(items.map(getId)).toEqual(['a', 'b', 'c']);
  });

  it('reports a no-op when the item was dropped on itself', () => {
    expect(moveGuardrail(items, 'b', 'b', getId)).toBeNull();
  });

  it('reports a no-op for ids the list does not hold', () => {
    expect(moveGuardrail(items, 'zzz', 'b', getId)).toBeNull();
    expect(moveGuardrail(items, 'a', 'zzz', getId)).toBeNull();
  });
});
