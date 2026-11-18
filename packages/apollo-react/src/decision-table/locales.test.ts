import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ExtractedMessage, getConfig } from '@lingui/conf';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const folder = dirname(fileURLToPath(import.meta.url));
const linguiConfig = getConfig({ configPath: join(folder, '..', '..', 'lingui.config.ts') });

const sourceFiles = readdirSync(folder, { recursive: true, encoding: 'utf8' })
  .map((path) => join(folder, path))
  .filter((path) => linguiConfig.extractors?.some((extractor) => extractor.match(path)));

const mayHoldMessages = /@lingui|i18n|\b_\s*\(/;

const extractedFrom = async (path: string): Promise<ExtractedMessage[]> => {
  const code = readFileSync(path, 'utf8');
  const extractor = linguiConfig.extractors?.find((candidate) => candidate.match(path));
  const found: ExtractedMessage[] = [];
  if (!mayHoldMessages.test(code)) return found;
  await extractor?.extract(path, code, (message) => found.push(message), { linguiConfig });
  return found;
};

const sources = sourceFiles.map((path) =>
  ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
);

const hooksWithDeps = new Set([
  'useCallback',
  'useEffect',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
]);

const literalIn = (descriptor: ts.ObjectLiteralExpression, name: string): boolean =>
  descriptor.properties.some(
    (property) =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === name &&
      ts.isStringLiteralLike(property.initializer)
  );

const readable = (call: ts.CallExpression): boolean => {
  const [descriptor] = call.arguments;
  return (
    descriptor !== undefined &&
    ts.isObjectLiteralExpression(descriptor) &&
    literalIn(descriptor, 'id') &&
    literalIn(descriptor, 'message')
  );
};

const calleeName = (call: ts.CallExpression): string | undefined =>
  ts.isIdentifier(call.expression)
    ? call.expression.text
    : ts.isPropertyAccessExpression(call.expression)
      ? call.expression.name.text
      : undefined;

const declares = (name: ts.Identifier): boolean =>
  (ts.isBindingElement(name.parent) ||
    ts.isParameter(name.parent) ||
    ts.isVariableDeclaration(name.parent)) &&
  name.parent.name === name;

const listsAsDependency = (name: ts.Identifier): boolean => {
  const list = name.parent;
  const call = list.parent;
  return (
    ts.isArrayLiteralExpression(list) &&
    ts.isCallExpression(call) &&
    call.arguments.indexOf(list) === 1 &&
    hooksWithDeps.has(calleeName(call) ?? '')
  );
};

const allowedTranslate = (name: ts.Identifier): boolean =>
  declares(name) ||
  listsAsDependency(name) ||
  (ts.isCallExpression(name.parent) && name.parent.expression === name && readable(name.parent));

const destructuresOnlyTranslate = (call: ts.CallExpression): boolean => {
  const declaration = call.parent;
  return (
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer === call &&
    ts.isObjectBindingPattern(declaration.name) &&
    declaration.name.elements.every(
      (element) =>
        element.dotDotDotToken === undefined &&
        (element.propertyName === undefined ||
          !ts.isIdentifier(element.propertyName) ||
          element.propertyName.text !== '_')
    )
  );
};

const allowedHook = (name: ts.Identifier): boolean =>
  (ts.isImportSpecifier(name.parent) && name.parent.propertyName === undefined) ||
  (ts.isCallExpression(name.parent) &&
    name.parent.expression === name &&
    destructuresOnlyTranslate(name.parent));

const unreadableTranslationsIn = (source: ts.SourceFile): string[] => {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isIdentifier(node) &&
      ((node.text === '_' && !allowedTranslate(node)) ||
        (node.text === 'useSafeLingui' && !allowedHook(node)))
    ) {
      found.push(`${source.fileName}: ${node.parent.getText(source)}`);
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.endsWith('i18n/useSafeLingui') &&
      node.importClause?.namedBindings !== undefined &&
      ts.isNamespaceImport(node.importClause.namedBindings)
    ) {
      found.push(`${source.fileName}: ${node.getText(source)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

describe('decision-table English catalog', () => {
  const catalog: Record<string, string> = JSON.parse(
    readFileSync(join(folder, 'locales', 'en.json'), 'utf8')
  );

  it('equals what the configured extractor finds in the folder', async () => {
    const extracted = (await Promise.all(sourceFiles.map(extractedFrom))).flat();
    const messages = new Map<string, Set<string | undefined>>();
    for (const { id, message } of extracted)
      messages.set(id, (messages.get(id) ?? new Set()).add(message));
    expect(Object.fromEntries([...messages].map(([id, texts]) => [id, [...texts]]))).toEqual(
      Object.fromEntries(Object.entries(catalog).map(([id, text]) => [id, [text]]))
    );
  });

  it('translates only through `_` with a literal id and message the extractor can read', () => {
    expect(sources.flatMap(unreadableTranslationsIn)).toEqual([]);
  });
});
