"use client";

import type { FC, PropsWithChildren } from "react";
import { AuthLogin } from "./auth-login";
import { useAuth } from "./use-auth";
import { Spinner } from "@/components/ui/spinner";

export interface AuthGuardProps extends PropsWithChildren {
  /**
   * Custom loading component to show while checking auth status
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom login component to show when not authenticated
   */
  loginComponent?: React.ReactNode;
}

export const AuthGuard: FC<AuthGuardProps> = ({
  children,
  loadingComponent,
  loginComponent,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      loadingComponent ?? (
        <div className="flex h-screen items-center justify-center bg-background">
          <Spinner className="size-8" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return loginComponent ?? <AuthLogin />;
  }

  return <>{children}</>;
};
