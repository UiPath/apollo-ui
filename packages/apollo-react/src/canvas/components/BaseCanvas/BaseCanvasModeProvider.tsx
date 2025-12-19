import React, { createContext, useContext, useMemo } from "react";
import type { BaseCanvasProps } from "./BaseCanvas.types";

type BaseCanvasMode = BaseCanvasProps["mode"];
type BaseCanvasModeContextType = {
  mode: BaseCanvasMode;
};

const BaseCanvasModeContext = createContext<BaseCanvasModeContextType | undefined>(undefined);

export const BaseCanvasModeProvider: React.FC<React.PropsWithChildren<{ mode: BaseCanvasMode }>> = ({ children, mode }) => {
  const value = useMemo(() => ({ mode }), [mode]);
  return <BaseCanvasModeContext.Provider value={value}>{children}</BaseCanvasModeContext.Provider>;
};

export function useBaseCanvasMode() {
  const context = useContext(BaseCanvasModeContext);
  if (!context) {
    throw new Error("useBaseCanvasMode must be used within a BaseCanvasModeProvider");
  }
  return context;
}
