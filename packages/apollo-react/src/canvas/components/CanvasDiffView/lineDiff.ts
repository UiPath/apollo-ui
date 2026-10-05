/** One line of a diff: in both texts, only in `before`, or only in `after`. */
export interface LineDiffOp {
  type: 'equal' | 'removed' | 'added';
  text: string;
}

/** Beyond this many added + removed lines, `diffLines` gives up instead of blocking. */
export const MAX_EDIT_DISTANCE = 2000;

const equal = (text: string): LineDiffOp => ({ type: 'equal', text });

/**
 * Myers line diff, in O((N + M) * D) time for D changed lines. Returns the ops in order, or
 * `undefined` when more than `maxEditDistance` lines changed.
 */
export function diffLines(
  before: string[],
  after: string[],
  maxEditDistance = MAX_EDIT_DISTANCE
): LineDiffOp[] | undefined {
  // Trim the common prefix and suffix so typical small edits search only the changed middle.
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start++;
  }
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--;
    afterEnd--;
  }

  const middle = shortestEdit(
    before.slice(start, beforeEnd),
    after.slice(start, afterEnd),
    maxEditDistance
  );
  if (!middle) {
    return undefined;
  }
  return [...before.slice(0, start).map(equal), ...middle, ...before.slice(beforeEnd).map(equal)];
}

/**
 * Walks the edit graph one edit at a time. `x` indexes `a`, `y` indexes `b`, and diagonal
 * `k = x - y`. After `d` edits, `furthest[k]` is the largest `x` reachable on diagonal `k`.
 */
function shortestEdit(a: string[], b: string[], maxEdits: number): LineDiffOp[] | undefined {
  const limit = Math.min(a.length + b.length, maxEdits);
  // Shift k by `offset` so k - 1 and k + 1 stay in bounds for every k in [-limit, limit].
  const offset = limit + 1;
  const furthest = new Int32Array(2 * limit + 3);
  const at = (k: number) => furthest[offset + k] ?? 0;
  // trace[d] is `furthest` for k in [-d, d] before edit d, so the path can be walked back.
  const trace: Int32Array[] = [];

  for (let d = 0; d <= limit; d++) {
    trace.push(furthest.slice(offset - d, offset + d + 1));
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
      // Down is an added line (from diagonal k + 1); right is a removed line (from k - 1).
      let x = down ? at(k + 1) : at(k - 1) + 1;
      let y = x - k;
      while (x < a.length && y < b.length && a[x] === b[y]) {
        x++;
        y++;
      }
      furthest[offset + k] = x;
      if (x >= a.length && y >= b.length) {
        return backtrack(a, b, trace);
      }
    }
  }
  return undefined;
}

/** Rebuilds the ops by walking the recorded trace from the end back to the start. */
function backtrack(a: string[], b: string[], trace: Int32Array[]): LineDiffOp[] {
  const ops: LineDiffOp[] = [];
  let x = a.length;
  let y = b.length;

  for (let d = trace.length - 1; d > 0; d--) {
    const previous = trace[d] as Int32Array;
    const at = (k: number) => previous[k + d] ?? 0;
    const k = x - y;
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
    const previousK = down ? k + 1 : k - 1;
    const previousX = at(previousK);
    const previousY = previousX - previousK;

    while (x > previousX && y > previousY) {
      x--;
      y--;
      ops.push(equal(a[x] ?? ''));
    }
    if (down) {
      ops.push({ type: 'added', text: b[previousY] ?? '' });
    } else {
      ops.push({ type: 'removed', text: a[previousX] ?? '' });
    }
    x = previousX;
    y = previousY;
  }

  while (x > 0 && y > 0) {
    x--;
    y--;
    ops.push(equal(a[x] ?? ''));
  }
  return ops.reverse();
}
