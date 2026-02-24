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
  clientId: string;
  baseUrl: string;
}

export const useAccessToken = ({ clientId, baseUrl }: UseAccessTokenProps) => {
  const queryClient = useQueryClient();

  const { data: token } = useSuspenseQuery({
    queryKey: TOKEN_QUERY_KEY,
    queryFn: async () => await ensureValidToken(queryClient, clientId, baseUrl),
    refetchInterval: 60 * 1000,
  });

  return token;
};

interface ShellAuthProviderProps {
  clientId: string;
  scope: string;
  baseUrl: string;
}

export const ShellAuthProvider: FC<
  PropsWithChildren<ShellAuthProviderProps>
> = ({ children, clientId, scope, baseUrl }) => {
  const queryClient = useQueryClient();
  const accessToken = useAccessToken({ clientId, baseUrl });
  const user = accessToken ? decodeJWT(accessToken) : null;
  const isAuthenticated = accessToken != null;

  const contextValue = {
    user,
    isAuthenticated,
    isLoading: false,
    login: () => login(clientId, scope, baseUrl),
    logout: () => logout(queryClient),
    accessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
