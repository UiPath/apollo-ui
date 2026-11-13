/**
 * Records Flow Workbench's real ELK tidy-up output for the Tidy up & Alignment
 * demo into recorded-layout.json. Needs a local Flow Workbench checkout (its
 * flow-core/layout module only depends on elkjs); nothing here ships or adds a
 * dependency to Apollo. From the apollo-ui root:
 *
 *   node_modules/.bin/tsx packages/apollo-react/src/canvas/storybook-utils/flow-workbench-layout/record-layout.mts \
 *     <path-to-flow-workbench> \
 *     packages/apollo-react/src/canvas/storybook-utils/flow-workbench-layout/recorded-layout.json
 *
 * Then run `biome format --write` on the JSON. NODES/EDGES below must match the
 * demo story (order matters: ELK uses model order).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [fwRoot, outPath] = process.argv.slice(2);
const layoutDir = `${fwRoot}/packages/flow-core/src/layout`;
const { ElkLayoutEngine } = await import(`${layoutDir}/elk-layout-engine.ts`);
const { DEFAULT_LAYOUT_OPTIONS } = await import(`${layoutDir}/types.ts`);

const SIZE = 96;
type Side = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
type Ports = { id: string; side: Side; index: number; handleType: 'input' | 'output' }[];
const IN_OUT: Ports = [
  { id: 'input', side: 'WEST', index: 0, handleType: 'input' },
  { id: 'output', side: 'EAST', index: 1, handleType: 'output' },
];
const PORTS: Record<string, Ports> = {
  'uipath.manual-trigger': [{ id: 'output', side: 'EAST', index: 0, handleType: 'output' }],
  'uipath.blank-node': IN_OUT,
  'uipath.data.transform': IN_OUT,
  'uipath.control-flow.decision': [
    { id: 'input', side: 'WEST', index: 0, handleType: 'input' },
    { id: 'true', side: 'EAST', index: 1, handleType: 'output' },
    { id: 'false', side: 'EAST', index: 2, handleType: 'output' },
  ],
  'uipath.control-flow.terminate': [{ id: 'input', side: 'WEST', index: 0, handleType: 'input' }],
};

const NODES = [
  ['trigger', 'uipath.manual-trigger'],
  ['fetch', 'uipath.blank-node'],
  ['validate', 'uipath.blank-node'],
  ['decision', 'uipath.control-flow.decision'],
  ['approve', 'uipath.blank-node'],
  ['normalize', 'uipath.data.transform'],
  ['update', 'uipath.blank-node'],
  ['notify', 'uipath.blank-node'],
  ['end', 'uipath.control-flow.terminate'],
] as const;
const EDGES = [
  ['trigger', 'output', 'fetch'],
  ['fetch', 'output', 'validate'],
  ['validate', 'output', 'decision'],
  ['decision', 'true', 'approve'],
  ['decision', 'false', 'normalize'],
  ['approve', 'output', 'update'],
  ['normalize', 'output', 'update'],
  ['update', 'output', 'notify'],
  ['notify', 'output', 'end'],
].map(([source, sourceHandle, target]) => ({
  id: `e-${source}-${target}`,
  source,
  target,
  sourceHandle,
  targetHandle: 'input',
}));

// Proposed strategies, run through the same engine with different settings.
// Vertical flips handles to top (input) and bottom (outputs), as the demo does.
const VERTICAL_SIDE: Record<string, Side> = { WEST: 'NORTH', EAST: 'SOUTH' };
const VERTICAL_PORTS: Record<string, Ports> = Object.fromEntries(
  Object.entries(PORTS).map(([type, ports]) => [
    type,
    ports.map((port) => ({ ...port, side: VERTICAL_SIDE[port.side] ?? port.side })),
  ])
);
const VARIANTS = {
  compact: { options: { nodeSpacing: 48, layerSpacing: 64 }, ports: PORTS },
  vertical: { options: { direction: 'DOWN' }, ports: VERTICAL_PORTS },
};

const engine = new ElkLayoutEngine();
let options = { ...DEFAULT_LAYOUT_OPTIONS };
let portsByType = PORTS;
const resolvePorts = (node: { type?: string }) => portsByType[node.type ?? ''] ?? [];

type Recorded = { p: Record<string, [number, number]>; w: Record<string, [number, number][]> };

async function run(ids: string[]): Promise<Recorded> {
  const idSet = new Set(ids);
  const nodes = NODES.filter(([id]) => idSet.has(id)).map(([id, type]) => ({
    id,
    type,
    position: { x: 0, y: 0 },
    width: SIZE,
    height: SIZE,
  }));
  const edges = EDGES.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  const result = await engine.layout(nodes, edges, options, resolvePorts);
  const p: Recorded['p'] = {};
  for (const n of result.nodes) p[n.id] = [n.position.x, n.position.y];
  const w: Recorded['w'] = {};
  for (const [edgeId, points] of result.edgeWaypoints) w[edgeId] = points.map((pt) => [pt.x, pt.y]);
  return { p, w };
}

const allIds = NODES.map(([id]) => id);
const full = await run(allIds);

// Every selection of 2+ nodes, keyed by node ids in model order joined with ",".
const subsets: Record<string, Recorded> = {};
for (let mask = 1; mask < 1 << allIds.length; mask++) {
  const ids = allIds.filter((_, i) => mask & (1 << i));
  if (ids.length < 2 || ids.length === allIds.length) continue;
  subsets[ids.join(',')] = await run(ids);
}

const variants: Record<string, Recorded> = {};
for (const [name, variant] of Object.entries(VARIANTS)) {
  options = { ...DEFAULT_LAYOUT_OPTIONS, ...variant.options };
  portsByType = variant.ports;
  variants[name] = await run(allIds);
}

const commit = execFileSync('git', ['-C', fwRoot, 'rev-parse', '--short=9', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const date = execFileSync('git', ['-C', fwRoot, 'log', '-1', '--format=%cs'], {
  encoding: 'utf8',
}).trim();
writeFileSync(outPath, JSON.stringify({ source: { commit, date }, full, subsets, variants }));
console.log(`recorded full + ${Object.keys(subsets).length} selections from ${commit} (${date})`);
console.log(JSON.stringify(variants));
