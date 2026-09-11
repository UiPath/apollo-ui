"use client";

interface HeroTrendProps {
  values: number[];
  target: number;
}

const WIDTH = 280;
const HEIGHT = 64;
const AREA_GRADIENT_ID = "hero-trend-area-gradient";
const LINE_GRADIENT_ID = "hero-trend-line-gradient";

// The hero's own visual (prompt 70, filled to its card in 71): one soft
// line over the cycle time series, a faint tint fading beneath it, a
// dashed rule at the target, and a single point at the latest value. No
// axis, gridlines, per point labels or legend; every coordinate derives
// from the series and the target, none of it fixed. preserveAspectRatio
// is "none" so the chart stretches to whatever box it is given, full
// width and full height, rather than letterboxing to the viewBox's own
// aspect ratio.
export function HeroTrend({ values, target }: HeroTrendProps) {
  const scaleValues = [...values, target];
  const max = Math.max(...scaleValues);
  const min = Math.min(...scaleValues);
  const range = max - min || 1;
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;

  const toY = (value: number) => HEIGHT - ((value - min) / range) * HEIGHT;

  const points = values.map((value, i) => ({ x: i * step, y: toY(value) }));

  // A smooth curve through the points (quadratic beziers via consecutive
  // midpoints), rather than straight segments meeting at hard angles.
  let linePath = points.length > 0 ? `M ${points[0].x},${points[0].y}` : "";
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    linePath += ` Q ${points[i].x},${points[i].y} ${midX},${midY}`;
  }
  const last = points.at(-1);
  if (points.length > 1 && last) {
    linePath += ` Q ${last.x},${last.y} ${last.x},${last.y}`;
  }
  const areaPath = `${linePath} L ${WIDTH},${HEIGHT} L 0,${HEIGHT} Z`;
  const targetY = toY(target);
  const lastIndex = values.length - 1;
  const lastX = lastIndex * step;
  const lastY = toY(values[lastIndex] ?? 0);

  // An arrowhead rather than a dot at the latest value, angled along the
  // line's own final segment so it reads as leading the line rather than
  // just marking its end. Falls back to pointing right when there is only
  // one point to derive a direction from.
  const secondLast = points.at(-2);
  const arrowAngle = secondLast
    ? (Math.atan2(lastY - secondLast.y, lastX - secondLast.x) * 180) / Math.PI
    : 0;

  // The viewBox pads out past the data area on every side (prompt: "the
  // end mark on the chart is being cut off"): the latest-value circle sits
  // exactly at x=WIDTH, so its own radius extended past the viewBox edge
  // and was clipped by the SVG's own bounds. Padding by more than that
  // radius keeps it, and the line's stroke width at the extremities, fully
  // inside on every edge.
  const PAD = 4;

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${WIDTH + PAD * 2} ${HEIGHT + PAD * 2}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* Same colour tokens as the AI gradient (AiMark's "gb-ai-mark"),
          reoriented left to right across this chart's own width; the
          reference definition uses fixed userSpaceOnUse coordinates sized
          for a 24x24 icon, which would render as a near solid colour
          across a line this wide. */}
        <linearGradient id={LINE_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--ai-gradient-start)" />
          <stop offset="100%" stopColor="var(--ai-gradient-end)" />
        </linearGradient>
        <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--ai-gradient-end)"
            stopOpacity="0.2"
          />
          <stop
            offset="100%"
            stopColor="var(--ai-gradient-end)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <line
        x1="0"
        y1={targetY}
        x2={WIDTH}
        y2={targetY}
        className="stroke-muted-foreground/30"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <path d={areaPath} fill={`url(#${AREA_GRADIENT_ID})`} />
      <path
        d={linePath}
        stroke={`url(#${LINE_GRADIENT_ID})`}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M -1.8,-2 L 2.2,0 L -1.8,2"
        stroke="var(--ai-gradient-end)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform={`translate(${lastX} ${lastY}) rotate(${arrowAngle})`}
      />
    </svg>
  );
}

export type { HeroTrendProps };
