import { Avatar, AvatarFallback, AvatarImage } from "@/registry/avatar/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/tooltip/tooltip";
import { useAuth } from "@uipath/auth-react";

interface UserProfileProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export const UserProfile = ({ isCollapsed, toggleCollapse }: UserProfileProps) => {
    const { user } = useAuth();

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

    return <div className="flex items-center gap-2 h-9 pb-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 rounded-full bg-sidebar-accent shrink-0">
              {user?.profile?.picture && (
                <AvatarImage
                  src={user.profile.picture}
                  alt={user.profile.name ?? 'User'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <AvatarFallback className="w-8 h-8 bg-custom-destructive-focus/40 rounded-full text-sidebar-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-white truncate">
                {firstName} {lastName}
              </span>
              <span className="text-xs text-white/70 truncate">
                {user?.profile?.email ?? 'user@company.com'}
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapse}
                className="flex items-center justify-center cursor-pointer w-8 h-8"
              >
                <Avatar className="w-8 h-8 rounded-full bg-sidebar-accent shrink-0">
                  {user?.profile?.picture && (
                    <AvatarImage
                      src={user.profile.picture}
                      alt={user.profile.name ?? 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <AvatarFallback className="w-8 h-8 bg-custom-destructive-focus/40 rounded-full text-sidebar-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="font-medium">{user?.profile?.name ?? 'Business user'}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>;
};