"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/registry/button/button";

export function FullscreenShellToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const shellElement = container.closest('[class*="h-screen"]')?.parentElement;

    if (isFullscreen && shellElement) {
      shellElement.style.position = "fixed";
      shellElement.style.top = "0";
      shellElement.style.left = "0";
      shellElement.style.right = "0";
      shellElement.style.bottom = "0";
      shellElement.style.width = "100vw";
      shellElement.style.height = "100vh";
      shellElement.style.zIndex = "9999";
      shellElement.style.backgroundColor = "var(--background)";
    } else if (!isFullscreen && shellElement) {
      shellElement.style.position = "";
      shellElement.style.top = "";
      shellElement.style.left = "";
      shellElement.style.right = "";
      shellElement.style.bottom = "";
      shellElement.style.width = "";
      shellElement.style.height = "";
      shellElement.style.zIndex = "";
      shellElement.style.backgroundColor = "";
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div ref={containerRef} style={{ display: "none" }} />
      <Button
        onClick={toggleFullscreen}
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-[10000]"
      >
        {isFullscreen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        )}
      </Button>
    </>
  );
}
