"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";

export function FullscreenWrapper({ children }: PropsWithChildren) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div ref={containerRef} className="relative h-full">
      {children}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-50 size-9 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[12px] border border-white/30 shadow-[0_0_20px_0_rgba(200,215,235,0.25)] text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4 stroke-[1.5]" />
        ) : (
          <Maximize2 className="size-4 stroke-[1.5]" />
        )}
      </button>
    </div>
  );
}
