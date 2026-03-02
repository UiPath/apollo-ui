import { motion } from "framer-motion";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import type { CompanyLogo } from "./shell";
import { Company } from "./shell-company";
import { MinimalCompany } from "./shell-minimal-company";
import { MinimalNavItem } from "./shell-minimal-nav-item";
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

  const sidebarWidth = isCollapsed ? "w-16" : "w-[280px]";

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
            active
          />
          <MinimalNavItem to="/projects" label="projects" />
          <MinimalNavItem to="/analytics" label="analytics" />
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
        <NavItem to="/preview/shell" icon={Home} text="Dashboard" />
        <NavItem to="/" icon={FolderOpen} text="Projects" />
        <NavItem to="/" icon={BarChart3} text="Analytics" />
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
