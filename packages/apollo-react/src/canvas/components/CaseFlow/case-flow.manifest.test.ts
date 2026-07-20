import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from '../../schema/node-definition/category-manifest';
import { nodeManifestSchema } from '../../schema/node-definition/node-manifest';
import {
  caseEventMarkerManifest,
  caseFlowCategories,
  caseFlowManifest,
  caseStageManifest,
} from './case-flow.manifest';

describe('case-flow manifest', () => {
  it('every category validates against the category manifest schema', () => {
    for (const category of caseFlowCategories) {
      expect(() => categoryManifestSchema.parse(category), category.id).not.toThrow();
    }
  });

  it('every node validates against the node manifest schema', () => {
    for (const node of caseFlowManifest.nodes) {
      expect(() => nodeManifestSchema.parse(node), node.nodeType).not.toThrow();
    }
  });

  it('node types are unique', () => {
    const types = caseFlowManifest.nodes.map((n) => n.nodeType);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every node category exists in the category list', () => {
    const categoryIds = new Set(caseFlowCategories.map((c) => c.id));
    for (const node of caseFlowManifest.nodes) {
      expect(node.category && categoryIds.has(node.category), node.nodeType).toBe(true);
    }
  });

  it('has no dedicated stage-level rule nodes: rules are edges', () => {
    const ruleNodes = caseFlowManifest.nodes.filter((n) =>
      n.nodeType.startsWith('uipath.case.rule.')
    );
    expect(ruleNodes).toHaveLength(0);
  });

  it('event circles may start tasks or feed the stage inner Complete / Exit handles', () => {
    const output = caseEventMarkerManifest.handleConfiguration
      .flatMap((g) => g.handles)
      .find((h) => h.id === 'output');
    expect(output?.constraints?.allowedTargetCategories).toEqual(['case-task', 'case-stage']);

    const innerTargets = caseStageManifest.handleConfiguration
      .filter((g) => g.boundary === 'inner')
      .flatMap((g) => g.handles)
      .filter((h) => h.type === 'target');
    for (const handle of innerTargets) {
      expect(handle.constraints?.allowedSourceCategories, handle.id).toContain('case-condition');
    }
  });

  it('hides the loop Sequential / Parallel mode pill on stages', () => {
    expect(caseStageManifest.display.showModePill).toBe(false);
  });

  it('maps loop semantics onto the stage lifecycle handles', () => {
    const outer = caseStageManifest.handleConfiguration.filter((g) => g.boundary !== 'inner');
    const inner = caseStageManifest.handleConfiguration.filter((g) => g.boundary === 'inner');

    const outerHandles = outer.flatMap((g) => g.handles);
    const innerHandles = inner.flatMap((g) => g.handles);

    expect(outerHandles.map((h) => h.id)).toEqual(['enter', 'complete', 'exit']);
    expect(innerHandles.map((h) => h.id)).toEqual(['onEnter', 'onComplete', 'onExit']);

    // The lifecycle labels live on the INNER handles (loop start / continue / break);
    // the outer boundary stays unlabeled like a regular loop container.
    expect(innerHandles.map((h) => h.label)).toEqual(['Enter', 'Complete', 'Exit']);
    for (const handle of outerHandles) {
      expect(handle.label, handle.id).toBeUndefined();
    }

    // Enter sits on the left inner wall; Complete and Exit share one right inner
    // group so they line up with the outer complete / exit pair (distribution is
    // count-based). All are permanently visible.
    expect(inner.map((g) => g.position)).toEqual(['left', 'right']);
    for (const group of inner) {
      expect(group.alwaysVisible, group.position).toBe(true);
    }

    // Inner handle counts per side mirror the outer ones so positions align:
    // 1 on the left (enter / Enter), 2 on the right (complete+exit / Complete+Exit).
    const outerBySide = new Map(outer.map((g) => [g.position, g.handles.length]));
    const innerBySide = new Map(inner.map((g) => [g.position, g.handles.length]));
    expect(innerBySide.get('left')).toBe(outerBySide.get('left'));
    expect(innerBySide.get('right')).toBe(outerBySide.get('right'));
  });
});
