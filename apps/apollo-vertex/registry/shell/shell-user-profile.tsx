import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { UserProfileMenuItems } from "./shell-user-profile-menu-items";
import { useUser } from "./shell-user-provider";

interface UserProfileProps {
  isCollapsed?: boolean;
  isMinimal?: boolean;
}

export const UserProfile = ({ isCollapsed, isMinimal }: UserProfileProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const userInitials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const userName = user?.name ?? t("business_user");
  const userEmail = user?.email ?? t("user_email_placeholder");

  const avatarElement = (
    <motion.div
      className="shrink-0"
      {...(isCollapsed ? { whileHover: iconHoverScale } : {})}
    >
      <Avatar className="w-8 h-8 rounded-full">
        <AvatarFallback className="w-8 h-8 bg-muted rounded-full text-sidebar-foreground">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );

  if (isMinimal) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center cursor-pointer rounded-full p-1"
                >
                  {avatarElement}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="font-medium">{userName}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent
          className="w-56"
          align="center"
          side="right"
          sideOffset={8}
        >
          <div className="flex flex-col gap-2 p-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs opacity-60">{userEmail}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <UserProfileMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        "relative flex items-center w-full cursor-pointer",
        "h-8",
        !isCollapsed && [
          "pr-3",
          "before:absolute before:-inset-1.5 before:rounded-lg before:transition-colors hover:before:bg-sidebar-accent before:-z-10",
        ],
      )}
    >
      <span className="w-8 h-8 flex items-center justify-center shrink-0">
        {avatarElement}
      </span>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="profile-text"
            className="flex flex-col min-w-0 flex-1 text-left pl-2"
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
            <span className="text-sm text-sidebar-foreground font-medium truncate">
              {userName}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              {userEmail}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );

  const dropdownContent = isCollapsed ? (
    <DropdownMenuContent
      className="w-56"
      align="center"
      side="right"
      sideOffset={8}
    >
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="font-medium">{userName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {userEmail}
          </span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <UserProfileMenuItems />
    </DropdownMenuContent>
  ) : (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width)"
      align="start"
      side="top"
      sideOffset={8}
    >
      <UserProfileMenuItems />
    </DropdownMenuContent>
  );

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip {...(!isCollapsed && { open: false })}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t("user_profile")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {dropdownContent}
    </DropdownMenu>
  );
};
