interface MetricColumnRow {
  id: string;
  cells: Array<{ id: string; text: string }>;
}

interface MetricColumnProps {
  keyPrefix: string;
  rows: MetricColumnRow[];
  chartHeightPx: number;
  bandPx: number;
  barSize: number;
  barGap: number;
}

export function MetricColumn({
  keyPrefix,
  rows,
  chartHeightPx,
  bandPx,
  barSize,
  barGap,
}: MetricColumnProps) {
  return (
    <div
      className="min-w-0 overflow-hidden"
      style={{ height: `${chartHeightPx}px` }}
    >
      {rows.map((row) => (
        <div
          key={`${keyPrefix}-${row.id}`}
          className="flex flex-col justify-center min-w-0"
          style={{ height: `${bandPx}px`, gap: `${barGap}px` }}
        >
          {row.cells.map((cell) => (
            <div
              key={`${keyPrefix}-${row.id}-${cell.id}`}
              className="flex items-center justify-start min-w-0"
              style={{ height: `${barSize}px` }}
              title={cell.text}
            >
              <span className="block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-sm">
                {cell.text}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
