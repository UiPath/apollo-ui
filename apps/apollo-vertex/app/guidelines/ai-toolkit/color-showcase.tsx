const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type Shade = (typeof SHADES)[number];

interface ColorRamp {
  name: string;
  /** CSS var prefix, e.g. "primary" resolves to var(--primary-500). */
  token: string;
  note: string;
  values: Record<Shade, string>;
}

const PRIMARY: ColorRamp = {
  name: "Primary",
  token: "primary",
  note: "The brand cyan.",
  values: {
    50: "oklch(0.95 0.035 218)",
    100: "oklch(0.92 0.045 216)",
    200: "oklch(0.86 0.060 214)",
    300: "oklch(0.80 0.080 212)",
    400: "oklch(0.75 0.100 210)",
    500: "oklch(0.69 0.112 207)",
    600: "oklch(0.64 0.115 208)",
    700: "oklch(0.52 0.120 210)",
    800: "oklch(0.46 0.095 220)",
    900: "oklch(0.2394 0.0455 252.445)",
  },
};

const INSIGHT: ColorRamp = {
  name: "Insight",
  token: "insight",
  note: "The violet that signals intelligence.",
  values: {
    50: "oklch(0.96 0.03 277)",
    100: "oklch(0.92 0.05 277)",
    200: "oklch(0.86 0.09 277)",
    300: "oklch(0.78 0.14 277)",
    400: "oklch(0.70 0.19 277)",
    500: "oklch(0.62 0.22 277)",
    600: "oklch(0.56 0.20 277)",
    700: "oklch(0.48 0.17 277)",
    800: "oklch(0.38 0.13 278)",
    900: "oklch(0.30 0.10 278)",
  },
};

