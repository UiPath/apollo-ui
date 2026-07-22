"use client";

/** Provides the view's presentation config + trigger-backed write actions. */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SolutionTestsActions } from "./actions";
import {
  resolveConfig,
  type ResolvedSolutionTestsConfig,
  type SolutionTestsConfig,
} from "./config";
import { createSolutionTestActions } from "./create-actions";

interface SolutionTestsContextValue {
  config: ResolvedSolutionTestsConfig;
  actions: SolutionTestsActions;
  attachmentScope?: () => { folderKey?: string };
}

const SolutionTestsContext = createContext<SolutionTestsContextValue | null>(
  null,
);

interface SolutionTestsProviderProps {
  config?: SolutionTestsConfig;
  /** Base URL each action slug is appended to (no trailing slash). */
  triggerBaseUrl: string;
  getToken: () => Promise<string | null> | string | null;
  /** Folder scope forwarded to entity attachment downloads (in-solution hosting). */
  attachmentScope?: () => { folderKey?: string };
  children: ReactNode;
}

export const SolutionTestsProvider = ({
  config,
  triggerBaseUrl,
  getToken,
  attachmentScope,
  children,
}: SolutionTestsProviderProps) => {
  const value = useMemo(
    () => ({
      config: resolveConfig(config),
      actions: createSolutionTestActions({ triggerBaseUrl, getToken }),
      attachmentScope,
    }),
    [config, triggerBaseUrl, getToken, attachmentScope],
  );
  return (
    <SolutionTestsContext.Provider value={value}>
      {children}
    </SolutionTestsContext.Provider>
  );
};

export function useSolutionTestsContext(): SolutionTestsContextValue {
  const ctx = useContext(SolutionTestsContext);
  if (!ctx) {
    throw new Error(
      "useSolutionTestsContext must be used within a SolutionTestsProvider",
    );
  }
  return ctx;
}

export function useSolutionTestsConfig(): ResolvedSolutionTestsConfig {
  return useSolutionTestsContext().config;
}

export function useSolutionTestsActions(): SolutionTestsActions {
  return useSolutionTestsContext().actions;
}
