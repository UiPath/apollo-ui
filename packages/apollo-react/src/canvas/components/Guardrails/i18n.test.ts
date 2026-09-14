import { describe, expect, it } from 'vitest';
import {
  findCatalogDrift,
  findCatalogGaps,
  findCatalogOrphans,
} from './__fixtures__/catalog-coverage';
import {
  GUARDRAIL_PALETTE_EN_LABELS,
  GUARDRAIL_PALETTE_EN_MESSAGES,
  resolveGuardrailPaletteLabels,
} from './i18n';

describe('resolveGuardrailPaletteLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailPaletteLabels()).toEqual(GUARDRAIL_PALETTE_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailPaletteLabels(
      { empty: 'Keine Leitplanken verfügbar', preview: 'Vorschau' },
      { preview: 'Beta' }
    );

    expect(labels.empty).toBe('Keine Leitplanken verfügbar');
    expect(labels.preview).toBe('Beta');
    expect(labels.loading).toBe(GUARDRAIL_PALETTE_EN_LABELS.loading);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailPaletteLabels({ empty: undefined }, { preview: undefined });

    expect(labels.empty).toBe('No guardrails available');
    expect(labels.preview).toBe('Preview');
  });
});

describe('the shared canvas catalog', () => {
  // The scans live in `__fixtures__/catalog-coverage`, shared with every other component's
  // i18n test: the catalog is hand-authored and harvested from the two products, so each id
  // prefix needs the same three checks and there is no pipeline to run them.
  it('carries every palette message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_PALETTE_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no palette message the source no longer declares', () => {
    expect(findCatalogOrphans(GUARDRAIL_PALETTE_EN_MESSAGES, 'guardrails.palette.')).toEqual([]);
  });

  it('translates every palette message in all twelve translated locales', () => {
    expect(findCatalogGaps(GUARDRAIL_PALETTE_EN_MESSAGES)).toEqual([]);
  });
});
