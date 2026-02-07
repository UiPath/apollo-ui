import type React from 'react';
import { createContext, useContext, useMemo } from 'react';

interface CanvasThemeContextValue {
  isDarkMode?: boolean;
}

const CanvasThemeContext = createContext<CanvasThemeContextValue | null>(null);

const defaultValue: CanvasThemeContextValue = { isDarkMode: false };

export const CanvasThemeProvider: React.FC<React.PropsWithChildren<{ isDarkMode?: boolean }>> = ({
  children,
  isDarkMode,
}) => {
  const value = useMemo(() => ({ isDarkMode }), [isDarkMode]);
  return <CanvasThemeContext.Provider value={value}>{children}</CanvasThemeContext.Provider>;
};

/**
 * Hook to access canvas theme context.
 * Falls back to light mode if used outside a CanvasThemeProvider.
 */
export function useCanvasTheme(): CanvasThemeContextValue {
  return useContext(CanvasThemeContext) ?? defaultValue;
}
