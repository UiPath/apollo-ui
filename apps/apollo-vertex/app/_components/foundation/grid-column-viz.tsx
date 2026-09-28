interface GridColumnVizProps {
  cols: number;
  gutter: string;
  margin: string;
}

export function GridColumnViz({ cols, gutter, margin }: GridColumnVizProps) {
  const columns = Array.from({ length: cols }, (_, i) => i + 1);

  return (
    <div className="not-prose rounded-lg border border-border bg-card p-4">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: gutter,
          paddingLeft: margin,
          paddingRight: margin,
        }}
      >
        {columns.map((col) => (
          <div
            key={col}
            className="flex items-center justify-center rounded border border-primary/30 bg-primary/10 py-3 text-xs font-mono text-primary"
          >
            {col}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 px-1">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{cols}</span> columns
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{gutter}</span> gutter
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{margin}</span> margin
        </span>
      </div>
    </div>
  );
}
