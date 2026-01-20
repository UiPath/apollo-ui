"use client";

import { motion } from "framer-motion";
import { Home, Users, Settings, FolderOpen, BarChart3, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/registry/theme-provider/theme-toggle";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { Company } from "./company";
import { NavItem } from "./nav-item";
import { UserProfile } from "./user-profile";

interface SidebarProps {
    companyName: string;
    productName: string;
}

export const Sidebar = ({ companyName, productName }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };
    const sidebarWidth = isCollapsed ? "w-[48px]" : "w-[264px]";

    return (
        <motion.aside
            className={cn(
                sidebarWidth,
                "rounded-[10px] flex flex-col bg-sidebar will-change-[width]",
                isCollapsed ? "px-2" : "px-3",
            )}
            animate={{
                width: isCollapsed ? 48 : 264
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
            }}
        >
            <Company
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
                companyName={companyName}
                productName={productName}
            />
            <nav className="flex-1 mt-6 space-y-1 pb-3">
                <NavItem to="/templates/shell-template" icon={Home} text="Dashboard" isCollapsed={isCollapsed} />
                <NavItem to="/" icon={FolderOpen} text="Projects" isCollapsed={isCollapsed} />
                <NavItem to="/" icon={BarChart3} text="Analytics" isCollapsed={isCollapsed} />
                <NavItem to="/" icon={Users} text="Team" isCollapsed={isCollapsed} />
                <NavItem to="/" icon={Settings} text="Settings" isCollapsed={isCollapsed} />
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
                            <ThemeToggle isCollapsed={isCollapsed} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 pb-2">
                        <ThemeToggle isCollapsed={isCollapsed} />
                        <UserProfile
                            isCollapsed={isCollapsed}
                            toggleCollapse={toggleCollapse}
                        />
                    </div>
                )}
            </div>
        </motion.aside>
    );
};
