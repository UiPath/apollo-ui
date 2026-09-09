import { describe, expect, it } from 'vitest';
import {
  BYO_DEFINITION,
  BYO_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  DEFINITIONS,
  PII_DEFINITION,
  PII_GUARDRAIL,
} from './__fixtures__/guardrail-list.fixtures';
import {
  getGuardrailListChips,
  getGuardrailListItemId,
  matchesGuardrailListDefinition,
  resolveGuardrailListItemState,
} from './guardrail-list-utils';
import { GUARDRAIL_LIST_EN_LABELS } from './i18n';

const labels = GUARDRAIL_LIST_EN_LABELS;

describe('getGuardrailListItemId', () => {
  it('prefers the product id', () => {
    expect(getGuardrailListItemId(PII_GUARDRAIL)).toBe('g1');
  });

  it('falls back to the name when there is no id', () => {
    expect(getGuardrailListItemId({ name: 'PII detection 1' })).toBe('PII detection 1');
  });
});

describe('matchesGuardrailListDefinition', () => {
  it('matches a UiPath validator on the validator id', () => {
    expect(matchesGuardrailListDefinition(PII_DEFINITION, PII_GUARDRAIL)).toBe(true);
  });

  it('matches a BYO guardrail on the validator name alone', () => {
    // Unique per tenant, so an admin rebinding the configuration to another connection still
    // resolves. The definition's `validator` deliberately does not have to agree.
    expect(
      matchesGuardrailListDefinition(
        { ...BYO_DEFINITION, validator: 'something_else' },
        BYO_GUARDRAIL
      )
    ).toBe(true);
  });

  it('never matches a UiPath validator against a BYO definition with the same validator id', () => {
    expect(
      matchesGuardrailListDefinition(
        { ...BYO_DEFINITION, validator: 'pii_detection' },
        PII_GUARDRAIL
      )
    ).toBe(false);
  });

  it('never matches a custom guardrail, which has no validator', () => {
    expect(matchesGuardrailListDefinition(PII_DEFINITION, CUSTOM_GUARDRAIL)).toBe(false);
  });
});

describe('resolveGuardrailListItemState', () => {
  it('resolves a UiPath validator to its definition and status', () => {
    expect(resolveGuardrailListItemState(PII_GUARDRAIL, DEFINITIONS)).toEqual({
      definition: PII_DEFINITION,
      status: 'Available',
      isByo: false,
      provider: undefined,
      byoDisabled: false,
      byoUnavailable: false,
    });
  });

  it('exposes the BYO connector as the provider', () => {
    expect(resolveGuardrailListItemState(BYO_GUARDRAIL, DEFINITIONS)).toMatchObject({
      isByo: true,
      provider: 'Noma Security',
      byoDisabled: false,
      byoUnavailable: false,
    });
  });

  it('reports a disabled BYO configuration', () => {
    const state = resolveGuardrailListItemState(BYO_GUARDRAIL, [
      PII_DEFINITION,
      { ...BYO_DEFINITION, status: 'Disabled' },
    ]);

    expect(state).toMatchObject({ status: 'Disabled', byoDisabled: true, byoUnavailable: false });
  });

  it('reports a BYO configuration that no longer resolves', () => {
    const state = resolveGuardrailListItemState(BYO_GUARDRAIL, [PII_DEFINITION]);

    expect(state).toMatchObject({
      definition: undefined,
      status: 'Unavailable',
      byoUnavailable: true,
    });
  });

  it('stays quiet about a BYO row while the definitions are still in flight', () => {
    // Without the empty-array guard every BYO row would claim its configuration is gone for
    // as long as the catalog takes to load. Both products already guard this.
    const state = resolveGuardrailListItemState(BYO_GUARDRAIL, []);

    expect(state).toMatchObject({ status: undefined, byoUnavailable: false, byoDisabled: false });
  });

  it('treats a missing definitions array as still in flight', () => {
    expect(resolveGuardrailListItemState(BYO_GUARDRAIL)).toMatchObject({ byoUnavailable: false });
  });

  it('resolves a custom guardrail to nothing without claiming it is broken', () => {
    expect(resolveGuardrailListItemState(CUSTOM_GUARDRAIL, DEFINITIONS)).toEqual({
      definition: undefined,
      status: undefined,
      isByo: false,
      provider: undefined,
      byoDisabled: false,
      byoUnavailable: false,
    });
  });

  it('does not confuse a disabled UiPath validator for a disabled BYO configuration', () => {
    const state = resolveGuardrailListItemState(PII_GUARDRAIL, [
      { ...PII_DEFINITION, status: 'Disabled' },
    ]);

    expect(state).toMatchObject({ status: 'Disabled', byoDisabled: false });
  });
});

describe('getGuardrailListChips', () => {
  it('chips nothing for a locally administered, available row', () => {
    expect(getGuardrailListChips({ status: 'Available', administration: 'local' }, labels)).toEqual(
      []
    );
  });

  it('chips nothing when nothing resolved', () => {
    expect(getGuardrailListChips({}, labels)).toEqual([]);
  });

  it.each([
    ['FeatureDisabled', 'warning', labels.statusFeatureDisabled],
    ['Unauthorised', 'warning', labels.statusUnauthorized],
    ['Disabled', 'error', labels.statusDisabled],
    ['Unavailable', 'error', labels.statusUnavailable],
  ] as const)('chips %s as a %s', (status, tone, label) => {
    expect(getGuardrailListChips({ status }, labels)).toEqual([{ id: 'status', tone, label }]);
  });

  it('chips governance administration', () => {
    expect(getGuardrailListChips({ administration: 'governance' }, labels)).toEqual([
      { id: 'administration', tone: 'neutral', label: 'Governance managed' },
    ]);
  });

  it('chips the status before the administration', () => {
    const chips = getGuardrailListChips(
      { status: 'Disabled', administration: 'governance' },
      labels
    );

    expect(chips.map((chip) => chip.id)).toEqual(['status', 'administration']);
  });
});
