interface BarData {
  label: string;
  percentage: number;
  gradient: string;
  shadowColor: string;
}

interface GradientBarsProps {
  bars: BarData[];
}

export function GradientBars({ bars }: GradientBarsProps) {
  return (
    <div className="flex flex-col gap-5 mt-4">
      {bars.map((bar, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{bar.label}</span>
            <span className="text-xs font-medium text-foreground">{bar.percentage}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-accent-foreground/10">
            <div
              className="h-1 rounded-full"
              style={{
                width: `${bar.percentage}%`,
                background: bar.gradient,
                boxShadow: `0 4px 8px ${bar.shadowColor}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
