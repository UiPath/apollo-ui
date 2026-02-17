import { describe, expect, it, vi } from 'vitest';
import type { HandleGroupManifest } from '../schema/node-definition/handle';
import {
  type ResolutionContext,
  replaceTemplateVars,
  resolveDisplay,
  resolveHandles,
  resolveVisibility,
} from './manifest-resolver';

// ============================================================================
// resolveDisplay
// ============================================================================

describe('resolveDisplay', () => {
  it('returns fallback when no manifest display is provided', () => {
    const result = resolveDisplay(undefined);
    expect(result.icon).toBe('help-circle');
    expect(result.shape).toBe('square');
    expect(result.label).toBe('Unknown Node');
  });

  it('uses context display label when no manifest display', () => {
    const result = resolveDisplay(undefined, {
      display: { label: 'Custom Label' },
    });
    expect(result.label).toBe('Custom Label');
  });

  it('merges context display overrides onto manifest defaults', () => {
    const result = resolveDisplay(
      { label: 'Decision', icon: 'git-branch', shape: 'square' },
      { display: { label: 'Check if admin' } }
    );
    expect(result.label).toBe('Check if admin');
    expect(result.icon).toBe('git-branch');
    expect(result.shape).toBe('square');
  });

  it('collapses rectangle to square when isCollapsed is true', () => {
    const result = resolveDisplay(
      { label: 'Agent', icon: 'bot', shape: 'rectangle' },
      { isCollapsed: true }
    );
    expect(result.shape).toBe('square');
  });

  it('preserves non-rectangle shapes when collapsed', () => {
    const result = resolveDisplay(
      { label: 'Node', icon: 'box', shape: 'circle' },
      { isCollapsed: true }
    );
    expect(result.shape).toBe('circle');
  });
});

// ============================================================================
// resolveVisibility
// ============================================================================

describe('resolveVisibility', () => {
  const context: ResolutionContext = {
    inputs: { hasDefault: true, isEnabled: false, nested: { flag: true } },
  };

  it('defaults to true when undefined', () => {
    expect(resolveVisibility(undefined, context)).toBe(true);
  });

  it('returns boolean literal as-is', () => {
    expect(resolveVisibility(true, context)).toBe(true);
    expect(resolveVisibility(false, context)).toBe(false);
  });

  it('resolves string property path from context', () => {
    expect(resolveVisibility('inputs.hasDefault', context)).toBe(true);
    expect(resolveVisibility('inputs.isEnabled', context)).toBe(false);
  });

  it('resolves nested property path', () => {
    expect(resolveVisibility('inputs.nested.flag', context)).toBe(true);
  });

  it('returns false for non-existent path', () => {
    expect(resolveVisibility('inputs.nonExistent', context)).toBe(false);
  });
});

// ============================================================================
// replaceTemplateVars
// ============================================================================

describe('replaceTemplateVars', () => {
  it('replaces simple variable', () => {
    expect(replaceTemplateVars('case-{index}', { index: 0 })).toBe('case-0');
  });

  it('replaces multiple variables including nested access', () => {
    const result = replaceTemplateVars('Case {index}: {item.label}', {
      index: 1,
      item: { label: 'Success' },
    });
    expect(result).toBe('Case 1: Success');
  });

  it('preserves unresolved template vars', () => {
    expect(replaceTemplateVars('{known}-{unknown}', { known: 'a' })).toBe('a-{unknown}');
  });

  it('returns plain strings unchanged', () => {
    expect(replaceTemplateVars('static-label', {})).toBe('static-label');
  });

  it('converts non-string values to string', () => {
    expect(replaceTemplateVars('{val}', { val: 42 })).toBe('42');
    expect(replaceTemplateVars('{val}', { val: true })).toBe('true');
  });

  it('preserves template when value is null or undefined', () => {
    expect(replaceTemplateVars('{val}', { val: null })).toBe('{val}');
    expect(replaceTemplateVars('{val}', { val: undefined })).toBe('{val}');
  });
});

// ============================================================================
// resolveHandles
// ============================================================================

/** Helper to get first group from result, with assertion */
function firstGroup(groups: HandleGroupManifest[], context: ResolutionContext) {
  const result = resolveHandles(groups, context);
  expect(result.length).toBeGreaterThan(0);
  return result[0]!;
}

