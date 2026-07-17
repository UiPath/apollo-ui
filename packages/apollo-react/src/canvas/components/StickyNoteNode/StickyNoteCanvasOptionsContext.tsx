import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type { StickyNoteCanvasOptions } from './StickyNoteNode.types';

type ResolvedStickyNoteCanvasOptions = Required<StickyNoteCanvasOptions>;

const DEFAULT_OPTIONS: ResolvedStickyNoteCanvasOptions = {
  readOnly: false,
  enableMediaEmbedding: false,
};

const StickyNoteCanvasOptionsContext =
  createContext<ResolvedStickyNoteCanvasOptions>(DEFAULT_OPTIONS);

type StickyNoteCanvasOptionsProviderProps = Readonly<{
  options?: StickyNoteCanvasOptions;
  children: ReactNode;
}>;

export function StickyNoteCanvasOptionsProvider({
  options,
  children,
}: StickyNoteCanvasOptionsProviderProps) {
  const value = useMemo<ResolvedStickyNoteCanvasOptions>(
    () => ({
      readOnly: options?.readOnly ?? DEFAULT_OPTIONS.readOnly,
      enableMediaEmbedding: options?.enableMediaEmbedding ?? DEFAULT_OPTIONS.enableMediaEmbedding,
    }),
    [options?.enableMediaEmbedding, options?.readOnly]
  );

  return (
    <StickyNoteCanvasOptionsContext.Provider value={value}>
      {children}
    </StickyNoteCanvasOptionsContext.Provider>
  );
}

export function useStickyNoteCanvasOptions(): ResolvedStickyNoteCanvasOptions {
  return useContext(StickyNoteCanvasOptionsContext);
}
