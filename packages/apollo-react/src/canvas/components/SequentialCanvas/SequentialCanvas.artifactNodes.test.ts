import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { NodeTypeRegistry } from '../../core/NodeTypeRegistry';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { isArtifactOnlyManifest } from '../../utils/container';
import { analyzeSequentialCompatibility } from '../../utils/sequential/compatibility';
import {
  AGENT_RESOURCES_NODE_IDS as IDS,
  makeAgentWithResourcesFixture,
} from '../../utils/sequential/fixtures';
import { collectStepAttachments } from './SequentialCanvas';

const registry = new NodeTypeRegistry();
registry.registerManifest(defaultWorkflowManifest.nodes, defaultWorkflowManifest.categories);

const RESOURCE_IDS = [IDS.tool, IDS.context, IDS.memory];

/** Mirrors the canvas's registry-driven predicates without mounting it. */
function predicates(nodes: Node[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const resolveHandleType = (
    nodeId: string,
    handleId: string | null | undefined,
    type: 'source' | 'target'
  ) => {
    const nodeType = byId.get(nodeId)?.type;
    const manifest = nodeType ? registry.getManifest(nodeType) : undefined;
    return manifest?.handleConfiguration
      .flatMap((group) => group.handles)
      .find((handle) => handle.id === handleId && handle.type === type)?.handleType;
  };
  const isSequenceEdge = (edge: Edge) =>
    resolveHandleType(edge.source, edge.sourceHandle, 'source') !== 'artifact' &&
    resolveHandleType(edge.target, edge.targetHandle, 'target') !== 'artifact';
  const isSequenceNode = (node: Node) =>
    node.type !== 'stickyNote' &&
    !isArtifactOnlyManifest(node.type ? registry.getManifest(node.type) : undefined);
  const describeResource = (node: Node) => {
    const manifest = node.type ? registry.getManifest(node.type) : undefined;
    const label = (node.data as { display?: { label?: string } }).display?.label ?? '';
    return { label, iconKey: manifest?.display.icon };
  };
  return { isSequenceEdge, isSequenceNode, describeResource };
}

describe('isArtifactOnlyManifest', () => {
  it('is true for resource manifests whose handles are all artifact handles', () => {
    for (const type of [
      'uipath.agent.resource.tool',
      'uipath.agent.resource.context',
      'uipath.agent.resource.memory',
      'uipath.agent.resource.escalation',
    ]) {
      expect(isArtifactOnlyManifest(registry.getManifest(type))).toBe(true);
    }
  });

  it('is false for a step with artifact handles beside its flow handles, and for unknown or handle-less manifests', () => {
    expect(isArtifactOnlyManifest(registry.getManifest('uipath.agent'))).toBe(false);
    expect(isArtifactOnlyManifest(registry.getManifest('uipath.http-request'))).toBe(false);
    expect(isArtifactOnlyManifest(undefined)).toBe(false);
    expect(
      isArtifactOnlyManifest({
        ...registry.getManifest('uipath.http-request')!,
        handleConfiguration: [],
      })
    ).toBe(false);
  });
});

describe('collectStepAttachments', () => {
  it('groups each resource under the step it is wired to, keyed by the artifact handle', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const map = collectStepAttachments(nodes, edges, predicates(nodes)).byStepId;

    expect([...map.keys()]).toEqual([IDS.agent]);
    expect(map.get(IDS.agent)).toEqual([
      expect.objectContaining({ id: IDS.tool, label: 'Search tool', handleId: 'tools' }),
      expect.objectContaining({ id: IDS.context, label: 'Knowledge base', handleId: 'context' }),
      expect.objectContaining({ id: IDS.memory, label: 'Session memory', handleId: 'memory' }),
    ]);
  });

  it('reuses a step list from the previous result when nothing about it changed', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const first = collectStepAttachments(nodes, edges, predicates(nodes));
    const second = collectStepAttachments([...nodes], [...edges], predicates(nodes), first);
    expect(second.byStepId.get(IDS.agent)).toBe(first.byStepId.get(IDS.agent));

    const relabelled = nodes.map((node) =>
      node.id === IDS.tool ? { ...node, data: { display: { label: 'Renamed' } } } : node
    );
    const third = collectStepAttachments(relabelled, edges, predicates(relabelled), second);
    expect(third.byStepId.get(IDS.agent)).not.toBe(second.byStepId.get(IDS.agent));
    expect(third.byStepId.get(IDS.agent)?.[0]?.label).toBe('Renamed');
  });

  it('returns the previous result by identity when every step list is unchanged', () => {
    // The context value holding this result must not churn on a data-only edit elsewhere.
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const first = collectStepAttachments(nodes, edges, predicates(nodes));
    const renamedStep = nodes.map((node) =>
      node.id === IDS.after ? { ...node, data: { display: { label: 'Renamed step' } } } : node
    );
    const second = collectStepAttachments(renamedStep, [...edges], predicates(renamedStep), first);
    expect(second).toBe(first);

    const relabelled = nodes.map((node) =>
      node.id === IDS.tool ? { ...node, data: { display: { label: 'Renamed' } } } : node
    );
    const third = collectStepAttachments(relabelled, edges, predicates(relabelled), second);
    expect(third).not.toBe(second);
  });

  it('ignores artifact edges whose endpoints are both steps or both resources', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const p = predicates(nodes);
    const { byStepId } = collectStepAttachments(nodes, edges, {
      ...p,
      // Every node is a step: no endpoint qualifies as the resource.
      isSequenceNode: () => true,
    });
    expect(byStepId.size).toBe(0);
  });
});

describe('agent with resources compatibility', () => {
  it('is exact and editable, with the resources and their edges preserved rather than projected', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const { isSequenceEdge, isSequenceNode } = predicates(nodes);
    const report = analyzeSequentialCompatibility(nodes, edges, { isSequenceEdge, isSequenceNode });

    expect(report.level).toBe('exact');
    expect(report.editable).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.projectedNodeIds).toEqual([IDS.agent, IDS.after]);
    expect(report.preservedOnlyNodeIds).toEqual([...RESOURCE_IDS].sort());
    expect(report.preservedOnlyEdgeIds).toEqual(
      expect.arrayContaining(['e-agent-tool', 'e-agent-context', 'e-agent-memory'])
    );
    expect(report.preservedOnlyEdgeIds).not.toContain('e-agent-after');
  });

  it('reports the resources as orphans when a host predicate projects them as steps', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const { isSequenceEdge } = predicates(nodes);
    const report = analyzeSequentialCompatibility(nodes, edges, {
      isSequenceEdge,
      isSequenceNode: () => true,
    });

    const orphan = report.issues.find((issue) => issue.code === 'orphan');
    expect(orphan?.nodeIds?.sort()).toEqual([...RESOURCE_IDS].sort());
  });
});
