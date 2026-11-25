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

describe('display.iconSize', () => {
  const manifestWithIconSize = (iconSize: unknown) => ({
    nodeType: 'uipath.test.node',
    version: '1.0.0',
    display: { label: 'Test Node', iconSize },
    tags: [],
    sortOrder: 0,
    handleConfiguration: [],
  });

  it.each(['default', 'compact'])('accepts %s', (iconSize) => {
    expect(() => nodeManifestSchema.parse(manifestWithIconSize(iconSize))).not.toThrow();
    expect(() => displayConfigSchema.parse({ iconSize })).not.toThrow();
  });

  it('rejects other values', () => {
    expect(() => nodeManifestSchema.parse(manifestWithIconSize('small'))).toThrow();
    expect(() => displayConfigSchema.parse({ iconSize: 'small' })).toThrow();
  });
});

describe('display.labelLines', () => {
  const manifestWithLines = (labelLines: unknown) => ({
    nodeType: 'uipath.test.node',
    version: '1.0.0',
    display: { label: 'Test Node', labelLines },
    tags: [],
    sortOrder: 0,
    handleConfiguration: [],
  });

  it.each([1, 2, 4])('accepts %i', (labelLines) => {
    expect(() => nodeManifestSchema.parse(manifestWithLines(labelLines))).not.toThrow();
    expect(() => displayConfigSchema.parse({ labelLines })).not.toThrow();
  });

  it.each([0, 1.5, '2'])('rejects %s', (labelLines) => {
    expect(() => nodeManifestSchema.parse(manifestWithLines(labelLines))).toThrow();
    expect(() => displayConfigSchema.parse({ labelLines })).toThrow();
  });
});

describe('display.shadowType', () => {
  const manifestWithShadowType = (shadowType: unknown) => ({
    nodeType: 'uipath.test.node',
    version: '1.0.0',
    display: { label: 'Test Node', shadowType },
    tags: [],
    sortOrder: 0,
    handleConfiguration: [],
  });

  it.each(['default', 'dense'])('accepts %s', (shadowType) => {
    expect(() => nodeManifestSchema.parse(manifestWithShadowType(shadowType))).not.toThrow();
    expect(() => displayConfigSchema.parse({ shadowType })).not.toThrow();
  });

  it.each(['none', true])('rejects %s', (shadowType) => {
    expect(() => nodeManifestSchema.parse(manifestWithShadowType(shadowType))).toThrow();
    expect(() => displayConfigSchema.parse({ shadowType })).toThrow();
  });
});

describe('display.singleLineSubLabel', () => {
  it('is checked by the manifest and the instance schemas', () => {
    const manifest = {
      nodeType: 'uipath.test.node',
      version: '1.0.0',
      display: { label: 'Test Node', singleLineSubLabel: 'true' },
      tags: [],
      sortOrder: 0,
      handleConfiguration: [],
    };
    expect(() => nodeManifestSchema.parse(manifest)).toThrow();
    expect(() => displayConfigSchema.parse({ singleLineSubLabel: 'true' })).toThrow();
  });
});
