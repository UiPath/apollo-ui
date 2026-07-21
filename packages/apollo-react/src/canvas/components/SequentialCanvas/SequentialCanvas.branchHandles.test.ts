import { describe, expect, it } from 'vitest';
import { resolveBranchHandleIds } from './SequentialCanvas';

/**
 * Unit coverage for `resolveBranchHandleIds`, the helper that decides which ONE
 * of a node's visible non-artifact source handles carries the forward flow (the
 * spine) and which are branch lanes.
 *
 * This is the highest-consequence decision in the projection. Getting it wrong
 * does not produce a cosmetic glitch: a node whose spine is misclassified as a
 * lane has its ENTIRE downstream flow indented underneath itself, and the row it
 * should have continued to never appears on the spine at all.
 *
 * Precedence under test (see the helper's own doc comment):
 *   1. the registry's EXPLICIT default source handle (`isDefaultForType`), but
 *      only when that id is actually one of `candidates`;
 *   2. a well-known `output` / `success` id;
 *   3. the sole candidate, when there is exactly one.
 *
 * `handles(...)` builds the `{ id }[]` shape the helper takes, in manifest order,
 * because manifest order is itself load-bearing (it is the order lanes render in,
 * and it is what the `output` / `success` scan walks).
 */
const handles = (...ids: string[]): { id: string }[] => ids.map((id) => ({ id }));

