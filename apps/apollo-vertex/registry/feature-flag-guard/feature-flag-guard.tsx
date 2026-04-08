import type { PropsWithChildren, ReactNode } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

interface FeatureFlagGuardProps {
  featureFlag: string;
  fallback?: ReactNode;
}

export function FeatureFlagGuard({
  featureFlag,
  children,
  fallback,
}: PropsWithChildren<FeatureFlagGuardProps>) {
  const isEnabled = useFeatureFlag(featureFlag);

  if (!isEnabled) {
    return fallback ?? null;
  }

  return children;
}
