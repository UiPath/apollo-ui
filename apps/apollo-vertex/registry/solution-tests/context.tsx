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

/** Resolves a Solution Test entity name (e.g. `UiPathSTRunResults`) to its DataFabric id (GUID). */
export type EntityIdResolver = (name: string) => string | undefined;

interface SolutionTestsContextValue {
  config: ResolvedSolutionTestsConfig;
  actions: SolutionTestsActions;
  getEntityId: EntityIdResolver;
}

const SolutionTestsContext = createContext<SolutionTestsContextValue | null>(
  null,
);

interface SolutionTestsProviderProps {
  config?: SolutionTestsConfig;
  /** Base URL each action slug is appended to (no trailing slash). */
  triggerBaseUrl: string;
  getToken: () => Promise<string | null> | string | null;
  /** Resolves a Solution Test entity name to its DataFabric id (GUID); used for attachment reads. */
  getEntityId: EntityIdResolver;
  children: ReactNode;
}

export const SolutionTestsProvider: React.FC<SolutionTestsProviderProps> = ({
  config,
  triggerBaseUrl,
  getToken,
  getEntityId,
  children,
}) => {
  const value = useMemo(
    () => ({
      config: resolveConfig(config),
      actions: createSolutionTestActions({ triggerBaseUrl, getToken }),
      getEntityId,
    }),
    [config, triggerBaseUrl, getToken, getEntityId],
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

export function useSolutionTestsEntityId(): EntityIdResolver {
  return useSolutionTestsContext().getEntityId;
}
