// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: 'Plus d’informations',
  enumPlaceholder: 'Sélectionner...',
  enumListPlaceholder: 'Sélectionnez des options…',
  addItem: 'Ajouter',
  removeItem: 'Supprimer {{label}} {{position}}',
};
