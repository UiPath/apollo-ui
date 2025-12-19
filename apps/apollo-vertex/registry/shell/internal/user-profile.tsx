import { useAuth } from "@uipath/auth-react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserProfileProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const UserProfile = ({
  isCollapsed,
  toggleCollapse,
}: UserProfileProps) => {
  const auth = useAuth();

  const user = auth?.user;

  const userInitials = user?.profile?.name
  ? user.profile.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  : user?.profile?.preferred_username?.[0]?.toUpperCase() ?? 'U';
  const firstName = user?.profile?.first_name as string;
  const lastName = user?.profile?.last_name as string;

  const handleSignOut = () => {
    auth?.signoutRedirect?.();
  };

  return (
    <>
      {!isCollapsed && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full hover:ring-2 hover:ring-sidebar-primary/20 transition-all cursor-pointer"
              >
                <Avatar className="w-9 h-9 rounded-full bg-sidebar-accent shrink-0">
                  <AvatarFallback className="w-9 h-9 bg-primary/40 rounded-full text-sidebar-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 ml-2"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm text-sidebar-foreground font-medium truncate">
              {firstName} {lastName}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              {user?.profile?.email ?? "user@company.com"}
            </span>
          </div>
        </div>
      )}

      {isCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex items-center justify-center cursor-pointer w-full h-10 hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <Avatar className="w-7 h-7 rounded-full bg-sidebar-accent shrink-0">
                <AvatarFallback className="w-7 h-7 bg-primary/40 rounded-full text-sidebar-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.profile?.name ?? "Business user"}
                </span>
                <span className="text-xs opacity-60">
                  {user?.profile?.email ?? "user@company.com"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors border-t pt-2"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign out</span>
              </button>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
};
