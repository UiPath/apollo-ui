"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";

function GlassCard({
  className,
  children,
  style,
}: {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden bg-white/55 dark:bg-white/[0.05] backdrop-blur-md",
        className,
      )}
      style={{
        border: "1px solid rgba(255, 255, 255, 0.72)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function DashboardV2Page({ visible }: { visible: boolean }) {
  const [layout, setLayout] = useState("focus-hero-v1");

  if (!visible) return null;

  return (
    <div className="relative h-full overflow-hidden pt-24 pb-6 px-6 grid grid-cols-2 gap-1">
      {/* Background gradient — shaped illumination */}
      <svg
        className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none translate-y-12"
        viewBox="0 0 1576 818"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#bg-blur)">
          <path
            d="M541.705 724.362L75 257.99L87.1579 127.101L482.877 75L916.638 102.957L1501 84.319L1388.44 421.919L1314.32 743L847.613 651.928L541.705 724.362Z"
            fill="url(#bg-gradient)"
            fillOpacity="0.3"
          />
        </g>
        <defs>
          <filter
            id="bg-blur"
            x="-10%"
            y="-15%"
            width="120%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="37.5"
              result="effect1_foregroundBlur"
            />
          </filter>
          <linearGradient
            id="bg-gradient"
            x1="607.918"
            y1="95.3798"
            x2="1538.15"
            y2="838.957"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6C5AEF" />
            <stop offset="1" stopColor="#69C7DD" />
          </linearGradient>
        </defs>
      </svg>

      {/* Page header */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-6 flex items-end justify-between">
        <div className="pointer-events-none">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold">UiPath™</span> Vertical Solutions
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Dashboard Layouts
          </h1>
        </div>
        <Select value={layout} onValueChange={setLayout}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="focus-hero-v1">Focus - Hero - v1</SelectItem>
            <SelectItem value="focus-hero-v2">Focus - Hero - v2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Left half — hero + footer card */}
      <div className="flex flex-col gap-1">
        <GlassCard
          className="flex-1"
          style={{
            background:
              "linear-gradient(110.17deg, #F8F8FE 6.21%, rgba(255, 255, 255, 0) 43.31%), white",
          }}
        />
        <GlassCard
          className="h-16 shrink-0 bg-white/95 dark:bg-white/10"
          style={{
            boxShadow:
              "0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 4px -1px rgba(0,0,0,0.04), inset 0 1px 0 0 rgba(255,255,255,0.90)",
          }}
        />
      </div>

      {/* Right half */}
      {layout === "focus-hero-v1" && (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 max-md:flex max-md:flex-col max-md:overflow-y-auto">
          <GlassCard className="bg-white/95 dark:bg-white/10 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 max-md:min-h-40 max-md:shrink-0" />
        </div>
      )}
      {layout === "focus-hero-v2" && (
        <div className="grid grid-cols-3 grid-rows-2 gap-1 max-md:flex max-md:flex-col max-md:overflow-y-auto">
          <GlassCard className="bg-white/95 dark:bg-white/10 col-span-1 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 col-span-2 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 col-span-2 max-md:min-h-40 max-md:shrink-0" />
          <GlassCard className="bg-white/95 dark:bg-white/10 col-span-1 max-md:min-h-40 max-md:shrink-0" />
        </div>
      )}
    </div>
  );
}
