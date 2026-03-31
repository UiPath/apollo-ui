import type React from 'react';
import { createContext, useContext, useMemo } from 'react';

type IgnoredNodeTypesContextType = {
  ignoredNodeTypes: string[];
};

const IgnoredNodeTypesContext = createContext<IgnoredNodeTypesContextType | undefined>(undefined);

export const IgnoredNodeTypesProvider: React.FC<
  React.PropsWithChildren<{ ignoredNodeTypes?: string[] }>
> = ({ children, ignoredNodeTypes = [] }) => {
  const value = useMemo(() => ({ ignoredNodeTypes }), [ignoredNodeTypes]);
  return (
    <IgnoredNodeTypesContext.Provider value={value}>{children}</IgnoredNodeTypesContext.Provider>
  );
};

/**
 * Returns the `ignoredNodeTypes` configured on the nearest `BaseCanvas`.
 * These node types are excluded from collision resolution.
 *
 * Returns an empty array when used outside of a `BaseCanvas` (safe fallback).
 */
export function useIgnoredNodeTypes(): string[] {
  const context = useContext(IgnoredNodeTypesContext);
  return context?.ignoredNodeTypes ?? [];
}
