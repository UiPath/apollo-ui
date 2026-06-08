"use client";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/registry/shell/shell-theme-provider";
import { GuidedBuyingShell } from "@/templates/guided-buying/GuidedBuyingShell";

export default function GuidedBuyingPage() {
  // The shell is a full-screen client app. Rendering it through Next's tree
  // puts it inside Nextra's docs layout, whose interrupted hydration leaves the
  // subtree stuck `display:none`. So we mount it in a *separate* React root
  // attached to <body> — built by a fresh client render (no hydration), fully
  // outside Nextra's tree and Suspense, so nothing can hide it. It carries its
  // own ThemeProvider (normally supplied by the app's root ThemeWrapper).
  useEffect(() => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    root.render(
      <ThemeProvider storageKey="theme">
        <div className="fixed inset-0 z-50 bg-background">
          <GuidedBuyingShell />
        </div>
      </ThemeProvider>,
    );
    return () => {
      root.unmount();
      container.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading prototype…
    </div>
  );
}
