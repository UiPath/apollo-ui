"use client";

interface TrendChartProps {
  data: number[];
  startLabel?: string;
  endLabel?: string;
  startValue?: string;
  endValue?: string;
  subtitle?: string;
}

export function TrendChart({
  data,
  startLabel = "30 days ago",
  endLabel = "Today",
  startValue,
  endValue,
  subtitle,
}: TrendChartProps) {
  const width = 800;
  const height = 180;
  const padding = 20;

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

  // Create smooth curve
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[index - 1];
    const midX = (prevPoint.x + point.x) / 2;
    return `${path} Q ${prevPoint.x} ${prevPoint.y}, ${midX} ${(prevPoint.y + point.y) / 2} Q ${point.x} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  return (
    <div className="flex flex-col w-full">
      <div className="w-full h-[180px]">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="rgba(248, 250, 252, 1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Bottom labels */}
      <div className="flex items-start justify-between text-xs text-muted-foreground mt-2">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>

      {subtitle && (
        <p className="text-center text-sm font-bold text-foreground mt-2">
          {subtitle}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground mt-1">
        Target 80% automation
      </p>
    </div>
  );
}
