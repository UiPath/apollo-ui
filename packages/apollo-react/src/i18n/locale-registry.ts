/**
 * Pre-imported locale registry
 * All locales are statically imported at build time for better performance
 */

import type { Messages } from '@lingui/core';
// Pre-import all locales for canvas component
import { messages as canvasDe } from '../canvas/locales/de';
import { messages as canvasEn } from '../canvas/locales/en';
import { messages as canvasEs } from '../canvas/locales/es';
import { messages as canvasEsMX } from '../canvas/locales/es-MX';
import { messages as canvasFr } from '../canvas/locales/fr';
import { messages as canvasJa } from '../canvas/locales/ja';
import { messages as canvasKo } from '../canvas/locales/ko';
import { messages as canvasPt } from '../canvas/locales/pt';
import { messages as canvasPtBR } from '../canvas/locales/pt-BR';
import { messages as canvasRo } from '../canvas/locales/ro';
import { messages as canvasRu } from '../canvas/locales/ru';
import { messages as canvasTr } from '../canvas/locales/tr';
import { messages as canvasZhCN } from '../canvas/locales/zh-CN';
import { messages as canvasZhTW } from '../canvas/locales/zh-TW';
// Pre-import all locales for chat component
import { messages as apChatDe } from '../chat/locales/de';
import { messages as apChatEn } from '../chat/locales/en';
import { messages as apChatEs } from '../chat/locales/es';
import { messages as apChatEsMX } from '../chat/locales/es-MX';
import { messages as apChatFr } from '../chat/locales/fr';
import { messages as apChatJa } from '../chat/locales/ja';
import { messages as apChatKo } from '../chat/locales/ko';
import { messages as apChatPt } from '../chat/locales/pt';
import { messages as apChatPtBR } from '../chat/locales/pt-BR';
import { messages as apChatRo } from '../chat/locales/ro';
import { messages as apChatRu } from '../chat/locales/ru';
import { messages as apChatTr } from '../chat/locales/tr';
import { messages as apChatZhCN } from '../chat/locales/zh-CN';
import { messages as apChatZhTW } from '../chat/locales/zh-TW';
// Pre-import all locales for ap-tool-call component
import { messages as apToolCallDe } from '../material/components/ap-tool-call/locales/de';
import { messages as apToolCallEn } from '../material/components/ap-tool-call/locales/en';
import { messages as apToolCallEs } from '../material/components/ap-tool-call/locales/es';
import { messages as apToolCallEsMX } from '../material/components/ap-tool-call/locales/es-MX';
import { messages as apToolCallFr } from '../material/components/ap-tool-call/locales/fr';
import { messages as apToolCallJa } from '../material/components/ap-tool-call/locales/ja';
import { messages as apToolCallKo } from '../material/components/ap-tool-call/locales/ko';
import { messages as apToolCallPt } from '../material/components/ap-tool-call/locales/pt';
import { messages as apToolCallPtBR } from '../material/components/ap-tool-call/locales/pt-BR';
import { messages as apToolCallRo } from '../material/components/ap-tool-call/locales/ro';
import { messages as apToolCallRu } from '../material/components/ap-tool-call/locales/ru';
import { messages as apToolCallTr } from '../material/components/ap-tool-call/locales/tr';
import { messages as apToolCallZhCN } from '../material/components/ap-tool-call/locales/zh-CN';
import { messages as apToolCallZhTW } from '../material/components/ap-tool-call/locales/zh-TW';
import type { SupportedLocale } from './ApI18nProvider';

const chatLocales: Record<SupportedLocale, Messages> = {
  en: apChatEn,
  es: apChatEs,
  pt: apChatPt,
  de: apChatDe,
  fr: apChatFr,
  ja: apChatJa,
  ko: apChatKo,
  ru: apChatRu,
  tr: apChatTr,
  'zh-CN': apChatZhCN,
  'zh-TW': apChatZhTW,
  'pt-BR': apChatPtBR,
  'es-MX': apChatEsMX,
  ro: apChatRo,
};

/**
 * Registry mapping component paths to their pre-imported locale messages
 */
const localeRegistry: Record<string, Record<SupportedLocale, Messages>> = {
  chat: chatLocales,
  // Key used before chat moved out of material/; kept for consumers that pass it to ApI18nProvider.
  'material/components/ap-chat': chatLocales,
  'material/components/ap-tool-call': {
    en: apToolCallEn,
    es: apToolCallEs,
    pt: apToolCallPt,
    de: apToolCallDe,
    fr: apToolCallFr,
    ja: apToolCallJa,
    ko: apToolCallKo,
    ru: apToolCallRu,
    tr: apToolCallTr,
    'zh-CN': apToolCallZhCN,
    'zh-TW': apToolCallZhTW,
    'pt-BR': apToolCallPtBR,
    'es-MX': apToolCallEsMX,
    ro: apToolCallRo,
  },
  canvas: {
    en: canvasEn,
    es: canvasEs,
    pt: canvasPt,
    de: canvasDe,
    fr: canvasFr,
    ja: canvasJa,
    ko: canvasKo,
    ru: canvasRu,
    tr: canvasTr,
    'zh-CN': canvasZhCN,
    'zh-TW': canvasZhTW,
    'pt-BR': canvasPtBR,
    'es-MX': canvasEsMX,
    ro: canvasRo,
  },
};

/**
 * Get pre-imported locale messages for a component
 * Returns undefined if component is not in the registry (fallback to dynamic import)
 */
export function getPreImportedMessages(
  component: string,
  locale: SupportedLocale
): Messages | undefined {
  const componentLocales = localeRegistry[component];
  if (!componentLocales) {
    return undefined;
  }
  return componentLocales[locale];
}

/**
 * Get all pre-imported locales for a component
 */
export function getAllPreImportedLocales(
  component: string
): Record<SupportedLocale, Messages> | undefined {
  return localeRegistry[component];
}
