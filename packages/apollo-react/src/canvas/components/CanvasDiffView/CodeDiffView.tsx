import { cn } from '@uipath/apollo-wind';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { diffLines } from './lineDiff';

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

/** Pairs line k of each side with no change markers, for diffs too large to compute. */
function unmarkedRows(a: string[], b: string[]): Row[] {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, k) => ({
    left: k < a.length ? { number: k + 1, text: a[k] ?? '' } : undefined,
    right: k < b.length ? { number: k + 1, text: b[k] ?? '' } : undefined,
    changed: false,
  }));
}

/** Side-by-side rows, or `undefined` past the edit cap. Removed and added runs pair up row by row. */
function diffRows(a: string[], b: string[]): Row[] | undefined {
  const ops = diffLines(a, b);
  if (!ops) {
    return undefined;
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

  let beforeNumber = 0;
  let afterNumber = 0;
  for (const op of ops) {
    if (op.type === 'removed') {
      beforeNumber++;
      removed.push({ number: beforeNumber, text: op.text });
    } else if (op.type === 'added') {
      afterNumber++;
      added.push({ number: afterNumber, text: op.text });
    } else {
      flushChanges();
      beforeNumber++;
      afterNumber++;
      rows.push({
        left: { number: beforeNumber, text: op.text },
        right: { number: afterNumber, text: op.text },
        changed: false,
      });
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
  const { rows, tooLarge } = useMemo(() => {
    const a = toLines(before);
    const b = toLines(after);
    const diffed = diffRows(a, b);
    return { rows: diffed ?? unmarkedRows(a, b), tooLarge: !diffed };
  }, [before, after]);
  const removedLabel = _({ id: 'canvas.diff_view.code_line_removed', message: 'Removed' });
  const addedLabel = _({ id: 'canvas.diff_view.code_line_added', message: 'Added' });

  return (
    <div
      className={cn(
        'relative h-full overflow-auto bg-surface font-mono text-xs leading-5',
        className
      )}
    >
      {tooLarge && (
        <output className="block border-b border-border-subtle px-2 py-1 text-foreground-subtle">
          {_({
            id: 'canvas.diff_view.code_too_large',
            message: 'Too many changes to highlight. Showing both versions unmarked.',
          })}
        </output>
      )}
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
