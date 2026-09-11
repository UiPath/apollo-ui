"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface FlowFooterContent {
  left?: ReactNode;
  right: ReactNode;
}

/**
 * The bar itself — full-bleed chrome, contents pinned to the content
 * column's width. Just Back and the primary action; the AI-generated caveat
 * lives in each step's own content, beside what it discloses, rather than
 * in this bar (a wide primary label would otherwise run over a centered
 * caveat with no real space reserved for it).
 */
export function FlowFooterBar({
  left,
  right,
  bordered,
}: FlowFooterContent & { bordered: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 border-t bg-background transition-colors",
        !bordered && "border-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 py-4">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </div>
  );
}

type SetFooter = (content: FlowFooterContent | null) => void;

const FlowFooterSetterContext = createContext<SetFooter | null>(null);

interface FlowFooterProviderProps {
  /** True when the wrapped scrollable content overflows — shows the top border. */
  overflowing: boolean;
  children: ReactNode;
}

/**
 * Owns the fixed action bar for a step that renders deep inside another
 * component (Bridge, Shelf) — those steps register their Back/primary
 * content via `useFlowFooter` instead of rendering it inline, so the bar's
 * chrome lives in one place regardless of which step is active.
 */
export function FlowFooterProvider({
  overflowing,
  children,
}: FlowFooterProviderProps) {
  const [content, setContent] = useState<FlowFooterContent | null>(null);
  return (
    <FlowFooterSetterContext.Provider value={setContent}>
      {children}
      {content && <FlowFooterBar {...content} bordered={overflowing} />}
    </FlowFooterSetterContext.Provider>
  );
}

/** Registers this step's footer content with the nearest FlowFooterProvider. */
export function useFlowFooter(content: FlowFooterContent | null) {
  const setContent = useContext(FlowFooterSetterContext);
  useEffect(() => {
    setContent?.(content);
    return () => setContent?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);
}
