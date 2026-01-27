interface UserActivity {
  name: string;
  avatar?: string;
  initials?: string;
  percentage: number;
  color: string;
  shadowColor: string;
}

interface UserActivityBarsProps {
  users: UserActivity[];
}

export function UserActivityBars({ users }: UserActivityBarsProps) {
  return (
    <div className="flex flex-col gap-5 mt-4">
      {users.map((user, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Avatar */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <div className="size-8 rounded-full bg-accent-foreground/20 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">
                {user.initials}
              </span>
            </div>
          )}

          {/* Bar Section */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{user.name}</span>
              <span className="text-xs font-medium text-foreground">{user.percentage}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-accent-foreground/10">
              <div
                className="h-1 rounded-full"
                style={{
                  width: `${user.percentage}%`,
                  backgroundColor: user.color,
                  boxShadow: `0 4px 8px ${user.shadowColor}`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