describe('resolveBranchHandleIds', () => {
  describe('rule 1: an explicit registry default claims the spine', () => {
    it('keeps a spine named `next` on the spine and lanes only the siblings', () => {
      // The regression this rule exists for. Judged by name alone, `next` is not a
      // recognized continuation, so BOTH handles would become lanes and the node's
      // whole forward flow would indent under itself with no spine left.
      expect(resolveBranchHandleIds(handles('next', 'error'), 'next')).toEqual(['error']);
    });

    it.each(['then', 'done', 'out'])('honours a spine named `%s`', (spineId) => {
      expect(resolveBranchHandleIds(handles(spineId, 'error'), spineId)).toEqual(['error']);
    });

    it('outranks a literal `output` when both are present', () => {
      // The registry default is the only AUTHORITATIVE statement a manifest makes
      // about the forward flow, so it must beat the name heuristic rather than the
      // other way round: here `output` is a real handle but `next` is the declared
      // default, so `output` is the lane.
      expect(resolveBranchHandleIds(handles('output', 'next'), 'next')).toEqual(['output']);
    });

    it('preserves manifest order across several lanes', () => {
      expect(resolveBranchHandleIds(handles('try', 'catch', 'finally', 'cleanup'), 'try')).toEqual([
        'catch',
        'finally',
        'cleanup',
      ]);
      // ...and the spine's position in the array does not change the lane order.
      expect(resolveBranchHandleIds(handles('catch', 'finally', 'try', 'cleanup'), 'try')).toEqual([
        'catch',
        'finally',
        'cleanup',
      ]);
    });
  });

  describe('rule 1 guard: a default that is not a candidate is ignored', () => {
    /**
     * This is the important half of the fix. `candidates` has already been filtered
     * to VISIBLE, non-artifact source handles, while the registry default is read
     * straight off the manifest. So the default can legitimately name something
     * that is not in `candidates`: a hidden handle, an artifact handle, or an
     * unexpanded `repeat` template id. Trusting it blindly would set
     * `continuationId` to an id no candidate matches, and then the
     * `filter(id !== continuationId)` at the end would keep EVERY handle as a lane.
     */
    it('falls through to the name heuristic instead of laning every handle', () => {
      expect(resolveBranchHandleIds(handles('output', 'error'), 'artifact-out')).toEqual(['error']);
    });

    it('still resolves the sole candidate as the spine', () => {
      // Rule 3 is the last line of defence for the one-handle case: without it a
      // bogus default would indent a plain linear node's entire continuation.
      expect(resolveBranchHandleIds(handles('next'), 'hidden-handle')).toEqual([]);
    });

    it('treats an unmatched default exactly like no default at all', () => {
      expect(resolveBranchHandleIds(handles('output', 'error'), 'not-a-candidate')).toEqual(
        resolveBranchHandleIds(handles('output', 'error'), undefined)
      );
    });
  });

  describe('rule 2: the `output` / `success` name heuristic', () => {
    it('claims the spine for a manifest that flags no default', () => {
      expect(resolveBranchHandleIds(handles('output', 'error'), undefined)).toEqual(['error']);
      expect(resolveBranchHandleIds(handles('success', 'error'), undefined)).toEqual(['error']);
    });

    it('recognizes the well-known id wherever it sits in manifest order', () => {
      expect(resolveBranchHandleIds(handles('error', 'output'), undefined)).toEqual(['error']);
      expect(resolveBranchHandleIds(handles('true', 'false', 'success'), undefined)).toEqual([
        'true',
        'false',
      ]);
    });

    /**
     * ACTUAL BEHAVIOR, asserted rather than asserted-as-desired. The heuristic is a
     * single positional scan (`find(id === 'output' || id === 'success')`), so when
     * a manifest declares BOTH ids the one appearing FIRST wins and the other
     * becomes a lane. There is no canonical preference between them.
     *
     * Harmless in practice: `output` and `success` are synonyms for the same
     * concept, so either choice yields a sensible spine, and no manifest in this
     * repo declares both. But the outcome does depend on manifest ordering, so it
     * is pinned here rather than left to be discovered by a reordered manifest.
     * See this suite's reported findings.
     */
    it('is order-sensitive when a manifest declares BOTH `output` and `success`', () => {
      expect(resolveBranchHandleIds(handles('output', 'success'), undefined)).toEqual(['success']);
      expect(resolveBranchHandleIds(handles('success', 'output'), undefined)).toEqual(['output']);
    });
  });

  describe('rule 3 / no signal at all', () => {
    it('returns no lanes for a single candidate', () => {
      expect(resolveBranchHandleIds(handles('output'), undefined)).toEqual([]);
      // Rule 3 does not care what the handle is called.
      expect(resolveBranchHandleIds(handles('whatever'), undefined)).toEqual([]);
    });

    it('returns no lanes for no candidates', () => {
      expect(resolveBranchHandleIds(handles(), undefined)).toEqual([]);
      expect(resolveBranchHandleIds(handles(), 'output')).toEqual([]);
    });

    /**
     * ACCEPTED RESIDUAL LIMITATION, documented deliberately. With two or more
     * handles, an unrecognized spine name, and no registry default, there is no
     * signal at all for which handle is the continuation, so BOTH become lanes and
     * the node gets no spine. This is strictly better than guessing (rule 1's doc
     * explains why the positional `getDefaultHandle` fallback is refused: it would
     * promote "True" to the spine on every Decision node), and the fix for a real
     * manifest in this shape is to flag `isDefaultForType`, not to widen the name
     * list here.
     */
    it('lanes every handle when a spine is unnamed and undeclared', () => {
      expect(resolveBranchHandleIds(handles('next', 'error'), undefined)).toEqual([
        'next',
        'error',
      ]);
    });

    it('correctly lanes both branches of a Decision, which HAS no spine', () => {
      // The same "no signal" outcome, but here it is the RIGHT answer rather than a
      // limitation: an If genuinely has no continuation output, which is why the
      // absence of `isDefaultForType` must never be read as "this handle is a
      // branch" in the opposite direction either.
      expect(resolveBranchHandleIds(handles('true', 'false'), undefined)).toEqual([
        'true',
        'false',
      ]);
      expect(resolveBranchHandleIds(handles('case1', 'case2', 'case3'), undefined)).toEqual([
        'case1',
        'case2',
        'case3',
      ]);
    });
  });

  it('never returns the continuation, and never drops or reorders a lane', () => {
    // Invariant sweep over every precedence path: the result is always the input
    // minus at most one id, with relative order intact. Guards against a future
    // refactor that sorts, dedupes, or returns the spine by accident.
    const cases: Array<[string[], string | undefined]> = [
      [['output', 'error'], undefined],
      [['next', 'error'], 'next'],
      [['output', 'true', 'false'], 'output'],
      [['a', 'b', 'c'], 'missing'],
      [['only'], undefined],
      [[], 'output'],
    ];
    for (const [ids, defaultId] of cases) {
      const lanes = resolveBranchHandleIds(handles(...ids), defaultId);
      expect(lanes.length).toBeGreaterThanOrEqual(Math.max(0, ids.length - 1));
      expect(lanes.length).toBeLessThanOrEqual(ids.length);
      // A subsequence of the input, so order is preserved and nothing is invented.
      expect(ids.filter((id) => lanes.includes(id))).toEqual(lanes);
    }
  });
});
