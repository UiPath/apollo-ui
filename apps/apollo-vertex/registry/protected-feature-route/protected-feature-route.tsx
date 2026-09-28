import type { PropsWithChildren } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

interface ProtectedFeatureRouteProps {
  feature: string;
}

/**
 * Route-level guard that throws when a feature is disabled,
 * intended to be caught by an error boundary.
 */
export function ProtectedFeatureRoute({
  feature,
  children,
}: PropsWithChildren<ProtectedFeatureRouteProps>) {
  const isEnabled = useFeatureFlag(feature);

  if (!isEnabled) {
    throw new Error(`Feature "${feature}" is disabled for your account.`);
  }

  return children;
}
