import type { LucideIcon } from "lucide-react";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { useContext } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthContext, useAuth } from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import type { TranslationKey } from "./shell-translation-key";
import { ShellUserProvider, type User } from "./shell-user-provider";

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

/** Caller-supplied identity for the sidebar chip (overrides the auth user). */
export interface ShellUser {
  name: string;
  /** Subtitle line — email or a role label. */
  email: string;
}

export interface ApolloShellProps extends PropsWithChildren {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
  loginDescription?: string;
  /** Override the sidebar identity (e.g. a demo "seat"). */
  user?: ShellUser;
  /** Make the identity chip a button (e.g. switch seats) instead of a menu. */
  onUserClick?: () => void;
  /** Optional content rendered in the top-right of the content header bar. */
  headerSlot?: ReactNode;
  /** Extra items injected into the user menu, after Switch user, before Toggle theme. */
  userMenuAdditionalItems?: ReactNode;
}

function toUser(u: ShellUser): User {
  const parts = u.name.trim().split(" ");
  return {
    id: "shell-user-override",
    name: u.name,
    email: u.email,
    first_name: parts[0] ?? u.name,
    last_name: parts.slice(1).join(" "),
  };
}

const ApolloShellContent: FC<ApolloShellProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
  navItems,
  loginDescription,
  user,
  onUserClick,
  headerSlot,
  userMenuAdditionalItems,
}) => {
  const authContext = useContext(AuthContext);
  const { accessToken } = useAuth();

  if (authContext && !accessToken) {
    return <ShellLogin title={productName} description={loginDescription} />;
  }

  return (
    <ShellUserProvider userOverride={user ? toUser(user) : null}>
      <ShellLayout
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
        navItems={navItems}
        onUserClick={onUserClick}
        headerSlot={headerSlot}
        userMenuAdditionalItems={userMenuAdditionalItems}
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
  user,
  onUserClick,
  headerSlot,
  userMenuAdditionalItems,
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
        user={user}
        onUserClick={onUserClick}
        headerSlot={headerSlot}
        userMenuAdditionalItems={userMenuAdditionalItems}
      >
        {children}
      </ApolloShellContent>
    </LocaleProvider>
  );
};
