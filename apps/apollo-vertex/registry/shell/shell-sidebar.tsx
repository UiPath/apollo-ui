"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CompanyLogo, ShellNavItem } from "./shell";
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
  navItems: ShellNavItem[];
}

export const Sidebar = ({
  companyName,
  productName,
  variant,
  companyLogo,
  navItems,
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
          {navItems.map((item) => (
            <MinimalNavItem key={item.path} to={item.path} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
      <div
        className={cn("mt-auto", isCollapsed && "flex flex-col items-center")}
      >
        <UserProfile isCollapsed={isCollapsed} />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow:
            "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
    </motion.aside>
  );
};
