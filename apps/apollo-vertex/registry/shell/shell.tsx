import type { FC, PropsWithChildren } from "react";
import { type AuthConfiguration } from "./auth-config";
import type { UserInfo } from "./auth-context";
import { AuthGuard } from "./auth-guard";
import { AuthProvider } from "./auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";

export interface CompanyLogo {
  url: string;
  alt: string;
}

export interface ApolloShellProps extends PropsWithChildren {
  /**
   * Authentication configuration for the PKCE OAuth flow
   */
  configuration: AuthConfiguration;
  /**
   * Callback invoked after successful sign-in
   */
  onSigninCallback?: (user: UserInfo | null) => void;
  /**
   * The company name to display in the shell
   */
  companyName: string;
  /**
   * The product name to display in the shell
   */
  productName: string;
  /**
   * Optional company logo configuration
   */
  companyLogo?: CompanyLogo;
  /**
   * Custom loading component to show while checking auth status
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom login component to show when not authenticated
   */
  loginComponent?: React.ReactNode;
  /**
   * The variant of the shell
   */
  variant?: "minimal";
}

export const ApolloShell: FC<ApolloShellProps> = ({
  variant,
  children,
  configuration,
  onSigninCallback,
  companyName,
  productName,
  companyLogo,
  loadingComponent,
  loginComponent,
}) => {
  return (
    <AuthProvider
      configuration={configuration}
      onSigninCallback={onSigninCallback}
    >
      <AuthGuard
        loadingComponent={loadingComponent}
        loginComponent={loginComponent}
      >
        <LocaleProvider>
          <ShellLayout
            companyName={companyName}
            productName={productName}
            companyLogo={companyLogo}
            variant={variant}
          >
            {children}
          </ShellLayout>
        </LocaleProvider>
      </AuthGuard>
    </AuthProvider>
  );
};

export type { AuthConfiguration } from "./auth-config";
export type { AuthContextValue, UserInfo } from "./auth-context";
export { AuthGuard } from "./auth-guard";
export { AuthLogin } from "./auth-login";
export { AuthProvider } from "./auth-provider";
// Re-export auth utilities for consumers
export { useAuth } from "./use-auth";
