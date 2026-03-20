import type { LucideIcon } from "lucide-react";
import type { FC, PropsWithChildren, ReactNode } from "react";
import {
  AuthContext,
  type AuthContextValue,
  ShellAuthProvider,
  useAuth,
} from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import type { TranslationKey } from "./shell-translation-key";
import { ShellUserProvider } from "./shell-user-provider";

export interface CompanyLogo {
  url: string;
  darkUrl?: string;
  alt: string;
}

export interface ShellNavItem {
  path: string;
  label: TranslationKey;
  icon: LucideIcon;
}

export interface ApolloShellComponentProps extends PropsWithChildren {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
  loginDescription?: string;
  sidebarActions?: ReactNode;
  headerActions?: ReactNode;
  backgroundMode?: string;
}

const ApolloShellComponent: FC<ApolloShellComponentProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
  loginDescription,
  sidebarActions,
  headerActions,
  backgroundMode,
}) => {
  const { accessToken } = useAuth();
  if (!accessToken) {
    return <ShellLogin title={productName} description={loginDescription} />;
  }

  return (
    <ShellUserProvider>
      <ShellLayout
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
        navItems={navItems}
        sidebarActions={sidebarActions}
        headerActions={headerActions}
        backgroundMode={backgroundMode}
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
  <AuthContext.Provider value={MOCK_AUTH_CONTEXT}>
    {children}
  </AuthContext.Provider>
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
  navItems,
  loginDescription,
  bypassAuth,
  sidebarActions,
  headerActions,
  backgroundMode,
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
          navItems={navItems}
          loginDescription={loginDescription}
          sidebarActions={sidebarActions}
          headerActions={headerActions}
          backgroundMode={backgroundMode}
        >
          {children}
        </ApolloShellComponent>
      </LocaleProvider>
    </AuthWrapper>
  );
};
