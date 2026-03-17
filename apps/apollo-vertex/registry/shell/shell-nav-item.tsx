import { Link, useLocation } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  fastFadeTransition,
  iconHoverScale,
  textFadeVariants,
} from "./shell-animations";
import { SIDEBAR_COLLAPSED_KEY } from "./shell-constants";
import { Text } from "./shell-text";
import type { TranslationKey } from "./shell-translation-key";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: TranslationKey;
}

export const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  const [isCollapsed] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  const linkContent = (
    <Link
      to={to}
      className={cn(
        "flex items-center rounded-md transition-colors duration-200",
        "h-8 text-sm font-medium",
        isCollapsed ? "w-8 justify-center" : "pr-3",
        isActive
          ? "text-primary-700 dark:text-primary-400 font-semibold bg-[oklch(0.96_0.015_218)] dark:bg-primary-900/30"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <motion.span
        className="w-8 h-8 flex items-center justify-center shrink-0"
        {...(isCollapsed ? { whileHover: iconHoverScale } : {})}
      >
        <Icon className="w-4 h-4" />
      </motion.span>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.span
            key="nav-text"
            className="truncate whitespace-nowrap pl-2"
            variants={{
              initial: textFadeVariants.initial,
              animate: textFadeVariants.animate,
              exit: textFadeVariants.exit,
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fastFadeTransition}
          >
            <Text value={label} />
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <Text value={label} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
};
