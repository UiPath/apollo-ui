import { describe, expect, it } from 'vitest';
import type { NodeManifest } from '../../schema/node-definition';
import { categoryManifestSchema, nodeManifestSchema } from '../../schema/node-definition';
import { validateConnection } from '../../utils/constraint-validator';
import {
  caseFlowCategories,
  caseFlowManifest,
  caseManagementStageManifest,
  caseManagementTriggerManifest,
} from './case-flow.manifest';

const handle = (manifest: NodeManifest, id: string) => {
  const found = manifest.handleConfiguration
    .flatMap((group) => group.handles)
    .find((h) => h.id === id);
  if (!found) throw new Error(`${manifest.nodeType} has no handle ${id}`);
  return found;
};

const node = (manifest: NodeManifest) => ({ type: manifest.nodeType, category: manifest.category });

const connects = (source: NodeManifest, target: NodeManifest) =>
  validateConnection({
    sourceNode: node(source),
    sourceHandle: handle(source, 'output'),
    targetNode: node(target),
    targetHandle: handle(target, 'input'),
  }).valid;

describe('caseFlowManifest', () => {
  it.each(
    caseFlowManifest.nodes.map((manifest) => [manifest.nodeType, manifest])
  )('parses the %s node manifest', (_nodeType, manifest) => {
    expect(() => nodeManifestSchema.parse(manifest)).not.toThrow();
  });

  it.each(
    caseFlowCategories.map((category) => [category.id, category])
  )('parses the %s category manifest', (_id, category) => {
    expect(() => categoryManifestSchema.parse(category)).not.toThrow();
  });

  it('puts every node in a declared category', () => {
    const categoryIds = caseFlowCategories.map((category) => category.id);
    for (const manifest of caseFlowManifest.nodes) {
      expect(categoryIds).toContain(manifest.category);
    }
  });
});

describe('caseManagementStageManifest', () => {
  it('declares the uipath.case.stage node type at 1.0.0', () => {
    expect(caseManagementStageManifest.nodeType).toBe('uipath.case.stage');
    expect(caseManagementStageManifest.version).toBe('1.0.0');
  });

  it('declares stageType as primary or secondary, defaulting to primary', () => {
    expect(caseManagementStageManifest.inputDefinition?.stageType).toEqual({
      type: 'string',
      enum: ['primary', 'secondary'],
      default: 'primary',
    });
  });

  it('accepts a connection from a trigger', () => {
    expect(connects(caseManagementTriggerManifest, caseManagementStageManifest)).toBe(true);
  });

  it('accepts a connection from another stage', () => {
    expect(connects(caseManagementStageManifest, caseManagementStageManifest)).toBe(true);
  });

  it('refuses a connection into a trigger', () => {
    expect(
      validateConnection({
        sourceNode: node(caseManagementStageManifest),
        sourceHandle: handle(caseManagementStageManifest, 'output'),
        targetNode: node(caseManagementTriggerManifest),
        targetHandle: { id: 'input', handleType: 'input' },
      }).valid
    ).toBe(false);
  });
});
