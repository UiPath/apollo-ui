import { describe, expect, it } from 'vitest';
import { resolveBranchHandleIds } from './SequentialCanvas';

/**
 * `resolveBranchHandleIds` decides which source handle is the spine and which are lanes. A
 * misclassified spine indents the node's entire downstream flow under itself. `handles(...)`
 * preserves manifest order because the `output` / `success` scan walks it.
 */
const handles = (...ids: string[]): { id: string }[] => ids.map((id) => ({ id }));

describe('resolveBranchHandleIds', () => {
  describe('rule 1: an explicit registry default claims the spine', () => {
    it('keeps a spine named `next` on the spine and lanes only the siblings', () => {
      // The regression this rule exists for: by name alone `next` is not a continuation, so
      // both handles would become lanes.
      expect(resolveBranchHandleIds(handles('next', 'error'), 'next')).toEqual(['error']);
    });

    it.each(['then', 'done', 'out'])('honours a spine named `%s`', (spineId) => {
      expect(resolveBranchHandleIds(handles(spineId, 'error'), spineId)).toEqual(['error']);
    });

    it('outranks a literal `output` when both are present', () => {
      // The registry default beats the name heuristic: `output` is real but `next` is declared.
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
     * The registry default can name a hidden, artifact, or unexpanded `repeat` handle that is
     * not in `candidates`; trusting it blindly would keep every handle as a lane.
     */
    it('falls through to the name heuristic instead of laning every handle', () => {
      expect(resolveBranchHandleIds(handles('output', 'error'), 'artifact-out')).toEqual(['error']);
    });

    it('still resolves the sole candidate as the spine', () => {
      // Without the sole-candidate rule a bogus default would indent a linear node's continuation.
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
     * Pins actual behavior: with both `output` and `success` declared, the first in manifest
     * order wins and the other becomes a lane. Harmless (no manifest declares both), but
     * order-dependent.
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
     * Accepted limitation: two or more handles, an unrecognized spine name and no registry
     * default leave no signal, so all become lanes. The fix for a real manifest is to flag
     * `isDefaultForType`, not to widen the name list.
     */
    it('lanes every handle when a spine is unnamed and undeclared', () => {
      expect(resolveBranchHandleIds(handles('next', 'error'), undefined)).toEqual([
        'next',
        'error',
      ]);
    });

    it('correctly lanes both branches of a Decision, which HAS no spine', () => {
      // The same outcome, but correct here: an If genuinely has no continuation output.
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
    // Invariant: the result is always the input minus at most one id, order intact.
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
