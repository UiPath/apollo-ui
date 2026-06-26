import { setupI18n } from '@lingui/core';
import { LinguiContext } from '@lingui/react';
import { useContext, useMemo } from 'react';

type Descriptor = { id: string; message?: string; values?: Record<string, unknown> };
type Translate = {
  (descriptor: Descriptor): string;
  (id: string): string;
};

const fallbackI18n = setupI18n({ locale: 'en', messages: { en: {} } });

// Formats the `message` (English default baked into the macro call) when no
// I18nProvider is mounted upstream. Falls back to `id` if no message is given.
const fallbackTranslate = ((arg: Descriptor | string): string => {
  if (typeof arg === 'string') {
    return arg;
  }

  if (!arg.message) {
    return arg.id;
  }

  return fallbackI18n._(arg);
}) as Translate;

// Drop-in replacement for `useLingui()` from `@lingui/react` that does NOT
// throw when there is no I18nProvider upstream. Reads `LinguiContext` directly
// and returns the real translator when available, otherwise a fallback that
// returns the English `message` baked into each descriptor.
//
// Use this in design-system components that need to render in hosts that
// haven't (yet) wrapped them in `ApI18nProvider` / `I18nProvider`.
export function useSafeLingui(): { _: Translate } {
  const ctx = useContext(LinguiContext);
  return useMemo(() => ({ _: (ctx?._ as Translate | undefined) ?? fallbackTranslate }), [ctx]);
}
