import { motion } from "framer-motion";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import type { CompanyLogo } from "./shell";
import { Company } from "./shell-company";
import { MinimalCompany } from "./shell-minimal-company";
import { MinimalNavItem } from "./shell-minimal-nav-item";
import { useShellNavigation } from "./shell-navigation-context";
import { NavItem } from "./shell-nav-item";
import { UserProfile } from "./shell-user-profile";

interface SidebarProps {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  sidebarActions?: ReactNode;
  headerActions?: ReactNode;
}

export const Sidebar = ({
  companyName,
  productName,
  variant,
  companyLogo,
  sidebarActions,
  headerActions,
}: SidebarProps) => {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const nav = useShellNavigation();

  const sidebarWidth = isCollapsed ? "w-16" : "w-[280px]";

  const handleNavigate = (page: string) => (e: React.MouseEvent) => {
    if (nav) {
      e.preventDefault();
      nav.onNavigate(page);
    }
  };

  if (variant === "minimal") {
    return (
      <header className="relative flex items-center justify-between px-8 py-6">
        <MinimalCompany
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        />

        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-muted dark:bg-[oklch(0.24_0.033_254)] rounded-full p-1.5 overflow-x-auto scrollbar-thin">
          <MinimalNavItem
            to="/templates/shell-template"
            label="dashboard"
            active={nav ? nav.activePage === "dashboard" : undefined}
            onClick={handleNavigate("dashboard")}
          />
          <MinimalNavItem
            to="/projects"
            label="projects"
            active={nav ? nav.activePage === "projects" : undefined}
            onClick={handleNavigate("projects")}
          />
          <MinimalNavItem
            to="/analytics"
            label="analytics"
            active={nav ? nav.activePage === "analytics" : undefined}
            onClick={handleNavigate("analytics")}
          />
        </nav>

        <div className="flex items-center gap-2">
          {headerActions}
          <UserProfile isCollapsed />
        </div>
      </header>
    );
  }

  return (
    <motion.aside
      className={cn(
        sidebarWidth,
        "relative flex flex-col bg-[oklch(0.99_0_0)]/70 backdrop-blur-xl dark:bg-sidebar/75 dark:backdrop-blur-xl will-change-[width] overflow-hidden px-4 pt-6 pb-4",
      )}
      animate={{
        width: isCollapsed ? 64 : 280,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
    >
      <Company
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
      />
      <nav className="flex-1 mt-10 space-y-1 pb-3">
        <NavItem
          to="/preview/shell"
          icon={Home}
          text="Dashboard"
          active={nav ? nav.activePage === "dashboard" : undefined}
          onClick={handleNavigate("dashboard")}
        />
        <NavItem
          to="/preview/shell/projects"
          icon={FolderOpen}
          text="Projects"
          active={nav ? nav.activePage === "projects" : undefined}
          onClick={handleNavigate("projects")}
        />
        <NavItem
          to="/preview/shell/analytics"
          icon={BarChart3}
          text="Analytics"
          active={nav ? nav.activePage === "analytics" : undefined}
          onClick={handleNavigate("analytics")}
        />
        <NavItem to="/" icon={Users} text="Team" />
        <NavItem to="/" icon={Settings} text="Settings" />
        {sidebarActions}
      </nav>
      <div className={cn("mt-auto", isCollapsed && "flex flex-col items-center")}>
        <UserProfile isCollapsed={isCollapsed} />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
    </motion.aside>
  );
};
