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

const extractedFrom = async (path: string): Promise<ExtractedMessage[]> => {
  const extractor = linguiConfig.extractors?.find((candidate) => candidate.match(path));
  const found: ExtractedMessage[] = [];
  await extractor?.extract(path, readFileSync(path, 'utf8'), (message) => found.push(message), {
    linguiConfig,
  });
  return found;
};

const program = ts.createProgram(sourceFiles, {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  noEmit: true,
  skipLibCheck: true,
  allowJs: true,
});
const checker = program.getTypeChecker();

const isTranslate = (type: ts.Type): boolean =>
  type.getCallSignatures().some((signature) => {
    const declaration = signature.getDeclaration();
    return (
      ts.isCallSignatureDeclaration(declaration) &&
      declaration.getSourceFile().fileName.endsWith('i18n/useSafeLingui.ts')
    );
  });

const translates = (callee: ts.Expression): boolean =>
  isTranslate(checker.getTypeAtLocation(callee));

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
    ts.isIdentifier(call.expression) &&
    call.expression.text === '_' &&
    descriptor !== undefined &&
    ts.isObjectLiteralExpression(descriptor) &&
    literalIn(descriptor, 'id') &&
    literalIn(descriptor, 'message')
  );
};

const declares = (name: ts.Identifier): boolean =>
  (ts.isBindingElement(name.parent) ||
    ts.isParameter(name.parent) ||
    ts.isVariableDeclaration(name.parent)) &&
  name.parent.name === name;

const listsAsDependency = (name: ts.Identifier): boolean => {
  const list = name.parent;
  const call = list.parent;
  if (!ts.isArrayLiteralExpression(list) || !ts.isCallExpression(call)) return false;
  const signature = checker.getResolvedSignature(call);
  return (
    signature?.getParameters().at(call.arguments.indexOf(list))?.name === 'deps' &&
    (signature.getDeclaration()?.getSourceFile().fileName.includes('/@types/react/') ?? false)
  );
};

const allowed = (name: ts.Identifier): boolean =>
  name.text === '_' &&
  (declares(name) ||
    listsAsDependency(name) ||
    (ts.isCallExpression(name.parent) && name.parent.expression === name && readable(name.parent)));

const isValue = (name: ts.Identifier): boolean =>
  ((checker.getSymbolAtLocation(name)?.flags ?? 0) & ts.SymbolFlags.Value) !== 0;

const unreadableTranslationsIn = (path: string): string[] => {
  const source = program.getSourceFile(path);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && isValue(node) && translates(node) && !allowed(node)) {
      found.push(`${path}: ${node.parent.getText(source)}`);
    }
    if (ts.isCallExpression(node) && translates(node.expression) && !readable(node)) {
      found.push(`${path}: ${node.getText(source)}`);
    }
    ts.forEachChild(node, visit);
  };
  if (source) visit(source);
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
    expect(sourceFiles.flatMap(unreadableTranslationsIn)).toEqual([]);
  });
});
