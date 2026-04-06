import type { ColorToken } from "@/lib/foundation-tokens";

type ColorSwatchProps = ColorToken;

export function ColorSwatch({
  token,
  label,
  description,
  lightValue,
  darkValue,
}: ColorSwatchProps) {
  const differs = lightValue !== darkValue;
  const cssVar = `var(--${token})`;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div
        className="h-28 w-full border-b border-border"
        style={{ background: cssVar }}
        aria-label={label}
      />
      <div className="flex flex-col gap-1.5 p-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <code className="self-start rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{`--${token}`}</code>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
        <code className="text-xs font-mono text-muted-foreground">
          {lightValue}
        </code>
        {differs && (
          <code className="text-xs font-mono text-muted-foreground">
            dark: {darkValue}
          </code>
        )}
      </div>
    </div>
  );
}
