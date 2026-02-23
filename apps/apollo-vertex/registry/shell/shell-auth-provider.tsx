import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
} from "react";
import { z } from "zod";
import { ensureValidToken, login, logout, TOKEN_QUERY_KEY } from "@/lib/auth";

export interface AuthContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

export interface UserInfo {
  name: string;
  email: string;
  sub: string;
}

const JwtPayloadSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  sub: z.string(),
});

const decodeJWT = (token: string): UserInfo | null => {
  const { data: payload, success } = JwtPayloadSchema.safeParse(
    jwtDecode(token),
  );

  if (!success) {
    return null;
  }

  const firstName = payload.first_name;
  const lastName = payload.last_name;
  const displayName = `${firstName} ${lastName}`;

  return {
    name: displayName,
    email: payload.email,
    sub: payload.sub,
  };
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context == null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface UseAccessTokenProps {
  tokenEndpoint: string;
  redirectUri: string;
  clientId: string;
}

export const useAccessToken = ({
  tokenEndpoint,
  redirectUri,
  clientId,
}: UseAccessTokenProps) => {
  const queryClient = useQueryClient();

  const { data: token } = useSuspenseQuery({
    queryKey: TOKEN_QUERY_KEY,
    queryFn: async () =>
      await ensureValidToken(queryClient, tokenEndpoint, redirectUri, clientId),
    refetchInterval: 60 * 1000,
  });

  return token;
};

interface ShellAuthProviderProps {
  tokenEndpoint: string;
  redirectUri: string;
  clientId: string;
  scope: string;
  authorizationEndpoint: string;
}

export const ShellAuthProvider: FC<
  PropsWithChildren<ShellAuthProviderProps>
> = ({
  children,
  tokenEndpoint,
  redirectUri,
  clientId,
  scope,
  authorizationEndpoint,
}) => {
  const queryClient = useQueryClient();
  const accessToken = useAccessToken({ tokenEndpoint, redirectUri, clientId });
  const user = accessToken ? decodeJWT(accessToken) : null;
  const isAuthenticated = accessToken != null;

  const contextValue = {
    user,
    isAuthenticated,
    isLoading: false,
    login: () => login(clientId, redirectUri, scope, authorizationEndpoint),
    logout: () => logout(queryClient),
    accessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
