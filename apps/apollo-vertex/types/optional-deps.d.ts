declare module "@tanstack/react-db" {
  // Minimal stand-ins for @tanstack/db (re-exported by react-db). The phantom
  // `__row` on Collection carries the row type so `useLiveQuery` can infer it;
  // QueryResult is opaque (query-builder hooks supply their row type explicitly).
  export interface Collection<T = unknown> {
    readonly __row?: T;
    // Optimistic, server-synced row mutation (Immer-style draft). The returned
    // transaction's `isPersisted.promise` resolves once the write is committed.
    update(
      id: string,
      callback: (draft: T) => void,
    ): { isPersisted: { promise: Promise<unknown> } };
  }
  interface QueryResult {
    readonly __query?: true;
  }
  interface QueryBuilder {
    from(source: Record<string, unknown>): QueryResult;
  }

  // Accepts both the direct-collection form (`() => collection`, used by the
  // Solution Tests read hooks — row type inferred from the Collection) and the
  // query-builder form (`(q) => q.from({...})`, used by the identity/entity
  // hooks — row type supplied explicitly).
  export function useLiveQuery<T>(
    queryFn: (
      q: QueryBuilder,
    ) => Collection<T> | QueryResult | undefined | null,
    deps?: Array<unknown>,
  ): { data: T[] | undefined; isLoading: boolean; isReady: boolean };
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
  export interface Group {
    id: string;
    name: string;
  }

  export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    name: string;
    email: string;
  }

  export function useSolution(): {
    api: {
      // Authenticated UiPath SDK client; passed to @uipath/uipath-typescript
      // service constructors (e.g. attachment downloads).
      sdk: { core: import("@uipath/uipath-typescript/core").UiPath };
      // Resolved DataFabric id (GUID) per registered entity, keyed by entity name.
      entityIds: Record<string, string>;
      collections: {
        entities: Record<string, unknown>;
        // Name-keyed namespace for the Solution Test entity collections
        // (UiPathSTTests, UiPathSTBatchRuns, …). A given collection may be absent.
        solutionTests: Record<
          string,
          | import("@tanstack/react-db").Collection<Record<string, unknown>>
          | undefined
        >;
        identity: {
          groups: unknown;
          groupMembers: unknown;
        };
      };
    };
  } | null;
}
