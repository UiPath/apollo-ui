import babelExtractor from '@lingui/cli/api/extractors/babel';
import type { ExtractorType, LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-json';
import ts from 'typescript';

const decisionTable = 'src/decision-table';

const withTranslateCallsMarked = (filename: string, code: string): string => {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
  const starts: number[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === '_'
    ) {
      const [descriptor] = node.arguments;
      if (descriptor && ts.isObjectLiteralExpression(descriptor))
        starts.push(descriptor.getStart(source));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return starts.reduceRight((text, at) => `${text.slice(0, at)}/*i18n*/${text.slice(at)}`, code);
};

const translateCallExtractor: ExtractorType = {
  match: (filename) =>
    filename.replaceAll('\\', '/').includes(`/${decisionTable}/`) && babelExtractor.match(filename),
  extract: (filename, code, onMessageExtracted, ctx) =>
    babelExtractor.extract(
      filename,
      withTranslateCallsMarked(filename, code),
      onMessageExtracted,
      ctx
    ),
};

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
    {
      path: `${decisionTable}/locales/{locale}`,
      include: [decisionTable],
    },
  ],
  extractors: [translateCallExtractor, babelExtractor],
  format: formatter({ style: 'minimal' }),
  compileNamespace: 'ts',
};

export default config;
