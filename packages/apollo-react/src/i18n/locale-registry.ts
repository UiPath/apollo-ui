/**
 * Pre-imported locale registry
 * All locales are statically imported at build time for better performance
 */

// @ts-expect-error - CommonJS modules without type definitions
import apChatDe from '../material/components/ap-chat/locales/de.js';
// Pre-import all locales for ap-chat component
// @ts-expect-error - CommonJS modules without type definitions
import apChatEn from '../material/components/ap-chat/locales/en.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatEsMX from '../material/components/ap-chat/locales/es-MX.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatEs from '../material/components/ap-chat/locales/es.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatFr from '../material/components/ap-chat/locales/fr.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatJa from '../material/components/ap-chat/locales/ja.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatKo from '../material/components/ap-chat/locales/ko.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatPtBR from '../material/components/ap-chat/locales/pt-BR.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatPt from '../material/components/ap-chat/locales/pt.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatRu from '../material/components/ap-chat/locales/ru.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatTr from '../material/components/ap-chat/locales/tr.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatZhCN from '../material/components/ap-chat/locales/zh-CN.js';
// @ts-expect-error - CommonJS modules without type definitions
import apChatZhTW from '../material/components/ap-chat/locales/zh-TW.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallDe from '../material/components/ap-tool-call/locales/de.js';
// Pre-import all locales for ap-tool-call component
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallEn from '../material/components/ap-tool-call/locales/en.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallEsMX from '../material/components/ap-tool-call/locales/es-MX.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallEs from '../material/components/ap-tool-call/locales/es.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallFr from '../material/components/ap-tool-call/locales/fr.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallJa from '../material/components/ap-tool-call/locales/ja.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallKo from '../material/components/ap-tool-call/locales/ko.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallPtBR from '../material/components/ap-tool-call/locales/pt-BR.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallPt from '../material/components/ap-tool-call/locales/pt.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallRu from '../material/components/ap-tool-call/locales/ru.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallTr from '../material/components/ap-tool-call/locales/tr.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallZhCN from '../material/components/ap-tool-call/locales/zh-CN.js';
// @ts-expect-error - CommonJS modules without type definitions
import apToolCallZhTW from '../material/components/ap-tool-call/locales/zh-TW.js';
import type { SupportedLocale } from './ApI18nProvider';

type LocaleMessages = Record<string, string>;

/**
 * Helper to extract messages from locale module
 * Handles both CommonJS (module.exports) and ES module formats
 */
function extractMessages(localeModule: unknown): LocaleMessages {
  // CommonJS format: module.exports = { messages: ... }
  if (typeof localeModule === 'object' && localeModule !== null && 'messages' in localeModule) {
    const moduleWithMessages = localeModule as { messages: LocaleMessages };
    return moduleWithMessages.messages;
  }
  // ES module default export
  if (typeof localeModule === 'object' && localeModule !== null && 'default' in localeModule) {
    const moduleWithDefault = localeModule as { default: unknown };
    const defaultExport = moduleWithDefault.default;
    if (typeof defaultExport === 'object' && defaultExport !== null && 'messages' in defaultExport) {
      return (defaultExport as { messages: LocaleMessages }).messages;
    }
    if (typeof defaultExport === 'string') {
      return JSON.parse(defaultExport);
    }
    return defaultExport as LocaleMessages;
  }
  // Direct export or string
  if (typeof localeModule === 'string') {
    return JSON.parse(localeModule);
  }
  return localeModule as LocaleMessages;
}

/**
 * Registry mapping component paths to their pre-imported locale messages
 */
const localeRegistry: Record<string, Record<SupportedLocale, LocaleMessages>> = {
  'material/components/ap-chat': {
    en: extractMessages(apChatEn),
    es: extractMessages(apChatEs),
    pt: extractMessages(apChatPt),
    de: extractMessages(apChatDe),
    fr: extractMessages(apChatFr),
    ja: extractMessages(apChatJa),
    ko: extractMessages(apChatKo),
    ru: extractMessages(apChatRu),
    tr: extractMessages(apChatTr),
    'zh-CN': extractMessages(apChatZhCN),
    'zh-TW': extractMessages(apChatZhTW),
    'pt-BR': extractMessages(apChatPtBR),
    'es-MX': extractMessages(apChatEsMX),
  },
  'material/components/ap-tool-call': {
    en: extractMessages(apToolCallEn),
    es: extractMessages(apToolCallEs),
    pt: extractMessages(apToolCallPt),
    de: extractMessages(apToolCallDe),
    fr: extractMessages(apToolCallFr),
    ja: extractMessages(apToolCallJa),
    ko: extractMessages(apToolCallKo),
    ru: extractMessages(apToolCallRu),
    tr: extractMessages(apToolCallTr),
    'zh-CN': extractMessages(apToolCallZhCN),
    'zh-TW': extractMessages(apToolCallZhTW),
    'pt-BR': extractMessages(apToolCallPtBR),
    'es-MX': extractMessages(apToolCallEsMX),
  },
};

/**
 * Get pre-imported locale messages for a component
 * Returns undefined if component is not in the registry (fallback to dynamic import)
 */
export function getPreImportedMessages(
  component: string,
  locale: SupportedLocale
): LocaleMessages | undefined {
  const componentLocales = localeRegistry[component];
  if (!componentLocales) {
    return undefined;
  }
  return componentLocales[locale];
}

/**
 * Get all pre-imported locales for a component
 */
export function getAllPreImportedLocales(component: string): Record<SupportedLocale, LocaleMessages> | undefined {
  return localeRegistry[component];
}