function Ramp({ ramp }: { ramp: ColorRamp }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-foreground">{ramp.name}</h3>
        <span className="text-xs text-muted-foreground">{ramp.note}</span>
      </div>
      <div className="grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-10">
        {SHADES.map((shade) => (
          <div key={shade}>
            <div
              className="h-14 rounded-md ring-1 ring-inset ring-black/10"
              style={{ background: `var(--${ramp.token}-${shade})` }}
            />
            <div className="mt-1.5">
              <div className="text-xs font-medium text-foreground">{shade}</div>
              <div className="font-mono text-[10px] leading-tight text-muted-foreground">
                {ramp.values[shade]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Gradient {
  name: string;
  /** Official CSS var, e.g. "--ai-gradient-strong". Omitted for candidates. */
  token?: string;
  /** Explicit gradient CSS, used for candidates with no token yet. */
  css?: string;
  /** Optional tag, e.g. "Candidate". */
  badge?: string;
  // Demonstrate the use in the swatch: white text on the fill, or the gradient
  // applied as clipped text. Omitted for plain block swatches.
  usage?: "fill" | "text";
  caption: string;
  startLabel: string;
  startColor: string;
  endLabel: string;
  endColor: string;
  // Dark mode uses different ramp steps; shown when the page is in dark theme.
  darkStartLabel?: string;
  darkStartColor?: string;
  darkEndLabel?: string;
  darkEndColor?: string;
}

const GRADIENTS: Gradient[] = [
  {
    name: "AI Gradient (fill)",
    token: "--ai-gradient-fill",
    usage: "fill",
    caption:
      "A solid fill for badges and buttons. White text on it passes AA (4.97:1+). Stays dark in dark mode so the white text keeps contrast; the text gradient lifts instead.",
    startLabel: "Insight 600",
    startColor: "oklch(0.56 0.20 277)",
    endLabel: "Primary 700",
    endColor: "oklch(0.52 0.120 210)",
  },
  {
    name: "AI Gradient (text)",
    token: "--ai-gradient-text",
    usage: "text",
    caption:
      "Use when AI text needs to sit on a theme-colored surface. Matches the fill colors in light mode, and lifts to lighter steps in dark mode to hold AA contrast.",
    startLabel: "Insight 600",
    startColor: "oklch(0.56 0.20 277)",
    endLabel: "Primary 700",
    endColor: "oklch(0.52 0.120 210)",
    darkStartLabel: "Insight 400",
    darkStartColor: "oklch(0.70 0.19 277)",
    darkEndLabel: "Primary 400",
    darkEndColor: "oklch(0.75 0.100 210)",
  },
  {
    name: "AI Gradient (strong)",
    token: "--ai-gradient-strong",
    caption: "The full-strength gradient for AI marks, icon fills, and glows.",
    startLabel: "Insight 600",
    startColor: "#6C5AEF",
    endLabel: "Primary 300",
    endColor: "#69C7DD",
  },
  {
    name: "AI Gradient (subtle)",
    token: "--ai-gradient",
    caption:
      "The soft tint for AI surface fills and backgrounds. The base name is the subtle tint, not the default gradient.",
    startLabel: "Insight 100",
    startColor: "oklch(0.92 0.05 277)",
    endLabel: "Primary 50",
    endColor: "oklch(0.95 0.035 218)",
    darkStartLabel: "Insight 800",
    darkStartColor: "oklch(0.38 0.13 278)",
    darkEndLabel: "Primary 800",
    darkEndColor: "oklch(0.46 0.095 220)",
  },
];

function Endpoint({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-3.5 rounded-full ring-1 ring-inset ring-black/10"
        style={{ background: color }}
      />
      <span className="text-foreground">{label}</span>
      <span className="font-mono text-muted-foreground">{color}</span>
    </span>
  );
}

function GradientCard({ gradient }: { gradient: Gradient }) {
  const css = gradient.css ?? `var(${gradient.token})`;
  return (
    <div className="rounded-xl border border-border p-4">
      {gradient.usage === "text" ? (
        <div className="flex h-24 items-center justify-center rounded-lg ring-1 ring-inset ring-black/10">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{
              backgroundImage: css,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Gradient text
          </span>
        </div>
      ) : (
        <div
          className="flex h-24 items-center justify-center rounded-lg ring-1 ring-inset ring-black/10"
          style={{ background: css }}
        >
          {gradient.usage === "fill" && (
            <span className="text-2xl font-bold tracking-tight text-white">
              White text
            </span>
          )}
        </div>
      )}
      <div className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {gradient.name}
          </h3>
          {gradient.token && (
            <code className="font-mono text-xs text-muted-foreground">
              {gradient.token}
            </code>
          )}
          {gradient.badge && (
            <span className="rounded-full border border-insight-300 bg-insight-50 px-2 py-0.5 text-[10px] font-medium text-insight-700">
              {gradient.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{gradient.caption}</p>
        {gradient.darkStartColor && gradient.darkEndColor ? (
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-9 shrink-0 font-medium text-muted-foreground">
                Light
              </span>
              <Endpoint
                color={gradient.startColor}
                label={gradient.startLabel}
              />
              <span className="text-muted-foreground">to</span>
              <Endpoint color={gradient.endColor} label={gradient.endLabel} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-9 shrink-0 font-medium text-muted-foreground">
                Dark
              </span>
              <Endpoint
                color={gradient.darkStartColor}
                label={gradient.darkStartLabel ?? ""}
              />
              <span className="text-muted-foreground">to</span>
              <Endpoint
                color={gradient.darkEndColor}
                label={gradient.darkEndLabel ?? ""}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <Endpoint color={gradient.startColor} label={gradient.startLabel} />
            <span className="text-muted-foreground">to</span>
            <Endpoint color={gradient.endColor} label={gradient.endLabel} />
          </div>
        )}
      </div>
    </div>
  );
}

function GradientGroup({
  title,
  note,
  gradients,
}: {
  title: string;
  note: string;
  gradients: Gradient[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
      {gradients.map((gradient) => (
        <GradientCard key={gradient.name} gradient={gradient} />
      ))}
    </div>
  );
}

/** Color foundations for the AI expression: the two ramps and the AI gradients. */
export function ColorShowcase() {
  return (
    <div className="my-6 space-y-8">
      <div className="space-y-6">
        <Ramp ramp={PRIMARY} />
        <Ramp ramp={INSIGHT} />
      </div>
      <div className="space-y-8">
        <GradientGroup
          title="Same in light and dark"
          note="Theme-invariant"
          gradients={GRADIENTS.filter((g) => !g.darkStartColor)}
        />
        <GradientGroup
          title="Adapts per theme"
          note="Different ramp steps per mode"
          gradients={GRADIENTS.filter((g) => g.darkStartColor)}
        />
      </div>
    </div>
  );
}
