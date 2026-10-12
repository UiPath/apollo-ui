export interface KpiChartProps {
  label: string;
  value: string;
}

export function KpiChart({ label, value }: KpiChartProps) {
  return (
    <div className="flex h-full w-full flex-col items-stretch justify-between p-10">
      <span className="text-left text-base font-semibold text-foreground">
        {label}
      </span>
      <div className="flex justify-end">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
