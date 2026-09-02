"use client";

const sparklinePoints = [4, 7, 5, 9, 6, 8, 12, 10, 14, 11, 15, 13];
const areaPoints = [3, 5, 4, 8, 6, 9, 7, 11, 10, 14, 12, 16];

export function DonutContent() {
  return (
    <div className="flex items-center justify-center flex-1">
      <div className="relative size-3/4 aspect-square">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-muted"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-chart-1"
            strokeWidth="2"
            strokeDasharray="97.39"
            strokeDashoffset={97.39 * (1 - 0.47)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-normal tracking-tight leading-none">
            47%
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            funded
          </span>
        </div>
      </div>
    </div>
  );
}

export function SparklineContent() {
  const max = Math.max(...sparklinePoints);
  const h = 40;
  const w = 120;
  const step = w / (sparklinePoints.length - 1);
  const points = sparklinePoints
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");

  return (
    <div className="flex items-center justify-center flex-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" fill="none">
        <polyline
          points={points}
          className="stroke-chart-1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function AreaContent() {
  const max = Math.max(...areaPoints);
  const h = 40;
  const w = 120;
  const step = w / (areaPoints.length - 1);
  const linePoints = areaPoints
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  const areaPath = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="flex items-center justify-center flex-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" fill="none">
        <polygon points={areaPath} className="fill-chart-1/20" />
        <polyline
          points={linePoints}
          className="stroke-chart-1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
