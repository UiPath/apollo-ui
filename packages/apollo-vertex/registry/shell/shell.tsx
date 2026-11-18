"use client";

import type { LucideIcon } from "lucide-react";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { useContext } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportedLocale } from "@/lib/i18n";
import { AuthContext, useAuth } from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import type { ShellNavLabel } from "./shell-translation-key";
import { ShellUserProvider } from "./shell-user-provider";

function ShellLoadingSkeleton() {
  return (
    <div className="flex h-screen gap-4 p-4 bg-background dark:bg-sidebar">
      <Skeleton className="h-full w-[280px]" />
      <Skeleton className="h-full flex-1 rounded-lg" />
    </div>
  );
}

export interface CompanyLogo {
  url: string;
  darkUrl?: string;
  alt: string;
  isCustom?: boolean;
}

export interface ShellSubNavItem {
  path: string;
  to?: string;
  label: ShellNavLabel;
}

export interface ShellNavItem {
  path: string;
  to?: string;
  label: ShellNavLabel;
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
  unauthenticatedElement?: ReactNode;
  configureI18n?: () => Promise<void>;
  locales?: readonly SupportedLocale[];
}

const ApolloShellContent: FC<ApolloShellProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
  loginDescription,
  unauthenticatedElement,
}) => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, isLoading } = useAuth();

  if (authContext && isLoading) {
    return <ShellLoadingSkeleton />;
  }

  if (authContext && !isAuthenticated) {
    return (
      unauthenticatedElement ?? (
        <ShellLogin title={productName} description={loginDescription} />
      )
    );
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
  unauthenticatedElement,
  configureI18n,
  locales,
}) => {
  return (
    <LocaleProvider
      configureI18n={configureI18n}
      locales={locales}
      loadingElement={<ShellLoadingSkeleton />}
    >
      <ApolloShellContent
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
        navItems={navItems}
        loginDescription={loginDescription}
        unauthenticatedElement={unauthenticatedElement}
      >
        {children}
      </ApolloShellContent>
    </LocaleProvider>
  );
};
