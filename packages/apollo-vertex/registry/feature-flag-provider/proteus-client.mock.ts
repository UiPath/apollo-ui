import { vi } from "vitest";

type ProteusInitOptions = {
  appName: string;
  featureFlags: unknown;
  authTokenFactory: () => string;
  apiOrigin?: string;
};

type ProteusTestInstance = {
  identity: () => Promise<void>;
  featureFlagValue: (key: string) => unknown;
  defaultFeatureFlagValue: (key: string) => unknown;
  addFlagChangeListener: (key: string, cb: (value: unknown) => void) => void;
  removeFlagChangeListener: (key: string, cb: (value: unknown) => void) => void;
};

export const initializeProteus =
  vi.fn<(options: ProteusInitOptions) => ProteusTestInstance>();
