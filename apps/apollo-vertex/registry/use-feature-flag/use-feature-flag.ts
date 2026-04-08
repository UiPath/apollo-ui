import { useEffect, useState } from "react";
import { useFeatureFlagProvider } from "@/lib/feature-flag-provider";

export function useFeatureFlag(key: string): boolean {
  const provider = useFeatureFlagProvider();
  const [value, setValue] = useState(() => provider.getFeatureFlagValue(key));

  useEffect(() => {
    const listener = (newValue: boolean) => {
      setValue(newValue);
    };

    provider.on(key, listener);
    return () => {
      provider.off(key, listener);
    };
  }, [key, provider]);

  return value;
}
