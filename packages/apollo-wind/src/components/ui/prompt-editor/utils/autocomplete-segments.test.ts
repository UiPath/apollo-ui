import { describe, expect, it } from 'vitest';
import type { PromptEditorAutoCompleteOption } from '../types';
import {
  inferTokenTypeFromPath,
  normalizeVariablePath,
  shouldSuppressOpenForDismissed,
  VARIABLE_PATH_REGEX,
} from './autocomplete-segments';

const OPTIONS: PromptEditorAutoCompleteOption[] = [
  { type: 'input', value: 'vars.firstName' },
  { type: 'output', value: 'vars.summary' },
  { type: 'state', value: 'state.retry' },
];

describe('inferTokenTypeFromPath', () => {
  it('returns the exact option type when the path matches', () => {
    expect(inferTokenTypeFromPath('vars.summary', OPTIONS)).toBe('output');
  });

  it("falls back to the closest known ancestor's type", () => {
    expect(inferTokenTypeFromPath('vars.summary.first', OPTIONS)).toBe('output');
  });

  it("defaults to 'input' when nothing matches", () => {
    expect(inferTokenTypeFromPath('unknown.path', OPTIONS)).toBe('input');
    expect(inferTokenTypeFromPath('vars.unmatched', OPTIONS)).toBe('input');
  });

  it('falls back to the leading namespace for state/resource with no matching option', () => {
    expect(inferTokenTypeFromPath('state.unknown', OPTIONS)).toBe('state');
    expect(inferTokenTypeFromPath('resource.unknown', OPTIONS)).toBe('resource');
  });

  it('matches options across differing array indices', () => {
    const indexed: PromptEditorAutoCompleteOption[] = [
      { type: 'output', value: 'vars.records[0].id' },
    ];
    expect(inferTokenTypeFromPath('vars.records[1].id', indexed)).toBe('output');
    expect(inferTokenTypeFromPath('vars.records[7].id.nested', indexed)).toBe('output');
  });
});

describe('normalizeVariablePath', () => {
  it('normalizes numeric array indices to []', () => {
    expect(normalizeVariablePath('vars.records[0].id')).toBe('vars.records[].id');
    expect(normalizeVariablePath('vars.a[12].b[3]')).toBe('vars.a[].b[]');
  });

  it('leaves paths without indices untouched', () => {
    expect(normalizeVariablePath('vars.firstName')).toBe('vars.firstName');
  });
});

describe('VARIABLE_PATH_REGEX (free-form Enter commit)', () => {
  it.each([
    'vars.firstName',
    'metadata.run.id',
    'agent.name',
    'vars.a.b.c',
    'state.retryCount',
    'resource.knowledgeBase',
    'vars.records[0].id',
    'vars.a[12].b[3]',
  ])('accepts valid path %s', (path) => expect(VARIABLE_PATH_REGEX.test(path)).toBe(true));

  it.each([
    'vars',
    'vars.',
    'foo.bar',
    '$vars.firstName',
    'vars.1bad',
    '',
  ])('rejects invalid path %s', (path) => expect(VARIABLE_PATH_REGEX.test(path)).toBe(false));
});

describe('shouldSuppressOpenForDismissed', () => {
  it('does not suppress when nothing was dismissed', () => {
    expect(shouldSuppressOpenForDismissed({ triggerIndex: 0, nodeKey: 'a' }, null)).toBe(false);
  });

  it('suppresses when the trigger matches the dismissed position', () => {
    const t = { triggerIndex: 3, nodeKey: 'node-1' };
    expect(shouldSuppressOpenForDismissed(t, { ...t })).toBe(true);
  });

  it('does not suppress a different node or index', () => {
    const dismissed = { triggerIndex: 3, nodeKey: 'node-1' };
    expect(shouldSuppressOpenForDismissed({ triggerIndex: 3, nodeKey: 'node-2' }, dismissed)).toBe(
      false
    );
    expect(shouldSuppressOpenForDismissed({ triggerIndex: 4, nodeKey: 'node-1' }, dismissed)).toBe(
      false
    );
  });
});
