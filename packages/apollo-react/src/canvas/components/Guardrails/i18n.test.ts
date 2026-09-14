import { describe, expect, it } from 'vitest';
import {
  findCatalogDrift,
  findCatalogGaps,
  findCatalogOrphans,
} from './__fixtures__/catalog-coverage';
import {
  GUARDRAIL_BUILDER_EN_LABELS,
  GUARDRAIL_FORM_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES,
  resolveGuardrailBuilderLabels,
  resolveGuardrailFormLabels,
  resolveGuardrailRemoveDialogLabels,
} from './i18n';

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

  it('keeps the English templates in the `{{token}}` convention the component formats', () => {
    expect(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.confirmPrompt).toContain('{{name}}');
    expect(GUARDRAIL_REMOVE_DIALOG_EN_LABELS.removedForTool).toContain('{{toolName}}');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(
      GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES['guardrails.remove-dialog.confirm-prompt']
    ).toContain('{name}');
  });
});

describe('the other label sets still layer the same way', () => {
  // All four resolvers share one `mergeLabels`, so one case per set is enough to catch a
  // wiring mistake in the shared helper.
  it('merges builder labels', () => {
    const labels = resolveGuardrailBuilderLabels({ save: 'Speichern' }, { cancel: undefined });

    expect(labels.save).toBe('Speichern');
    expect(labels.cancel).toBe(GUARDRAIL_BUILDER_EN_LABELS.cancel);
  });

  it('merges validator form labels', () => {
    const labels = resolveGuardrailFormLabels({ addItem: 'Hinzufügen' }, { addItem: 'Add row' });

    expect(labels.addItem).toBe('Add row');
    expect(labels.enumPlaceholder).toBe(GUARDRAIL_FORM_EN_LABELS.enumPlaceholder);
  });
});

describe('the shared canvas catalog', () => {
  // The scans live in `__fixtures__/catalog-coverage`, shared with every other component's
  // i18n test: the catalog is hand-authored and harvested from the two products, so each id
  // prefix needs the same three checks and there is no pipeline to run them.
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

  it('translates every remove-dialog message in all twelve translated locales', () => {
    expect(findCatalogGaps(GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES)).toEqual([]);
  });
});
