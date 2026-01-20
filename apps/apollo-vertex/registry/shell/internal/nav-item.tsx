"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sidebarSpring, textFadeVariants, iconHoverScale } from "./animations";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  text: string;
  isCollapsed: boolean;
}

export const NavItem = ({ to, icon: Icon, text, isCollapsed }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  const linkContent = (
    <Link
      href={to}
      className={cn(
        "flex items-center rounded-md transition-colors duration-200",
        "h-8 text-sm font-medium",
        isCollapsed ? "w-8 justify-center" : "pr-3",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <motion.span
        className="w-8 h-8 flex items-center justify-center shrink-0"
        whileHover={isCollapsed ? iconHoverScale : undefined}
      >
        <Icon className="w-4 h-4" />
      </motion.span>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            key="nav-text"
            className="truncate"
            initial={textFadeVariants.initial}
            animate={textFadeVariants.animate}
            exit={textFadeVariants.exit}
            transition={sidebarSpring}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {text}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};
