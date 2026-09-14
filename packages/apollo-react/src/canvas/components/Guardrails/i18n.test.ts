import { describe, expect, it } from 'vitest';
import {
  findCatalogDrift,
  findCatalogGaps,
  findCatalogOrphans,
  readCanvasCatalog,
  TRANSLATED_LOCALES,
} from './__fixtures__/catalog-coverage';
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
  // The scans live in `__fixtures__/catalog-coverage`, shared with every other component's
  // i18n test: the catalog is hand-authored and harvested from the two products, so each id
  // prefix needs the same three checks and there is no pipeline to run them.
  it('carries every list message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_LIST_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no list message the source no longer declares', () => {
    expect(findCatalogOrphans(GUARDRAIL_LIST_EN_MESSAGES, 'guardrails.list.')).toEqual([]);
  });

  it('translates every list message except the five with no harvest source', () => {
    // Harvesting is 1:1 from the two products' own catalogs, never machine translation, so an
    // id neither product ships stays English in all twelve. Pinned rather than left out of the
    // scan: these five are the known set, and a sixth landing untranslated fails here.
    // `edit-row` is the sore one. Agents has a translated `guardrails.item.edit_aria_label`
    // ("Edit {0}"), Flow has no bare "Edit {{name}}" at all, so taking it would break the
    // both-products rule the rest of these ids follow.
    const ENGLISH_ONLY = [
      'guardrails.list.edit-row',
      'guardrails.list.status-feature-disabled',
      'guardrails.list.status-disabled',
      'guardrails.list.status-unavailable',
      'guardrails.list.administration-governance',
    ];
    const gaps = findCatalogGaps(GUARDRAIL_LIST_EN_MESSAGES).filter(
      (gap) => !ENGLISH_ONLY.some((id) => gap.endsWith(`: ${id}`))
    );

    expect(gaps).toEqual([]);
  });

  it('translates the two per-row action templates everywhere they were harvested', () => {
    // `remove-row` was harvested from the "Remove <thing>" aria-label both products already
    // ship (Flow `escalation_memoryArguments_removeAriaLabel`, Agents `chip.delete.aria`),
    // whose twelve translations agree; only the placeholder token was rewritten. `edit-row`
    // has no counterpart in either catalog and stays English-only, like the other four.
    const gaps = TRANSLATED_LOCALES.filter(
      (locale) => !readCanvasCatalog(locale)['guardrails.list.remove-row']
    );

    expect(gaps).toEqual([]);
    expect(readCanvasCatalog('en')['guardrails.list.remove-row']).toBe('Remove {name}');
  });
});
