declare module "@tanstack/react-db" {
  // Minimal stand-ins for @tanstack/db (re-exported by react-db). The phantom
  // `__row` carries the row type through the query builder so `useLiveQuery`
  // infers it from a typed `q.from({...})` source.
  export interface Collection<T = unknown> {
    readonly __row?: T;
    // Optimistic, server-synced row mutation (Immer-style draft). The returned
    // transaction's `isPersisted.promise` resolves once the write is committed.
    update(
      id: string,
      callback: (draft: T) => void,
    ): { isPersisted: { promise: Promise<unknown> } };
    // `utils.refetch()` re-pulls the source so the collection reflects writes
    // made out of band (e.g. through a backend trigger rather than the
    // collection's own mutators).
    readonly utils: { refetch(): Promise<void> };
  }
  interface QueryResult<T = unknown> {
    readonly __row?: T;
  }
  // Result of a source the stub can't type (e.g. the generic entity
  // collections). It carries no row type, so the row type is supplied by an
  // explicit `useLiveQuery` type argument instead.
  interface UntypedQueryResult {
    readonly __untyped?: true;
  }
  interface QueryBuilder {
    from<T>(source: Record<string, Collection<T>>): QueryResult<T>;
    from(source: Record<string, unknown>): UntypedQueryResult;
  }

  export function useLiveQuery<T>(
    queryFn: (
      q: QueryBuilder,
    ) => Collection<T> | QueryResult<T> | UntypedQueryResult | undefined | null,
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
