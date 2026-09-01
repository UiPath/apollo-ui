// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: 'Mais informações',
  enumPlaceholder: 'Selecionar...',
  enumListPlaceholder: 'Selecionar opções...',
  addItem: 'Adicionar',
  removeItem: 'Remover {{label}} {{position}}',
};
