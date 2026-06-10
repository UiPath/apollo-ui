import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from '../../schema/node-definition/category-manifest';
import { nodeManifestSchema } from '../../schema/node-definition/node-manifest';
import {
  caseFlowCategories,
  caseFlowManifest,
  caseManagementStageManifest,
  caseManagementTaskManifest,
  caseManagementTriggerManifest,
} from './case-flow.manifest';

describe('case-flow manifests', () => {
  it.each(caseFlowCategories.map((category) => [category.id, category] as const))(
    'category %s validates against categoryManifestSchema',
    (_id, category) => {
      expect(() => categoryManifestSchema.parse(category)).not.toThrow();
    }
  );

  it.each([
    ['uipath.case.trigger', caseManagementTriggerManifest],
    ['uipath.case.stage', caseManagementStageManifest],
    ['uipath.case.task', caseManagementTaskManifest],
  ] as const)('node manifest %s validates against nodeManifestSchema', (nodeType, manifest) => {
    const parsed = nodeManifestSchema.parse(manifest);
    expect(parsed.nodeType).toBe(nodeType);
  });

  it('registers every node manifest in caseFlowManifest', () => {
    const registered = caseFlowManifest.nodes.map((node) => node.nodeType);
    expect(registered).toEqual(['uipath.case.trigger', 'uipath.case.stage', 'uipath.case.task']);
  });

  it("every node manifest's category is registered", () => {
    const categoryIds = new Set(caseFlowCategories.map((category) => category.id));
    for (const node of caseFlowManifest.nodes) {
      expect(categoryIds.has(node.category ?? '')).toBe(true);
    }
  });

  it('stage handle constraints only reference registered categories', () => {
    const categoryIds = new Set(caseFlowCategories.map((category) => category.id));
    for (const group of caseManagementStageManifest.handleConfiguration) {
      for (const handle of group.handles) {
        const constraintCategories = [
          ...(handle.constraints?.allowedSourceCategories ?? []),
          ...(handle.constraints?.allowedTargetCategories ?? []),
          ...(handle.constraints?.forbiddenTargetCategories ?? []),
          ...(handle.constraints?.forbiddenSourceCategories ?? []),
        ];
        for (const categoryId of constraintCategories) {
          expect(categoryIds.has(categoryId)).toBe(true);
        }
      }
    }
  });

  it('stage exposes the unified handle ids the v25 case schema serializes against', () => {
    const handleIds = caseManagementStageManifest.handleConfiguration.flatMap((group) =>
      group.handles.map((handle) => handle.id)
    );
    expect(handleIds).toEqual(['input', 'next', 'reentry']);
  });

  it('task definition has no handles — instances stay embedded in stage inputs.tasks', () => {
    expect(caseManagementTaskManifest.handleConfiguration).toEqual([]);
  });
});
