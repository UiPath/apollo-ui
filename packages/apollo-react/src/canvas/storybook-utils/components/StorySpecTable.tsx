import type { ReactNode } from 'react';

/**
 * How a cell renders:
 * - `strong` for the row's subject
 * - `code` for a literal a consumer types
 * - `code-muted` for a supporting identifier
 * - `text` for prose
 */
export type StorySpecCellVariant = 'strong' | 'code' | 'code-muted' | 'text';

export interface StorySpecColumn<Row> {
  /** Field on the row this column reads. */
  key: keyof Row & string;
  header: ReactNode;
  variant?: StorySpecCellVariant;
}

export interface StorySpecTableProps<Row> {
  columns: readonly StorySpecColumn<Row>[];
  rows: readonly Row[];
  /** Defaults to the first column's value, which is unique in a spec table. */
  getRowKey?: (row: Row, index: number) => string;
}

/**
 * The reference table that closes an anatomy section: one row per variant, one
 * column per thing a consumer needs to know about it.
 */
export function StorySpecTable<Row>({ columns, rows, getRowKey }: StorySpecTableProps<Row>) {
  const firstKey = columns[0]?.key;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-2.5 text-left font-medium text-muted-foreground"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey?.(row, index) ?? (firstKey ? String(row[firstKey]) : index)}
              className="border-b border-border last:border-b-0"
            >
              {columns.map((column) => (
                <td key={column.key} className={cellClass(column.variant)}>
                  {renderCell(row[column.key] as ReactNode, column.variant)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClass(variant: StorySpecCellVariant = 'text'): string {
  if (variant === 'strong') return 'px-4 py-3 font-medium text-foreground';
  return 'px-4 py-3 text-muted-foreground';
}

function renderCell(value: ReactNode, variant: StorySpecCellVariant = 'text'): ReactNode {
  if (variant === 'code') return <code className="text-xs text-primary">{value}</code>;
  if (variant === 'code-muted')
    return <code className="text-xs text-muted-foreground">{value}</code>;
  return value;
}
