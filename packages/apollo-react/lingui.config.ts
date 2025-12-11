import { LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-json';

const config: LinguiConfig = {
  locales: ['en', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'ru', 'tr', 'zh-CN', 'zh-TW', 'pt-BR', 'es-MX'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'src/material/components/ap-chat/locales/{locale}',
      include: ['src/material/components/ap-chat'],
    },
    {
      path: 'src/material/components/ap-tool-call/locales/{locale}',
      include: ['src/material/components/ap-tool-call'],
    },
  ],
  format: formatter({ style: 'minimal' }),
};

export default config;
