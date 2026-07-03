import { LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-json';

const config: LinguiConfig = {
  locales: ['en', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'ru', 'tr', 'zh-CN', 'zh-TW', 'pt-BR', 'es-MX'],
  // sourceLocale: 'en', // Use keys, we can add this back if we want to fallback to english
  catalogs: [
    {
      path: 'src/material/components/ap-chat/locales/{locale}',
      include: ['src/material/components/ap-chat'],
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
