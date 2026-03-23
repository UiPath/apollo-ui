"use client";

import { useCallback, useEffect, useState } from "react";

type Phase = "logo" | "skeleton" | "done";

interface DashboardLoadingProps {
  children: React.ReactNode;
  triggerReplay?: number;
}

function LogoPhase({ exiting }: { exiting: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
        exiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Morphing glow */}
      <div className="absolute">
        <div className="size-40 rounded-full bg-gradient-to-br from-insight-500/30 to-primary-400/30 blur-3xl animate-pulse" />
      </div>
      <div className="absolute">
        <div
          className="size-32 rounded-full bg-gradient-to-tr from-primary-400/20 to-insight-500/20 blur-2xl"
          style={{ animation: "morph 4s ease-in-out infinite" }}
        />
      </div>

      {/* App icon */}
      <div className="relative size-16 rounded-2xl bg-gradient-to-br from-insight-500 to-primary-400 border-2 border-white/10 flex items-center justify-center shadow-lg">
        <img
          src="/UiPath.svg"
          alt="UiPath"
          className="size-8 brightness-0 invert"
        />
      </div>

      {/* Loading text */}
      <p className="mt-6 text-sm text-muted-foreground animate-pulse">
        Creating your overview...
      </p>

      <style>{`
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(45deg) scale(1.1); }
          50% { border-radius: 50% 60% 30% 60% / 30% 40% 70% 60%; transform: rotate(90deg) scale(0.95); }
          75% { border-radius: 60% 30% 50% 40% / 70% 50% 40% 60%; transform: rotate(135deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function SkeletonPhase({ exiting }: { exiting: boolean }) {
  return (
    <div
      className={`absolute inset-0 p-6 transition-all duration-500 ${
        exiting ? "opacity-0 scale-[0.99]" : "opacity-100 scale-100"
      }`}
    >
      <div className="space-y-2 mb-6">
        <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
        <div className="h-7 w-64 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-1 h-[calc(100%-80px)]">
        <div className="flex flex-col gap-1">
          <div className="flex-1 rounded-2xl bg-muted/50 animate-pulse" />
          <div className="h-14 rounded-2xl bg-muted/50 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-1">
          <div className="rounded-2xl bg-muted/50 animate-pulse" />
          <div className="rounded-2xl bg-muted/50 animate-pulse" />
          <div className="rounded-2xl bg-muted/50 animate-pulse" />
          <div className="rounded-2xl bg-muted/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function DashboardLoading({
  children,
  triggerReplay,
}: DashboardLoadingProps) {
  const [phase, setPhase] = useState<Phase>("done");
  const [exiting, setExiting] = useState(false);

  const startSequence = useCallback(() => {
    setExiting(false);
    setPhase("logo");
  }, []);

  useEffect(() => {
    if (triggerReplay === 0) return;
    if (triggerReplay) startSequence();
  }, [triggerReplay, startSequence]);

  useEffect(() => {
    if (phase === "done") return;

    if (phase === "logo") {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setExiting(false);
          setPhase("skeleton");
        }, 500);
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (phase === "skeleton") {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setPhase("done");
        }, 500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "done") {
    return (
      <div className="animate-in fade-in duration-500 h-full">{children}</div>
    );
  }

  return (
    <div className="relative h-full">
      {phase === "logo" && <LogoPhase exiting={exiting} />}
      {phase === "skeleton" && <SkeletonPhase exiting={exiting} />}
    </div>
  );
}
