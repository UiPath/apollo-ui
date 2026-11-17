import type { useSafeLingui } from '../i18n/useSafeLingui';

/** The view's translator: an `{ id, message }` descriptor in, the active locale's text out. */
export type Translate = ReturnType<typeof useSafeLingui>['_'];
