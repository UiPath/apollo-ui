# BaseNode Performance Audit

Audit of `BaseNode` and its render path at 500-node scale, with benchmarks and
render-count regression tests to prevent regressions.

- **Verdict: 500 nodes is comfortably supported today.** Mounting 500 BaseNodes
  costs ~370ms of component code (one-time, in a headless DOM; real browsers are
  faster), and steady-state interactions are O(1) in canvas size: a position
  sweep across all 500 nodes costs ~2.7ms, selecting or hovering a node
  re-renders exactly one node body.
- The invariants that make this true are now pinned by deterministic tests
  (`BaseNode.perf.test.tsx`, `ConnectedHandlesContext.perf.test.tsx`) and
  tracked by benchmarks (`BaseNode.bench.tsx`, `utils/canvas-scale.bench.ts`).

## How to run

```bash
# Regression guards (run in CI as part of the normal test task)
pnpm --filter @uipath/apollo-react test -- BaseNode.perf
pnpm --filter @uipath/apollo-react test -- ConnectedHandlesContext.perf

# Benchmarks (timing, not CI-gating)
pnpm --filter @uipath/apollo-react bench
```

## Current numbers (post-fix)

Vitest bench, happy-dom, dev container (2026-08). Means, xyflow store hooks
stubbed so numbers isolate our per-node code from xyflow internals.

| Scenario | Mean |
| --- | --- |
| Mount 500 BaseNodes | ~412 ms |
| Mount 1 BaseNode (per-node floor) | ~1.7 ms |
| Position-only re-render sweep across 500 nodes (memo fast path) | ~2.7 ms |
| Toggle selection of 1 node among 500 | ~3.9 ms |
| `resolveHandles` static manifest x 500 | ~0.49 ms |
| `resolveHandles` repeat expansion (5 items) x 500 | ~4.8 ms |
| `resolveDisplay` x 500 | ~0.02 ms |
| `areNodePropsEqualIgnoringPosition` sweep x 500 | ~0.17 ms |
| `resolveCollisions` 500 overlapping nodes | ~10.7 ms |

## What already scales well

These are the load-bearing design decisions; the new tests exist to keep them.

