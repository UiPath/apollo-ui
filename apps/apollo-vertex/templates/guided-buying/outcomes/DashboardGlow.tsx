"use client";

import {
  defaultDarkGlow,
  defaultLightGlow,
  type GlowConfig,
} from "./glow-config";

interface DashboardGlowProps {
  className?: string;
  darkConfig?: GlowConfig;
}

function GlowSvg({ id, config }: { id: string; config: GlowConfig }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1576 818"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter={`url(#blur-${id})`}>
        <path
          d="M541.705 724.362L75 257.99L87.1579 127.101L482.877 75L916.638 102.957L1501 84.319L1388.44 421.919L1314.32 743L847.613 651.928L541.705 724.362Z"
          fill={`url(#grad-${id})`}
          fillOpacity={config.fillOpacity}
        />
      </g>
      <defs>
        <filter
          id={`blur-${id}`}
          x="0"
          y="0"
          width="1576"
          height="818"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur stdDeviation="37.5" result="effect1_foregroundBlur" />
        </filter>
        <linearGradient
          id={`grad-${id}`}
          x1="607.918"
          y1="95.3798"
          x2="1538.15"
          y2="838.957"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor={config.start}
            stopOpacity={config.startStopOpacity}
          />
          <stop
            offset={config.endOffset}
            stopColor={config.end}
            stopOpacity={config.endStopOpacity}
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DashboardGlow({ className, darkConfig }: DashboardGlowProps) {
  const light = defaultLightGlow;
  const dark = darkConfig ?? defaultDarkGlow;

  return (
    <div
      className={`pointer-events-none absolute top-10 -left-16 -right-32 -bottom-16 overflow-visible ${className ?? ""}`}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{ opacity: light.containerOpacity / 100 }}
      >
        <GlowSvg id="light" config={light} />
      </div>
      <div
        className="absolute inset-0 hidden dark:block"
        style={{ opacity: dark.containerOpacity / 100 }}
      >
        <GlowSvg id="dark" config={dark} />
      </div>
    </div>
  );
}
