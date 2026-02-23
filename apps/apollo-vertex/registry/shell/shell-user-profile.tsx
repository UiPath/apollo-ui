"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./shell-auth-provider";
import { useUser } from "./shell-user-provider";

interface UserProfileProps {
  isCollapsed: boolean;
}

export const UserProfile = ({ isCollapsed }: UserProfileProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { logout } = useAuth();

  const userInitials = user
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const firstName = user?.first_name as string;
  const lastName = user?.last_name as string;

  const handleSignOut = () => {
    logout();
  };

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
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.5,
              }}
            >
              <Avatar className="w-7 h-7 rounded-full shrink-0">
                <AvatarFallback className="w-7 h-7 bg-primary/40 rounded-full text-sidebar-foreground text-xs">
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
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span>{t("sign_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <motion.div
          key="expanded"
          className="flex items-center gap-3 flex-1 min-w-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.5,
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                type="button"
                className="rounded-full hover:ring-2 hover:ring-sidebar-primary/20 transition-all cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
              >
                <Avatar className="w-9 h-9 rounded-full shrink-0">
                  <AvatarFallback className="w-9 h-9 bg-primary/40 rounded-full text-sidebar-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 ml-2"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span>{t("sign_out")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.div
            className="flex flex-col min-w-0 flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <span className="text-sm text-sidebar-foreground font-medium truncate">
              {firstName} {lastName}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              {user?.email ?? "user@company.com"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
