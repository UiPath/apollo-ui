/**
 * Shared fixtures for BaseNode performance tests and benchmarks.
 *
 * Builds a realistic 500-node scenario: a registered manifest with left/right
 * handles, per-node instance data, and the real provider stack (registry, mode,
 * override config). xyflow hooks are NOT mocked here — each test/bench file
 * declares its own module mocks (vi.mock is per-file); these fixtures only
 * provide data builders and the provider wrapper.
 */
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { NodeRegistryProvider } from '../../core';
import type { NodeManifest } from '../../schema/node-definition';
import { BaseCanvasModeProvider } from '../BaseCanvas/BaseCanvasModeProvider';
import { BaseNode } from './BaseNode';
import type { BaseNodeData } from './BaseNode.types';
import {
  type BaseNodeOverrideConfig,
  BaseNodeOverrideConfigProvider,
} from './BaseNodeConfigContext';

export const PERF_NODE_TYPE = 'perf.task';

/** Default node count for scale scenarios: the canvas must support 500 nodes easily. */
export const PERF_NODE_COUNT = 500;

/** computedHeight for this manifest: 1 handle per side → floor 64 < default 96. */
export const PERF_NODE_HEIGHT = 96;

export const PERF_MANIFEST: NodeManifest = {
  nodeType: PERF_NODE_TYPE,
  version: '1.0.0',
  tags: [],
  sortOrder: 0,
  display: { label: 'Task', shape: 'square' },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'in', type: 'target', handleType: 'input' }],
    },
    {
      position: 'right',
      handles: [{ id: 'out', type: 'source', handleType: 'output', showButton: true }],
    },
  ],
} as NodeManifest;

const MANIFEST_BUNDLE = { nodes: [PERF_MANIFEST], categories: [] };

// Suppress the toolbar: the default design-mode toolbar would pull in xyflow's
// NodeToolbar (needs a real store). Toolbar resolution cost is still covered by
// unit benches; here we isolate the node body render path.
const OVERRIDES: BaseNodeOverrideConfig = { toolbarConfig: null };

export type PerfNodeProps = NodeProps<Node<BaseNodeData>>;

export const makeNodeProps = (
  i: number,
  overrides: Partial<PerfNodeProps> = {}
): PerfNodeProps => ({
  id: `node-${i}`,
  type: PERF_NODE_TYPE,
  data: { nodeType: PERF_NODE_TYPE, display: { label: `Node ${i}` } } as BaseNodeData,
  selected: false,
  dragging: false,
  draggable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: (i % 25) * 160,
  positionAbsoluteY: Math.floor(i / 25) * 160,
  selectable: true,
  deletable: true,
  ...overrides,
});

export const makeNodes = (count: number): PerfNodeProps[] =>
  Array.from({ length: count }, (_, i) => makeNodeProps(i));

/**
 * Renders the given nodes under the real provider stack.
 * Pass `overrides` to exercise other config paths (e.g. `{}` to let the
 * manifest-default toolbar resolve); it must be reference-stable across
 * rerenders, exactly like production provider values.
 */
export const NodeGrid = ({
  nodes,
  overrides = OVERRIDES,
}: {
  nodes: PerfNodeProps[];
  overrides?: BaseNodeOverrideConfig;
}) => (
  <NodeRegistryProvider manifest={MANIFEST_BUNDLE}>
    <BaseCanvasModeProvider mode="design">
      <BaseNodeOverrideConfigProvider value={overrides}>
        {nodes.map((p) => (
          <BaseNode key={p.id} {...p} />
        ))}
      </BaseNodeOverrideConfigProvider>
    </BaseCanvasModeProvider>
  </NodeRegistryProvider>
);
