import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import {
  CENTRALIZED_GUARDRAILS_EN_LABELS,
  CENTRALIZED_GUARDRAILS_EN_MESSAGES,
  formatGuardrailFormMessage,
  GUARDRAIL_ACTION_EN_LABELS,
  GUARDRAIL_ACTION_LABEL_KEYS,
  GUARDRAIL_BUILDER_EN_LABELS,
  GUARDRAIL_FILTER_FIELD_SELECTOR_EN_LABELS,
  GUARDRAIL_FILTER_FIELD_SELECTOR_LABEL_KEYS,
  GUARDRAIL_FORM_EN_LABELS,
  GUARDRAIL_LIST_EN_LABELS,
  GUARDRAIL_LIST_EN_MESSAGES,
  GUARDRAIL_PALETTE_EN_LABELS,
  GUARDRAIL_PALETTE_EN_MESSAGES,
  GUARDRAIL_REMOVE_DIALOG_EN_LABELS,
  GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES,
  GUARDRAIL_RULES_EN_LABELS,
  GUARDRAIL_RULES_EN_MESSAGES,
  GUARDRAIL_SCOPE_SELECTOR_EN_LABELS,
  GUARDRAIL_SCOPE_SELECTOR_LABEL_KEYS,
  resolveCentralizedGuardrailsLabels,
  resolveGuardrailActionLabels,
  resolveGuardrailBuilderLabels,
  resolveGuardrailFilterFieldSelectorLabels,
  resolveGuardrailFormLabels,
  resolveGuardrailListLabels,
  resolveGuardrailPaletteLabels,
  resolveGuardrailRemoveDialogLabels,
  resolveGuardrailRulesLabels,
  resolveGuardrailScopeSelectorLabels,
} from './i18n';

/**
 * Ids resolved from the builder's and the list's message blocks rather than twinned here. They
 * name the same thing with the same English, so a second id would reach translators twice and
 * drift.
 */
const REUSED_IDS = [
  'guardrails.builder.type-label',
  'guardrails.builder.description-label',
  'guardrails.builder.scopes-label',
  'guardrails.builder.scope-agent-label',
  'guardrails.builder.scope-llm-label',
  'guardrails.builder.scope-tool-label',
  'guardrails.builder.action-block-label',
  'guardrails.builder.action-escalate-label',
  'guardrails.builder.action-filter-label',
  'guardrails.builder.action-log-label',
  'guardrails.list.provider',
  'guardrails.list.byo',
  'guardrails.list.status-unavailable',
  'guardrails.list.status-disabled',
];

describe('resolveGuardrailActionLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailActionLabels()).toEqual(GUARDRAIL_ACTION_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailActionLabels(
      { actionTypeLabel: 'Aktionstyp', severityLabel: 'Schweregrad' },
      { severityLabel: 'Stufe' }
    );

    expect(labels.actionTypeLabel).toBe('Aktionstyp');
    expect(labels.severityLabel).toBe('Stufe');
    expect(labels.assignToLabel).toBe(GUARDRAIL_ACTION_EN_LABELS.assignToLabel);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailActionLabels(
      { actionTypeLabel: undefined },
      { severityLabel: undefined }
    );

    expect(labels.actionTypeLabel).toBe('Action type');
    expect(labels.severityLabel).toBe('Severity level');
  });
});

describe('GUARDRAIL_ACTION_EN_LABELS', () => {
  it('takes its English from the builder block, id for id', () => {
    for (const key of GUARDRAIL_ACTION_LABEL_KEYS) {
      expect(GUARDRAIL_ACTION_EN_LABELS[key]).toBe(GUARDRAIL_BUILDER_EN_LABELS[key]);
    }
    expect(Object.keys(GUARDRAIL_ACTION_EN_LABELS)).toHaveLength(
      GUARDRAIL_ACTION_LABEL_KEYS.length
    );
  });
});

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

describe('resolveGuardrailRulesLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailRulesLabels()).toEqual(GUARDRAIL_RULES_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailRulesLabels(
      { addRule: 'Regel hinzufügen', operatorLabel: 'Operator (de)' },
      { operatorLabel: 'Vergleich' }
    );

    expect(labels.addRule).toBe('Regel hinzufügen');
    expect(labels.operatorLabel).toBe('Vergleich');
    expect(labels.valueLabel).toBe(GUARDRAIL_RULES_EN_LABELS.valueLabel);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailRulesLabels({ addRule: undefined }, { allFields: undefined });

    expect(labels.addRule).toBe('Add rule');
    expect(labels.allFields).toBe('All fields');
  });

  it('keeps the English templates in the `{{token}}` convention the components format', () => {
    expect(formatGuardrailFormMessage(GUARDRAIL_RULES_EN_LABELS.ruleTitle, { position: 2 })).toBe(
      'Rule 2'
    );
    expect(formatGuardrailFormMessage(GUARDRAIL_RULES_EN_LABELS.fieldsSelected, { count: 3 })).toBe(
      '3 fields selected'
    );
    expect(
      formatGuardrailFormMessage(GUARDRAIL_RULES_EN_LABELS.removeField, { name: 'Summary' })
    ).toBe('Remove field Summary');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(GUARDRAIL_RULES_EN_MESSAGES['guardrails.rules.delete-rule']).toBe(
      'Delete rule {position}'
    );
  });
});

