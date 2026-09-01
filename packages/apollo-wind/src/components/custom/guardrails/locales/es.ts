// Translations harvested from Flow Workbench's canvas catalog (guardrailValidator_* keys)
// so the extraction introduces no new translation work. Missing keys fall back to English
// per key at resolve time (see i18n.ts).
import type { GuardrailValidatorFormLabels } from '../i18n';

export const messages: Partial<GuardrailValidatorFormLabels> = {
  moreInformation: 'Más información',
  enumPlaceholder: 'Seleccionar...',
  enumListPlaceholder: 'Seleccionar opciones...',
  addItem: 'Añadir',
  removeItem: 'Eliminar {{label}} {{position}}',
};
