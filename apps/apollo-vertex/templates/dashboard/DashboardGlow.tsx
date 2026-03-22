"use client";

import { useEffect, useMemo, useState } from "react";
import {
  defaultDarkGlow,
  defaultLightGlow,
  type GlowConfig,
} from "./glow-config";

interface DashboardGlowProps {
  className?: string;
  darkConfig?: GlowConfig;
}

function resolveColor(value: string): string {
  if (typeof document === "undefined") return value;
  const match = value.match(/^var\(--(.+)\)$/);
  if (!match) return value;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(
    `--${match[1]}`,
  );
  return computed.trim() || value;
}

function GlowSvg({ uid, config }: { uid: string; config: GlowConfig }) {
  const gradientId = `glow-grad-${uid}`;
  const filterId = `glow-blur-${uid}`;
  const startColor = resolveColor(config.start);
  const endColor = resolveColor(config.end);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1576 818"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter={`url(#${filterId})`}>
        <path
          d="M541.705 724.362L75 257.99L87.1579 127.101L482.877 75L916.638 102.957L1501 84.319L1388.44 421.919L1314.32 743L847.613 651.928L541.705 724.362Z"
          fill={`url(#${gradientId})`}
          fillOpacity={config.fillOpacity}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="1576"
          height="818"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="linearRGB"
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
          id={gradientId}
          x1="607.918"
          y1="95.3798"
          x2="1538.15"
          y2="838.957"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor={startColor}
            stopOpacity={config.startStopOpacity}
          />
          <stop
            offset={config.endOffset}
            stopColor={endColor}
            stopOpacity={config.endStopOpacity}
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

let globalCounter = 0;

export function DashboardGlow({ className, darkConfig }: DashboardGlowProps) {
  const light = defaultLightGlow;
  const dark = darkConfig ?? defaultDarkGlow;
  const [revision, setRevision] = useState(() => ++globalCounter);

  const stableId = useMemo(() => `g${Date.now().toString(36)}`, []);

  useEffect(() => {
    setRevision(++globalCounter);
  }, [
    dark.start,
    dark.end,
    dark.startStopOpacity,
    dark.endStopOpacity,
    dark.endOffset,
    dark.fillOpacity,
  ]);

  return (
    <div
      className={`pointer-events-none absolute top-10 -left-16 -right-32 -bottom-16 overflow-visible ${className ?? ""}`}
    >
      {/* Light mode glow */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{ opacity: light.containerOpacity / 100 }}
      >
        <GlowSvg uid={`${stableId}-light`} config={light} />
      </div>
      {/* Dark mode glow */}
      <div
        key={revision}
        className="absolute inset-0 hidden dark:block"
        style={{ opacity: dark.containerOpacity / 100 }}
      >
        <GlowSvg uid={`${stableId}-dark-${revision}`} config={dark} />
      </div>
    </div>
  );
}
