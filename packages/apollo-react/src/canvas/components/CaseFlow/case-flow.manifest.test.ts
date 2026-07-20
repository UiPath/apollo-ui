import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from '../../schema/node-definition/category-manifest';
import { nodeManifestSchema } from '../../schema/node-definition/node-manifest';
import { caseFlowCategories, caseFlowManifest, caseStageManifest } from './case-flow.manifest';

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

  it('rule circles attach to the stage outer handles from outside', () => {
    const stageOuterHandleIds = new Set(
      caseStageManifest.handleConfiguration
        .filter((group) => group.boundary !== 'inner')
        .flatMap((group) => group.handles.map((h) => h.id))
    );

    const findRule = (suffix: string) => {
      const node = caseFlowManifest.nodes.find((n) => n.nodeType === `uipath.case.rule.${suffix}`);
      expect(node, suffix).toBeTruthy();
      return node!;
    };
    const handleConstraints = (node: (typeof caseFlowManifest.nodes)[number], handleId: string) =>
      node.handleConfiguration.flatMap((g) => g.handles).find((h) => h.id === handleId)
        ?.constraints;

    // Entry rules sit before the stage: output goes into the stage's enter handle.
    const entryTargets = handleConstraints(findRule('entry'), 'output')?.allowedTargets ?? [];
    expect(entryTargets).toEqual([{ nodeType: 'uipath.case.stage', handleId: 'enter' }]);

    // Complete / exit rules sit after the stage: input is fed by the matching outer handle.
    for (const suffix of ['complete', 'exit'] as const) {
      const sources = handleConstraints(findRule(suffix), 'input')?.allowedSources ?? [];
      expect(sources).toEqual([{ nodeType: 'uipath.case.stage', handleId: suffix }]);
      expect(stageOuterHandleIds.has(suffix)).toBe(true);
    }
  });

  it('maps loop semantics onto the stage lifecycle handles', () => {
    const outer = caseStageManifest.handleConfiguration.filter((g) => g.boundary !== 'inner');
    const inner = caseStageManifest.handleConfiguration.filter((g) => g.boundary === 'inner');

    const outerIds = outer.flatMap((g) => g.handles.map((h) => h.id));
    const innerIds = inner.flatMap((g) => g.handles.map((h) => h.id));

    expect(outerIds).toEqual(['enter', 'complete', 'exit']);
    expect(innerIds).toEqual(['onEnter', 'onComplete']);
  });
});
