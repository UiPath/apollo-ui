import type { LucideIcon } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import { ShellAuthProvider, useAuth } from "./shell-auth-provider";
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
}

interface ApolloShellProps extends ApolloShellComponentProps {
  clientId: string;
  scope: string;
  baseUrl: string;
  variant?: "minimal";
}

const ApolloShellComponent: FC<ApolloShellComponentProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
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
        navItems={navItems}
      >
        {children}
      </ShellLayout>
    </ShellUserProvider>
  );
};

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
}) => {
  return (
    <ShellAuthProvider clientId={clientId} scope={scope} baseUrl={baseUrl}>
      <LocaleProvider>
        <ApolloShellComponent
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
          variant={variant}
          navItems={navItems}
        >
          {children}
        </ApolloShellComponent>
      </LocaleProvider>
    </ShellAuthProvider>
  );
};
