import { setupI18n } from '@lingui/core';
import { compileMessage } from '@lingui/message-utils/compileMessage';
import { LinguiContext } from '@lingui/react';
import { useContext, useMemo } from 'react';

type Descriptor = {
  id: string;
  message?: string;
  values?: Record<string, unknown>;
};
type Translate = {
  (descriptor: Descriptor): string;
  (id: string): string;
};

// Production builds of @lingui/core do not compile raw message strings at
// runtime — plurals and interpolation render verbatim (e.g. literally
// "{count, plural, ...}"). The fallback therefore pre-compiles each English
// default once and hands lingui compiled tokens instead.
const fallbackI18n = setupI18n({ locale: 'en', messages: { en: {} } });
const compiledIds = new Set<string>();

// Formats the `message` (English default baked into the macro call) when no
// I18nProvider is mounted upstream. Falls back to `id` if no message is given.
const fallbackTranslate = ((arg: Descriptor | string): string => {
  if (typeof arg === 'string') {
    return arg;
  }

  if (!arg.message) {
    return arg.id;
  }

  if (!compiledIds.has(arg.id)) {
    fallbackI18n.load('en', { [arg.id]: compileMessage(arg.message) });
    compiledIds.add(arg.id);
  }

  return fallbackI18n._(arg.id, arg.values);
}) as Translate;

// Drop-in replacement for `useLingui()` from `@lingui/react` that does NOT
// throw when there is no I18nProvider upstream. Reads `LinguiContext` directly
// and returns the real translator when available, otherwise a fallback that
// formats the English `message` baked into each descriptor.
//
// Use this in design-system components that need to render in hosts that
// haven't (yet) wrapped them in `ApI18nProvider` / `I18nProvider`.
export function useSafeLingui(): { _: Translate } {
  const ctx = useContext(LinguiContext);
  return useMemo(() => {
    if (!ctx) {
      return { _: fallbackTranslate };
    }
    const providerTranslate = ((arg: Descriptor | string): string => {
      // Ids missing from the host's active catalog hit the same production
      // pitfall as the no-provider case — route them through the compiling
      // English fallback instead of returning the raw message.
      if (typeof arg !== 'string' && arg.message && !(arg.id in (ctx.i18n.messages ?? {}))) {
        return fallbackTranslate(arg);
      }
      return (ctx._ as Translate)(arg as Descriptor);
    }) as Translate;
    return { _: providerTranslate };
  }, [ctx]);
}
