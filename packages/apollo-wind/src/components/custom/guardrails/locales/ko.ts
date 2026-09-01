// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: '자세한 정보',
  enumPlaceholder: '선택...',
  enumListPlaceholder: '옵션 선택...',
  addItem: '추가',
  removeItem: '{{label}} {{position}} 제거',
};
