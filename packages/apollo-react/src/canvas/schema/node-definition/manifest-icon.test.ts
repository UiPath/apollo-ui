import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from './category-manifest';
import { nodeManifestSchema } from './node-manifest';

// `display.icon` (and `category.icon`) are optional so callers fed by sources
// that occasionally omit an icon (e.g. typecache packages without
// `svgIconUrl`) can leave the field unset rather than emit `''`. The canvas
// ListView falls back to an initials badge derived from the name in that case.
describe('manifest schemas — optional icon', () => {
  const baseNodeManifest = {
    nodeType: 'uipath.test.node',
    version: '1.0.0',
    display: { label: 'Test Node' },
    tags: [],
    sortOrder: 0,
    handleConfiguration: [],
  };

  const baseCategoryManifest = {
    id: 'test-category',
    name: 'Test Category',
    sortOrder: 0,
    tags: [],
  };

  it('parses a node manifest without display.icon', () => {
    expect(() => nodeManifestSchema.parse(baseNodeManifest)).not.toThrow();
  });

  it('parses a node manifest with a non-empty display.icon', () => {
    expect(() =>
      nodeManifestSchema.parse({ ...baseNodeManifest, display: { label: 'Test Node', icon: 'star' } })
    ).not.toThrow();
  });

  it('rejects a node manifest with an empty display.icon string', () => {
    // Empty strings should not be serialized — callers must omit the field.
    expect(() =>
      nodeManifestSchema.parse({ ...baseNodeManifest, display: { label: 'Test Node', icon: '' } })
    ).toThrow();
  });

  it('parses a category manifest without icon', () => {
    expect(() => categoryManifestSchema.parse(baseCategoryManifest)).not.toThrow();
  });

  it('parses a category manifest with a non-empty icon', () => {
    expect(() => categoryManifestSchema.parse({ ...baseCategoryManifest, icon: 'unplug' })).not.toThrow();
  });

  it('rejects a category manifest with an empty icon string', () => {
    expect(() => categoryManifestSchema.parse({ ...baseCategoryManifest, icon: '' })).toThrow();
  });
});
