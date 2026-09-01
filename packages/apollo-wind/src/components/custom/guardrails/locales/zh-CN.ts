// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: '更多信息',
  enumPlaceholder: '选择...',
  enumListPlaceholder: '选择选项...',
  addItem: '添加',
  removeItem: '移除 {{label}} {{position}}',
};
