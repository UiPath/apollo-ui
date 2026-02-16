import { createContext } from "react";

export interface UserInfo {
  name: string;
  email: string;
  sub: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  accessToken: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
