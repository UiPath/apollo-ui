import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { ShellNavItem } from "@/registry/shell/shell";
import { ApolloShell } from "@/registry/shell/shell";

const navItems: ShellNavItem[] = [
  { path: "/preview/shell/dashboard", label: "dashboard", icon: Home },
  { path: "/preview/shell/projects", label: "projects", icon: FolderOpen },
  { path: "/preview/shell/analytics", label: "analytics", icon: BarChart3 },
  { path: "/preview/shell/team", label: "team", icon: Users },
  { path: "/preview/shell/settings", label: "settings", icon: Settings },
];

const minimalNavItems: ShellNavItem[] = [
  { path: "/preview/shell-minimal", label: "dashboard", icon: Home },
  {
    path: "/preview/shell-minimal/projects",
    label: "projects",
    icon: FolderOpen,
  },
  {
    path: "/preview/shell-minimal/analytics",
    label: "analytics",
    icon: BarChart3,
  },
];

export function ShellWrapper({
  variant,
  children,
}: {
  variant?: "minimal";
  children: ReactNode;
}) {
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Apollo Vertex"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      variant={variant}
      clientId="e74e5981-cde0-4cd4-971c-6525cfba86b5"
      scope="openid profile email offline_access"
      baseUrl={typeof window === "undefined" ? "" : window.location.origin}
      navItems={variant === "minimal" ? minimalNavItems : navItems}
    >
      {children}
    </ApolloShell>
  );
}
