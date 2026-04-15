declare module "@tanstack/react-db" {
  export function useLiveQuery<T>(
    queryFn: (q: {
      from: (source: Record<string, unknown>) => unknown;
    }) => unknown,
    deps?: Array<unknown>,
  ): {
    data: T[] | undefined;
    isLoading: boolean;
  };
}

declare module "@uipath/proteus-client" {
  export enum FeatureFlagKind {
    Boolean = "Boolean",
    String = "String",
    Number = "Number",
  }

  export type FlagConfig = {
    kind: FeatureFlagKind;
    alias: string;
  };

  export type FlagMapping<TFlag extends string> = Record<TFlag, FlagConfig>;

  export type FeatureFlagValues<TFlag extends string> = Record<TFlag, unknown>;

  export type ProteusInstance<TFlag extends string> = {
    featureFlagValue(key: TFlag): unknown;
    defaultFeatureFlagValue(key: TFlag): unknown;
    addFlagChangeListener(key: TFlag, cb: (value: unknown) => void): void;
    removeFlagChangeListener(key: TFlag, cb: (value: unknown) => void): void;
    identity(context: Record<string, string | undefined>): Promise<void>;
  };

  export function initializeProteus<TFlag extends string>(options: {
    appName: string;
    featureFlags: FlagMapping<TFlag>;
    authTokenFactory: () => string;
  }): ProteusInstance<TFlag>;
}

declare module "@uipath/vs-core" {
  export function useSolution(): {
    api: {
      collections: {
        entities: Record<string, unknown>;
      };
    };
  } | null;
}
