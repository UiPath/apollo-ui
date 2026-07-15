import { describe, expect, it } from 'vitest';
import {
  appendPathSegment,
  buildJsonTree,
  collectContainerPaths,
  flattenJsonTree,
  formatLeafValue,
  getValueAtPath,
  isArrayItemTemplateRoot,
  removeValueAtPath,
  setValueAtPath,
} from './buildJsonTree';
import type { JsonSchema, JsonTreeNode } from './JsonTree.types';

const SCHEMA: JsonSchema = {
  type: 'object',
  required: ['statusCode'],
  properties: {
    statusCode: { type: 'integer' },
    responseBody: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string', enum: ['USD', 'EUR'] },
      },
    },
    errorMessage: { type: ['string', 'null'] },
    cached: { type: 'boolean' },
  },
};

function byKey(nodes: JsonTreeNode[] | undefined, key: string): JsonTreeNode {
  const node = nodes?.find((n) => n.key === key);
  if (!node) throw new Error(`node ${key} not found`);
  return node;
}

describe('appendPathSegment', () => {
  it('joins identifier keys with dots', () => {
    expect(appendPathSegment('a', 'b')).toBe('a.b');
    expect(appendPathSegment('', 'root')).toBe('root');
  });

  it('bracket-quotes non-identifier keys', () => {
    expect(appendPathSegment('headers', 'content-type')).toBe('headers["content-type"]');
  });

  it('brackets array indices', () => {
    expect(appendPathSegment('items', 2)).toBe('items[2]');
  });
});

