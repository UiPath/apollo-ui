"use client";

import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type AuthConfiguration,
  resolveAuthConfig,
} from "./auth-config";
import { AuthContext, type UserInfo } from "./auth-context";
import {
  clearTokenData,
  decodeJWT,
  ensureValidToken,
  getStoredTokenData,
  handleOAuthCallback,
  login as authLogin,
  logout as authLogout,
} from "./auth-utils";

export interface AuthProviderProps extends PropsWithChildren {
  configuration: AuthConfiguration;
  onSigninCallback?: (user: UserInfo | null) => void;
}

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  configuration,
  onSigninCallback,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolvedConfig = useMemo(
    () => resolveAuthConfig(configuration),
    [configuration]
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in an OAuth callback
        const params = new URLSearchParams(window.location.search);
        const isInOAuthCallback = params.has("code") && params.has("state");

        if (isInOAuthCallback) {
          await handleOAuthCallback(resolvedConfig);
        }

        // Get valid token
        const token = await ensureValidToken(resolvedConfig);
        setAccessToken(token);

        if (token) {
          const decoded = decodeJWT(token);
          setUser(decoded);
          onSigninCallback?.(decoded);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        clearTokenData();
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [resolvedConfig, onSigninCallback]);

  // Set up token refresh interval
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(async () => {
      const token = await ensureValidToken(resolvedConfig);
      if (token !== accessToken) {
        setAccessToken(token);
        if (token) {
          setUser(decodeJWT(token));
        } else {
          setUser(null);
        }
      }
    }, 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [accessToken, resolvedConfig]);

  const login = useCallback(async () => {
    await authLogin(configuration);
  }, [configuration]);

  const logout = useCallback(() => {
    authLogout(configuration);
    setAccessToken(null);
    setUser(null);
  }, [configuration]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: accessToken != null,
      isLoading,
      login,
      logout,
      accessToken,
    }),
    [user, accessToken, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
