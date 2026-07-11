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

  it('rule circles target existing inner handles of the stage', () => {
    const stageHandleIds = new Set(
      caseStageManifest.handleConfiguration.flatMap((group) => group.handles.map((h) => h.id))
    );

    const ruleNodes = caseFlowManifest.nodes.filter((n) =>
      n.nodeType.startsWith('uipath.case.rule.')
    );
    expect(ruleNodes).toHaveLength(3);

    for (const node of ruleNodes) {
      const allowedTargets = node.handleConfiguration
        .flatMap((group) => group.handles)
        .flatMap((handle) => handle.constraints?.allowedTargets ?? []);
      expect(allowedTargets.length, node.nodeType).toBeGreaterThan(0);
      for (const target of allowedTargets) {
        expect(target.nodeType).toBe('uipath.case.stage');
        expect(target.handleId && stageHandleIds.has(target.handleId), node.nodeType).toBe(true);
      }
    }
  });

  it('maps loop semantics onto the stage lifecycle handles', () => {
    const outer = caseStageManifest.handleConfiguration.filter((g) => g.boundary !== 'inner');
    const inner = caseStageManifest.handleConfiguration.filter((g) => g.boundary === 'inner');

    const outerIds = outer.flatMap((g) => g.handles.map((h) => h.id));
    const innerIds = inner.flatMap((g) => g.handles.map((h) => h.id));

    expect(outerIds).toEqual(['enter', 'complete', 'exit']);
    expect(innerIds).toEqual(['onEnter', 'entryRules', 'completeRules', 'exitRules']);
  });
});
