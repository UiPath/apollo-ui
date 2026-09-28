import type { SpacingStep } from "@/lib/foundation-tokens";

const MAX_BAR_WIDTH = 320;

export function SpacingRow({ step, px, rem }: SpacingStep) {
  const barWidth = Math.min(px, MAX_BAR_WIDTH);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 font-mono text-sm font-semibold text-foreground w-16">
        {step}
      </td>
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground w-16">
        {px}px
      </td>
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground w-20">
        {rem}
      </td>
      <td className="py-2 w-full">
        {px > 0 && (
          <div
            className="h-3 rounded-sm bg-primary"
            style={{ width: barWidth }}
            aria-label={`${px}px`}
          />
        )}
      </td>
    </tr>
  );
}
