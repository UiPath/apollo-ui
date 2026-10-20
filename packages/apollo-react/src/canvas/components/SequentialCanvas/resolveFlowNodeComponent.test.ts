import { describe, expect, it } from 'vitest';
import { allNodeManifests } from '../../storybook-utils/manifests';
import { BaseNode } from '../BaseNode/BaseNode';
import { LoopCanvasNode, resolveContainerPreviewConnectionHandles } from '../LoopNode';
import { resolveFlowNodeComponent } from './resolveFlowNodeComponent';

describe('Flow loop-container experience', () => {
  const manifest = (nodeType: string) =>
    allNodeManifests.find((candidate) => candidate.nodeType === nodeType)!;

  it.each([
    'uipath.control-flow.foreach',
    'uipath.control-flow.while',
  ])('renders %s with LoopCanvasNode', (nodeType) => {
    expect(manifest(nodeType).display.shape).toBe('container');
    expect(resolveFlowNodeComponent(manifest(nodeType))).toBe(LoopCanvasNode);
  });

  it('keeps While body and loop-back handles on the inner container boundary', () => {
    const whileManifest = manifest('uipath.control-flow.while');
    const innerHandles = whileManifest.handleConfiguration
      .filter((group) => group.boundary === 'inner')
      .flatMap((group) => group.handles.map((handle) => handle.id));

    expect(innerHandles).toEqual(['body', 'loopBack']);
  });

  it.each([
    ['uipath.control-flow.foreach', 'start', 'continue'],
    ['uipath.control-flow.while', 'body', 'loopBack'],
  ])('supports first-child preview wiring for %s', (nodeType, sourceHandleId, targetHandleId) => {
    expect(
      resolveContainerPreviewConnectionHandles(manifest(nodeType), { nodeId: 'loop' })
    ).toEqual(expect.objectContaining({ sourceHandleId, targetHandleId }));
  });

  it('continues to render regular workflow steps with BaseNode', () => {
    expect(resolveFlowNodeComponent(manifest('uipath.script'))).toBe(BaseNode);
  });

  it('gives the canonical first-run circle an output anchor for its Flow edge', () => {
    const firstRun = manifest('uipath.first-run');
    const output = firstRun.handleConfiguration
      .flatMap((group) => group.handles)
      .find((handle) => handle.id === 'output');

    expect(firstRun.display.shape).toBe('circle');
    expect(output).toMatchObject({ type: 'source', handleType: 'output' });
  });
});