describe('resolveHandles', () => {
  describe('static handles', () => {
    it('resolves with default visibility and template replacement', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              { id: 'true', type: 'source', handleType: 'output', label: '{inputs.trueLabel}' },
            ],
          },
        ],
        { inputs: { trueLabel: 'Approved' } }
      );

      expect(group.handles).toHaveLength(1);
      expect(group.handles[0]!.id).toBe('true');
      expect(group.handles[0]!.label).toBe('Approved');
      expect(group.handles[0]!.visible).toBe(true);
    });

    it('preserves unresolved template vars and sets undefined label when absent', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              { id: 'a', type: 'source', handleType: 'output', label: '{inputs.missing}' },
              { id: 'b', type: 'target', handleType: 'input' },
            ],
          },
        ],
        {}
      );

      expect(group.handles).toHaveLength(2);
      expect(group.handles[0]!.label).toBe('{inputs.missing}');
      expect(group.handles[1]!.label).toBeUndefined();
    });
  });

  describe('visibility in handles', () => {
    it('resolves string visibility path from context', () => {
      const groups: HandleGroupManifest[] = [
        {
          position: 'right',
          handles: [
            { id: 'default', type: 'source', handleType: 'output', visible: 'inputs.hasDefault' },
          ],
        },
      ];

      const trueGroup = firstGroup(groups, { inputs: { hasDefault: true } });
      expect(trueGroup.handles[0]!.visible).toBe(true);

      const falseGroup = firstGroup(groups, { inputs: { hasDefault: false } });
      expect(falseGroup.handles[0]!.visible).toBe(false);
    });

    it('hides artifact handles when collapsed, keeps non-artifact visible', () => {
      const result = resolveHandles(
        [
          {
            position: 'bottom',
            handles: [{ id: 'artifact', type: 'source', handleType: 'artifact' }],
          },
          {
            position: 'left',
            handles: [{ id: 'in', type: 'target', handleType: 'input' }],
          },
        ],
        { isCollapsed: true }
      );

      expect(result).toHaveLength(2);
      expect(result[0]!.handles[0]!.visible).toBe(false);
      expect(result[1]!.handles[0]!.visible).toBe(true);
    });
  });

  describe('group visibility when collapsed', () => {
    it('hides group when collapsed and all handles are hidden', () => {
      const group = firstGroup(
        [
          {
            position: 'bottom',
            visible: true,
            handles: [{ id: 'artifact', type: 'source', handleType: 'artifact' }],
          },
        ],
        { isCollapsed: true }
      );
      expect(group.visible).toBe(false);
    });

    it('preserves group visibility when collapsed but has visible handles', () => {
      const group = firstGroup(
        [
          {
            position: 'left',
            visible: true,
            handles: [{ id: 'in', type: 'target', handleType: 'input' }],
          },
        ],
        { isCollapsed: true }
      );
      expect(group.visible).toBe(true);
    });
  });

  describe('repeat handles', () => {
    it('expands repeat expression into multiple handles', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              {
                id: 'case-{index}',
                type: 'source',
                handleType: 'output',
                label: '{item.label}',
                repeat: 'inputs.cases',
              },
            ],
          },
        ],
        { inputs: { cases: [{ label: 'Case A' }, { label: 'Case B' }, { label: 'Case C' }] } }
      );

      expect(group.handles).toHaveLength(3);
      expect(group.handles[0]).toMatchObject({ id: 'case-0', label: 'Case A' });
      expect(group.handles[1]).toMatchObject({ id: 'case-1', label: 'Case B' });
      expect(group.handles[2]).toMatchObject({ id: 'case-2', label: 'Case C' });
    });

    it('uses custom itemVar and indexVar names', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              {
                id: 'out-{idx}',
                type: 'source',
                handleType: 'output',
                label: '{entry.name}',
                repeat: 'inputs.outputs',
                itemVar: 'entry',
                indexVar: 'idx',
              },
            ],
          },
        ],
        { inputs: { outputs: [{ name: 'Success' }, { name: 'Failure' }] } }
      );

      expect(group.handles).toHaveLength(2);
      expect(group.handles[0]).toMatchObject({ id: 'out-0', label: 'Success' });
      expect(group.handles[1]).toMatchObject({ id: 'out-1', label: 'Failure' });
    });

    it('warns and returns empty when repeat does not resolve to array', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              { id: 'h-{index}', type: 'source', handleType: 'output', repeat: 'inputs.missing' },
            ],
          },
        ],
        {}
      );

      expect(group.handles).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('inputs.missing'));

      warnSpy.mockRestore();
    });

    it('returns empty handles for empty array', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              { id: 'h-{index}', type: 'source', handleType: 'output', repeat: 'inputs.cases' },
            ],
          },
        ],
        { inputs: { cases: [] } }
      );

      expect(group.handles).toHaveLength(0);
    });

    it('hides artifact repeat handles when collapsed', () => {
      const group = firstGroup(
        [
          {
            position: 'bottom',
            handles: [
              {
                id: 'artifact-{index}',
                type: 'source',
                handleType: 'artifact',
                repeat: 'inputs.artifacts',
              },
            ],
          },
        ],
        { isCollapsed: true, inputs: { artifacts: [{ type: 'log' }, { type: 'file' }] } }
      );

      expect(group.handles).toHaveLength(2);
      expect(group.handles.every((h) => !h.visible)).toBe(true);
    });
  });

  describe('mixed static and repeat handles', () => {
    it('resolves both and applies visibility independently', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              {
                id: 'case-{index}',
                type: 'source',
                handleType: 'output',
                label: '{item.label}',
                repeat: 'inputs.cases',
              },
              {
                id: 'default',
                type: 'source',
                handleType: 'output',
                label: 'Default',
                visible: 'inputs.hasDefault',
              },
            ],
          },
        ],
        { inputs: { cases: [{ label: 'Case 1' }], hasDefault: false } }
      );

      expect(group.handles).toHaveLength(2);
      expect(group.handles[0]).toMatchObject({ id: 'case-0', visible: true });
      expect(group.handles[1]).toMatchObject({ id: 'default', visible: false });
    });
  });

  describe('deeply nested context paths', () => {
    it('resolves repeat from arbitrary nested paths', () => {
      const group = firstGroup(
        [
          {
            position: 'right',
            handles: [
              { id: 'h-{index}', type: 'source', handleType: 'output', repeat: 'config.outputs' },
            ],
          },
        ],
        { config: { outputs: [{ name: 'A' }] } }
      );

      expect(group.handles).toHaveLength(1);
    });
  });
});
