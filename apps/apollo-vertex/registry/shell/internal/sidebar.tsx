"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/registry/theme-provider/theme-toggle";
import { Company } from "./company";
import { UserProfile } from "./user-profile";

interface SidebarProps {
  companyName: string;
  productName: string;
}

export const Sidebar = ({ companyName, productName }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  const sidebarWidth = isCollapsed ? "w-[48px]" : "w-[264px]";

  return (
    <aside
      className={cn(
        sidebarWidth,
        "rounded-[10px] flex flex-col transition-all duration-300 bg-sidebar",
        isCollapsed ? "px-2" : "px-3",
      )}
    >
      <Company
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        companyName={companyName}
        productName={productName}
      />
      <nav className="flex-1 mt-6 space-y-1 pb-3">
      { /* Add navigation content here */ }
      </nav>
      <div className="mt-auto pt-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 pb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <UserProfile
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
              />
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pb-2">
            <ThemeToggle />
            <UserProfile
              isCollapsed={isCollapsed}
              toggleCollapse={toggleCollapse}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
