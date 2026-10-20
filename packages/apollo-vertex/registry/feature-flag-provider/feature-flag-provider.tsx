"use client";

import { createContext, use, type PropsWithChildren } from "react";
import type { FeatureFlagProviderConfig } from "@/lib/feature-flag-provider/types";

export const FeatureFlagContext =
  createContext<FeatureFlagProviderConfig | null>(null);

export function useFeatureFlagProvider(): FeatureFlagProviderConfig {
  const provider = use(FeatureFlagContext);
  if (!provider) {
    throw new Error(
      "useFeatureFlagProvider must be used within a <FeatureFlagProvider>.",
    );
  }
  return provider;
}

interface FeatureFlagProviderProps {
  provider: FeatureFlagProviderConfig;
}

export function FeatureFlagProvider({
  provider,
  children,
}: PropsWithChildren<FeatureFlagProviderProps>) {
  return <FeatureFlagContext value={provider}>{children}</FeatureFlagContext>;
}
