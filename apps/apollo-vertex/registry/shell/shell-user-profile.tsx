"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sidebarSpring } from "./shell-animations";
import { UserProfileMenuItems } from "./shell-user-profile-menu-items";
import { useUser } from "./shell-user-provider";

interface UserProfileProps {
  isCollapsed: boolean;
}

export const UserProfile = ({ isCollapsed }: UserProfileProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const userInitials = user
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const firstName = user?.first_name ?? t("business_user");
  const lastName = user?.last_name ?? "";

  return (
    <AnimatePresence mode="wait">
      {isCollapsed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              className="flex items-center justify-center cursor-pointer rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              transition={sidebarSpring}
            >
              <Avatar className="w-9 h-9 rounded-full shrink-0">
                <AvatarFallback className="w-9 h-9 bg-muted rounded-full text-sidebar-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="center"
            side="right"
            sideOffset={8}
          >
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.name ?? t("business_user")}
                </span>
                <span className="text-xs opacity-60">
                  {user?.email ?? t("user_email_placeholder")}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <UserProfileMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              key="expanded"
              className="flex items-center gap-3 w-full min-w-0 cursor-pointer rounded-lg px-1 hover:bg-sidebar-accent transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileTap={{ scale: 0.98 }}
              transition={sidebarSpring}
            >
              <Avatar className="w-9 h-9 rounded-full shrink-0">
                <AvatarFallback className="w-9 h-9 bg-muted rounded-full text-sidebar-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-sm text-sidebar-foreground font-medium truncate">
                  {firstName} {lastName}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email ?? t("user_email_placeholder")}
                </span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
            side="top"
            sideOffset={8}
          >
            <UserProfileMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </AnimatePresence>
  );
};
