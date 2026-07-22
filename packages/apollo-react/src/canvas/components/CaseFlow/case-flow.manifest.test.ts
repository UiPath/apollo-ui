import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from '../../schema/node-definition/category-manifest';
import { nodeManifestSchema } from '../../schema/node-definition/node-manifest';
import {
  caseEventMarkerManifest,
  caseFlowCategories,
  caseFlowManifest,
  caseStageManifest,
  caseTaskManifest,
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

  it('has no adhoc marker node: task start rules are marker handles on the task', () => {
    const adhocNodes = caseFlowManifest.nodes.filter(
      (n) => n.nodeType === 'uipath.case.task.adhoc'
    );
    expect(adhocNodes).toHaveLength(0);
  });

  it('tasks carry event / manual start rules as data-driven marker handles', () => {
    const markerGroup = caseTaskManifest.handleConfiguration.find((g) =>
      g.handles.some((h) => h.variant === 'marker')
    );
    expect(markerGroup?.position).toBe('top');
    expect(markerGroup?.alwaysVisible).toBe(true);

    const byId = new Map(markerGroup?.handles.map((h) => [h.id, h]));
    const eventHandle = byId.get('eventTrigger');
    expect(eventHandle?.variant).toBe('marker');
    expect(eventHandle?.icon).toBe('zap');
    expect(eventHandle?.visible).toBe('inputs.eventTrigger');
    expect(eventHandle?.label).toBe('{inputs.triggerLabel}');

    const manualHandle = byId.get('manualTrigger');
    expect(manualHandle?.variant).toBe('marker');
    expect(manualHandle?.icon).toBe('play');
    expect(manualHandle?.visible).toBe('inputs.manualTrigger');
  });

  it('event circles are stage rules only: they feed the inner Complete / Exit handles', () => {
    const output = caseEventMarkerManifest.handleConfiguration
      .flatMap((g) => g.handles)
      .find((h) => h.id === 'output');
    expect(output?.constraints?.allowedTargetCategories).toEqual(['case-stage']);

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

  it('constrains draggable lifecycle pills to their walls', () => {
    const innerHandles = caseStageManifest.handleConfiguration
      .filter((g) => g.boundary === 'inner')
      .flatMap((g) => g.handles);
    const byId = new Map(innerHandles.map((h) => [h.id, h]));

    // Enter is left-wall only; Complete and Exit may roam the right and bottom
    // walls. Each drags its outer counterpart along.
    expect(byId.get('onEnter')?.draggableWalls).toEqual(['left']);
    expect(byId.get('onEnter')?.dragMirrors).toBe('enter');
    expect(byId.get('onComplete')?.draggableWalls).toEqual(['right', 'bottom']);
    expect(byId.get('onComplete')?.dragMirrors).toBe('complete');
    expect(byId.get('onExit')?.draggableWalls).toEqual(['right', 'bottom']);
    expect(byId.get('onExit')?.dragMirrors).toBe('exit');
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

    // Both left groups lay out with 2 slots so enter / Enter sit level with
    // the first slot of the right wall pair (complete / Complete).
    const leftGroups = caseStageManifest.handleConfiguration.filter((g) => g.position === 'left');
    for (const group of leftGroups) {
      expect(group.slotCount, group.boundary ?? 'outer').toBe(2);
    }
  });
});
