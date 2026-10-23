import type {
  FeatureFlagValues as ProteusFeatureFlagValues,
  FlagMapping,
} from "@uipath/proteus-client";
import { initializeProteus } from "@uipath/proteus-client";
import type {
  FeatureFlagProviderConfig,
  FeatureFlagUserContext,
} from "@/lib/feature-flag-provider/types";

export type { ProteusFeatureFlagValues, FlagMapping };

type CreateProteusProviderOptions<TFlag extends string> = {
  appName: string;
  featureFlags: FlagMapping<TFlag>;
  authTokenFactory: () => string;
  apiOrigin?: string;
};

export function createProteusProvider<TFlag extends string>(
  options: CreateProteusProviderOptions<TFlag>,
): FeatureFlagProviderConfig<TFlag> {
  const instance = initializeProteus({
    appName: options.appName,
    featureFlags: options.featureFlags,
    authTokenFactory: options.authTokenFactory,
    apiOrigin: options.apiOrigin,
  });

  let isInitialized = false;

  // Track wrapper functions so we can unsubscribe the correct reference
  const wrapperMap = new WeakMap<
    (value: boolean) => void,
    (value: unknown) => void
  >();

  // Live subscriptions. Proteus emits changes only, so replay the loaded
  // value to anyone who subscribed before initialize finished.
  const listeners = new Map<TFlag, Set<(value: boolean) => void>>();

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

    on: (key, cb) => {
      const keyListeners = listeners.get(key) ?? new Set();
      keyListeners.add(cb);
      listeners.set(key, keyListeners);
      // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Proteus generic listener type is wider than boolean; we coerce via wrapper
      instance.addFlagChangeListener(key, getWrapper(cb) as never);
    },
    off: (key, cb) => {
      listeners.get(key)?.delete(cb);
      // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- same as above
      instance.removeFlagChangeListener(key, getWrapper(cb) as never);
    },

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
      for (const [key, keyListeners] of listeners) {
        const value = Boolean(instance.featureFlagValue(key));
        for (const cb of keyListeners) {
          cb(value);
        }
      }
    },
  };
}