describe('GUARDRAIL_FILTER_FIELD_SELECTOR_EN_LABELS', () => {
  it('takes its English from the rules block, id for id', () => {
    for (const key of GUARDRAIL_FILTER_FIELD_SELECTOR_LABEL_KEYS) {
      expect(GUARDRAIL_FILTER_FIELD_SELECTOR_EN_LABELS[key]).toBe(GUARDRAIL_RULES_EN_LABELS[key]);
    }
    expect(Object.keys(GUARDRAIL_FILTER_FIELD_SELECTOR_EN_LABELS)).toHaveLength(
      GUARDRAIL_FILTER_FIELD_SELECTOR_LABEL_KEYS.length
    );
  });

  it('layers like every other set', () => {
    const labels = resolveGuardrailFilterFieldSelectorLabels(
      { filterFieldsLabel: 'Zu filternde Felder' },
      { selectFields: undefined }
    );

    expect(labels.filterFieldsLabel).toBe('Zu filternde Felder');
    expect(labels.selectFields).toBe('Select fields');
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

describe('resolveCentralizedGuardrailsLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveCentralizedGuardrailsLabels()).toEqual(CENTRALIZED_GUARDRAILS_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveCentralizedGuardrailsLabels(
      { title: 'Zentralisierte Leitplanken', provider: 'Anbieter' },
      { provider: 'Provider (host)' }
    );

    expect(labels.title).toBe('Zentralisierte Leitplanken');
    expect(labels.provider).toBe('Provider (host)');
    expect(labels.scopes).toBe(CENTRALIZED_GUARDRAILS_EN_LABELS.scopes);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveCentralizedGuardrailsLabels(
      { title: undefined },
      { originUiPath: undefined }
    );

    expect(labels.title).toBe('Centralized guardrails');
    expect(labels.originUiPath).toBe('UiPath managed');
  });

  it('keeps the English templates in the `{{token}}` convention the component formats', () => {
    expect(CENTRALIZED_GUARDRAILS_EN_LABELS.policyCaption).toContain('{{policyName}}');
    expect(CENTRALIZED_GUARDRAILS_EN_LABELS.viewDetails).toContain('{{name}}');
    // The catalogs store the ICU source instead, which is what translators receive.
    expect(CENTRALIZED_GUARDRAILS_EN_MESSAGES['guardrails.centralized.policy-caption']).toContain(
      '{policyName}'
    );
  });
});

describe('resolveGuardrailScopeSelectorLabels', () => {
  it('returns the English defaults when there is nothing to merge', () => {
    expect(resolveGuardrailScopeSelectorLabels()).toEqual(GUARDRAIL_SCOPE_SELECTOR_EN_LABELS);
  });

  it('layers the catalog over the defaults and the overrides over both', () => {
    const labels = resolveGuardrailScopeSelectorLabels(
      { scopesLabel: 'Bereiche', toolsLabel: 'Werkzeuge' },
      { toolsLabel: 'Tools' }
    );

    expect(labels.scopesLabel).toBe('Bereiche');
    expect(labels.toolsLabel).toBe('Tools');
    expect(labels.scopeLlmLabel).toBe(GUARDRAIL_SCOPE_SELECTOR_EN_LABELS.scopeLlmLabel);
  });

  it('never lets an absent string blank a default', () => {
    const labels = resolveGuardrailScopeSelectorLabels(
      { scopesLabel: undefined },
      { scopeAgentLabel: undefined }
    );

    expect(labels.scopesLabel).toBe('Scopes');
    expect(labels.scopeAgentLabel).toBe('Agent');
  });
});

describe('GUARDRAIL_SCOPE_SELECTOR_EN_LABELS', () => {
  it('takes its English from the builder block, id for id', () => {
    for (const key of GUARDRAIL_SCOPE_SELECTOR_LABEL_KEYS) {
      expect(GUARDRAIL_SCOPE_SELECTOR_EN_LABELS[key]).toBe(GUARDRAIL_BUILDER_EN_LABELS[key]);
    }
    expect(Object.keys(GUARDRAIL_SCOPE_SELECTOR_EN_LABELS)).toHaveLength(
      GUARDRAIL_SCOPE_SELECTOR_LABEL_KEYS.length
    );
  });
});

describe('the other label sets still layer the same way', () => {
  // Every resolver shares one `mergeLabels`, so one case per set is enough to catch a wiring
  // mistake in the shared helper.
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

  it('carries every centralized message with the same English', () => {
    expect(findCatalogDrift(CENTRALIZED_GUARDRAILS_EN_MESSAGES)).toEqual({
      missing: [],
      drifted: [],
    });
  });

  it('carries no centralized message the source no longer declares', () => {
    expect(
      findCatalogOrphans(CENTRALIZED_GUARDRAILS_EN_MESSAGES, 'guardrails.centralized.')
    ).toEqual([]);
  });

  it('carries every rules message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_RULES_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no rules message the source no longer declares', () => {
    expect(findCatalogOrphans(GUARDRAIL_RULES_EN_MESSAGES, 'guardrails.rules.')).toEqual([]);
  });

  it('resolves the rules block’s one reused id from the validator form, with its English', () => {
    expect(GUARDRAIL_RULES_EN_MESSAGES['guardrails.form.more-information']).toBe(
      GUARDRAIL_FORM_EN_LABELS.moreInformation
    );
  });

  it('resolves the reused ids from the blocks that own them, with identical English', () => {
    const reused: Record<string, string> = {};
    for (const id of REUSED_IDS) {
      const message = CENTRALIZED_GUARDRAILS_EN_MESSAGES[id];
      expect(message).toBeDefined();
      reused[id] = message as string;
    }

    expect(findCatalogDrift(reused)).toEqual({ missing: [], drifted: [] });
  });
});
