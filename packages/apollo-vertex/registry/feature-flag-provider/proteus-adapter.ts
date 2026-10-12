import type { FlagMapping } from "@uipath/proteus-client";
import { initializeProteus } from "@uipath/proteus-client";
import type {
  FeatureFlagProviderConfig,
  FeatureFlagUserContext,
} from "@/lib/feature-flag-provider/types";

type CreateProteusProviderOptions<TFlag extends string> = {
  appName: string;
  featureFlags: FlagMapping<TFlag>;
  authTokenFactory: () => string;
};

export function createProteusProvider<TFlag extends string>(
  options: CreateProteusProviderOptions<TFlag>,
): FeatureFlagProviderConfig<TFlag> {
  const instance = initializeProteus({
    appName: options.appName,
    featureFlags: options.featureFlags,
    authTokenFactory: options.authTokenFactory,
  });

  let isInitialized = false;

  // Track wrapper functions so we can unsubscribe the correct reference
  const wrapperMap = new WeakMap<
    (value: boolean) => void,
    (value: unknown) => void
  >();

  function getWrapper(cb: (value: boolean) => void): (value: unknown) => void {
    let wrapper = wrapperMap.get(cb);
    if (!wrapper) {
      wrapper = (value: unknown) => cb(Boolean(value));
      wrapperMap.set(cb, wrapper);
    }
    return wrapper;
  }

  return {
    getFeatureFlagValue: (key) => {
      const raw = isInitialized
        ? instance.featureFlagValue(key)
        : instance.defaultFeatureFlagValue(key);
      return Boolean(raw);
    },

    on: (key, cb) =>
      // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Proteus generic listener type is wider than boolean; we coerce via wrapper
      instance.addFlagChangeListener(key, getWrapper(cb) as never),
    off: (key, cb) =>
      // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- same as above
      instance.removeFlagChangeListener(key, getWrapper(cb) as never),

    initialize: async (context: FeatureFlagUserContext) => {
      await instance.identity({
        userId: context.userId,
        organizationName: context.organizationName,
        organizationId: context.organizationId,
        tenantId: context.tenantId,
        tenantName: context.tenantName,
        email: context.email,
        region: context.region,
      });

      isInitialized = true;
    },
  };
}
