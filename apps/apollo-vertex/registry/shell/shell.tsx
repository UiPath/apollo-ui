import type { FC, PropsWithChildren } from "react";
import {
  AuthContext,
  type AuthContextValue,
  ShellAuthProvider,
  useAuth,
} from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import { ShellUserProvider } from "./shell-user-provider";

export interface CompanyLogo {
  url: string;
  alt: string;
}

export interface ApolloShellComponentProps extends PropsWithChildren {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
}

const ApolloShellComponent: FC<ApolloShellComponentProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
}) => {
  const { accessToken } = useAuth();
  if (!accessToken) {
    return <ShellLogin />;
  }

  return (
    <ShellUserProvider>
      <ShellLayout
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
      >
        {children}
      </ShellLayout>
    </ShellUserProvider>
  );
};

const MOCK_AUTH_CONTEXT: AuthContextValue = {
  user: { name: "Dev User", email: "dev@localhost", sub: "dev-user-001" },
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  accessToken: "bypass-token",
};

const MockAuthProvider: FC<PropsWithChildren> = ({ children }) => (
  <AuthContext.Provider value={MOCK_AUTH_CONTEXT}>{children}</AuthContext.Provider>
);

type ApolloShellProps = ApolloShellComponentProps &
  (
    | { bypassAuth: true; clientId?: string; scope?: string; baseUrl?: string }
    | { bypassAuth?: false; clientId: string; scope: string; baseUrl: string }
  );

export const ApolloShell: FC<ApolloShellProps> = ({
  clientId,
  scope,
  baseUrl,
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  bypassAuth,
}) => {
  const AuthWrapper = bypassAuth
    ? MockAuthProvider
    : ({ children }: PropsWithChildren) => (
        <ShellAuthProvider
          clientId={clientId!}
          scope={scope!}
          baseUrl={baseUrl!}
        >
          {children}
        </ShellAuthProvider>
      );

  return (
    <AuthWrapper>
      <LocaleProvider>
        <ApolloShellComponent
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
          variant={variant}
        >
          {children}
        </ApolloShellComponent>
      </LocaleProvider>
    </AuthWrapper>
  );
};
