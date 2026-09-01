// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: 'Daha fazla bilgi',
  enumPlaceholder: 'Seç...',
  enumListPlaceholder: 'Seçenek belirle...',
  addItem: 'Ekle',
  removeItem: '{{label}} {{position}} öğesini kaldır',
};
