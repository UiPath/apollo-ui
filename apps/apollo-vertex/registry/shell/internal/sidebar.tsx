import { motion } from "framer-motion";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { CompanyLogo } from "../shell";
import { Company } from "./company";
import { LanguageToggle } from "./language-toggle";
import { MinimalCompany } from "./minimal-company";
import { MinimalNavItem } from "./minimal-nav-item";
import { NavItem } from "./nav-item";
import { ThemeToggle } from "./theme-toggle";
import { UserProfile } from "./user-profile";

interface SidebarProps {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
}

export const Sidebar = ({
  companyName,
  productName,
  variant,
  companyLogo,
}: SidebarProps) => {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);

  const sidebarWidth = isCollapsed ? "w-[48px]" : "w-[264px]";

  if (variant === "minimal") {
    return (
      <header className="h-[52px] bg-sidebar rounded-[10px] flex items-center justify-between px-4">
        <MinimalCompany
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        />

        <nav className="flex items-center bg-muted rounded-full p-1.5 max-w-[50%] overflow-x-auto scrollbar-thin mx-4">
          <MinimalNavItem
            to="/templates/shell-template"
            label="dashboard"
            active
          />
          <MinimalNavItem to="/projects" label="projects" />
          <MinimalNavItem to="/analytics" label="analytics" />
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <UserProfile isCollapsed />
        </div>
      </header>
    );
  }

  return (
    <motion.aside
      className={cn(
        sidebarWidth,
        "rounded-[10px] flex flex-col bg-sidebar will-change-[width] overflow-hidden p-2",
      )}
      animate={{
        width: isCollapsed ? 48 : 264,
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
      <nav className="flex-1 mt-6 space-y-1 pb-3">
        <NavItem to="/templates/shell-template" icon={Home} text="Dashboard" />
        <NavItem to="/" icon={FolderOpen} text="Projects" />
        <NavItem to="/" icon={BarChart3} text="Analytics" />
        <NavItem to="/" icon={Users} text="Team" />
        <NavItem to="/" icon={Settings} text="Settings" />
      </nav>
      <div className="mt-auto pt-3">
        {!isCollapsed ? (
          <div className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <UserProfile isCollapsed={isCollapsed} />
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-1">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pb-2">
            <LanguageToggle />
            <ThemeToggle />
            <UserProfile isCollapsed={isCollapsed} />
          </div>
        )}
      </div>
    </motion.aside>
  );
};
