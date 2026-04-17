import type { ReactNode } from "react";
import type { ShellNavItem } from "@/registry/shell/shell";
import { ApolloShell } from "@/registry/shell/shell";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";

const sidebarNavItems: ShellNavItem[] = [
  { path: "/preview/dashboard/home", label: "dashboard", icon: Home },
  { path: "/preview/dashboard/projects", label: "projects", icon: FolderOpen },
  { path: "/preview/dashboard/analytics", label: "analytics", icon: BarChart3 },
  { path: "/preview/dashboard/team", label: "team", icon: Users },
  { path: "/preview/dashboard/settings", label: "settings", icon: Settings },
];

const minimalNavItems: ShellNavItem[] = [
  { path: "/preview/dashboard-minimal", label: "dashboard", icon: Home },
  {
    path: "/preview/dashboard-minimal/projects",
    label: "projects",
    icon: FolderOpen,
  },
  {
    path: "/preview/dashboard-minimal/analytics",
    label: "analytics",
    icon: BarChart3,
  },
];

export function DashboardShellWrapper({
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
      navItems={variant === "minimal" ? minimalNavItems : sidebarNavItems}
    >
      {children}
    </ApolloShell>
  );
}
