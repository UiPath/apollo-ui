import { describe, expect, it, vi } from 'vitest';

// Consumers mock apollo-wind in their own tests, often without the Json tree parts.
// Importing the canvas wrappers must not read those exports until something renders.
vi.mock('@uipath/apollo-wind', async (importOriginal) => {
  const {
    JsonContainerEditor: _JsonContainerEditor,
    JsonLeafValueEditor: _JsonLeafValueEditor,
    JsonMultilineLeafEditor: _JsonMultilineLeafEditor,
    JsonTreeToolbar: _JsonTreeToolbar,
    JsonTreeView: _JsonTreeView,
    JsonTypeBadge: _JsonTypeBadge,
    ...rest
  } = await importOriginal<typeof import('@uipath/apollo-wind')>();
  return rest;
});

describe('JsonTree canvas wrappers', () => {
  it('import without reading the apollo-wind Json tree components', async () => {
    const wrappers = await import('./JsonTree');
    expect(wrappers.JsonTreeView).toBeTypeOf('function');
  });
});
