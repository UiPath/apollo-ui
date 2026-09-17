import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import {
  formatGuardrailFormMessage,
  GUARDRAIL_LIST_EN_LABELS,
  GUARDRAIL_LIST_EN_MESSAGES,
  GUARDRAIL_PALETTE_EN_LABELS,
  GUARDRAIL_PALETTE_EN_MESSAGES,
  GUARDRAIL_REMOVE_DIALOG_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES,
  resolveGuardrailListLabels,
  resolveGuardrailPaletteLabels,
  resolveGuardrailRemoveDialogLabels,
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

describe('resolveGuardrailRemoveDialogLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailRemoveDialogLabels()).toEqual(GUARDRAIL_REMOVE_DIALOG_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailRemoveDialogLabels(
      { title: 'Leitplanke entfernen', remove: 'Entfernen' },
      { remove: 'Löschen' }
    );

    expect(labels.title).toBe('Leitplanke entfernen');
    expect(labels.remove).toBe('Löschen');
    expect(labels.cancel).toBe(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.cancel);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailRemoveDialogLabels(
      { title: undefined },
      { stillApplicable: undefined }
    );

    expect(labels.title).toBe('Remove guardrail');
    expect(labels.stillApplicable).toBe('It will still be applicable to:');
  });
});

describe('GUARDRAIL_REMOVE_DIALOG_EN_LABELS', () => {
  it('carries the template convention the dialog interpolates with', () => {
    expect(
      formatGuardrailFormMessage(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.confirmPrompt, {
        name: 'PII detection',
      })
    ).toBe('Please, confirm you’d like to remove "PII detection" guardrail');
    expect(
      formatGuardrailFormMessage(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.removedForTool, {
        toolName: 'Send email',
      })
    ).toBe('The guardrail will be removed for tool "Send email".');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(
      GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES['guardrails.remove-dialog.confirm-prompt']
    ).toContain('{name}');
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

  it('carries every palette message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_PALETTE_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no palette message the source no longer declares', () => {
    expect(findCatalogOrphans(GUARDRAIL_PALETTE_EN_MESSAGES, 'guardrails.palette.')).toEqual([]);
  });

  it('carries every remove-dialog message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES)).toEqual({
      missing: [],
      drifted: [],
    });
  });

  it('carries no remove-dialog message the source no longer declares', () => {
    expect(
      findCatalogOrphans(GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES, 'guardrails.remove-dialog.')
    ).toEqual([]);
  });
});
