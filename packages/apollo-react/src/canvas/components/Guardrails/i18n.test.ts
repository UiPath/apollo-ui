import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import {
  formatGuardrailFormMessage,
  GUARDRAIL_LIST_EN_LABELS,
  GUARDRAIL_LIST_EN_MESSAGES,
  resolveGuardrailListLabels,
} from './i18n';

describe('resolveGuardrailListLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailListLabels()).toEqual(GUARDRAIL_LIST_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailListLabels(
      { title: 'Absicherungen', add: 'Hinzufügen' },
      { add: 'Neu' }
    );

    expect(labels.title).toBe('Absicherungen');
    expect(labels.add).toBe('Neu');
    expect(labels.empty).toBe(GUARDRAIL_LIST_EN_LABELS.empty);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailListLabels({ title: undefined }, { add: undefined });

    expect(labels.title).toBe('Guardrails');
    expect(labels.add).toBe('Add');
  });
});

describe('GUARDRAIL_LIST_EN_LABELS', () => {
  it('carries the template convention the row interpolates with', () => {
    expect(GUARDRAIL_LIST_EN_LABELS.reorderItem).toBe('Reorder guardrail {{name}}');
    expect(
      formatGuardrailFormMessage(GUARDRAIL_LIST_EN_LABELS.editRow, { name: 'PII detection 1' })
    ).toBe('Edit PII detection 1');
    expect(
      formatGuardrailFormMessage(GUARDRAIL_LIST_EN_LABELS.removeRow, { name: 'PII detection 1' })
    ).toBe('Remove PII detection 1');
  });
});

describe('the shared canvas catalog', () => {
  // Shared with every component's i18n test; `__fixtures__/catalog-coverage` says why these
  // two scans and not a translation-coverage one.
  it('carries every list message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_LIST_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no list message the source no longer declares', () => {
    expect(findCatalogOrphans(GUARDRAIL_LIST_EN_MESSAGES, 'guardrails.list.')).toEqual([]);
  });
});
