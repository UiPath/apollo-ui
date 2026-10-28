import type { LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-json';

const config: LinguiConfig = {
  locales: [
    'en',
    'es',
    'pt',
    'de',
    'fr',
    'ja',
    'ko',
    'ru',
    'tr',
    'zh-CN',
    'zh-TW',
    'pt-BR',
    'es-MX',
    'ro',
  ],
  // Production builds strip `message` from msg() descriptors, so an untranslated
  // key must be compiled to English here or it renders as its raw id.
  sourceLocale: 'en',
  fallbackLocales: { default: 'en' },
  orderBy: 'messageId',
  catalogs: [
    {
      path: 'src/chat/locales/{locale}',
      include: ['src/chat', 'src/material/components/ap-chat'],
    },
    {
      path: 'src/material/components/ap-tool-call/locales/{locale}',
      include: ['src/material/components/ap-tool-call'],
    },
    {
      path: 'src/material/components/ap-rich-text-editor/locales/{locale}',
      include: ['src/material/components/ap-rich-text-editor'],
    },
    {
      path: 'src/material/components/ap-model-picker/locales/{locale}',
      include: ['src/material/components/ap-model-picker'],
    },
    {
      path: 'src/canvas/locales/{locale}',
      include: ['src/canvas'],
    },
  ],
  format: formatter({ style: 'minimal' }),
  compileNamespace: 'ts',
};

export default config;
