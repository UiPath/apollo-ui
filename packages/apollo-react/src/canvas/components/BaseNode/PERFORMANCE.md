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

## Baseline numbers

Vitest bench, happy-dom, dev container (2026-08). Means, xyflow store hooks
stubbed so numbers isolate our per-node code from xyflow internals.

| Scenario | Mean |
| --- | --- |
| Mount 500 BaseNodes | ~372 ms |
| Mount 1 BaseNode (per-node floor) | ~1.5 ms |
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

## Findings (ranked)

None of these block 500 nodes today; they are the places that will hurt first
at or beyond this scale, with suggested fixes.

### F1. Handles are resolved twice per node (medium, wasted CPU)

`BaseNode` resolves manifest handles (`BaseNode.tsx:189-223`, `resolveHandles`)
and passes the resolved groups to `useButtonHandles`, which calls
`resolveHandles` **again** on the already-resolved configuration
(`ButtonHandle/useButtonHandles.tsx:69`), re-running template replacement
(regex over every handle id/label) and re-allocating every group/handle object.
At 500 nodes with repeat-expanded handles this is the single largest avoidable
cost in the render path (~5ms per full sweep, twice). `useButtonHandles` also
subscribes to node data via `useNodesData` even though `BaseNode` already
receives `data` as a prop, adding a second per-node store subscription.

*Suggestion:* let `useButtonHandles` accept pre-resolved handles (skip
re-resolution when the input is already resolved), or resolve once in
`BaseNode` and share the result.

### F2. Connect-gesture invalidates all nodes AND their toolbar/adornment memos (medium, interaction hiccup)

`useStore(selectIsConnecting)` (`BaseNode.tsx:127`) re-renders every visible
node when a connection drag starts/ends. Showing handles everywhere is
intentional, but `isConnecting` is also folded into `statusContext`
(`BaseNode.tsx:135-155`), whose identity change re-runs `resolveToolbar`
(allocates fresh action objects, closures, and icon React elements per action
per node, `utils/toolbar-resolver.tsx:159-209`) and `resolveAdornments` for all
500 nodes, twice per gesture (start + end).

*Suggestion:* drop `isConnecting` from `statusContext` (neither
`resolveToolbar` nor `resolveAdornments` branches on it today) or split the
memo so toolbar/adornment resolution only depends on the fields it reads.

### F3. Execution/validation status contexts re-render every node per update (medium, debug/run mode)

`useNodeExecutionState` / `useElementValidationStatus`
(`hooks/ExecutionStatusContext.tsx`, `hooks/ValidationStatusContext.tsx`) read
state in an effect keyed on context identity. To publish any node's execution
update, the provider must swap the context value, which re-renders **all** N
nodes (then a second render for nodes whose state actually changed, via
`setState`). During an active run with frequent status updates this is N
renders per tick. It also adds two `useState`+`useEffect` pairs per node.

*Suggestion:* adopt the `ConnectedHandlesStore` pattern (per-node
subscriptions over `useSyncExternalStore`) so a status update renders only the
affected node. The regression test in `ConnectedHandlesContext.perf.test.tsx`
shows the target behavior.

### F4. Mount write burst: one store write + one internals update per node (low, one-time)

On first mount each node writes its computed height (`updateNode`) and calls
`updateNodeInternals` (`BaseNode.tsx:280-285`): 500 store writes + 500
internals recalculations. Each `updateNode` triggers an O(n) nodes-array pass
in the store, so the burst is O(n^2)-ish at mount. It converges (verified: max
one write per node) but is avoidable.

*Suggestion:* seed `height` when nodes are created
(`NodeTypeRegistry.createDefaultData` knows the manifest and could compute it)
so the guard `getNode(id)?.height !== computedHeight` skips the write. The
"seeded nodes perform zero writes" test pins that fast path.

### F5. Stale memo: `toolbarSideHandleAffordances` omits `useSmartHandles` (low, correctness)

`BaseNode.tsx:451-467` reads `useSmartHandles` but only lists
`[toolbarPosition, handleConfigurations]` as deps. Usually masked because
`handleConfigurations` recomputes when `data` changes, but when handle configs
come from the context override (`handleConfigurationsProp`) and
`data.useSmartHandles` flips, the memo serves a stale affordance and the
toolbar offset can be wrong. Add the dep.

### F6. `handleConfigurations` memo depends on the whole `data` object (low)

`BaseNode.tsx:189-223`: any `data` change (e.g. a label rename) produces a new
`handleConfigurations` array identity even when handles are unchanged, which
re-triggers the height effect and `updateNodeInternals` (a DOM re-measure of
the node), plus downstream handle-element memos. Fine for single-node edits;
bulk data updates would measure every touched node.

*Suggestion:* if bulk `updateNodeData` sweeps become a use case, memoize on the
narrow inputs `resolveHandles` actually reads (`data.handleConfigurations`,
`data.inputs`, `data.isCollapsed`) or deep-compare the resolved output before
adopting a new identity.

### F7. Consumer contract: `data` must be reference-stable (informational)

All of the memoization relies on consumers not recreating `node.data` (or
`BaseNodeOverrideConfig` values) on every parent render. A consumer that maps
`nodes` to fresh `data` objects per render silently disables every guard above.
The perf tests document the expected pattern (stable arrays, spread-per-change).

## Regression guards

`BaseNode.perf.test.tsx` (all at N=500, deterministic render counts, no timing):

- mount renders each node body exactly once, no cascades
- height write-back: exactly one `updateNode` per node on mount; zero when
  heights are seeded; zero during drags
- position-only prop sweeps (container drag frames) render zero node bodies
- selecting / hovering / editing data on one node re-renders exactly that node
- `updateNodeInternals` called exactly once per node on mount

`ConnectedHandlesContext.perf.test.tsx` (N=500):

- an added/removed edge notifies only its endpoint nodes
- a rebuilt-but-identical edges array notifies nobody
- snapshot Set identity is stable for untouched nodes

If a change breaks one of these, it will show up as a hard test failure with
the exact invariant named, rather than as a slow canvas in production.
