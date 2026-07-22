import { describe, expect, it } from 'vitest';
import { categoryManifestSchema, nodeManifestSchema } from '../../schema/node-definition';
import {
  caseFlowCategories,
  caseFlowManifest,
  caseManagementStageManifest,
  caseManagementTriggerManifest,
} from './case-flow.manifest';

describe('case-flow manifests', () => {
  it('trigger manifest parses against nodeManifestSchema', () => {
    expect(() => nodeManifestSchema.parse(caseManagementTriggerManifest)).not.toThrow();
  });

  it('stage manifest parses against nodeManifestSchema', () => {
    expect(() => nodeManifestSchema.parse(caseManagementStageManifest)).not.toThrow();
  });

  it('categories parse against categoryManifestSchema', () => {
    for (const category of caseFlowCategories) {
      expect(() => categoryManifestSchema.parse(category)).not.toThrow();
    }
  });

  it('registers both node manifests in the combined manifest', () => {
    const nodeTypes = caseFlowManifest.nodes.map((node) => node.nodeType);
    expect(nodeTypes).toContain('uipath.case.trigger');
    expect(nodeTypes).toContain('uipath.case.stage');
  });

  it('every node manifest category resolves to a declared category', () => {
    const categoryIds = new Set(caseFlowCategories.map((category) => category.id));
    for (const node of caseFlowManifest.nodes) {
      expect(categoryIds.has(node.category)).toBe(true);
    }
  });

  it('trigger output targets the stage category', () => {
    const output = caseManagementTriggerManifest.handleConfiguration?.[0]?.handles[0];
    expect(output?.constraints?.allowedTargetCategories).toContain(
      caseManagementStageManifest.category
    );
  });

  it('stage input accepts the trigger category', () => {
    const left = caseManagementStageManifest.handleConfiguration?.find(
      (group) => group.position === 'left'
    );
    expect(left?.handles[0]?.constraints?.allowedSourceCategories).toContain(
      caseManagementTriggerManifest.category
    );
  });

  it('stage handle ids are unique', () => {
    const ids = (caseManagementStageManifest.handleConfiguration ?? []).flatMap((group) =>
      group.handles.map((handle) => handle.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only the next handle shows the add button', () => {
    const buttonHandles = (caseManagementStageManifest.handleConfiguration ?? [])
      .flatMap((group) => group.handles)
      .filter((handle) => handle.showButton);
    expect(buttonHandles.map((handle) => handle.id)).toEqual(['next']);
  });
});
