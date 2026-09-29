"use client";

import {
  createContext,
  type ReactNode,
  type Ref,
  type RefCallback,
  useContext,
  useState,
} from "react";
import type { SurfaceOrientation } from "./composition";

/** What a surface tells its occupant about the space it gives. */
export interface SurfaceContextValue {
  orientation: SurfaceOrientation;
  /**
   * The live inner width in px: the surface's content box, after its
   * padding. null until the surface has been measured.
   */
  width: number | null;
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null);

/**
 * The shape of the space the surrounding surface gives. Occupants adapt to
 * this, never to the surface's name. For style-only adjustments, prefer
 * container queries: surfaces make their inner area an inline-size
 * container.
 */
export function useSurface(): SurfaceContextValue {
  const surface = useContext(SurfaceContext);
  if (!surface) {
    throw new Error("useSurface() must be called inside a surface.");
  }
  return surface;
}

/** Attaches a ref of either kind, returning how to detach it. */
function attach<T>(ref: Ref<T> | undefined, node: T): () => void {
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return () => (typeof cleanup === "function" ? cleanup() : ref(null));
  }
  if (ref) {
    ref.current = node;
    return () => {
      ref.current = null;
    };
  }
  // Nothing to detach.
  return () => null;
}

/**
 * For surfaces. Returns the context value to provide and a ref for the
 * surface's inner area, the element that holds the padding. Its content
 * box is the width reported to the occupant. Pass `forwarded` to attach
 * another ref to the same element.
 */
export function useSurfaceFrame<T extends HTMLElement>(
  orientation: SurfaceOrientation,
  forwarded?: Ref<T>,
): { ref: RefCallback<T>; value: SurfaceContextValue } {
  const [width, setWidth] = useState<number | null>(null);
  const ref: RefCallback<T> = (node) => {
    if (!node) return;
    const detach = attach(forwarded, node);
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentBoxSize[0];
      if (box) setWidth(Math.round(box.inlineSize));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      detach();
    };
  };
  return { ref, value: { orientation, width } };
}

interface SurfaceProviderProps {
  value: SurfaceContextValue;
  children?: ReactNode;
}

/** For surfaces. Gives the occupant inside it what useSurface() returns. */
export function SurfaceProvider({ value, children }: SurfaceProviderProps) {
  return <SurfaceContext value={value}>{children}</SurfaceContext>;
}
