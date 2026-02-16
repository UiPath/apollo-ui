"use client";

import { useContext } from "react";
import { AuthContext } from "./auth-context";

export const useAuth = () => {
  const context = useContext(AuthContext);
  return (
    context ?? {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      logout: () => {},
      accessToken: null,
    }
  );
};
