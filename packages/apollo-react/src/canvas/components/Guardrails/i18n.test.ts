import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import {
  formatGuardrailFormMessage,
  GUARDRAIL_REMOVE_DIALOG_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES,
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