1. **Memoized node body with position-ignoring comparator**
   (`BaseNode.tsx:740`, `utils/nodePropsEqual.ts`). XYFlow passes
   `positionAbsoluteX/Y` to every node on every render; during a container drag
   every descendant gets new values at 60fps. The comparator swallows these, so
   drags re-render only the transform (applied by XYFlow's NodeWrapper), not
   500 node bodies.
2. **Granular connected-handles store** (`BaseCanvas/ConnectedHandlesContext.tsx`).
   O(1) per-node lookup via `useSyncExternalStore` with per-node listeners and
   Set-identity reuse. An edge edit notifies only the touched nodes, not all 500.
3. **Selection state computed once** (`BaseCanvas/SelectionStateContext.tsx`).
   `multipleNodesSelected` is O(n) once per nodes-array change with an
   early-exit, and the context value only changes identity when the boolean
   flips, so it does not fan out re-renders.
4. **CSS-variable geometry** (`BaseNode.tsx:323`, `nodeVars`). All geometry is
   set once as custom properties on the wrapper; children use static Tailwind
   class strings, so React skips their DOM updates entirely.
5. **Pure, convergent height** (`BaseNode.tsx:253-285`). `computedHeight` is a
   pure function of handle count/footer, never the measured height, and the
   write-back is guarded by `getNode(id)?.height !== computedHeight`. No
   measure-write oscillation. Verified at 500 nodes: exactly one write per node
   on first mount, zero when heights are pre-seeded.
6. **O(1) manifest lookup** (`core/NodeTypeRegistry.ts`): all registry queries
   are Map lookups; caches are precomputed at registration.
7. **Viewport virtualization**: `BaseCanvas` defaults
   `onlyRenderVisibleElements` to true, so off-screen nodes are not mounted at
   all. A 500-node graph zoomed to fit is the worst case; panned in close, the
   working set is much smaller.
8. **Memoized leaf components**: `NodeLabel`, `BaseInnerShape`,
   `ExecutionStatusIndicator` are `memo`-wrapped.

## Findings (ranked) and fixes

All code findings from the audit are FIXED (2026-08); each fix is pinned by a
regression test. F7 remains a consumer contract to be aware of.

### F1. Handles were resolved twice per node — FIXED

`BaseNode` resolved manifest handles and passed the output to
`useButtonHandles`, which called `resolveHandles` **again** on the
already-resolved configuration, re-running template replacement (regex over
every handle id/label) and re-allocating every group/handle object per node
per invalidation.

*Fix:* `BaseNode` now resolves ONCE for every handle source (context override,
data override, manifest default) and passes `preResolved` to
`useButtonHandles`, which skips its internal resolution and its node-data memo
dependency on that path. Other callers (TriggerNode, StageNodeHandles) keep the
old behavior by default. Side benefit: override configs with `repeat`/template
handles are now resolved before height computation, so dynamic handles from
overrides count correctly toward the handle floor.
*Guard:* "resolves handle configurations exactly once per node on mount".

### F2. Connect gestures re-resolved toolbars/adornments on all nodes — FIXED

`isConnecting`, `isSelected`, and `isDragging` were folded into
`statusContext`, whose identity change re-ran `resolveToolbar` (fresh action
objects, closures, and icon React elements per action per node) and
`resolveAdornments` for all 500 nodes, twice per connect gesture. Neither
resolver reads interaction state.

*Fix:* `statusContext` now carries only identity + status + mode
(`BaseNode.tsx`, and the same pattern in `LoopNode.tsx`).
Interaction-dependent toolbar behavior (offsets, visibility) already lived in
`offsetToolbar` and the NodeToolbar props, which remain fully reactive.
*Guard:* "starting a connect gesture does not re-resolve the toolbar config".

### F3. Execution/validation hooks double-rendered per update — FIXED

`useNodeExecutionState` / `useElementValidationStatus` read state via
setState-in-effect: every published update cost a context render plus a second
setState render, and the state was unavailable on the first render. Two
`useState`+`useEffect` pairs per node besides.

*Fix:* the hooks now read the getter during render, memoized on context
identity. Same provider contract (publish by swapping the context value), half
the renders per update, state available on first render, no per-node effects.
*Guard:* `hooks/ExecutionStatusContext.test.tsx`.
*Still recommended (API change, not done):* a store+selector
(`ConnectedHandlesStore` pattern) so an update renders only the affected node
instead of all N; requires changing the provider contract consumers inject.

### F4. Mount write burst — MITIGATED (seeding API added)

Each node writes its computed height (`updateNode`) + `updateNodeInternals`
on first mount: 500 store writes for a fresh 500-node graph. The write-back is
guarded, so a node whose `height` is already correct writes nothing.

*Fix:* the height rule is extracted to `computeBaseNodeHeight`
(`utils/node-height.ts`, exported from canvas utils). Consumers can seed
`node.height` at creation and skip the mount write entirely; BaseNode uses the
same function, so the two can never drift.
*Guard:* "performs zero height writes when node.height is already correct".

### F5. Stale memo: `toolbarSideHandleAffordances` omitted `useSmartHandles` — FIXED

The memo read `useSmartHandles` without listing it, serving a stale toolbar
offset when handle configs came from the context override and
`data.useSmartHandles` flipped. The dependency is now listed.

### F6. Any `data` change invalidated handle configs — FIXED

A label rename produced a new `handleConfigurations` identity even when no
handle changed, re-triggering `updateNodeInternals` (a DOM re-measure) and
handle-element rebuilds.

*Fix:* resolution output is value-compared (`areResolvedHandleGroupsEqual`,
shallow per group/handle, functions and nested objects by reference) and the
previous identity is kept when nothing resolved differently. Conservative by
construction: a false negative costs one old-style re-render, never staleness.
*Guard:* "a label-only data edit keeps handle config identity".

### F7. Consumer contract: `data` must be reference-stable (informational)

All of the memoization relies on consumers not recreating `node.data` (or
`BaseNodeOverrideConfig` values) on every parent render. A consumer that maps
`nodes` to fresh `data` objects per render silently disables every guard above.
The perf tests document the expected pattern (stable arrays, spread-per-change).

## Measured improvements (before → after fixes)

Counted invariants are exact and test-pinned; wall-clock rows are vitest bench
means on an idle dev container (happy-dom), same machine, sequential runs.

| Scenario (500 nodes) | Before | After |
| --- | --- | --- |
| `resolveHandles` passes on mount | 1,000 (2/node) | 500 (1/node) |
| Toolbar + adornment resolver runs per connect gesture (start+end) | 2,000 | 0 |
| Renders per node per execution/validation update | 2 | 1 |
| Execution state available on first render | no (undefined until 2nd) | yes |
| DOM re-measures (`updateNodeInternals`) after a label-only edit | 1 | 0 |
| Height store writes on mount, heights seeded via `computeBaseNodeHeight` | no seeding API | 0 |
| Stale toolbar offset when `useSmartHandles` flips under context override | possible | fixed |
| Mount 500 BaseNodes (bench mean) | ~488 ms | ~412 ms (−15%) |
| Mount 500 BaseNodes (bench min) | ~418 ms | ~365 ms (−13%) |

Steady-state numbers that were already flat stayed flat (position-only sweep
~2.6 ms, single-node selection ~3.4 ms, pure resolvers unchanged).

## Regression guards

`BaseNode.perf.test.tsx` (all at N=500, deterministic render counts, no timing):

- mount renders each node body exactly once, no cascades
- height write-back: exactly one `updateNode` per node on mount; zero when
  heights are seeded; zero during drags
- position-only prop sweeps (container drag frames) render zero node bodies
- selecting / hovering / editing data on one node re-renders exactly that node
- `updateNodeInternals` called exactly once per node on mount
- `resolveHandles` runs exactly once per node on mount (no double resolution)
- a connect gesture never re-resolves toolbar configs (identity-stable)
- a label-only data edit triggers no re-measure and no height write

`hooks/ExecutionStatusContext.test.tsx`:

- execution/validation state is available on the FIRST render
- each published update costs exactly one render per subscriber

`ConnectedHandlesContext.perf.test.tsx` (N=500):

- an added/removed edge notifies only its endpoint nodes
- a rebuilt-but-identical edges array notifies nobody
- snapshot Set identity is stable for untouched nodes

If a change breaks one of these, it will show up as a hard test failure with
the exact invariant named, rather than as a slow canvas in production.
