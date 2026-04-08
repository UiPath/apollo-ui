import type {
  FeatureFlagValues as ProteusFeatureFlagValues,
  FlagMapping,
} from "@uipath/proteus-client";

export type FeatureFlagUserContext = {
  userId: string;
  email: string;
  organizationName: string;
  organizationId: string;
  tenantName: string;
  tenantId: string;
  region?: string;
};

export type FeatureFlagProviderConfig<TFlag extends string = string> = {
  getFeatureFlagValue: (key: TFlag) => boolean;
  on(event: TFlag, cb: (value: boolean) => void): void;
  off(event: TFlag, cb: (value: boolean) => void): void;
  initialize: (context: FeatureFlagUserContext) => Promise<void>;
};

export type { ProteusFeatureFlagValues, FlagMapping };
