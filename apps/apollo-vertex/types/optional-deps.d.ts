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

declare module "@uipath/vs-core" {
  export function useSolution(): {
    api: {
      collections: {
        entities: Record<string, unknown>;
      };
    };
  } | null;
}
