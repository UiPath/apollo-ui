"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ShellNavigationContextValue {
  activePage: string;
  onNavigate: (page: string) => void;
}

const ShellNavigationContext = createContext<ShellNavigationContextValue | null>(
  null,
);

export function ShellNavigationProvider({
  activePage,
  onNavigate,
  children,
}: ShellNavigationContextValue & { children: ReactNode }) {
  return (
    <ShellNavigationContext.Provider value={{ activePage, onNavigate }}>
      {children}
    </ShellNavigationContext.Provider>
  );
}

export function useShellNavigation() {
  return useContext(ShellNavigationContext);
}
