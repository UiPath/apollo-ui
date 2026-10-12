import type { LucideIcon } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import { useContext } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthContext, useAuth } from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import type { TranslationKey } from "./shell-translation-key";
import { ShellUserProvider } from "./shell-user-provider";

export interface CompanyLogo {
  url: string;
  darkUrl?: string;
  alt: string;
  isCustom?: boolean;
}

export interface ShellSubNavItem {
  path: string;
  label: TranslationKey;
}

export interface ShellNavItem {
  path: string;
  label: TranslationKey;
  icon: LucideIcon;
  subItems?: ShellSubNavItem[];
}

export interface ApolloShellProps extends PropsWithChildren {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
  loginDescription?: string;
}

const ApolloShellContent: FC<ApolloShellProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
  loginDescription,
}) => {
  const authContext = useContext(AuthContext);
  const { accessToken } = useAuth();

  if (authContext && !accessToken) {
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
      >
        {children}
      </ShellLayout>
    </ShellUserProvider>
  );
};

export const ApolloShell: FC<ApolloShellProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
  loginDescription,
}) => {
  return (
    <LocaleProvider
      loadingElement={
        <div className="flex h-screen gap-4 p-4 bg-background dark:bg-sidebar">
          <Skeleton className="h-full w-[280px]" />
          <Skeleton className="h-full flex-1 rounded-lg" />
        </div>
      }
    >
      <ApolloShellContent
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
        navItems={navItems}
        loginDescription={loginDescription}
      >
        {children}
      </ApolloShellContent>
    </LocaleProvider>
  );
};
