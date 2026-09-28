interface GridPatternDemoProps {
  gridClass: string;
  gapClass: string;
  count: number;
}

export function GridPatternDemo({
  gridClass,
  gapClass,
  count,
}: GridPatternDemoProps) {
  const cells = Array.from({ length: count });
  const fullClass = `${gridClass} ${gapClass}`;

  return (
    <div className="not-prose flex flex-col gap-3">
      <div className={`${gridClass} ${gapClass}`}>
        {cells.map((_, i) => (
          // oxlint-disable-next-line react/no-array-index-key -- static demo cells
          <div key={i} className="h-16 rounded-md bg-muted" />
        ))}
      </div>
      <code className="self-start rounded-md bg-muted px-2 py-1 text-xs font-mono text-foreground">
        {fullClass}
      </code>
    </div>
  );
}