describe('buildJsonTree', () => {
  it('builds nodes from the value with their schema attached', () => {
    const tree = buildJsonTree({
      schema: SCHEMA,
      value: { statusCode: 200, errorMessage: null, cached: false },
    });
    const statusCode = byKey(tree, 'statusCode');
    expect(statusCode.type).toBe('number');
    expect(statusCode.value).toBe(200);
    expect(statusCode.schema).toEqual({ type: 'integer' });
    expect(statusCode.required).toBe(true);
    expect(byKey(tree, 'errorMessage').type).toBe('null');
    expect(byKey(tree, 'cached').value).toBe(false);
  });

  it('renders schema-declared keys absent from the value as unset', () => {
    const tree = buildJsonTree({ schema: SCHEMA, value: { statusCode: 200 } });
    const unset = byKey(tree, 'responseBody');
    expect(unset.value).toBeUndefined();
    expect(unset.type).toBe('object');
    // Structure keeps extending from the schema below the unset branch.
    expect(byKey(unset.children, 'id').value).toBeUndefined();
    expect(byKey(unset.children, 'id').type).toBe('string');
  });

  it('renders value keys the schema does not declare', () => {
    const tree = buildJsonTree({
      schema: SCHEMA,
      value: { statusCode: 200, debugInfo: { attempt: 1 } },
    });
    const undeclared = byKey(tree, 'debugInfo');
    expect(undeclared.schema).toBeUndefined();
    expect(byKey(undeclared.children, 'attempt').value).toBe(1);
  });

  it('attaches an additionalProperties schema to undeclared keys', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {},
      additionalProperties: { type: 'string', enum: ['yes', 'no'] },
    };
    const tree = buildJsonTree({ schema, value: { ok: 'yes' } });
    expect(byKey(tree, 'ok').schema).toEqual({ type: 'string', enum: ['yes', 'no'] });
  });

  it('paths array items by index and attaches the items schema', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    };
    const tree = buildJsonTree({ schema, value: { tags: ['a', 'b'] } });
    const tags = byKey(tree, 'tags');
    expect(tags.children?.map((c) => c.path)).toEqual(['tags[0]', 'tags[1]']);
    expect(tags.children?.[0]?.schema).toEqual({ type: 'string' });
  });

  it('previews a scalar array item shape from the schema when there is no value', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    };
    const tree = buildJsonTree({ schema });
    const tags = byKey(tree, 'tags');
    expect(tags.type).toBe('array');
    expect(tags.value).toBeUndefined();
    expect(tags.children).toHaveLength(1);
    const [preview] = tags.children!;
    expect(preview?.isArrayItemTemplate).toBe(true);
    expect(preview?.type).toBe('string');
    expect(preview?.value).toBeUndefined();
    expect(preview?.path).toBe('tags[0]');
  });

  it('previews an object array item shape, flagging the whole subtree', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, count: { type: 'integer' } },
          },
        },
      },
    };
    const tree = buildJsonTree({ schema });
    const [preview] = byKey(tree, 'rows').children!;
    expect(preview?.isArrayItemTemplate).toBe(true);
    expect(preview?.type).toBe('object');
    expect(byKey(preview?.children, 'name')?.isArrayItemTemplate).toBe(true);
    expect(byKey(preview?.children, 'name')?.type).toBe('string');
    expect(byKey(preview?.children, 'count')?.type).toBe('number');
  });

  it('previews the item shape for a present-but-empty array', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    };
    const tree = buildJsonTree({ schema, value: { tags: [] } });
    const [preview] = byKey(tree, 'tags').children!;
    expect(preview?.isArrayItemTemplate).toBe(true);
    expect(preview?.type).toBe('string');
  });

  it('does not add a preview item once the array has real items', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    };
    const tree = buildJsonTree({ schema, value: { tags: ['a'] } });
    const tags = byKey(tree, 'tags');
    expect(tags.children).toHaveLength(1);
    expect(tags.children?.[0]?.isArrayItemTemplate).toBeUndefined();
    expect(tags.children?.[0]?.value).toBe('a');
  });

  it('adds no preview item when the schema declares no items', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tags: { type: 'array' } },
    };
    const tree = buildJsonTree({ schema });
    expect(byKey(tree, 'tags').children).toHaveLength(0);
  });

  it('previews the item shape for a schema-only root array', () => {
    const tree = buildJsonTree({ schema: { type: 'array', items: { type: 'string' } } });
    expect(tree).toHaveLength(1);
    expect(tree[0]?.isArrayItemTemplate).toBe(true);
    expect(tree[0]?.type).toBe('string');
    expect(tree[0]?.path).toBe('[0]');
  });

  it('marks only the preview item itself as the template root, not its fields', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    };
    const [preview] = byKey(buildJsonTree({ schema }), 'rows').children!;
    // The preview item (an array element) is the "item" row; its object fields
    // are template nodes but not the root, so they keep their own key/label.
    expect(isArrayItemTemplateRoot(preview!)).toBe(true);
    expect(isArrayItemTemplateRoot(byKey(preview?.children, 'name'))).toBe(false);
  });

  it('builds a value-driven tree when no schema is given', () => {
    const tree = buildJsonTree({ value: { anything: { nested: true } } });
    const anything = byKey(tree, 'anything');
    expect(anything.type).toBe('object');
    expect(byKey(anything.children, 'nested').value).toBe(true);
  });

  it('prefixes paths with basePath', () => {
    const tree = buildJsonTree({ value: { a: 1 }, basePath: 'node1' });
    expect(byKey(tree, 'a').path).toBe('node1.a');
  });

  it('keeps value keys named after Object.prototype members', () => {
    // JSON.parse gives these as own data properties, not prototype members.
    const value = JSON.parse('{"constructor":1,"toString":"x","__proto__":{"a":2}}') as Record<
      string,
      unknown
    >;
    const tree = buildJsonTree({ value: value as never });
    const keys = tree.map((n) => n.key);
    expect(keys).toEqual(expect.arrayContaining(['constructor', 'toString', '__proto__']));
    expect(byKey(tree, 'constructor').value).toBe(1);
  });

  it('lets the value shape win over a mismatched root schema', () => {
    // A stale array schema must not hide an object value.
    const tree = buildJsonTree({
      schema: { type: 'array', items: { type: 'string' } },
      value: { a: 1 },
    });
    expect(byKey(tree, 'a').value).toBe(1);
  });
});

describe('flattenJsonTree', () => {
  const tree = buildJsonTree({
    schema: SCHEMA,
    value: {
      statusCode: 200,
      responseBody: { id: 'inv-001', amount: 1500, currency: 'USD' },
      debugInfo: { attempt: 1 },
    },
  });

  it('respects collapsed containers', () => {
    const open = flattenJsonTree(tree);
    const closed = flattenJsonTree(tree, { collapsed: { responseBody: true, debugInfo: true } });
    expect(open.length).toBeGreaterThan(closed.length);
    expect(closed.some((r) => r.node.key === 'id')).toBe(false);
  });

  it('filters by search query, keeping matching ancestors', () => {
    const rows = flattenJsonTree(tree, { query: 'currency' });
    expect(rows.some((r) => r.node.key === 'responseBody')).toBe(true);
    expect(rows.some((r) => r.node.key === 'currency')).toBe(true);
    expect(rows.some((r) => r.node.key === 'statusCode')).toBe(false);
  });

  it('shows the whole subtree when the query matches a container itself', () => {
    const rows = flattenJsonTree(tree, { query: 'responsebody' });
    const keys = rows.map((r) => r.node.key);
    // The container matched by its own key renders all of its children,
    // not just the ones that also match the query.
    expect(keys).toEqual(expect.arrayContaining(['responseBody', 'id', 'amount', 'currency']));
    expect(keys).not.toContain('statusCode');
  });

  it('still honors collapse state under a query-matched container', () => {
    const rows = flattenJsonTree(tree, {
      query: 'responsebody',
      collapsed: { responseBody: true },
    });
    expect(rows.map((r) => r.node.key)).toEqual(['responseBody']);
  });

  it('filters rows with a consumer predicate, keeping matching subtrees', () => {
    const rows = flattenJsonTree(tree, {
      filterPredicate: (node) => node.value === undefined,
    });
    const keys = rows.map((r) => r.node.key);
    expect(keys).toContain('errorMessage');
    expect(keys).toContain('cached');
    expect(keys).not.toContain('statusCode');
    expect(keys).not.toContain('debugInfo');
  });

  it('shows the whole subtree when the predicate matches a container itself', () => {
    const rows = flattenJsonTree(tree, {
      filterPredicate: (node) => node.key === 'responseBody',
    });
    const keys = rows.map((r) => r.node.key);
    expect(keys).toEqual(expect.arrayContaining(['responseBody', 'id', 'amount', 'currency']));
    expect(keys).not.toContain('statusCode');
  });
});

