// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: '更多資訊',
  enumPlaceholder: '選擇...',
  enumListPlaceholder: '選取選項...',
  addItem: '新增',
  removeItem: '移除 {{label}} {{position}}',
};
