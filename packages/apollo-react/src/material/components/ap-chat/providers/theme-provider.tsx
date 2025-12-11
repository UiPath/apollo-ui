import React, { createContext, useContext, useMemo } from 'react';

export type ApChatTheme = 'light' | 'light-hc' | 'dark' | 'dark-hc';

interface ThemeContextValue {
    theme: ApChatTheme;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
    theme?: ApChatTheme;
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme = 'light', children }) => {
    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        isDark: theme.startsWith('dark'),
    }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
