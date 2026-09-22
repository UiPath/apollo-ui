import type { LabelListContentProps } from "./util/recharts-bar-data";

interface BarLabelProps extends LabelListContentProps {
  formatted: string;
}

export function BarLabel({ x, y, width, height, formatted }: BarLabelProps) {
  const xNum = Number(x ?? 0);
  const yNum = Number(y ?? 0);
  const wNum = Number(width ?? 0);
  const hNum = Number(height ?? 0);

  return (
    <text
      x={xNum + wNum + 6}
      y={yNum + hNum / 2}
      dy="0.35em"
      fill="var(--color-fg, #222)"
      fontSize="14"
    >
      {formatted}
    </text>
  );
}
