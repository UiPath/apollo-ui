"use client";

import { useTheme as useDocsTheme } from "fumadocs-ui/provider/base";
import { type ReactNode, useEffect, useRef } from "react";
import {
  type Theme,
  ThemeProvider,
  useTheme as useShellTheme,
} from "@/registry/shell/shell-theme-provider";

function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

// Keeps the shell's theme and the docs theme (next-themes) in step, so the
// docs toggle and the shell's own theme menu always agree.
function ThemeSync() {
  const { theme: docsTheme, setTheme: setDocsTheme } = useDocsTheme();
  const { theme: shellTheme, setTheme: setShellTheme } = useShellTheme();
  const previousDocsTheme = useRef(docsTheme);

  useEffect(() => {
    const docsChanged = docsTheme !== previousDocsTheme.current;
    previousDocsTheme.current = docsTheme;
    if (docsTheme === shellTheme) return;

    // Follow whichever side changed: the docs toggle, or the shell's menu.
    if (docsChanged) {
      if (isTheme(docsTheme)) setShellTheme(docsTheme);
    } else {
      setDocsTheme(shellTheme);
    }
  }, [docsTheme, shellTheme, setDocsTheme, setShellTheme]);

  return null;
}

// The shell demos call the registry useTheme(), which needs its provider.
// It shares next-themes' storage key so both start from the same value.
export function ShellThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider storageKey="theme">
      <ThemeSync />
      {children}
    </ThemeProvider>
  );
}
