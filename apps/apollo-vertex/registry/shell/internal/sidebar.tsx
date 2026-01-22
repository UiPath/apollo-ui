import { motion } from "framer-motion";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/registry/theme-provider/theme-toggle";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { Company } from "./company";
import { NavItem } from "./nav-item";
import { UserProfile } from "./user-profile";

interface SidebarProps {
  companyName: string;
  productName: string;
  companyLogo: React.ReactElement;
}

export const Sidebar = ({
  companyName,
  productName,
  companyLogo,
}: SidebarProps) => {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);

  const sidebarWidth = isCollapsed ? "w-[48px]" : "w-[264px]";

  return (
    <motion.aside
      className={cn(
        sidebarWidth,
        "rounded-[10px] flex flex-col bg-sidebar will-change-[width] px-2 overflow-hidden",
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
          <div className="flex items-center gap-3 pb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <UserProfile />
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pb-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        )}
      </div>
    </motion.aside>
  );
};
