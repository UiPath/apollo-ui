import { cn } from '@uipath/apollo-wind';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

export interface CodeDiffViewProps {
  /** Text before the change, e.g. the serialized workflow. */
  before: string;
  /** Text after the change. */
  after: string;
  className?: string;
}

interface Line {
  number: number;
  text: string;
}

/** One side-by-side row. A changed row may have a line on one side only. */
interface Row {
  left?: Line;
  right?: Line;
  changed: boolean;
}

const toLines = (text: string) => (text === '' ? [] : text.split('\n'));

/** Line diff by longest common subsequence. Removed and added runs pair up row by row. */
function diffRows(before: string, after: string): Row[] {
  const a = toLines(before);
  const b = toLines(after);

  // common[i][j]: length of the longest common subsequence of a[i..] and b[j..].
  const common = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  const lcs = (i: number, j: number) => common[i]?.[j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = common[i] as number[];
      row[j] = a[i] === b[j] ? lcs(i + 1, j + 1) + 1 : Math.max(lcs(i + 1, j), lcs(i, j + 1));
    }
  }

  const rows: Row[] = [];
  let removed: Line[] = [];
  let added: Line[] = [];
  const flushChanges = () => {
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      rows.push({ left: removed[k], right: added[k], changed: true });
    }
    removed = [];
    added = [];
  };

  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flushChanges();
      rows.push({
        left: { number: i + 1, text: a[i] ?? '' },
        right: { number: j + 1, text: b[j] ?? '' },
        changed: false,
      });
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && lcs(i + 1, j) >= lcs(i, j + 1))) {
      removed.push({ number: i + 1, text: a[i] ?? '' });
      i++;
    } else {
      added.push({ number: j + 1, text: b[j] ?? '' });
      j++;
    }
  }
  flushChanges();
  return rows;
}

interface SideProps {
  line?: Line;
  kind: 'removed' | 'added';
  changed: boolean;
  changeLabel: string;
}

function Side({ line, kind, changed, changeLabel }: SideProps) {
  const marked = changed && !!line;
  const tint = marked && (kind === 'removed' ? 'bg-error-background' : 'bg-success-background');
  return (
    <>
      <td
        className={cn(
          'select-none px-2 text-right align-top text-foreground-subtle',
          kind === 'added' && 'border-l border-border-subtle',
          tint
        )}
      >
        {line?.number}
      </td>
      <td className={cn('whitespace-pre-wrap break-all px-2 align-top', tint)}>
        {marked && <span className="sr-only">{changeLabel} </span>}
        {line?.text}
      </td>
    </>
  );
}

/**
 * Side-by-side line diff of two texts, tinted with the canvas diff colors: removed lines on
 * the left, added lines on the right, unchanged lines aligned. Pass it as `CanvasDiffView`'s
 * `codeView`, e.g. with both graphs serialized as JSON.
 */
export function CodeDiffView({ before, after, className }: CodeDiffViewProps) {
  const { _ } = useSafeLingui();
  const rows = useMemo(() => diffRows(before, after), [before, after]);
  const removedLabel = _({ id: 'canvas.diff_view.code_line_removed', message: 'Removed' });
  const addedLabel = _({ id: 'canvas.diff_view.code_line_added', message: 'Added' });

  return (
    <div
      className={cn(
        'relative h-full overflow-auto bg-surface font-mono text-xs leading-5',
        className
      )}
    >
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-12" />
          <col />
        </colgroup>
        <thead className="sr-only">
          <tr>
            <th colSpan={2}>{_({ id: 'canvas.diff_view.before_label', message: 'Before' })}</th>
            <th colSpan={2}>{_({ id: 'canvas.diff_view.after_label', message: 'After' })}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.left?.number ?? '-'}:${row.right?.number ?? '-'}`}>
              <Side
                line={row.left}
                kind="removed"
                changed={row.changed}
                changeLabel={removedLabel}
              />
              <Side line={row.right} kind="added" changed={row.changed} changeLabel={addedLabel} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
