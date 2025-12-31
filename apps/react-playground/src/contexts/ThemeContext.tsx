import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '@uipath/apollo-react/material/theme';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  highContrast: boolean;
  toggleTheme: () => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    const savedHC = localStorage.getItem('highContrast');
    return savedHC === 'true';
  });

  useEffect(() => {
    const root = document.body;
    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'light-hc', 'dark-hc');

    // Add the appropriate theme class
    if (highContrast) {
      root.classList.add(`${theme}-hc`);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
    localStorage.setItem('highContrast', String(highContrast));
  }, [theme, highContrast]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const muiTheme = useMemo(() => {
    if (theme === 'dark') {
      return highContrast ? apolloMaterialUiThemeDarkHC : apolloMaterialUiThemeDark;
    }
    return highContrast ? apolloMaterialUiThemeLightHC : apolloMaterialUiThemeLight;
  }, [theme, highContrast]);

  return (
    <ThemeContext.Provider value={{ theme, highContrast, toggleTheme, toggleHighContrast }}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
