/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';

interface AutopilotErrorContextType {
    error: string | undefined;
    setError: (error: string | undefined) => void;
    clearError: () => void;
}

export const AutopilotErrorContext = React.createContext<AutopilotErrorContextType>({
    error: undefined,
    setError: () => {},
    clearError: () => {},
});

export function AutopilotErrorProvider({ children }: { children: React.ReactNode }) {
    const [ error, setErrorState ] = React.useState<string | undefined>(undefined);

    const setError = React.useCallback((newError: string | undefined) => {
        setErrorState(newError);
    }, []);

    const clearError = React.useCallback(() => {
        setErrorState(undefined);
    }, []);

    return (
        <AutopilotErrorContext.Provider value={{
            error,
            setError,
            clearError,
        }}>
            {children}
        </AutopilotErrorContext.Provider>
    );
}

export function useError() {
    return React.useContext(AutopilotErrorContext);
}
