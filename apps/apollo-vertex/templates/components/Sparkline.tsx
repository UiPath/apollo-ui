interface SparklineProps {
  data: number[];
  value?: string;
  unit?: string;
  description?: string;
}

export function Sparkline({ data, value, unit, description }: SparklineProps) {
  const width = 400;
  const height = 120;
  const padding = 10;

  // Calculate min and max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Create points for the path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  // Create smooth curve using quadratic bezier curves
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[index - 1];
    const midX = (prevPoint.x + point.x) / 2;
    return `${path} Q ${prevPoint.x} ${prevPoint.y}, ${midX} ${(prevPoint.y + point.y) / 2} Q ${point.x} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="sparklineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#sparklineGradient)"
            opacity="0.2"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#sparklineStroke)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        {value && unit && (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            <span className="text-xl font-bold text-foreground">{unit}</span>
          </div>
        )}

        {description && (
          <p className="text-left text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