describe('value path helpers', () => {
  it('collects container paths with depth', () => {
    const tree = buildJsonTree({ value: { a: { b: { c: 1 } } } });
    expect(collectContainerPaths(tree)).toEqual([
      { path: 'a', depth: 0 },
      { path: 'a.b', depth: 1 },
    ]);
  });

  it('sets values immutably', () => {
    const original = { a: { b: 1 }, keep: true };
    const next = setValueAtPath(original, ['a', 'b'], 2);
    expect(next).toEqual({ a: { b: 2 }, keep: true });
    expect(original.a.b).toBe(1);
  });

  it('creates missing containers along the path', () => {
    expect(setValueAtPath({}, ['a', 0, 'b'], 'x')).toEqual({ a: [{ b: 'x' }] });
    expect(setValueAtPath(undefined, ['a'], 1)).toEqual({ a: 1 });
  });

  it('reads values back', () => {
    expect(getValueAtPath({ a: [{ b: 'x' }] }, ['a', 0, 'b'])).toBe('x');
    expect(getValueAtPath({ a: 1 }, ['missing'])).toBeUndefined();
  });

  it('removes object keys immutably', () => {
    const original = { a: { b: 1, c: 2 }, keep: true };
    const next = removeValueAtPath(original, ['a', 'b']);
    expect(next).toEqual({ a: { c: 2 }, keep: true });
    expect(original.a.b).toBe(1);
  });

  it('splices removed array items', () => {
    expect(removeValueAtPath({ a: [1, 2, 3] }, ['a', 1])).toEqual({ a: [1, 3] });
  });

  it('returns the root unchanged when the path does not resolve', () => {
    const original = { a: 1 };
    expect(removeValueAtPath(original, ['missing'])).toBe(original);
    expect(removeValueAtPath(original, ['a', 'deep'])).toBe(original);
  });

  it('removes the root itself when given no segments', () => {
    expect(removeValueAtPath({ a: 1 }, [])).toBeUndefined();
  });

  it('sets a prototype-name key as own, JSON-serializable data', () => {
    // Assignment would hit the `__proto__` setter and drop the value; the
    // helper must store an own data property that survives JSON.stringify.
    const next = setValueAtPath({}, ['__proto__'], { a: 1 });
    // A string compare avoids the `{ __proto__: … }` object-literal trap (which
    // would set the prototype rather than an own key).
    expect(JSON.stringify(next)).toBe('{"__proto__":{"a":1}}');
    expect(Object.hasOwn(next as object, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(next)).toBe(Object.prototype);
  });

  it('reads and removes prototype-name keys as own data', () => {
    const root = JSON.parse('{"toString":"x"}') as Record<string, unknown>;
    expect(getValueAtPath(root as never, ['toString'])).toBe('x');
    // A non-own inherited name resolves to undefined, not the prototype method.
    expect(getValueAtPath({ a: 1 }, ['toString'])).toBeUndefined();
    expect(removeValueAtPath(root as never, ['toString'])).toEqual({});
  });
});

describe('formatLeafValue', () => {
  it('quotes strings and passes scalars through', () => {
    expect(formatLeafValue('string', 'hi')).toBe('"hi"');
    expect(formatLeafValue('number', 42)).toBe('42');
    expect(formatLeafValue('boolean', false)).toBe('false');
    expect(formatLeafValue('null', null)).toBe('null');
  });
});
