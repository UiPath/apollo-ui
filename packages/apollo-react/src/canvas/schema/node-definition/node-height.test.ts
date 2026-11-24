import { describe, expect, it } from 'vitest';
import { displayConfigSchema } from '../node-instance/base';
import { nodeManifestSchema } from './node-manifest';

describe('display.height', () => {
  const manifestWithHeight = (height: unknown) => ({
    nodeType: 'uipath.test.node',
    version: '1.0.0',
    display: { label: 'Test Node', height },
    tags: [],
    sortOrder: 0,
    handleConfiguration: [],
  });

  it.each([64, 96, 128, 160])('accepts %ipx, in 32px steps', (height) => {
    expect(() => nodeManifestSchema.parse(manifestWithHeight(height))).not.toThrow();
    expect(() => displayConfigSchema.parse({ height })).not.toThrow();
  });

  it.each([
    [32, 'below the minimum'],
    [80, 'off the 32px step'],
    [192, 'above the maximum'],
    [64.5, 'not a whole number'],
  ])('rejects %spx (%s)', (height) => {
    expect(() => nodeManifestSchema.parse(manifestWithHeight(height))).toThrow();
    expect(() => displayConfigSchema.parse({ height })).toThrow();
  });

  it('is optional', () => {
    expect(() => nodeManifestSchema.parse(manifestWithHeight(undefined))).not.toThrow();
    expect(() => displayConfigSchema.parse({})).not.toThrow();
  });
});
