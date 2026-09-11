"use client";

// framer-motion (used throughout the shell/registry — sidebar, shell,
// ai-chat, and the guided-buying templates) registers each `motion.*`
// component via a `useInsertionEffect` that can end up scheduling a state
// update. React 19 warns on that timing regardless of whether it actually
// causes a problem; framer-motion still runs on React 18 semantics here and
// this specific warning is open upstream, not something in our own code:
// - https://github.com/facebook/react/issues/24160
// - https://github.com/motiondivision/motion/issues/2668
// React still applies the update correctly — this only silences the
// dev-console noise, and only that one exact message, so a real
// useInsertionEffect misuse in code we do own would still surface normally.
declare global {
  interface Window {
    __suppressedInsertionEffectWarning?: boolean;
  }
}

const FILTERED_MESSAGE = "useInsertionEffect must not schedule updates.";

if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV !== "production" &&
  !window.__suppressedInsertionEffectWarning
) {
  window.__suppressedInsertionEffectWarning = true;
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(FILTERED_MESSAGE)) {
      return;
    }
    originalError(...args);
  };
}

export function SuppressKnownWarnings() {
  return null;
}
